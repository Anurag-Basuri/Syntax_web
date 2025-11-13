import React, { useEffect, useState, useCallback } from 'react';
import {
	getAllFests,
	getFestDetails,
	createFest,
	updateFestDetails,
	deleteFest,
	addPartner,
	removePartner,
	linkEventToFest,
	unlinkEventFromFest,
	updateFestPoster,
	addGalleryMedia,
	removeGalleryMedia,
	exportFestsCSV,
	getFestAnalytics,
	getFestStatistics,
	generateFestReport,
} from '../../services/arvantisServices.js';
import { getAllEvents } from '../../services/eventServices.js';
import {
	Loader2,
	Plus,
	X,
	Link2,
	Trash2,
	UploadCloud,
	DownloadCloud,
	BarChart2,
	FileText,
	Search,
} from 'lucide-react';

/*
  Premium ArvantisTab:
  - single unified admin UI
  - search & filter, card grid, concise modals, inline partner quick-actions
  - uses existing services
*/
const ArvantisTab = ({ setDashboardError }) => {
	const [fests, setFests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState([]);
	const [query, setQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [sortBy, setSortBy] = useState('year');
	const [page, setPage] = useState(1);
	const [limit] = useState(12);

	const [createOpen, setCreateOpen] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);
	const [createForm, setCreateForm] = useState({
		// 'name' removed — server will set name to "Arvantis"
		year: new Date().getFullYear(),
		description: '',
		startDate: '',
		endDate: '',
	});

	const [activeFest, setActiveFest] = useState(null); // details when opened
	const [editOpen, setEditOpen] = useState(false);
	const [editForm, setEditForm] = useState({});
	const [partners, setPartners] = useState([]);
	const [loadingPartners, setLoadingPartners] = useState(false);
	const [downloadingCSV, setDownloadingCSV] = useState(false);

	const fetchFests = useCallback(
		async (opts = {}) => {
			setLoading(true);
			try {
				const params = {
					page: opts.page ?? page,
					limit,
					sortBy,
					sortOrder: 'desc',
				};
				if (statusFilter) params.status = statusFilter;
				if (query) params.search = query;
				const res = await getAllFests(params, { admin: true });
				setFests(res.docs || []);
			} catch (err) {
				setDashboardError(err.message || 'Failed to fetch fests.');
			} finally {
				setLoading(false);
			}
		},
		[page, limit, sortBy, statusFilter, query, setDashboardError]
	);

	const fetchEvents = useCallback(async () => {
		try {
			const res = await getAllEvents({ page: 1, limit: 500 });
			setEvents(res.docs || []);
		} catch (err) {
			setDashboardError(err.message || 'Failed to fetch events.');
		}
	}, [setDashboardError]);

	useEffect(() => {
		fetchFests();
		fetchEvents();
	}, [fetchFests, fetchEvents]);

	// Debounced search UX (simple approach)
	useEffect(() => {
		const t = setTimeout(() => fetchFests({ page: 1 }), 350);
		return () => clearTimeout(t);
	}, [query, statusFilter, sortBy]); // eslint-disable-line

	/* Create Fest */
	const handleCreate = async (e) => {
		e?.preventDefault();
		setCreateLoading(true);
		try {
			// name is not required; server will set name="Arvantis" and location fixed to LPU
			if (!createForm.startDate || !createForm.endDate) {
				throw new Error('Please provide start and end dates.');
			}
			// send only allowed fields — server will add fixed name/location
			await createFest({
				year: createForm.year,
				description: createForm.description,
				startDate: createForm.startDate,
				endDate: createForm.endDate,
			});
			setCreateOpen(false);
			setCreateForm({
				year: new Date().getFullYear(),
				description: '',
				startDate: '',
				endDate: '',
			});
			await fetchFests({ page: 1 });
		} catch (err) {
			setDashboardError(err.message || 'Failed to create fest.');
		} finally {
			setCreateLoading(false);
		}
	};

	/* Open details */
	const openFest = async (fest) => {
		try {
			const details = await getFestDetails(fest.slug || fest.year || fest._id, {
				admin: true,
			});
			setActiveFest(details);
			setPartners(details.partners || []);
		} catch (err) {
			setDashboardError(err.message || 'Failed to load fest details.');
		}
	};

	/* Edit */
	const openEdit = (fest) => {
		setEditForm({
			name: fest.name || '',
			description: fest.description || '',
			startDate: fest.startDate ? new Date(fest.startDate).toISOString().slice(0, 10) : '',
			endDate: fest.endDate ? new Date(fest.endDate).toISOString().slice(0, 10) : '',
			status: fest.status || 'upcoming',
			location: fest.location || '',
			contactEmail: fest.contactEmail || '',
		});
		setActiveFest(fest);
		setEditOpen(true);
	};

	const saveEdit = async () => {
		if (!activeFest) return;
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await updateFestDetails(id, editForm);
			setEditOpen(false);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to update fest.');
		}
	};

	/* Delete */
	const removeFest = async (fest) => {
		if (!window.confirm(`Delete "${fest.name}"? This cannot be undone.`)) return;
		try {
			const id = fest.slug || fest.year || fest._id;
			await deleteFest(id);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to delete fest.');
		}
	};

	/* Poster & Gallery */
	const uploadPoster = async (file) => {
		if (!activeFest || !file) return;
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			const fd = new FormData();
			fd.append('poster', file);
			await updateFestPoster(id, fd);
			const refreshed = await getFestDetails(id, { admin: true });
			setActiveFest(refreshed);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to upload poster.');
		}
	};

	const addGallery = async (files) => {
		if (!activeFest || !files?.length) return;
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			const fd = new FormData();
			for (const f of files) fd.append('media', f);
			await addGalleryMedia(id, fd);
			const refreshed = await getFestDetails(id, { admin: true });
			setActiveFest(refreshed);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to add gallery media.');
		}
	};

	const removeGalleryItem = async (publicId) => {
		if (!activeFest) return;
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await removeGalleryMedia(id, publicId);
			const refreshed = await getFestDetails(id, { admin: true });
			setActiveFest(refreshed);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to remove gallery media.');
		}
	};

	/* Events linking */
	const handleLinkEvent = async (eventId) => {
		if (!activeFest || !eventId) return;
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await linkEventToFest(id, eventId);
			const refreshed = await getFestDetails(id, { admin: true });
			setActiveFest(refreshed);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to link event.');
		}
	};

	const handleUnlinkEvent = async (eventId) => {
		if (!activeFest || !eventId) return;
		if (!window.confirm('Unlink this event?')) return;
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await unlinkEventFromFest(id, eventId);
			const refreshed = await getFestDetails(id, { admin: true });
			setActiveFest(refreshed);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to unlink event.');
		}
	};

	/* Partners quick manage */
	const addNewPartner = async (fd) => {
		if (!activeFest) return;
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await addPartner(id, fd);
			const refreshed = await getFestDetails(id, { admin: true });
			setPartners(refreshed.partners || []);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to add partner.');
		}
	};

	const removeExistingPartner = async (partnerName) => {
		if (!activeFest) return;
		if (!window.confirm(`Remove partner "${partnerName}"?`)) return;
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await removePartner(id, partnerName);
			const refreshed = await getFestDetails(id, { admin: true });
			setPartners(refreshed.partners || []);
			await fetchFests();
		} catch (err) {
			setDashboardError(err.message || 'Failed to remove partner.');
		}
	};

	/* Analytics & CSV */
	const exportCSV = async () => {
		setDownloadingCSV(true);
		try {
			const blob = await exportFestsCSV();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `arvantis-fests-${new Date().toISOString()}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			setDashboardError(err.message || 'Failed to export CSV.');
		} finally {
			setDownloadingCSV(false);
		}
	};

	const loadAnalytics = async () => {
		try {
			const a = await getFestAnalytics();
			const s = await getFestStatistics();
			// quick show as modal-like card
			setPartners([]); // hide partners when analytics open
			setActiveFest({ __analytics: true, analytics: a, statistics: s });
		} catch (err) {
			setDashboardError(err.message || 'Failed to load analytics.');
		}
	};

	const generateReport = async (fest) => {
		try {
			const id = fest.slug || fest.year || fest._id;
			const report = await generateFestReport(id);
			const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `arvantis-report-${id}.json`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			setDashboardError(err.message || 'Failed to generate report.');
		}
	};

	/* UI helpers */
	const statusBadge = (s) => {
		const map = {
			upcoming: 'bg-indigo-100 text-indigo-800',
			ongoing: 'bg-green-100 text-green-800',
			completed: 'bg-gray-100 text-gray-800',
			cancelled: 'bg-red-100 text-red-800',
			postponed: 'bg-yellow-100 text-yellow-800',
		};
		return map[s] || 'bg-gray-100 text-gray-800';
	};

	return (
		<div className="max-w-7xl mx-auto py-6">
			<header className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-extrabold text-white">Arvantis — Admin</h1>
					<p className="text-sm text-gray-400">
						Manage fests, partners, media and analytics
					</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="relative">
						<input
							placeholder="Search fests..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="pl-10 pr-3 py-2 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<Search className="absolute left-3 top-2.5 text-gray-400" />
					</div>

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="p-2 rounded-lg bg-gray-800 text-gray-100"
					>
						<option value="">All statuses</option>
						<option value="upcoming">Upcoming</option>
						<option value="ongoing">Ongoing</option>
						<option value="completed">Completed</option>
						<option value="cancelled">Cancelled</option>
						<option value="postponed">Postponed</option>
					</select>

					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="p-2 rounded-lg bg-gray-800 text-gray-100"
					>
						<option value="year">Sort: Year</option>
						<option value="name">Sort: Name</option>
						<option value="startDate">Sort: Start Date</option>
					</select>

					<button
						className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-lg shadow"
						onClick={() => setCreateOpen(true)}
					>
						<Plus className="w-4 h-4" /> New Fest
					</button>

					<button
						title="Analytics"
						className="p-2 rounded-lg bg-gray-800 text-gray-200"
						onClick={loadAnalytics}
					>
						<BarChart2 />
					</button>

					<button
						title="Export CSV"
						className="p-2 rounded-lg bg-gray-800 text-gray-200"
						onClick={exportCSV}
						disabled={downloadingCSV}
					>
						<DownloadCloud />
					</button>
				</div>
			</header>

			{/* Grid */}
			{loading ? (
				<div className="py-20 flex justify-center">
					<Loader2 className="w-10 h-10 animate-spin text-white" />
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{fests.map((fest) => (
						<div
							key={fest._id || fest.slug || fest.year}
							className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 rounded-2xl shadow-lg border border-gray-700"
						>
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-lg font-semibold text-white">
										{fest.name}
									</h3>
									<div className="text-sm text-gray-400">
										{fest.year} • {fest.location || '—'}
									</div>
								</div>
								<span
									className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(
										fest.status
									)}`}
								>
									{fest.status}
								</span>
							</div>

							<p className="mt-3 text-sm text-gray-300 line-clamp-3">
								{fest.description || 'No description'}
							</p>

							<div className="mt-4 flex items-center justify-between">
								<div className="flex items-center gap-2 text-sm text-gray-300">
									<button
										className="px-2 py-1 bg-indigo-600 text-white rounded-md"
										onClick={() => openFest(fest)}
									>
										Open
									</button>
									<button
										className="px-2 py-1 bg-gray-700 text-white rounded-md"
										onClick={() => openEdit(fest)}
									>
										Edit
									</button>
									<button
										className="px-2 py-1 bg-yellow-500 text-white rounded-md"
										onClick={() => generateReport(fest)}
									>
										Report
									</button>
								</div>

								<div className="flex items-center gap-2">
									<select
										className="bg-gray-800 text-gray-200 p-1 rounded"
										onChange={(e) => handleLinkEvent(fest, e.target.value)}
										defaultValue=""
									>
										<option value="">Link event</option>
										{events.slice(0, 10).map((ev) => (
											<option key={ev._id} value={ev._id}>
												{ev.title}
											</option>
										))}
									</select>
									<button
										className="p-2 rounded bg-red-600 text-white"
										onClick={() => removeFest(fest)}
										title="Delete"
									>
										<Trash2 />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Active fest side panel / modal */}
			{activeFest && (
				<div className="fixed right-6 top-20 bottom-6 w-96 bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-4 shadow-xl overflow-auto z-50">
					<div className="flex items-start justify-between mb-3">
						<div>
							<h3 className="text-lg font-bold text-white">
								{activeFest.name || 'Analytics'}
							</h3>
							<p className="text-xs text-gray-400">
								{activeFest.year ? `${activeFest.year}` : ''}
							</p>
						</div>
						<button
							className="text-gray-300"
							onClick={() => {
								setActiveFest(null);
								setPartners([]);
							}}
						>
							<X />
						</button>
					</div>

					{/* analytics panel */}
					{activeFest.__analytics ? (
						<div>
							<h4 className="text-sm font-semibold text-gray-200">Overview</h4>
							<pre className="mt-2 text-xs text-gray-300 bg-gray-800 p-3 rounded">
								{JSON.stringify(
									{
										analytics: activeFest.analytics,
										statistics: activeFest.statistics,
									},
									null,
									2
								)}
							</pre>
						</div>
					) : (
						<>
							{activeFest.poster?.url && (
								<img
									src={activeFest.poster.url}
									alt="poster"
									className="w-full h-40 object-cover rounded-lg mb-3"
								/>
							)}
							<div className="text-sm text-gray-300 mb-3">
								{activeFest.description || '—'}
							</div>

							<div className="mb-3">
								<h5 className="text-xs text-gray-400 uppercase tracking-wide">
									Partners
								</h5>
								{loadingPartners ? (
									<div className="py-2 text-sm text-gray-400">Loading...</div>
								) : (
									<ul className="space-y-2 mt-2">
										{(partners || []).map((p) => (
											<li
												key={p.name}
												className="flex items-center justify-between bg-gray-800 p-2 rounded"
											>
												<div className="flex items-center gap-2">
													{p.logo?.url ? (
														<img
															src={p.logo.url}
															className="w-10 h-10 rounded"
														/>
													) : (
														<div className="w-10 h-10 bg-gray-700 rounded" />
													)}
													<div>
														<div className="text-sm text-white">
															{p.name}
														</div>
														<div className="text-xs text-gray-400">
															{p.tier || '-'}
														</div>
													</div>
												</div>
												<button
													className="text-red-500 text-sm"
													onClick={() => removeExistingPartner(p.name)}
												>
													Remove
												</button>
											</li>
										))}
										{(partners || []).length === 0 && (
											<div className="text-xs text-gray-500 mt-2">
												No partners yet
											</div>
										)}
									</ul>
								)}
							</div>

							<div className="mb-3">
								<h5 className="text-xs text-gray-400 uppercase tracking-wide">
									Linked Events
								</h5>
								{(activeFest.events || []).length === 0 ? (
									<div className="text-xs text-gray-500 mt-2">
										No linked events
									</div>
								) : (
									<ul className="mt-2 space-y-2">
										{(activeFest.events || []).map((ev) => (
											<li
												key={ev._id}
												className="flex items-center justify-between bg-gray-800 p-2 rounded"
											>
												<div>
													<div className="text-sm text-white">
														{ev.title}
													</div>
													<div className="text-xs text-gray-400">
														{new Date(ev.eventDate).toLocaleString()}
													</div>
												</div>
												<button
													className="text-sm text-red-500"
													onClick={() => handleUnlinkEvent(ev._id)}
												>
													Unlink
												</button>
											</li>
										))}
									</ul>
								)}
							</div>

							<div className="mt-4 space-y-2">
								<label className="text-xs text-gray-400">Upload poster</label>
								<input
									type="file"
									accept="image/*"
									onChange={(e) => uploadPoster(e.target.files?.[0])}
								/>
								<label className="text-xs text-gray-400">Add gallery images</label>
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={(e) => addGallery([...e.target.files])}
								/>
							</div>

							<div className="mt-4 flex gap-2">
								<button
									className="flex-1 py-2 bg-indigo-600 text-white rounded"
									onClick={() => openEdit(activeFest)}
								>
									Edit
								</button>
								<button
									className="flex-1 py-2 bg-gray-700 text-white rounded"
									onClick={() => generateReport(activeFest)}
								>
									Report
								</button>
							</div>
						</>
					)}
				</div>
			)}

			{/* Create modal */}
			{createOpen && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
					<div className="bg-gray-900 p-6 rounded-2xl w-full max-w-md">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-white">Create Fest</h3>
							<button className="text-gray-300" onClick={() => setCreateOpen(false)}>
								<X />
							</button>
						</div>
						<form onSubmit={handleCreate} className="space-y-3">
							{' '}
							<input
								placeholder="Name"
								value={createForm.name}
								onChange={(e) =>
									setCreateForm({ ...createForm, name: e.target.value })
								}
								className="w-full p-2 rounded bg-gray-800 text-white"
							/>
							{/* Name is fixed to "Arvantis" and not editable in the admin UI */}
							<div className="grid grid-cols-2 gap-2">
								<input
									placeholder="Year"
									type="number"
									value={createForm.year}
									onChange={(e) =>
										setCreateForm({
											...createForm,
											year: Number(e.target.value),
										})
									}
									className="p-2 rounded bg-gray-800 text-white"
								/>
								<input
									placeholder="Location"
									value={createForm.location}
									onChange={(e) =>
										setCreateForm({ ...createForm, location: e.target.value })
									}
									className="p-2 rounded bg-gray-800 text-white"
								/>
								{/* Location is fixed to Lovely Professional University */}
								<input
									placeholder="Location"
									value="Lovely Professional University"
									disabled
									className="p-2 rounded bg-gray-700 text-gray-300 cursor-not-allowed"
								/>
							</div>
							<textarea
								placeholder="Description"
								value={createForm.description}
								onChange={(e) =>
									setCreateForm({ ...createForm, description: e.target.value })
								}
								className="w-full p-2 rounded bg-gray-800 text-white h-24"
							/>
							<div className="grid grid-cols-2 gap-2">
								<input
									type="date"
									value={createForm.startDate}
									onChange={(e) =>
										setCreateForm({ ...createForm, startDate: e.target.value })
									}
									className="p-2 rounded bg-gray-800 text-white"
								/>
								<input
									type="date"
									value={createForm.endDate}
									onChange={(e) =>
										setCreateForm({ ...createForm, endDate: e.target.value })
									}
									className="p-2 rounded bg-gray-800 text-white"
								/>
							</div>
							<div className="flex gap-2">
								<button
									type="submit"
									disabled={createLoading}
									className="flex-1 py-2 bg-indigo-600 text-white rounded"
								>
									{createLoading ? 'Creating...' : 'Create'}
								</button>
								<button
									type="button"
									className="flex-1 py-2 bg-gray-700 text-white rounded"
									onClick={() => setCreateOpen(false)}
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit modal */}
			{editOpen && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
					<div className="bg-gray-900 p-6 rounded-2xl w-full max-w-lg">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-white">Edit Fest</h3>
							<button className="text-gray-300" onClick={() => setEditOpen(false)}>
								<X />
							</button>
						</div>
						<div className="space-y-3">
							<input
								value={editForm.name}
								onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
								className="w-full p-2 rounded bg-gray-800 text-white"
							/>
							<textarea
								value={editForm.description}
								onChange={(e) =>
									setEditForm({ ...editForm, description: e.target.value })
								}
								className="w-full p-2 rounded bg-gray-800 text-white h-28"
							/>
							<div className="grid grid-cols-2 gap-2">
								<input
									type="date"
									value={editForm.startDate}
									onChange={(e) =>
										setEditForm({ ...editForm, startDate: e.target.value })
									}
									className="p-2 rounded bg-gray-800 text-white"
								/>
								<input
									type="date"
									value={editForm.endDate}
									onChange={(e) =>
										setEditForm({ ...editForm, endDate: e.target.value })
									}
									className="p-2 rounded bg-gray-800 text-white"
								/>
							</div>
							<div className="flex gap-2">
								<button
									className="flex-1 py-2 bg-indigo-600 text-white rounded"
									onClick={saveEdit}
								>
									Save
								</button>
								<button
									className="flex-1 py-2 bg-gray-700 text-white rounded"
									onClick={() => setEditOpen(false)}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ArvantisTab;
