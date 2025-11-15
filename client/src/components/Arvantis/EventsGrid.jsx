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
			<h3 id="arvantis-events" className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Events</h3>
			<div className="py-10 text-center" style={{ color: 'var(--text-secondary)' }}>No events available.</div>
		</section>
	);

	const handleClick = useCallback((e) => { if (onEventClick) onEventClick(e); }, [onEventClick]);

	return (
		<section aria-labelledby="arvantis-events" id="events">
			<h3 id="arvantis-events" className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Events</h3>
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
							className="rounded-2xl overflow-hidden shadow-lg"
							style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
						>
							<button
								type="button"
								onClick={() => handleClick(ev)}
								className="w-full text-left group"
								aria-label={`View details for ${title}`}
							>
								<div className="relative h-44 md:h-48 w-full overflow-hidden">
									{poster ? (
										<img src={poster} alt={title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
									) : (
										<div className="w-full h-full flex items-center justify-center" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>No image</div>
									)}
									<div className="absolute left-4 top-4 inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.28)', color: 'var(--text-primary)' }}>
										<Calendar size={14} />
										<span style={{ fontSize: 13 }}>{formatDate(ev?.eventDate)}</span>
									</div>
								</div>

								<div className="p-5">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<h4 className="font-semibold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{title}</h4>
											<p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
										</div>
										<div className="ml-3 flex-shrink-0" style={{ color: 'var(--accent-1)' }}>
											<ArrowRight size={20} className="opacity-90 group-hover:translate-x-1 transform transition-transform" />
										</div>
									</div>

									<div className="mt-4 flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
										<span style={{ padding: '0.25rem 0.5rem', background: 'transparent', borderRadius: 6, border: '1px solid var(--glass-border)' }}>{ev?.type || 'General'}</span>
										<span className="ml-auto" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ev?.location || ''}</span>
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
