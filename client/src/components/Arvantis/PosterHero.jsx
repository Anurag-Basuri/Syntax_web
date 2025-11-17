import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Sparkles, Calendar, Ticket, MapPin, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { motion } from 'framer-motion';
import ImageLightbox from './ImageLightbox.jsx';

/*
  Simplified PosterHero:
  - Self-contained carousel (no external PosterCarousel dependency)
  - Countdown implemented inline
  - Simple FestDetails rendered inline when requested
  - Uses existing ImageLightbox component for zoom
*/

const formatDate = (date) => {
	if (!date) return 'TBA';
	const d = new Date(date);
	if (isNaN(d.getTime())) return 'TBA';
	return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
};

const useCountdown = (target) => {
	const [remaining, setRemaining] = useState(() => {
		if (!target) return null;
		const ms = new Date(target).getTime() - Date.now();
		return ms > 0 ? ms : 0;
	});

	useEffect(() => {
		if (!target) return;
		const interval = setInterval(() => {
			const ms = new Date(target).getTime() - Date.now();
			setRemaining(ms > 0 ? ms : 0);
		}, 1000);
		return () => clearInterval(interval);
	}, [target]);

	if (remaining === null) return null;
	const s = Math.floor(remaining / 1000);
	const days = Math.floor(s / (24 * 3600));
	const hours = Math.floor((s % (24 * 3600)) / 3600);
	const mins = Math.floor((s % 3600) / 60);
	const secs = Math.floor(s % 60);
	return { days, hours, mins, secs };
};

const Countdown = ({ target }) => {
	const cd = useCountdown(target);
	if (!cd) return null;
	if (cd.days === 0 && cd.hours === 0 && cd.mins === 0 && cd.secs === 0)
		return <div className="mono">Starts soon</div>;
	return (
		<div className="arv-countdown" aria-hidden>
			<div className="cd-item">
				<div className="cd-value">{cd.days}</div>
				<div className="cd-label">days</div>
			</div>
			<div className="cd-item">
				<div className="cd-value">{String(cd.hours).padStart(2, '0')}</div>
				<div className="cd-label">hrs</div>
			</div>
			<div className="cd-item">
				<div className="cd-value">{String(cd.mins).padStart(2, '0')}</div>
				<div className="cd-label">mins</div>
			</div>
		</div>
	);
};

