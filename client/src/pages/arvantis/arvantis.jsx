import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	getArvantisLandingData,
	getFestDetails,
	getAllFests,
} from '../../services/arvantisServices.js';
import EventDetailModal from '../../components/event/EventDetailModal.jsx';
import { Calendar, Image as ImageIcon, Layers3, Users, Filter } from 'lucide-react';
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

const normalizeLanding = (raw) => {
	if (!raw) return null;
	if (raw.fest) {
		const f = { ...raw.fest };
		f.hero = raw.hero ?? f.hero ?? (f.poster ? f.poster : null);
		f.events = raw.events ?? f.events ?? [];
		f.partners = raw.partners ?? f.partners ?? [];
		f.computed = raw.computed ?? {};
		return f;
	}
	return raw;
};

const findTitleSponsor = (partners = []) => {
	if (!partners || partners.length === 0) return null;
	const byTier = partners.find(
		(p) => p.tier && /title|title-sponsor|presenting|powered by|lead/i.test(p.tier)
	);
	if (byTier) return byTier;
	const byFlag = partners.find((p) => p.isTitleSponsor || p.role === 'title' || p.titleSponsor);
	if (byFlag) return byFlag;
	return (
		partners.find((p) =>
			/title sponsor|powered by|presented by/i.test(`${p.name} ${p.description || ''}`)
		) || null
	);
};

