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
				console.debug('[ArvantisPage] set identifier from landing', id);
				setIdentifier(id);
				return;
			}
		}
		// fallback to first edition from editions list
		if (editions.length > 0) {
			const first = editions[0];
			const id = first?.slug || String(first?.year || '');
			if (id) {
				console.debug('[ArvantisPage] set identifier from editions', id);
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

	// Defensive UI: show loading / error / empty states
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100 font-sans">
			<div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16">
				<header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<h2 className="text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg">
							Arvantis
						</h2>
						<p className="text-xl text-gray-400 mt-2 font-medium">
							The annual flagship fest by{' '}
							<span className="text-cyan-400 font-bold">Syntax Club</span>.
						</p>
					</div>
					<div className="flex gap-4">
						<a
							href="#register"
							className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold shadow-xl transition-all duration-300 transform hover:scale-105"
						>
							<span className="hidden sm:inline">Register Now</span>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 8l4 4m0 0l-4 4m4-4H3"
								/>
							</svg>
						</a>
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
						<h3 className="text-3xl font-bold mb-3 text-white">
							No Fest Data Available
						</h3>
						<p className="text-lg text-gray-400">
							Please check back later for updates on Arvantis.
						</p>
					</div>
				) : (
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7 }}
						className="space-y-16"
					>
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
						<div className="bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/80 rounded-3xl p-8 shadow-2xl border border-gray-800">
							<section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
								{stats.map((s, idx) => (
									<StatCard
										key={idx}
										icon={s.icon}
										label={s.label}
										value={s.value}
										index={idx}
									/>
								))}
							</section>
						</div>

						{/* Main content sections */}
						<div className="space-y-16">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1, duration: 0.7 }}
								className="rounded-2xl bg-gradient-to-br from-gray-900/70 to-gray-800/80 p-8 shadow-lg"
							>
								<EventsGrid
									events={Array.isArray(fest?.events) ? fest.events : []}
									onEventClick={handleEventClick}
								/>
							</motion.div>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2, duration: 0.7 }}
								className="rounded-2xl bg-gradient-to-br from-gray-900/70 to-gray-800/80 p-8 shadow-lg"
							>
								<PartnersGrid
									partners={Array.isArray(fest?.partners) ? fest.partners : []}
								/>
							</motion.div>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3, duration: 0.7 }}
								className="rounded-2xl bg-gradient-to-br from-gray-900/70 to-gray-800/80 p-8 shadow-lg"
							>
								<GalleryGrid
									gallery={Array.isArray(fest?.gallery) ? fest.gallery : []}
									onImageClick={handleImageClick}
								/>
							</motion.div>
						</div>
					</motion.div>
				)}

				{/* Modals */}
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
		</div>
	);
};

export default ArvantisPage;
