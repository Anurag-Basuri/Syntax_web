import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	getArvantisLandingData,
	getFestDetails,
	getAllFests,
} from '../services/arvantisServices.js';
import EventDetailModal from '../components/event/EventDetailModal.jsx';
import {
	Calendar,
	ChevronRight,
	CircleAlert,
	Image as ImageIcon,
	Layers3,
	Loader2,
	Sparkles,
	Users,
	X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatDate = (date) => {
	if (!date) return 'TBA';
	const d = new Date(date);
	if (isNaN(d.getTime())) return 'TBA';
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const StatusPill = ({ status }) => {
	const map = {
		upcoming: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
		ongoing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
		completed: 'bg-slate-200 text-slate-800 dark:bg-slate-700/60 dark:text-slate-100',
		cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
		postponed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
	};
	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
				map[status] ||
				'bg-slate-200 text-slate-800 dark:bg-slate-700/60 dark:text-slate-100'
			}`}
		>
			{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Status'}
		</span>
	);
};

const ErrorBlock = ({ message, onRetry }) => (
	<div className="py-20 text-center">
		<CircleAlert className="w-10 h-10 mx-auto text-red-500 mb-3" />
		<h2 className="text-lg font-semibold mb-2">Failed to load Arvantis</h2>
		<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
		<button
			onClick={onRetry}
			className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500"
		>
			Retry
		</button>
	</div>
);

const LoadingBlock = ({ label = 'Loading...' }) => (
	<div className="py-16 flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
		<Loader2 className="animate-spin" />
		<span className="text-sm">{label}</span>
	</div>
);

const PosterHero = ({ fest }) => {
	const posterUrl = fest?.poster?.url || '';
	return (
		<section className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
			<div className="grid md:grid-cols-2 gap-0">
				<div className="p-6 md:p-8 flex flex-col justify-center">
					<div className="flex items-center gap-2 mb-3">
						<Sparkles className="text-blue-600 dark:text-blue-400" size={18} />
						<span className="text-xs font-medium text-gray-600 dark:text-gray-400">
							Syntax Club Presents
						</span>
					</div>
					<h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-gray-900 dark:text-gray-100">
						{fest?.name || 'Arvantis'}{' '}
						<span className="text-blue-600 dark:text-blue-400">
							{fest?.year ? `’${String(fest.year).slice(-2)}` : ''}
						</span>
					</h1>
					<div className="flex items-center gap-3 mb-4">
						<StatusPill status={fest?.status} />
						<div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
							<Calendar size={16} />
							<span>
								{formatDate(fest?.startDate)} — {formatDate(fest?.endDate)}
							</span>
						</div>
					</div>
					<p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
						{fest?.description ||
							'Annual flagship tech & innovation fest by Syntax Club.'}
					</p>
				</div>

				<div className="relative bg-gray-100 dark:bg-gray-800">
					{posterUrl ? (
						<img
							src={posterUrl}
							alt={`${fest?.name || 'Arvantis'} Poster`}
							className="w-full h-full object-cover"
							loading="lazy"
						/>
					) : (
						<div className="w-full h-full min-h-[220px] flex items-center justify-center">
							<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
								<ImageIcon size={18} />
								<span className="text-sm">Poster not available</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

const StatCard = ({ icon: Icon, label, value }) => (
	<div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-3">
		<div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
			<Icon size={18} />
		</div>
		<div>
			<div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
			<div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
		</div>
	</div>
);

const PartnersGrid = ({ partners }) => {
	if (!partners?.length) return null;
	return (
		<section>
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-lg font-semibold">Partners</h3>
				<div className="text-xs text-gray-500 dark:text-gray-400">
					{partners.length} total
				</div>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
				{partners.map((p, idx) => (
					<a
						key={`${p?.name || 'partner'}-${idx}`}
						href={p?.website || '#'}
						target={p?.website ? '_blank' : '_self'}
						rel="noopener noreferrer"
						className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-500 transition flex items-center justify-center"
						title={p?.name}
					>
						{p?.logo?.url ? (
							<img
								src={p.logo.url}
								alt={p.name || 'Partner'}
								loading="lazy"
								className="max-h-10 object-contain opacity-90 group-hover:opacity-100 transition"
							/>
						) : (
							<span className="text-xs text-gray-600 dark:text-gray-400">
								{p?.name || 'Partner'}
							</span>
						)}
					</a>
				))}
			</div>
		</section>
	);
};

const EventsGrid = ({ events, onEventClick }) => {
	if (!events?.length) return null;
	return (
		<section>
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-lg font-semibold">Events</h3>
				<div className="text-xs text-gray-500 dark:text-gray-400">
					{events.length} total
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{events.map((e) => (
					<button
						key={e?._id || e?.id || e?.name}
						onClick={() => onEventClick(e)}
						className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition text-left"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200">
								{e?.type || 'General'}
							</span>
							<div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
								<Calendar size={14} />
								{formatDate(e?.eventDate)}
							</div>
						</div>
						<div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
							{e?.name || 'Event'}
						</div>
					</button>
				))}
			</div>
		</section>
	);
};

const GalleryGrid = ({ gallery, onImageClick }) => {
	if (!gallery?.length) return null;
	return (
		<section>
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-lg font-semibold">Gallery</h3>
				<div className="text-xs text-gray-500 dark:text-gray-400">
					{gallery.length} media
				</div>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
				{gallery.map((m, idx) => (
					<button
						key={m?.publicId || idx}
						onClick={() => onImageClick(m)}
						className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-video"
					>
						<img
							src={m?.url}
							alt={m?.caption || `Gallery ${idx + 1}`}
							loading="lazy"
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						/>
						<div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
					</button>
				))}
			</div>
		</section>
	);
};

const ImageLightbox = ({ image, onClose }) => {
	if (!image) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.8, y: 20 }}
				animate={{ scale: 1, y: 0 }}
				exit={{ scale: 0.8, y: 20 }}
				className="relative"
				onClick={(e) => e.stopPropagation()}
			>
				<img
					src={image.url}
					alt={image.caption || 'Gallery Image'}
					className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
				/>
				<button
					onClick={onClose}
					className="absolute -top-3 -right-3 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
					aria-label="Close image view"
				>
					<X size={20} />
				</button>
			</motion.div>
		</motion.div>
	);
};

const EditionsStrip = ({ editions, currentIdentifier, onSelect }) => {
	if (!editions?.length) return null;
	return (
		<div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-x-auto">
			<div className="flex items-center gap-2">
				<span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
					Past editions
				</span>
				<ChevronRight className="text-gray-400" size={16} />
				<div className="flex items-center gap-2">
					{editions.map((f) => {
						const id = f?.slug || String(f?.year || '');
						const active = id && id === currentIdentifier;
						return (
							<button
								key={id}
								onClick={() => onSelect(id)}
								className={`px-2.5 py-1 rounded-md text-xs border transition ${
									active
										? 'bg-blue-600 text-white border-blue-600'
										: 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
								}`}
								title={`${f?.name || 'Arvantis'} ${f?.year || ''}`}
							>
								{f?.year || 'Year'}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
};

const ArvantisPage = () => {
	const [identifier, setIdentifier] = useState(null);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [selectedImage, setSelectedImage] = useState(null);

	const landingQuery = useQuery({
		queryKey: ['arvantis', 'landing'],
		queryFn: getArvantisLandingData,
		staleTime: 60_000,
	});

	const editionsQuery = useQuery({
		queryKey: ['arvantis', 'editions', { page: 1, limit: 12 }],
		queryFn: () => getAllFests({ page: 1, limit: 12, sortBy: 'year', sortOrder: 'desc' }),
		staleTime: 60_000,
	});

	const editions = useMemo(() => {
		const raw = editionsQuery.data;
		// Handle possible shapes: { data: [...] } or { docs: [...] } or array
		if (Array.isArray(raw?.data)) return raw.data;
		if (Array.isArray(raw?.docs)) return raw.docs;
		if (Array.isArray(raw)) return raw;
		return [];
	}, [editionsQuery.data]);

	useEffect(() => {
		// Set initial identifier from landing or first edition
		if (identifier) return;
		const l = landingQuery.data;
		if (l?.slug || l?.year) {
			setIdentifier(l.slug || String(l.year));
		} else if (editions.length > 0) {
			setIdentifier(editions[0].slug || String(editions[0].year));
		}
	}, [identifier, landingQuery.data, editions]);

	const detailsQuery = useQuery({
		queryKey: ['arvantis', 'details', identifier],
		queryFn: () => getFestDetails(identifier),
		enabled: !!identifier,
		staleTime: 60_000,
	});

	const fest = detailsQuery.data || landingQuery.data || null;

	const stats = useMemo(() => {
		return [
			{ icon: Layers3, label: 'Edition', value: fest?.year || '—' },
			{ icon: Users, label: 'Partners', value: fest?.partners?.length || 0 },
			{ icon: Calendar, label: 'Events', value: fest?.events?.length || 0 },
			{ icon: ImageIcon, label: 'Gallery', value: fest?.gallery?.length || 0 },
		];
	}, [fest]);

	const isLoadingOverall =
		landingQuery.isLoading ||
		(!identifier && editionsQuery.isLoading) ||
		detailsQuery.isLoading;

	const isErrorOverall = landingQuery.isError || detailsQuery.isError;
	const errorMsg =
		landingQuery.error?.message || detailsQuery.error?.message || 'Unknown error occurred.';

	const handleEventClick = useCallback((event) => {
		setSelectedEvent(event);
	}, []);

	const handleImageClick = useCallback((image) => {
		setSelectedImage(image);
	}, []);

	const closeModal = useCallback(() => {
		setSelectedEvent(null);
		setSelectedImage(null);
	}, []);

	return (
		<div className="min-h-screen max-w-7xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
			<header className="mb-6">
				<h2 className="text-3xl font-bold tracking-tight">Arvantis</h2>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					Annual flagship fest by Syntax Club
				</p>
			</header>

			{isErrorOverall ? (
				<ErrorBlock
					message={errorMsg}
					onRetry={() => {
						landingQuery.refetch();
						editionsQuery.refetch();
						if (identifier) detailsQuery.refetch();
					}}
				/>
			) : isLoadingOverall && !fest ? (
				<LoadingBlock />
			) : !fest ? (
				<div className="py-20 text-center">
					<h3 className="text-xl font-semibold mb-2">No fest data available</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Check back later for updates.
					</p>
				</div>
			) : (
				<>
					<PosterHero fest={fest} />

					<div className="mt-4">
						<EditionsStrip
							editions={editions}
							currentIdentifier={identifier}
							onSelect={(id) => {
								setIdentifier(id);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
						/>
					</div>

					<section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
						{stats.map((s, idx) => (
							<StatCard key={idx} icon={s.icon} label={s.label} value={s.value} />
						))}
					</section>

					<div className="mt-8 grid grid-cols-1 gap-8">
						<EventsGrid events={fest?.events} onEventClick={handleEventClick} />
						<PartnersGrid partners={fest?.partners} />
						<GalleryGrid gallery={fest?.gallery} onImageClick={handleImageClick} />
					</div>
				</>
			)}
			<AnimatePresence>
				{selectedEvent && (
					<EventDetailModal
						event={selectedEvent}
						isOpen={!!selectedEvent}
						onClose={closeModal}
					/>
				)}
				{selectedImage && <ImageLightbox image={selectedImage} onClose={closeModal} />}
			</AnimatePresence>
		</div>
	);
};

export default ArvantisPage;