const ArvantisPage = () => {
	const [identifier, setIdentifier] = useState(null);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [selectedImage, setSelectedImage] = useState(null);

	// Event controls
	const [eventType, setEventType] = useState('all');
	const [eventSort, setEventSort] = useState('date-desc');

	// UI controls
	const [showPastEditions, setShowPastEditions] = useState(false);
	const [showLandingFirst, setShowLandingFirst] = useState(true);
	const [showAllPartners, setShowAllPartners] = useState(false); // new: toggle view all partners

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

	// landing normalized
	const landingRaw = landingQuery.data;
	const landingFest = useMemo(() => normalizeLanding(landingRaw), [landingRaw]);

	// Default identifier behavior: prefer landing slug/year first
	useEffect(() => {
		if (identifier) return;
		if (landingFest) {
			const id = landingFest.slug || String(landingFest.year || '');
			if (id) {
				setIdentifier(id);
				return;
			}
		}
		if (editions.length > 0) {
			const first = editions[0];
			const id = first?.slug || String(first?.year || '');
			if (id) setIdentifier(id);
		}
	}, [identifier, landingFest, editions]);

	// Details for selected identifier
	const detailsQuery = useQuery({
		queryKey: ['arvantis', 'details', identifier],
		queryFn: () => (identifier ? getFestDetails(identifier) : Promise.resolve(null)),
		enabled: !!identifier,
		staleTime: 60_000,
		retry: 1,
	});

	// Resolve which fest to display: detailsQuery -> landing fallback (landing first if requested)
	const fest = useMemo(() => {
		if (showLandingFirst && landingFest) {
			const landingId = landingFest.slug || String(landingFest.year || '');
			if (!identifier || landingId === identifier) return landingFest;
		}
		if (detailsQuery.data) return detailsQuery.data;
		return landingFest ?? null;
	}, [detailsQuery.data, landingFest, identifier, showLandingFirst]);

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
		if (eventType && eventType !== 'all')
			out = out.filter((e) => (e.type || 'general') === eventType);
		// sort
		out.sort((a, b) => {
			const ad = new Date(a.eventDate || a.date || 0).getTime();
			const bd = new Date(b.eventDate || b.date || 0).getTime();
			if (eventSort === 'date-asc') return ad - bd;
			if (eventSort === 'date-desc') return bd - ad;
			return bd - ad;
		});
		return out;
	}, [events, eventType, eventSort]);

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
     Partners handling & title sponsor
     ------------------------- */
	const partners = useMemo(() => (Array.isArray(fest?.partners) ? fest.partners : []), [fest]);
	const titleSponsor = useMemo(() => findTitleSponsor(partners), [partners]);
	const otherPartnersByTier = useMemo(() => {
		const map = {};
		(partners || []).forEach((p) => {
			const tier = (p.tier || 'partner').toLowerCase();
			if (titleSponsor && p.name === titleSponsor.name) return;
			map[tier] = map[tier] || [];
			map[tier].push(p);
		});
		return map;
	}, [partners, titleSponsor]);

	/* -------------------------
     Handlers
     ------------------------- */
	const handleEventClick = useCallback((event) => {
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

	const handleImageClick = useCallback((image) => setSelectedImage(image), []);
	const closeModal = useCallback(() => {
		setSelectedEvent(null);
		setSelectedImage(null);
	}, []);

	// When user selects an edition from strip or cards: set identifier and scroll to top
	const handleSelectEdition = useCallback((id) => {
		if (!id) return;
		setShowLandingFirst(false);
		setIdentifier(id);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	// Prefetch details for the identifiers in the editions list (optional: warms cache)
	const prefetchRef = useRef(false);
	useEffect(() => {
		if (prefetchRef.current) return;
		if (!editions || editions.length === 0) return;
		try {
			editions.slice(0, 6).forEach((f) => {
				const id = f?.slug || String(f?.year || '');
				if (id && id !== identifier) {
					getFestDetails(id).catch(() => {});
				}
			});
		} catch {}
		prefetchRef.current = true;
	}, [editions, identifier]);

	/* -------------------------
     Render helpers
     ------------------------- */
	const renderPartnerLogo = (p, i, opts = {}) => {
		const size = opts.size || 72;
		const url = p?.logo?.url || null;
		const name = p?.name || 'Partner';
		return (
			<a
				key={`${name}-${i}`}
				href={p.website || '#'}
				target={p.website ? '_blank' : '_self'}
				rel={p.website ? 'noopener noreferrer' : undefined}
				className="partner-cell group flex items-center justify-center p-3 rounded-xl transition-transform duration-300"
				title={name}
				style={{
					minHeight: size,
					minWidth: size * 1.8,
					background: 'var(--glass-bg)',
					border: '1px solid var(--glass-border)',
				}}
				onClick={(e) => opts.onClick && opts.onClick(p, e)}
			>
				{url ? (
					<img
						src={url}
						alt={name}
						loading="lazy"
						style={{ maxHeight: size, objectFit: 'contain' }}
						className="partner-logo"
					/>
				) : (
					<div
						style={{
							height: size,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: 8,
						}}
					>
						<span
							className="text-sm font-semibold"
							style={{ color: 'var(--text-primary)' }}
						>
							{name}
						</span>
					</div>
				)}
			</a>
		);
	};

	/* -------------------------
     Render
     ------------------------- */
	const landingIdentifier = landingFest
		? landingFest.slug || String(landingFest.year || '')
		: null;

	return (
		<div className="min-h-screen arvantis-page" style={{ color: 'var(--text-primary)' }}>
			<div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
				{/* Header */}
				<header className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div>
						{/* Title + inline "powered by" for title sponsor */}
						<div className="flex items-center gap-4">
							<h1
								className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight"
								style={{ fontFamily: 'Space Grotesk, system-ui' }}
							>
								<span>Arvantis</span>
								{fest?.year ? (
									<span className="ml-3 accent-neon">{fest.year}</span>
								) : null}
							</h1>

							{titleSponsor && (
								<div
									className="ml-3 text-sm text-[var(--text-secondary)] flex items-center gap-3"
									aria-hidden
								>
									<span className="uppercase text-xs">powered by</span>
									{titleSponsor.logo?.url ? (
										<a
											href={titleSponsor.website || '#'}
											target="_blank"
											rel="noreferrer"
											className="flex items-center gap-2"
										>
											<img
												src={titleSponsor.logo.url}
												alt={titleSponsor.name}
												style={{ height: 40, objectFit: 'contain' }}
											/>
										</a>
									) : (
										<a
											href={titleSponsor.website || '#'}
											target="_blank"
											rel="noreferrer"
											className="font-semibold"
										>
											{titleSponsor.name}
										</a>
									)}
								</div>
							)}
						</div>

						<p className="mt-2 text-base md:text-lg text-[var(--text-secondary)] max-w-2xl">
							{fest?.tagline ||
								'A celebration of tech, creativity and collaboration — by Syntax Club.'}
						</p>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={() => {
								setShowLandingFirst(true);
								if (landingIdentifier) setIdentifier(landingIdentifier);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
							className="btn-primary neon-btn"
							title="Show landing (latest) edition"
						>
							View Landing
						</button>

						<button
							onClick={() => setShowPastEditions((s) => !s)}
							className="btn-ghost"
							title={
								showPastEditions ? 'Collapse past editions' : 'Show past editions'
							}
						>
							{showPastEditions ? 'Hide Past' : 'Past Editions'}
						</button>
					</div>
				</header>

				{/* Edition selector moved to top for quick switching */}
				{editions && editions.length > 0 && (
					<div className="mb-6">
						<EditionsStrip
							editions={editions}
							currentIdentifier={identifier}
							onSelect={handleSelectEdition}
							landingIdentifier={landingIdentifier}
						/>
					</div>
				)}

				{/* Main content */}
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
						<h3 className="text-3xl font-bold mb-3">No Fest Data Available</h3>
						<p className="text-lg text-[var(--text-secondary)]">
							Please check back later for updates on Arvantis.
						</p>
					</div>
				) : (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4 }}
						className="space-y-8"
					>
						{/* Hero */}
						<PosterHero fest={fest} />

						{/* Top quick stats + CTAs */}
						<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
							<div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
								{stats.map((s, i) => (
									<StatCard
										key={s.label}
										icon={s.icon}
										label={s.label}
										value={s.value}
										index={i}
									/>
								))}
							</div>

							<div className="lg:col-span-1">
								<div className="glass-card p-4">
									<div className="text-sm text-[var(--text-secondary)]">
										Quick actions
									</div>
									<div className="mt-3 flex flex-col gap-3">
										<a href="#events" className="btn-ghost">
											Explore events
										</a>
										{fest?.registrationUrl || fest?.tickets?.url ? (
											<a
												href={fest.registrationUrl || fest.tickets.url}
												target="_blank"
												rel="noreferrer"
												className="btn-primary neon-btn"
											>
												Register / Tickets
											</a>
										) : (
											<a href="#register" className="btn-primary neon-btn">
												Register
											</a>
										)}
									</div>

									<div className="mt-4 text-sm text-[var(--text-secondary)]">
										Status:{' '}
										<strong className="mono">
											{fest?.computed?.computedStatus || fest?.status}
										</strong>
									</div>
								</div>
							</div>
						</div>

						{/* Events */}
						<section
							id="events"
							className="rounded-3xl p-6"
							style={{
								background: 'transparent',
								border: '1px solid var(--glass-border)',
							}}
						>
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="text-xl font-semibold">Events</h3>
									<p className="text-sm mt-1 text-[var(--text-secondary)]">
										Explore sessions, workshops and competitions from this
										edition.
									</p>
								</div>

								<div className="flex items-center gap-2">
									<select
										value={eventType}
										onChange={(e) => setEventType(e.target.value)}
										className="rounded-md border border-[var(--glass-border)] py-2 px-3 bg-[var(--input-bg)]"
									>
										{eventTypes.map((t) => (
											<option key={t} value={t}>
												{t === 'all' ? 'All types' : t}
											</option>
										))}
									</select>
									<select
										value={eventSort}
										onChange={(e) => setEventSort(e.target.value)}
										className="rounded-md border border-[var(--glass-border)] py-2 px-3 bg-[var(--input-bg)]"
									>
										<option value="date-desc">Newest first</option>
										<option value="date-asc">Oldest first</option>
									</select>
								</div>
							</div>

							<EventsGrid events={filteredEvents} onEventClick={handleEventClick} />
						</section>

						{/* Partners - improved presentation */}
						<section
							className="rounded-3xl p-6"
							style={{
								background: 'transparent',
								border: '1px solid var(--glass-border)',
							}}
						>
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="text-xl font-semibold">Partners</h3>
									<p className="text-sm mt-1 text-[var(--text-secondary)]">
										Our partners power Arvantis — special thanks to the title
										sponsor.
									</p>
								</div>
								<div className="text-sm text-[var(--text-secondary)]">
									{partners.length} partners
								</div>
							</div>

							{/* prominent title sponsor card (if present) */}
							{titleSponsor && (
								<div
									className="mb-6 rounded-xl p-4 flex items-center gap-4"
									style={{
										background:
											'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
										border: '1px solid rgba(255,255,255,0.03)',
									}}
								>
									<div
										style={{
											width: 160,
											height: 72,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										{titleSponsor.logo?.url ? (
											<img
												src={titleSponsor.logo.url}
												alt={titleSponsor.name}
												style={{ maxHeight: 72, objectFit: 'contain' }}
											/>
										) : (
											<div className="font-semibold">{titleSponsor.name}</div>
										)}
									</div>

									<div className="flex-1">
										<div className="text-sm text-[var(--text-secondary)]">
											Title sponsor
										</div>
										<div
											className="text-2xl font-bold"
											style={{ color: 'var(--text-primary)' }}
										>
											{titleSponsor.name}
										</div>
										{titleSponsor.description && (
											<div className="text-sm mt-1 text-[var(--text-secondary)]">
												{titleSponsor.description}
											</div>
										)}
									</div>

									<div className="ml-auto flex flex-col gap-2 items-end">
										{titleSponsor.website && (
											<a
												href={titleSponsor.website}
												target="_blank"
												rel="noreferrer"
												className="btn-primary neon-btn"
											>
												Visit
											</a>
										)}
										<button
											onClick={() =>
												window.open(titleSponsor.website || '#', '_blank')
											}
											className="btn-ghost"
										>
											Sponsor details
										</button>
									</div>
								</div>
							)}

							{/* grouped partner tiers with larger logos & optional "show all" */}
							<div className="grid gap-6">
								{Object.keys(otherPartnersByTier).length === 0 ? (
									<div className="text-sm text-[var(--text-secondary)]">
										No partners listed yet.
									</div>
								) : (
									Object.entries(otherPartnersByTier).map(([tier, list]) => {
										const visible = showAllPartners ? list : list.slice(0, 8);
										return (
											<div key={tier}>
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-3">
														<div
															className="text-sm font-semibold"
															style={{
																color: 'var(--text-secondary)',
															}}
														>
															{tier.toUpperCase()}
														</div>
														<div className="text-xs text-[var(--text-secondary)]">
															{list.length} partners
														</div>
													</div>
													{list.length > 8 && (
														<button
															onClick={() =>
																setShowAllPartners((s) => !s)
															}
															className="text-sm btn-ghost"
														>
															{showAllPartners
																? 'Show less'
																: `Show all (${list.length})`}
														</button>
													)}
												</div>

												{/* responsive horizontal grid of logos (larger) */}
												<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
													{visible.map((p, i) =>
														renderPartnerLogo(p, `${tier}-${i}`, {
															size: 72,
														})
													)}
												</div>
											</div>
										);
									})
								)}
							</div>
						</section>

						{/* Gallery */}
						<section
							className="rounded-3xl p-6"
							style={{
								background: 'transparent',
								border: '1px solid var(--glass-border)',
							}}
						>
							<h3 className="text-xl font-semibold mb-4">Gallery</h3>
							<GalleryGrid
								gallery={Array.isArray(fest?.gallery) ? fest.gallery : []}
								onImageClick={handleImageClick}
							/>
						</section>

						{/* Past editions */}
						<section
							className="rounded-3xl p-6"
							style={{
								background: 'transparent',
								border: '1px solid var(--glass-border)',
							}}
						>
							<div className="flex items-center justify-between gap-3 mb-4">
								<div>
									<h3 className="text-xl font-semibold">Past Editions</h3>
									<p className="text-sm mt-1 text-[var(--text-secondary)]">
										Browse previous Arvantis editions and jump to the one you
										want to explore.
									</p>
								</div>

								<div className="flex items-center gap-2">
									<button
										onClick={() => setShowPastEditions((s) => !s)}
										className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--button-secondary-bg)] border border-[var(--button-secondary-border)]"
									>
										<Filter size={14} />{' '}
										{showPastEditions ? 'Collapse' : 'Expand'}
									</button>
									<button
										onClick={() => {
											window.scrollTo({ top: 0, behavior: 'smooth' });
											setShowLandingFirst(true);
											if (landingIdentifier) setIdentifier(landingIdentifier);
										}}
										className="btn-ghost"
									>
										Back to landing
									</button>
								</div>
							</div>

							{showPastEditions ? (
								<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
									{otherEditions.length === 0 ? (
										<div className="text-sm text-[var(--text-secondary)]">
											No previous editions found.
										</div>
									) : (
										otherEditions.slice(0, ITEMS_IN_PAST_SECTION).map((e) => {
											const id = e?.slug || String(e?.year || '');
											return (
												<article
													key={id}
													className="rounded-xl overflow-hidden border border-[var(--glass-border)] bg-[var(--card-bg)] shadow-sm"
												>
													<div className="h-36 w-full overflow-hidden bg-gray-100">
														<img
															src={
																e?.poster?.url ||
																e?.cover ||
																e?.hero?.url ||
																''
															}
															alt={e?.name || `Arvantis ${e?.year}`}
															className="w-full h-full object-cover"
															loading="lazy"
														/>
													</div>
													<div className="p-4">
														<div className="flex items-center justify-between">
															<div>
																<div className="font-semibold">
																	{e?.name ||
																		`Arvantis ${e?.year}`}
																</div>
																<div className="text-xs text-[var(--text-muted)] mt-1">
																	{e?.year}
																</div>
															</div>
															<button
																onClick={() =>
																	handleSelectEdition(id)
																}
																className="text-sm px-3 py-1 rounded-md bg-[var(--button-primary-bg)] text-white"
															>
																View
															</button>
														</div>
														{e?.tagline && (
															<p className="mt-2 text-sm text-[var(--text-secondary)] truncate">
																{e.tagline}
															</p>
														)}
													</div>
												</article>
											);
										})
									)}
								</div>
							) : (
								<EditionsStrip
									editions={editions}
									currentIdentifier={identifier}
									onSelect={handleSelectEdition}
									landingIdentifier={landingIdentifier}
								/>
							)}
						</section>
					</motion.div>
				)}
			</div>

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
	);
};

export default ArvantisPage;
