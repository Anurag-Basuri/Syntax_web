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
	Twitter,
	Instagram,
	Facebook,
	Linkedin,
	Phone,
} from 'lucide-react';

// SocialIcon helper component
const SocialIcon = ({ keyName, url }) => {
	if (!url) return null;
	const icons = {
		website: <ExternalLink size={16} />,
		twitter: <Twitter size={16} />,
		instagram: <Instagram size={16} />,
		facebook: <Facebook size={16} />,
		linkedin: <Linkedin size={16} />,
	};
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="btn-ghost small"
			aria-label={keyName}
			style={{ padding: 0, minWidth: 0 }}
		>
			{icons[keyName] || <ExternalLink size={16} />}
		</a>
	);
};
import PosterHero from '../../components/Arvantis/PosterHero.jsx';
import StatCard from '../../components/Arvantis/StatCard.jsx';
import EventsGrid from '../../components/Arvantis/EventsGrid.jsx';
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
		(p) =>
			p.tier &&
			/title sponsor|Title Sponsor|title|title-sponsor|presenting|powered by|lead/i.test(
				p.tier
			)
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

// ---------- FAQ List (collapsible) ----------
const FAQList = ({ faqs = [] }) => {
	const [openIndex, setOpenIndex] = useState(null);

	if (!faqs || faqs.length === 0) return null;

	const handleToggle = (idx) => {
		setOpenIndex(openIndex === idx ? null : idx);
	};

	return (
		<section
			aria-labelledby="arvantis-faq"
			className="mt-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
		>
			<h3 id="arvantis-faq" className="section-title mb-6 text-2xl font-bold">
				Frequently Asked Questions
			</h3>
			<div className="space-y-3">
				{faqs.map((faq, i) => {
					const isOpen = openIndex === i;
					return (
						<div
							key={`faq-${i}`}
							className={`faq-item glass-card p-4 rounded-md transition-all ${
								isOpen ? 'border-l-4 border-[var(--accent-1)] bg-white/10' : ''
							}`}
						>
							<button
								className="w-full flex items-center justify-between gap-2 text-left focus:outline-none"
								aria-expanded={isOpen}
								aria-controls={`faq-panel-${i}`}
								onClick={() => handleToggle(i)}
								style={{ background: 'none', border: 'none', padding: 0 }}
							>
								<span
									className="font-semibold text-base"
									style={{ color: 'var(--text-primary)' }}
								>
									{faq.question || 'Question'}
								</span>
								<span className="ml-2">
									{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
								</span>
							</button>
							{isOpen && (
								<div
									id={`faq-panel-${i}`}
									className="mt-3 text-sm leading-relaxed"
									style={{ color: 'var(--text-secondary)' }}
								>
									{faq.answer || 'Answer'}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</section>
	);
};

/* ---------- Partners showcase — card grid (techy feel) ---------- */
const PartnersShowcase = ({ partners = [], titleSponsor = null }) => {
	if (!partners || partners.length === 0) return null;

	// normalize fields and accept common media shapes
	const normalized = partners.map((p) => ({
		name: p.name || 'Partner',
		website: p.website || null,
		logo:
			p.logo && (p.logo.url || p.logo.secure_url || p.logo.publicUrl)
				? p.logo.url || p.logo.secure_url || p.logo.publicUrl
				: null,
		tier: p.tier || 'Partner',
		description: p.description || '',
	}));

	return (
		<section
			id="partners"
			className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8"
			aria-labelledby="partners-heading"
		>
			<div className="glass-card p-6" role="region" aria-roledescription="partners">
				<div className="flex items-center justify-between gap-4">
					<div>
						<h2
							id="partners-heading"
							className="text-xl font-extrabold"
							style={{ color: 'var(--text-primary)' }}
						>
							Our Partners
						</h2>
						<p className="mt-1 muted">
							Supporting organisations — logos, tier and short description.
						</p>
					</div>

					{/* Prominent powered-by block for title sponsor */}
					{titleSponsor && (
						<div className="partner-poweredby-compact ml-auto">
							<a
								href={titleSponsor.website || '#'}
								target={titleSponsor.website ? '_blank' : '_self'}
								rel="noreferrer"
								className="inline-flex items-center gap-3 p-2 rounded-md tech-poweredby"
								onClick={(e) => e.stopPropagation()}
							>
								{titleSponsor.logo?.url ? (
									<img
										src={titleSponsor.logo.url}
										alt={titleSponsor.name}
										className="partner-logo h-9"
										loading="lazy"
									/>
								) : (
									<span className="mono">{titleSponsor.name}</span>
								)}
								<span className="text-xs muted">Powered by</span>
							</a>
						</div>
					)}
				</div>

				{/* Grid of partner cards */}
				<div className="partners-cards-grid mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{normalized.map((p, idx) => {
						const Key = p.website ? 'a' : 'div';
						const props = p.website
							? {
									href: p.website,
									target: '_blank',
									rel: 'noopener noreferrer',
									onClick: (e) => e.stopPropagation(),
							  }
							: {};
						const handleKeyDown = (e) => {
							// If card is not an anchor and has website, allow Enter/Space to open it
							if (
								p.website &&
								!p.website.startsWith('#') &&
								(e.key === 'Enter' || e.key === ' ')
							) {
								window.open(p.website, '_blank', 'noopener,noreferrer');
							}
						};
						return (
							<Key
								key={`${p.name}-${idx}`}
								{...props}
								className="partner-card-tech group"
								title={p.name}
								// make cards keyboard-focusable when not anchors
								tabIndex={p.website ? undefined : 0}
								onKeyDown={p.website ? undefined : handleKeyDown}
							>
								<div className="partner-card-tech-inner">
									<div className="partner-card-tech-media">
										{p.logo ? (
											<img
												src={p.logo}
												alt={p.name}
												className="partner-card-logo"
												loading="lazy"
											/>
										) : (
											<div className="partner-card-logo-fallback mono">
												{(p.name || '?').slice(0, 2).toUpperCase()}
											</div>
										)}
									</div>

									<div className="partner-card-tech-body">
										<div className="flex items-center gap-3">
											<h3
												className="partner-card-tech-title"
												style={{ color: 'var(--text-primary)' }}
												aria-label={p.name}
											>
												{p.name}
											</h3>
											{p.tier && <span className="tier-badge">{p.tier}</span>}
										</div>
										{p.description ? (
											<p className="partner-card-tech-desc text-sm muted mt-2">
												{p.description}
											</p>
										) : (
											<div className="text-xs muted mt-2">
												No description provided.
											</div>
										)}

										<div className="mt-4 flex items-center gap-3">
											{p.website ? (
												<a
													className="partner-website inline-flex items-center gap-2"
													href={p.website}
													target="_blank"
													rel="noreferrer"
													onClick={(e) => e.stopPropagation()}
													aria-label={`Visit ${p.name}`}
												>
													<ExternalLink size={14} />{' '}
													<span className="text-sm">Visit</span>
												</a>
											) : (
												<span className="text-xs mono muted">
													No website
												</span>
											)}
										</div>
									</div>
								</div>
							</Key>
						);
					})}
				</div>
			</div>
		</section>
	);
};

// ---------- Contact card (sidebar) ----------
const ContactCard = ({ email, phone, socialLinks = {} }) => {
	if (!email && !phone && Object.keys(socialLinks || {}).length === 0) return null;
	return (
		<div className="glass-card contact-card p-4">
			<div className="text-sm text-[var(--text-secondary)]">Contact</div>
			<div className="mt-3 space-y-2">
				{email && (
					<div className="flex items-center gap-3">
						<span className="mono">{email}</span>
						<a
							href={`mailto:${email}`}
							className="btn-ghost small"
							onClick={(e) => e.stopPropagation()}
						>
							Email
						</a>
					</div>
				)}
				{phone && (
					<div className="flex items-center gap-3">
						<span className="mono">{phone}</span>
						<a
							href={`tel:${phone}`}
							className="btn-ghost small"
							onClick={(e) => e.stopPropagation()}
						>
							Call
						</a>
					</div>
				)}

				{socialLinks && (
					<div className="mt-2 flex items-center gap-2">
						<SocialIcon keyName="website" url={socialLinks.website} />
						<SocialIcon keyName="twitter" url={socialLinks.twitter} />
						<SocialIcon keyName="instagram" url={socialLinks.instagram} />
						<SocialIcon keyName="facebook" url={socialLinks.facebook} />
						<SocialIcon keyName="linkedin" url={socialLinks.linkedin} />
					</div>
				)}
			</div>
		</div>
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

	// stats extended: use computed if available
	const stats = useMemo(() => {
		const safe = fest || {};
		return [
			{ icon: Layers3, label: 'Edition', value: safe.year ?? '—' },
			{
				icon: Users,
				label: 'Partners',
				value: safe.totalPartners ?? safe.partners?.length ?? 0,
			},
			{
				icon: Calendar,
				label: 'Events',
				value: safe.upcomingEventsCount ?? safe.events?.length ?? 0,
			},
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

	// expose raw copy of fest for debugging / admin share
	const copyFestJSON = useCallback(async () => {
		if (!fest) return;
		try {
			await navigator.clipboard.writeText(JSON.stringify(fest, null, 2));
			window.dispatchEvent(
				new CustomEvent('toast', { detail: { message: 'Fest JSON copied' } })
			);
		} catch {
			/* ignore */
		}
	}, [fest]);

	// set page title & meta for SEO
	useEffect(() => {
		const title = fest?.name
			? `${fest.name}${fest?.year ? ` · ${fest.year}` : ''} — Arvantis`
			: 'Arvantis';
		document.title = title;

		let descTag = document.querySelector('meta[name="description"]');
		if (!descTag) {
			descTag = document.createElement('meta');
			descTag.name = 'description';
			document.head.appendChild(descTag);
		}
		descTag.content = fest?.description
			? String(fest.description).slice(0, 160)
			: 'Arvantis — annual tech fest by Syntax Club.';

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
		if (fest?.themeColors?.bg) vars['--bg-base'] = fest.themeColors.bg;
		return vars;
	}, [fest]);

	if (isLoading) return <LoadingBlock label="Loading Arvantis..." />;
	if (isError) return <ErrorBlock message={errorMsg} onRetry={() => window.location.reload()} />;

	// computed helpers for UI
	const tracks = Array.isArray(fest?.tracks) ? fest.tracks : [];

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

			<div id="arvantis-toasts" aria-live="polite" className="sr-only" />

			{/* Editions navigation */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
				<div className="editions-strip-wrap glass-card p-3">
					<EditionsStrip
						editions={editions}
						currentIdentifier={identifier}
						onSelect={handleSelectEdition}
						landingIdentifier={landingFest?.slug || String(landingFest?.year || '')}
					/>
				</div>
			</div>

			{/* ---------- Top header: Tech Fest badge + title + meta ---------- */}
			<header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
				<div className="glass-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div className="min-w-0">
						{/* Tech Fest ribbon */}
						<div className="inline-flex items-center gap-2 mb-3">
							<span
								className="px-3 py-1 rounded-full text-xs font-bold"
								style={{
									background:
										'linear-gradient(90deg,var(--accent-1),var(--accent-2))',
									color: '#fff',
								}}
							>
								TECH FEST · ANNUAL
							</span>
							<span className="text-xs muted">
								Yearly showcase · Industry & Campus
							</span>
						</div>

						{/* Title + status/visibility chips */}
						<div className="flex items-center gap-3 flex-wrap">
							<h1
								className="text-3xl md:text-4xl font-extrabold"
								style={{ color: 'var(--text-primary)' }}
							>
								{fest?.name || 'Arvantis'} {fest?.year ? `· ${fest.year}` : ''}
							</h1>

							{/* powered-by inline label (if present) */}
							{titleSponsor && (
								<div className="ml-2 flex items-center gap-3">
									<span className="text-sm muted">powered by</span>
									<a
										href={titleSponsor.website || '#'}
										target={titleSponsor.website ? '_blank' : '_self'}
										rel={
											titleSponsor.website ? 'noopener noreferrer' : undefined
										}
										className="inline-flex items-center gap-2"
										onClick={(e) => e.stopPropagation()}
									>
										{titleSponsor.logo?.url ? (
											<img
												src={titleSponsor.logo.url}
												alt={titleSponsor.name}
												className="h-6 object-contain rounded-sm"
												loading="lazy"
											/>
										) : (
											<span className="mono text-sm">
												{titleSponsor.name}
											</span>
										)}
									</a>
								</div>
							)}
						</div>

						{/* Tagline & social */}
						<div className="mt-3 flex items-center gap-4 flex-wrap">
							<div
								className="text-sm mono"
								style={{ color: 'var(--text-secondary)' }}
							>
								{fest?.tagline || 'Tech • Hack • Build'}
							</div>

							{/* Social links */}
							<div className="flex items-center gap-2">
								<SocialIcon keyName="website" url={fest?.socialLinks?.website} />
								<SocialIcon keyName="twitter" url={fest?.socialLinks?.twitter} />
								<SocialIcon
									keyName="instagram"
									url={fest?.socialLinks?.instagram}
								/>
								<SocialIcon keyName="facebook" url={fest?.socialLinks?.facebook} />
								<SocialIcon keyName="linkedin" url={fest?.socialLinks?.linkedin} />
								{fest?.contactPhone && (
									<div className="inline-flex items-center gap-2 text-sm muted">
										<Phone size={14} />{' '}
										<span className="mono">{fest.contactPhone}</span>
									</div>
								)}
							</div>

							{/* copy raw json */}
							<button
								onClick={copyFestJSON}
								className="btn-ghost small"
								aria-label="Copy fest data"
							>
								<Copy size={14} /> Raw
							</button>
						</div>
					</div>

					{/* CTAs */}
					<div className="flex-shrink-0 flex items-center gap-3">
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
			</header>

			{/* Poster / Hero — full-bleed on small screens, centered on large */}
			<div className="w-full mt-6">
				<div className="max-w-7xl mx-auto sm:px-6 lg:px-8 px-4">
					<PosterHero fest={fest} onImageOpen={handleImageClick} />
				</div>
			</div>

			{/* Description, quick details, tracks and prominent partners */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
				<div className="glass-card p-6">
					<h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
						About the Fest
					</h2>
					<p className="mt-3 text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
						{fest?.description || 'No description available.'}
					</p>

					{/* quick details grid */}
					<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div
							className="p-3 rounded-md"
							style={{
								background: 'var(--glass-bg)',
								border: '1px solid var(--glass-border)',
							}}
						>
							<div className="text-xs text-[var(--text-secondary)]">Duration</div>
							<div className="font-medium">
								{fest?.durationDays ? `${fest.durationDays} days` : 'TBD'}
							</div>
						</div>
						<div
							className="p-3 rounded-md"
							style={{
								background: 'var(--glass-bg)',
								border: '1px solid var(--glass-border)',
							}}
						>
							<div className="text-xs text-[var(--text-secondary)]">Location</div>
							<div className="font-medium">{fest?.location || 'TBA'}</div>
						</div>
						<div
							className="p-3 rounded-md"
							style={{
								background: 'var(--glass-bg)',
								border: '1px solid var(--glass-border)',
							}}
						>
							<div className="text-xs text-[var(--text-secondary)]">Partners</div>
							<div className="font-medium">{partners.length} partners</div>
						</div>
					</div>

					{/* Tracks (if any) */}
					{tracks.length > 0 && (
						<div className="mt-6">
							<div className="text-xs text-[var(--text-secondary)] font-semibold">
								Tracks
							</div>
							<div className="mt-3 flex flex-wrap gap-3">
								{tracks.map((t, i) => (
									<div
										key={t.key || `${t.title}-${i}`}
										className="px-3 py-1 rounded-full border"
										style={{
											borderColor: 'var(--card-border)',
											background: t.color ? `${t.color}15` : 'transparent',
										}}
									>
										<span
											className="text-sm font-medium"
											style={{ color: t.color || 'var(--text-primary)' }}
										>
											{t.title}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Partners showcase */}
				<div className="mt-6">
					<PartnersShowcase partners={partners} titleSponsor={titleSponsor} />
				</div>
			</section>

			{/* Main content: Events, Gallery, FAQs */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
				<main className="lg:col-span-2 space-y-8" id="maincontent" tabIndex={-1}>
					{/* Pass fest hero/poster as a sensible fallback image for event cards.
                        EventsGrid will still fetch full event details when needed (getEventById). */}
					<EventsGrid
						events={events}
						onEventClick={handleEventClick}
						fallbackImage={
							fest?.hero?.url ||
							fest?.hero?.src ||
							fest?.poster?.url ||
							(fest?.posters && fest.posters[0]?.url) ||
							null
						}
					/>
					<GalleryGrid gallery={fest?.gallery || []} onImageClick={handleImageClick} />
					<FAQList faqs={fest?.faqs || []} />
				</main>

				<aside className="space-y-6" aria-label="Sidebar">
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

					{/* Contact card */}
					<ContactCard
						email={fest?.contactEmail}
						phone={fest?.contactPhone}
						socialLinks={fest?.socialLinks}
					/>

					{/* Title sponsor (kept but simplified) */}
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

			{/* Modals */}
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
