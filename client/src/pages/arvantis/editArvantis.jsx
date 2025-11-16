import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../../components/arvantis/Badge.jsx';
import GlassCard from '../../components/arvantis/GlassCard.jsx';
import EmptyState from '../../components/arvantis/EmptyState.jsx';
import LoadingSpinner from '../../components/arvantis/LoadingSpinner.jsx';
import PartnerQuickAdd from '../../components/arvantis/PartnerQuickAdd.jsx';

import {
	getAllFests,
	getFestDetails,
	createFest as svcCreateFest,
	updateFestDetails as svcUpdateFest,
	deleteFest as svcDeleteFest,
	addPartner as svcAddPartner,
	updatePartner as svcUpdatePartner,
	removePartner as svcRemovePartner,
	reorderPartners as svcReorderPartners,
	linkEventToFest as svcLinkEvent,
	unlinkEventFromFest as svcUnlinkEvent,
	updateFestPoster as svcUpdatePoster,
	updateFestHero as svcUpdateHero,
	addGalleryMedia as svcAddGallery,
	removeGalleryMedia as svcRemoveGallery,
	reorderGallery as svcReorderGallery,
	bulkDeleteMedia as svcBulkDeleteMedia,
	exportFestsCSV as svcExportCSV,
	getFestAnalytics as svcGetAnalytics,
	getFestStatistics as svcGetStatistics,
	generateFestReport as svcGenerateReport,
	duplicateFest as svcDuplicateFest,
	setFestStatus as svcSetFestStatus,
	updatePresentation as svcUpdatePresentation,
	updateSocialLinks as svcUpdateSocialLinks,
	updateThemeColors as svcUpdateThemeColors,
	addTrack as svcAddTrack,
	updateTrack as svcUpdateTrack,
	removeTrack as svcRemoveTrack,
	reorderTracks as svcReorderTracks,
	addFAQ as svcAddFAQ,
	updateFAQ as svcUpdateFAQ,
	removeFAQ as svcRemoveFAQ,
	reorderFAQs as svcReorderFAQs,
} from '../../services/arvantisServices.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FILE_TYPES_IMAGES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const safeFilename = (s = '') => String(s).replace(/[:]/g, '-').replace(/\s+/g, '-');

