import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	getAllFests,
	getFestDetails,
	createFest,
	updateFestDetails,
	deleteFest,
	addFestPoster,
	removeFestPoster,
	updateFestHero,
	removeFestHero,
	addGalleryMedia,
	removeGalleryMedia,
	addPartner,
	updatePartner,
	removePartner,
	reorderPartners as svcReorderPartners,
	linkEventToFest,
	unlinkEventFromFest,
	exportFestsCSV,
	downloadFestAnalytics,
	downloadFestStatistics,
	downloadFestReport,
	updatePresentation,
	updateSocialLinks,
	updateThemeColors,
	setVisibility as svcSetVisibility,
	addTrack as svcAddTrack,
	removeTrack as svcRemoveTrack,
	reorderTracks as svcReorderTracks,
	addFAQ as svcAddFAQ,
	updateFAQ,
	removeFAQ as svcRemoveFAQ,
	reorderFAQs as svcReorderFAQs,
	bulkDeleteMedia as svcBulkDeleteMedia,
} from '../../services/arvantisServices.js';
import { Download, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import GlassCard from '../../components/arvantis/GlassCard';
import EmptyState from '../../components/arvantis/EmptyState';
import LoadingSpinner from '../../components/arvantis/LoadingSpinner';
import Badge from '../../components/arvantis/Badge';
import PartnerQuickAdd from '../../components/arvantis/PartnerQuickAdd';
import Toast from '../../components/arvantis/Toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FILE_TYPES_IMAGES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const safeFilename = (s = '') => String(s).replace(/[:]/g, '-').replace(/\s+/g, '-');

const EditArvantis = ({ setDashboardError = () => {} }) => {
	const [fests, setFests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState([]);
	const [selectedFestId, setSelectedFestId] = useState(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);
	const [actionBusy, setActionBusy] = useState(false);
	const [localError, setLocalError] = useState('');
	const [downloadingCSV, setDownloadingCSV] = useState(false);

	const [mediaSelection, setMediaSelection] = useState(new Set());
	const [bulkDeleting, setBulkDeleting] = useState(false);

	const [presentationDraft, setPresentationDraft] = useState({
		themeColors: {},
		socialLinks: {},
	});
	const [createForm, setCreateForm] = useState({
		year: new Date().getFullYear(),
		description: '',
		startDate: '',
		endDate: '',
		name: 'Arvantis',
		tagline: '',
	});
	const [editForm, setEditForm] = useState(null);

	const [heroFile, setHeroFile] = useState(null);
	const [heroCaption, setHeroCaption] = useState('');

	const [toast, setToast] = useState(null);

	const mountedRef = useRef(false);
	const setDashboardErrorRef = useRef(setDashboardError);
	useEffect(() => {
		setDashboardErrorRef.current = setDashboardError;
	}, [setDashboardError]);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const getErrMsg = (err, fallback = 'Request failed') =>
		err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

	// Fetch fests (admin list)
	const fetchFests = useCallback(async () => {
		setLoading(true);
		try {
			const pag = await getAllFests({ limit: 100 }, { admin: true });
			const docs = pag.docs || [];
			setFests(docs);
			// if a selected fest is gone, clear selection
			if (selectedFestId && !docs.some((d) => d._id === selectedFestId)) {
				setSelectedFestId(null);
				setEditForm(null);
			}
		} catch (err) {
			const msg = getErrMsg(err, 'Failed to load fests');
			setDashboardErrorRef.current(msg);
		} finally {
			if (mountedRef.current) setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFestId]);

	// Fetch events for linking
	const fetchEvents = useCallback(async (signal) => {
		try {
			// lightweight events fetch: reuse publicClient via arvantisServices isn't exposed;
			// fallback: use public endpoint pattern used elsewhere (list events endpoint not included in attachments).
			// To keep page functional, try to fetch via backend events endpoint if available:
			const resp = await fetch(
				`${
					import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
				}/api/v1/events?limit=200`,
				{
					signal,
					credentials: 'include',
				}
			);
			if (!resp.ok) {
				setEvents([]);
				return;
			}
			const body = await resp.json();
			const evs = body?.data?.docs || body?.data || body?.docs || [];
			setEvents(evs);
		} catch (err) {
			// ignore aborts
			if (err.name !== 'AbortError') {
				console.warn('fetchEvents failed', err);
			}
		}
	}, []);

	const normalizeFest = (data) => {
		if (!data) return null;
		return {
			...data,
			_id: data._id || data.id,
			posters: Array.isArray(data.posters) ? data.posters : data.poster ? [data.poster] : [],
			hero: data.hero || data.heroMedia || data.heroMedia || null,
			gallery: data.gallery || [],
			partners: data.partners || [],
			events: data.events || [],
			tracks: data.tracks || [],
			faqs: data.faqs || [],
			visibility: data.visibility || 'public',
			tagline: data.tagline || '',
		};
	};

	const loadFestDetails = useCallback(async (identifier) => {
		if (!identifier) return;
		setActionBusy(true);
		try {
			const data = await getFestDetails(identifier, { admin: true });
			const norm = normalizeFest(data);
			setEditForm(norm);
			setSelectedFestId(norm?._id || null);
			// seed presentationDraft from fest
			setPresentationDraft({
				themeColors: norm?.themeColors || {},
				socialLinks: norm?.socialLinks || {},
			});
			setHeroCaption(norm?.hero?.caption || '');
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to load fest details'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	}, []);

	useEffect(() => {
		const ac = new AbortController();
		void fetchFests();
		void fetchEvents(ac.signal);
		return () => ac.abort();
	}, [fetchFests, fetchEvents]);

	// Create
	const handleCreateSubmit = async (e) => {
		e?.preventDefault();
		setCreateLoading(true);
		setLocalError('');
		try {
			const created = await createFest(createForm);
			setToast({ type: 'success', message: 'Fest created' });
			await fetchFests();
			setCreateOpen(false);
			// auto-open created
			if (created?._id) await loadFestDetails(created._id);
		} catch (err) {
			setLocalError(getErrMsg(err, 'Create failed'));
		} finally {
			if (mountedRef.current) setCreateLoading(false);
		}
	};

	// Update core details
	const saveEdit = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			// send only allowed fields (backend prevents critical changes already)
			const payload = {
				description: editForm.description,
				location: editForm.location,
				contactEmail: editForm.contactEmail,
				startDate: editForm.startDate,
				endDate: editForm.endDate,
				status: editForm.status,
			};
			const updated = await updateFestDetails(editForm._id, payload);
			setEditForm(normalizeFest(updated));
			setToast({ type: 'success', message: 'Saved fest details' });
			await fetchFests();
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to save'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Delete fest
	const removeFest = async (fest) => {
		if (!fest || !fest._id) return;
		if (!window.confirm('Delete fest? This is irreversible.')) return;
		setActionBusy(true);
		try {
			await deleteFest(fest._id);
			setToast({ type: 'success', message: 'Fest deleted' });
			setEditForm(null);
			setSelectedFestId(null);
			await fetchFests();
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to delete fest'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Media - Posters
	const uploadPoster = async (files) => {
		if (!files || files.length === 0 || !editForm || !editForm._id) return;
		const arr = Array.isArray(files) ? files : [files];
		const fd = new FormData();
		for (const f of arr) {
			fd.append('posters', f, safeFilename(f.name || 'poster'));
		}
		if (![...fd.keys()].length) return;
		setActionBusy(true);
		try {
			const items = await addFestPoster(editForm._id, fd);
			// merge returned posters
			setEditForm((s) => ({ ...s, posters: [...(s.posters || []), ...(items || [])] }));
			setToast({ type: 'success', message: 'Poster(s) uploaded' });
			await fetchFests();
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to upload posters'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const removePoster = async (publicId) => {
		if (!publicId || !editForm || !editForm._id) return;
		if (!window.confirm('Remove poster?')) return;
		setActionBusy(true);
		try {
			await removeFestPoster(editForm._id, publicId);
			setEditForm((s) => ({
				...s,
				posters: (s.posters || []).filter((p) => p.publicId !== publicId),
			}));
			setMediaSelection((s) => {
				const c = new Set(s);
				c.delete(publicId);
				return c;
			});
			setToast({ type: 'success', message: 'Poster removed' });
			await fetchFests();
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to remove poster'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Hero
	const uploadHero = async (file, caption) => {
		if (!file || !editForm || !editForm._id) return;
		if (file.size > MAX_FILE_SIZE) {
			setDashboardErrorRef.current('File too large');
			return;
		}
		if (!FILE_TYPES_IMAGES.includes(file.type)) {
			setDashboardErrorRef.current('Unsupported file type');
			return;
		}
		const fd = new FormData();
		fd.append('hero', file, safeFilename(file.name || 'hero'));
		if (caption) fd.append('caption', caption);
		setActionBusy(true);
		try {
			const updated = await updateFestHero(editForm._id, fd);
			setEditForm((s) => ({ ...s, hero: updated }));
			setToast({ type: 'success', message: 'Hero uploaded' });
			await fetchFests();
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to upload hero'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const removeHero = async () => {
		if (!editForm || !editForm._id || !editForm.hero?.publicId) return;
		if (!window.confirm('Remove hero media for this fest?')) return;
		setActionBusy(true);
		try {
			await removeFestHero(editForm._id);
			setEditForm((s) => ({ ...s, hero: undefined }));
			setToast({ type: 'success', message: 'Hero removed' });
			await fetchFests();
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to remove hero'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Gallery
	const addGallery = async (files) => {
		if (!files || files.length === 0 || !editForm || !editForm._id) return;
		const fd = new FormData();
		for (const f of files) fd.append('media', f, safeFilename(f.name || 'media'));
		if (![...fd.keys()].length) return;
		setActionBusy(true);
		try {
			const items = await addGalleryMedia(editForm._id, fd);
			setEditForm((s) => ({ ...s, gallery: [...(s.gallery || []), ...(items || [])] }));
			setToast({ type: 'success', message: 'Gallery updated' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to add gallery media'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const removeGalleryItem = async (publicId) => {
		if (!publicId || !editForm || !editForm._id) return;
		if (!window.confirm('Remove gallery item?')) return;
		setActionBusy(true);
		try {
			await removeGalleryMedia(editForm._id, publicId);
			setEditForm((s) => ({
				...s,
				gallery: (s.gallery || []).filter((g) => g.publicId !== publicId),
			}));
			setToast({ type: 'success', message: 'Gallery item removed' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to remove gallery item'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Partners
	const addNewPartner = async (formData) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			const added = await addPartner(editForm._id, formData);
			setEditForm((s) => ({ ...s, partners: [...(s.partners || []), added] }));
			setToast({ type: 'success', message: 'Partner added' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to add partner'));
			throw err;
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const updateExistingPartner = async (partnerName, updates) => {
		if (!partnerName || !editForm || !editForm._id) return;
		const data = updates instanceof FormData ? updates : updates;
		setActionBusy(true);
		try {
			const updated = await updatePartner(editForm._id, partnerName, data);
			setEditForm((s) => ({
				...s,
				partners: (s.partners || []).map((p) => (p.name === partnerName ? updated : p)),
			}));
			setToast({ type: 'success', message: 'Partner updated' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to update partner'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const removeExistingPartner = async (partnerName) => {
		if (!partnerName || !editForm || !editForm._id) return;
		if (!window.confirm(`Remove partner "${partnerName}"?`)) return;
		setActionBusy(true);
		try {
			await removePartner(editForm._id, partnerName);
			setEditForm((s) => ({
				...s,
				partners: (s.partners || []).filter((p) => p.name !== partnerName),
			}));
			setToast({ type: 'success', message: 'Partner removed' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to remove partner'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const reorderPartners = async (direction, idx) => {
		if (!editForm || !editForm._id) return;
		const copy = (editForm.partners || []).slice();
		const i = idx;
		const j = i + (direction === 'up' ? -1 : 1);
		if (i < 0 || j < 0 || i >= copy.length || j >= copy.length) return;
		const tmp = copy[i];
		copy.splice(i, 1);
		copy.splice(j, 0, tmp);
		// call backend with order of names
		try {
			const order = copy.map((p) => p.name);
			await svcReorderPartners(editForm._id, order);
			setEditForm((s) => ({ ...s, partners: copy }));
			setToast({ type: 'success', message: 'Partners reordered' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to reorder partners'));
		}
	};

	// Events linking
	const handleLinkEvent = async (eventId) => {
		if (!eventId || !editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			const res = await linkEventToFest(editForm._id, eventId);
			// backend returns list of event ids; fetch full details again
			await loadFestDetails(editForm._id);
			setToast({ type: 'success', message: 'Event linked' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to link event'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const handleUnlinkEvent = async (eventId) => {
		if (!eventId || !editForm || !editForm._id) return;
		if (!window.confirm('Unlink event from fest?')) return;
		setActionBusy(true);
		try {
			await unlinkEventFromFest(editForm._id, eventId);
			setEditForm((s) => ({
				...s,
				events: (s.events || []).filter((e) => String(e._id || e) !== String(eventId)),
			}));
			setToast({ type: 'success', message: 'Event unlinked' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to unlink event'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Export CSV
	const exportCSV = async () => {
		setDownloadingCSV(true);
		try {
			const blob = await exportFestsCSV();
			// create download
			const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
			const a = document.createElement('a');
			a.href = url;
			a.download = `arvantis-fests-${new Date().toISOString()}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
			setToast({ type: 'success', message: 'CSV exported' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to export CSV'));
		} finally {
			if (mountedRef.current) setDownloadingCSV(false);
		}
	};

	// Presentation / social / theme
	const savePresentation = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await updatePresentation(editForm._id, {
				themeColors: presentationDraft.themeColors,
				socialLinks: presentationDraft.socialLinks,
			});
			await loadFestDetails(editForm._id);
			setToast({ type: 'success', message: 'Presentation saved' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to save presentation'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const saveSocialLinks = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await updateSocialLinks(editForm._id, presentationDraft.socialLinks || {});
			await loadFestDetails(editForm._id);
			setToast({ type: 'success', message: 'Social links saved' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to save social links'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const saveThemeColors = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await updateThemeColors(editForm._id, presentationDraft.themeColors || {});
			await loadFestDetails(editForm._id);
			setToast({ type: 'success', message: 'Theme colors saved' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to save theme colors'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const handleSetVisibility = async (visibility) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcSetVisibility(editForm._id, visibility);
			setEditForm((s) => ({ ...s, visibility }));
			setToast({ type: 'success', message: 'Visibility updated' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to set visibility'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Tracks & FAQs
	const addTrack = async (payload) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			const added = await svcAddTrack(editForm._id, payload);
			setEditForm((s) => ({ ...s, tracks: [...(s.tracks || []), added] }));
			setToast({ type: 'success', message: 'Track added' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to add track'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const removeExistingTrack = async (trackKey) => {
		if (!editForm || !editForm._id || !trackKey) return;
		if (!window.confirm('Remove track?')) return;
		setActionBusy(true);
		try {
			await svcRemoveTrack(editForm._id, trackKey);
			setEditForm((s) => ({
				...s,
				tracks: (s.tracks || []).filter((t) => t.key !== trackKey),
			}));
			setToast({ type: 'success', message: 'Track removed' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to remove track'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const reorderTracks = async (fromIdx, toIdx) => {
		if (!editForm || !editForm._id) return;
		const tracks = editForm.tracks || [];
		if (fromIdx < 0 || toIdx < 0 || fromIdx >= tracks.length || toIdx >= tracks.length) return;
		const reordered = tracks.slice();
		const [moved] = reordered.splice(fromIdx, 1);
		reordered.splice(toIdx, 0, moved);
		const order = reordered.map((t) => t?.key).filter(Boolean);
		if (order.length === 0) return;
		setActionBusy(true);
		try {
			await svcReorderTracks(editForm._id, order);
			setEditForm((s) => ({ ...s, tracks: reordered }));
			setToast({ type: 'success', message: 'Tracks reordered' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to reorder tracks'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// FAQs
	const addFaq = async (payload) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			const added = await svcAddFAQ(editForm._id, payload);
			setEditForm((s) => ({ ...s, faqs: [...(s.faqs || []), added] }));
			setToast({ type: 'success', message: 'FAQ added' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to add FAQ'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const removeExistingFaq = async (faqId) => {
		if (!editForm || !editForm._id || !faqId) return;
		if (!window.confirm('Remove FAQ?')) return;
		setActionBusy(true);
		try {
			await svcRemoveFAQ(editForm._id, faqId);
			setEditForm((s) => ({
				...s,
				faqs: (s.faqs || []).filter((f) => String(f._id || f.id) !== String(faqId)),
			}));
			setToast({ type: 'success', message: 'FAQ removed' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to remove FAQ'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const reorderFaqs = async (fromIdx, toIdx) => {
		if (!editForm || !editForm._id) return;
		const faqs = editForm.faqs || [];
		if (fromIdx < 0 || toIdx < 0 || fromIdx >= faqs.length || toIdx >= faqs.length) return;
		const copy = faqs.slice();
		const [moved] = copy.splice(fromIdx, 1);
		copy.splice(toIdx, 0, moved);
		const order = copy.map((f) => String(f._id || f.id));
		setActionBusy(true);
		try {
			await svcReorderFAQs(editForm._id, order);
			setEditForm((s) => ({ ...s, faqs: copy }));
			setToast({ type: 'success', message: 'FAQs reordered' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to reorder FAQs'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Media bulk delete
	const toggleMediaSelect = (publicId) => {
		if (!publicId) return;
		setMediaSelection((prev) => {
			const s = new Set(prev);
			if (s.has(publicId)) s.delete(publicId);
			else s.add(publicId);
			return s;
		});
	};

	const bulkDeleteSelectedMedia = async () => {
		if (!editForm || !editForm._id) return;
		const ids = Array.from(mediaSelection);
		if (ids.length === 0) return;
		if (!window.confirm(`Delete ${ids.length} media items? This cannot be undone.`)) return;
		setBulkDeleting(true);
		try {
			await svcBulkDeleteMedia(editForm._id, ids);
			// filter locally
			setEditForm((s) => ({
				...s,
				gallery: (s.gallery || []).filter((g) => !ids.includes(g.publicId)),
				posters: (s.posters || []).filter((p) => !ids.includes(p.publicId)),
				partners: (s.partners || []).map((p) => {
					if (p.logo?.publicId && ids.includes(p.logo.publicId)) {
						const plain = { ...p };
						plain.logo = undefined;
						return plain;
					}
					return p;
				}),
				hero: s.hero && ids.includes(s.hero.publicId) ? undefined : s.hero,
			}));
			setMediaSelection(new Set());
			setToast({ type: 'success', message: 'Media deleted' });
		} catch (err) {
			setDashboardErrorRef.current(getErrMsg(err, 'Failed to bulk delete media'));
		} finally {
			if (mountedRef.current) setBulkDeleting(false);
		}
	};

	const visibleFests = useMemo(() => fests || [], [fests]);

	if (loading) return <LoadingSpinner text="Loading fests..." />;

	return (
		<div className="p-4 grid grid-cols-12 gap-4">
			<div className="col-span-3 space-y-4">
				<GlassCard className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-semibold text-white">Fests</h3>
						<button onClick={() => void fetchFests()} className="text-sm text-gray-400">
							Refresh
						</button>
					</div>

					<div className="space-y-2 max-h-[60vh] overflow-auto">
						{visibleFests.length === 0 && (
							<EmptyState
								title="No fests"
								subtitle="Create one"
								action={
									<button
										onClick={() => setCreateOpen(true)}
										className="py-2 px-4 rounded bg-purple-600 text-white"
									>
										Create
									</button>
								}
							/>
						)}
						{visibleFests.map((f) => (
							<button
								key={f._id}
								onClick={() => void loadFestDetails(f._id)}
								className={`w-full text-left p-3 rounded ${
									selectedFestId === f._id ? 'bg-purple-800/40' : 'bg-white/3'
								} transition`}
								aria-pressed={selectedFestId === f._id}
							>
								<div className="flex items-center justify-between">
									<div>
										<div className="font-medium text-white">
											{f.name || `Arvantis ${f.year}`}
										</div>
										<div className="text-sm text-gray-400">{f.year}</div>
									</div>
									<Badge variant={f.status || 'default'} size="sm">
										{f.status}
									</Badge>
								</div>
							</button>
						))}
					</div>

					<div className="mt-4 flex gap-2">
						<button
							onClick={() => setCreateOpen(true)}
							className="flex-1 py-2 rounded bg-emerald-600 text-white"
						>
							New Fest
						</button>
						<button
							onClick={() => void exportCSV()}
							className="px-3 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
							disabled={downloadingCSV}
						>
							{downloadingCSV ? (
								'Exporting...'
							) : (
								<>
									<Download className="inline-block mr-1 h-4 w-4" /> CSV
								</>
							)}
						</button>
					</div>
				</GlassCard>

				<GlassCard className="p-4">
					<h4 className="font-semibold text-white mb-2">Utilities</h4>
					<div className="flex flex-col gap-2">
						<button
							onClick={async () => {
								try {
									await downloadFestAnalytics();
									setToast({ type: 'success', message: 'Analytics downloaded' });
								} catch (err) {
									setToast({
										type: 'error',
										message: getErrMsg(err, 'Failed to download analytics'),
									});
								}
							}}
							className="py-2 rounded bg-blue-600 text-white"
						>
							Download Analytics
						</button>
						<button
							onClick={() => {
								const ac = new AbortController();
								void fetchEvents(ac.signal);
							}}
							className="py-2 rounded bg-gray-700 text-white"
						>
							Refresh Events
						</button>
						<button
							onClick={async () => {
								try {
									await downloadFestStatistics();
									setToast({ type: 'success', message: 'Statistics downloaded' });
								} catch (err) {
									setToast({
										type: 'error',
										message: getErrMsg(err, 'Failed to download statistics'),
									});
								}
							}}
							className="py-2 rounded bg-indigo-700 text-white"
						>
							Download Statistics
						</button>
					</div>
				</GlassCard>
			</div>

			<div className="col-span-9 space-y-4">
				{!editForm && (
					<EmptyState
						title="Select a fest"
						subtitle="Choose a fest to edit from the left"
						action={null}
					/>
				)}

				{editForm && (
					<GlassCard className="p-6">
						<div className="flex items-start justify-between mb-4 gap-4">
							<div>
								<h2 className="text-2xl font-semibold text-white">
									{editForm.name} — {editForm.year}
								</h2>
								<div className="text-sm text-gray-400">
									Status:{' '}
									<Badge variant={editForm.status}>{editForm.status}</Badge>
								</div>
							</div>

							<div className="flex gap-2">
								<button
									onClick={() => void saveEdit()}
									disabled={actionBusy}
									className="px-4 py-2 bg-emerald-600 text-white rounded"
								>
									Save
								</button>
								<button
									onClick={() => void removeFest(editForm)}
									disabled={actionBusy}
									className="px-4 py-2 bg-red-600 text-white rounded"
								>
									Delete
								</button>
								<button
									onClick={async () => {
										try {
											await downloadFestReport(editForm._id);
											setToast({
												type: 'success',
												message: 'Report downloaded',
											});
										} catch (err) {
											setToast({
												type: 'error',
												message: getErrMsg(
													err,
													'Failed to download report'
												),
											});
										}
									}}
									disabled={actionBusy}
									className="px-4 py-2 bg-gray-800 text-white rounded"
								>
									Download Report
								</button>
							</div>
						</div>

						{/* Basic fields */}
						<div className="grid grid-cols-2 gap-4 mb-4">
							<input
								value={editForm.location || ''}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, location: e.target.value }))
								}
								className="p-3 bg-white/5 rounded"
								placeholder="Location"
							/>
							<input
								value={editForm.contactEmail || ''}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, contactEmail: e.target.value }))
								}
								className="p-3 bg-white/5 rounded"
								placeholder="Contact email"
							/>
							<textarea
								value={editForm.description || ''}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, description: e.target.value }))
								}
								className="col-span-2 p-3 bg-white/5 rounded"
								rows={4}
								placeholder="Description"
							/>
							<input
								type="datetime-local"
								value={
									editForm.startDate
										? new Date(editForm.startDate).toISOString().slice(0, 16)
										: ''
								}
								onChange={(e) =>
									setEditForm((s) => ({
										...s,
										startDate: e.target.value || null,
									}))
								}
								className="p-3 bg-white/5 rounded"
							/>
							<input
								type="datetime-local"
								value={
									editForm.endDate
										? new Date(editForm.endDate).toISOString().slice(0, 16)
										: ''
								}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, endDate: e.target.value || null }))
								}
								className="p-3 bg-white/5 rounded"
							/>
						</div>

						{/* Posters */}
						<div className="mb-4">
							<h4 className="font-semibold text-white mb-2">Posters</h4>
							<div className="flex gap-2 flex-wrap mb-3">
								{(editForm.posters || []).length === 0 && (
									<div className="text-sm text-gray-400">No posters uploaded</div>
								)}
								{(editForm.posters || []).map((p) => (
									<div
										key={p.publicId}
										className="relative w-36 h-48 bg-gray-800 rounded overflow-hidden"
									>
										{p.url && (
											<img
												src={p.url}
												alt={p.caption || ''}
												className="object-cover w-full h-full"
											/>
										)}
										<div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 flex items-center justify-between gap-2">
											<div className="text-xs text-white truncate">
												{p.caption || p.publicId}
											</div>
											<div className="flex gap-2">
												<button
													onClick={() => removePoster(p.publicId)}
													disabled={actionBusy}
													className="text-red-400 p-1"
													title="Delete poster"
												>
													<Trash2 className="w-4 h-4" />
												</button>
												<button
													onClick={() => toggleMediaSelect(p.publicId)}
													className={`p-1 rounded-full ${
														mediaSelection.has(p.publicId)
															? 'bg-purple-600 text-white'
															: 'bg-black/50 text-purple-600'
													}`}
													aria-label="Select poster"
												>
													{mediaSelection.has(p.publicId) ? '✓' : 'P'}
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
							<input
								type="file"
								multiple
								accept="image/*"
								onChange={(e) =>
									void uploadPoster(Array.from(e.target.files || []))
								}
								disabled={actionBusy}
							/>
						</div>

						{/* Hero */}
						<div className="mb-4">
							<h4 className="font-semibold text-white mb-2">Hero Image</h4>
							{editForm.hero ? (
								<div className="flex items-center gap-4 mb-2">
									<img
										src={editForm.hero.url}
										alt="hero"
										className="w-40 h-24 object-cover rounded"
									/>
									<div className="flex-1">
										<div className="text-sm text-gray-400 mb-1">
											{editForm.hero.caption || ''}
										</div>
										<input
											value={heroCaption}
											onChange={(e) => setHeroCaption(e.target.value)}
											placeholder="Edit hero caption (local)"
											className="p-2 bg-white/5 rounded w-full mb-2"
										/>
									</div>
									<div className="ml-auto flex gap-2">
										<button
											onClick={() => removeHero()}
											disabled={actionBusy}
											className="px-3 py-1 rounded bg-red-600 text-white"
										>
											Delete Hero
										</button>
									</div>
								</div>
							) : (
								<div className="text-sm text-gray-400 mb-2">No hero image</div>
							)}

							<div className="flex gap-2 items-center">
								<input
									type="file"
									accept="image/*"
									onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
									disabled={actionBusy}
								/>
								<input
									type="text"
									placeholder="Caption (optional)"
									value={heroCaption}
									onChange={(e) => setHeroCaption(e.target.value)}
									className="p-2 bg-white/5 rounded flex-1"
									disabled={actionBusy}
								/>
								<button
									onClick={() => uploadHero(heroFile, heroCaption)}
									disabled={actionBusy || !heroFile}
									className="px-3 py-2 bg-emerald-600 text-white rounded"
								>
									Upload Hero
								</button>
							</div>
						</div>

						{/* Gallery */}
						<div className="mb-4">
							<h4 className="font-semibold text-white mb-2">Gallery</h4>
							<div className="flex gap-2 flex-wrap mb-2">
								{editForm.gallery?.map((g, i) => (
									<div
										key={g.publicId || i}
										className="relative w-36 h-24 bg-gray-800 rounded overflow-hidden"
									>
										{g.url && (
											<img
												src={g.url}
												alt={g.caption || ''}
												className="object-cover w-full h-full"
											/>
										)}
										<button
											onClick={() => void removeGalleryItem(g.publicId)}
											className="absolute top-1 right-1 p-1 bg-black/50 rounded text-red-400"
											aria-label="Remove gallery item"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								))}
								{editForm.gallery?.length === 0 && (
									<div className="text-sm text-gray-400">No gallery items</div>
								)}
							</div>
							<input
								type="file"
								multiple
								accept="image/*,video/*"
								onChange={(e) => void addGallery(Array.from(e.target.files || []))}
								disabled={actionBusy}
							/>
						</div>

						{/* Partners */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-semibold text-white">
									Partners ({(editForm.partners || []).length})
								</h4>
								<PartnerQuickAdd onAdd={addNewPartner} disabled={actionBusy} />
							</div>
							<div className="space-y-2">
								{(editForm.partners || []).map((p, i) => (
									<div
										key={`${p.name}-${i}`}
										className="flex items-center justify-between p-3 bg-white/3 rounded"
									>
										<div className="flex items-center gap-3">
											{p.logo?.url ? (
												<img
													src={p.logo.url}
													alt={p.name}
													className="w-10 h-10 object-cover rounded"
												/>
											) : (
												<div className="w-10 h-10 bg-gray-700 rounded" />
											)}
											<div>
												<div className="font-medium text-white">
													{p.name}
												</div>
												<div className="text-sm text-gray-400">
													{p.tier || p.website}
												</div>
											</div>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => {
													const newName = prompt(
														'New partner name',
														p.name
													);
													if (newName && newName !== p.name)
														updateExistingPartner(p.name, {
															name: newName,
														});
												}}
												className="text-blue-400"
											>
												Edit
											</button>
											<button
												onClick={() => void removeExistingPartner(p.name)}
												className="text-red-400"
											>
												Remove
											</button>
											<button
												onClick={() => reorderPartners('up', i)}
												className="text-gray-400"
												title="Move up"
												disabled={i === 0}
											>
												<ArrowUp />
											</button>
											<button
												onClick={() => reorderPartners('down', i)}
												className="text-gray-400"
												title="Move down"
												disabled={
													i === (editForm.partners || []).length - 1
												}
											>
												<ArrowDown />
											</button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Events */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-semibold text-white">
									Linked Events ({(editForm.events || []).length})
								</h4>
								<select
									onChange={(e) => {
										const val = e.target.value;
										if (val) void handleLinkEvent(val);
									}}
									className="p-2 bg-white/5 rounded"
								>
									<option value="">Link an event</option>
									{events.map((ev) => (
										<option key={ev._id} value={ev._id}>
											{ev.title}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-2">
								{(editForm.events || []).map((ev) => (
									<div
										key={ev._id}
										className="flex items-center justify-between p-3 bg-white/3 rounded"
									>
										<div>
											<div className="font-medium text-white">{ev.title}</div>
											<div className="text-sm text-gray-400">
												{ev.eventDate
													? new Date(ev.eventDate).toLocaleString()
													: 'TBD'}
											</div>
										</div>
										<div>
											<button
												onClick={() => void handleUnlinkEvent(ev._id)}
												className="text-red-400"
											>
												Unlink
											</button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Presentation */}
						<div className="mb-4">
							<h4 className="font-semibold text-white mb-2">Presentation Settings</h4>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Visibility
									</label>
									<select
										value={editForm.visibility}
										onChange={(e) => handleSetVisibility(e.target.value)}
										className="p-3 bg-white/5 rounded w-full"
									>
										<option value="public">Public</option>
										<option value="private">Private</option>
										<option value="unlisted">Unlisted</option>
									</select>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Status
									</label>
									<select
										value={editForm.status}
										onChange={(e) =>
											setEditForm((s) => ({ ...s, status: e.target.value }))
										}
										className="p-3 bg-white/5 rounded w-full"
									>
										<option value="upcoming">upcoming</option>
										<option value="ongoing">ongoing</option>
										<option value="completed">completed</option>
										<option value="cancelled">cancelled</option>
										<option value="postponed">postponed</option>
									</select>
								</div>

								{/* Social links */}
								<div className="col-span-2 grid grid-cols-2 gap-3">
									<div>
										<label className="block text-sm text-gray-400 mb-1">
											Website
										</label>
										<input
											value={presentationDraft.socialLinks?.website || ''}
											onChange={(e) =>
												setPresentationDraft((s) => ({
													...s,
													socialLinks: {
														...(s.socialLinks || {}),
														website: e.target.value,
													},
												}))
											}
											className="p-2 bg-white/5 rounded w-full"
											placeholder="https://example.com"
										/>
									</div>
									<div>
										<label className="block text-sm text-gray-400 mb-1">
											Twitter
										</label>
										<input
											value={presentationDraft.socialLinks?.twitter || ''}
											onChange={(e) =>
												setPresentationDraft((s) => ({
													...s,
													socialLinks: {
														...(s.socialLinks || {}),
														twitter: e.target.value,
													},
												}))
											}
											className="p-2 bg-white/5 rounded w-full"
											placeholder="@handle or https://twitter.com/handle"
										/>
									</div>
									<div>
										<label className="block text-sm text-gray-400 mb-1">
											Instagram
										</label>
										<input
											value={presentationDraft.socialLinks?.instagram || ''}
											onChange={(e) =>
												setPresentationDraft((s) => ({
													...s,
													socialLinks: {
														...(s.socialLinks || {}),
														instagram: e.target.value,
													},
												}))
											}
											className="p-2 bg-white/5 rounded w-full"
											placeholder="@handle or url"
										/>
									</div>
									<div>
										<label className="block text-sm text-gray-400 mb-1">
											Facebook
										</label>
										<input
											value={presentationDraft.socialLinks?.facebook || ''}
											onChange={(e) =>
												setPresentationDraft((s) => ({
													...s,
													socialLinks: {
														...(s.socialLinks || {}),
														facebook: e.target.value,
													},
												}))
											}
											className="p-2 bg-white/5 rounded w-full"
											placeholder="facebook page url"
										/>
									</div>
									<div className="col-span-2">
										<label className="block text-sm text-gray-400 mb-1">
											LinkedIn
										</label>
										<input
											value={presentationDraft.socialLinks?.linkedin || ''}
											onChange={(e) =>
												setPresentationDraft((s) => ({
													...s,
													socialLinks: {
														...(s.socialLinks || {}),
														linkedin: e.target.value,
													},
												}))
											}
											className="p-2 bg-white/5 rounded w-full"
											placeholder="linkedin url"
										/>
									</div>
								</div>

								{/* Theme colors */}
								<div className="col-span-2 grid grid-cols-3 gap-3">
									<div>
										<label className="block text-sm text-gray-400 mb-1">
											Primary
										</label>
										<div className="flex gap-2 items-center">
											<input
												type="color"
												value={
													presentationDraft.themeColors?.primary ||
													'#06b6d4'
												}
												onChange={(e) =>
													setPresentationDraft((s) => ({
														...s,
														themeColors: {
															...(s.themeColors || {}),
															primary: e.target.value,
														},
													}))
												}
												className="w-12 h-8 p-0 border-0 rounded"
											/>
											<input
												value={presentationDraft.themeColors?.primary || ''}
												onChange={(e) =>
													setPresentationDraft((s) => ({
														...s,
														themeColors: {
															...(s.themeColors || {}),
															primary: e.target.value,
														},
													}))
												}
												className="p-2 bg-white/5 rounded w-full"
												placeholder="#06b6d4"
											/>
										</div>
									</div>
									<div>
										<label className="block text-sm text-gray-400 mb-1">
											Accent
										</label>
										<div className="flex gap-2 items-center">
											<input
												type="color"
												value={
													presentationDraft.themeColors?.accent ||
													'#0284c7'
												}
												onChange={(e) =>
													setPresentationDraft((s) => ({
														...s,
														themeColors: {
															...(s.themeColors || {}),
															accent: e.target.value,
														},
													}))
												}
												className="w-12 h-8 p-0 border-0 rounded"
											/>
											<input
												value={presentationDraft.themeColors?.accent || ''}
												onChange={(e) =>
													setPresentationDraft((s) => ({
														...s,
														themeColors: {
															...(s.themeColors || {}),
															accent: e.target.value,
														},
													}))
												}
												className="p-2 bg-white/5 rounded w-full"
												placeholder="#0284c7"
											/>
										</div>
									</div>
									<div>
										<label className="block text-sm text-gray-400 mb-1">
											Background
										</label>
										<div className="flex gap-2 items-center">
											<input
												type="color"
												value={
													presentationDraft.themeColors?.bg || '#0f172a'
												}
												onChange={(e) =>
													setPresentationDraft((s) => ({
														...s,
														themeColors: {
															...(s.themeColors || {}),
															bg: e.target.value,
														},
													}))
												}
												className="w-12 h-8 p-0 border-0 rounded"
											/>
											<input
												value={presentationDraft.themeColors?.bg || ''}
												onChange={(e) =>
													setPresentationDraft((s) => ({
														...s,
														themeColors: {
															...(s.themeColors || {}),
															bg: e.target.value,
														},
													}))
												}
												className="p-2 bg-white/5 rounded w-full"
												placeholder="#0f172a"
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-4 flex gap-2">
								<button
									onClick={() => void savePresentation()}
									disabled={actionBusy}
									className="px-4 py-2 bg-emerald-600 text-white rounded"
								>
									Save Presentation
								</button>
								<button
									onClick={() => void saveSocialLinks()}
									disabled={actionBusy}
									className="px-4 py-2 bg-blue-600 text-white rounded"
								>
									Save Social Links
								</button>
								<button
									onClick={() => void saveThemeColors()}
									disabled={actionBusy}
									className="px-4 py-2 bg-indigo-600 text-white rounded"
								>
									Save Theme Colors
								</button>
							</div>
						</div>

						{/* Bulk delete actions */}
						<div className="flex gap-2 mt-4">
							<button
								onClick={() => bulkDeleteSelectedMedia()}
								disabled={bulkDeleting || mediaSelection.size === 0}
								className="px-4 py-2 bg-red-600 text-white rounded"
							>
								Delete Selected ({mediaSelection.size})
							</button>
						</div>

						{/* Tracks block */}
						{editForm && (
							<div className="mb-4">
								<div className="flex items-center justify-between mb-2">
									<h4 className="font-semibold text-white">
										Tracks ({(editForm.tracks || []).length})
									</h4>
									<button
										onClick={async () => {
											const title = prompt('Track title');
											if (!title) return;
											const color =
												prompt('Optional color (hex)', '#ffffff') || '';
											await addTrack({ title, description: '', color });
										}}
										className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
										disabled={actionBusy}
									>
										Add Track
									</button>
								</div>
								<div className="space-y-2">
									{(editForm.tracks || []).map((t, idx) => (
										<div
											key={t.key || idx}
											className="flex items-center justify-between p-3 bg-white/3 rounded"
										>
											<div>
												<div className="font-medium text-white">
													{t.title}
												</div>
												<div className="text-sm text-gray-400">
													{t.description}
												</div>
											</div>
											<div className="flex gap-2 items-center">
												<button
													onClick={() => removeExistingTrack(t.key)}
													className="text-red-400"
													disabled={actionBusy}
												>
													Remove
												</button>
												<button
													onClick={() => reorderTracks(idx, idx - 1)}
													disabled={idx === 0 || actionBusy}
													className="text-gray-400"
													title="Move up"
												>
													<ArrowUp className="w-5 h-5" />
												</button>
												<button
													onClick={() => reorderTracks(idx, idx + 1)}
													disabled={
														idx ===
															(editForm.tracks || []).length - 1 ||
														actionBusy
													}
													className="text-gray-400"
													title="Move down"
												>
													<ArrowDown className="w-5 h-5" />
												</button>
											</div>
										</div>
									))}
									{(editForm.tracks || []).length === 0 && (
										<div className="text-sm text-gray-400">
											No tracks defined
										</div>
									)}
								</div>
							</div>
						)}

						{/* FAQs */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-semibold text-white">
									FAQs ({(editForm.faqs || []).length})
								</h4>
								<button
									onClick={() => {
										const question = prompt('Enter FAQ question');
										const answer = question ? prompt('Enter FAQ answer') : null;
										if (question && answer) void addFaq({ question, answer });
									}}
									className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
								>
									Add FAQ
								</button>
							</div>
							<div className="space-y-2">
								{(editForm.faqs || []).map((faq, idx) => (
									<div
										key={String(faq._id || faq.id)}
										className="flex items-center justify-between p-3 bg-white/3 rounded"
									>
										<div className="flex-1">
											<div className="font-medium text-white">
												{faq.question}
											</div>
											<div className="text-sm text-gray-400">
												{faq.answer}
											</div>
										</div>
										<div className="flex gap-2 items-center">
											<button
												onClick={() => {
													const newAnswer = prompt(
														'Enter new answer',
														faq.answer
													);
													if (newAnswer && newAnswer !== faq.answer)
														updateFAQ(editForm._id, faq._id || faq.id, {
															answer: newAnswer,
														})
															.then(() =>
																loadFestDetails(editForm._id)
															)
															.catch((err) =>
																setToast({
																	type: 'error',
																	message: getErrMsg(
																		err,
																		'Failed to update FAQ'
																	),
																})
															);
												}}
												className="text-blue-400"
												title="Edit FAQ"
											>
												Edit
											</button>
											<button
												onClick={() =>
													void removeExistingFaq(faq._id || faq.id)
												}
												className="text-red-400"
												title="Remove FAQ"
											>
												<Trash2 className="w-5 h-5" />
											</button>
											<button
												onClick={() => reorderFaqs(idx, idx - 1)}
												disabled={idx === 0 || actionBusy}
												className="text-gray-400"
												title="Move up"
											>
												<ArrowUp className="w-5 h-5" />
											</button>
											<button
												onClick={() => reorderFaqs(idx, idx + 1)}
												disabled={
													idx === (editForm.faqs || []).length - 1 ||
													actionBusy
												}
												className="text-gray-400"
												title="Move down"
											>
												<ArrowDown className="w-5 h-5" />
											</button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Toast */}
						{toast && (
							<div className="fixed bottom-6 right-6 z-50">
								<Toast
									message={toast.message}
									type={toast.type}
									onDismiss={() => setToast(null)}
								/>
							</div>
						)}
					</GlassCard>
				)}
			</div>

			{/* Create modal */}
			{createOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
					<div className="w-full max-w-2xl bg-gray-900 rounded p-6">
						<h3 className="text-lg font-semibold mb-4">Create Fest</h3>
						<form onSubmit={handleCreateSubmit} className="space-y-3">
							<input
								value={createForm.name}
								onChange={(e) =>
									setCreateForm((s) => ({ ...s, name: e.target.value }))
								}
								className="w-full p-3 bg-white/5 rounded"
								placeholder="Name"
							/>
							<input
								value={createForm.tagline}
								onChange={(e) =>
									setCreateForm((s) => ({ ...s, tagline: e.target.value }))
								}
								className="w-full p-3 bg-white/5 rounded"
								placeholder="Tagline (short)"
							/>
							<input
								value={createForm.year}
								onChange={(e) =>
									setCreateForm((s) => ({ ...s, year: e.target.value }))
								}
								className="w-full p-3 bg-white/5 rounded"
								placeholder="Year"
							/>
							<textarea
								value={createForm.description}
								onChange={(e) =>
									setCreateForm((s) => ({ ...s, description: e.target.value }))
								}
								className="w-full p-3 bg-white/5 rounded"
								placeholder="Description"
							/>
							<div className="flex gap-2">
								<input
									type="datetime-local"
									value={createForm.startDate}
									onChange={(e) =>
										setCreateForm((s) => ({ ...s, startDate: e.target.value }))
									}
									className="w-1/2 p-3 bg-white/5 rounded"
								/>
								<input
									type="datetime-local"
									value={createForm.endDate}
									onChange={(e) =>
										setCreateForm((s) => ({ ...s, endDate: e.target.value }))
									}
									className="w-1/2 p-3 bg-white/5 rounded"
								/>
							</div>
							<div className="flex gap-2 justify-end">
								<button
									type="button"
									onClick={() => setCreateOpen(false)}
									className="px-4 py-2 bg-white/5 rounded"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={createLoading}
									className="px-4 py-2 bg-emerald-600 text-white rounded"
								>
									{createLoading ? 'Creating...' : 'Create'}
								</button>
							</div>
							{localError && <div className="text-red-400 text-sm">{localError}</div>}
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default EditArvantis;
