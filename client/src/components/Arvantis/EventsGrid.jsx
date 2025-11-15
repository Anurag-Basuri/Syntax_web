import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const formatDate = (date) => {
	if (!date) return 'TBA';
	const d = new Date(date);
	if (isNaN(d.getTime())) return 'TBA';
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const EventsGrid = ({ events = [], onEventClick }) => {
	if (!events?.length) return (
		<section aria-labelledby="arvantis-events">
			<h3 id="arvantis-events" className="text-2xl font-bold mb-4 text-white">Events</h3>
			<div className="py-10 text-center text-gray-400">No events available.</div>
		</section>
	);

	const handleClick = useCallback(
		(e) => {
			if (onEventClick) onEventClick(e);
		},
		[onEventClick]
	);

	return (
		<section aria-labelledby="arvantis-events" id="events">
			<h3 id="arvantis-events" className="text-2xl font-bold mb-6 text-white">Events</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{events.map((ev, index) => {
					const idKey = ev?._id || ev?.id || `${ev?.name || 'event'}-${index}`;
					const title = ev?.name || ev?.title || 'Event';
					const poster = (Array.isArray(ev?.posters) && ev.posters[0]?.url) || ev?.poster?.url || ev?.image;
					const desc = ev?.shortDescription || ev?.description || '';
					return (
						<motion.article
							key={idKey}
							initial={{ opacity: 0, y: 18 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.04 * index, duration: 0.45 }}
							className="rounded-2xl overflow-hidden bg-white/4 border border-white/6 shadow-lg"
						>
							<button
								type="button"
								onClick={() => handleClick(ev)}
								className="w-full text-left group"
								aria-label={`View details for ${title}`}
							>
								<div className="relative h-44 md:h-48 w-full overflow-hidden bg-gray-700">
									{poster ? (
										<img src={poster} alt={title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
									) : (
										<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-gray-200">No image</div>
									)}
									<div className="absolute left-4 top-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 text-sm text-gray-200 backdrop-blur-sm">
										<Calendar size={14} aria-hidden />
										<span>{formatDate(ev?.eventDate)}</span>
									</div>
								</div>

								<div className="p-5">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<h4 className="font-semibold text-lg text-white truncate">{title}</h4>
											<p className="text-sm text-gray-300 mt-1 line-clamp-2">{desc}</p>
										</div>
										<div className="ml-3 flex-shrink-0 text-cyan-300">
											<ArrowRight size={20} className="opacity-90 group-hover:translate-x-1 transform transition-transform" />
										</div>
									</div>

									<div className="mt-4 flex items-center gap-3 text-sm text-gray-300">
										<span className="px-2 py-1 rounded-md bg-white/6">{ev?.type || 'General'}</span>
										<span className="text-xs text-gray-400 ml-auto">{ev?.location || ''}</span>
									</div>
								</div>
							</button>
						</motion.article>
					);
				})}
			</div>
		</section>
	);
};

EventsGrid.propTypes = {
	events: PropTypes.array,
	onEventClick: PropTypes.func,
};

export default React.memo(EventsGrid);
