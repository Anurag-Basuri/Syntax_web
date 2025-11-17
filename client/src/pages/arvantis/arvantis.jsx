import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import ImageLightbox from '../../components/Arvantis/ImageLightbox.jsx';
import LoadingBlock from '../../components/Arvantis/LoadingBlock.jsx';
import ErrorBlock from '../../components/Arvantis/ErrorBlock.jsx';
import EditionsStrip from '../../components/Arvantis/EditionsStrip.jsx';
import {
	getArvantisLandingData,
	getAllFests,
	getFestDetails,
} from '../../services/arvantisServices.js';
import '../../arvantis.css';

const PARTNERS_PREVIEW = 8;

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

const groupPartnersByTier = (partners = [], titleSponsor = null) => {
	const map = new Map();
	(partners || []).forEach((p) => {
		if (!p) return;
		if (titleSponsor && p.name === titleSponsor.name) return;
		const tier = (p.tier || 'partner').toLowerCase();
		if (!map.has(tier)) map.set(tier, []);
		map.get(tier).push(p);
	});
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
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-start">
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
const FAQList = ({ faqs = [] }) => {
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

	if (!faqs || faqs.length === 0) return null;

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
								className="glass-card p-5 transition-all duration-300 border border-[var(--glass-border)] shadow-md"
								style={{
									boxShadow: 'var(--shadow-md)',
									borderRadius: '1.25rem',
									background: 'var(--glass-bg)',
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
	const [identifier, setIdentifier] = useState(null);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [selectedImage, setSelectedImage] = useState(null);
	const [showAllPartners, setShowAllPartners] = useState(false);

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
		if (raw?.docs && Array.isArray(raw.docs)) return raw.docs;
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

	const fest = useMemo(() => {
		if (detailsQuery.data) return detailsQuery.data;
		return landingFest ?? null;
	}, [detailsQuery.data, landingFest]);

	const events = useMemo(() => safeArray(fest?.events), [fest]);
	const partners = useMemo(() => safeArray(fest?.partners), [fest]);
	const titleSponsor = useMemo(() => findTitleSponsor(partners), [partners]);
	const partnersByTier = useMemo(
		() => groupPartnersByTier(partners, titleSponsor),
		[partners, titleSponsor]
	);

	const filteredEvents = useMemo(() => {
		let out = [...events];
		out.sort((a, b) => {
			const ad = new Date(a.eventDate || a.date || 0).getTime();
			const bd = new Date(b.eventDate || b.date || 0).getTime();
			return bd - ad;
		});
		return out;
	}, [events]);

	const stats = useMemo(() => {
		const safe = fest || {};
		return [
			{ icon: Layers3, label: 'Edition', value: safe.year ?? '—' },
			{ icon: Users, label: 'Partners', value: safe.partners?.length ?? 0 },
			{ icon: Calendar, label: 'Events', value: safe.events?.length ?? 0 },
			{ icon: Image, label: 'Gallery', value: safe.gallery?.length ?? 0 },
		];
	}, [fest]);

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

	const handleEventClick = useCallback((ev) => setSelectedEvent(ev), []);
	const handleImageClick = useCallback((img) => setSelectedImage(img), []);

	if (isLoading) return <LoadingBlock label="Loading Arvantis..." />;
	if (isError) return <ErrorBlock message={errorMsg} onRetry={() => window.location.reload()} />;

	return (
		<div className="arvantis-page">
			{/* Editions strip (top) */}
			<EditionsStrip
				editions={editions}
				currentIdentifier={identifier}
				onSelect={handleSelectEdition}
				landingIdentifier={landingFest?.slug || String(landingFest?.year || '')}
			/>

			{/* Hero / Poster */}
			<PosterHero fest={fest} />

			{/* Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10 mb-8">
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

			{/* Partners Section - improved */}
			<PartnersSection
				titleSponsor={titleSponsor}
				partnersByTier={partnersByTier}
				partners={partners}
				showAll={showAllPartners}
				onToggleShowAll={() => setShowAllPartners((s) => !s)}
			/>

			{/* Events */}
			<EventsGrid events={filteredEvents} onEventClick={handleEventClick} />

			{/* Gallery */}
			<GalleryGrid gallery={fest?.gallery || []} onImageClick={handleImageClick} />

			{/* FAQ Section - always visible, improved */}
			<FAQList faqs={fest?.faqs || []} />

			{/* Image Lightbox */}
			{selectedImage && (
				<ImageLightbox image={selectedImage} onClose={() => setSelectedImage(null)} />
			)}
		</div>
	);
};

export default ArvantisPage;
