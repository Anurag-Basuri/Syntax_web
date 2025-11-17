import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	HelpCircle,
	ChevronDown,
	ChevronUp,
	Copy,
	ExternalLink,
	Layers3,
	Calendar,
	Users,
	Image,
} from 'lucide-react';
import PosterHero from '../../components/Arvantis/PosterHero.jsx';
import StatCard from '../../components/Arvantis/StatCard.jsx';
import EventsGrid from '../../components/Arvantis/EventsGrid.jsx';
import PartnersGrid from '../../components/Arvantis/PartnersGrid.jsx';
import GalleryGrid from '../../components/Arvantis/GalleryGrid.jsx';
import LoadingBlock from '../../components/Arvantis/LoadingBlock.jsx';
import ErrorBlock from '../../components/Arvantis/ErrorBlock.jsx';
import EditionsStrip from '../../components/Arvantis/EditionsStrip.jsx';
import {
	getArvantisLandingData,
	getAllFests,
	getFestDetails,
} from '../../services/arvantisServices.js';
import '../../arvantis.css';

// --- lazy loaded heavy UI (modal / lightbox) to improve initial bundle & perceived perf
const EventDetailModal = React.lazy(() => import('../../components/event/EventDetailModal.jsx'));
const ImageLightbox = React.lazy(() => import('../../components/Arvantis/ImageLightbox.jsx'));

/*
  Refactor notes:
  - Clean, semantic layout: Hero -> Prominent Partners (full-width) -> content grid (main + sidebar)
  - Always show description & location under hero
  - Partners are prominent and have anchor (#partners)
  - Event detail modal implemented and opened via EventsGrid click
  - Robust defensive data handling and proper keys
  - Theme variables applied non-destructively
*/

/* ---------- Utilities ---------- */
const safeArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
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

/* ---------- Partners showcase (prominent) ---------- */
const PartnersShowcase = ({ partners = [], titleSponsor = null }) => {
	if (!partners || partners.length === 0) return null;

	// group partners by tier for clearer presentation (title, platinum, gold, sponsor, partner, other)
	const tierOrder = [
		'title',
		'presenting',
		'platinum',
		'gold',
		'sponsor',
		'collaborator',
		'partner',
		'other',
	];
	const normalized = partners.map((p) => ({
		...p,
		_tierKey: (p.tier || p.role || 'other').toString().toLowerCase(),
	}));
	const grouped = normalized.reduce((acc, p) => {
		const key = tierOrder.includes(p._tierKey) ? p._tierKey : 'other';
		(acc[key] = acc[key] || []).push(p);
		return acc;
	}, {});

	const total = partners.length;

	return (
		<section
			id="partners"
			className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8"
			aria-labelledby="partners-heading"
		>
			<div className="glass-card p-6" role="region" aria-roledescription="partners showcase">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
					<div className="min-w-0">
						<h2
							id="partners-heading"
							className="text-xl font-extrabold"
							style={{ color: 'var(--text-primary)' }}
						>
							Our Partners
						</h2>
						<p className="mt-2 muted">
							Collaborating organizations across tiers — from title sponsors to
							community partners.{' '}
							<span className="font-medium">{total} partners</span>
							{titleSponsor ? ` · Proudly presented by ${titleSponsor.name}.` : ''}
						</p>
					</div>

					<div className="flex items-center gap-3">
						{titleSponsor && (
							<a
								href={titleSponsor.website || '#'}
								target={titleSponsor.website ? '_blank' : '_self'}
								rel={titleSponsor.website ? 'noopener noreferrer' : undefined}
								className="btn-ghost small"
								onClick={(e) => e.stopPropagation()}
								aria-label={`Title sponsor ${titleSponsor.name}`}
							>
								{titleSponsor.logo?.url ? (
									<img
										src={titleSponsor.logo.url}
										alt={titleSponsor.name}
										className="h-6 object-contain"
										loading="lazy"
									/>
								) : (
									<span>{titleSponsor.name}</span>
								)}
							</a>
						)}
						<a
							href="#partners"
							className="btn-primary small"
							onClick={(e) => e.preventDefault()}
							aria-label="View all partners"
						>
							View all partners
						</a>
					</div>
				</div>

				{/* Prominent tier-first grid: show title/presenting first then others */}
				<div className="mt-6 space-y-6">
					{['title', 'presenting'].map((k) =>
						(grouped[k] || []).length ? (
							<div key={k}>
								<div className="text-sm text-[var(--text-secondary)] font-semibold mb-3">
									{k === 'title' ? 'Title Sponsor' : 'Presenting Partners'}
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
									{grouped[k].map((p, i) => (
										<a
											key={`${p.name}-${i}`}
											href={p.website || '#'}
											target={p.website ? '_blank' : '_self'}
											rel={p.website ? 'noopener noreferrer' : undefined}
											className="flex items-center gap-4 p-4 rounded-lg transition-transform transform hover:-translate-y-1 hover:shadow-xl"
											style={{
												background: 'var(--glass-bg)',
												border: '1px solid var(--glass-border)',
											}}
											onClick={(e) => e.stopPropagation()}
										>
											<div className="w-20 h-12 flex items-center justify-center">
												{p.logo?.url ? (
													<img
														src={p.logo.url}
														alt={p.name}
														className="max-h-10 object-contain"
														loading="lazy"
													/>
												) : (
													<div className="text-sm mono">{p.name}</div>
												)}
											</div>
											<div className="min-w-0">
												<div
													className="font-medium"
													style={{ color: 'var(--text-primary)' }}
												>
													{p.name}
												</div>
												{p.description && (
													<div className="text-sm muted truncate">
														{p.description}
													</div>
												)}
											</div>
										</a>
									))}
								</div>
							</div>
						) : null
					)}

					{/* Remaining tiers in a compact grid */}
					{['platinum', 'gold', 'sponsor', 'collaborator', 'partner', 'other'].map((k) =>
						(grouped[k] || []).length ? (
							<div key={k}>
								<div className="text-sm text-[var(--text-secondary)] font-semibold mb-3">
									{String(k).charAt(0).toUpperCase() + String(k).slice(1)}
								</div>
								<PartnersGrid
									partners={grouped[k].slice(0, 24)}
									className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
								/>
							</div>
						) : null
					)}
				</div>
			</div>
		</section>
	);
};

