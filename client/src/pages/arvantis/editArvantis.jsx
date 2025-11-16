import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Loader2, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/arvantis/Badge';
import GlassCard from '../../components/arvantis/GlassCard';
import EmptyState from '../../components/arvantis/EmptyState';
import LoadingSpinner from '../../components/arvantis/LoadingSpinner';
import PartnerQuickAdd from '../../components/arvantis/PartnerQuickAdd';
import {
	getAllFests,
	getArvantisLandingData,
	getFestDetails,
	createFest as svcCreateFest,
	updateFestDetails as svcUpdateFest,
	deleteFest as svcDeleteFest,
	addPartner as svcAddPartner,
	removePartner as svcRemovePartner,
	updateFestPoster as svcUpdatePoster,
	addGalleryMedia as svcAddGallery,
	removeGalleryMedia as svcRemoveGallery,
	exportFestsCSV as svcExportCSV,
	getFestAnalytics as svcGetAnalytics,
	getFestStatistics as svcGetStatistics,
	generateFestReport as svcGenerateReport,
} from '../../services/arvantisServices';
import { getAllEvents as svcGetEvents } from '../../services/eventServices';

// Premium UI Components
import Badge from '../../components/arvantis/Badge';
import GlassCard from '../../components/arvantis/GlassCard';
import EmptyState from '../../components/arvantis/EmptyState';
import LoadingSpinner from '../../components/arvantis/LoadingSpinner';
import Toast from '../../components/arvantis/Toast';
import StatCard from '../../components/arvantis/StatCard';
import PartnerQuickAdd from '../../components/arvantis/PartnerQuickAdd';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FILE_TYPES_IMAGES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const safeFilename = (s = '') => String(s).replace(/[:]/g, '-').replace(/\s+/g, '-');

