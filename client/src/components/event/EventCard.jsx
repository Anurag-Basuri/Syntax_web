import { useState } from 'react';
import { motion } from 'framer-motion';
import EventDetailModal from './EventDetailModal.jsx';

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
	const [showModal, setShowModal] = useState(false);

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
			<motion.div
				className="glass-card rounded-2xl overflow-hidden hover-lift transition-all duration-300 group relative cursor-pointer border border-white/10 hover:border-white/20"
				whileHover={{ y: -5 }}
				onClick={() => setShowModal(true)}
				layout
			>
				{/* Image Section */}
				<div className="relative h-48 sm:h-56 overflow-hidden">
					{event.posters?.length > 0 && !imageError ? (
						<motion.img
							src={event.posters[0].url}
							alt={event.title}
							onError={() => setImageError(true)}
							className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
							<div className="text-5xl opacity-20">🎭</div>
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

					{/* Status Badge */}
					{(isOngoing || isUpcoming) && (
						<div
							className={`absolute top-3 right-3 px-2.5 py-1 rounded-full font-bold text-xs shadow-lg backdrop-blur-sm border ${
								isOngoing
									? 'bg-red-500/90 text-white border-red-400/50'
									: 'bg-blue-500/90 text-white border-blue-400/50'
							}`}
						>
							{isOngoing ? '🔴 LIVE' : '🚀 UPCOMING'}
						</div>
					)}
				</div>

				{/* Content Section */}
				<div className="p-4 space-y-3">
					<h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 line-clamp-2">
						{event.title || 'Untitled Event'}
					</h3>

					<div className="space-y-2 text-sm">
						<div className="flex items-center gap-2 text-blue-300">
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
							{/* FIX: Use the safe formatter */}
							<span className="font-medium">{safeFormatDate(event.eventDate)}</span>
						</div>
						<div className="flex items-center gap-2 text-cyan-300">
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

					<p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
						{event.description}
					</p>
				</div>
			</motion.div>

			{/* Event Detail Modal (now a separate component) */}
			<EventDetailModal
				event={event}
				isOpen={showModal}
				onClose={() => setShowModal(false)}
			/>
		</>
	);
};

export default EventCard;