/* ---------- FAQ (no search) ---------- */
const FAQList = ({ faqs = [] }) => {
	const [expanded, setExpanded] = useState({});

	useEffect(() => setExpanded({}), [faqs]);

	const toggle = useCallback((id) => setExpanded((s) => ({ ...s, [id]: !s[id] })), []);

	if (!faqs || faqs.length === 0) return null;

	return (
		<section
			aria-labelledby="arvantis-faqs"
			className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
		>
			<h3 id="arvantis-faqs" className="section-title flex items-center gap-2">
				<HelpCircle size={20} className="text-[var(--accent-1)]" /> FAQs
			</h3>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
				{faqs.map((f, i) => {
					const id = f._id || `faq-${i}`;
					const open = !!expanded[id];
					return (
						<article
							key={id}
							className="glass-card p-4 transition-all"
							aria-expanded={open}
						>
							<header>
								<button
									type="button"
									onClick={() => toggle(id)}
									className="w-full flex items-center justify-between text-left"
									aria-controls={`faq-body-${id}`}
									aria-expanded={open}
								>
									<div className="font-semibold text-[var(--text-primary)]">
										{f.question}
									</div>
									{open ? (
										<ChevronUp className="text-[var(--accent-1)]" />
									) : (
										<ChevronDown className="text-[var(--accent-1)]" />
									)}
								</button>
							</header>

							{open && (
								<div
									id={`faq-body-${id}`}
									className="mt-3 text-[var(--text-secondary)]"
								>
									{f.answer}
									<div className="mt-3">
										<button
											type="button"
											className="btn-ghost small"
											onClick={() => {
												const url = `${window.location.origin}${window.location.pathname}#${id}`;
												navigator.clipboard?.writeText?.(url);
												window.dispatchEvent(
													new CustomEvent('toast', {
														detail: { message: 'FAQ link copied' },
													})
												);
											}}
										>
											<Copy size={14} /> Copy link
										</button>
									</div>
								</div>
							)}
						</article>
					);
				})}
			</div>
		</section>
	);
};

