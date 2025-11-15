import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	getArvantisLandingData,
	getFestDetails,
	getAllFests,
} from '../../services/arvantisServices.js';
import EventDetailModal from '../../components/event/EventDetailModal.jsx';
import { Calendar, Image as ImageIcon, Layers3, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosterHero from '../../components/Arvantis/PosterHero.jsx';
import EditionsStrip from '../../components/Arvantis/EditionsStrip.jsx';
import StatCard from '../../components/Arvantis/StatCard.jsx';
import EventsGrid from '../../components/Arvantis/EventsGrid.jsx';
import PartnersGrid from '../../components/Arvantis/PartnersGrid.jsx';
import GalleryGrid from '../../components/Arvantis/GalleryGrid.jsx';
import ImageLightbox from '../../components/Arvantis/ImageLightbox.jsx';
import ErrorBlock from '../../components/Arvantis/ErrorBlock.jsx';
import LoadingBlock from '../../components/Arvantis/LoadingBlock.jsx';

const ArvantisPage = () => {
	const [identifier, setIdentifier] = useState(null);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [selectedImage, setSelectedImage] = useState(null);

	// Landing query (current or most recent fest)
	const landingQuery = useQuery({
		queryKey: ['arvantis', 'landing'],
		queryFn: getArvantisLandingData,
		staleTime: 60_000,
		retry: 1,
	});

	// Editions list (past editions)
	const editionsQuery = useQuery({
		queryKey: ['arvantis', 'editions', { page: 1, limit: 12 }],
		queryFn: () => getAllFests({ page: 1, limit: 12, sortBy: 'year', sortOrder: 'desc' }),
		staleTime: 60_000,
		retry: 1,
	});

	// Normalize editions array from possible server shapes
	const editions = useMemo(() => {
		const raw = editionsQuery.data;
		if (!raw) return [];
		// server might return pagination shape or plain array
		if (Array.isArray(raw)) return raw;
		if (Array.isArray(raw.docs)) return raw.docs;
		if (Array.isArray(raw.data)) return raw.data;
		// fallback: try nested data
		const payload = raw?.data ?? raw;
		if (Array.isArray(payload)) return payload;
		if (Array.isArray(payload?.docs)) return payload.docs;
		return [];
	}, [editionsQuery.data]);

	// Initialize identifier from landing or editions (only once)
	useEffect(() => {
		if (identifier) return;
		// prefer landing if available
		const landing = landingQuery.data;
		if (landing) {
			const id = landing.slug || String(landing.year || '');
			if (id) {
				setIdentifier(id);
				return;
			}
		}
		// fallback to first edition from editions list
		if (editions.length > 0) {
			const first = editions[0];
			const id = first?.slug || String(first?.year || '');
			if (id) {
				setIdentifier(id);
			}
		}
	}, [identifier, landingQuery.data, editions]);

	// Details for selected identifier (only when identifier present)
	const detailsQuery = useQuery({
		queryKey: ['arvantis', 'details', identifier],
		queryFn: () => getFestDetails(identifier),
		enabled: !!identifier,
		staleTime: 60_000,
		retry: 1,
	});

	// Resolve the fest to display (details -> landing fallback)
	const fest = useMemo(() => {
		return detailsQuery.data ?? landingQuery.data ?? null;
	}, [detailsQuery.data, landingQuery.data]);

	// Stats for UI cards (defensive access)
	const stats = useMemo(() => {
		const safeFest = fest || {};
		return [
			{ icon: Layers3, label: 'Edition', value: safeFest?.year ?? '—' },
			{ icon: Users, label: 'Partners', value: safeFest?.partners?.length ?? 0 },
			{ icon: Calendar, label: 'Events', value: safeFest?.events?.length ?? 0 },
			{ icon: ImageIcon, label: 'Gallery', value: safeFest?.gallery?.length ?? 0 },
		];
	}, [fest]);

	const isLoadingOverall =
		landingQuery.isLoading ||
		(!identifier && editionsQuery.isLoading) ||
		detailsQuery.isLoading;

	const isErrorOverall = landingQuery.isError || detailsQuery.isError || editionsQuery.isError;
	const errorMsg =
		landingQuery.error?.message ||
		detailsQuery.error?.message ||
		editionsQuery.error?.message ||
		'Unknown error occurred.';

	const handleEventClick = useCallback((event) => {
		// normalize event object if server returns different keys
		const normalized = {
			...event,
			title: event.title ?? event.name ?? '',
			eventDate: event.eventDate ?? event.date ?? null,
			posters: Array.isArray(event.posters)
				? event.posters
				: event.posters
				? [event.posters]
				: [],
		};
		setSelectedEvent(normalized);
	}, []);

	const handleImageClick = useCallback((image) => {
		setSelectedImage(image);
	}, []);

	const closeModal = useCallback(() => {
		setSelectedEvent(null);
		setSelectedImage(null);
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100 font-sans">
			<div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16">
				<header className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
					<div>
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg leading-tight">
							Arvantis
							<span className="ml-2 text-cyan-400 font-extrabold">
								{fest?.year ? ` ’${String(fest.year).slice(-2)}` : ''}
							</span>
						</h2>
						<p className="text-base md:text-lg text-gray-300 mt-2 max-w-2xl">
							{fest?.subtitle ||
								'The annual flagship fest by Syntax Club focused on tech, creativity and collaboration.'}
						</p>
					</div>

					<div className="flex gap-3 items-center">
						<a
							href="#register"
							className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow-xl transition-transform transform hover:scale-105"
						>
							Register
						</a>
						<button
							onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
							className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/6 hover:bg-white/8 text-sm text-gray-100"
						>
							See Gallery
						</button>
					</div>
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
					<div className="py-24 text-center">
						<h3 className="text-3xl font-bold mb-3 text-white">No Fest Data Available</h3>
						<p className="text-lg text-gray-400">Please check back later for updates on Arvantis.</p>
					</div>
				) : (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-12">
						{/* Poster / Hero */}
						<PosterHero fest={fest} />

						{/* Editions / selector */}
						<EditionsStrip
							editions={editions}
							currentIdentifier={identifier}
							onSelect={(id) => {
								if (!id) return;
								setIdentifier(id);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
						/>

						{/* Stats */}
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
							{stats.map((s, idx) => (
								<StatCard key={idx} icon={s.icon} label={s.label} value={s.value} index={idx} />
							))}
						</div>

						{/* Main content sections */}
						<div className="space-y-10">
							<div className="rounded-3xl p-6 bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-gray-800 shadow-xl">
								<EventsGrid events={Array.isArray(fest?.events) ? fest.events : []} onEventClick={handleEventClick} />
							</div>

							<div className="rounded-3xl p-6 bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-gray-800 shadow-xl">
								<PartnersGrid partners={Array.isArray(fest?.partners) ? fest.partners : []} />
							</div>

							<div className="rounded-3xl p-6 bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-gray-800 shadow-xl">
								<GalleryGrid gallery={Array.isArray(fest?.gallery) ? fest.gallery : []} onImageClick={handleImageClick} />
							</div>
						</div>
					</motion.div>
				)}

				{/* Modals */}
				<AnimatePresence>
					{selectedEvent && <EventDetailModal event={selectedEvent} isOpen={!!selectedEvent} onClose={closeModal} />}
					{selectedImage && <ImageLightbox image={selectedImage} onClose={closeModal} />}
				</AnimatePresence>
			</div>
		</div>
	);
};

export default ArvantisPage;
