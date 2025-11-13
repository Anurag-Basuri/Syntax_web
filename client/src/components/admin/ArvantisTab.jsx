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
import { Loader2, Plus, X, Trash2, DownloadCloud, BarChart2, Search } from 'lucide-react';

/*
  Fixed & improved Arvantis admin tab
  - show latest fest by default
  - remove sorting/status filters per request
  - allow selecting a year to load that year's fest
  - defensive network/error handling
*/
const ArvantisTab = ({ setDashboardError = () => {} }) => {
	// Data
	const [fests, setFests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState([]);
	// UI state
	const [query, setQuery] = useState('');
	// removed statusFilter and sortBy per request
	// year selection
	const [years, setYears] = useState([]);
	const [selectedYear, setSelectedYear] = useState(null);

	const [page] = useState(1);
	const [limit] = useState(100);

	// create/edit
	const [createOpen, setCreateOpen] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);
	const [createForm, setCreateForm] = useState({
		year: new Date().getFullYear(),
		description: '',
		startDate: '',
		endDate: '',
	});
	const [editOpen, setEditOpen] = useState(false);
	const [editForm, setEditForm] = useState({
		name: 'Arvantis',
		description: '',
		startDate: '',
		endDate: '',
		status: 'upcoming',
		location: 'Lovely Professional University',
		contactEmail: '',
	});
	// active detail panel (we show one fest at a time)
	const [activeFest, setActiveFest] = useState(null);
	const [partners, setPartners] = useState([]);
	const [loadingPartners, setLoadingPartners] = useState(false);
	const [downloadingCSV, setDownloadingCSV] = useState(false);
	// local error
	const [localError, setLocalError] = useState('');

	// helper: safe download blob
	const downloadBlob = (blob, filename) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	/* --- NEW: load years and latest fest --- */
	const fetchYearsAndLatest = useCallback(async () => {
		setLoading(true);
		setLocalError('');
		try {
			// fetch a reasonably large list of fests to extract available years
			const res = await getAllFests(
				{ page: 1, limit, sortBy: 'year', sortOrder: 'desc' },
				{ admin: true }
			);
			const docs = Array.isArray(res.docs) ? res.docs : [];
			setFests(docs);
			// extract unique years sorted desc
			const yrs = Array.from(new Set(docs.map((d) => d.year))).sort((a, b) => b - a);
			setYears(yrs);
			// pick latest year if available
			const latest = yrs[0] ?? null;
			setSelectedYear(latest);
			if (latest !== null) {
				try {
					const details = await getFestDetails(latest, { admin: true });
					setActiveFest(details);
					setPartners(Array.isArray(details.partners) ? details.partners : []);
				} catch (err) {
					// fallback: if fetching by year fails, clear activeFest
					setActiveFest(null);
					setPartners([]);
					const msg = err?.message || 'Failed to load latest fest details.';
					setLocalError(msg);
					setDashboardError(msg);
				}
			} else {
				// no fests yet
				setActiveFest(null);
				setPartners([]);
			}
		} catch (err) {
			const msg = err?.message || 'Failed to fetch fests.';
			setLocalError(msg);
			setDashboardError(msg);
		} finally {
			setLoading(false);
		}
	}, [limit, setDashboardError]);

	// Fetch events (used for linking) once
	const fetchEvents = useCallback(async () => {
		try {
			const res = await getAllEvents({ page: 1, limit: 500 });
			setEvents(Array.isArray(res.docs) ? res.docs : []);
		} catch (err) {
			const msg = err?.message || 'Failed to fetch events.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	}, [setDashboardError]);

	useEffect(() => {
		fetchYearsAndLatest();
		fetchEvents();
	}, [fetchYearsAndLatest, fetchEvents]);

	// when user selects a year, load that fest
	const handleSelectYear = async (year) => {
		setSelectedYear(year);
		setLocalError('');
		if (!year) {
			setActiveFest(null);
			setPartners([]);
			return;
		}
		setLoading(true);
		try {
			const details = await getFestDetails(year, { admin: true });
			setActiveFest(details);
			setPartners(Array.isArray(details.partners) ? details.partners : []);
		} catch (err) {
			const msg = err?.message || `Failed to load fest for year ${year}.`;
			setLocalError(msg);
			setDashboardError(msg);
			setActiveFest(null);
			setPartners([]);
		} finally {
			setLoading(false);
		}
	};

	/* --- Remaining handlers mostly unchanged, operate on activeFest --- */
	/* Create Fest */
	const handleCreate = async (e) => {
		e?.preventDefault();
		setCreateLoading(true);
		setLocalError('');
		try {
			if (!createForm.startDate || !createForm.endDate) {
				throw new Error('Please provide start and end dates.');
			}
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
			// refresh years and latest
			await fetchYearsAndLatest();
		} catch (err) {
			const msg = err?.message || 'Failed to create fest.';
			setLocalError(msg);
			setDashboardError(msg);
		} finally {
			setCreateLoading(false);
		}
	};

	/* Open details (kept for card actions) */
	const openFest = async (fest) => {
		setLocalError('');
		if (!fest) return;
		try {
			const id = fest.slug || fest.year || fest._id;
			const details = await getFestDetails(id, { admin: true });
			setActiveFest(details);
			setPartners(Array.isArray(details.partners) ? details.partners : []);
			// set selected year to the fest year
			if (details.year) setSelectedYear(details.year);
		} catch (err) {
			const msg = err?.message || 'Failed to load fest details.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	/* Edit */
	const openEdit = (fest) => {
		setEditForm({
			name: fest.name || 'Arvantis',
			description: fest.description || '',
			startDate: fest.startDate ? new Date(fest.startDate).toISOString().slice(0, 10) : '',
			endDate: fest.endDate ? new Date(fest.endDate).toISOString().slice(0, 10) : '',
			status: fest.status || 'upcoming',
			location: fest.location || 'Lovely Professional University',
			contactEmail: fest.contactEmail || '',
		});
		setActiveFest(fest);
		setEditOpen(true);
	};

	const saveEdit = async () => {
		setLocalError('');
		if (!activeFest) return;
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			const payload = { ...editForm };
			delete payload.name;
			delete payload.location;
			await updateFestDetails(id, payload);
			setEditOpen(false);
			// refresh current fest
			await handleSelectYear(activeFest.year);
		} catch (err) {
			const msg = err?.message || 'Failed to update fest.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	/* Delete */
	const removeFest = async (fest) => {
		if (!fest) return;
		if (!window.confirm(`Delete "${fest.name}"? This cannot be undone.`)) return;
		try {
			const id = fest.slug || fest.year || fest._id;
			await deleteFest(id);
			// refresh years/latest
			await fetchYearsAndLatest();
		} catch (err) {
			const msg = err?.message || 'Failed to delete fest.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	/* Poster & Gallery (unchanged) */
	const uploadPoster = async (file) => {
		if (!activeFest || !file) return;
		setLocalError('');
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			const fd = new FormData();
			fd.append('poster', file);
			await updateFestPoster(id, fd);
			const refreshed = await getFestDetails(id, { admin: true });
			setActiveFest(refreshed);
			await fetchYearsAndLatest();
		} catch (err) {
			const msg = err?.message || 'Failed to upload poster.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	const addGallery = async (files) => {
		if (!activeFest || !files?.length) return;
		setLocalError('');
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			const fd = new FormData();
			for (const f of files) fd.append('media', f);
			await addGalleryMedia(id, fd);
			const refreshed = await getFestDetails(id, { admin: true });
			setActiveFest(refreshed);
			await fetchYearsAndLatest();
		} catch (err) {
			const msg = err?.message || 'Failed to add gallery media.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	const removeGalleryItem = async (publicId) => {
		if (!activeFest) return;
		setLocalError('');
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await removeGalleryMedia(id, publicId);
			const refreshed = await getFestDetails(id, { admin: true });
			setActiveFest(refreshed);
			await fetchYearsAndLatest();
		} catch (err) {
			const msg = err?.message || 'Failed to remove gallery media.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	/* Events linking (unchanged) */
	const handleLinkEvent = async (festOrEventId, maybeEventId) => {
		let fest = activeFest;
		let eventId = festOrEventId;
		if (maybeEventId !== undefined) {
			fest = festOrEventId;
			eventId = maybeEventId;
		}
		if (!fest || !eventId) return;
		setLocalError('');
		try {
			const id = fest.slug || fest.year || fest._id;
			await linkEventToFest(id, eventId);
			const refreshed = await getFestDetails(id, { admin: true });
			if (activeFest && String(activeFest._id) === String(fest._id)) {
				setActiveFest(refreshed);
			}
		} catch (err) {
			const msg = err?.message || 'Failed to link event.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	const handleUnlinkEvent = async (eventId) => {
		if (!activeFest || !eventId) return;
		if (!window.confirm('Unlink this event?')) return;
		setLocalError('');
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await unlinkEventFromFest(id, eventId);
			const refreshed = await getFestDetails(id, { admin: true });
			setActiveFest(refreshed);
		} catch (err) {
			const msg = err?.message || 'Failed to unlink event.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	/* Partners quick manage (unchanged) */
	const addNewPartner = async (fd) => {
		if (!activeFest) return;
		setLocalError('');
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await addPartner(id, fd);
			const refreshed = await getFestDetails(id, { admin: true });
			setPartners(refreshed.partners || []);
		} catch (err) {
			const msg = err?.message || 'Failed to add partner.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	const removeExistingPartner = async (partnerName) => {
		if (!activeFest) return;
		if (!window.confirm(`Remove partner "${partnerName}"?`)) return;
		setLocalError('');
		try {
			const id = activeFest.slug || activeFest.year || activeFest._id;
			await removePartner(id, partnerName);
			const refreshed = await getFestDetails(id, { admin: true });
			setPartners(refreshed.partners || []);
		} catch (err) {
			const msg = err?.message || 'Failed to remove partner.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	/* Analytics & CSV */
	const exportCSV = async () => {
		setDownloadingCSV(true);
		setLocalError('');
		try {
			const blob = await exportFestsCSV();
			downloadBlob(blob, `arvantis-fests-${new Date().toISOString()}.csv`);
		} catch (err) {
			const msg = err?.message || 'Failed to export CSV.';
			setLocalError(msg);
			setDashboardError(msg);
		} finally {
			setDownloadingCSV(false);
		}
	};

	const loadAnalytics = async () => {
		setLocalError('');
		try {
			const a = await getFestAnalytics();
			const s = await getFestStatistics();
			setPartners([]); // hide partners when analytics open
			setActiveFest({ __analytics: true, analytics: a, statistics: s });
		} catch (err) {
			const msg = err?.message || 'Failed to load analytics.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

	const generateReport = async (fest) => {
		setLocalError('');
		try {
			const id = fest.slug || fest.year || fest._id;
			const report = await generateFestReport(id);
			const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
			downloadBlob(blob, `arvantis-report-${id}.json`);
		} catch (err) {
			const msg = err?.message || 'Failed to generate report.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	};

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
						Showing latest fest by default. Select a year to view that year's fest.
					</p>
				</div>

				<div className="flex items-center gap-3">
					{/* keep search if desired */}
					<div className="relative">
						<input
							aria-label="Search fests"
							placeholder="Search fests..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="pl-10 pr-3 py-2 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<Search className="absolute left-3 top-2.5 text-gray-400" />
					</div>

					{/* Year selector: latest by default */}
					<select
						aria-label="Select fest year"
						value={selectedYear ?? ''}
						onChange={(e) =>
							handleSelectYear(e.target.value ? Number(e.target.value) : null)
						}
						className="p-2 rounded-lg bg-gray-800 text-gray-100"
					>
						<option value="">-- Select year (latest shown) --</option>
						{years.map((y) => (
							<option key={y} value={y}>
								{y}
							</option>
						))}
					</select>

					<button
						type="button"
						className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-lg shadow"
						onClick={() => fetchYearsAndLatest()}
					>
						Latest
					</button>

					<button
						type="button"
						className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-lg shadow"
						onClick={() => setCreateOpen(true)}
					>
						<Plus className="w-4 h-4" /> New Fest
					</button>

					<button
						type="button"
						title="Analytics"
						className="p-2 rounded-lg bg-gray-800 text-gray-200"
						onClick={loadAnalytics}
					>
						<BarChart2 />
					</button>

					<button
						type="button"
						title="Export CSV"
						className="p-2 rounded-lg bg-gray-800 text-gray-200"
						onClick={exportCSV}
						disabled={downloadingCSV}
					>
						<DownloadCloud />
					</button>
				</div>
			</header>

			{localError && <div className="mb-4 text-sm text-red-400">{localError}</div>}

			{/* Show single fest (latest or selected) */}
			{loading ? (
				<div className="py-20 flex justify-center">
					<Loader2 className="w-10 h-10 animate-spin text-white" />
				</div>
			) : activeFest ? (
				<div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-2xl shadow-lg border border-gray-700">
					<div className="flex items-start justify-between">
						<div>
							<h2 className="text-2xl font-bold text-white">{activeFest.name}</h2>
							<div className="text-sm text-gray-400">
								{activeFest.year} •{' '}
								{activeFest.location || 'Lovely Professional University'}
							</div>
							<p className="mt-3 text-sm text-gray-300">
								{activeFest.description || 'No description'}
							</p>
						</div>
						<span
							className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(
								activeFest.status
							)}`}
						>
							{activeFest.status}
						</span>
					</div>

					{/* actions */}
					<div className="mt-4 flex gap-2">
						<button
							type="button"
							className="px-3 py-2 bg-indigo-600 text-white rounded"
							onClick={() => openEdit(activeFest)}
						>
							Edit
						</button>
						<button
							type="button"
							className="px-3 py-2 bg-yellow-500 text-white rounded"
							onClick={() => generateReport(activeFest)}
						>
							Report
						</button>
						<button
							type="button"
							className="px-3 py-2 bg-red-600 text-white rounded"
							onClick={() => removeFest(activeFest)}
						>
							Delete
						</button>
					</div>

					{/* detail panel (partners, events, media) */}
					<div className="mt-6">
						{/* partners */}
						<div className="mb-4">
							<h4 className="text-sm text-gray-300">Partners</h4>
							<ul className="mt-2 space-y-2">
								{(partners || []).map((p) => (
									<li
										key={p.name}
										className="flex items-center justify-between bg-gray-800 p-2 rounded"
									>
										<div className="flex items-center gap-3">
											{p.logo?.url ? (
												<img
													src={p.logo.url}
													alt={p.name}
													className="w-10 h-10 rounded"
												/>
											) : (
												<div className="w-10 h-10 bg-gray-700 rounded" />
											)}
											<div>
												<div className="text-sm text-white">{p.name}</div>
												<div className="text-xs text-gray-400">
													{p.tier || '-'}
												</div>
											</div>
										</div>
										<button
											type="button"
											className="text-red-500"
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
							{/* quick add partner form (kept simple) */}
							<PartnerQuickAdd onAdd={(fd) => addNewPartner(fd)} />
						</div>

						{/* linked events */}
						<div className="mb-4">
							<h4 className="text-sm text-gray-300">Linked Events</h4>
							{(activeFest.events || []).length === 0 ? (
								<div className="text-xs text-gray-500 mt-2">No linked events</div>
							) : (
								<ul className="mt-2 space-y-2">
									{(activeFest.events || []).map((ev) => (
										<li
											key={ev._id || ev}
											className="flex items-center justify-between bg-gray-800 p-2 rounded"
										>
											<div className="text-sm text-white">
												{ev.title || ev}
											</div>
											<button
												type="button"
												className="text-sm text-red-500"
												onClick={() => handleUnlinkEvent(ev._id || ev)}
											>
												Unlink
											</button>
										</li>
									))}
								</ul>
							)}
							{/* link event select */}
							<div className="mt-2">
								<select
									className="bg-gray-800 text-gray-200 p-2 rounded"
									onChange={(e) => {
										const v = e.target.value;
										if (v) handleLinkEvent(activeFest, v);
										e.target.value = '';
									}}
								>
									<option value="">Link an event</option>
									{(events || []).map((ev) => (
										<option key={ev._id} value={ev._id}>
											{ev.title}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* media */}
						<div className="mb-4">
							<h4 className="text-sm text-gray-300">Media</h4>
							{activeFest.poster?.url && (
								<img
									src={activeFest.poster.url}
									alt="poster"
									className="w-full h-48 object-cover rounded-lg mb-3"
								/>
							)}
							<div className="flex gap-2 items-center">
								<input
									type="file"
									accept="image/*"
									onChange={(e) => uploadPoster(e.target.files?.[0])}
								/>
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={(e) => addGallery([...e.target.files])}
								/>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="text-center text-gray-400">
					No fest selected. Click "Latest" or choose a year to view that fest. You can
					also create a new fest.
				</div>
			)}

			{/* Create modal (unchanged) */}
			{createOpen && (
				<div
					className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
					role="dialog"
					aria-modal="true"
				>
					<div className="bg-gray-900 p-6 rounded-2xl w-full max-w-md">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-white">Create Fest</h3>
							<button
								type="button"
								className="text-gray-300"
								onClick={() => setCreateOpen(false)}
								aria-label="Close create dialog"
							>
								<X />
							</button>
						</div>
						<form onSubmit={handleCreate} className="space-y-3">
							<div className="grid grid-cols-2 gap-2">
								<input
									aria-label="Year"
									placeholder="Year"
									type="number"
									value={createForm.year}
									onChange={(e) =>
										setCreateForm({
											...createForm,
											year:
												Number(e.target.value) || new Date().getFullYear(),
										})
									}
									className="p-2 rounded bg-gray-800 text-white"
								/>
								<input
									placeholder="Location"
									value="Lovely Professional University"
									disabled
									className="p-2 rounded bg-gray-700 text-gray-300 cursor-not-allowed"
								/>
							</div>
							<textarea
								aria-label="Description"
								placeholder="Description"
								value={createForm.description}
								onChange={(e) =>
									setCreateForm({ ...createForm, description: e.target.value })
								}
								className="w-full p-2 rounded bg-gray-800 text-white h-24"
							/>
							<div className="grid grid-cols-2 gap-2">
								<input
									aria-label="Start date"
									type="date"
									value={createForm.startDate}
									onChange={(e) =>
										setCreateForm({ ...createForm, startDate: e.target.value })
									}
									className="p-2 rounded bg-gray-800 text-white"
								/>
								<input
									aria-label="End date"
									type="date"
									value={createForm.endDate}
									onChange={(e) =>
										setCreateForm({ ...createForm, endDate: e.target.value })
									}
									className="p-2 rounded bg-gray-800 text-white"
								/>
							</div>
							{localError && <div className="text-sm text-red-400">{localError}</div>}
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

			{/* Edit modal (unchanged) */}
			{editOpen && (
				<div
					className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
					role="dialog"
					aria-modal="true"
				>
					<div className="bg-gray-900 p-6 rounded-2xl w-full max-w-lg">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-white">Edit Fest</h3>
							<button
								type="button"
								className="text-gray-300"
								onClick={() => setEditOpen(false)}
								aria-label="Close edit dialog"
							>
								<X />
							</button>
						</div>
						<div className="space-y-3">
							<input
								value={editForm.name}
								disabled
								aria-label="Fest name (fixed)"
								className="w-full p-2 rounded bg-gray-700 text-gray-300 cursor-not-allowed"
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
							{localError && <div className="text-sm text-red-400">{localError}</div>}
							<div className="flex gap-2">
								<button
									type="button"
									className="flex-1 py-2 bg-indigo-600 text-white rounded"
									onClick={saveEdit}
								>
									Save
								</button>
								<button
									type="button"
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

/* Small helper component included inline to avoid missing import errors */
const PartnerQuickAdd = ({ onAdd = () => {} }) => {
	const [name, setName] = useState('');
	const [tier, setTier] = useState('sponsor');
	const [website, setWebsite] = useState('');
	const [logoFile, setLogoFile] = useState(null);
	const [adding, setAdding] = useState(false);
	const [err, setErr] = useState('');

	const submit = async () => {
		setErr('');
		if (!name || !logoFile) {
			setErr('Name and logo required');
			return;
		}
		setAdding(true);
		try {
			const fd = new FormData();
			fd.append('name', name);
			fd.append('tier', tier);
			if (website) fd.append('website', website);
			fd.append('logo', logoFile);
			await onAdd(fd);
			setName('');
			setTier('sponsor');
			setWebsite('');
			setLogoFile(null);
		} catch (e) {
			setErr(e?.message || 'Add partner failed');
		} finally {
			setAdding(false);
		}
	};

	return (
		<div className="mt-3 p-3 bg-gray-800 rounded">
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Partner name"
				className="w-full p-2 rounded bg-gray-700 text-white mb-2"
			/>
			<div className="flex gap-2 mb-2">
				<select
					value={tier}
					onChange={(e) => setTier(e.target.value)}
					className="p-2 bg-gray-700 rounded text-white"
				>
					<option value="sponsor">Sponsor</option>
					<option value="collaborator">Collaborator</option>
					<option value="other">Other</option>
				</select>
				<input
					value={website}
					onChange={(e) => setWebsite(e.target.value)}
					placeholder="Website (optional)"
					className="p-2 rounded bg-gray-700 text-white flex-1"
				/>
			</div>
			<input
				type="file"
				accept="image/*"
				onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
				className="mb-2"
			/>
			{err && <div className="text-xs text-red-400 mb-2">{err}</div>}
			<button
				type="button"
				className="w-full py-2 bg-green-600 rounded text-white"
				onClick={submit}
				disabled={adding}
			>
				{adding ? 'Adding...' : 'Add Partner'}
			</button>
		</div>
	);
};

export default ArvantisTab;
