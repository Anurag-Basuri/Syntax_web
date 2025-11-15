import React, { useMemo } from 'react';
import { CalendarDays, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColor = {
	upcoming: 'bg-blue-500 text-white',
	ongoing: 'bg-green-500 text-white',
	completed: 'bg-gray-500 text-white',
	cancelled: 'bg-red-600 text-white',
	postponed: 'bg-yellow-500 text-black',
	default: 'bg-blue-500 text-white',
};

const formatDate = (value) => {
	if (!value) return 'TBA';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return 'TBA';
	const opts = {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	};
	return d.toLocaleString(undefined, opts);
};

const EventCard = ({ event = {}, compact = false, onEdit, onDelete, deleteLoading }) => {
	const posterUrl = useMemo(() => {
		// prefer first poster url, then thumbnail fields
		const p = (event.posters && event.posters[0]) || event.poster || null;
		return p?.url || p?.secure_url || p?.thumbnail || null;
	}, [event]);

	const status = (event.status || 'upcoming').toLowerCase();
	const badgeClass = statusColor[status] || statusColor.default;

	const registered = event.ticketCount ?? event.registered ?? 0;
	const capacity =
		typeof event.totalSpots !== 'undefined' && event.totalSpots !== null
			? event.totalSpots
			: null;

	return (
		<motion.article
			className={`group relative rounded-xl overflow-hidden shadow-sm border border-gray-700 bg-gradient-to-b from-gray-900/40 to-gray-900/10 transition transform hover:-translate-y-1`}
			whileHover={{ scale: 1.01 }}
			tabIndex={0}
			aria-label={`Event ${event.title || 'untitled'}`}
		>
			{/* visual header: poster or placeholder */}
			<div
				className={`h-36 sm:h-44 bg-center bg-cover flex items-end`}
				style={{
					backgroundImage: posterUrl ? `url("${posterUrl}")` : undefined,
					backgroundColor: posterUrl ? undefined : '#0f1724',
				}}
			>
				{/* gradient overlay */}
				<div className="w-full bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4">
					<div className="flex items-center justify-between">
						<h3 className="text-white text-lg font-semibold truncate">
							{event.title || 'Untitled event'}
						</h3>
						<span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${badgeClass}`}>
							{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Upcoming'}
						</span>
					</div>
					<p className="text-xs text-gray-200/80 mt-1 line-clamp-1">
						{event.venue || event.location || ''}
					</p>
				</div>
			</div>

			{/* body */}
			<div className={`p-4 ${compact ? 'py-3' : ''}`}>
				<p className="text-sm text-gray-300 line-clamp-3 mb-3">{event.description || ''}</p>

				<div className="flex items-center justify-between text-sm text-gray-400">
					<div className="flex items-center gap-3">
						<CalendarDays className="h-4 w-4 text-gray-400" />
						<span>{formatDate(event.eventDate || event.date)}</span>
					</div>

					<div className="flex items-center gap-3">
						<MapPin className="h-4 w-4 text-gray-400" />
						<span className="truncate">{event.venue || event.location || 'TBA'}</span>
					</div>
				</div>

				{!compact && (
					<div className="mt-4 flex items-center justify-between">
						<div className="flex items-center gap-3 text-sm text-gray-300">
							<Users className="h-4 w-4 text-gray-400" />
							<span>
								{registered} registered
								{capacity ? ` / ${capacity}` : ''}
							</span>
						</div>

						{/* actions: visible on hover or focus */}
						<div className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center gap-2">
							{onEdit && (
								<button
									onClick={() => onEdit(event)}
									title="Edit event"
									className="p-2 bg-gray-800/60 hover:bg-gray-700 rounded-md text-gray-200"
									aria-label={`Edit ${event.title}`}
								>
									<Edit className="h-4 w-4" />
								</button>
							)}
							{onDelete && (
								<button
									onClick={() => onDelete(event._id)}
									disabled={deleteLoading}
									title="Delete event"
									className="p-2 bg-red-700/60 hover:bg-red-600 rounded-md text-red-100 disabled:opacity-50"
									aria-label={`Delete ${event.title}`}
								>
									<Trash2 className="h-4 w-4" />
								</button>
							)}
						</div>
					</div>
				)}
			</div>
		</motion.article>
	);
};

export default EventCard;
