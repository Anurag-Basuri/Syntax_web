import { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEvent } from '../../hooks/useEvents.js'; // keep existing hook

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
 * - UI-focused: improved speakers, partners, co-organizers presentation
 * - No meta/registrations displayed
 * - Poster image fixed to reliably cover the visual area
 * - Uses existing useEvent hook; no changes to services/hooks
 */
const EventDetailModal = ({ event: initialEvent, isOpen, onClose }) => {
	const [imgIndex, setImgIndex] = useState(0);
	const closeRef = useRef(null);
	const id = initialEvent?._id ?? null;

	// existing hook (unchanged)
	const { data: fetched, isLoading, isError, refetch } = useEvent(isOpen ? id : null);

	// prefer fetched data
	const event = fetched || initialEvent;

	// countdown computed safely
	const countdown = useMemo(() => timeUntil(event?.eventDate || event?.date), [event]);

	// disable background scroll while open
	useEffect(() => {
		if (!isOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev || '';
		};
	}, [isOpen]);

	// focus, escape handling
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

	// fallback poster src (cover the area reliably and show a gradient if image fails)
	const posterUrl = event?.posters?.[imgIndex]?.url || null;

	// Helper: avatar (photo or initials)
	const Avatar = ({ src, name, size = 48 }) => {
		const initials = (name || '').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
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
				<span className="font-semibold">{initials || '–'}</span>
			</div>
		);
	};

	// Present speakers as cards with name, role, short bio and social links
	const SpeakerCard = ({ sp }) => {
		const bio = sp.bio || sp.description || '';
		const short = bio.length > 160 ? bio.slice(0, 157).trim() + '…' : bio;
		return (
			<div className="flex gap-3 items-start p-3 bg-white/3 rounded-md">
				<Avatar src={sp.photo} name={sp.name} size={56} />
				<div className="min-w-0">
					<div className="flex items-center justify-between gap-2">
						<div className="font-medium text-white truncate">{sp.name || sp.title || 'Speaker'}</div>
						{sp.company && <div className="text-xs text-gray-300">{sp.company}</div>}
					</div>
					{sp.title && <div className="text-xs text-gray-400 truncate">{sp.title}</div>}
					{bio && <div className="text-sm text-gray-300 mt-2">{short}</div>}
					{/* social links */}
					{(sp.links || sp.social || sp.website) && (
						<div className="mt-2 flex gap-2 items-center">
							{sp.links?.twitter && (
								<a href={sp.links.twitter} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-xs text-blue-300">
									Twitter
								</a>
							)}
							{sp.links?.linkedin && (
								<a href={sp.links.linkedin} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-xs text-blue-300">
									LinkedIn
								</a>
							)}
							{sp.website && (
								<a href={sp.website} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-xs text-blue-300">
									Website
								</a>
							)}
						</div>
					)}
				</div>
			</div>
		);
	};

	// Partners grid: logo + name + optional tier badge
	const PartnerTile = ({ p }) => {
		return (
			<a
				href={p.website || '#'}
				onClick={(e) => e.stopPropagation()}
				target="_blank"
				rel="noreferrer"
				className="flex items-center gap-3 p-3 bg-white/3 rounded hover:scale-[1.02] transition-transform"
			>
				<div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded flex items-center justify-center overflow-hidden">
					{p.logo ? (
						<img src={p.logo} alt={p.name || 'partner'} className="w-full h-full object-contain" loading="lazy" />
					) : (
						<div className="text-sm text-gray-200">{(p.name || '').slice(0, 1)}</div>
					)}
				</div>
				<div className="min-w-0">
					<div className="font-medium text-white truncate">{p.name || 'Partner'}</div>
					{p.tier && <div className="text-xs text-gray-400 mt-0.5">{p.tier}</div>}
				</div>
			</a>
		);
	};

	// Co-organizers chips
	const CoOrganizerChip = ({ c }) => (
		<div className="flex items-center gap-2 bg-white/4 rounded-full px-3 py-1">
			<div className="w-7 h-7 rounded-full overflow-hidden">
				{c.logo ? (
					<img src={c.logo} alt={c.name || 'co-organizer'} className="w-full h-full object-cover" loading="lazy" />
				) : (
					<div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
						{(c.name || '').slice(0, 1)}
					</div>
				)}
			</div>
			<div className="text-xs text-white">{c.name || c}</div>
		</div>
	);

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
				{/* backdrop */}
				<Motion.div
					className="absolute inset-0 bg-black/75"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
				/>

				{/* modal */}
				<Motion.div
					initial={{ scale: 0.98, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.98, opacity: 0 }}
					onClick={(e) => e.stopPropagation()}
					className="relative w-[96vw] max-w-[1200px] h-[92vh] bg-gradient-to-br from-gray-900/95 to-black rounded-2xl overflow-hidden shadow-2xl grid md:grid-cols-3"
					aria-labelledby="event-modal-title"
				>
					{/* Visual column (left): use explicit container to ensure full image coverage */}
					<div className="md:col-span-1 w-full h-full bg-black relative flex items-stretch">
						{posterUrl ? (
							<div
								className="w-full h-full bg-center bg-no-repeat bg-cover"
								style={{ backgroundImage: `url("${posterUrl}")` }}
								aria-hidden
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-7xl opacity-10">🎭</div>
						)}

						{/* small caption overlay */}
						{event.posters?.[imgIndex]?.caption && (
							<div className="absolute left-4 bottom-4 px-3 py-1 bg-black/50 text-xs rounded text-gray-200">
								{event.posters[imgIndex].caption}
							</div>
						)}

						{/* image navigation */}
						{event.posters?.length > 1 && (
							<>
								<button
									onClick={prevImg}
									className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full"
									aria-label="Previous image"
								>
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
									</svg>
								</button>
								<button
									onClick={nextImg}
									className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full"
									aria-label="Next image"
								>
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</>
						)}

						{/* close */}
						<button
							ref={closeRef}
							onClick={onClose}
							aria-label="Close"
							className="absolute top-3 right-3 bg-red-600/90 text-white p-2 rounded-full"
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					{/* Details column (middle + right) - scrollable */}
					<div className="md:col-span-2 p-6 overflow-auto flex flex-col gap-4">
						{/* header */}
						<div className="flex items-start justify-between gap-4">
							<div className="min-w-0">
								<h2 id="event-modal-title" className="text-2xl font-bold text-white leading-tight">
									{event.title}
								</h2>
								<div className="text-sm text-gray-400 mt-1">{event.organizer || event.host || ''}</div>
								<div className="mt-2 flex flex-wrap gap-2">
									{Array.isArray(event.tags) &&
										event.tags.map((t) => (
											<span key={t} className="text-xs bg-white/5 px-2 py-0.5 rounded">
												{t}
											</span>
										))}
								</div>
							</div>

							<div className="flex-shrink-0 flex flex-col items-end gap-2">
								{registrationLink ? (
									<button onClick={onRegister} className="px-3 py-1 bg-emerald-500 text-white rounded">
										Register
									</button>
								) : countdown ? (
									<div className="text-right">
										<div className="text-xs text-gray-300">Starts in</div>
										<div className="font-semibold">
											{countdown.days > 0
												? `${countdown.days}d ${countdown.hours}h`
												: countdown.hours > 0
												? `${countdown.hours}h ${countdown.mins}m`
												: `${countdown.mins}m`}
										</div>
										<button onClick={onRemind} className="mt-1 text-xs px-2 py-0.5 rounded bg-blue-600 text-white">
											Remind
										</button>
									</div>
								) : (
									<div className="text-xs text-gray-400">{event.status || 'TBD'}</div>
								)}
								<button onClick={downloadICS} className="text-xs px-3 py-1 border rounded mt-1">
									Add to calendar
								</button>
							</div>
						</div>

						{/* description */}
						<section>
							<h3 className="text-sm font-semibold text-gray-200 mb-2">Description</h3>
							<div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description || 'No description available.'}</div>
						</section>

						{/* Speakers — improved presentation */}
						{speakers.length > 0 && (
							<section>
								<h3 className="text-sm font-semibold text-gray-200 mb-3">Speakers</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{speakers.map((sp, i) => (
										<SpeakerCard key={sp._id || sp.name || i} sp={sp} />
									))}
								</div>
							</section>
						)}

						{/* Partners — logos grid */}
						{partners.length > 0 && (
							<section>
								<h3 className="text-sm font-semibold text-gray-200 mb-3">Partners</h3>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
									{partners.map((p, i) => (
										<PartnerTile key={p._id || p.name || i} p={p} />
									))}
								</div>
							</section>
						)}

						{/* Co-organizers */}
						{coOrganizers.length > 0 && (
							<section>
								<h3 className="text-sm font-semibold text-gray-200 mb-3">Co-organizers</h3>
								<div className="flex flex-wrap gap-2">
									{coOrganizers.map((c, i) => (
										<CoOrganizerChip key={c._id || c.name || i} c={c} />
									))}
								</div>
							</section>
						)}

						{/* Resources */}
						{resources.length > 0 && (
							<section>
								<h3 className="text-sm font-semibold text-gray-200 mb-3">Resources</h3>
								<ul className="list-disc list-inside text-sm text-blue-300 space-y-1">
									{resources.map((r, i) => (
										<li key={r.title || r.url || i}>
											<a href={r.url || '#'} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer">
												{r.title || r.url}
											</a>
										</li>
									))}
								</ul>
							</section>
						)}
					</div>
				</Motion.div>
			</Motion.div>
		</AnimatePresence>,
		document.body
	);
};

export default EventDetailModal;
