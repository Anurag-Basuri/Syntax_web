import { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEvent } from '../../hooks/useEvents.js';
import SpeakerDetailModal from './SpeakerDetailModal.jsx';

// Friendly date/time formatter
const safeFormatDate = (dateInput) => {
	if (!dateInput) return 'Date TBD';
	const date = new Date(dateInput);
	if (isNaN(date.getTime())) return 'Invalid Date';
	return new Intl.DateTimeFormat('en-US', {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
};

const timeUntil = (date) => {
	if (!date) return null;
	const now = new Date();
	const diff = new Date(date) - now;
	if (isNaN(diff) || diff <= 0) return null;
	const minutes = Math.floor(diff / 60000);
	const days = Math.floor(minutes / 1440);
	const hours = Math.floor((minutes % 1440) / 60);
	const mins = minutes % 60;
	return { days, hours, mins, totalMinutes: minutes };
};

const generateICS = (ev = {}) => {
	const start = ev.eventDate || ev.date;
	if (!start) return null;
	const dtstart = new Date(start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
	const dtend = ev.endDate
		? new Date(ev.endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
		: dtstart;
	const uid = `${ev._id || Math.random().toString(36).slice(2)}@syntaxclub`;
	const title = (ev.title || 'Event').replace(/\r?\n/g, ' ');
	const desc = (ev.description || '').replace(/\r\n/g, '\\n').replace(/\n/g, '\\n');
	const location = ev.venue || '';
	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Syntax Club//EN',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
		`DTSTART:${dtstart}`,
		`DTEND:${dtend}`,
		`SUMMARY:${title}`,
		`DESCRIPTION:${desc}`,
		`LOCATION:${location}`,
		'END:VEVENT',
		'END:VCALENDAR',
	].join('\r\n');
};

/**
 * EventDetailModal
 * - Adds micro-interactions (hover-lift, subtle icon transform)
 * - Speaker click opens SpeakerDetailModal slide-over
 * - Partner carousel on small screens (smooth scroll)
 * - Keeps theme-awareness via CSS variables from the app
 */
const EventDetailModal = ({ event: initialEvent, isOpen, onClose }) => {
	const [imgIndex, setImgIndex] = useState(0);
	const [posterValid, setPosterValid] = useState(true);
	const closeRef = useRef(null);
	const id = initialEvent?._id ?? null;

	// fetch full event details when open (useEvent hook unchanged)
	const { data: fetched } = useEvent(isOpen ? id : null);
	const event = fetched || initialEvent;

	// Speaker detail modal state
	const [selectedSpeaker, setSelectedSpeaker] = useState(null);

	// partner carousel ref
	const partnersRef = useRef(null);

	const countdown = useMemo(() => timeUntil(event?.eventDate || event?.date), [event]);

	// determine theme quickly (uses data-theme or prefers-color-scheme)
	const isDark = (() => {
		try {
			const dt = document.documentElement?.getAttribute?.('data-theme');
			if (dt) return dt === 'dark';
			return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		} catch {
			return true;
		}
	})();

	// preload poster to detect failure
	const posterUrl = event?.posters?.[imgIndex]?.url ?? null;
	useEffect(() => {
		let mounted = true;
		if (!posterUrl) {
			setPosterValid(false);
			return;
		}
		const img = new Image();
		img.onload = () => mounted && setPosterValid(true);
		img.onerror = () => mounted && setPosterValid(false);
		img.src = posterUrl;
		return () => {
			mounted = false;
		};
	}, [posterUrl]);

	// prevent body scroll while modal open
	useEffect(() => {
		if (!isOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev || '';
		};
	}, [isOpen]);

	// focus + esc
	useEffect(() => {
		if (!isOpen) return;
		closeRef.current?.focus();
		const onKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isOpen, onClose]);

	// defensive arrays
	const speakers = Array.isArray(event?.speakers) ? event.speakers : event?.speakers ? [event.speakers] : [];
	const partners = Array.isArray(event?.partners) ? event.partners : event?.partners ? [event.partners] : [];
	const coOrganizers = Array.isArray(event?.coOrganizers) ? event.coOrganizers : event?.coOrganizers ? [event.coOrganizers] : [];
	const resources = Array.isArray(event?.resources) ? event.resources : event?.resources ? [event.resources] : [];

	if (!isOpen || !event) return null;

	const registrationLink =
		event.registrationLink ||
		event.registrationUrl ||
		event.registration ||
		event.registerUrl ||
		null;

	const onRegister = (ev) => {
		ev.stopPropagation();
		if (registrationLink) window.open(registrationLink, '_blank');
	};

	const onRemind = (ev) => {
		ev.stopPropagation();
		try {
			localStorage.setItem(`remind_${event._id}`, Date.now());
		} catch (_) {}
		alert('Reminder saved locally.');
	};

	const downloadICS = (ev) => {
		ev.stopPropagation();
		const ics = generateICS(event);
		if (!ics) {
			alert('Cannot generate calendar file — missing date.');
			return;
		}
		const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${(event.title || 'event').replace(/\s+/g, '_')}.ics`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	const nextImg = (e) => {
		e.stopPropagation();
		if (!event.posters?.length) return;
		setImgIndex((p) => (p + 1) % event.posters.length);
	};
	const prevImg = (e) => {
		e.stopPropagation();
		if (!event.posters?.length) return;
		setImgIndex((p) => (p - 1 + event.posters.length) % event.posters.length);
	};

	// UI components for internal use
	const Avatar = ({ src, name, size = 56 }) => {
		const initials = (name || '').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase() || '–';
		return src ? (
			<img
				src={src}
				alt={name || 'avatar'}
				className="rounded-full object-cover"
				style={{ width: size, height: size }}
				loading="lazy"
			/>
		) : (
			<div
				className="rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white"
				style={{ width: size, height: size }}
				aria-hidden
			>
				<span className="font-semibold">{initials}</span>
			</div>
		);
	};

	const SpeakerCard = ({ sp }) => {
		const bio = sp.bio || sp.description || '';
		const short = bio.length > 200 ? bio.slice(0, 197).trim() + '…' : bio;
		return (
			<button
				onClick={(e) => {
					e.stopPropagation();
					setSelectedSpeaker(sp);
				}}
				className="group text-left p-3 rounded-md hover-lift transition-shadow duration-200 flex gap-3 items-start"
				style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
				aria-label={`Open details for ${sp.name || 'speaker'}`}
			>
				<Avatar src={sp.photo} name={sp.name} size={56} />
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<div className="font-medium text-[var(--text-primary)] truncate">{sp.name || sp.title || 'Speaker'}</div>
						{sp.company && <div className="text-xs text-[var(--text-muted)]">{sp.company}</div>}
					</div>
					{sp.title && <div className="text-xs text-[var(--text-muted)] truncate">{sp.title}</div>}
					{bio && <div className="text-sm text-[var(--text-secondary)] mt-2">{short}</div>}
					{/* subtle icon animation */}
					<div className="mt-2 flex gap-2 items-center">
						{sp.links?.twitter && (
							<a
								href={sp.links.twitter}
								onClick={(e) => e.stopPropagation()}
								target="_blank"
								rel="noreferrer"
								className="text-xs text-blue-500 inline-flex items-center gap-1 transform transition-transform duration-200 group-hover:translate-x-1"
							>
								<svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
									<path d="M22 5.92c-.7.31-1.46.52-2.26.61.81-.49 1.43-1.27 1.72-2.2-.76.45-1.6.78-2.5.96A3.59 3.59 0 0015.5 4c-1.97 0-3.57 1.6-3.57 3.57 0 .28.03.55.09.81-2.97-.15-5.6-1.57-7.36-3.73-.31.54-.49 1.17-.49 1.84 0 1.27.65 2.39 1.63 3.05-.6-.02-1.17-.18-1.66-.46v.05c0 1.77 1.26 3.24 2.94 3.57-.31.08-.64.12-.98.12-.24 0-.47-.02-.69-.06.47 1.48 1.82 2.55 3.43 2.58A7.2 7.2 0 013 19.53a10.2 10.2 0 005.5 1.61c6.59 0 10.2-5.46 10.2-10.2v-.46c.7-.5 1.3-1.13 1.78-1.85-.65.29-1.36.48-2.09.56.75-.45 1.32-1.17 1.6-2.03z" />
								</svg>
								Twitter
							</a>
						)}
						{sp.links?.linkedin && (
							<a
								href={sp.links.linkedin}
								onClick={(e) => e.stopPropagation()}
								target="_blank"
								rel="noreferrer"
								className="text-xs text-blue-500 inline-flex items-center gap-1 transform transition-transform duration-200 group-hover:translate-x-1"
							>
								LinkedIn
							</a>
						)}
					</div>
				</div>
			</button>
		);
	};

	const PartnerTile = ({ p }) => {
		return (
			<a
				href={p.website || '#'}
				onClick={(e) => e.stopPropagation()}
				target="_blank"
				rel="noreferrer"
				className="group flex items-center gap-3 p-3 rounded-md hover-lift transition-transform duration-200"
				style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
			>
				<div className="flex-shrink-0 w-12 h-12 rounded-md bg-white/5 overflow-hidden flex items-center justify-center">
					{p.logo ? (
						<img src={p.logo} alt={p.name || 'partner'} className="w-full h-full object-contain" loading="lazy" />
					) : (
						<div className="text-sm text-[var(--text-primary)]">{(p.name || '').slice(0, 1)}</div>
					)}
				</div>
				<div className="min-w-0">
					<div className="font-medium text-[var(--text-primary)] truncate">{p.name || 'Partner'}</div>
					{p.tier && <div className="text-xs text-[var(--text-muted)] mt-0.5">{p.tier}</div>}
				</div>
				{/* subtle chevron that nudges on hover */}
				<div className="ml-auto text-xs text-[var(--text-muted)] transform transition-transform duration-200 group-hover:translate-x-1">→</div>
			</a>
		);
	};

	const CoOrganizerChip = ({ c }) => (
		<div
			className="group flex items-center gap-2 rounded-full px-3 py-1 hover-lift transition-transform"
			style={{
				background: 'rgba(255,255,255,0.02)',
				border: '1px solid var(--glass-border)',
			}}
		>
			<div className="w-7 h-7 rounded-full overflow-hidden">
				{c.logo ? (
					<img src={c.logo} alt={c.name || 'co-organizer'} className="w-full h-full object-cover" loading="lazy" />
				) : (
					<div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
						{(c.name || '').slice(0, 1)}
					</div>
				)}
			</div>
			<div className="text-xs text-[var(--text-primary)]">{c.name || c}</div>
		</div>
	);

	// partners carousel helpers
	const scrollPartners = (dir = 1) => {
		const el = partnersRef.current;
		if (!el) return;
		const offset = el.clientWidth * 0.7 * dir; // scroll 70% viewport
		el.scrollBy({ left: offset, behavior: 'smooth' });
	};

	return createPortal(
		<AnimatePresence>
			<Motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				style={{ zIndex: 99999 }}
				className="fixed inset-0 flex items-center justify-center"
				aria-modal="true"
				role="dialog"
				onClick={onClose}
			>
				{/* theme-adaptive overlay */}
				<Motion.div
					className="absolute inset-0"
					style={{
						background: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.72)',
						backdropFilter: 'blur(6px)',
						webkitBackdropFilter: 'blur(6px)',
					}}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
				/>

				{/* modal container */}
				<Motion.div
					initial={{ scale: 0.98, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.98, opacity: 0 }}
					onClick={(e) => e.stopPropagation()}
					className="relative w-[96vw] max-w-[1200px] h-[92vh] rounded-2xl overflow-hidden shadow-2xl grid md:grid-cols-3"
					style={{
						background: 'linear-gradient(180deg, var(--glass-bg), color-mix(in srgb, var(--glass-bg) 92%, transparent))',
						border: '1px solid var(--glass-border)',
					}}
					aria-labelledby="event-modal-title"
				>
					{/* left visual column */}
					<div className="md:col-span-1 w-full h-full relative flex items-stretch">
						{posterValid && posterUrl ? (
							<div
								className="w-full h-full bg-center bg-no-repeat bg-cover"
								style={{ backgroundImage: `url("${posterUrl}")` }}
								aria-hidden
							/>
						) : (
							<div
								className="w-full h-full flex items-center justify-center"
								style={{
									background: isDark ? 'linear-gradient(180deg,#08121a,#041021)' : 'linear-gradient(180deg,#f7fbfc,#eef7f8)',
								}}
							>
								<div className="text-7xl opacity-20">🎭</div>
							</div>
						)}

						{event.posters?.[imgIndex]?.caption && (
							<div className="absolute left-4 bottom-4 rounded px-3 py-1 text-xs" style={{ background: 'rgba(0,0,0,0.45)', color: 'var(--text-primary)' }}>
								{event.posters[imgIndex].caption}
							</div>
						)}

						{(event.posters?.length ?? 0) > 1 && (
							<>
								<button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full text-white" aria-label="Previous">
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
								</button>
								<button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full text-white" aria-label="Next">
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
								</button>
							</>
						)}

						<button ref={closeRef} onClick={onClose} aria-label="Close" className="absolute top-3 right-3 bg-red-600/90 text-white p-2 rounded-full">
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
						</button>
					</div>

					{/* right: details */}
					<div className="md:col-span-2 p-6 overflow-auto flex flex-col gap-4">
						{/* header */}
						<div className="flex items-start justify-between gap-4">
							<div className="min-w-0">
								<h2 id="event-modal-title" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
									{event.title}
								</h2>
								<div className="text-sm" style={{ color: 'var(--text-muted)' }}>
									{event.organizer || event.host || ''}
								</div>
								<div className="mt-2 flex flex-wrap gap-2">
									{Array.isArray(event.tags) &&
										event.tags.map((t) => (
											<span key={t} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
												{t}
											</span>
										))}
								</div>
							</div>

							<div className="flex-shrink-0 flex flex-col items-end gap-2">
								{registrationLink ? (
									<button onClick={onRegister} className="px-3 py-1 bg-emerald-500 text-white rounded">Register</button>
								) : countdown ? (
									<div className="text-right">
										<div className="text-xs" style={{ color: 'var(--text-muted)' }}>Starts in</div>
										<div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
											{countdown.days > 0 ? `${countdown.days}d ${countdown.hours}h` : countdown.hours > 0 ? `${countdown.hours}h ${countdown.mins}m` : `${countdown.mins}m`}
										</div>
										<button onClick={onRemind} className="mt-1 text-xs px-2 py-0.5 rounded bg-blue-600 text-white">Remind</button>
									</div>
								) : (
									<div className="text-xs" style={{ color: 'var(--text-muted)' }}>{event.status || 'TBD'}</div>
								)}
								<button onClick={downloadICS} className="text-xs px-3 py-1 border rounded" style={{ borderColor: 'var(--glass-border)' }}>Add to calendar</button>
							</div>
						</div>

						{/* date & venue */}
						<div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
							<div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{safeFormatDate(event.eventDate)}</div>
							{event.venue && (<div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>{event.venue}</div>)}
						</div>

						{/* description */}
						<section>
							<h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Description</h3>
							<div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{event.description || 'No description available.'}</div>
						</section>

						{/* speakers */}
						{speakers.length > 0 && (
							<section>
								<h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Speakers</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{speakers.map((sp, i) => (<SpeakerCard key={sp._id || sp.name || i} sp={sp} />))}
								</div>
							</section>
						)}

						{/* partners (with carousel on small screens) */}
						{partners.length > 0 && (
							<section>
								<h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Partners</h3>

								{/* Desktop grid */}
								<div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
									{partners.map((p, i) => (<PartnerTile key={p._id || p.name || i} p={p} />))}
								</div>

								{/* Mobile carousel */}
								<div className="md:hidden relative">
									<div ref={partnersRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory py-2 scroll-smooth">
										{partners.map((p, i) => (
											<div key={p._id || p.name || i} className="snap-start min-w-[70%]">
												<PartnerTile p={p} />
											</div>
										))}
									</div>
									{/* carousel controls */}
									<div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
										<button onClick={(e) => { e.stopPropagation(); scrollPartners(-1); }} className="p-2 rounded-full bg-white/6">
											<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
										</button>
										<button onClick={(e) => { e.stopPropagation(); scrollPartners(1); }} className="p-2 rounded-full bg-white/6">
											<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
										</button>
									</div>
								</div>
							</section>
						)}

						{/* co-organizers */}
						{coOrganizers.length > 0 && (
							<section>
								<h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Co-organizers</h3>
								<div className="flex flex-wrap gap-2">{coOrganizers.map((c, i) => <CoOrganizerChip key={c._id || c.name || i} c={c} />)}</div>
							</section>
						)}

						{/* resources */}
						{resources.length > 0 && (
							<section>
								<h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Resources</h3>
								<ul className="list-disc list-inside text-sm" style={{ color: 'var(--text-secondary)' }}>
									{resources.map((r, i) => (
										<li key={r.title || r.url || i}>
											<a href={r.url || '#'} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-1)' }}>
												{r.title || r.url}
											</a>
										</li>
									))}
								</ul>
							</section>
						)}
					</div>
				</Motion.div>

				{/* speaker detail slide-over */}
				{selectedSpeaker && (
					<SpeakerDetailModal speaker={selectedSpeaker} onClose={() => setSelectedSpeaker(null)} />
				)}
			</Motion.div>
		</AnimatePresence>,
		document.body
	);
};

export default EventDetailModal;