const EditArvantis = ({ setDashboardError = () => {} }) => {
	// state
	const [fests, setFests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState([]);
	const [selectedFestId, setSelectedFestId] = useState(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);
	const [actionBusy, setActionBusy] = useState(false);
	const [localError, setLocalError] = useState('');
	const [downloadingCSV, setDownloadingCSV] = useState(false);

	// new UI state for extended controls
	const [mediaSelection, setMediaSelection] = useState(new Set()); // publicId set
	const [bulkDeleting, setBulkDeleting] = useState(false);

	// presentation/social/theme state editing
	const [presentationDraft, setPresentationDraft] = useState({
		themeColors: {},
		socialLinks: {},
	});

	// tracks & faqs local editing state
	const [tracksDraft, setTracksDraft] = useState([]);
	const [faqsDraft, setFaqsDraft] = useState([]);

	const [createForm, setCreateForm] = useState({
		year: new Date().getFullYear(),
		description: '',
		startDate: '',
		endDate: '',
		name: 'Arvantis',
	});

	const [editForm, setEditForm] = useState(null);
	const mountedRef = useRef(false);

	// avoid re-selecting first fest multiple times
	const firstSelectDoneRef = useRef(false);

	// keep a stable ref to external callback to avoid re-creating fetchFests
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

	// helper to extract error message
	const getErrMsg = (err, fallback = 'Request failed') =>
		err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

	// load selected fest details
	const loadFestDetails = useCallback(
		async (identifier) => {
			if (!identifier) {
				if (mountedRef.current) setEditForm(null);
				return;
			}
			setActionBusy(true);
			try {
				const data = await getFestDetails(identifier, { admin: true });
				if (!data) {
					if (mountedRef.current) setEditForm(null);
					return;
				}
				// keep presentation/tracks/faqs drafts
				if (mountedRef.current) {
					setPresentationDraft({
						themeColors: data.themeColors || {},
						socialLinks: data.socialLinks || {},
					});
					setTracksDraft(Array.isArray(data.tracks) ? data.tracks.slice() : []);
					setFaqsDraft(Array.isArray(data.faqs) ? data.faqs.slice() : []);
				}
				const form = {
					_id: data._id,
					name: data.name,
					year: data.year,
					description: data.description,
					startDate: data.startDate
						? new Date(data.startDate).toISOString().slice(0, 16)
						: '',
					endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '',
					status: data.status,
					location: data.location,
					contactEmail: data.contactEmail || '',
					partners: data.partners || [],
					gallery: data.gallery || [],
					poster: data.poster || null,
					events: data.events || [],
					visibility: data.visibility || 'public',
					themeColors: data.themeColors || {},
					socialLinks: data.socialLinks || {},
					tracks: data.tracks || [],
					faqs: data.faqs || [],
					slug: data.slug,
				};
				if (mountedRef.current) {
					setEditForm(form);
					setSelectedFestId(data._id);
					setMediaSelection(new Set());
				}
			} catch (err) {
				console.error('loadFestDetails', err);
				toast.error(getErrMsg(err, 'Failed to load fest details'));
			} finally {
				if (mountedRef.current) setActionBusy(false);
			}
		},
		[] // stable
	);

	// load list of fests (paginated large limit)
	const fetchFests = useCallback(async () => {
		setLoading(true);
		try {
			const resp = await getAllFests({ page: 1, limit: 200 }, { admin: true });
			const docs = resp?.docs || [];
			if (mountedRef.current) {
				setFests(docs);
				if (!firstSelectDoneRef.current && docs.length > 0) {
					firstSelectDoneRef.current = true;
					void loadFestDetails(docs[0]._id);
				}
			}
		} catch (err) {
			if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
			console.error('fetchFests', err);
			try {
				setDashboardErrorRef.current?.(getErrMsg(err, 'Failed to load fests'));
			} catch (e) {}
			toast.error(getErrMsg(err, 'Failed to load fests'));
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	}, [loadFestDetails]);

	// load events for linking (with abort support)
	const fetchEvents = useCallback(async (signal) => {
		try {
			const svc = await import('../../services/eventServices.js');
			const resp = await svc.getAllEvents({ page: 1, limit: 500 }, { signal });
			const docs = resp?.docs || [];
			if (mountedRef.current) setEvents(docs);
		} catch (err) {
			if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
			console.error('fetchEvents', err);
		}
	}, []);

	useEffect(() => {
		const acEvents = new AbortController();
		void fetchFests();
		void fetchEvents(acEvents.signal);
		return () => {
			acEvents.abort();
		};
	}, [fetchFests, fetchEvents]);

	// create
	const handleCreateSubmit = async (e) => {
		e?.preventDefault();
		setCreateLoading(true);
		setLocalError('');
		try {
			const payload = {
				year: Number(createForm.year),
				name: createForm.name,
				description: createForm.description,
				startDate: createForm.startDate || null,
				endDate: createForm.endDate || null,
			};
			const created = await svcCreateFest(payload);
			toast.success('Fest created');
			await fetchFests();
			setCreateOpen(false);
			if (created?._id) await loadFestDetails(created._id);
		} catch (err) {
			console.error('createFest', err);
			const msg = getErrMsg(err, 'Create failed');
			setLocalError(msg);
			toast.error(msg);
		} finally {
			if (mountedRef.current) setCreateLoading(false);
		}
	};

	// save edit
	const saveEdit = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			const payload = {
				description: editForm.description,
				startDate: editForm.startDate || null,
				endDate: editForm.endDate || null,
				status: editForm.status,
				location: editForm.location,
				contactEmail: editForm.contactEmail,
			};
			await svcUpdateFest(editForm._id, payload);
			toast.success('Fest updated');
			await fetchFests();
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('saveEdit', err);
			toast.error(getErrMsg(err, 'Update failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const removeFest = async (fest) => {
		if (!fest || !fest._id) return;
		if (!window.confirm('Delete fest? This is irreversible.')) return;
		setActionBusy(true);
		try {
			await svcDeleteFest(fest._id);
			toast.success('Fest deleted');
			await fetchFests();
			if (mountedRef.current) {
				setEditForm(null);
				setSelectedFestId(null);
			}
		} catch (err) {
			console.error('removeFest', err);
			toast.error(getErrMsg(err, 'Delete failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// poster upload
	const uploadPoster = async (file) => {
		if (!file || !editForm || !editForm._id) return;
		if (file.size > MAX_FILE_SIZE) return toast.error('File too large (max 10MB)');
		if (!FILE_TYPES_IMAGES.includes(file.type)) return toast.error('Invalid image type');
		const fd = new FormData();
		fd.append('poster', file);
		setActionBusy(true);
		try {
			await svcUpdatePoster(editForm._id, fd);
			toast.success('Poster uploaded');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('uploadPoster', err);
			toast.error(getErrMsg(err, 'Poster upload failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// hero upload
	const uploadHero = async (file, caption) => {
		if (!file || !editForm || !editForm._id) return;
		const fd = new FormData();
		fd.append('hero', file);
		if (caption) fd.append('caption', caption);
		setActionBusy(true);
		try {
			await svcUpdateHero(editForm._id, fd);
			toast.success('Hero uploaded');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('uploadHero', err);
			toast.error(getErrMsg(err, 'Hero upload failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// gallery add
	const addGallery = async (files) => {
		if (!files || files.length === 0 || !editForm || !editForm._id) return;
		const fd = new FormData();
		for (const f of files) {
			if (f.size > MAX_FILE_SIZE) {
				toast.error(`File ${f.name} is too large (max 10MB). Skipping.`);
				continue;
			}
			fd.append('media', f);
		}
		if (![...fd.keys()].length) return;
		setActionBusy(true);
		try {
			await svcAddGallery(editForm._id, fd);
			toast.success('Gallery uploaded');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('addGallery', err);
			toast.error(getErrMsg(err, 'Gallery upload failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const removeGalleryItem = async (publicId) => {
		if (!publicId || !editForm || !editForm._id) return;
		if (!window.confirm('Remove gallery item?')) return;
		setActionBusy(true);
		try {
			await svcRemoveGallery(editForm._id, publicId);
			toast.success('Gallery item removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('removeGalleryItem', err);
			toast.error(getErrMsg(err, 'Remove failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// partners
	const addNewPartner = async (formData) => {
		if (!editForm || !editForm._id) throw new Error('No active fest');
		setActionBusy(true);
		try {
			await svcAddPartner(editForm._id, formData);
			toast.success('Partner added');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('addNewPartner', err);
			toast.error(getErrMsg(err, 'Add partner failed'));
			throw err;
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const updateExistingPartner = async (partnerName, updates) => {
		if (!partnerName || !editForm || !editForm._id) return;
		const fd = updates instanceof FormData ? updates : updates;
		setActionBusy(true);
		try {
			await svcUpdatePartner(editForm._id, partnerName, fd);
			toast.success('Partner updated');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('updateExistingPartner', err);
			toast.error(getErrMsg(err, 'Update partner failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const removeExistingPartner = async (partnerName) => {
		if (!partnerName || !editForm || !editForm._id) return;
		if (!window.confirm(`Remove partner "${partnerName}"?`)) return;
		setActionBusy(true);
		try {
			await svcRemovePartner(editForm._id, partnerName);
			toast.success('Partner removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('removeExistingPartner', err);
			toast.error(getErrMsg(err, 'Remove partner failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// reorder helpers (partners / gallery)
	const moveItem = (arr, index, delta) => {
		const copy = arr.slice();
		const i = index;
		const j = i + delta;
		if (i < 0 || j < 0 || i >= copy.length || j >= copy.length) return copy;
		const tmp = copy[i];
		copy.splice(i, 1);
		copy.splice(j, 0, tmp);
		return copy;
	};

	const reorderPartners = async (direction, idx) => {
		if (!editForm || !editForm._id) return;
		const newArr = moveItem(editForm.partners || [], idx, direction === 'up' ? -1 : 1);
		try {
			await svcReorderPartners(
				editForm._id,
				newArr.map((p) => p.name)
			);
			toast.success('Partners reordered');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('reorderPartners', err);
			toast.error(getErrMsg(err, 'Reorder failed'));
		}
	};

	const reorderGallery = async (direction, idx) => {
		if (!editForm || !editForm._id) return;
		const newArr = moveItem(editForm.gallery || [], idx, direction === 'up' ? -1 : 1);
		try {
			await svcReorderGallery(
				editForm._id,
				newArr.map((g) => g.publicId)
			);
			toast.success('Gallery reordered');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('reorderGallery', err);
			toast.error(getErrMsg(err, 'Reorder failed'));
		}
	};

	// link/unlink events
	const handleLinkEvent = async (eventId) => {
		if (!eventId || !editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcLinkEvent(editForm._id, eventId);
			toast.success('Event linked');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('handleLinkEvent', err);
			toast.error(getErrMsg(err, 'Link failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const handleUnlinkEvent = async (eventId) => {
		if (!eventId || !editForm || !editForm._id) return;
		if (!window.confirm('Unlink event from fest?')) return;
		setActionBusy(true);
		try {
			await svcUnlinkEvent(editForm._id, eventId);
			toast.success('Event unlinked');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('handleUnlinkEvent', err);
			toast.error(getErrMsg(err, 'Unlink failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// export CSV
	const exportCSV = async () => {
		setDownloadingCSV(true);
		try {
			const blob = await svcExportCSV();
			const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
			const a = document.createElement('a');
			a.href = url;
			a.download = `arvantis-fests-${safeFilename(new Date().toISOString())}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
			toast.success('CSV downloaded');
		} catch (err) {
			console.error('exportCSV', err);
			toast.error(getErrMsg(err, 'Export failed'));
		} finally {
			if (mountedRef.current) setDownloadingCSV(false);
		}
	};

	const loadAnalytics = async () => {
		try {
			const analytics = await svcGetAnalytics();
			console.log('analytics', analytics);
			toast.success('Analytics loaded (check console)');
		} catch (err) {
			console.error('loadAnalytics', err);
			toast.error(getErrMsg(err, 'Analytics failed'));
		}
	};

	const loadStatistics = async () => {
		try {
			const stats = await svcGetStatistics();
			console.log('statistics', stats);
			toast.success('Statistics loaded (check console)');
		} catch (err) {
			console.error('loadStatistics', err);
			toast.error(getErrMsg(err, 'Statistics failed'));
		}
	};

	const generateReport = async () => {
		if (!editForm || !editForm._id) return;
		try {
			const report = await svcGenerateReport(editForm._id);
			console.log('report', report);
			toast.success('Report generated (check console)');
		} catch (err) {
			console.error('generateReport', err);
			toast.error(getErrMsg(err, 'Report failed'));
		}
	};

	// duplicate
	const handleDuplicate = async (year) => {
		if (!editForm || !editForm._id || !year) return;
		if (!window.confirm(`Duplicate fest into year ${year}?`)) return;
		setActionBusy(true);
		try {
			await svcDuplicateFest(editForm._id, year);
			toast.success('Fest duplicated');
			await fetchFests();
		} catch (err) {
			console.error('handleDuplicate', err);
			toast.error(getErrMsg(err, 'Duplicate failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// set status
	const handleSetStatus = async (status) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcSetFestStatus(editForm._id, status);
			toast.success('Status updated');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('handleSetStatus', err);
			toast.error(getErrMsg(err, 'Status update failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// presentation/social/theme saves
	const savePresentation = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcUpdatePresentation(editForm._id, {
				themeColors: presentationDraft.themeColors,
				socialLinks: presentationDraft.socialLinks,
			});
			toast.success('Presentation updated');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('savePresentation', err);
			toast.error(getErrMsg(err, 'Presentation update failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const saveSocialLinks = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcUpdateSocialLinks(editForm._id, presentationDraft.socialLinks);
			toast.success('Social links updated');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('saveSocialLinks', err);
			toast.error(getErrMsg(err, 'Update failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const saveThemeColors = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcUpdateThemeColors(editForm._id, presentationDraft.themeColors);
			toast.success('Theme colors updated');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('saveThemeColors', err);
			toast.error(getErrMsg(err, 'Update failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const handleSetVisibility = async (visibility) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcUpdateThemeColors(editForm._id, {}); // no-op to keep pattern (preserve)
			await svcSetFestStatus(editForm._id, editForm.status); // preserve pattern
			await svcUpdatePresentation(editForm._id, {}); // preserve pattern
			// call specific setVisibility service
			const svc = await import('../../services/arvantisServices.js');
			await svc.setVisibility(editForm._id, visibility);
			toast.success('Visibility updated');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('handleSetVisibility', err);
			toast.error(getErrMsg(err, 'Visibility update failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// tracks CRUD
	const addTrack = async (payload) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcAddTrack(editForm._id, payload);
			toast.success('Track added');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('addTrack', err);
			toast.error(getErrMsg(err, 'Add track failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const updateExistingTrack = async (trackKey, payload) => {
		if (!editForm || !editForm._id || !trackKey) return;
		setActionBusy(true);
		try {
			await svcUpdateTrack(editForm._id, trackKey, payload);
			toast.success('Track updated');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('updateTrack', err);
			toast.error(getErrMsg(err, 'Update track failed'));
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
			toast.success('Track removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('removeTrack', err);
			toast.error(getErrMsg(err, 'Remove track failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// faqs CRUD
	const addFaq = async (payload) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcAddFAQ(editForm._id, payload);
			toast.success('FAQ added');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('addFaq', err);
			toast.error(getErrMsg(err, 'Add FAQ failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const updateExistingFaq = async (faqId, payload) => {
		if (!editForm || !editForm._id || !faqId) return;
		setActionBusy(true);
		try {
			await svcUpdateFAQ(editForm._id, faqId, payload);
			toast.success('FAQ updated');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('updateFaq', err);
			toast.error(getErrMsg(err, 'Update FAQ failed'));
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
			toast.success('FAQ removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('removeFaq', err);
			toast.error(getErrMsg(err, 'Remove FAQ failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// tracks reorder
	const reorderTracks = async (fromIdx, toIdx) => {
		if (!editForm || !editForm._id) return;
		const tracks = editForm.tracks || [];
		if (
			fromIdx < 0 ||
			toIdx < 0 ||
			fromIdx >= tracks.length ||
			toIdx >= tracks.length
		)
			return;
		const reordered = tracks.slice();
		const [moved] = reordered.splice(fromIdx, 1);
		reordered.splice(toIdx, 0, moved);
		try {
			await svcReorderTracks(
				editForm._id,
				reordered.map((t) => t.key)
			);
			toast.success('Tracks reordered');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('reorderTracks', err);
			toast.error(getErrMsg(err, 'Reorder tracks failed'));
		}
	};

	// media selection & bulk delete
	const toggleMediaSelect = (publicId) => {
		const s = new Set(mediaSelection);
		if (s.has(publicId)) s.delete(publicId);
		else s.add(publicId);
		setMediaSelection(s);
	};

	const bulkDeleteSelectedMedia = async () => {
		if (!editForm || !editForm._id) return;
		const ids = Array.from(mediaSelection);
		if (ids.length === 0) return toast('No media selected');
		if (!window.confirm(`Delete ${ids.length} media items? This cannot be undone.`)) return;
		setBulkDeleting(true);
		try {
			await svcBulkDeleteMedia(editForm._id, ids);
			toast.success('Media removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('bulkDeleteSelectedMedia', err);
			toast.error(getErrMsg(err, 'Bulk delete failed'));
		} finally {
			if (mountedRef.current) setBulkDeleting(false);
		}
	};

	// UI helpers
	const visibleFests = useMemo(() => fests || [], [fests]);

	// Render (keeps the rest of UI unchanged, adding new sections for full admin control)
	if (loading) return <LoadingSpinner text="Loading fests..." />;

	return (
		<div className="p-4 grid grid-cols-12 gap-4">
			<div className="col-span-3 space-y-4">
				<GlassCard className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-semibold text-white">Fests</h3>
						<button
							onClick={() => {
								void fetchFests();
							}}
							className="text-sm text-gray-400"
						>
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
							onClick={() => void loadAnalytics()}
							className="py-2 rounded bg-blue-600 text-white"
						>
							Load Analytics
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
							onClick={() => void loadStatistics()}
							className="py-2 rounded bg-indigo-700 text-white"
						>
							Load Statistics
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
									onClick={() => void generateReport()}
									disabled={actionBusy}
									className="px-4 py-2 bg-gray-800 text-white rounded"
								>
									Report
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
								value={editForm.startDate || ''}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, startDate: e.target.value }))
								}
								className="p-3 bg-white/5 rounded"
							/>
							<input
								type="datetime-local"
								value={editForm.endDate || ''}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, endDate: e.target.value }))
								}
								className="p-3 bg-white/5 rounded"
							/>
						</div>

						{/* Poster & gallery */}
						<div className="mb-4">
							<h4 className="font-semibold text-white mb-2">Poster</h4>
							{editForm.poster ? (
								<div className="flex items-center gap-4 mb-2">
									<img
										src={editForm.poster.url}
										alt="poster"
										className="w-40 h-24 object-cover rounded"
									/>
									<div className="text-sm text-gray-400">
										{editForm.poster.caption || ''}
									</div>
								</div>
							) : (
								<div className="text-sm text-gray-400 mb-2">No poster</div>
							)}
							<input
								type="file"
								accept="image/*"
								onChange={(e) => void uploadPoster(e.target.files?.[0])}
								disabled={actionBusy}
							/>
						</div>

						<div className="mb-4">
							<h4 className="font-semibold text-white mb-2">Hero Image</h4>
							{editForm.hero ? (
								<div className="flex items-center gap-4 mb-2">
									<img
										src={editForm.hero.url}
										alt="hero"
										className="w-40 h-24 object-cover rounded"
									/>
									<div className="text-sm text-gray-400">
										{editForm.hero.caption || ''}
									</div>
								</div>
							) : (
								<div className="text-sm text-gray-400 mb-2">No hero image</div>
							)}
							<input
								type="file"
								accept="image/*"
								onChange={(e) => void uploadHero(e.target.files?.[0])}
								disabled={actionBusy}
							/>
						</div>

						<div className="mb-4">
							<h4 className="font-semibold text-white mb-2">Gallery</h4>
							<div className="flex gap-2 flex-wrap mb-2">
								{(editForm.gallery || []).map((g) => (
									<div
										key={g.publicId}
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
								{(editForm.gallery || []).length === 0 && (
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
								{/* quick add */}
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
										<div>
											<button
												onClick={() => void removeExistingPartner(p.name)}
												className="text-red-400"
											>
												Remove
											</button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Events linked */}
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

						{/* Presentation / Social Links / Theme Colors */}
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
									</select>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Status
									</label>
									<select
										value={editForm.status}
										onChange={(e) => handleSetStatus(e.target.value)}
										className="p-3 bg-white/5 rounded w-full"
									>
										<option value="draft">Draft</option>
										<option value="active">Active</option>
										<option value="archived">Archived</option>
									</select>
								</div>
								<div className="col-span-2">
									<label className="block text-sm text-gray-400 mb-1">
										Social Links
									</label>
									<textarea
										value={JSON.stringify(
											presentationDraft.socialLinks,
											null,
											2
										)}
										onChange={(e) =>
											setPresentationDraft((s) => ({
												...s,
												socialLinks: JSON.parse(e.target.value),
											}))
										}
										className="p-3 bg-white/5 rounded w-full"
										rows={3}
										placeholder='{"facebook": "...", "twitter": "..."}'
									/>
								</div>
								<div className="col-span-2">
									<label className="block text-sm text-gray-400 mb-1">
										Theme Colors
									</label>
									<textarea
										value={JSON.stringify(
											presentationDraft.themeColors,
											null,
											2
										)}
										onChange={(e) =>
											setPresentationDraft((s) => ({
												...s,
												themeColors: JSON.parse(e.target.value),
											}))
										}
										className="p-3 bg-white/5 rounded w-full"
										rows={3}
										placeholder='{"primary": "#hex", "secondary": "#hex"}'
									/>
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

						{/* Tracks */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-semibold text-white">
									Tracks ({(editForm.tracks || []).length})
								</h4>
								<button
									onClick={() => {
										const title = prompt('Enter track title');
										if (title) void addTrack({ title });
									}}
									className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
								>
									Add Track
								</button>
							</div>

							<div className="space-y-2">
								{(editForm.tracks || []).map((track, idx) => (
									<div
										key={track.key}
										className="flex items-center justify-between p-3 bg-white/3 rounded"
									>
										<div className="flex-1">
											<div className="font-medium text-white">
												{track.title}
											</div>
											<div className="text-sm text-gray-400">
												{track.speakers?.join(', ') || 'No speakers'}
											</div>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => {
													const newTitle = prompt(
														'Enter new title',
														track.title
													);
													if (newTitle && newTitle !== track.title) {
														void updateExistingTrack(track.key, {
															title: newTitle,
														});
													}
												}}
												className="text-blue-400"
												title="Edit track"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M16 4l4 4-8 8-4-4 8-8zm0 0l-4 4-4-4m8 8l-4 4-4-4"
													/>
												</svg>
											</button>
											<button
												onClick={() => void removeExistingTrack(track.key)}
												className="text-red-400"
												title="Remove track"
											>
												<Trash2 className="w-5 h-5" />
											</button>
											<button
												onClick={() => {
													void reorderTracks(idx, idx - 1);
												}}
												disabled={idx === 0}
												className="text-gray-400"
												title="Move up"
											>
												<ArrowUp className="w-5 h-5" />
											</button>
											<button
												onClick={() => {
													void reorderTracks(idx, idx + 1);
												}}
												disabled={idx === editForm.tracks.length - 1}
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

						{/* FAQs */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-semibold text-white">
									FAQs ({(editForm.faqs || []).length})
								</h4>
								<button
									onClick={() => {
										const question = prompt('Enter FAQ question');
										if (question) void addFaq({ question });
									}}
									className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
								>
									Add FAQ
								</button>
							</div>

							<div className="space-y-2">
								{(editForm.faqs || []).map((faq) => (
									<div
										key={faq.id}
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
										<div className="flex gap-2">
											<button
												onClick={() => {
													const newAnswer = prompt(
														'Enter new answer',
														faq.answer
													);
													if (newAnswer && newAnswer !== faq.answer) {
														void updateExistingFaq(faq.id, {
															answer: newAnswer,
														});
													}
												}}
												className="text-blue-400"
												title="Edit FAQ"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M16 4l4 4-8 8-4-4 8-8zm0 0l-4 4-4-4m8 8l-4 4-4-4"
													/>
												</svg>
											</button>
											<button
												onClick={() => void removeExistingFaq(faq.id)}
												className="text-red-400"
												title="Remove FAQ"
											>
												<Trash2 className="w-5 h-5" />
											</button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Media bulk actions */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-semibold text-white">Media Actions</h4>
								<button
									onClick={() => {
										if (mediaSelection.size === 0) {
											toast('No media selected');
											return;
										}
										if (
											window.confirm(
												`Delete ${mediaSelection.size} media items? This cannot be undone.`
											)
										) {
											void bulkDeleteSelectedMedia();
										}
									}}
									className="px-3 py-1 rounded bg-red-600 text-white text-sm"
								>
									Delete Selected Media
								</button>
							</div>

							<div className="flex gap-2 flex-wrap">
								{(editForm.gallery || []).map((g) => (
									<div
										key={g.publicId}
										className="relative w-24 h-24 bg-gray-800 rounded overflow-hidden"
									>
										{g.url && (
											<img
												src={g.url}
												alt={g.caption || ''}
												className="object-cover w-full h-full"
											/>
										)}
										<div className="absolute top-0 right-0 p-1">
											<button
												onClick={() => toggleMediaSelect(g.publicId)}
												className={`p-1 rounded-full ${
													mediaSelection.has(g.publicId)
														? 'bg-purple-600 text-white'
														: 'bg-black/50 text-purple-600'
												}`}
												aria-label="Select media"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M3 3h18M3 12h18M3 21h18"
													/>
												</svg>
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					</GlassCard>
				)}
			</div>

			{/* Create modal simplified inline */}
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