const ArvantisTab = ({ setDashboardError = () => {} }) => {
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

	const [createForm, setCreateForm] = useState({
		year: new Date().getFullYear(),
		description: '',
		startDate: '',
		endDate: '',
		name: 'Arvantis',
	});

	const [editForm, setEditForm] = useState(null);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	// load list of fests (paginated large limit)
	const fetchFests = useCallback(async () => {
		setLoading(true);
		try {
			const resp = await getAllFests({ page: 1, limit: 200 }, { admin: true });
			// normalizePagination returns { docs, ... }
			const docs = resp?.docs || [];
			if (mountedRef.current) setFests(docs);
		} catch (err) {
			console.error(err);
			setDashboardError(err?.message || 'Failed to load fests');
			toast.error(err?.message || 'Failed to load fests');
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	}, [setDashboardError]);

	// load events for linking
	const fetchEvents = useCallback(async () => {
		try {
			const resp = await svcGetEvents({ page: 1, limit: 500 }, { signal: undefined });
			// service returns normalized shape: { docs }
			const docs = resp?.docs || [];
			if (mountedRef.current) setEvents(docs);
		} catch (err) {
			console.error('fetchEvents', err);
		}
	}, []);

	useEffect(() => {
		fetchFests();
		fetchEvents();
	}, [fetchFests, fetchEvents]);

	// load selected fest details
	const loadFestDetails = useCallback(async (identifier) => {
		if (!identifier) {
			setEditForm(null);
			return;
		}
		setActionBusy(true);
		try {
			const data = await getFestDetails(identifier, { admin: true });
			// keep editable fields only
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
			};
			if (mountedRef.current) {
				setEditForm(form);
				setSelectedFestId(data._id);
			}
		} catch (err) {
			console.error('loadFestDetails', err);
			toast.error(err?.message || 'Failed to load fest details');
		} finally {
			if (mountedRef.current) setActionBusy(false);
		}
	}, []);

	useEffect(() => {
		// auto select first fest if none selected
		if (!selectedFestId && fests && fests.length > 0) {
			loadFestDetails(fests[0]._id);
		}
	}, [fests]); // eslint-disable-line

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
				startDate: createForm.startDate,
				endDate: createForm.endDate,
			};
			const created = await svcCreateFest(payload);
			toast.success('Fest created');
			await fetchFests();
			setCreateOpen(false);
			// open it
			if (created?._id) loadFestDetails(created._id);
		} catch (err) {
			console.error(err);
			setLocalError(err?.message || 'Create failed');
			toast.error(err?.message || 'Create failed');
		} finally {
			setCreateLoading(false);
		}
	};

	// save edit
	const saveEdit = async () => {
		if (!editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			const payload = {
				description: editForm.description,
				startDate: editForm.startDate,
				endDate: editForm.endDate,
				status: editForm.status,
				location: editForm.location,
				contactEmail: editForm.contactEmail,
			};
			await svcUpdateFest(editForm._id, payload);
			toast.success('Fest updated');
			await fetchFests();
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Update failed');
		} finally {
			setActionBusy(false);
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
			setEditForm(null);
			setSelectedFestId(null);
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Delete failed');
		} finally {
			setActionBusy(false);
		}
	};

	// poster upload
	const uploadPoster = async (file) => {
		if (!file) return;
		if (file.size > MAX_FILE_SIZE) return toast.error('File too large');
		const fd = new FormData();
		fd.append('poster', file);
		setActionBusy(true);
		try {
			const resp = await svcUpdatePoster(editForm._id, fd);
			toast.success('Poster uploaded');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Poster upload failed');
		} finally {
			setActionBusy(false);
		}
	};

	// gallery add
	const addGallery = async (files) => {
		if (!files || files.length === 0) return;
		const fd = new FormData();
		for (const f of files) {
			fd.append('media', f);
		}
		setActionBusy(true);
		try {
			await svcAddGallery(editForm._id, fd);
			toast.success('Gallery uploaded');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Gallery upload failed');
		} finally {
			setActionBusy(false);
		}
	};

	const removeGalleryItem = async (publicId) => {
		if (!publicId) return;
		if (!window.confirm('Remove gallery item?')) return;
		setActionBusy(true);
		try {
			await svcRemoveGallery(editForm._id, publicId);
			toast.success('Gallery item removed');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Remove failed');
		} finally {
			setActionBusy(false);
		}
	};

	// partners
	const addNewPartner = async (formData) => {
		if (!editForm || !editForm._id) throw new Error('No active fest');
		setActionBusy(true);
		try {
			// PartnerQuickAdd sends FormData
			await svcAddPartner(editForm._id, formData);
			toast.success('Partner added');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Add partner failed');
			throw err;
		} finally {
			setActionBusy(false);
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
			console.error(err);
			toast.error(err?.message || 'Remove partner failed');
		} finally {
			setActionBusy(false);
		}
	};

	// link/unlink events
	const handleLinkEvent = async (eventId) => {
		if (!eventId || !editForm || !editForm._id) return;
		setActionBusy(true);
		try {
			await svcLinkOrThrow(editForm._id, eventId); // helper defined below
			toast.success('Event linked');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Link failed');
		} finally {
			setActionBusy(false);
		}
	};

	// helper wrapper (call service directly since name differs in services)
	const svcLinkOrThrow = async (identifier, eventId) => {
		// uses arvantisServices.linkEventToFest - import not included above, create direct call
		const { linkEventToFest } = await import('../../services/arvantisServices');
		return linkEventToFest(identifier, eventId);
	};

	const handleUnlinkEvent = async (eventId) => {
		if (!eventId || !editForm || !editForm._id) return;
		if (!window.confirm('Unlink event from fest?')) return;
		setActionBusy(true);
		try {
			const { unlinkEventFromFest } = await import('../../services/arvantisServices');
			await unlinkEventFromFest(editForm._id, eventId);
			toast.success('Event unlinked');
			await loadFestDetails(editForm._id);
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Unlink failed');
		} finally {
			setActionBusy(false);
		}
	};

	// export CSV
	const exportCSV = async () => {
		setDownloadingCSV(true);
		try {
			const blob = await svcExportCSV();
			const url = window.URL.createObjectURL(new Blob([blob]));
			const a = document.createElement('a');
			a.href = url;
			a.download = `arvantis-fests-${safeFilename(new Date().toISOString())}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
			toast.success('CSV downloaded');
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Export failed');
		} finally {
			setDownloadingCSV(false);
		}
	};

	const loadAnalytics = async () => {
		try {
			const analytics = await svcGetAnalytics();
			console.log('analytics', analytics);
			toast.success('Analytics loaded (check console)');
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Analytics failed');
		}
	};

	const generateReport = async () => {
		if (!editForm || !editForm._id) return;
		try {
			const report = await svcGenerateReport(editForm._id);
			console.log('report', report);
			toast.success('Report generated (check console)');
		} catch (err) {
			console.error(err);
			toast.error(err?.message || 'Report failed');
		}
	};

	// UI helpers
	const visibleFests = useMemo(() => fests || [], [fests]);

	// Render
	if (loading) return <LoadingSpinner text="Loading fests..." />;

	return (
		<div className="p-4 grid grid-cols-12 gap-4">
			<div className="col-span-3 space-y-4">
				<GlassCard className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-semibold text-white">Fests</h3>
						<button onClick={() => fetchFests()} className="text-sm text-gray-400">
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
								onClick={() => loadFestDetails(f._id)}
								className={`w-full text-left p-3 rounded ${
									selectedFestId === f._id ? 'bg-purple-800/40' : 'bg-white/3'
								} transition`}
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
							onClick={exportCSV}
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
							onClick={loadAnalytics}
							className="py-2 rounded bg-blue-600 text-white"
						>
							Load Analytics
						</button>
						<button
							onClick={() => fetchEvents()}
							className="py-2 rounded bg-gray-700 text-white"
						>
							Refresh Events
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
									onClick={saveEdit}
									disabled={actionBusy}
									className="px-4 py-2 bg-emerald-600 text-white rounded"
								>
									Save
								</button>
								<button
									onClick={() => removeFest(editForm)}
									disabled={actionBusy}
									className="px-4 py-2 bg-red-600 text-white rounded"
								>
									Delete
								</button>
								<button
									onClick={generateReport}
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
								value={editForm.location}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, location: e.target.value }))
								}
								className="p-3 bg-white/5 rounded"
								placeholder="Location"
							/>
							<input
								value={editForm.contactEmail}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, contactEmail: e.target.value }))
								}
								className="p-3 bg-white/5 rounded"
								placeholder="Contact email"
							/>
							<textarea
								value={editForm.description}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, description: e.target.value }))
								}
								className="col-span-2 p-3 bg-white/5 rounded"
								rows={4}
								placeholder="Description"
							/>
							<input
								type="datetime-local"
								value={editForm.startDate}
								onChange={(e) =>
									setEditForm((s) => ({ ...s, startDate: e.target.value }))
								}
								className="p-3 bg-white/5 rounded"
							/>
							<input
								type="datetime-local"
								value={editForm.endDate}
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
								onChange={(e) => uploadPoster(e.target.files?.[0])}
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
											onClick={() => removeGalleryItem(g.publicId)}
											className="absolute top-1 right-1 p-1 bg-black/50 rounded text-red-400"
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
								onChange={(e) => addGallery(Array.from(e.target.files || []))}
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
										key={p.name + i}
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
												onClick={() => removeExistingPartner(p.name)}
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
									onChange={(e) => handleLinkEvent(e.target.value)}
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
												{new Date(ev.eventDate).toLocaleString()}
											</div>
										</div>
										<div>
											<button
												onClick={() => handleUnlinkEvent(ev._id)}
												className="text-red-400"
											>
												Unlink
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

export default ArvantisTab;
