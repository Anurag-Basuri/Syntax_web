import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	getArvantisLandingData,
	getFestDetails,
	getAllFests,
} from '../../services/arvantisServices.js';
import EventDetailModal from '../../components/event/EventDetailModal.jsx';
import {
	Calendar,
	Image as ImageIcon,
	Layers3,
	Users,
	Filter,
	ExternalLink,
	ChevronDown,
	ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosterHero from '../../components/Arvantis/PosterHero.jsx';
import EditionsStrip from '../../components/Arvantis/EditionsStrip.jsx';
import StatCard from '../../components/Arvantis/StatCard.jsx';
import EventsGrid from '../../components/Arvantis/EventsGrid.jsx';
import GalleryGrid from '../../components/Arvantis/GalleryGrid.jsx';
import ImageLightbox from '../../components/Arvantis/ImageLightbox.jsx';
import ErrorBlock from '../../components/Arvantis/ErrorBlock.jsx';
import LoadingBlock from '../../components/Arvantis/LoadingBlock.jsx';
import '../../arvantis.css';

/**
 * Major rewrite: industry-grade Arvantis page
 * - Edition switcher moved to top
 * - "Arvantis {year} — powered by {TitleSponsor}" heading
 * - Improved partners presentation with tier grouping and expandable lists
 * - Full event, tracks, faqs, contacts presentation where available
 * - Sticky ticket CTA, robust loading + error handling
 * - Accessibility & keyboard friendly interactions
 */

const ITEMS_IN_PAST_SECTION = 8;
const PARTNERS_PREVIEW = 8;

const safeArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const fmtDate = (d) => {
	if (!d) return 'TBA';
	const dt = new Date(d);
	if (isNaN(dt.getTime())) return String(d);
	return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeLanding = (raw) => {
	if (!raw) return null;
	if (raw.fest) {
		const f = { ...raw.fest };
		f.hero = raw.hero ?? f.hero ?? f.posters?.[0] ?? null;
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

const groupPartnersByTier = (partners = [], titleSponsor = null) => {
	const map = new Map();
	(partners || []).forEach((p) => {
		if (!p) return;
		if (titleSponsor && p.name === titleSponsor.name) return;
		const tier = (p.tier || 'partner').toLowerCase();
		if (!map.has(tier)) map.set(tier, []);
		map.get(tier).push(p);
	});
	// return array of [tier, list] sorted by common priority
	const order = [
		'title',
		'presenting',
		'platinum',
		'gold',
		'silver',
		'sponsor',
		'partner',
		'collaborator',
	];
	const arr = Array.from(map.entries()).sort((a, b) => {
		const ai = order.indexOf(a[0]);
		const bi = order.indexOf(b[0]);
		return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
	});
	return arr;
};

const ArvantisPage = () => {
	// primary state
	const [identifier, setIdentifier] = useState(null);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [selectedImage, setSelectedImage] = useState(null);
	const [showPastEditions, setShowPastEditions] = useState(false);
	const [showAllPartners, setShowAllPartners] = useState(false);
	const [expandedTiers, setExpandedTiers] = useState({});
	const [showTracks, setShowTracks] = useState(false);
	const [showFaqs, setShowFaqs] = useState(false);

	// Event filters
	const [eventType, setEventType] = useState('all');
	const [eventSort, setEventSort] = useState('date-desc');

	// queries
	const landingQuery = useQuery({
		queryKey: ['arvantis', 'landing'],
		queryFn: getArvantisLandingData,
		staleTime: 60_000,
		retry: 1,
	});
	const editionsQuery = useQuery({
		queryKey: ['arvantis', 'editions'],
		queryFn: () => getAllFests({ page: 1, limit: 50, sortBy: 'year', sortOrder: 'desc' }),
		staleTime: 60_000,
		retry: 1,
	});

	// normalize editions result (support paginated shape)
	const editions = useMemo(() => {
		const raw = editionsQuery.data;
		if (!raw) return [];
		if (Array.isArray(raw)) return raw;
		if (Array.isArray(raw.docs)) return raw.docs;
		if (Array.isArray(raw.data)) return raw.data;
		if (raw?.docs && Array.isArray(raw.docs)) return raw.docs;
		return [];
	}, [editionsQuery.data]);

	const landingFest = useMemo(() => normalizeLanding(landingQuery.data), [landingQuery.data]);

	// default identifier - landing -> first edition
	useEffect(() => {
		if (identifier) return;
		if (landingFest) {
			const id = landingFest.slug || String(landingFest.year || '');
			if (id) {
				setIdentifier(id);
				return;
			}
		}
		if (editions && editions.length) {
			const first = editions[0];
			const id = first?.slug || String(first?.year || '');
			if (id) setIdentifier(id);
		}
	}, [identifier, landingFest, editions]);

	// details query for chosen edition
	const detailsQuery = useQuery({
		queryKey: ['arvantis', 'details', identifier],
		queryFn: () => (identifier ? getFestDetails(identifier) : Promise.resolve(null)),
		enabled: !!identifier,
		staleTime: 60_000,
		retry: 1,
	});

	// resolved fest: prefer details (explicit selection), else landingFest
	const fest = useMemo(() => {
		if (detailsQuery.data) return detailsQuery.data;
		return landingFest ?? null;
	}, [detailsQuery.data, landingFest]);

	// derived collections
	const events = useMemo(() => safeArray(fest?.events), [fest]);
	const partners = useMemo(() => safeArray(fest?.partners), [fest]);
	const titleSponsor = useMemo(() => findTitleSponsor(partners), [partners]);
	const partnersByTier = useMemo(
		() => groupPartnersByTier(partners, titleSponsor),
		[partners, titleSponsor]
	);

	// helper: detect if an event offers registration now (safe checks)
	const isEventRegistrationOpen = useCallback((ev) => {
		if (!ev) return false;
		// prefer server-provided virtual
		if (
			typeof ev.registrationInfo === 'object' &&
			typeof ev.registrationInfo.isOpen === 'boolean'
		) {
			return Boolean(ev.registrationInfo.isOpen);
		}
		// external registration with URL -> treat as available
		if (ev.registration?.mode === 'external' && ev.registration?.externalUrl) return true;
		// internal registration: respect optional window
		if (ev.registration?.mode === 'internal') {
			const open = ev.registrationOpenDate
				? new Date(ev.registrationOpenDate).getTime()
				: null;
			const close = ev.registrationCloseDate
				? new Date(ev.registrationCloseDate).getTime()
				: null;
			const now = Date.now();
			if (open && now < open) return false;
			if (close && now > close) return false;
			// if capacity exists, we assume open unless closed by virtual flag
			return true;
		}
		return false;
	}, []);

	// count events that currently allow registration (used for CTA)
	const openEventRegistrationCount = useMemo(() => {
		return events.reduce((acc, ev) => acc + (isEventRegistrationOpen(ev) ? 1 : 0), 0);
	}, [events, isEventRegistrationOpen]);

	// filtered events
	const filteredEvents = useMemo(() => {
		let out = [...events];
		if (eventType && eventType !== 'all')
			out = out.filter((e) => (e.type || 'general') === eventType);
		out.sort((a, b) => {
			const ad = new Date(a.eventDate || a.date || 0).getTime();
			const bd = new Date(b.eventDate || b.date || 0).getTime();
			if (eventSort === 'date-asc') return ad - bd;
			return bd - ad;
		});
		return out;
	}, [events, eventType, eventSort]);

	// other editions (excluding current)
	const otherEditions = useMemo(() => {
		if (!editions || editions.length === 0) return [];
		const id = identifier;
		return editions.filter((f) => {
			const fid = f?.slug || String(f?.year || '');
			return fid !== id;
		});
	}, [editions, identifier]);

	// stats
	const stats = useMemo(() => {
		const safe = fest || {};
		return [
			{ icon: Layers3, label: 'Edition', value: safe.year ?? '—' },
			{ icon: Users, label: 'Partners', value: safe.partners?.length ?? 0 },
			{ icon: Calendar, label: 'Events', value: safe.events?.length ?? 0 },
			{ icon: ImageIcon, label: 'Gallery', value: safe.gallery?.length ?? 0 },
		];
	}, [fest]);

	// loading / error states
	const isLoading = landingQuery.isLoading || editionsQuery.isLoading || detailsQuery.isLoading;
	const isError = landingQuery.isError || editionsQuery.isError || detailsQuery.isError;
	const errorMsg =
		landingQuery.error?.message ||
		detailsQuery.error?.message ||
		editionsQuery.error?.message ||
		'Failed to load data.';

	// handlers
	const handleSelectEdition = useCallback((id) => {
		if (!id) return;
		setIdentifier(id);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	const handleEventClick = useCallback((ev) => setSelectedEvent(ev), []);
	const handleImageClick = useCallback((img) => setSelectedImage(img), []);
	const toggleTier = useCallback(
		(tier) => setExpandedTiers((s) => ({ ...s, [tier]: !s[tier] })),
		[]
	);

	// accessibility: focus edition strip on mount
	const stripRef = useRef(null);
	useEffect(() => {
		if (stripRef.current && typeof stripRef.current.focus === 'function')
			stripRef.current.focus();
	}, []);

	// small presentational helpers
	const renderPartnerItem = (p, key) => {
		const logo = p?.logo?.url;
		return (
			<a
				key={key}
				href={p.website || '#'}
				target={p.website ? '_blank' : '_self'}
				rel={p.website ? 'noopener noreferrer' : undefined}
				className="partner-cell group flex items-center justify-center p-3 rounded-xl transition-transform duration-300"
				title={p.name}
				style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
				onClick={(e) => e.stopPropagation()}
			>
				{logo ? (
					<img src={logo} alt={p.name} className="partner-logo" loading="lazy" />
				) : (
					<div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
						{p.name}
					</div>
				)}
			</a>
		);
	};

	return (
		<div className="min-h-screen arvantis-page" role="region" aria-labelledby="arvantis-title">
			<div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
				{/* Header */}
				<header className="mb-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h1
								id="arvantis-title"
								className="text-4xl md:text-5xl lg:text-6xl font-extrabold"
							>
								<span>Arvantis</span>
								{fest?.year ? (
									<span className="ml-3 accent-neon">{fest.year}</span>
								) : null}
								{titleSponsor ? (
									<span
										className="ml-4 text-lg text-[var(--text-secondary)]"
										aria-hidden
									>
										— powered by{' '}
										{titleSponsor.logo?.url ? (
											<img
												src={titleSponsor.logo.url}
												alt={titleSponsor.name}
												style={{ height: 20, verticalAlign: 'middle' }}
											/>
										) : (
											<strong>{titleSponsor.name}</strong>
										)}
									</span>
								) : null}
							</h1>
							<p className="mt-2 text-base md:text-lg text-[var(--text-secondary)] max-w-3xl">
								{fest?.tagline ??
									fest?.subtitle ??
									'A celebration of tech, creativity and collaboration.'}
							</p>

							{/* quick meta */}
							<div className="mt-3 flex flex-wrap gap-3 items-center text-sm text-[var(--text-secondary)]">
								<div className="code-chip">{fest?.location || 'Location TBA'}</div>
								<div className="code-chip">
									{fest?.computed?.computedStatus ||
										fest?.status ||
										'Status unknown'}
								</div>
								<div className="code-chip">
									{fest?.durationDays
										? `${fest.durationDays} day(s)`
										: fest?.startDate
										? `${fmtDate(fest.startDate)} — ${fmtDate(fest.endDate)}`
										: 'Dates TBA'}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<button
								onClick={() => {
									setShowPastEditions(false);
									if (landingFest)
										setIdentifier(
											landingFest.slug || String(landingFest.year || '')
										);
								}}
								className="btn-ghost"
							>
								Latest landing
							</button>

							{/* CTA changed: festival-level registration is not supported; link to events instead */}
							<button
								onClick={() => (window.location.hash = '#events')}
								className="btn-primary neon-btn"
								title="Register for events (per-event registration)"
							>
								Register for events
							</button>
						</div>
					</div>

					{/* Edition selector (top) */}
					{editions.length > 0 && (
						<div ref={stripRef} tabIndex={-1} className="mt-4">
							<EditionsStrip
								editions={editions}
								currentIdentifier={identifier}
								onSelect={handleSelectEdition}
								landingIdentifier={
									landingFest
										? landingFest.slug || String(landingFest.year || '')
										: null
								}
							/>
						</div>
					)}
				</header>

				{/* Main */}
				{isError ? (
					<ErrorBlock
						message={errorMsg}
						onRetry={() => {
							landingQuery.refetch();
							editionsQuery.refetch();
							detailsQuery.refetch();
						}}
					/>
				) : isLoading && !fest ? (
					<LoadingBlock label="Loading festival..." />
				) : !fest ? (
					<div className="py-16 text-center">
						<h2 className="text-2xl font-semibold">No festival data</h2>
						<p className="mt-2 text-[var(--text-secondary)]">
							We'll add content here soon.
						</p>
					</div>
				) : (
					<>
						{/* Hero */}
						<PosterHero fest={fest} />

						{/* Top area - stats + CTAs */}
						<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
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

							<div>
								<div className="glass-card p-4 flex flex-col gap-3">
									<div className="text-sm text-[var(--text-secondary)]">
										Quick actions
									</div>
									<div className="flex flex-col gap-2">
										<a href="#events" className="btn-ghost">
											Explore events
										</a>

										{/* festival-level tickets removed; guide users to events */}
										<button
											className="btn-primary neon-btn"
											onClick={() => (window.location.hash = '#events')}
											title="Open events list; register per-event"
										>
											Register for events
										</button>
									</div>

									<div className="mt-3 text-sm text-[var(--text-secondary)]">
										Registration is per-event. Open an event to view
										registration details and register.
									</div>
								</div>
							</div>
						</div>

						{/* Events section */}
						<section id="events" className="mt-8">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="section-title">Events</h3>
									<p className="muted">
										Sessions, workshops and competitions — full details
										available on click.
									</p>
								</div>

								<div className="flex items-center gap-2">
									<select
										value={eventType}
										onChange={(e) => setEventType(e.target.value)}
										className="rounded-md border py-2 px-3 bg-[var(--input-bg)]"
									>
										<option value="all">All types</option>
										{Array.from(
											new Set(events.map((ev) => ev.type || 'general'))
										).map((t) => (
											<option key={t} value={t}>
												{t}
											</option>
										))}
									</select>
									<select
										value={eventSort}
										onChange={(e) => setEventSort(e.target.value)}
										className="rounded-md border py-2 px-3 bg-[var(--input-bg)]"
									>
										<option value="date-desc">Newest first</option>
										<option value="date-asc">Oldest first</option>
									</select>
								</div>
							</div>

							<EventsGrid events={filteredEvents} onEventClick={handleEventClick} />
						</section>

						{/* Tracks & FAQs */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
							{/* Tracks */}
							<div className="glass-card p-4">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-[var(--text-secondary)]">
											Tracks
										</div>
										<div className="font-semibold">
											{(fest.tracks || []).length} tracks
										</div>
									</div>
									<button
										onClick={() => setShowTracks((s) => !s)}
										className="btn-ghost small"
									>
										{showTracks ? 'Hide' : 'View'}
									</button>
								</div>
								{showTracks && (fest.tracks || []).length > 0 ? (
									<ul className="mt-3 space-y-2">
										{(fest.tracks || []).map((t) => (
											<li key={t.key} className="detail-card p-3">
												<div className="font-semibold">{t.title}</div>
												{t.description && (
													<div className="text-sm mt-1 muted">
														{t.description}
													</div>
												)}
											</li>
										))}
									</ul>
								) : (
									showTracks && (
										<div className="mt-3 muted">No tracks defined.</div>
									)
								)}
							</div>

							{/* FAQs */}
							<div className="glass-card p-4">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-[var(--text-secondary)]">
											FAQ
										</div>
										<div className="font-semibold">
											{(fest.faqs || []).length} items
										</div>
									</div>
									<button
										onClick={() => setShowFaqs((s) => !s)}
										className="btn-ghost small"
									>
										{showFaqs ? 'Hide' : 'View'}
									</button>
								</div>

								{/* Improved FAQ presentation: long rows with Question (left) and Answer (right).
									Uses responsive grid: stacked on small screens, long rows on md+. */}
								{showFaqs && (fest.faqs || []).length > 0 ? (
									<div
										className="mt-3 space-y-4"
										aria-live="polite"
										aria-label="Frequently asked questions"
									>
										{(fest.faqs || []).map((f, i) => (
											<div key={f._id || i} className="detail-card p-4">
												<dl className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
													<dt
														className="md:col-span-4 font-semibold text-base"
														style={{ color: 'var(--text-primary)' }}
													>
														{f.question}
													</dt>
													<dd className="md:col-span-8 text-sm muted whitespace-pre-wrap">
														{f.answer || 'No answer provided.'}
													</dd>
												</dl>
											</div>
										))}
									</div>
								) : (
									showFaqs && <div className="mt-3 muted">No FAQs yet.</div>
								)}
							</div>

							{/* Partners snapshot */}
							<div className="glass-card p-4">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-[var(--text-secondary)]">
											Partners
										</div>
										<div className="font-semibold">
											{partners.length} partners
										</div>
									</div>
									<button
										onClick={() => setShowAllPartners((s) => !s)}
										className="btn-ghost small"
									>
										{showAllPartners ? 'Collapse' : 'Expand'}
									</button>
								</div>

								{titleSponsor && (
									<div
										className="mt-4 p-3 rounded-md border flex items-center gap-3"
										style={{
											background:
												'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
										}}
									>
										<div
											style={{
												width: 120,
												height: 56,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											{titleSponsor.logo?.url ? (
												<img
													src={titleSponsor.logo.url}
													alt={titleSponsor.name}
													style={{ maxHeight: 56, objectFit: 'contain' }}
												/>
											) : (
												<strong>{titleSponsor.name}</strong>
											)}
										</div>
										<div className="flex-1">
											<div className="text-xs text-[var(--text-secondary)]">
												Title Sponsor
											</div>
											<div className="font-semibold">{titleSponsor.name}</div>
											{titleSponsor.description && (
												<div className="text-sm muted">
													{titleSponsor.description}
												</div>
											)}
										</div>
										{titleSponsor.website && (
											<a
												href={titleSponsor.website}
												target="_blank"
												rel="noreferrer"
												className="btn-ghost small"
											>
												<ExternalLink size={14} />
											</a>
										)}
									</div>
								)}

								{/* grouped tiers (preview or full) */}
								<div className="mt-4 space-y-4">
									{partnersByTier.map(([tier, list]) => {
										const showAll = expandedTiers[tier] || showAllPartners;
										return (
											<div key={tier}>
												<div className="flex items-center justify-between mb-2">
													<div className="text-sm font-semibold">
														{tier.toUpperCase()}
													</div>
													<div className="text-xs muted">
														{list.length}
													</div>
												</div>
												<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
													{(showAll
														? list
														: list.slice(0, PARTNERS_PREVIEW)
													).map((p, i) =>
														renderPartnerItem(p, `${tier}-${i}`)
													)}
												</div>
												{list.length > PARTNERS_PREVIEW && (
													<div className="mt-2 text-right">
														<button
															onClick={() => toggleTier(tier)}
															className="btn-ghost small"
														>
															{showAll ? (
																<>
																	<ChevronUp size={14} /> Show
																	less
																</>
															) : (
																<>
																	<ChevronDown size={14} /> Show
																	all
																</>
															)}
														</button>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</div>

						{/* Gallery */}
						{Array.isArray(fest.gallery) && fest.gallery.length > 0 && (
							<section className="mt-8">
								<h3 className="section-title">Gallery</h3>
								<GalleryGrid
									gallery={fest.gallery}
									onImageClick={handleImageClick}
								/>
							</section>
						)}

						{/* Past editions */}
						<section className="mt-8">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="section-title">Past editions</h3>
									<p className="muted">
										Browse and switch to previous Arvantis editions.
									</p>
								</div>
								<div>
									<button
										onClick={() => setShowPastEditions((s) => !s)}
										className="btn-ghost small"
									>
										{showPastEditions ? 'Hide' : 'Expand'}
									</button>
									<button
										onClick={() => {
											if (landingFest)
												setIdentifier(
													landingFest.slug ||
														String(landingFest.year || '')
												);
											window.scrollTo({ top: 0, behavior: 'smooth' });
										}}
										className="btn-ghost small ml-2"
									>
										Back to landing
									</button>
								</div>
							</div>

							{showPastEditions ? (
								<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
									{otherEditions.length === 0 ? (
										<div className="muted">No previous editions.</div>
									) : (
										otherEditions.slice(0, ITEMS_IN_PAST_SECTION).map((e) => {
											const id = e?.slug || String(e?.year || '');
											return (
												<article
													key={id}
													className="rounded-xl overflow-hidden border bg-[var(--card-bg)]"
													role="article"
												>
													<div className="h-36 overflow-hidden bg-gray-100">
														<img
															src={
																e?.poster?.url || e?.hero?.url || ''
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
																<div className="text-xs muted mt-1">
																	{e?.year}
																</div>
															</div>
															<button
																onClick={() =>
																	handleSelectEdition(id)
																}
																className="btn-primary neon-btn small"
															>
																View
															</button>
														</div>
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
									landingIdentifier={
										landingFest
											? landingFest.slug || String(landingFest.year || '')
											: null
									}
								/>
							)}
						</section>
					</>
				)}
			</div>

			{/* Sticky CTA: shows when any event has registration open or external registration link */}
			{openEventRegistrationCount > 0 && (
				<a href="#events" className="arv-sticky-cta" title="Events open for registration">
					<div className="cta-btn">
						Register — {openEventRegistrationCount} event
						{openEventRegistrationCount > 1 ? 's' : ''}
					</div>
					<div className="mini">Open</div>
				</a>
			)}

			{/* Modals */}
			<AnimatePresence>
				{selectedEvent && (
					<EventDetailModal
						event={selectedEvent}
						isOpen={!!selectedEvent}
						onClose={() => setSelectedEvent(null)}
					/>
				)}
				{selectedImage && (
					<ImageLightbox image={selectedImage} onClose={() => setSelectedImage(null)} />
				)}
			</AnimatePresence>
		</div>
	);
};

/* Small inline icon for sticky CTA to avoid extra import when ticketUrl exists */
const TicketIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
		<path
			d="M3 7h18v10H3z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M8 12h.01"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export default ArvantisPage;
