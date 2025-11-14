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
		<div className="min-h-screen bg-gray-900 text-gray-100">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
				<header className="mb-8">
					<h2 className="text-4xl font-extrabold tracking-tight text-white">Arvantis</h2>
					<p className="text-lg text-gray-400 mt-1">
						The annual flagship fest by Syntax Club.
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
						<h3 className="text-2xl font-semibold mb-2">No Fest Data Available</h3>
						<p className="text-gray-400">
							Please check back later for updates on Arvantis.
						</p>
					</div>
				) : (
					<div className="space-y-12">
						<PosterHero fest={fest} />

						<EditionsStrip
							editions={editions}
							currentIdentifier={identifier}
							onSelect={(id) => {
								setIdentifier(id);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
						/>

						<div className="bg-gray-900/50 rounded-2xl p-6">
							<section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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

						<div className="space-y-12">
							<EventsGrid events={fest?.events} onEventClick={handleEventClick} />
							<PartnersGrid partners={fest?.partners} />
							<GalleryGrid gallery={fest?.gallery} onImageClick={handleImageClick} />
						</div>
					</div>
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
		</div>
	);
};

export default ArvantisPage;
