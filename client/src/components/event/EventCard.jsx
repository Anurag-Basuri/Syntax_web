import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Handles invalid or missing dates gracefully
const safeFormatDate = (dateInput) => {
	if (!dateInput) return 'Date TBD';
	const date = new Date(dateInput);
	// Check if the date is valid
	if (isNaN(date.getTime())) {
		return 'Invalid Date';
	}
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
};

const EventCard = ({ event }) => {
	const [imageError, setImageError] = useState(false);
	const navigate = useNavigate();

	if (!event) return null; // Render nothing if event data is missing

	const eventDate = new Date(event.eventDate || event.date);
	const isValidDate = !isNaN(eventDate.getTime());
	const now = new Date();

	const isOngoing =
		isValidDate &&
		(event.status === 'ongoing' || eventDate.toDateString() === now.toDateString());
	const isUpcoming = isValidDate && eventDate > now && !isOngoing;

	return (
		<>
			<article
				className="event-card group relative cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover-lift
                    backdrop-blur-md bg-white/5 dark:bg-slate-900/30"
				onClick={() => navigate(`/events/${event._id || event.id}`)}
				aria-labelledby={`event-${event._id}-title`}
				role="button"
			>
				{/* Image Section */}
				<div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100 dark:bg-gray-800">
					{event.posters?.length > 0 && !imageError ? (
						<img
							src={event.posters[0].url}
							alt={event.title || 'Event poster'}
							onError={() => setImageError(true)}
							className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
							loading="lazy"
							decoding="async"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
							<div className="text-5xl opacity-20">🎭</div>
						</div>
					)}

					{/* Theme-aware overlay (improves contrast in light mode) */}
					<div className="absolute inset-0 event-card-overlay" />

					{/* Status Badge */}
					{(isOngoing || isUpcoming) && (
						<div
							className={`absolute top-3 right-3 px-2.5 py-1 rounded-full font-bold text-xs shadow-lg backdrop-blur-sm border ${
								isOngoing
									? 'bg-red-600 text-white border-red-500/40'
									: 'bg-blue-600 text-white border-blue-500/40'
							}`}
						>
							{isOngoing ? '🔴 LIVE' : '🚀 UPCOMING'}
						</div>
					)}
				</div>

				{/* Content Section */}
				<div className="p-4 space-y-3">
					<h3
						id={`event-${event._id}-title`}
						className="text-lg font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2"
					>
						{event.title || 'Untitled Event'}
					</h3>

					<div className="space-y-2 text-sm">
						<div className="flex items-center gap-2 text-[var(--text-secondary)]">
							<svg
								className="w-4 h-4 shrink-0"
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
						<div className="flex items-center gap-2 text-[var(--accent-1)]">
							<svg
								className="w-4 h-4 shrink-0"
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
							<span className="font-medium truncate">
								{event.venue || 'Venue TBD'}
							</span>
						</div>
					</div>

					<p className="text-[var(--text-secondary)] text-sm line-clamp-2 leading-relaxed">
						{event.description || ''}
					</p>

					{/* Footer with subtle actions */}
					<div className="mt-3">
						<div className="text-xs text-[var(--muted)]">
							{event.tags?.slice(0, 2).map((t) => (
								<span
									key={t}
									className="inline-block mr-2 px-2 py-0.5 bg-[color:var(--glass-bg)]/40 rounded text-xs"
								>
									{t}
								</span>
							))}
						</div>
					</div>
				</div>
			</article>
		</>
	);
};

export default React.memo(EventCard);