/* ---------- Main page ---------- */
const ArvantisPage = () => {
	// page state
	const [identifier, setIdentifier] = useState(null);
	const [selectedImage, setSelectedImage] = useState(null);
	const [selectedEvent, setSelectedEvent] = useState(null);

	// data fetchers
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

	const editions = useMemo(() => {
		const raw = editionsQuery.data;
		if (!raw) return [];
		if (Array.isArray(raw)) return raw;
		if (Array.isArray(raw.docs)) return raw.docs;
		if (Array.isArray(raw.data)) return raw.data;
		return [];
	}, [editionsQuery.data]);

	const landingFest = useMemo(() => normalizeLanding(landingQuery.data), [landingQuery.data]);

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

	const detailsQuery = useQuery({
		queryKey: ['arvantis', 'details', identifier],
		queryFn: () => (identifier ? getFestDetails(identifier) : Promise.resolve(null)),
		enabled: !!identifier,
		staleTime: 60_000,
		retry: 1,
	});

	const fest = useMemo(
		() => detailsQuery.data ?? landingFest ?? null,
		[detailsQuery.data, landingFest]
	);
	const events = useMemo(() => safeArray(fest?.events), [fest]);
	const partners = useMemo(() => safeArray(fest?.partners), [fest]);
	const titleSponsor = useMemo(() => findTitleSponsor(partners), [partners]);

	// stats
	const stats = useMemo(() => {
		const safe = fest || {};
		return [
			{ icon: Layers3, label: 'Edition', value: safe.year ?? '—' },
			{ icon: Users, label: 'Partners', value: safe.partners?.length ?? 0 },
			{ icon: Calendar, label: 'Events', value: safe.events?.length ?? 0 },
			{ icon: Image, label: 'Gallery', value: safe.gallery?.length ?? 0 },
		];
	}, [fest]);

	// loading / error
	const isLoading = landingQuery.isLoading || editionsQuery.isLoading || detailsQuery.isLoading;
	const isError = landingQuery.isError || editionsQuery.isError || detailsQuery.isError;
	const errorMsg =
		landingQuery.error?.message ||
		detailsQuery.error?.message ||
		editionsQuery.error?.message ||
		'Failed to load data.';

	const handleSelectEdition = useCallback((id) => {
		if (!id) return;
		setIdentifier(id);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	const handleImageClick = useCallback((img) => setSelectedImage(img), []);
	const handleEventClick = useCallback((ev) => setSelectedEvent(ev), []);
	const closeEventModal = useCallback(() => setSelectedEvent(null), []);

	// set page title & meta for SEO + inject JSON-LD structured data for fest (lightweight)
	useEffect(() => {
		const title = fest?.name
			? `${fest.name}${fest?.year ? ` · ${fest.year}` : ''} — Arvantis`
			: 'Arvantis';
		document.title = title;

		// meta description update (non-destructive)
		let descTag = document.querySelector('meta[name="description"]');
		if (!descTag) {
			descTag = document.createElement('meta');
			descTag.name = 'description';
			document.head.appendChild(descTag);
		}
		descTag.content = fest?.description
			? String(fest.description).slice(0, 160)
			: 'Arvantis — annual tech fest by Syntax Club.';

		// inject lightweight JSON-LD for better rich results (best-effort, non-blocking)
		const ldId = 'arvantis-jsonld';
		let existing = document.getElementById(ldId);
		if (existing) existing.remove();

		if (fest) {
			const ld = {
				'@context': 'https://schema.org',
				'@type': 'Event',
				name: fest.name,
				description: fest.description || '',
				startDate: fest.startDate || undefined,
				endDate: fest.endDate || undefined,
				location: fest.location || undefined,
				url: window.location.href,
				organizer: {
					'@type': 'Organization',
					name: 'Syntax Club',
				},
			};
			const script = document.createElement('script');
			script.type = 'application/ld+json';
			script.id = ldId;
			script.text = JSON.stringify(ld);
			document.head.appendChild(script);
		}
	}, [fest]);

	// theming: apply fest theme colors non-destructively
	const themeVars = useMemo(() => {
		const vars = {};
		if (fest?.themeColors?.primary) vars['--accent-1'] = fest.themeColors.primary;
		if (fest?.themeColors?.accent) vars['--accent-2'] = fest.themeColors.accent;
		return vars;
	}, [fest]);

	if (isLoading) return <LoadingBlock label="Loading Arvantis..." />;
	if (isError) return <ErrorBlock message={errorMsg} onRetry={() => window.location.reload()} />;

	return (
		<div className="arvantis-page" style={themeVars}>
			{/* Skip link for keyboard users */}
			<a
				href="#maincontent"
				className="sr-only focus:not-sr-only p-2 rounded glass-card"
				style={{ position: 'absolute', left: 8, top: 8, zIndex: 999 }}
			>
				Skip to content
			</a>

			{/* lightweight live region for small toasts (used by components via window.dispatchEvent) */}
			<div id="arvantis-toasts" aria-live="polite" className="sr-only" />

			{/* Editions navigation */}
			<EditionsStrip
				editions={editions}
				currentIdentifier={identifier}
				onSelect={handleSelectEdition}
				landingIdentifier={landingFest?.slug || String(landingFest?.year || '')}
			/>

			{/* Hero */}
			<PosterHero fest={fest} />

			{/* Prominent partners (full-width) */}
			<PartnersShowcase partners={partners} titleSponsor={titleSponsor} />

			{/* Main content container */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Main column */}
				<main className="lg:col-span-2 space-y-8" id="maincontent" tabIndex={-1}>
					{/* Summary card: title, tagline, description, location */}
					<section className="glass-card p-6" aria-labelledby="fest-summary">
						<div className="flex flex-col md:flex-row md:items-start md:gap-6">
							<div className="flex-1 min-w-0">
								<h1
									id="fest-summary"
									className="text-2xl font-extrabold"
									style={{ color: 'var(--text-primary)' }}
								>
									{fest?.name || 'Arvantis'} {fest?.year ? `· ${fest.year}` : ''}
								</h1>
								<div
									className="mt-2 text-sm mono"
									style={{ color: 'var(--text-secondary)' }}
								>
									{fest?.tagline || 'Tech • Hack • Build'}
								</div>

								<div
									className="mt-4 text-base leading-relaxed"
									style={{ color: 'var(--text-secondary)' }}
								>
									{fest?.description || 'No description available.'}
								</div>

								<div
									className="mt-4 flex flex-wrap items-center gap-4 text-sm"
									style={{ color: 'var(--text-secondary)' }}
								>
									<div className="inline-flex items-center gap-2">
										<Calendar size={16} />
										<span>
											{fest?.startDate
												? new Date(fest.startDate).toLocaleDateString()
												: 'TBD'}
										</span>
									</div>
									<div className="inline-flex items-center gap-2">
										<ExternalLink size={16} />
										<span>{fest?.location || 'Location TBA'}</span>
									</div>
									{fest?.contactEmail && (
										<div className="inline-flex items-center gap-2 mono">
											📧 {fest.contactEmail}
										</div>
									)}
								</div>
							</div>

							{/* quick actions */}
							<div className="mt-4 md:mt-0 md:flex-shrink-0 flex flex-col gap-3">
								{fest?.tickets?.url && (
									<a
										href={fest.tickets.url}
										target="_blank"
										rel="noreferrer"
										className="btn-primary neon-btn"
									>
										Buy Tickets
									</a>
								)}
								<a href="#events" className="btn-ghost">
									Browse Events
								</a>
							</div>
						</div>
					</section>

					{/* Events */}
					<EventsGrid events={events} onEventClick={handleEventClick} />

					{/* Gallery */}
					<GalleryGrid gallery={fest?.gallery || []} onImageClick={handleImageClick} />

					{/* FAQs */}
					<FAQList faqs={fest?.faqs || []} />
				</main>

				{/* Sidebar */}
				<aside className="space-y-6" aria-label="Sidebar">
					{/* Overview / stats */}
					<div className="glass-card p-4">
						<div className="text-sm text-[var(--text-secondary)]">Overview</div>
						<div className="mt-3 grid grid-cols-2 gap-3">
							{stats.map((s) => (
								<StatCard
									key={s.label}
									icon={s.icon}
									label={s.label}
									value={s.value}
								/>
							))}
						</div>
					</div>

					{/* Title sponsor */}
					{titleSponsor && (
						<div className="glass-card p-4">
							<div className="text-sm text-[var(--text-secondary)]">
								Title Sponsor
							</div>
							<div className="mt-3 flex items-center gap-3">
								<div
									className="w-14 h-14 rounded-md overflow-hidden bg-white/5 flex items-center justify-center"
									style={{ border: '1px solid var(--glass-border)' }}
								>
									{titleSponsor.logo?.url ? (
										<img
											src={titleSponsor.logo.url}
											alt={titleSponsor.name}
											className="w-full h-full object-contain"
										/>
									) : (
										<div className="mono">{titleSponsor.name}</div>
									)}
								</div>
								<div className="min-w-0">
									<div
										className="font-medium"
										style={{ color: 'var(--text-primary)' }}
									>
										{titleSponsor.name}
									</div>
									{titleSponsor.website && (
										<a
											href={titleSponsor.website}
											target="_blank"
											rel="noreferrer"
											className="text-sm muted inline-flex items-center gap-1"
										>
											<ExternalLink size={12} /> Visit
										</a>
									)}
								</div>
							</div>
						</div>
					)}
				</aside>
			</div>

			{/* Modals - lazy loaded with Suspense to keep initial bundle small */}
			{selectedImage && (
				<Suspense fallback={<LoadingBlock label="Opening image..." />}>
					<ImageLightbox image={selectedImage} onClose={() => setSelectedImage(null)} />
				</Suspense>
			)}

			{selectedEvent && (
				<Suspense fallback={<LoadingBlock label="Loading event..." />}>
					<EventDetailModal
						event={selectedEvent}
						isOpen={!!selectedEvent}
						onClose={closeEventModal}
					/>
				</Suspense>
			)}
		</div>
	);
};

export default ArvantisPage;
