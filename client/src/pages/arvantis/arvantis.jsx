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
	Copy,
	HelpCircle,
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

/* --- Prominent Partners section --- */
const PartnersSection = ({
	titleSponsor,
	partnersByTier = [],
	partners = [],
	showAll,
	onToggleShowAll,
	onPartnerClick = () => {},
	previewLimit = PARTNERS_PREVIEW,
}) => {
	const visiblePartners = showAll ? partners : partners.slice(0, previewLimit);

	return (
		<section aria-labelledby="arvantis-partners" className="mt-8">
			<h3 id="arvantis-partners" className="section-title">
				Partners & Sponsors
			</h3>

			{/* Title sponsor / powered-by prominent banner */}
			{titleSponsor ? (
				<div
					className="glass-card p-5 mt-4 flex flex-col md:flex-row items-center gap-4"
					role="region"
					aria-label="Title sponsor"
				>
					<div className="flex items-center gap-4">
						<div
							className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center"
							style={{ border: '1px solid rgba(255,255,255,0.04)' }}
						>
							{titleSponsor.logo?.url ? (
								<img
									src={titleSponsor.logo.url}
									alt={titleSponsor.name}
									className="w-full h-full object-contain"
								/>
							) : (
								<div
									className="text-sm font-semibold mono"
									style={{ color: 'var(--text-primary)' }}
								>
									{titleSponsor.name}
								</div>
							)}
						</div>
						<div>
							<div className="text-sm text-[var(--text-secondary)]">
								Title sponsor
							</div>
							<div
								className="text-xl font-extrabold"
								style={{ color: 'var(--text-primary)' }}
							>
								{titleSponsor.name}
							</div>
							{titleSponsor.tier && (
								<div className="text-xs muted mt-1">{titleSponsor.tier}</div>
							)}
						</div>
					</div>

					{/* description and details */}
					<div className="flex-1 text-sm text-[var(--text-secondary)] md:pl-6">
						{titleSponsor.description ? (
							<p className="mb-2" style={{ color: 'var(--text-primary)' }}>
								{titleSponsor.description}
							</p>
						) : (
							<p className="mb-2 muted">No description provided.</p>
						)}
						<div className="flex items-center gap-3">
							{titleSponsor.website && (
								<a
									href={titleSponsor.website}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => e.stopPropagation()}
									className="btn-ghost small"
								>
									<ExternalLink size={14} /> Visit website
								</a>
							)}
							{titleSponsor.contact && (
								<div className="text-xs muted">Contact: {titleSponsor.contact}</div>
							)}
						</div>
					</div>

					{/* CTA */}
					<div className="mt-3 md:mt-0 md:flex-shrink-0">
						<a
							href={titleSponsor.website || '#'}
							target={titleSponsor.website ? '_blank' : '_self'}
							rel={titleSponsor.website ? 'noopener noreferrer' : undefined}
							onClick={(e) => e.stopPropagation()}
							className="btn-primary neon-btn"
							style={{ whiteSpace: 'nowrap' }}
						>
							Learn about {titleSponsor.name}
						</a>
					</div>
				</div>
			) : (
				<div className="muted mt-2">No title sponsor for this edition.</div>
			)}

			{/* All partners preview + tiered groups */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-start">
				{/* Left: quick stats / summary */}
				<div className="glass-card p-4">
					<div className="text-sm text-[var(--text-secondary)]">Partners summary</div>
					<div
						className="font-semibold text-2xl mono"
						style={{ color: 'var(--text-primary)' }}
					>
						{partners.length}
					</div>
					<div className="mt-3 text-sm muted">
						Partners are shown grouped by tier. Click a logo to open their website.
					</div>
					<button
						onClick={onToggleShowAll}
						className="btn-ghost small mt-4"
						aria-pressed={showAll}
					>
						{showAll ? 'Show less' : `Show all (${partners.length})`}
					</button>
				</div>

				{/* Middle: featured grid (visiblePartners) */}
				<div className="glass-card p-4 lg:col-span-1">
					<div className="text-sm text-[var(--text-secondary)]">Featured partners</div>
					<div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
						{visiblePartners.length === 0 ? (
							<div className="muted">No partners yet.</div>
						) : (
							visiblePartners.map((p, idx) => (
								<button
									key={p?.name || idx}
									onClick={() => {
										onPartnerClick(p);
										if (p.website) window.open(p.website, '_blank', 'noopener');
									}}
									className="partner-cell group flex items-center justify-center p-3 rounded-xl transition-transform duration-300"
									title={p.name}
									style={{
										background: 'var(--glass-bg)',
										border: '1px solid var(--glass-border)',
									}}
								>
									{p.logo?.url ? (
										<img
											src={p.logo.url}
											alt={p.name}
											className="partner-logo"
											loading="lazy"
										/>
									) : (
										<div
											className="text-sm font-semibold"
											style={{ color: 'var(--text-primary)' }}
										>
											{p.name}
										</div>
									)}
								</button>
							))
						)}
					</div>
				</div>

				{/* Right: tiered listing with descriptions */}
				<div className="glass-card p-4">
					<div className="text-sm text-[var(--text-secondary)]">Partner tiers</div>
					<div className="mt-3 space-y-3">
						{partnersByTier.length === 0 ? (
							<div className="muted">No partners listed.</div>
						) : (
							partnersByTier.map(([tier, list]) => (
								<div key={tier} className="detail-card p-3">
									<div className="flex items-center justify-between">
										<div
											className="font-semibold"
											style={{ color: 'var(--text-primary)' }}
										>
											{tier.replace(/(^\w)|-\w/g, (m) => m.toUpperCase())} (
											{list.length})
										</div>
									</div>

									<ul className="mt-3 grid grid-cols-1 gap-2">
										{list.map((p, i) => (
											<li
												key={`${p.name}-${i}`}
												className="flex items-start gap-3"
											>
												<div
													className="w-12 h-10 rounded-md overflow-hidden bg-white/3 flex items-center justify-center"
													style={{
														border: '1px solid rgba(255,255,255,0.02)',
													}}
												>
													{p.logo?.url ? (
														<img
															src={p.logo.url}
															alt={p.name}
															className="w-full h-full object-contain"
														/>
													) : (
														<div className="text-xs mono">
															{(p.name || '').slice(0, 4)}
														</div>
													)}
												</div>
												<div className="min-w-0">
													<div
														className="font-medium"
														style={{ color: 'var(--text-primary)' }}
													>
														{p.name}
													</div>
													{p.description ? (
														<div className="text-xs muted mt-1">
															{p.description}
														</div>
													) : (
														<div className="text-xs muted mt-1">
															No description provided.
														</div>
													)}
													{p.website && (
														<a
															href={p.website}
															target="_blank"
															rel="noopener noreferrer"
															className="text-xs mt-1 inline-flex items-center gap-1 text-indigo-400"
															onClick={(e) => e.stopPropagation()}
														>
															<ExternalLink size={12} /> Visit
														</a>
													)}
												</div>
											</li>
										))}
									</ul>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</section>
	);
};

/* --- Enhanced FAQList: industry-level UI with clearer layout & accessibility --- */
const FAQList = ({ faqs = [], visible = false }) => {
	const [query, setQuery] = useState('');
	const [expandedMap, setExpandedMap] = useState({});
	const [expandAll, setExpandAll] = useState(false);

	useEffect(() => {
		if (expandAll) {
			const all = {};
			faqs.forEach((f, i) => {
				all[f._id || i] = true;
			});
			setExpandedMap(all);
		} else {
			setExpandedMap({});
		}
	}, [expandAll, faqs]);

	const filtered = useMemo(() => {
		if (!query) return faqs;
		const q = query.toLowerCase();
		return faqs.filter(
			(f) => f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q)
		);
	}, [faqs, query]);

	const toggleOne = useCallback((id) => setExpandedMap((s) => ({ ...s, [id]: !s[id] })), []);

	const copyLink = useCallback((id) => {
		const url = `${window.location.origin}${window.location.pathname}#faq-${id}`;
		navigator.clipboard.writeText(url);
		window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'FAQ link copied!' } }));
	}, []);

	if (!visible) return null;

	return (
		<section aria-labelledby="arvantis-faqs" className="mt-12">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 id="arvantis-faqs" className="section-title flex items-center gap-2">
						<HelpCircle size={22} className="text-[var(--accent-1)]" />
						Frequently Asked Questions
					</h3>
					<p className="muted mt-1">
						Find answers to common queries. Search, expand, and copy links.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<input
						type="search"
						placeholder="Search FAQs…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="rounded-md border py-2 px-3 bg-[var(--input-bg)]"
						aria-label="Search FAQs"
					/>
					<button
						onClick={() => setExpandAll((s) => !s)}
						className="btn-ghost small"
						aria-pressed={expandAll}
					>
						{expandAll ? (
							<>
								<ChevronUp size={14} /> Collapse all
							</>
						) : (
							<>
								<ChevronDown size={14} /> Expand all
							</>
						)}
					</button>
				</div>
			</div>

			{filtered.length === 0 ? (
				<div className="mt-8 muted text-center">No FAQs match your search.</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{filtered.map((f, i) => {
						const id = f._id || i;
						const expanded = expandedMap[id];
						return (
							<div
								key={id}
								id={`faq-${id}`}
								className="glass-card p-5 transition-all duration-300"
								style={{
									boxShadow: 'var(--shadow-md)',
									border: '1px solid var(--glass-border)',
								}}
							>
								<button
									className="w-full flex items-center justify-between gap-3"
									onClick={() => toggleOne(id)}
									aria-expanded={expanded}
									style={{
										background: 'transparent',
										border: 'none',
										padding: 0,
									}}
								>
									<div className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
										<HelpCircle size={18} className="text-[var(--accent-1)]" />
										{f.question}
									</div>
									{expanded ? (
										<ChevronUp size={18} className="text-[var(--accent-1)]" />
									) : (
										<ChevronDown size={18} className="text-[var(--accent-1)]" />
									)}
								</button>
								{expanded && (
									<div className="mt-4 text-[var(--text-secondary)] text-base">
										{f.answer}
										<div className="mt-3 flex gap-2">
											<button
												onClick={() => copyLink(id)}
												className="btn-ghost small"
												title="Copy FAQ link"
											>
												<Copy size={14} /> Copy link
											</button>
											{/* <button className="btn-ghost small" title="Open in new tab">
												<ExternalLink size={14} /> Open
											</button> */}
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
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

						{/* NEW: Prominent Partners section (right after hero) */}
						<PartnersSection
							titleSponsor={titleSponsor}
							partnersByTier={partnersByTier}
							partners={partners}
							showAll={showAllPartners}
							onToggleShowAll={() => setShowAllPartners((s) => !s)}
							onPartnerClick={(p) => {
								/* optional analytics or modal */
								window.dispatchEvent(
									new CustomEvent('partnerClick', { detail: p })
								);
							}}
						/>

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
								showTracks && <div className="mt-3 muted">No tracks defined.</div>
							)}
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
