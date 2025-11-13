import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Search,
	Plus,
	Loader2,
	X,
	BarChart2,
	DownloadCloud,
	Calendar,
	MapPin,
	Users,
	Image,
	Film,
	Link2,
	Unlink,
	Copy,
	Trash2,
	Edit3,
	ChevronDown,
	ChevronUp,
	Star,
	Trophy,
	Sparkles,
} from 'lucide-react';
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
import { apiClient } from '../../services/api.js';

// Premium Badge Component
const Badge = ({ children, variant = 'default', className = '' }) => {
	const variants = {
		default: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
		upcoming: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
		ongoing: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
		completed: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
		cancelled: 'bg-red-500/20 text-red-300 border border-red-500/30',
		postponed: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
		sponsor:
			'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30',
		collaborator:
			'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30',
		premium:
			'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30',
	};

	return (
		<span
			className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${variants[variant]} ${className}`}
		>
			{children}
		</span>
	);
};

// Glass Card Component
const GlassCard = ({ children, className = '', hover = false }) => (
	<div
		className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${
			hover ? 'hover:bg-white/7 transition-all duration-300' : ''
		} ${className}`}
	>
		{children}
	</div>
);

// Empty State Component
const EmptyState = ({ title, subtitle, icon: Icon = Sparkles, action }) => (
	<GlassCard className="p-8 text-center">
		<div className="flex justify-center mb-4">
			<div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl">
				<Icon className="w-8 h-8 text-purple-300" />
			</div>
		</div>
		<h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
		<p className="text-gray-400 text-sm mb-4">{subtitle}</p>
		{action}
	</GlassCard>
);

// Loading Spinner Component
const LoadingSpinner = ({ size = 'lg', text = 'Loading...' }) => (
	<div className="flex flex-col items-center justify-center py-12">
		<div
			className={`animate-spin rounded-full border-b-2 border-t-2 border-purple-500 ${
				size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'
			}`}
		/>
		{text && <p className="mt-4 text-gray-400 text-sm">{text}</p>}
	</div>
);

// Toast Component
const Toast = ({ message, type = 'success', onDismiss }) => {
	const icons = {
		success: '✅',
		error: '❌',
		warning: '⚠️',
		info: 'ℹ️',
	};

	const backgrounds = {
		success: 'bg-gradient-to-r from-emerald-500 to-green-500',
		error: 'bg-gradient-to-r from-red-500 to-pink-500',
		warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
		info: 'bg-gradient-to-r from-blue-500 to-cyan-500',
	};

	return (
		<div
			className={`${backgrounds[type]} text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-right-full duration-500`}
		>
			<span className="text-lg">{icons[type]}</span>
			<span className="flex-1 font-medium">{message}</span>
			<button
				onClick={onDismiss}
				className="hover:bg-white/20 rounded-full p-1 transition-colors"
			>
				<X className="w-4 h-4" />
			</button>
		</div>
	);
};