const PosterHero = ({ fest = {} }) => {
	const posters = useMemo(() => {
		const raw = Array.isArray(fest?.posters) ? fest.posters : fest?.gallery || [];
		// normalize simple string items
		return raw.map((p) => (typeof p === 'string' ? { url: p } : p)).filter(Boolean);
	}, [fest]);

	const heroPoster = posters.length
		? posters[0]
		: fest?.poster
		? typeof fest.poster === 'string'
			? { url: fest.poster }
			: fest.poster
		: null;

	const [index, setIndex] = useState(0);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [showDetails, setShowDetails] = useState(false);

	useEffect(() => {
		// reset index when posters change
		setIndex(0);
	}, [posters.length, heroPoster?.url]);

	const next = useCallback(() => {
		if (!posters.length) return;
		setIndex((i) => (i + 1) % posters.length);
	}, [posters.length]);

	const prev = useCallback(() => {
		if (!posters.length) return;
		setIndex((i) => (i - 1 + posters.length) % posters.length);
	}, [posters.length]);

	const openLightbox = useCallback((i = 0) => {
		setIndex(i);
		setLightboxOpen(true);
	}, []);

	const closeLightbox = useCallback(() => setLightboxOpen(false), []);

	const ticketSold = fest?.tickets?.sold || 0;
	const ticketCap = fest?.tickets?.capacity || 0;
	const ticketPct = ticketCap > 0 ? Math.min(100, Math.round((ticketSold / ticketCap) * 100)) : 0;

	return (
		<>
			<motion.section
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="arvantis-hero relative overflow-hidden rounded-3xl min-h-[420px] md:min-h-[520px] flex items-stretch text-white"
				aria-label={`${fest?.name || 'Arvantis'} hero`}
				style={{ background: 'transparent' }}
			>
				<div className="relative z-10 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 lg:py-14">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
						<div className="col-span-2">
							{/* Carousel area */}
							<div className="poster-carousel">
								<div
									className="poster-main"
									role="region"
									aria-label="Festival poster"
								>
									{posters.length ? (
										<>
											<button
												aria-label="Previous poster"
												onClick={prev}
												className="poster-nav-btn left"
											>
												<ChevronLeft size={18} />
											</button>
											<button
												aria-label="Next poster"
												onClick={next}
												className="poster-nav-btn right"
											>
												<ChevronRight size={18} />
											</button>
											<img
												src={
													posters[index]?.url ||
													posters[index]?.src ||
													heroPoster?.url ||
													''
												}
												alt={fest?.name || 'Poster'}
												className="poster-main-img"
												onClick={() => openLightbox(index)}
												loading="lazy"
											/>
										</>
									) : (
										<div
											className="poster-main flex items-center justify-center"
											style={{ minHeight: 200 }}
										>
											<div className="text-4xl">🎭</div>
										</div>
									)}
								</div>

								{posters.length > 1 && (
									<div className="poster-thumbs mt-3 flex gap-2 overflow-x-auto">
										{posters.map((p, i) => (
											<button
												key={p.publicId || p.url || i}
												onClick={() => setIndex(i)}
												className={`thumb-btn ${
													i === index ? 'active' : ''
												}`}
												aria-label={`Poster ${i + 1}`}
											>
												<img
													src={p.url}
													alt={`thumb-${i}`}
													className="thumb-img"
													loading="lazy"
												/>
											</button>
										))}
									</div>
								)}
							</div>

							<div className="mt-4 flex items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-white flex-shrink-0">
										<img
											src={fest?.logo?.url || heroPoster?.url || ''}
											alt={`${fest?.name || 'Arvantis'} logo`}
											className="w-full h-full object-cover"
										/>
									</div>
									<div>
										<div
											className="text-base font-semibold"
											style={{ color: 'var(--text-primary)' }}
										>
											{fest?.name || 'Arvantis'}{' '}
											<span className="accent-neon ml-1">
												{fest?.year
													? `’${String(fest.year).slice(-2)}`
													: ''}
											</span>
										</div>
										<div
											className="text-sm mono"
											style={{ color: 'var(--text-secondary)' }}
										>
											{fest?.tagline || 'Tech • Hack • Build'}
										</div>
									</div>
								</div>

								<div className="hidden md:flex items-center gap-3">
									{fest?.tickets?.url && (
										<a
											href={fest.tickets.url}
											className="btn-primary neon-btn"
											target="_blank"
											rel="noreferrer"
										>
											<Ticket size={16} /> Buy Tickets
										</a>
									)}
									<a href="#events" className="btn-ghost">
										Explore Events
									</a>
									<button
										onClick={() => setShowDetails((s) => !s)}
										className="btn-ghost"
										aria-expanded={showDetails}
										aria-controls="fest-full-details"
									>
										<Info size={14} />{' '}
										{showDetails ? 'Hide Details' : 'View Full Details'}
									</button>
								</div>
							</div>

							<div className="mt-3 md:hidden flex gap-3">
								{fest?.tickets?.url && (
									<a
										href={fest.tickets.url}
										className="btn-primary neon-btn"
										style={{ flex: 1 }}
									>
										<Ticket size={14} /> Buy
									</a>
								)}
								<button
									onClick={() => setShowDetails((s) => !s)}
									className="btn-ghost"
									aria-expanded={showDetails}
									aria-controls="fest-full-details"
								>
									<Info size={14} /> {showDetails ? 'Hide' : 'Details'}
								</button>
							</div>
						</div>

						<aside className="details-panel glass-card p-5">
							<div className="flex items-start justify-between gap-3">
								<div>
									<div
										className="text-xs font-semibold uppercase"
										style={{ color: 'var(--text-secondary)' }}
									>
										Status
									</div>
									<div className="mt-2">
										<StatusPill status={fest?.status} />
									</div>
								</div>
								<div className="text-right">
									<div
										className="text-xs font-semibold"
										style={{ color: 'var(--text-secondary)' }}
									>
										When
									</div>
									<div
										className="mt-2 mono"
										style={{ color: 'var(--text-primary)' }}
									>
										{formatDate(fest?.startDate)} — {formatDate(fest?.endDate)}
									</div>
								</div>
							</div>

							{fest?.startDate && (
								<div className="mt-4">
									<div
										className="text-xs font-semibold"
										style={{ color: 'var(--text-secondary)' }}
									>
										Countdown
									</div>
									<div className="mt-2">
										<Countdown target={fest.startDate} />
									</div>
								</div>
							)}

							{typeof fest?.tickets?.capacity !== 'undefined' && (
								<div className="mt-4">
									<div
										className="text-xs font-semibold"
										style={{ color: 'var(--text-secondary)' }}
									>
										Tickets
									</div>
									<div className="mt-2">
										<div className="ticket-progress" aria-hidden>
											<div
												className="progress-bar"
												style={{ width: `${ticketPct}%` }}
											/>
										</div>
										<div
											className="mt-2 flex items-center justify-between text-sm mono"
											style={{ color: 'var(--text-secondary)' }}
										>
											<div>{ticketSold} sold</div>
											<div>{ticketCap || '—'} capacity</div>
										</div>
										{fest?.tickets?.url && (
											<div className="mt-3">
												<a
													href={fest.tickets.url}
													target="_blank"
													rel="noreferrer"
													className="btn-primary neon-btn"
													style={{ width: '100%' }}
												>
													<Ticket size={14} /> Buy Tickets
												</a>
											</div>
										)}
									</div>
								</div>
							)}

							{Array.isArray(fest?.sponsors) && fest.sponsors.length > 0 && (
								<div className="mt-5">
									<div
										className="text-xs font-semibold"
										style={{ color: 'var(--text-secondary)' }}
									>
										Top Sponsors
									</div>
									<div className="mt-2 flex gap-2 items-center overflow-auto">
										{fest.sponsors.slice(0, 6).map((s, i) => (
											<img
												key={i}
												src={s.logo || s.logoUrl || s.url}
												alt={s.name || 'Sponsor'}
												className="sponsor-mini"
											/>
										))}
									</div>
								</div>
							)}
						</aside>
					</div>
				</div>
			</motion.section>

			{/* details panel / expanded */}
			<div
				id="fest-full-details"
				aria-hidden={!showDetails}
				style={{ display: showDetails ? 'block' : 'none' }}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-6 fest-details-section">
					<div className="fest-details grid gap-6">
						<div className="detail-card">
							<h3 className="card-title">About {fest?.name}</h3>
							<div className="card-body">
								{fest?.description || 'No description available.'}
							</div>
						</div>

						<div className="detail-card">
							<h4 className="card-title">Location</h4>
							<div className="card-body">{fest?.location || 'TBA'}</div>
						</div>

						{Array.isArray(fest?.partners) && fest.partners.length > 0 && (
							<div className="detail-card">
								<h4 className="card-title">Partners</h4>
								<div className="sponsors-grid">
									{fest.partners.map((p, i) => (
										<div key={i} className="sponsor-card">
											{p.logo?.url ? (
												<img src={p.logo.url} alt={p.name} />
											) : (
												<div className="sponsor-name">{p.name}</div>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Lightbox */}
			{lightboxOpen && (
				<ImageLightbox
					image={posters[index] || heroPoster}
					onClose={closeLightbox}
					onPrev={posters.length > 1 ? prev : undefined}
					onNext={posters.length > 1 ? next : undefined}
				/>
			)}
		</>
	);
};

export default PosterHero;
