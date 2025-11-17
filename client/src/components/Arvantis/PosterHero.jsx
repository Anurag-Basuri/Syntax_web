import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Calendar, Ticket, MapPin, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { motion } from 'framer-motion';

/* NOTE: Image lightbox is handled at page level (shared lazy component).
   PosterHero delegates opening images via onImageOpen(image). */

const formatDate = (date) => {
	if (!date) return 'TBA';
	const d = new Date(date);
	if (isNaN(d.getTime())) return 'TBA';
	return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
};

const useHighPrecisionCountdown = (target) => {
	const [now, setNow] = useState(Date.now());
	const rafRef = useRef(null);

	useEffect(() => {
		if (!target) return;
		let mounted = true;
		const tick = () => {
			if (!mounted) return;
			setNow(Date.now());
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			mounted = false;
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [target]);

	const targetMs = useMemo(() => {
		if (!target) return null;
		const d = new Date(target);
		return isNaN(d.getTime()) ? null : d.getTime();
	}, [target]);

	if (!targetMs) return null;

	const diff = Math.max(0, targetMs - now);
	const totalSeconds = Math.floor(diff / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return { days, hours, minutes, seconds, isOngoing: diff === 0 };
};

const Countdown = ({ target }) => {
	const cd = useHighPrecisionCountdown(target);
	if (!cd) return null;
	if (cd.isOngoing) {
		return (
			<div
				role="status"
				aria-live="polite"
				className="mt-4 text-sm font-medium text-green-500"
			>
				Ongoing
			</div>
		);
	}
	const two = (n) => String(n).padStart(2, '0');
	return (
		<div
			className="mt-4 inline-flex items-center gap-3"
			role="timer"
			aria-live="polite"
			aria-atomic="true"
			aria-label={`Starts in ${cd.days} days ${cd.hours} hours ${cd.minutes} minutes ${cd.seconds} seconds`}
		>
			<div className="flex items-baseline gap-2">
				<div className="px-3 py-2 rounded-lg glass-card text-center">
					<div
						className="text-lg font-extrabold mono"
						style={{ color: 'var(--text-primary)' }}
					>
						{cd.days}
					</div>
					<div className="text-xs muted">Days</div>
				</div>
				<div className="px-3 py-2 rounded-lg glass-card text-center">
					<div
						className="text-lg font-extrabold mono"
						style={{ color: 'var(--text-primary)' }}
					>
						{two(cd.hours)}
					</div>
					<div className="text-xs muted">Hours</div>
				</div>
				<div className="px-3 py-2 rounded-lg glass-card text-center">
					<div
						className="text-lg font-extrabold mono"
						style={{ color: 'var(--text-primary)' }}
					>
						{two(cd.minutes)}
					</div>
					<div className="text-xs muted">Minutes</div>
				</div>
				<div className="px-3 py-2 rounded-lg glass-card text-center">
					<div className="text-lg font-extrabold mono accent-neon">{two(cd.seconds)}</div>
					<div className="text-xs muted">Seconds</div>
				</div>
			</div>
		</div>
	);
};

const PosterHero = ({ fest = {}, onImageOpen }) => {
	// prefer fest.hero virtual or heroMedia, then posters array, then poster fallback
	const posters = useMemo(() => {
		// backend uses posters[] and heroMedia; accept gallery fallback
		const raw =
			Array.isArray(fest?.posters) && fest.posters.length
				? fest.posters
				: Array.isArray(fest?.gallery)
				? fest.gallery
				: [];
		return raw.map((p) => (typeof p === 'string' ? { url: p } : p)).filter(Boolean);
	}, [fest]);

	const hero = useMemo(() => {
		// prefer explicit heroMedia, then posters[0], then fest.poster legacy, then gallery first
		if (fest?.heroMedia)
			return typeof fest.heroMedia === 'string' ? { url: fest.heroMedia } : fest.heroMedia;
		if (Array.isArray(fest?.posters) && fest.posters.length) return fest.posters[0];
		if (fest?.poster)
			return typeof fest.poster === 'string' ? { url: fest.poster } : fest.poster;
		if (Array.isArray(fest?.gallery) && fest.gallery.length) return fest.gallery[0];
		return null;
	}, [fest]);

	const heroUrl = hero?.url || hero?.src || '';

	const [index, setIndex] = useState(0);

	useEffect(() => {
		// reset index when posters change
		setIndex(0);
	}, [posters.length, heroUrl]);

	const next = useCallback(() => {
		if (!posters.length) return;
		setIndex((i) => (i + 1) % posters.length);
	}, [posters.length]);

	const prev = useCallback(() => {
		if (!posters.length) return;
		setIndex((i) => (i - 1 + posters.length) % posters.length);
	}, [posters.length]);

	const openLightbox = useCallback(
		(i = 0) => {
			setIndex(i);
			// delegate to parent lightbox if provided
			const img = posters.length ? posters[i] || posters[0] : hero || { url: heroUrl };
			if (typeof onImageOpen === 'function') {
				onImageOpen(img);
			}
		},
		[onImageOpen, posters, hero, heroUrl]
	);

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
						{/* Carousel + caption */}
						<div className="col-span-2">
							<div className="poster-carousel">
								<div
									className="poster-main"
									role="region"
									aria-label="Festival poster"
								>
									{posters.length || heroUrl ? (
										<>
											{posters.length > 1 && (
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
												</>
											)}
											<img
												src={
													posters.length
														? posters[index]?.url || posters[index]?.src
														: heroUrl
												}
												alt={fest?.name || 'Poster'}
												className="poster-main-img"
												onClick={() =>
													openLightbox(posters.length ? index : 0)
												}
												loading="lazy"
												role="button"
												aria-label="Open poster preview"
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

								{/* Thumbnails only if multiple posters */}
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

							{/* caption + controls */}
							<div className="mt-4 flex items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-white flex-shrink-0">
										<img
											src={fest?.logo?.url || heroUrl || ''}
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

								{/* Unified responsive controls (no duplicate hidden sections) */}
								<div className="flex items-center gap-3">
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
								</div>
							</div>
						</div>

						{/* Compact details / countdown / tickets */}
						<aside className="details-panel glass-card p-5" aria-hidden={false}>
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

							{/* Countdown */}
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

							{/* Tickets */}
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
						</aside>
					</div>
				</div>
			</motion.section>

			{/* Note: image preview handled by parent via onImageOpen -> selectedImage */}
		</>
	);
};

export default PosterHero;
