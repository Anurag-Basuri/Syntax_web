import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Sparkles,
	X,
	Loader2,
	Plus,
	DownloadCloud,
	BarChart2,
	Calendar,
	MapPin,
	Users,
	Image,
	Film,
	Link2,
	Copy,
	Trash2,
	Edit3,
	ChevronDown,
	ChevronUp,
	Star,
	Trophy,
	Search,
	Eye,
	Settings,
	Share2,
	Zap,
	Building2,
	Camera,
	Video,
	Crown,
	TrendingUp,
	UserCheck,
	Award,
	Clock,
	DollarSign,
	Heart,
	Share,
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

// Premium UI Components
import Badge from '../../components/arvantis/Badge';
import GlassCard from '../../components/arvantis/GlassCard';
import EmptyState from '../../components/arvantis/EmptyState';
import LoadingSpinner from '../../components/arvantis/LoadingSpinner';
import Toast from '../../components/arvantis/Toast';
import StatCard from '../../components/arvantis/StatCard';
import PartnerQuickAdd from '../../components/arvantis/PartnerQuickAdd';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FILE_TYPES = {
	images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
	media: [
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/gif',
		'image/webp',
		'video/mp4',
		'video/webm',
	],
};

const ArvantisTab = ({ setDashboardError = () => {} }) => {
	const [fests, setFests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState([]);

	const [query, setQuery] = useState('');
	const [years, setYears] = useState([]);
	const [selectedYear, setSelectedYear] = useState('');
	const [limit] = useState(100);
	const [expandedSections, setExpandedSections] = useState({
		partners: true,
		events: true,
		media: true,
	});

	const [createOpen, setCreateOpen] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);
	const [createForm, setCreateForm] = useState({
		year: new Date().getFullYear(),
		description: '',
		startDate: '',
		endDate: '',
		theme: '',
		expectedAttendees: '',
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
		theme: '',
		expectedAttendees: '',
	});

	const [activeFest, setActiveFest] = useState(null);
	const [partners, setPartners] = useState([]);
	const [downloadingCSV, setDownloadingCSV] = useState(false);
	const [actionBusy, setActionBusy] = useState(false);
	const [localError, setLocalError] = useState('');
	const [toast, setToast] = useState(null);
	const toastTimeoutRef = useRef(null);
	const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'analytics'

	// Helper functions
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

	const toggleSection = (section) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	// Data loading functions
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
	}, [loadFestByIdentifier, setDashboardError]);

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

	const initializedRef = useRef(false);
	useEffect(() => {
		if (initializedRef.current) return;
		initializedRef.current = true;
		(async () => {
			await fetchYearsAndLatest();
			await fetchEvents();
		})();
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

	// Action handlers
	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		setCreateLoading(true);
		setLocalError('');
		try {
			const { year, description, startDate, endDate, theme, expectedAttendees } = createForm;
			if (!year || !startDate || !endDate || !description) {
				throw new Error('Year, description and dates are required');
			}
			const payload = {
				year: Number(year),
				description,
				startDate,
				endDate,
				theme,
				expectedAttendees: expectedAttendees ? Number(expectedAttendees) : undefined,
			};
			const created = await createFest(payload);
			setCreateOpen(false);
			showToast('🎉 Festival created successfully!', 'success');
			await fetchYearsAndLatest();
			const id = created?.slug || created?.year || created?._id;
			if (id) await loadFestByIdentifier(id);
		} catch (err) {
			const msg = err?.message || 'Failed to create festival.';
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
				location: editForm.location,
				contactEmail: editForm.contactEmail,
				theme: editForm.theme,
				expectedAttendees: editForm.expectedAttendees
					? Number(editForm.expectedAttendees)
					: undefined,
			};
			await updateFestDetails(id, payload);
			await loadFestByIdentifier(id);
			await fetchYearsAndLatest();
			setEditOpen(false);
			showToast('✨ Festival updated successfully!', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to save festival edits.';
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
				theme: s.theme || '',
				expectedAttendees: s.expectedAttendees || '',
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

	const exportCSV = async () => {
		setDownloadingCSV(true);
		setLocalError('');
		try {
			const blob = await exportFestsCSV();
			downloadBlob(blob, `arvantis-festivals-${safeFilename(new Date().toISOString())}.csv`);
			showToast('📊 CSV exported successfully!', 'success');
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
		if (!window.confirm(`Delete "${fest.name || fest.year}"? This action cannot be undone.`))
			return;
		setActionBusy(true);
		setLocalError('');
		try {
			const id = resolveIdentifier(fest);
			await deleteFest(id);
			await fetchYearsAndLatest();
			showToast('Festival deleted successfully', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to delete festival.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	const uploadPoster = async (file) => {
		if (!activeFest) {
			showToast('No active festival selected', 'error');
			return;
		}
		if (!file) {
			showToast('No file selected', 'error');
			return;
		}
		// max size and allowed types centralized at top (MAX_FILE_SIZE, FILE_TYPES.images)
		if (!FILE_TYPES.images.includes(file.type)) {
			showToast('Invalid file type. Use JPG, PNG, WEBP, or GIF.', 'error');
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
			showToast('🖼️ Poster uploaded successfully!', 'success');
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
			showToast('No active festival selected', 'error');
			return;
		}
		if (!files || !files.length) {
			showToast('No files selected for gallery', 'error');
			return;
		}
		// max size and allowed media types centralized at top (MAX_FILE_SIZE, FILE_TYPES.media)
		for (const f of files) {
			if (!FILE_TYPES.media.includes(f.type)) {
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
			showToast('📸 Gallery updated successfully!', 'success');
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
			showToast('🔗 Event linked successfully!', 'success');
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
			showToast('🤝 Partner added successfully!', 'success');
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
			setViewMode('analytics');
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
			showToast('📈 Report generated successfully!', 'success');
		} catch (err) {
			const msg = err?.message || 'Failed to generate report.';
			setLocalError(msg);
			setDashboardError(msg);
			showToast(msg, 'error');
		} finally {
			setActionBusy(false);
		}
	};

	// Enhanced UI Render
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-violet-900 p-6 relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
			</div>

			{/* Enhanced Header */}
			<GlassCard className="p-8 mb-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-l-4 border-l-purple-500/50 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full"></div>
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
					<div className="flex items-center gap-4">
						<div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl shadow-purple-500/25 relative group">
							<Trophy className="w-8 h-8 text-white" />
							<div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						</div>
						<div>
							<h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
								Arvantis Manager
							</h1>
							<p className="text-gray-400 text-lg mt-2 flex items-center gap-2">
								<Crown className="w-5 h-5 text-amber-400" />
								Premium Festival Management Platform
							</p>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative group">
							<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-400 transition-colors duration-300" />
							<input
								aria-label="Search festivals"
								placeholder="Search festivals..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="pl-12 pr-6 py-4 w-full sm:w-80 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
							/>
						</div>

						<div className="flex gap-3">
							<button
								onClick={loadAnalytics}
								disabled={actionBusy}
								className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:scale-105 hover:border-purple-500/30 transition-all duration-300 disabled:opacity-50 group relative overflow-hidden"
								title="Analytics Dashboard"
							>
								<BarChart2 className="w-5 h-5 text-gray-300 group-hover:text-purple-300 transition-colors duration-300" />
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
							</button>

							<button
								onClick={exportCSV}
								disabled={downloadingCSV || actionBusy}
								className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:scale-105 hover:border-purple-500/30 transition-all duration-300 disabled:opacity-50 group relative overflow-hidden"
								title="Export Data"
							>
								<DownloadCloud className="w-5 h-5 text-gray-300 group-hover:text-purple-300 transition-colors duration-300" />
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
							</button>

							<button
								onClick={() => setCreateOpen(true)}
								className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 shadow-2xl shadow-purple-500/25 font-semibold relative overflow-hidden group"
							>
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
								<Plus className="w-5 h-5" />
								New Festival
							</button>
						</div>
					</div>
				</div>
			</GlassCard>

			{localError && (
				<div className="mb-6 p-6 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-300 text-sm font-medium backdrop-blur-sm">
					<div className="flex items-center gap-3">
						<div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
							!
						</div>
						{localError}
					</div>
				</div>
			)}

			{/* View Mode Toggle */}
			<div className="flex justify-center mb-8">
				<div className="bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-sm">
					<div className="flex gap-2">
						<button
							onClick={() => setViewMode('grid')}
							className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
								viewMode === 'grid'
									? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
									: 'text-gray-400 hover:text-white hover:bg-white/5'
							}`}
						>
							Grid View
						</button>
						<button
							onClick={() => setViewMode('analytics')}
							className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
								viewMode === 'analytics'
									? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
									: 'text-gray-400 hover:text-white hover:bg-white/5'
							}`}
						>
							Analytics
						</button>
					</div>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
				{/* Enhanced Sidebar */}
				<div className="xl:col-span-1 space-y-6">
					<GlassCard className="p-6 relative overflow-hidden">
						<div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full"></div>
						<div className="flex items-center gap-4 mb-6">
							<div className="flex-1">
								<label className="block text-sm font-semibold text-gray-300 mb-2">
									Filter by Year
								</label>
								<select
									value={selectedYear}
									onChange={(e) => handleSelectYear(e.target.value)}
									className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 appearance-none pr-10 bg-no-repeat bg-right-4 hover:bg-white/10"
								>
									<option value="">All Years</option>
									{years.map((y) => (
										<option key={y} value={y}>
											{y}
										</option>
									))}
								</select>
							</div>
							<button
								onClick={() => fetchYearsAndLatest()}
								disabled={loading || actionBusy}
								className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 disabled:opacity-50 mt-6 group"
								title="Refresh"
							>
								<Zap className="w-5 h-5 text-gray-300 group-hover:text-purple-300 transition-colors duration-300" />
							</button>
						</div>

						<div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
							{loading ? (
								<LoadingSpinner text="Loading festivals..." />
							) : visibleFests.length === 0 ? (
								<EmptyState
									title="No festivals found"
									subtitle={
										query || selectedYear
											? 'Try adjusting your filters'
											: 'Create your first festival to get started'
									}
									icon={Trophy}
									action={
										<button
											onClick={() => setCreateOpen(true)}
											className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 hover:scale-105 transition-all duration-300 font-semibold shadow-lg shadow-purple-500/25"
										>
											Create Festival
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
										className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${
											activeFest &&
											resolveIdentifier(activeFest) === resolveIdentifier(f)
												? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 shadow-2xl scale-[1.02]'
												: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30 hover:shadow-xl'
										}`}
									>
										<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
										<div className="flex items-start justify-between relative z-10">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-3 mb-3">
													<h3 className="font-bold text-white text-lg group-hover:text-purple-200 transition-colors truncate">
														{f.name || 'Arvantis'} {f.year}
													</h3>
													<Badge variant={f.status} size="sm">
														{f.status}
													</Badge>
												</div>
												<p className="text-gray-400 text-sm line-clamp-2 mb-3 leading-relaxed">
													{f.description || 'No description available'}
												</p>
												<div className="flex items-center gap-4 text-xs text-gray-500">
													<div className="flex items-center gap-2">
														<Calendar className="w-3 h-3" />
														{f.startDate
															? new Date(
																	f.startDate
																).toLocaleDateString()
															: 'TBD'}
													</div>
													<div className="flex items-center gap-2">
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

				{/* Enhanced Main Content */}
				<div className="xl:col-span-3">
					{loading ? (
						<GlassCard className="p-12">
							<LoadingSpinner size="lg" text="Loading festival details..." />
						</GlassCard>
					) : activeFest && viewMode === 'analytics' ? (
						<GlassCard className="p-8 relative overflow-hidden">
							<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full"></div>
							<div className="flex items-center justify-between mb-8 relative z-10">
								<div>
									<h2 className="text-3xl font-bold text-white mb-3">
										Analytics Dashboard
									</h2>
									<p className="text-gray-400 text-lg">
										Comprehensive festival insights and performance metrics
									</p>
								</div>
								<button
									onClick={() => {
										setViewMode('grid');
										fetchYearsAndLatest();
									}}
									className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 font-semibold"
								>
									Back to Festivals
								</button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
								<StatCard
									title="Total Festivals"
									value={activeFest.statistics?.totalFests || '0'}
									icon={Trophy}
									trend="+12%"
									gradient="from-purple-500/20 to-pink-500/20"
								/>
								<StatCard
									title="Active Events"
									value={activeFest.statistics?.activeEvents || '0'}
									icon={Calendar}
									trend="+5%"
									gradient="from-blue-500/20 to-cyan-500/20"
								/>
								<StatCard
									title="Partners"
									value={activeFest.statistics?.totalPartners || '0'}
									icon={Users}
									trend="+8%"
									gradient="from-emerald-500/20 to-green-500/20"
								/>
								<StatCard
									title="Engagement"
									value="94%"
									icon={TrendingUp}
									trend="+3%"
									gradient="from-amber-500/20 to-orange-500/20"
								/>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								<GlassCard className="p-6">
									<h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
										<BarChart2 className="w-6 h-6 text-purple-400" />
										Performance Summary
									</h3>
									<div className="space-y-4">
										{Object.entries(activeFest.statistics || {}).map(
											([key, value]) => (
												<div
													key={key}
													className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 group"
												>
													<span className="text-gray-300 font-medium capitalize">
														{key
															.replace(/([A-Z])/g, ' $1')
															.toLowerCase()}
													</span>
													<span className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors duration-300">
														{value}
													</span>
												</div>
											)
										)}
									</div>
								</GlassCard>

								<GlassCard className="p-6">
									<h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
										<Sparkles className="w-6 h-6 text-purple-400" />
										Yearly Overview
									</h3>
									<div className="space-y-4">
										{(activeFest.analytics || []).map((row) => (
											<div
												key={row.year}
												className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 group"
											>
												<div>
													<span className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors duration-300">
														{row.year}
													</span>
													<div className="flex gap-4 text-sm text-gray-400 mt-1">
														<span>{row.eventCount} events</span>
														<span>{row.partnerCount} partners</span>
													</div>
												</div>
												<Badge
													variant={
														row.year === new Date().getFullYear()
															? 'ongoing'
															: 'completed'
													}
												>
													{row.year === new Date().getFullYear()
														? 'Current'
														: 'Completed'}
												</Badge>
											</div>
										))}
									</div>
								</GlassCard>
							</div>
						</GlassCard>
					) : activeFest ? (
						<div className="space-y-8">
							{/* Festival Header */}
							<GlassCard className="p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-l-4 border-l-purple-500/50 relative overflow-hidden">
								<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full"></div>
								<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
									<div className="flex-1">
										<div className="flex items-center gap-4 mb-4">
											<h2 className="text-4xl font-bold text-white">
												{activeFest.name || 'Arvantis'}
											</h2>
											<Badge variant={activeFest.status} size="lg">
												{activeFest.status}
											</Badge>
										</div>

										<p className="text-xl text-gray-300 mb-6 leading-relaxed">
											{activeFest.description ||
												'No description provided for this festival.'}
										</p>

										<div className="flex flex-wrap gap-4 text-sm">
											<div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
												<Calendar className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
												{activeFest.startDate && activeFest.endDate ? (
													<span className="font-medium text-white">
														{new Date(
															activeFest.startDate
														).toLocaleDateString()}{' '}
														-{' '}
														{new Date(
															activeFest.endDate
														).toLocaleDateString()}
													</span>
												) : (
													<span className="text-gray-400">
														Dates to be announced
													</span>
												)}
											</div>
											<div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
												<MapPin className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
												<span className="font-medium text-white">
													{activeFest.location ||
														'Lovely Professional University'}
												</span>
											</div>
											{activeFest.contactEmail && (
												<div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
													<Users className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
													<span className="font-medium text-white">
														{activeFest.contactEmail}
													</span>
												</div>
											)}
											{activeFest.theme && (
												<div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
													<Award className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
													<span className="font-medium text-white">
														{activeFest.theme}
													</span>
												</div>
											)}
										</div>
									</div>

									<div className="flex flex-wrap gap-3">
										<button
											onClick={() => openEdit(activeFest)}
											disabled={actionBusy}
											className="flex items-center gap-2 px-5 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-2xl hover:bg-blue-500/30 hover:scale-105 hover:border-blue-500/50 transition-all duration-300 font-semibold group"
										>
											<Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
											Edit
										</button>

										<button
											onClick={() => generateReport(activeFest)}
											disabled={actionBusy}
											className="flex items-center gap-2 px-5 py-3 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-2xl hover:bg-purple-500/30 hover:scale-105 hover:border-purple-500/50 transition-all duration-300 font-semibold group"
										>
											<BarChart2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
											Report
										</button>

										<button
											onClick={() => removeFest(activeFest)}
											disabled={actionBusy}
											className="flex items-center gap-2 px-5 py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-2xl hover:bg-red-500/30 hover:scale-105 hover:border-red-500/50 transition-all duration-300 font-semibold group"
										>
											<Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
											Delete
										</button>
									</div>
								</div>
							</GlassCard>

							{/* Quick Stats */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
								<GlassCard className="p-6 text-center hover:scale-105 transition-all duration-300 cursor-pointer group">
									<div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
										<Calendar className="w-6 h-6 text-purple-400" />
									</div>
									<div className="text-2xl font-bold text-white mb-1">
										{(activeFest.events || []).length}
									</div>
									<div className="text-gray-400 text-sm">Events</div>
								</GlassCard>

								<GlassCard className="p-6 text-center hover:scale-105 transition-all duration-300 cursor-pointer group">
									<div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
										<Users className="w-6 h-6 text-blue-400" />
									</div>
									<div className="text-2xl font-bold text-white mb-1">
										{partners.length}
									</div>
									<div className="text-gray-400 text-sm">Partners</div>
								</GlassCard>

								<GlassCard className="p-6 text-center hover:scale-105 transition-all duration-300 cursor-pointer group">
									<div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:from-emerald-500/30 group-hover:to-green-500/30 transition-all duration-300">
										<Image className="w-6 h-6 text-emerald-400" />
									</div>
									<div className="text-2xl font-bold text-white mb-1">
										{(activeFest.gallery || []).length}
									</div>
									<div className="text-gray-400 text-sm">Gallery Items</div>
								</GlassCard>

								<GlassCard className="p-6 text-center hover:scale-105 transition-all duration-300 cursor-pointer group">
									<div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all duration-300">
										<TrendingUp className="w-6 h-6 text-amber-400" />
									</div>
									<div className="text-2xl font-bold text-white mb-1">
										{activeFest.expectedAttendees || '0'}
									</div>
									<div className="text-gray-400 text-sm">Expected Attendees</div>
								</GlassCard>
							</div>

							{/* Partners & Events Grid */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								{/* Partners Section */}
								<GlassCard className="p-6 relative overflow-hidden">
									<div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full"></div>
									<div
										className="flex items-center justify-between cursor-pointer mb-6 p-4 hover:bg-white/5 rounded-2xl transition-all duration-300 group relative z-10"
										onClick={() => toggleSection('partners')}
									>
										<h3 className="text-2xl font-bold text-white flex items-center gap-3">
											<Building2 className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
											Partners & Sponsors
											<Badge variant="premium" className="ml-2">
												{(partners || []).length}
											</Badge>
										</h3>
										{expandedSections.partners ? (
											<ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors duration-300" />
										) : (
											<ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors duration-300" />
										)}
									</div>

									{expandedSections.partners && (
										<div className="space-y-4 animate-in fade-in duration-300">
											{(partners || []).length === 0 ? (
												<EmptyState
													title="No partners yet"
													subtitle="Add your first partner to showcase collaboration"
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
													<div className="space-y-4">
														{partners.map((p, idx) => (
															<div
																key={p.publicId || p.name || idx}
																className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden"
															>
																<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
																<div className="flex items-center gap-4 relative z-10">
																	{p.logo?.url ? (
																		<img
																			src={p.logo.url}
																			alt={p.name}
																			className="w-14 h-14 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
																		/>
																	) : (
																		<div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center shadow-lg group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
																			<Star className="w-6 h-6 text-purple-300" />
																		</div>
																	)}
																	<div>
																		<div className="text-white font-bold text-lg group-hover:text-purple-200 transition-colors duration-300">
																			{p.name}
																		</div>
																		<div className="flex items-center gap-3 mt-2">
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
																					href={p.website}
																					target="_blank"
																					rel="noopener noreferrer"
																					className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300 flex items-center gap-1"
																				>
																					<Link2 className="w-3 h-3" />
																					Visit
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
																	className="p-3 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 relative z-10"
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
								<GlassCard className="p-6 relative overflow-hidden">
									<div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full"></div>
									<div
										className="flex items-center justify-between cursor-pointer mb-6 p-4 hover:bg-white/5 rounded-2xl transition-all duration-300 group relative z-10"
										onClick={() => toggleSection('events')}
									>
										<h3 className="text-2xl font-bold text-white flex items-center gap-3">
											<Calendar className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
											Festival Events
											<Badge variant="premium" className="ml-2">
												{(activeFest.events || []).length}
											</Badge>
										</h3>
										{expandedSections.events ? (
											<ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors duration-300" />
										) : (
											<ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors duration-300" />
										)}
									</div>

									{expandedSections.events && (
										<div className="space-y-4 animate-in fade-in duration-300">
											{(activeFest.events || []).length === 0 ? (
												<EmptyState
													title="No events linked"
													subtitle="Link events to build your festival schedule"
													icon={Calendar}
												/>
											) : (
												<div className="space-y-4">
													{(activeFest.events || []).map((ev) => (
														<div
															key={ev._id || ev}
															className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden"
														>
															<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
															<div className="flex items-center gap-4 relative z-10">
																<div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center shadow-lg group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
																	<Calendar className="w-5 h-5 text-blue-300" />
																</div>
																<div>
																	<div className="text-white font-bold text-lg group-hover:text-purple-200 transition-colors duration-300">
																		{ev.title || ev}
																	</div>
																	<div className="text-gray-400 text-sm mt-1">
																		{ev.date
																			? new Date(
																					ev.date
																				).toLocaleDateString()
																			: 'Date TBD'}
																	</div>
																</div>
															</div>
															<button
																onClick={() =>
																	handleUnlinkEvent(ev._id || ev)
																}
																disabled={actionBusy}
																className="p-3 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 relative z-10"
																title="Unlink event"
															>
																<Link2 className="w-4 h-4" />
															</button>
														</div>
													))}
												</div>
											)}

											<div className="pt-4 border-t border-white/10">
												<select
													onChange={(e) => {
														const v = e.target.value;
														if (v) handleLinkEvent(activeFest, v);
														e.target.value = '';
													}}
													disabled={actionBusy}
													className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 appearance-none pr-10 bg-no-repeat bg-right-4 hover:bg-white/10"
												>
													<option value="">+ Link New Event</option>
													{(events || []).map((ev) => (
														<option key={ev._id} value={ev._id}>
															{ev.title}
														</option>
													))}
												</select>
											</div>
										</div>
									)}
								</GlassCard>
							</div>

							{/* Media Section */}
							<GlassCard className="p-6 relative overflow-hidden">
								<div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-bl-full"></div>
								<div
									className="flex items-center justify-between cursor-pointer mb-6 p-4 hover:bg-white/5 rounded-2xl transition-all duration-300 group relative z-10"
									onClick={() => toggleSection('media')}
								>
									<h3 className="text-2xl font-bold text-white flex items-center gap-3">
										<Image className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
										Media Gallery
										<Badge variant="premium" className="ml-2">
											{(activeFest.gallery || []).length +
												(activeFest.poster?.url ? 1 : 0)}
										</Badge>
									</h3>
									{expandedSections.media ? (
										<ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors duration-300" />
									) : (
										<ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors duration-300" />
									)}
								</div>

								{expandedSections.media && (
									<div className="space-y-8 animate-in fade-in duration-300">
										{/* Poster Section */}
										<div>
											<h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
												<Camera className="w-5 h-5 text-purple-400" />
												Event Poster
											</h4>
											{activeFest.poster?.url ? (
												<div className="relative group">
													<img
														src={activeFest.poster.url}
														alt="Festival poster"
														className="w-full max-w-md rounded-3xl shadow-2xl transition-all duration-300 group-hover:shadow-3xl group-hover:scale-105"
													/>
													<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl flex items-center justify-center">
														<button
															onClick={() =>
																document
																	.getElementById('poster-upload')
																	?.click()
															}
															disabled={actionBusy}
															className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white hover:bg-white/30 transition-all duration-300 font-semibold"
														>
															Change Poster
														</button>
													</div>
												</div>
											) : (
												<div
													className="p-8 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 text-center hover:border-purple-500/50 transition-all duration-300 group cursor-pointer"
													onClick={() =>
														document
															.getElementById('poster-upload')
															?.click()
													}
												>
													<Camera className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-purple-400 transition-colors duration-300" />
													<p className="text-gray-400 text-lg mb-4 group-hover:text-white transition-colors duration-300">
														No poster uploaded yet
													</p>
													<button
														disabled={actionBusy}
														className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg shadow-purple-500/25"
													>
														Upload Poster
													</button>
												</div>
											)}
											<input
												id="poster-upload"
												type="file"
												accept="image/*"
												onChange={(e) => uploadPoster(e.target.files?.[0])}
												className="hidden"
												disabled={actionBusy}
											/>
										</div>

										{/* Gallery Section */}
										<div>
											<h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
												<Film className="w-5 h-5 text-purple-400" />
												Media Gallery
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
																alt={g.caption || 'Gallery media'}
																className="w-full h-32 object-cover rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-105"
															/>
															<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
																<button
																	onClick={() =>
																		removeGalleryItem(
																			g.publicId
																		)
																	}
																	disabled={actionBusy}
																	className="p-2 bg-red-500/80 text-white rounded-xl hover:bg-red-600 transition-all duration-200 transform hover:scale-110"
																>
																	<Trash2 className="w-4 h-4" />
																</button>
															</div>
														</div>
													))}
												</div>
											) : (
												<div className="p-8 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 text-center hover:border-purple-500/50 transition-all duration-300">
													<Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
													<p className="text-gray-400 text-lg">
														No gallery items yet
													</p>
												</div>
											)}

											<div className="mt-6">
												<input
													type="file"
													accept="image/*,video/*"
													multiple
													onChange={(e) =>
														addGallery([...e.target.files])
													}
													disabled={actionBusy}
													className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white hover:file:from-purple-600 hover:file:to-pink-600 transition-all duration-300 hover:bg-white/10"
												/>
											</div>
										</div>
									</div>
								)}
							</GlassCard>
						</div>
					) : (
						<EmptyState
							title="No festival selected"
							subtitle="Choose a festival from the sidebar or create a new one to get started"
							icon={Trophy}
							size="lg"
							action={
								<button
									onClick={() => setCreateOpen(true)}
									className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 hover:scale-105 transition-all duration-300 font-semibold shadow-2xl shadow-purple-500/25"
								>
									Create New Festival
								</button>
							}
						/>
					)}
				</div>
			</div>

			{/* Enhanced Create Modal */}
			{createOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
					<GlassCard className="w-full max-w-2xl p-8 animate-in zoom-in duration-500 relative overflow-hidden">
						<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full"></div>
						<div className="flex items-center justify-between mb-8 relative z-10">
							<div>
								<h3 className="text-3xl font-bold text-white">
									Create New Festival
								</h3>
								<p className="text-gray-400 mt-2">Start a new festival edition</p>
							</div>
							<button
								onClick={() => setCreateOpen(false)}
								className="p-3 hover:bg-white/10 rounded-2xl transition-all duration-300"
							>
								<X className="w-6 h-6 text-gray-400" />
							</button>
						</div>

						<form onSubmit={handleCreateSubmit} className="space-y-6 relative z-10">
							<div className="grid grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-semibold text-gray-300 mb-3">
										Festival Year
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
										className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-300 mb-3">
										Location
									</label>
									<input
										value="Lovely Professional University"
										disabled
										className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl text-gray-400 cursor-not-allowed backdrop-blur-sm"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-300 mb-3">
									Festival Theme
								</label>
								<input
									type="text"
									value={createForm.theme}
									onChange={(e) =>
										setCreateForm({ ...createForm, theme: e.target.value })
									}
									placeholder="Enter festival theme or tagline..."
									className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-300 mb-3">
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
									className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 resize-none hover:bg-white/10"
									placeholder="Describe your festival vision, theme, and highlights..."
								/>
							</div>

							<div className="grid grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-semibold text-gray-300 mb-3">
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
										className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-300 mb-3">
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
										className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-300 mb-3">
									Expected Attendees
								</label>
								<input
									type="number"
									value={createForm.expectedAttendees}
									onChange={(e) =>
										setCreateForm({
											...createForm,
											expectedAttendees: e.target.value,
										})
									}
									placeholder="Estimated number of attendees..."
									className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
								/>
							</div>

							{localError && (
								<div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-300 text-sm font-medium">
									{localError}
								</div>
							)}

							<div className="flex gap-4 pt-6">
								<button
									type="submit"
									disabled={createLoading}
									className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 hover:scale-105 transition-all duration-300 disabled:opacity-50 font-semibold text-lg shadow-2xl shadow-purple-500/25 relative overflow-hidden group"
								>
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
									{createLoading ? (
										<div className="flex items-center justify-center gap-3 relative z-10">
											<Loader2 className="w-5 h-5 animate-spin" />
											Creating Festival...
										</div>
									) : (
										<span className="relative z-10">Create Festival</span>
									)}
								</button>
								<button
									type="button"
									onClick={() => setCreateOpen(false)}
									className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold text-lg"
								>
									Cancel
								</button>
							</div>
						</form>
					</GlassCard>
				</div>
			)}

			{/* Enhanced Edit Modal */}
			{editOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
					<GlassCard className="w-full max-w-2xl p-8 animate-in zoom-in duration-500 relative overflow-hidden">
						<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full"></div>
						<div className="flex items-center justify-between mb-8 relative z-10">
							<div>
								<h3 className="text-3xl font-bold text-white">Edit Festival</h3>
								<p className="text-gray-400 mt-2">Update festival details</p>
							</div>
							<button
								onClick={() => setEditOpen(false)}
								className="p-3 hover:bg-white/10 rounded-2xl transition-all duration-300"
							>
								<X className="w-6 h-6 text-gray-400" />
							</button>
						</div>

						<div className="space-y-6 relative z-10">
							<div>
								<label className="block text-sm font-semibold text-gray-300 mb-3">
									Festival Name
								</label>
								<input
									value={editForm.name}
									disabled
									className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl text-gray-400 cursor-not-allowed backdrop-blur-sm"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-300 mb-3">
									Festival Theme
								</label>
								<input
									type="text"
									value={editForm.theme}
									onChange={(e) =>
										setEditForm({ ...editForm, theme: e.target.value })
									}
									placeholder="Enter festival theme or tagline..."
									className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-300 mb-3">
									Description
								</label>
								<textarea
									value={editForm.description}
									onChange={(e) =>
										setEditForm({ ...editForm, description: e.target.value })
									}
									rows={4}
									className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 resize-none hover:bg-white/10"
								/>
							</div>

							<div className="grid grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-semibold text-gray-300 mb-3">
										Start Date
									</label>
									<input
										type="date"
										value={editForm.startDate}
										onChange={(e) =>
											setEditForm({ ...editForm, startDate: e.target.value })
										}
										className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-300 mb-3">
										End Date
									</label>
									<input
										type="date"
										value={editForm.endDate}
										onChange={(e) =>
											setEditForm({ ...editForm, endDate: e.target.value })
										}
										className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-300 mb-3">
									Expected Attendees
								</label>
								<input
									type="number"
									value={editForm.expectedAttendees}
									onChange={(e) =>
										setEditForm({
											...editForm,
											expectedAttendees: e.target.value,
										})
									}
									placeholder="Estimated number of attendees..."
									className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
								/>
							</div>

							{localError && (
								<div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-300 text-sm font-medium">
									{localError}
								</div>
							)}

							<div className="flex gap-4 pt-6">
								<button
									onClick={saveEdit}
									disabled={actionBusy}
									className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 hover:scale-105 transition-all duration-300 disabled:opacity-50 font-semibold text-lg shadow-2xl shadow-purple-500/25 relative overflow-hidden group"
								>
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
									{actionBusy ? (
										<div className="flex items-center justify-center gap-3 relative z-10">
											<Loader2 className="w-5 h-5 animate-spin" />
											Saving Changes...
										</div>
									) : (
										<span className="relative z-10">Save Changes</span>
									)}
								</button>
								<button
									onClick={() => setEditOpen(false)}
									className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold text-lg"
								>
									Cancel
								</button>
							</div>
						</div>
					</GlassCard>
				</div>
			)}

			{/* Enhanced Toast Notifications */}
			{toast && (
				<div className="fixed top-8 right-8 z-50 animate-in slide-in-from-right-full duration-500">
					<Toast
						message={toast.message}
						type={toast.type}
						onDismiss={() => setToast(null)}
					/>
				</div>
			)}

			{/* Custom Scrollbar Styles */}
			<style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
		</div>
	);
};

export default ArvantisTab;
