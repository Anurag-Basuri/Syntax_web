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
	if (!events?.length) return null;

	const handleClick = useCallback(
		(e) => {
			if (onEventClick) onEventClick(e);
		},
		[onEventClick]
	);

	return (
		<section aria-labelledby="arvantis-events">
			<h3 id="arvantis-events" className="text-2xl font-bold mb-4 text-white">
				Events
			</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{events.map((ev, index) => {
					const idKey = ev?._id || ev?.id || `${ev?.name || 'event'}-${index}`;
					const title = ev?.name || ev?.title || 'Event';
					return (
						<motion.div
							key={idKey}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.05 * index, duration: 0.45 }}
						>
							<button
								type="button"
								onClick={() => handleClick(ev)}
								className="w-full text-left p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group"
								aria-label={`View details for ${title}`}
							>
								<div className="flex items-center justify-between mb-3">
									<span className="text-xs px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-semibold">
										{ev?.type || 'General'}
									</span>
									<div className="text-xs text-gray-400 flex items-center gap-1.5">
										<Calendar size={14} aria-hidden />
										{formatDate(ev?.eventDate)}
									</div>
								</div>
								<h4 className="font-bold text-lg text-white mb-2 truncate">
									{title}
								</h4>
								<div className="flex items-center justify-end text-sm text-cyan-400 font-semibold">
									View Details
									<ArrowRight
										size={16}
										className="ml-1 transform group-hover:translate-x-1 transition-transform"
										aria-hidden
									/>
								</div>
							</button>
						</motion.div>
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
