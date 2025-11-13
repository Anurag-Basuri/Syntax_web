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
  Refactor & UX improvements:
  - Two-column layout: left = years & fest list; right = details/actions
  - Clear loading / action disabled states
  - Search + year filter for list
  - Explicit confirmations for destructive actions
  - Consistent identifier resolution (slug/year/_id)
  - Reusable small components (Badge, EmptyState)
*/

const Badge = ({ children, className = '' }) => (
	<span
		className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
	>
		{children}
	</span>
);

const EmptyState = ({ title, subtitle }) => (
	<div className="p-6 text-center text-gray-400">
		<div className="text-lg font-semibold mb-1">{title}</div>
		<div className="text-sm">{subtitle}</div>
	</div>
);

const ArvantisTab = ({ setDashboardError = () => {} }) => {
	// Data
	const [fests, setFests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState([]);
	// UI state
	const [query, setQuery] = useState('');
	const [years, setYears] = useState([]);
	const [selectedYear, setSelectedYear] = useState('');
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

	// Save edit handler
	const saveEdit = async () => {
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			const payload = {
				description: editForm.description,
				startDate: editForm.startDate,
				endDate: editForm.endDate,
				status: editForm.status,
				location: editForm.location,
				contactEmail: editForm.contactEmail,
			};
			await updateFestDetails(id, payload);
			await loadFestByIdentifier(id);
			await fetchYearsAndLatest();
			setEditOpen(false);
			showToast('Fest updated', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to save fest edits.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	// active detail panel (we show one fest at a time)
	const [activeFest, setActiveFest] = useState(null);
	const [partners, setPartners] = useState([]);
	const [loadingPartners, setLoadingPartners] = useState(false);
	const [downloadingCSV, setDownloadingCSV] = useState(false);
	const [actionBusy, setActionBusy] = useState(false);
	// local error
	const [localError, setLocalError] = useState('');
	const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

	// helper: normalize identifier for API usage (slug | year | _id)
	const resolveIdentifier = (festOrIdentifier) => {
		if (!festOrIdentifier) return '';
		if (typeof festOrIdentifier === 'string' || typeof festOrIdentifier === 'number')
			return String(festOrIdentifier);
		if (festOrIdentifier.slug) return String(festOrIdentifier.slug);
		if (festOrIdentifier.year) return String(festOrIdentifier.year);
		if (festOrIdentifier._id) return String(festOrIdentifier._id);
		return '';
	};

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

	// safe filename
	const safe = (s = '') => String(s).replace(/[:]/g, '-');

	// Load a fest details by identifier (slug/year/_id) and set UI state
	const loadFestByIdentifier = useCallback(
		async (identifier, { setSelected = true } = {}) => {
			if (!identifier) {
				setActiveFest(null);
				setPartners([]);
				if (setSelected) setSelectedYear('');
				return null;
			}
			setLoading(true);
			setLocalError('');
			try {
				const id = resolveIdentifier(identifier);
				const details = await getFestDetails(id, { admin: true });
				setActiveFest(details);
				setPartners(Array.isArray(details.partners) ? details.partners : []);
				if (setSelected && details.year) setSelectedYear(String(details.year));
				return details; // <-- now returns details for callers
			} catch (err) {
				const msg = err?.message || `Failed to load fest '${identifier}'.`;
				setLocalError(msg);
				setDashboardError(msg);
				setActiveFest(null);
				setPartners([]);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[setDashboardError]
	);

	/* --- load years and latest fest --- */
	const fetchYearsAndLatest = useCallback(async () => {
		setLoading(true);
		setLocalError('');
		try {
			const res = await getAllFests(
				{ page: 1, limit, sortBy: 'year', sortOrder: 'desc' },
				{ admin: true }
			);
			const docs = Array.isArray(res.docs) ? res.docs : [];
			setFests(docs);
			const yrs = Array.from(new Set(docs.map((d) => d.year)))
				.sort((a, b) => b - a)
				.map((y) => String(y));
			setYears(yrs);
			const latest = yrs[0] ?? '';
			setSelectedYear(latest);
			if (latest) {
				// automatically select the latest fest (first doc with that year)
				const latestFest = docs.find((d) => String(d.year) === latest);
				await loadFestByIdentifier(
					latestFest?.slug || latestFest?.year || latestFest?._id || latest,
					{
						setSelected: false,
					}
				);
			} else {
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
	}, [limit, loadFestByIdentifier, setDashboardError]);

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

	// single effect to initialize
	useEffect(() => {
		fetchYearsAndLatest();
		fetchEvents();
	}, [fetchYearsAndLatest, fetchEvents]);

	// when user selects a year, load that fest list and default fest for that year
	const handleSelectYear = async (yearStr) => {
		setSelectedYear(yearStr ?? '');
		setLocalError('');
		if (!yearStr) {
			setActiveFest(null);
			setPartners([]);
			return;
		}
		// pick first fest for that year from the cached list; if not found, just attempt by year
		const festForYear = fests.find((f) => String(f.year) === String(yearStr));
		await loadFestByIdentifier(
			festForYear?.slug || festForYear?.year || festForYear?._id || yearStr
		);
	};

	/* Filtered list for UI (was missing) */
	const visibleFests = (fests || [])
		.filter((f) => (!selectedYear ? true : String(f.year) === String(selectedYear)))
		.filter((f) => {
			if (!query) return true;
			const q = String(query).toLowerCase();
			return (
				String(f.year).includes(q) ||
				((f.name || '') + ' ' + (f.description || '') + ' ' + (f.slug || ''))
					.toLowerCase()
					.includes(q)
			);
		});

	/* Actions */

	// Toast helper
	const showToast = (message, type = 'success') => {
		setToast({ message, type });
		// auto-dismiss after 3.5s
		setTimeout(() => setToast(null), 3500);
	};

	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		setCreateLoading(true);
		setLocalError('');
		try {
			// validate minimal required fields
			const { year, description, startDate, endDate } = createForm;
			if (!year || !startDate || !endDate || !description) {
				throw new Error('Year, description and dates are required');
			}
			const payload = {
				year: Number(year),
				description,
				startDate,
				endDate,
			};
			const created = await createFest(payload);
			setCreateOpen(false);
			showToast('Fest created', 'success');
			// refresh lists and open new fest (prefer slug if returned)
			await fetchYearsAndLatest();
			const id = created?.slug || created?.year || created?._id;
			if (id) await loadFestByIdentifier(id);
		} catch (err) {
			const msg = err?.message || 'Failed to create fest.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setCreateLoading(false);
		}
	};

	const openEdit = async (fest) => {
		setLocalError('');
		setActionBusy(true);
		try {
			// use returned details to seed the edit form (avoid stale state)
			const details = await loadFestByIdentifier(resolveIdentifier(fest), {
				setSelected: false,
			});
			const s = details || fest || activeFest || {};
			setEditForm({
				name: s.name || 'Arvantis',
				description: s.description || '',
				startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0, 10) : '',
				endDate: s.endDate ? new Date(s.endDate).toISOString().slice(0, 10) : '',
				status: s.status || 'upcoming',
				location: s.location || 'Lovely Professional University',
				contactEmail: s.contactEmail || '',
			});
			setEditOpen(true);
		} catch (err) {
			const msg = err?.message || 'Failed to open edit';
			setLocalError(msg);
			setDashboardError(msg);
		} finally {
			setActionBusy(false);
		}
	};

	// quick status setter
	const quickSetStatus = async (newStatus) => {
		if (!activeFest || !newStatus) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			await updateFestDetails(id, { status: newStatus });
			await loadFestByIdentifier(id);
			await fetchYearsAndLatest();
			showToast('Status updated', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to update status.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	// Duplicate fest for next year (basic heuristic: shift dates by +1 year)
	const duplicateFest = async (fest) => {
		const source = fest || activeFest;
		if (!source) return;
		const confirmMsg = `Duplicate fest "${source.name || 'Arvantis'} — ${
			source.year
		}" for next year?`;
		if (!window.confirm(confirmMsg)) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const srcStart = source.startDate ? new Date(source.startDate) : null;
			const srcEnd = source.endDate ? new Date(source.endDate) : null;
			const nextYear = Number(source.year) + 1;
			// shift dates by +1 year if present, otherwise keep empty (server requires dates)
			if (!srcStart || !srcEnd)
				throw new Error('Source fest does not have valid dates to duplicate.');
			const newStart = new Date(srcStart);
			newStart.setFullYear(newStart.getFullYear() + 1);
			const newEnd = new Date(srcEnd);
			newEnd.setFullYear(newEnd.getFullYear() + 1);

			const payload = {
				year: nextYear,
				description: source.description || '',
				startDate: newStart.toISOString(),
				endDate: newEnd.toISOString(),
				status: 'upcoming',
			};
			const created = await createFest(payload);
			await fetchYearsAndLatest();
			const id = created?.slug || created?.year || created?._id;
			if (id) await loadFestByIdentifier(id);
			showToast('Fest duplicated', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to duplicate fest.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const exportCSV = async () => {
		setDownloadingCSV(true);
		setLocalError('');
		try {
			const blob = await exportFestsCSV();
			downloadBlob(blob, `arvantis-fests-${safe(new Date().toISOString())}.csv`);
		} catch (err) {
			const msg = err?.message || 'Failed to export CSV.';
			setLocalError(msg);
			setDashboardError(msg);
		} finally {
			setDownloadingCSV(false);
		}
	};

	const removeFest = async (fest) => {
		if (!fest) return;
		if (!window.confirm(`Delete "${fest.name || fest.year}"? This cannot be undone.`)) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(fest);
			await deleteFest(id);
			await fetchYearsAndLatest();
			showToast('Fest deleted', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to delete fest.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const uploadPoster = async (file) => {
		if (!activeFest || !file) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			const fd = new FormData();
			fd.append('poster', file);
			await updateFestPoster(id, fd);
			await loadFestByIdentifier(id);
			await fetchYearsAndLatest();
			showToast('Poster uploaded', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to upload poster.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const addGallery = async (files) => {
		if (!activeFest || !files?.length) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			const fd = new FormData();
			for (const f of files) fd.append('media', f);
			await addGalleryMedia(id, fd);
			await loadFestByIdentifier(id);
			await fetchYearsAndLatest();
			showToast('Gallery updated', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to add gallery media.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const removeGalleryItem = async (publicId) => {
		if (!activeFest) return;
		if (!window.confirm('Remove this media item?')) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			await removeGalleryMedia(id, publicId);
			await loadFestByIdentifier(id);
			await fetchYearsAndLatest();
			showToast('Media removed', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to remove gallery media.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const handleLinkEvent = async (festOrEventId, maybeEventId) => {
		let fest = activeFest;
		let eventId = festOrEventId;
		if (maybeEventId !== undefined) {
			fest = festOrEventId;
			eventId = maybeEventId;
		}
		if (!fest || !eventId) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(fest);
			await linkEventToFest(id, eventId);
			await loadFestByIdentifier(id);
			showToast('Event linked', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to link event.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const handleUnlinkEvent = async (eventId) => {
		if (!activeFest || !eventId) return;
		if (!window.confirm('Unlink this event?')) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			await unlinkEventFromFest(id, eventId);
			await loadFestByIdentifier(id);
			showToast('Event unlinked', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to unlink event.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const addNewPartner = async (fd) => {
		if (!activeFest) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			await addPartner(id, fd);
			await loadFestByIdentifier(id);
			showToast('Partner added', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to add partner.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const removeExistingPartner = async (partnerName) => {
		if (!activeFest) return;
		if (!window.confirm(`Remove partner "${partnerName}"?`)) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			await removePartner(id, partnerName);
			await loadFestByIdentifier(id);
			showToast('Partner removed', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to remove partner.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const loadAnalytics = async () => {
		setLocalError('');
		setActionBusy(true);
		try {
			const a = await getFestAnalytics();
			const s = await getFestStatistics();
			setPartners([]); // hide partners when analytics open
			setActiveFest({ __analytics: true, analytics: a, statistics: s });
		} catch (err) {
			const msg = err?.message || 'Failed to load analytics.';
			setLocalError(msg);
			setDashboardError(msg);
		} finally {
			setActionBusy(false);
		}
	};

	const generateReport = async (fest) => {
		if (!fest) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(fest);
			const report = await generateFestReport(id);
			const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
			downloadBlob(blob, `arvantis-report-${safe(id)}.json`);
			showToast('Report generated', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to generate report.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
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

	/* UI render */
	return (
		<div className="max-w-7xl mx-auto py-6">
			<header className="flex items-center justify-between mb-4">
				<div>
					<h1 className="text-2xl font-extrabold text-white">Arvantis — Admin</h1>
					<p className="text-sm text-gray-400">
						Latest fest opens automatically. Select another year to edit previous fests.
					</p>
				</div>

				<div className="flex items-center gap-3">
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
						disabled={actionBusy}
					>
						<BarChart2 />
					</button>

					<button
						type="button"
						title="Export CSV"
						className="p-2 rounded-lg bg-gray-800 text-gray-200"
						onClick={exportCSV}
						disabled={downloadingCSV || actionBusy}
					>
						<DownloadCloud />
					</button>
				</div>
			</header>

			{localError && <div className="mb-4 text-sm text-red-400">{localError}</div>}

			{/* Two-column layout */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				{/* Left: list */}
				<aside className="md:col-span-1 bg-gray-900/40 p-4 rounded-lg border border-gray-800">
					<div className="flex items-center justify-between mb-3">
						<select
							aria-label="Select year"
							value={selectedYear}
							onChange={(e) => handleSelectYear(e.target.value)}
							className="p-2 rounded bg-gray-800 text-white w-2/3"
						>
							<option value="">All years</option>
							{years.map((y) => (
								<option key={y} value={y}>
									{y}
								</option>
							))}
						</select>
						<button
							onClick={() => fetchYearsAndLatest()}
							className="px-2 py-1 bg-indigo-600 text-white rounded"
							disabled={loading || actionBusy}
						>
							Latest
						</button>
					</div>

					<div className="space-y-2 max-h-[60vh] overflow-y-auto">
						{loading ? (
							<div className="py-12">
								<Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
							</div>
						) : visibleFests.length === 0 ? (
							<EmptyState
								title="No fests"
								subtitle="Create a new fest to get started."
							/>
						) : (
							visibleFests.map((f) => (
								<button
									key={f.slug || f._id || f.year}
									onClick={() => loadFestByIdentifier(f.slug || f.year || f._id)}
									className={`w-full text-left p-3 rounded-lg border ${
										activeFest &&
										resolveIdentifier(activeFest) === resolveIdentifier(f)
											? 'bg-indigo-700/20 border-indigo-600'
											: 'bg-gray-900/30 border-gray-800 hover:bg-gray-900/40'
									}`}
									disabled={actionBusy}
								>
									<div className="flex items-center justify-between">
										<div>
											<div className="text-sm font-semibold text-white">
												{f.name || 'Arvantis'} — {f.year}
											</div>
											<div className="text-xs text-gray-400 truncate">
												{f.description}
											</div>
										</div>
										<div className="flex flex-col items-end gap-1 ml-3">
											<Badge className={statusBadge(f.status)}>
												{f.status}
											</Badge>
											<div className="text-xs text-gray-400">
												{f.startDate
													? new Date(f.startDate).toLocaleDateString()
													: '-'}
											</div>
										</div>
									</div>
								</button>
							))
						)}
					</div>
				</aside>

				{/* Right: details */}
				<section className="md:col-span-3">
					{loading ? (
						<div className="py-20 flex justify-center">
							<Loader2 className="w-12 h-12 animate-spin text-white" />
						</div>
					) : activeFest ? (
						activeFest.__analytics ? (
							<div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-2xl shadow-lg border border-gray-700">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-2xl font-bold text-white">
											Arvantis — Analytics
										</h2>
										<p className="text-sm text-gray-400">
											Year-over-year analytics
										</p>
									</div>
									<div>
										<button
											className="px-3 py-2 bg-indigo-600 text-white rounded"
											onClick={() => fetchYearsAndLatest()}
										>
											Back
										</button>
									</div>
								</div>

								<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="p-4 bg-gray-800 rounded">
										<h4 className="text-sm text-gray-300 mb-2">Summary</h4>
										<pre className="text-xs text-gray-200 break-words">
											{JSON.stringify(activeFest.statistics || {}, null, 2)}
										</pre>
									</div>
									<div className="p-4 bg-gray-800 rounded">
										<h4 className="text-sm text-gray-300 mb-2">
											Yearly Analytics
										</h4>
										{(activeFest.analytics || []).length === 0 ? (
											<div className="text-xs text-gray-500">
												No analytics
											</div>
										) : (
											<ul className="text-xs text-gray-200 space-y-2">
												{activeFest.analytics.map((row) => (
													<li
														key={row.year}
														className="flex justify-between"
													>
														<span>{row.year}</span>
														<span>
															Events: {row.eventCount} • Partners:{' '}
															{row.partnerCount}
														</span>
													</li>
												))}
											</ul>
										)}
									</div>
								</div>
							</div>
						) : (
							<div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-2xl shadow-lg border border-gray-700">
								<div className="flex items-start justify-between">
									<div>
										<h2 className="text-2xl font-bold text-white">
											{activeFest.name || 'Arvantis'}
										</h2>
										<div className="text-sm text-gray-400">
											{activeFest.year ?? '-'} •{' '}
											{activeFest.location ||
												'Lovely Professional University'}
										</div>
										<p className="mt-3 text-sm text-gray-300">
											{activeFest.description || 'No description'}
										</p>
									</div>
									{(activeFest.status || activeFest.computedStatus) && (
										<Badge
											className={statusBadge(
												activeFest.status || activeFest.computedStatus
											)}
										>
											{activeFest.status || activeFest.computedStatus}
										</Badge>
									)}
								</div>

								<div className="mt-4 flex gap-2">
									<button
										type="button"
										className="px-3 py-2 bg-indigo-600 text-white rounded"
										onClick={() => openEdit(activeFest)}
										disabled={actionBusy}
									>
										Edit
									</button>
									<button
										type="button"
										className="px-3 py-2 bg-yellow-500 text-white rounded"
										onClick={() => generateReport(activeFest)}
										disabled={actionBusy}
									>
										Report
									</button>
									<button
										type="button"
										className="px-3 py-2 bg-red-600 text-white rounded"
										onClick={() => removeFest(activeFest)}
										disabled={actionBusy}
									>
										Delete
									</button>
									<button
										type="button"
										className="px-3 py-2 bg-gray-700 text-white rounded"
										onClick={() => duplicateFest(activeFest)}
										disabled={actionBusy}
									>
										Duplicate
									</button>
									{/* quick status */}
									<select
										className="ml-2 p-1 rounded bg-gray-800 text-white"
										value={activeFest.status || ''}
										onChange={(e) => quickSetStatus(e.target.value)}
										disabled={actionBusy}
									>
										<option value="">Status</option>
										<option value="upcoming">upcoming</option>
										<option value="ongoing">ongoing</option>
										<option value="completed">completed</option>
										<option value="cancelled">cancelled</option>
										<option value="postponed">postponed</option>
									</select>
								</div>

								{/* Panels */}
								<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* Partners */}
									<div>
										<h4 className="text-sm text-gray-300 mb-2">Partners</h4>
										<div className="space-y-2">
											{(partners || []).length === 0 ? (
												<div className="text-xs text-gray-500">
													No partners yet
												</div>
											) : (
												partners.map((p, idx) => (
													<div
														key={p.publicId || p.name || idx}
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
																<div className="text-sm text-white">
																	{p.name}
																</div>
																<div className="text-xs text-gray-400">
																	{p.tier || '-'}
																</div>
															</div>
														</div>
														<button
															type="button"
															className="text-red-500"
															onClick={() =>
																removeExistingPartner(p.name)
															}
															disabled={actionBusy}
														>
															Remove
														</button>
													</div>
												))
											)}
											<PartnerQuickAdd
												onAdd={(fd) => addNewPartner(fd)}
												disabled={actionBusy}
											/>
										</div>
									</div>

									{/* Events & Media */}
									<div>
										<h4 className="text-sm text-gray-300 mb-2">
											Linked Events
										</h4>
										{(activeFest.events || []).length === 0 ? (
											<div className="text-xs text-gray-500 mt-2">
												No linked events
											</div>
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
															onClick={() =>
																handleUnlinkEvent(ev._id || ev)
															}
															disabled={actionBusy}
														>
															Unlink
														</button>
													</li>
												))}
											</ul>
										)}

										<div className="mt-3">
											<select
												className="bg-gray-800 text-gray-200 p-2 rounded w-full"
												onChange={(e) => {
													const v = e.target.value;
													if (v) handleLinkEvent(activeFest, v);
													e.target.value = '';
												}}
												disabled={actionBusy}
											>
												<option value="">Link an event</option>
												{(events || []).map((ev) => (
													<option key={ev._id} value={ev._id}>
														{ev.title}
													</option>
												))}
											</select>
										</div>

										{/* Media */}
										<div className="mt-4">
											<h4 className="text-sm text-gray-300 mb-2">Media</h4>
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
													onChange={(e) =>
														uploadPoster(e.target.files?.[0])
													}
													disabled={actionBusy}
												/>
												<input
													type="file"
													accept="image/*"
													multiple
													onChange={(e) =>
														addGallery([...e.target.files])
													}
													disabled={actionBusy}
												/>
											</div>

											{/* Gallery thumbnails */}
											<div className="mt-3 grid grid-cols-3 gap-2">
												{(activeFest.gallery || []).map((g) => (
													<div key={g.publicId} className="relative">
														<img
															src={g.url}
															alt={g.caption || 'media'}
															className="w-full h-20 object-cover rounded"
														/>
														<button
															className="absolute top-1 right-1 bg-red-600/80 text-white rounded p-1 text-xs"
															onClick={() =>
																removeGalleryItem(g.publicId)
															}
															disabled={actionBusy}
														>
															Remove
														</button>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>
						)
					) : (
						<div className="bg-gray-900/40 p-6 rounded border border-gray-800">
							<EmptyState
								title="No fest selected"
								subtitle="Select a fest from the list or create a new one."
							/>
						</div>
					)}
				</section>
			</div>

			{/* Create modal */}
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
						<form onSubmit={handleCreateSubmit} className="space-y-3">
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

			{/* Edit modal */}
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
									disabled={actionBusy}
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

			{toast && (
				<div
					className={`fixed right-4 top-20 z-50 rounded px-4 py-2 ${
						toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
					} text-white`}
				>
					{toast.message}{' '}
					<button className="ml-3 underline" onClick={() => setToast(null)}>
						Dismiss
					</button>
				</div>
			)}
		</div>
	);
};

/* Small helper component included inline to avoid missing import errors */
const PartnerQuickAdd = ({ onAdd = () => {}, disabled = false }) => {
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
				disabled={disabled}
			/>
			<div className="flex gap-2 mb-2">
				<select
					value={tier}
					onChange={(e) => setTier(e.target.value)}
					className="p-2 bg-gray-700 rounded text-white"
					disabled={disabled}
				>
					<option value="sponsor">Sponsor</option>
					<option value="collaborator">Collaborator</option>
				</select>
				<input
					value={website}
					onChange={(e) => setWebsite(e.target.value)}
					placeholder="Website (optional)"
					className="p-2 rounded bg-gray-700 text-white flex-1"
					disabled={disabled}
				/>
			</div>
			<input
				type="file"
				accept="image/*"
				onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
				className="mb-2"
				disabled={disabled}
			/>
			{err && <div className="text-xs text-red-400 mb-2">{err}</div>}
			<button
				type="button"
				className="w-full py-2 bg-green-600 rounded text-white"
				onClick={submit}
				disabled={adding || disabled}
			>
				{adding ? 'Adding...' : 'Add Partner'}
			</button>
		</div>
	);
};

export default ArvantisTab;
