import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getArvantisLandingData,
  getFestDetails,
  getAllFests,
} from '../../services/arvantisServices.js';
import EventDetailModal from '../../components/event/EventDetailModal.jsx';
import { Calendar, Image as ImageIcon, Layers3, Users, Search, Filter, ChevronDown } from 'lucide-react';
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
import '../../arvantis.css';

const ITEMS_IN_PAST_SECTION = 8;

const safeArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const ArvantisPage = () => {
	const [identifier, setIdentifier] = useState(null);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [selectedImage, setSelectedImage] = useState(null);

	// Event controls
	const [eventQuery, setEventQuery] = useState('');
	const [eventType, setEventType] = useState('all');
	const [eventSort, setEventSort] = useState('date-desc');

	// Past editions drawer
	const [showPastEditions, setShowPastEditions] = useState(false);

	// Landing (latest) edition
	const landingQuery = useQuery({
		queryKey: ['arvantis', 'landing'],
		queryFn: getArvantisLandingData,
		staleTime: 60_000,
		retry: 1,
	});

	// Editions list (past editions)
	const editionsQuery = useQuery({
		queryKey: ['arvantis', 'editions', { page: 1, limit: 50 }],
		queryFn: () => getAllFests({ page: 1, limit: 50, sortBy: 'year', sortOrder: 'desc' }),
		staleTime: 60_000,
		retry: 1,
	});

	// Normalize editions array from possible server shapes
	const editions = useMemo(() => {
		const raw = editionsQuery.data;
		if (!raw) return [];
		if (Array.isArray(raw)) return raw;
		if (Array.isArray(raw.docs)) return raw.docs;
		if (Array.isArray(raw.data)) return raw.data;
		const payload = raw?.data ?? raw;
		if (Array.isArray(payload)) return payload;
		if (Array.isArray(payload?.docs)) return payload.docs;
		return [];
	}, [editionsQuery.data]);

	// When the page opens, prefer landing (latest) edition; otherwise first edition
	useEffect(() => {
		// If identifier already set (user navigated), keep it
		if (identifier) return;

		// pick landing first
		const landing = landingQuery.data;
		if (landing) {
			const id = landing.slug || String(landing.year || '');
			if (id) {
				setIdentifier(id);
				return;
			}
		}
		// fallback to first edition in list
		if (editions.length > 0) {
			const first = editions[0];
			const id = first?.slug || String(first?.year || '');
			if (id) setIdentifier(id);
		}
	}, [identifier, landingQuery.data, editions]);

	// Details for selected identifier (fetch when identifier exists)
	const detailsQuery = useQuery({
		queryKey: ['arvantis', 'details', identifier],
		queryFn: () => getFestDetails(identifier),
		enabled: !!identifier,
		staleTime: 60_000,
		retry: 1,
	});

	// Resolve which fest to display: detailsQuery -> landing fallback
	const fest = useMemo(() => detailsQuery.data ?? landingQuery.data ?? null, [detailsQuery.data, landingQuery.data]);

	// Stats for cards with defensive access
	const stats = useMemo(() => {
		const safeFest = fest || {};
		return [
			{ icon: Layers3, label: 'Edition', value: safeFest?.year ?? '—' },
			{ icon: Users, label: 'Partners', value: safeFest?.partners?.length ?? 0 },
			{ icon: Calendar, label: 'Events', value: safeFest?.events?.length ?? 0 },
			{ icon: ImageIcon, label: 'Gallery', value: safeFest?.gallery?.length ?? 0 },
		];
	}, [fest]);

	// Loading / error aggregates
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

	/* -------------------------
	   Event selection and filtering
	   ------------------------- */
	const events = useMemo(() => safeArray(fest?.events), [fest]);
	const eventTypes = useMemo(() => {
		const types = new Set(events.map((e) => e.type || 'general'));
		return ['all', ...Array.from(types)];
	}, [events]);

	const filteredEvents = useMemo(() => {
		let out = events.slice();
		if (eventType && eventType !== 'all') out = out.filter((e) => (e.type || 'general') === eventType);
		if (eventQuery && eventQuery.trim()) {
			const q = eventQuery.trim().toLowerCase();
			out = out.filter((e) => {
				const hay = `${e.title || e.name || ''} ${e.description || ''}`.toLowerCase();
				return hay.includes(q);
			});
		}
		// sort
		out.sort((a, b) => {
			const ad = new Date(a.eventDate || a.date || 0).getTime();
			const bd = new Date(b.eventDate || b.date || 0).getTime();
			if (eventSort === 'date-asc') return ad - bd;
			if (eventSort === 'date-desc') return bd - ad;
			return bd - ad;
		});
		return out;
	}, [events, eventType, eventQuery, eventSort]);

	/* -------------------------
	   Previous editions subset (cards)
	   ------------------------- */
	const otherEditions = useMemo(() => {
		if (!editions || editions.length === 0) return [];
		const id = identifier;
		return editions.filter((f) => {
			const fid = f?.slug || String(f?.year || '');
			return fid !== id;
		});
	}, [editions, identifier]);

	/* -------------------------
	   Handlers
	   ------------------------- */
	const handleEventClick = useCallback((event) => {
		const normalized = {
			...event,
			title: event.title ?? event.name ?? '',
			eventDate: event.eventDate ?? event.date ?? null,
			posters: Array.isArray(event.posters) ? event.posters : event.posters ? [event.posters] : [],
		};
		setSelectedEvent(normalized);
	}, []);

	const handleImageClick = useCallback((image) => setSelectedImage(image), []);
	const closeModal = useCallback(() => {
		setSelectedEvent(null);
		setSelectedImage(null);
	}, []);

	// When user selects an edition from strip or cards: set identifier and scroll to top
	const handleSelectEdition = useCallback((id) => {
		if (!id) return;
		setIdentifier(id);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	// Prefetch details for the identifiers in the editions list (optional: warms cache)
	const prefetchRef = useRef(false);
	useEffect(() => {
		// Only prefetch once and when we have editions
		if (prefetchRef.current) return;
		if (!editions || editions.length === 0) return;
		// ask react-query to warm fetch details for first few editions
		try {
			// minimal: fetch first 4 editions details in background
			editions.slice(0, 4).forEach((f) => {
				const id = f?.slug || String(f?.year || '');
				if (id && id !== identifier) {
					// calling getFestDetails directly is fine, but better: use queryCache (not necessary here)
					// Keep light: don't block UI
					getFestDetails(id).catch(() => {});
				}
			});
		} catch {}
		prefetchRef.current = true;
	}, [editions, identifier]);

	/* -------------------------
	   Render
	   ------------------------- */
	return (
		<div className="min-h-screen" style={{ background: 'transparent', color: 'var(--text-primary)' }}>
			<div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16">
				{/* Header / Title */}
				<header className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
					<div>
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, system-ui' }}>
							Arvantis
							<span className="ml-2 text-[var(--accent-1)]">{fest?.year ? ` ’${String(fest.year).slice(-2)}` : ''}</span>
						</h2>
						<p className="text-base md:text-lg mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
							{fest?.subtitle || 'The annual flagship fest by Syntax Club focused on tech, creativity and collaboration.'}
						</p>
					</div>

					<div className="flex gap-3 items-center">
						<a href="#register" className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold shadow-xl transition-transform transform hover:scale-105" style={{ background: 'var(--button-primary-bg)', color: 'var(--text-primary)' }}>
							Register
						</a>
						<button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--button-secondary-bg)', color: 'var(--text-primary)', border: `1px solid var(--button-secondary-border)` }}>
							See Gallery
						</button>
					</div>
				</header>

				{/* Error / Loading / No data */}
				{isErrorOverall ? (
					<ErrorBlock message={errorMsg} onRetry={() => { landingQuery.refetch(); editionsQuery.refetch(); if (identifier) detailsQuery.refetch(); }} />
				) : isLoadingOverall && !fest ? (
					<LoadingBlock />
				) : !fest ? (
					<div className="py-24 text-center">
						<h3 className="text-3xl font-bold mb-3">No Fest Data Available</h3>
						<p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Please check back later for updates on Arvantis.</p>
					</div>
				) : (
					<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-12">
						{/* Poster / Hero (primary detail) */}
						<PosterHero fest={fest} />

						{/* Editions strip (prominent) */}
						<EditionsStrip
							editions={editions}
							currentIdentifier={identifier}
							onSelect={handleSelectEdition}
							landingIdentifier={landingQuery.data ? (landingQuery.data.slug || String(landingQuery.data.year || '')) : null}
						/>

						{/* Stats row */}
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
							{stats.map((s, idx) => (
								<StatCard key={idx} icon={s.icon} label={s.label} value={s.value} index={idx} />
							))}
						</div>

						{/* Events section with inline filters */}
						<section id="events" className="rounded-3xl p-6" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
								<div>
									<h3 className="text-xl font-semibold">Events</h3>
									<p className="text-sm mt-1 text-[var(--text-secondary)]">Explore sessions, workshops and competitions from this edition.</p>
								</div>

								{/* Controls */}
								<div className="flex items-center gap-2">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
										<input value={eventQuery} onChange={(e) => setEventQuery(e.target.value)} placeholder="Search events..." className="pl-10 pr-3 py-2 rounded-lg border border-[var(--glass-border)] bg-[var(--input-bg)]" />
									</div>

									<select value={eventType} onChange={(e) => setEventType(e.target.value)} className="rounded-md border border-[var(--glass-border)] py-2 px-3 bg-[var(--input-bg)]">
										{eventTypes.map((t) => <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>)}
									</select>

									<select value={eventSort} onChange={(e) => setEventSort(e.target.value)} className="rounded-md border border-[var(--glass-border)] py-2 px-3 bg-[var(--input-bg)]">
										<option value="date-desc">Newest first</option>
										<option value="date-asc">Oldest first</option>
									</select>
								</div>
							</div>

							{/* Events grid with filteredEvents */}
							<EventsGrid events={filteredEvents} onEventClick={handleEventClick} />
						</section>

						{/* Partners */}
						<section className="rounded-3xl p-6" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>
							<h3 className="text-xl font-semibold mb-4">Partners</h3>
							<PartnersGrid partners={Array.isArray(fest?.partners) ? fest.partners : []} />
						</section>

						{/* Gallery */}
						<section className="rounded-3xl p-6" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>
							<h3 className="text-xl font-semibold mb-4">Gallery</h3>
							<GalleryGrid gallery={Array.isArray(fest?.gallery) ? fest.gallery : []} onImageClick={handleImageClick} />
						</section>

						{/* Past editions preview */}
						<section className="rounded-3xl p-6" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>
							<div className="flex items-center justify-between gap-3 mb-4">
								<div>
									<h3 className="text-xl font-semibold">Past Editions</h3>
									<p className="text-sm mt-1 text-[var(--text-secondary)]">Browse earlier Arvantis editions and their highlights.</p>
								</div>
								<button onClick={() => setShowPastEditions((s) => !s)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--button-secondary-bg)] border border-[var(--button-secondary-border)]">
									<Filter size={14} /> {showPastEditions ? 'Hide' : 'Show'} editions
								</button>
							</div>

							{/* Collapsible list */}
							{showPastEditions ? (
								<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
									{otherEditions.length === 0 ? (
										<div className="text-sm text-[var(--text-secondary)]">No previous editions found.</div>
									) : (
										otherEditions.slice(0, ITEMS_IN_PAST_SECTION).map((e) => {
											const id = e?.slug || String(e?.year || '');
											return (
												<article key={id} className="rounded-xl overflow-hidden border border-[var(--glass-border)] bg-[var(--card-bg)] shadow-sm">
													{/* poster */}
													<div className="h-36 w-full overflow-hidden bg-gray-100">
														<img src={e?.poster?.url || e?.cover || ''} alt={e?.name || `Arvantis ${e?.year}`} className="w-full h-full object-cover" loading="lazy" />
													</div>
													<div className="p-4">
														<div className="flex items-center justify-between">
															<div>
																<div className="font-semibold">{e?.name || `Arvantis ${e?.year}`}</div>
																<div className="text-xs text-[var(--text-muted)] mt-1">{e?.year}</div>
															</div>
															<button onClick={() => handleSelectEdition(id)} className="text-sm px-3 py-1 rounded-md bg-[var(--button-primary-bg)] text-white">View</button>
														</div>
														{e?.subtitle && <p className="mt-2 text-sm text-[var(--text-secondary)] truncate">{e.subtitle}</p>}
													</div>
												</article>
											);
										})
									)}
								</div>
							) : (
								// compact inline strip if collapsed: show a few pills (reuses EditionsStrip)
								<EditionsStrip editions={editions} currentIdentifier={identifier} onSelect={handleSelectEdition} landingIdentifier={landingQuery.data ? (landingQuery.data.slug || String(landingQuery.data.year || '')) : null} />
							)}
						</section>
					</motion.div>
				)}
			</div>

			{/* Modals */}
			<AnimatePresence>
				{selectedEvent && <EventDetailModal event={selectedEvent} isOpen={!!selectedEvent} onClose={closeModal} />}
				{selectedImage && <ImageLightbox image={selectedImage} onClose={closeModal} />}
			</AnimatePresence>
		</div>
	);
};

export default ArvantisPage;
