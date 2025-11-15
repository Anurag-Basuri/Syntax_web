import { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useEvent } from '../../hooks/useEvents.js'; // use the existing hook

// Handles invalid or missing dates gracefully
const safeFormatDate = (dateInput) => {
	if (!dateInput) return 'Date TBD';
	const date = new Date(dateInput);
	if (isNaN(date.getTime())) {
		return 'Invalid Date';
	}
	return new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
};

const timeUntil = (date) => {
	if (!date) return null;
	const now = new Date();
	const diff = new Date(date) - now;
	if (isNaN(diff)) return null;
	if (diff <= 0) return null;
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
	const dtend = dtstart; // unknown - keep same
	const uid = `${ev._id || Math.random().toString(36).slice(2)}@syntaxclub`;
	const title = ev.title || 'Event';
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

const EventDetailModal = ({ event: initialEvent, isOpen, onClose }) => {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const closeBtnRef = useRef(null);
	const id = initialEvent?._id ?? null;

	// Use the existing useEvent hook. Pass id only when modal is open to avoid unnecessary fetches.
	// We intentionally call the hook unconditionally (with null when closed) so hook order is stable.
	const { data: fetched, isLoading, isError, refetch } = useEvent(isOpen ? id : null);

	useEffect(() => {
		if (!isOpen) return;
		// focus close button for keyboard users
		closeBtnRef.current?.focus();
		const onKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isOpen, onClose]);

	// Prefer fetched data, fallback to initialEvent
	const event = fetched || initialEvent;

	// compute countdown unconditionally so hooks are stable; safe if event is undefined
	const countdown = useMemo(() => timeUntil(event?.eventDate || event?.date), [event]);

	if (!isOpen || !event) return null;

	const eventDate = new Date(event.eventDate || event.date);
	const isValidDate = !isNaN(eventDate.getTime());
	const isOngoing =
		isValidDate &&
		(event.status === 'ongoing' || eventDate.toDateString() === new Date().toDateString());

	const registrationLink =
		event.registrationLink ||
		event.registrationUrl ||
		event.registration ||
		event.registerUrl ||
		null;

	const onRemindClick = (e) => {
		e.stopPropagation();
		// lightweight client-side "remind me" — you can replace with real subscription workflow
		alert('Reminder saved (client-side). Integrate a notification service to make this real.');
	};

	const downloadICS = (e) => {
		e.stopPropagation();
		const ics = generateICS(event);
		if (!ics) {
			alert('Unable to generate calendar file — missing date.');
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

	const nextImage = () => {
		if (event.posters?.length > 1) {
			setCurrentImageIndex((prev) => (prev + 1) % event.posters.length);
		}
	};

	const prevImage = () => {
		if (event.posters?.length > 1) {
			setCurrentImageIndex(
				(prev) => (prev - 1 + event.posters.length) % event.posters.length
			);
		}
	};

	return (
		<AnimatePresence>
			<Motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
				onClick={onClose}
				role="presentation"
			>
				<Motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					className="glass-card rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative"
					onClick={(e) => e.stopPropagation()}
					role="dialog"
					aria-modal="true"
					aria-labelledby="event-modal-title"
					tabIndex={-1}
				>
					{/* Close Button */}
					<button
						ref={closeBtnRef}
						onClick={onClose}
						className="absolute top-3 right-3 z-20 bg-red-500/80 text-white p-2 rounded-full"
						aria-label="Close event details"
						type="button"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>

					<div className="md:grid md:grid-cols-2 md:gap-0">
						{/* Image / gallery area */}
						<div className="relative h-52 md:h-auto md:min-h-[40vh] bg-black rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl flex items-center justify-center overflow-hidden">
							{event.posters?.length > 0 ? (
								<img
									key={currentImageIndex}
									src={event.posters[currentImageIndex].url}
									alt={
										event.posters[currentImageIndex].caption ||
										`${event.title} poster`
									}
									className="w-full h-full object-cover"
									loading="lazy"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-6xl opacity-20">
									🎭
								</div>
							)}
							{event.posters?.length > 1 && (
								<>
									<button
										onClick={(e) => {
											e.stopPropagation();
											prevImage();
										}}
										type="button"
										className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
										aria-label="Previous image"
									>
										<svg
											className="w-6 h-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 19l-7-7 7-7"
											/>
										</svg>
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											nextImage();
										}}
										type="button"
										className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
										aria-label="Next image"
									>
										<svg
											className="w-6 h-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</button>
								</>
							)}
						</div>

						{/* Details */}
						<div className="p-6 space-y-4">
							{isLoading ? (
								<div className="animate-pulse space-y-4">
									<div className="h-6 bg-gray-700 rounded w-3/4" />
									<div className="h-4 bg-gray-700 rounded w-1/2" />
									<div className="h-48 bg-gray-800 rounded" />
								</div>
							) : isError ? (
								<div className="text-center py-8">
									<p className="text-red-400 mb-3">Failed to load details</p>
									<button
										className="px-4 py-2 rounded bg-blue-600 text-white"
										onClick={(e) => {
											e.stopPropagation();
											refetch();
										}}
									>
										Retry
									</button>
								</div>
							) : (
								<>
									<header className="flex items-start justify-between gap-4">
										<div className="flex-1">
											<h2
												id="event-modal-title"
												className="text-2xl md:text-3xl font-bold text-white"
											>
												{event.title}
											</h2>
											<p className="text-sm text-gray-400 mt-1">
												{event.organizer ? `${event.organizer}` : null}
											</p>
										</div>
										<div className="flex flex-col items-end space-y-2">
											{registrationLink ? (
												<a
													href={registrationLink}
													target="_blank"
													rel="noreferrer"
													onClick={(e) => e.stopPropagation()}
													className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded shadow hover:bg-emerald-400"
												>
													Register
													<svg
														className="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M13 7l5 5m0 0l-5 5m5-5H6"
														/>
													</svg>
												</a>
											) : countdown ? (
												<div className="text-right">
													<div className="text-sm text-gray-300">Starts in</div>
													<div className="font-semibold text-white">
														{countdown.days > 0
															? `${countdown.days}d ${countdown.hours}h`
															: countdown.hours > 0
															? `${countdown.hours}h ${countdown.mins}m`
															: `${countdown.mins}m`}
													</div>
													<button
														onClick={(e) => {
															e.stopPropagation();
															onRemindClick(e);
														}}
														className="mt-2 text-xs px-2 py-1 rounded bg-blue-600 text-white"
													>
														Remind me
													</button>
												</div>
											) : (
												<div className="text-right">
													<div className="text-sm text-gray-400">Status</div>
													<div className="font-semibold text-white">
														{event.status || (isOngoing ? 'Live' : 'TBD')}
													</div>
												</div>
											)}
										</div>
									</header>

									<div className="flex flex-wrap gap-4 text-sm items-center">
										<div className="flex items-center gap-2 text-blue-300">
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span className="font-medium">{safeFormatDate(event.eventDate)}</span>
										</div>

										{event.venue && (
											<div className="flex items-center gap-2 text-cyan-300">
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
													/>
												</svg>
												<span className="font-medium">{event.venue}</span>
											</div>
										)}
									</div>

									<p className="text-gray-300 leading-relaxed mt-3">{event.description}</p>

									{event.tags?.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-3">
											{event.tags.map((tag) => (
												<span
													key={tag}
													className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium"
												>
													{tag}
												</span>
											))}
										</div>
									)}

									{/* Secondary actions */}
									<div className="flex items-center gap-2 mt-4">
										<button
											onClick={(e) => {
												e.stopPropagation();
												downloadICS(e);
											}}
											className="px-3 py-2 rounded bg-transparent border border-gray-700 text-gray-200 text-sm hover:bg-gray-800"
										>
											Add to calendar
										</button>

										{!registrationLink && (
											<button
												onClick={(e) => {
													e.stopPropagation();
													onRemindClick(e);
												}}
												className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-500"
											>
												Notify me
											</button>
										)}
									</div>
								</>
							)}
						</div>
					</div>
				</Motion.div>
			</Motion.div>
		</AnimatePresence>
	);
};

export default EventDetailModal;
