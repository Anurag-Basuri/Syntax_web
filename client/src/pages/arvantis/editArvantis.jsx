import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../../components/arvantis/Badge.jsx';
import GlassCard from '../../components/arvantis/GlassCard.jsx';
import EmptyState from '../../components/arvantis/EmptyState.jsx';
import LoadingSpinner from '../../components/arvantis/LoadingSpinner.jsx';
import PartnerQuickAdd from '../../components/arvantis/PartnerQuickAdd.jsx';

import * as svc from '../../services/arvantisServices.js';
import * as eventSvc from '../../services/eventServices.js';

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

	// admin UI state
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
	});
	const [editForm, setEditForm] = useState(null);

	const mountedRef = useRef(false);
	const firstSelectDoneRef = useRef(false);
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

	// Load list
	const fetchFests = useCallback(async () => {
		setLoading(true);
		try {
			const resp = await svc.getAllFests({ page: 1, limit: 200 }, { admin: true });
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
			setDashboardErrorRef.current?.(getErrMsg(err, 'Failed to load fests'));
			toast.error(getErrMsg(err, 'Failed to load fests'));
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	}, []); // loadFestDetails declared below via hoisting

	// Load events for linking
	const fetchEvents = useCallback(async (signal) => {
		try {
			const resp = await eventSvc.getAllEvents({ page: 1, limit: 500 }, { signal });
			if (mountedRef.current) setEvents(resp?.docs || []);
		} catch (err) {
			if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
			console.error('fetchEvents', err);
		}
	}, []);

	// Load a single fest details
	const loadFestDetails = useCallback(async (identifier) => {
		if (!identifier) {
			if (mountedRef.current) setEditForm(null);
			return;
		}
		setActionBusy(true);
		try {
			const data = await svc.getFestDetails(identifier, { admin: true });
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
				setEditForm({
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
					hero: data.hero || data.heroMedia || null,
					events: data.events || [],
					tracks: data.tracks || [],
					faqs: data.faqs || [],
					visibility: data.visibility || 'public',
					slug: data.slug,
				});
				setSelectedFestId(data._id);
				setMediaSelection(new Set());
			}
		} catch (err) {
			console.error('loadFestDetails', err);
			toast.error(getErrMsg(err, 'Failed to load fest details'));
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
			const payload = {
				year: Number(createForm.year),
				name: createForm.name,
				description: createForm.description,
				startDate: createForm.startDate || null,
				endDate: createForm.endDate || null,
			};
			const created = await svc.createFest(payload);
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

	// Update core details
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
			await svc.updateFestDetails(editForm._id, payload);
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

	// Delete fest
	const removeFest = async (fest) => {
		if (!fest || !fest._id) return;
		if (!window.confirm('Delete fest? This is irreversible.')) return;
		setActionBusy(true);
		try {
			await svc.deleteFest(fest._id);
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

	// Poster
	const uploadPoster = async (file) => {
		if (!file || !editForm || !editForm._id) return;
		if (file.size > MAX_FILE_SIZE) return toast.error('File too large (max 10MB)');
		if (!FILE_TYPES_IMAGES.includes(file.type)) return toast.error('Invalid image type');
		const fd = new FormData();
		fd.append('poster', file);
		setActionBusy(true);
		try {
			await svc.updateFestPoster(editForm._id, fd);
			toast.success('Poster uploaded');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('uploadPoster', err);
			toast.error(getErrMsg(err, 'Poster upload failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Hero
	const uploadHero = async (file, caption) => {
		if (!file || !editForm || !editForm._id) return;
		const fd = new FormData();
		fd.append('hero', file);
		if (caption) fd.append('caption', caption);
		setActionBusy(true);
		try {
			await svc.updateFestHero(editForm._id, fd);
			toast.success('Hero uploaded');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('uploadHero', err);
			toast.error(getErrMsg(err, 'Hero upload failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Gallery
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
			await svc.addGalleryMedia(editForm._id, fd);
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
			await svc.removeGalleryMedia(editForm._id, publicId);
			toast.success('Gallery item removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('removeGalleryItem', err);
			toast.error(getErrMsg(err, 'Remove failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Partners
	const addNewPartner = async (formData) => {
		if (!editForm || !editForm._id) throw new Error('No active fest');
		setActionBusy(true);
		try {
			await svc.addPartner(editForm._id, formData);
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
			await svc.updatePartner(editForm._id, partnerName, fd);
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
			await svc.removePartner(editForm._id, partnerName);
			toast.success('Partner removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('removeExistingPartner', err);
			toast.error(getErrMsg(err, 'Remove partner failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const reorderPartners = async (direction, idx) => {
		if (!editForm || !editForm._id) return;
		const newArr = (() => {
			const copy = (editForm.partners || []).slice();
			const i = idx;
			const j = i + (direction === 'up' ? -1 : 1);
			if (i < 0 || j < 0 || i >= copy.length || j >= copy.length) return copy;
			const tmp = copy[i];
			copy.splice(i, 1);
			copy.splice(j, 0, tmp);
			return copy;
		})();
		try {
			await svc.reorderPartners(
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

	// Events
	const handleLinkEvent = async (eventId) => {
		if (!eventId || !editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svc.linkEventToFest(editForm._id, eventId);
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
			await svc.unlinkEventFromFest(editForm._id, eventId);
			toast.success('Event unlinked');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('handleUnlinkEvent', err);
			toast.error(getErrMsg(err, 'Unlink failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Export CSV
	const exportCSV = async () => {
		setDownloadingCSV(true);
		try {
			const blob = await svc.exportFestsCSV();
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

	// Analytics / statistics / report
	const loadAnalytics = async () => {
		try {
			const analytics = await svc.getFestAnalytics();
			console.log('analytics', analytics);
			toast.success('Analytics loaded (console)');
		} catch (err) {
			console.error('loadAnalytics', err);
			toast.error(getErrMsg(err, 'Analytics failed'));
		}
	};

	const loadStatistics = async () => {
		try {
			const stats = await svc.getFestStatistics();
			console.log('statistics', stats);
			toast.success('Statistics loaded (console)');
		} catch (err) {
			console.error('loadStatistics', err);
			toast.error(getErrMsg(err, 'Statistics failed'));
		}
	};

	const generateReport = async () => {
		if (!editForm || !editForm._id) return;
		try {
			const report = await svc.generateFestReport(editForm._id);
			console.log('report', report);
			toast.success('Report generated (console)');
		} catch (err) {
			console.error('generateReport', err);
			toast.error(getErrMsg(err, 'Report failed'));
		}
	};

	// Duplicate & status
	const handleDuplicate = async (year) => {
		if (!editForm || !editForm._id || !year) return;
		if (!window.confirm(`Duplicate fest into year ${year}?`)) return;
		setActionBusy(true);
		try {
			await svc.duplicateFest(editForm._id, year);
			toast.success('Fest duplicated');
			await fetchFests();
		} catch (err) {
			console.error('handleDuplicate', err);
			toast.error(getErrMsg(err, 'Duplicate failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const handleSetStatus = async (status) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svc.setFestStatus(editForm._id, status);
			toast.success('Status updated');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('handleSetStatus', err);
			toast.error(getErrMsg(err, 'Status update failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Presentation/social/theme
	const savePresentation = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svc.updatePresentation(editForm._id, {
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
			await svc.updateSocialLinks(editForm._id, presentationDraft.socialLinks);
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
			await svc.updateThemeColors(editForm._id, presentationDraft.themeColors);
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

	// Tracks CRUD
	const addTrack = async (payload) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svc.addTrack(editForm._id, payload);
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
			await svc.updateTrack(editForm._id, trackKey, payload);
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
			await svc.removeTrack(editForm._id, trackKey);
			toast.success('Track removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('removeTrack', err);
			toast.error(getErrMsg(err, 'Remove track failed'));
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
		try {
			await svc.reorderTracks(
				editForm._id,
				reordered.map((t) => t.key)
			);
			toast.success('Tracks reordered');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('reorderTracks', err);
			toast.error(getErrMsg(err, 'Reorder failed'));
		}
	};

	// FAQs CRUD
	const addFaq = async (payload) => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svc.addFAQ(editForm._id, payload);
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
			await svc.updateFAQ(editForm._id, faqId, payload);
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
			await svc.removeFAQ(editForm._id, faqId);
			toast.success('FAQ removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('removeFaq', err);
			toast.error(getErrMsg(err, 'Remove FAQ failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	const reorderFaqs = async (orderIds) => {
		if (!editForm || !editForm._id || !Array.isArray(orderIds)) return;
		setActionBusy(true);
		try {
			await svc.reorderFAQs(editForm._id, orderIds);
			toast.success('FAQs reordered');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('reorderFaqs', err);
			toast.error(getErrMsg(err, 'Reorder failed'));
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	};

	// Media selection / bulk delete
	const toggleMediaSelect = (publicId) => {
		const s = new Set(mediaSelection);
		if (s.has(publicId)) s.delete(publicId);
		else s.add(publicId);
		setMediaSelection(s);
	};

	const bulkDeleteSelectedMedia = async () => {
		if (!editForm || !editForm._id) return;
		const ids = Array.from(mediaSelection);
		if (ids.length === 0) return toast.error('No media selected');
		if (!window.confirm(`Delete ${ids.length} media items? This cannot be undone.`)) return;
		setBulkDeleting(true);
		try {
			await svc.bulkDeleteMedia(editForm._id, ids);
			toast.success('Media removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error('bulkDeleteSelectedMedia', err);
			toast.error(getErrMsg(err, 'Bulk delete failed'));
		} finally {
			if (mountedRef.current) setBulkDeleting(false);
		}
	};

	// UI
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

						{/* Poster / Hero / Gallery / Partners / Events / Presentation / Tracks / FAQs / Media actions */}
						{/* Poster */}
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

						{/* Gallery */}
						<div className="mb-4">
							<h4 className="font-semibold text-white mb-2">Gallery</h4>
							<div className="flex gap-2 flex-wrap mb-2">
								{(editForm.gallery || []).map((g, i) => (
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
										onChange={(e) => handleSetStatus(e.target.value)}
										className="p-3 bg-white/5 rounded w-full"
									>
										<option value="upcoming">upcoming</option>
										<option value="ongoing">ongoing</option>
										<option value="completed">completed</option>
										<option value="cancelled">cancelled</option>
										<option value="postponed">postponed</option>
									</select>
								</div>

								<div className="col-span-2">
									<label className="block text-sm text-gray-400 mb-1">
										Social Links (JSON)
									</label>
									<textarea
										value={JSON.stringify(
											presentationDraft.socialLinks || {},
											null,
											2
										)}
										onChange={(e) => {
											try {
												setPresentationDraft((s) => ({
													...s,
													socialLinks: JSON.parse(e.target.value),
												}));
											} catch (err) {}
										}}
										className="p-3 bg-white/5 rounded w-full"
										rows={3}
										placeholder='{"twitter":"...", "website":"..."}'
									/>
								</div>

								<div className="col-span-2">
									<label className="block text-sm text-gray-400 mb-1">
										Theme Colors (JSON)
									</label>
									<textarea
										value={JSON.stringify(
											presentationDraft.themeColors || {},
											null,
											2
										)}
										onChange={(e) => {
											try {
												setPresentationDraft((s) => ({
													...s,
													themeColors: JSON.parse(e.target.value),
												}));
											} catch (err) {}
										}}
										className="p-3 bg-white/5 rounded w-full"
										rows={3}
										placeholder='{"primary":"#06b6d4"}'
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
												{track.description || ''}
											</div>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => {
													const newTitle = prompt(
														'Enter new title',
														track.title
													);
													if (newTitle && newTitle !== track.title)
														void updateExistingTrack(track.key, {
															title: newTitle,
														});
												}}
												className="text-blue-400"
												title="Edit track"
											>
												Edit
											</button>
											<button
												onClick={() => void removeExistingTrack(track.key)}
												className="text-red-400"
												title="Remove track"
											>
												<Trash2 className="w-5 h-5" />
											</button>
											<button
												onClick={() => void reorderTracks(idx, idx - 1)}
												disabled={idx === 0}
												className="text-gray-400"
												title="Move up"
											>
												<ArrowUp className="w-5 h-5" />
											</button>
											<button
												onClick={() => void reorderTracks(idx, idx + 1)}
												disabled={
													idx === (editForm.tracks || []).length - 1
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
								{(editForm.faqs || []).map((faq) => (
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
										<div className="flex gap-2">
											<button
												onClick={() => {
													const newAnswer = prompt(
														'Enter new answer',
														faq.answer
													);
													if (newAnswer && newAnswer !== faq.answer)
														void updateExistingFaq(faq._id || faq.id, {
															answer: newAnswer,
														});
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
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Media bulk actions */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-semibold text-white">Media Actions</h4>
								<div className="flex gap-2">
									<button
										onClick={() => {
											if (mediaSelection.size === 0)
												return toast.error('No media selected');
											if (
												window.confirm(
													`Delete ${mediaSelection.size} media items? This cannot be undone.`
												)
											)
												void bulkDeleteSelectedMedia();
										}}
										className="px-3 py-1 rounded bg-red-600 text-white text-sm"
										disabled={bulkDeleting}
									>
										{bulkDeleting ? 'Deleting...' : 'Delete Selected Media'}
									</button>
									<button
										onClick={() => setMediaSelection(new Set())}
										className="px-3 py-1 rounded bg-white/5 text-white text-sm"
									>
										Clear Selection
									</button>
								</div>
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
												{mediaSelection.has(g.publicId) ? '✓' : '+'}
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
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