// Main Component
const ArvantisTab = ({ setDashboardError = () => {} }) => {
	// Data states
	const [fests, setFests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState([]);

	// UI states
	const [query, setQuery] = useState('');
	const [years, setYears] = useState([]);
	const [selectedYear, setSelectedYear] = useState('');
	const [limit] = useState(100);
	const [expandedSections, setExpandedSections] = useState({
		partners: true,
		events: true,
		media: true,
	});

	// Modal states
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

	// Active fest states
	const [activeFest, setActiveFest] = useState(null);
	const [partners, setPartners] = useState([]);
	const [downloadingCSV, setDownloadingCSV] = useState(false);
	const [actionBusy, setActionBusy] = useState(false);
	const [localError, setLocalError] = useState('');
	const [toast, setToast] = useState(null);
	const toastTimeoutRef = useRef(null);

	// Helper functions (same as before)
	const resolveIdentifier = (festOrIdentifier) => {
		if (!festOrIdentifier) return '';
		if (typeof festOrIdentifier === 'string' || typeof festOrIdentifier === 'number')
			return String(festOrIdentifier);
		if (festOrIdentifier.slug) return String(festOrIdentifier.slug);
		if (festOrIdentifier.year) return String(festOrIdentifier.year);
		if (festOrIdentifier._id) return String(festOrIdentifier._id);
		return '';
	};

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

	const safeFilename = (s = '') => String(s).replace(/[:]/g, '-');

	const showToast = (message, type = 'success') => {
		setToast({ message, type });
		if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
		toastTimeoutRef.current = setTimeout(() => {
			setToast(null);
			toastTimeoutRef.current = null;
		}, 4000);
	};

	useEffect(() => {
		return () => {
			if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
		};
	}, []);

	// Data loading functions (same logic, premium UI)
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
				if (setSelected && details?.year) setSelectedYear(String(details.year));
				return details;
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

			const nowYear = new Date().getFullYear();
			const statusRank = (s) => {
				if (!s) return 0;
				if (s === 'ongoing') return 4;
				if (s === 'upcoming') return 3;
				if (s === 'completed') return 2;
				if (s === 'postponed') return 1;
				if (s === 'cancelled') return 0;
				return 0;
			};

			let candidate = null;
			const currentYearCandidates = docs
				.filter((d) => Number(d.year) === nowYear)
				.sort((a, b) => statusRank(b.status) - statusRank(a.status));
			if (
				currentYearCandidates.length > 0 &&
				statusRank(currentYearCandidates[0].status) > 1
			) {
				candidate = currentYearCandidates[0];
			}

			if (!candidate) {
				const prefer = docs
					.filter((d) => ['ongoing', 'upcoming'].includes(d.status))
					.sort((a, b) => b.year - a.year || statusRank(b.status) - statusRank(a.status));
				if (prefer.length) candidate = prefer[0];
			}

			if (!candidate) {
				const completed = docs
					.filter((d) => d.status === 'completed')
					.sort((a, b) => b.year - a.year);
				if (completed.length) candidate = completed[0];
			}

			if (!candidate && docs.length) candidate = docs[0];

			if (candidate) {
				const id = candidate.slug || candidate.year || candidate._id;
				setSelectedYear(String(candidate.year));
				await loadFestByIdentifier(id, { setSelected: false });
			} else {
				setActiveFest(null);
				setPartners([]);
				setSelectedYear('');
			}
		} catch (err) {
			const msg = err?.message || 'Failed to fetch fests.';
			setLocalError(msg);
			setDashboardError(msg);
		} finally {
			setLoading(false);
		}
	}, [limit, loadFestByIdentifier, setDashboardError]);

	const fetchEvents = useCallback(async () => {
		try {
			const resp = await apiClient.get('/api/v1/events', { params: { page: 1, limit: 500 } });
			const payload = resp?.data?.data ?? resp?.data;
			const docs = Array.isArray(payload?.docs)
				? payload.docs
				: Array.isArray(payload)
				? payload
				: Array.isArray(payload?.data)
				? payload.data
				: [];
			setEvents(docs);
		} catch (err) {
			const msg = err?.message || 'Failed to fetch events.';
			setLocalError(msg);
			setDashboardError(msg);
		}
	}, [limit, setDashboardError]);

	useEffect(() => {
		fetchYearsAndLatest();
		fetchEvents();
	}, [fetchYearsAndLatest, fetchEvents]);

	const handleSelectYear = async (yearStr) => {
		setSelectedYear(yearStr ?? '');
		setLocalError('');
		if (!yearStr) {
			setActiveFest(null);
			setPartners([]);
			return;
		}
		const festForYear = fests.find((f) => String(f.year) === String(yearStr));
		await loadFestByIdentifier(
			festForYear?.slug || festForYear?.year || festForYear?._id || yearStr
		);
	};

	const visibleFests = useMemo(
		() =>
			(fests || [])
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
				}),
		[fests, selectedYear, query]
	);

	// Action handlers (same logic)
	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		setCreateLoading(true);
		setLocalError('');
		try {
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
			showToast('Fest created successfully! 🎉', 'success');
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
			showToast('Fest updated successfully! ✨', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to save fest edits.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const openEdit = async (fest) => {
		setLocalError('');
		setActionBusy(true);
		try {
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

	const quickSetStatus = async (newStatus) => {
		if (!activeFest || !newStatus) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			await updateFestDetails(id, { status: newStatus });
			await loadFestByIdentifier(id);
			await fetchYearsAndLatest();
			showToast('Status updated! 🔄', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to update status.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const duplicateFest = async (fest) => {
		const source = fest || activeFest;
		if (!source) return;
		if (
			!window.confirm(
				`Duplicate fest "${source.name || 'Arvantis'} — ${source.year}" for next year?`
			)
		)
			return;
		setActionBusy(true);
		setLocalError('');
		try {
			const srcStart = source.startDate ? new Date(source.startDate) : null;
			const srcEnd = source.endDate ? new Date(source.endDate) : null;
			const nextYear = Number(source.year) + 1;
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
			showToast('Fest duplicated successfully! 🎊', 'success');
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
			downloadBlob(blob, `arvantis-fests-${safeFilename(new Date().toISOString())}.csv`);
			showToast('CSV exported successfully! 📊', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to export CSV.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
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
			showToast('Fest deleted successfully', 'success');
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
		if (!activeFest) {
			showToast('No active fest selected', 'error');
			return;
		}
		if (!file) {
			showToast('No file selected', 'error');
			return;
		}
		const MAX_FILE_SIZE = 10 * 1024 * 1024;
		const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
		if (!ALLOWED.includes(file.type)) {
			showToast('Invalid file type. Use JPG/PNG/GIF.', 'error');
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			showToast('File too large. Max 10 MB allowed.', 'error');
			return;
		}

		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			const fd = new FormData();
			fd.append('poster', file);
			await updateFestPoster(id, fd);
			await loadFestByIdentifier(id);
			await fetchYearsAndLatest();
			showToast('Poster uploaded successfully! 🖼️', 'success');
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
		if (!activeFest) {
			showToast('No active fest selected', 'error');
			return;
		}
		if (!files || !files.length) {
			showToast('No files selected for gallery', 'error');
			return;
		}
		const MAX_FILE_SIZE = 10 * 1024 * 1024;
		const ALLOWED = [
			'image/jpeg',
			'image/jpg',
			'image/png',
			'image/gif',
			'video/mp4',
			'video/webm',
		];
		for (const f of files) {
			if (!ALLOWED.includes(f.type)) {
				showToast(`Invalid file type: ${f.name}`, 'error');
				return;
			}
			if (f.size > MAX_FILE_SIZE) {
				showToast(`File too large: ${f.name}`, 'error');
				return;
			}
		}

		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			const fd = new FormData();
			for (const f of files) fd.append('media', f);
			await addGalleryMedia(id, fd);
			await loadFestByIdentifier(id);
			await fetchYearsAndLatest();
			showToast('Gallery updated successfully! 📸', 'success');
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
			showToast('Media removed successfully', 'success');
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
			showToast('Event linked successfully! 🔗', 'success');
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
			showToast('Event unlinked successfully', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to unlink event.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const addNewPartner = async (formData) => {
		if (!activeFest) return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(activeFest);
			await addPartner(id, formData);
			await loadFestByIdentifier(id);
			showToast('Partner added successfully! 🤝', 'success');
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
			showToast('Partner removed successfully', 'success');
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
			const analytics = await getFestAnalytics();
			const stats = await getFestStatistics();
			setActiveFest({ __analytics: true, analytics, statistics: stats });
			setPartners([]);
		} catch (err) {
			const msg = err?.message || 'Failed to load analytics.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
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
			downloadBlob(blob, `arvantis-report-${safeFilename(String(fest.year || id))}.json`);
			showToast('Report generated successfully! 📈', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to generate report.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const toggleSection = (section) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	// Premium UI Render
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
			{/* Header */}
			<GlassCard className="p-6 mb-6">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
							<Trophy className="w-8 h-8 text-white" />
						</div>
						<div>
							<h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
								Arvantis Manager
							</h1>
							<p className="text-gray-400 text-sm mt-1">
								Manage festivals, partners, and events in one place
							</p>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative flex-1 sm:flex-none">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input
								aria-label="Search fests"
								placeholder="Search fests..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="pl-10 pr-4 py-3 w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
							/>
						</div>

						<div className="flex gap-2">
							<button
								onClick={loadAnalytics}
								disabled={actionBusy}
								className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
								title="Analytics"
							>
								<BarChart2 className="w-5 h-5 text-gray-300" />
							</button>

							<button
								onClick={exportCSV}
								disabled={downloadingCSV || actionBusy}
								className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
								title="Export CSV"
							>
								<DownloadCloud className="w-5 h-5 text-gray-300" />
							</button>

							<button
								onClick={() => setCreateOpen(true)}
								className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
							>
								<Plus className="w-5 h-5" />
								New Fest
							</button>
						</div>
					</div>
				</div>
			</GlassCard>

			{localError && (
				<div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
					{localError}
				</div>
			)}

			{/* Main Content */}
			<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
				{/* Sidebar - Fest List */}
				<div className="xl:col-span-1 space-y-4">
					<GlassCard className="p-4">
						<div className="flex gap-2 mb-4">
							<select
								value={selectedYear}
								onChange={(e) => handleSelectYear(e.target.value)}
								className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
							>
								<option value="">All Years</option>
								{years.map((y) => (
									<option key={y} value={y}>
										{y}
									</option>
								))}
							</select>
							<button
								onClick={() => fetchYearsAndLatest()}
								disabled={loading || actionBusy}
								className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
							>
								<Sparkles className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-2 max-h-[60vh] overflow-y-auto">
							{loading ? (
								<LoadingSpinner size="md" text="Loading fests..." />
							) : visibleFests.length === 0 ? (
								<EmptyState
									title="No fests found"
									subtitle={
										query || selectedYear
											? 'Try adjusting your search'
											: 'Create your first fest to get started'
									}
									icon={Sparkles}
									action={
										<button
											onClick={() => setCreateOpen(true)}
											className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
										>
											Create Fest
										</button>
									}
								/>
							) : (
								visibleFests.map((f) => (
									<button
										key={f.slug || f._id || f.year}
										onClick={() =>
											loadFestByIdentifier(f.slug || f.year || f._id)
										}
										disabled={actionBusy}
										className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
											activeFest &&
											resolveIdentifier(activeFest) === resolveIdentifier(f)
												? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 shadow-lg'
												: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
										}`}
									>
										<div className="flex items-start justify-between">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-2">
													<h3 className="font-semibold text-white truncate">
														{f.name || 'Arvantis'} — {f.year}
													</h3>
													<Badge variant={f.status}>{f.status}</Badge>
												</div>
												<p className="text-sm text-gray-400 line-clamp-2 mb-2">
													{f.description}
												</p>
												<div className="flex items-center gap-4 text-xs text-gray-500">
													<div className="flex items-center gap-1">
														<Calendar className="w-3 h-3" />
														{f.startDate
															? new Date(
																	f.startDate
															  ).toLocaleDateString()
															: '-'}
													</div>
													<div className="flex items-center gap-1">
														<MapPin className="w-3 h-3" />
														{f.location || 'LPU'}
													</div>
												</div>
											</div>
										</div>
									</button>
								))
							)}
						</div>
					</GlassCard>
				</div>

				{/* Main Content - Fest Details */}
				<div className="xl:col-span-3">
					{loading ? (
						<GlassCard>
							<LoadingSpinner text="Loading fest details..." />
						</GlassCard>
					) : activeFest ? (
						activeFest.__analytics ? (
							<GlassCard className="p-6">
								<div className="flex items-center justify-between mb-6">
									<div>
										<h2 className="text-2xl font-bold text-white mb-2">
											Festival Analytics
										</h2>
										<p className="text-gray-400">
											Comprehensive insights and statistics
										</p>
									</div>
									<button
										onClick={() => fetchYearsAndLatest()}
										className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200"
									>
										Back to Fests
									</button>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<GlassCard className="p-6">
										<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
											<BarChart2 className="w-5 h-5 text-purple-400" />
											Statistics Summary
										</h3>
										<div className="space-y-3">
											{Object.entries(activeFest.statistics || {}).map(
												([key, value]) => (
													<div
														key={key}
														className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
													>
														<span className="text-gray-300 capitalize">
															{key.replace(/([A-Z])/g, ' $1')}
														</span>
														<span className="text-white font-semibold">
															{value}
														</span>
													</div>
												)
											)}
										</div>
									</GlassCard>

									<GlassCard className="p-6">
										<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
											<Sparkles className="w-5 h-5 text-purple-400" />
											Yearly Analytics
										</h3>
										<div className="space-y-3">
											{(activeFest.analytics || []).map((row) => (
												<div
													key={row.year}
													className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
												>
													<span className="text-white font-semibold">
														{row.year}
													</span>
													<div className="flex gap-4 text-sm">
														<span className="text-blue-300">
															{row.eventCount} events
														</span>
														<span className="text-green-300">
															{row.partnerCount} partners
														</span>
													</div>
												</div>
											))}
										</div>
									</GlassCard>
								</div>
							</GlassCard>
						) : (
							<div className="space-y-6">
								{/* Fest Header */}
								<GlassCard className="p-6">
									<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
										<div className="flex-1">
											<div className="flex items-center gap-4 mb-4">
												<h2 className="text-3xl font-bold text-white">
													{activeFest.name || 'Arvantis'}
												</h2>
												<Badge variant={activeFest.status}>
													{activeFest.status}
												</Badge>
											</div>

											<p className="text-gray-300 text-lg mb-4">
												{activeFest.description ||
													'No description provided'}
											</p>

											<div className="flex flex-wrap gap-4 text-sm text-gray-400">
												<div className="flex items-center gap-2">
													<Calendar className="w-4 h-4" />
													{activeFest.startDate && activeFest.endDate ? (
														<>
															{new Date(
																activeFest.startDate
															).toLocaleDateString()}{' '}
															-{' '}
															{new Date(
																activeFest.endDate
															).toLocaleDateString()}
														</>
													) : (
														'Dates not set'
													)}
												</div>
												<div className="flex items-center gap-2">
													<MapPin className="w-4 h-4" />
													{activeFest.location ||
														'Lovely Professional University'}
												</div>
												{activeFest.contactEmail && (
													<div className="flex items-center gap-2">
														<Users className="w-4 h-4" />
														{activeFest.contactEmail}
													</div>
												)}
											</div>
										</div>

										<div className="flex flex-wrap gap-2">
											<select
												value={activeFest.status || ''}
												onChange={(e) => quickSetStatus(e.target.value)}
												disabled={actionBusy}
												className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
											>
												<option value="">Change Status</option>
												<option value="upcoming">Upcoming</option>
												<option value="ongoing">Ongoing</option>
												<option value="completed">Completed</option>
												<option value="cancelled">Cancelled</option>
												<option value="postponed">Postponed</option>
											</select>

											<button
												onClick={() => openEdit(activeFest)}
												disabled={actionBusy}
												className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all duration-200"
											>
												<Edit3 className="w-4 h-4" />
												Edit
											</button>

											<button
												onClick={() => generateReport(activeFest)}
												disabled={actionBusy}
												className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all duration-200"
											>
												<BarChart2 className="w-4 h-4" />
												Report
											</button>

											<button
												onClick={() => duplicateFest(activeFest)}
												disabled={actionBusy}
												className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl hover:bg-green-500/30 transition-all duration-200"
											>
												<Copy className="w-4 h-4" />
												Duplicate
											</button>

											<button
												onClick={() => removeFest(activeFest)}
												disabled={actionBusy}
												className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/30 transition-all duration-200"
											>
												<Trash2 className="w-4 h-4" />
												Delete
											</button>
										</div>
									</div>
								</GlassCard>

								{/* Partners & Events Grid */}
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{/* Partners Section */}
									<GlassCard className="p-6">
										<div
											className="flex items-center justify-between cursor-pointer mb-4"
											onClick={() => toggleSection('partners')}
										>
											<h3 className="text-xl font-semibold text-white flex items-center gap-2">
												<Users className="w-5 h-5 text-purple-400" />
												Partners & Sponsors
												<Badge variant="premium" className="ml-2">
													{(partners || []).length}
												</Badge>
											</h3>
											{expandedSections.partners ? (
												<ChevronUp className="w-5 h-5" />
											) : (
												<ChevronDown className="w-5 h-5" />
											)}
										</div>

										{expandedSections.partners && (
											<div className="space-y-4">
												{(partners || []).length === 0 ? (
													<EmptyState
														title="No partners yet"
														subtitle="Add your first partner to get started"
														icon={Users}
														action={
															<PartnerQuickAdd
																onAdd={addNewPartner}
																disabled={actionBusy}
															/>
														}
													/>
												) : (
													<>
														<div className="space-y-3">
															{partners.map((p, idx) => (
																<div
																	key={
																		p.publicId || p.name || idx
																	}
																	className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
																>
																	<div className="flex items-center gap-3">
																		{p.logo?.url ? (
																			<img
																				src={p.logo.url}
																				alt={p.name}
																				className="w-12 h-12 rounded-lg object-cover"
																			/>
																		) : (
																			<div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
																				<Star className="w-6 h-6 text-purple-300" />
																			</div>
																		)}
																		<div>
																			<div className="text-white font-semibold">
																				{p.name}
																			</div>
																			<div className="flex items-center gap-2 mt-1">
																				<Badge
																					variant={
																						p.tier ===
																						'sponsor'
																							? 'sponsor'
																							: 'collaborator'
																					}
																				>
																					{p.tier ||
																						'partner'}
																				</Badge>
																				{p.website && (
																					<a
																						href={
																							p.website
																						}
																						target="_blank"
																						rel="noopener noreferrer"
																						className="text-blue-400 hover:text-blue-300 text-xs"
																					>
																						Website
																					</a>
																				)}
																			</div>
																		</div>
																	</div>
																	<button
																		onClick={() =>
																			removeExistingPartner(
																				p.name
																			)
																		}
																		disabled={actionBusy}
																		className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
																	>
																		<Trash2 className="w-4 h-4" />
																	</button>
																</div>
															))}
														</div>
														<PartnerQuickAdd
															onAdd={addNewPartner}
															disabled={actionBusy}
														/>
													</>
												)}
											</div>
										)}
									</GlassCard>

									{/* Events Section */}
									<GlassCard className="p-6">
										<div
											className="flex items-center justify-between cursor-pointer mb-4"
											onClick={() => toggleSection('events')}
										>
											<h3 className="text-xl font-semibold text-white flex items-center gap-2">
												<Calendar className="w-5 h-5 text-purple-400" />
												Linked Events
												<Badge variant="premium" className="ml-2">
													{(activeFest.events || []).length}
												</Badge>
											</h3>
											{expandedSections.events ? (
												<ChevronUp className="w-5 h-5" />
											) : (
												<ChevronDown className="w-5 h-5" />
											)}
										</div>

										{expandedSections.events && (
											<div className="space-y-4">
												{(activeFest.events || []).length === 0 ? (
													<EmptyState
														title="No events linked"
														subtitle="Link events to build your festival schedule"
														icon={Calendar}
													/>
												) : (
													<div className="space-y-3">
														{(activeFest.events || []).map((ev) => (
															<div
																key={ev._id || ev}
																className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
															>
																<div className="flex items-center gap-3">
																	<div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
																		<Calendar className="w-5 h-5 text-blue-300" />
																	</div>
																	<div>
																		<div className="text-white font-semibold">
																			{ev.title || ev}
																		</div>
																		<div className="text-gray-400 text-sm">
																			{ev.date
																				? new Date(
																						ev.date
																				  ).toLocaleDateString()
																				: 'No date'}
																		</div>
																	</div>
																</div>
																<button
																	onClick={() =>
																		handleUnlinkEvent(
																			ev._id || ev
																		)
																	}
																	disabled={actionBusy}
																	className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
																	title="Unlink event"
																>
																	<Unlink className="w-4 h-4" />
																</button>
															</div>
														))}
													</div>
												)}

												<select
													onChange={(e) => {
														const v = e.target.value;
														if (v) handleLinkEvent(activeFest, v);
														e.target.value = '';
													}}
													disabled={actionBusy}
													className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
												>
													<option value="">+ Link an event</option>
													{(events || []).map((ev) => (
														<option key={ev._id} value={ev._id}>
															{ev.title}
														</option>
													))}
												</select>
											</div>
										)}
									</GlassCard>
								</div>

								{/* Media Section */}
								<GlassCard className="p-6">
									<div
										className="flex items-center justify-between cursor-pointer mb-4"
										onClick={() => toggleSection('media')}
									>
										<h3 className="text-xl font-semibold text-white flex items-center gap-2">
											<Image className="w-5 h-5 text-purple-400" />
											Media & Gallery
											<Badge variant="premium" className="ml-2">
												{(activeFest.gallery || []).length +
													(activeFest.poster?.url ? 1 : 0)}
											</Badge>
										</h3>
										{expandedSections.media ? (
											<ChevronUp className="w-5 h-5" />
										) : (
											<ChevronDown className="w-5 h-5" />
										)}
									</div>

									{expandedSections.media && (
										<div className="space-y-6">
											{/* Poster */}
											<div>
												<h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
													<Image className="w-4 h-4" />
													Event Poster
												</h4>
												{activeFest.poster?.url ? (
													<div className="relative group">
														<img
															src={activeFest.poster.url}
															alt="Festival poster"
															className="w-full max-w-md rounded-2xl shadow-2xl"
														/>
														<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
															<button
																onClick={() =>
																	document
																		.getElementById(
																			'poster-upload'
																		)
																		?.click()
																}
																disabled={actionBusy}
																className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all duration-200"
															>
																Change Poster
															</button>
														</div>
													</div>
												) : (
													<div className="p-8 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 text-center">
														<Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
														<p className="text-gray-400 mb-4">
															No poster uploaded yet
														</p>
														<button
															onClick={() =>
																document
																	.getElementById('poster-upload')
																	?.click()
															}
															disabled={actionBusy}
															className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
														>
															Upload Poster
														</button>
													</div>
												)}
												<input
													id="poster-upload"
													type="file"
													accept="image/*"
													onChange={(e) =>
														uploadPoster(e.target.files?.[0])
													}
													className="hidden"
													disabled={actionBusy}
												/>
											</div>

											{/* Gallery */}
											<div>
												<h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
													<Film className="w-4 h-4" />
													Gallery
													<Badge variant="default" className="ml-2">
														{(activeFest.gallery || []).length} items
													</Badge>
												</h4>

												{(activeFest.gallery || []).length > 0 ? (
													<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
														{(activeFest.gallery || []).map((g) => (
															<div
																key={g.publicId}
																className="relative group"
															>
																<img
																	src={g.url}
																	alt={
																		g.caption || 'Gallery media'
																	}
																	className="w-full h-32 object-cover rounded-xl shadow-lg"
																/>
																<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
																	<button
																		onClick={() =>
																			removeGalleryItem(
																				g.publicId
																			)
																		}
																		disabled={actionBusy}
																		className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
																	>
																		<Trash2 className="w-4 h-4" />
																	</button>
																</div>
															</div>
														))}
													</div>
												) : (
													<div className="p-6 bg-white/5 rounded-xl border-2 border-dashed border-white/10 text-center">
														<Film className="w-8 h-8 text-gray-400 mx-auto mb-2" />
														<p className="text-gray-400">
															No gallery items yet
														</p>
													</div>
												)}

												<div className="mt-4">
													<input
														type="file"
														accept="image/*,video/*"
														multiple
														onChange={(e) =>
															addGallery([...e.target.files])
														}
														disabled={actionBusy}
														className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
													/>
												</div>
											</div>
										</div>
									)}
								</GlassCard>
							</div>
						)
					) : (
						<EmptyState
							title="No fest selected"
							subtitle="Choose a fest from the sidebar or create a new one to get started"
							icon={Trophy}
							action={
								<button
									onClick={() => setCreateOpen(true)}
									className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
								>
									Create Your First Fest
								</button>
							}
						/>
					)}
				</div>
			</div>

			{/* Create Fest Modal */}
			{createOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
					<GlassCard className="w-full max-w-md p-6 animate-in zoom-in duration-300">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-white">Create New Fest</h3>
							<button
								onClick={() => setCreateOpen(false)}
								className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200"
							>
								<X className="w-5 h-5 text-gray-400" />
							</button>
						</div>

						<form onSubmit={handleCreateSubmit} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Year
									</label>
									<input
										type="number"
										value={createForm.year}
										onChange={(e) =>
											setCreateForm({
												...createForm,
												year:
													Number(e.target.value) ||
													new Date().getFullYear(),
											})
										}
										className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Location
									</label>
									<input
										value="Lovely Professional University"
										disabled
										className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed backdrop-blur-sm"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Description
								</label>
								<textarea
									value={createForm.description}
									onChange={(e) =>
										setCreateForm({
											...createForm,
											description: e.target.value,
										})
									}
									rows={4}
									className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm resize-none"
									placeholder="Describe your festival..."
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Start Date
									</label>
									<input
										type="date"
										value={createForm.startDate}
										onChange={(e) =>
											setCreateForm({
												...createForm,
												startDate: e.target.value,
											})
										}
										className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										End Date
									</label>
									<input
										type="date"
										value={createForm.endDate}
										onChange={(e) =>
											setCreateForm({
												...createForm,
												endDate: e.target.value,
											})
										}
										className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
									/>
								</div>
							</div>

							{localError && (
								<div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
									{localError}
								</div>
							)}

							<div className="flex gap-3 pt-4">
								<button
									type="submit"
									disabled={createLoading}
									className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
								>
									{createLoading ? 'Creating...' : 'Create Fest'}
								</button>
								<button
									type="button"
									onClick={() => setCreateOpen(false)}
									className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all duration-200"
								>
									Cancel
								</button>
							</div>
						</form>
					</GlassCard>
				</div>
			)}

			{/* Edit Fest Modal */}
			{editOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
					<GlassCard className="w-full max-w-lg p-6 animate-in zoom-in duration-300">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-white">Edit Fest</h3>
							<button
								onClick={() => setEditOpen(false)}
								className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200"
							>
								<X className="w-5 h-5 text-gray-400" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Fest Name
								</label>
								<input
									value={editForm.name}
									disabled
									className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed backdrop-blur-sm"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Description
								</label>
								<textarea
									value={editForm.description}
									onChange={(e) =>
										setEditForm({ ...editForm, description: e.target.value })
									}
									rows={4}
									className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm resize-none"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Start Date
									</label>
									<input
										type="date"
										value={editForm.startDate}
										onChange={(e) =>
											setEditForm({ ...editForm, startDate: e.target.value })
										}
										className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										End Date
									</label>
									<input
										type="date"
										value={editForm.endDate}
										onChange={(e) =>
											setEditForm({ ...editForm, endDate: e.target.value })
										}
										className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
									/>
								</div>
							</div>

							{localError && (
								<div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
									{localError}
								</div>
							)}

							<div className="flex gap-3 pt-4">
								<button
									onClick={saveEdit}
									disabled={actionBusy}
									className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
								>
									{actionBusy ? 'Saving...' : 'Save Changes'}
								</button>
								<button
									onClick={() => setEditOpen(false)}
									className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all duration-200"
								>
									Cancel
								</button>
							</div>
						</div>
					</GlassCard>
				</div>
			)}

			{/* Toast Notifications */}
			{toast && (
				<div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-full duration-500">
					<Toast
						message={toast.message}
						type={toast.type}
						onDismiss={() => setToast(null)}
					/>
				</div>
			)}
		</div>
	);
};

// Partner Quick Add Component
const PartnerQuickAdd = React.memo(({ onAdd = () => {}, disabled = false }) => {
	const [name, setName] = useState('');
	const [tier, setTier] = useState('sponsor');
	const [website, setWebsite] = useState('');
	const [logoFile, setLogoFile] = useState(null);
	const [adding, setAdding] = useState(false);
	const [err, setErr] = useState('');

	const submit = async () => {
		setErr('');
		if (!name || !logoFile) {
			setErr('Name and logo are required');
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
			setErr(e?.message || 'Failed to add partner');
		} finally {
			setAdding(false);
		}
	};

	return (
		<div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
			<h4 className="text-sm font-semibold text-white flex items-center gap-2">
				<Plus className="w-4 h-4" />
				Add New Partner
			</h4>

			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Partner name"
				className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
				disabled={disabled}
			/>

			<div className="grid grid-cols-2 gap-3">
				<select
					value={tier}
					onChange={(e) => setTier(e.target.value)}
					className="p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
					disabled={disabled}
				>
					<option value="sponsor">Sponsor</option>
					<option value="collaborator">Collaborator</option>
				</select>

				<input
					value={website}
					onChange={(e) => setWebsite(e.target.value)}
					placeholder="Website (optional)"
					className="p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
					disabled={disabled}
				/>
			</div>

			<div>
				<input
					type="file"
					accept="image/*"
					onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
					className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
					disabled={disabled}
				/>
				{logoFile && (
					<p className="text-green-400 text-xs mt-2">Selected: {logoFile.name}</p>
				)}
			</div>

			{err && (
				<div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs">
					{err}
				</div>
			)}

			<button
				onClick={submit}
				disabled={adding || disabled}
				className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50"
			>
				{adding ? 'Adding Partner...' : 'Add Partner'}
			</button>
		</div>
	);
});

export default ArvantisTab;
