import { CalendarDays, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const EventCard = ({ event, compact = false, onEdit, onDelete, deleteLoading }) => {
	const formatDate = (dateStringOrObj) => {
		const dt = dateStringOrObj
			? new Date(dateStringOrObj)
			: event?.eventDate
			? new Date(event.eventDate)
			: null;
		if (!dt || Number.isNaN(dt.getTime())) return 'TBA';
		const options = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		};
		return dt.toLocaleDateString(undefined, options);
	};

	return (
		<motion.div
			className={`bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden ${
				compact ? '' : 'hover:border-blue-500 transition-colors'
			}`}
			whileHover={{ y: -5 }}
			transition={{ duration: 0.2 }}
		>
			<div
				className={`bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-5 ${
					compact ? 'pb-3' : ''
				}`}
			>
				<div className="flex justify-between items-start">
					<div>
						<h3 className="font-bold text-white">{event.title}</h3>
						<p className="text-sm text-gray-300 mt-1 line-clamp-2">
							{event.description}
						</p>
					</div>
					{!compact && (
						<div className="flex gap-2">
							{onEdit && (
								<button
									onClick={() => onEdit(event)}
									className="p-1.5 bg-gray-700/50 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white"
								>
									<Edit className="h-4 w-4" />
								</button>
							)}
							{onDelete && (
								<button
									onClick={() => onDelete(event._id)}
									disabled={deleteLoading}
									className="p-1.5 bg-red-700/50 hover:bg-red-600 rounded-lg text-red-300 hover:text-white disabled:opacity-50"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="p-5">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex items-center gap-2">
						<CalendarDays className="h-4 w-4 text-gray-400" />
						<span className="text-sm text-gray-300">
							{formatDate(event.eventDate || event.date)}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-gray-400" />
						<span className="text-sm text-gray-300">
							{event.venue || event.location}
						</span>
					</div>
				</div>

				{!compact && (
					<div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4 text-gray-400" />
							<span className="text-sm text-gray-300">
								{event.ticketCount ?? '0'} registered
							</span>
						</div>
						<div className="flex gap-2">
							<span className="px-2.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
								{event.status
									? event.status.charAt(0).toUpperCase() + event.status.slice(1)
									: 'Upcoming'}
							</span>
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
};

export default EventCard;
