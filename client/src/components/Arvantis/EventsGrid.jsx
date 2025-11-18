import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getEventById } from '../../services/eventServices.js';

const formatDate = (date) => {
	if (!date) return 'TBA';
	const d = new Date(date);
	if (isNaN(d.getTime())) return 'TBA';
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const resolveMediaUrl = (item) => {
	if (!item) return null;
	// common shapes: string, { url }, { secure_url }, { publicUrl }, Cloudinary-ish
	if (typeof item === 'string') return item;
	if (item?.url) return item.url;
	if (item?.secure_url) return item.secure_url;
	if (item?.publicUrl) return item.publicUrl;
	if (item?.public_id && item?.secure_url) return item.secure_url;
	return null;
};

const getEventPoster = (ev) => {
	// prefer array posters first (support different prop names)
	if (Array.isArray(ev?.posters) && ev.posters.length) {
		const u = resolveMediaUrl(ev.posters[0]);
		if (u) return u;
	}
	// legacy / possible single poster shapes
	const single = ev?.poster || ev?.image || ev?.hero || ev?.thumbnail;
	const u = resolveMediaUrl(single);
	if (u) return u;

	// sometimes the populated event only contains a reference; if there's a nested media-like field
	if (ev?.media && (ev.media.url || ev.media.secure_url)) return resolveMediaUrl(ev.media);

	// no image found
	return null;
};

/* EventCard: extracts poster robustly, fetches event details if needed via service */
const EventCard = ({ ev, index, onEventClick, fallbackImage = null }) => {
	const idKey = ev?._id || ev?.id || null;
	const title = ev?.name || ev?.title || 'Event';

	// try immediate poster from provided object
	const immediatePoster = getEventPoster(ev);

	// fetch full event only when no immediate poster and we have an id
	const { data: fetchedEvent } = useQuery(
		['event-brief', idKey],
		() => (idKey ? getEventById(idKey) : Promise.resolve(null)),
		{
			enabled: !immediatePoster && !!idKey,
			staleTime: 60_000,
			retry: 0,
		}
	);

	// resolve poster from fetched data if needed
	const poster =
		immediatePoster ||
		resolveMediaUrl(fetchedEvent?.posters?.[0]) ||
		resolveMediaUrl(fetchedEvent?.poster) ||
		resolveMediaUrl(fetchedEvent?.image) ||
		resolveMediaUrl(fetchedEvent?.hero) ||
		fallbackImage ||
		null;

	const desc =
		ev?.shortDescription ||
		ev?.description ||
		fetchedEvent?.shortDescription ||
		fetchedEvent?.description ||
		'';

	const handleClick = useCallback(() => {
		if (onEventClick) onEventClick(ev);
	}, [onEventClick, ev]);

	return (
		<motion.article
			initial={{ opacity: 0, y: 18 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.04 * index, duration: 0.45 }}
			className="event-card rounded-2xl overflow-hidden"
			role="article"
			aria-labelledby={`ev-${idKey || index}`}
			style={{
				background: 'var(--card-bg)',
				border: '1px solid var(--card-border)',
			}}
		>
			<button
				type="button"
				onClick={handleClick}
				className="w-full text-left group"
				aria-label={`View details for ${title}`}
			>
				<div className="relative h-44 md:h-48 w-full overflow-hidden">
					{poster ? (
						<img
							src={poster}
							alt={title}
							className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
							loading="lazy"
						/>
					) : (
						<div
							className="w-full h-full flex items-center justify-center"
							style={{ color: 'var(--text-secondary)' }}
						>
							{/* nicer placeholder */}
							<div className="text-center">
								<div className="text-3xl mb-2">📷</div>
								<div className="text-sm muted">No image</div>
							</div>
						</div>
					)}

					{/* date chip */}
					<div className="absolute left-4 top-4 chip mono">
						<Calendar size={12} />{' '}
						<span className="ml-2">
							{formatDate(ev?.eventDate || fetchedEvent?.eventDate)}
						</span>
					</div>

					{/* diagonal type ribbon */}
					{(ev?.type || fetchedEvent?.type) && (
						<div className="ribbon">{ev?.type || fetchedEvent?.type}</div>
					)}
				</div>

				<div className="p-5">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h4
								id={`ev-${idKey || index}`}
								className="font-semibold text-lg truncate"
								style={{ color: 'var(--text-primary)' }}
							>
								{title}
							</h4>
							<p
								className="text-sm mt-1 line-clamp-2"
								style={{ color: 'var(--text-secondary)' }}
							>
								{desc}
							</p>
						</div>
						<div className="ml-3 flex-shrink-0 accent-wrap">
							<ArrowRight size={20} className="accent-icon" />
						</div>
					</div>

					<div
						className="mt-4 flex items-center gap-3 text-sm"
						style={{ color: 'var(--text-secondary)' }}
					>
						<span className="code-chip">
							{ev?.type || fetchedEvent?.type || 'General'}
						</span>
						<span className="ml-auto mono muted">
							{ev?.location || fetchedEvent?.venue || ''}
						</span>
					</div>
				</div>
			</button>
		</motion.article>
	);
};

EventCard.propTypes = {
	ev: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
	index: PropTypes.number,
	onEventClick: PropTypes.func,
	fallbackImage: PropTypes.string,
};

const EventsGrid = ({ events = [], onEventClick, fallbackImage = null }) => {
	if (!events?.length)
		return (
			<section aria-labelledby="arvantis-events">
				<h3 id="arvantis-events" className="section-title">
					Events
				</h3>
				<div className="py-10 text-center muted">No events available.</div>
			</section>
		);

	return (
		<section aria-labelledby="arvantis-events" id="events">
			<h3 id="arvantis-events" className="section-title mb-6">
				Events
			</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{events.map((ev, index) => {
					const key = ev?._id || ev?.id || `${ev?.name || 'event'}-${index}`;
					return (
						<EventCard
							key={key}
							ev={ev}
							index={index}
							onEventClick={onEventClick}
							fallbackImage={fallbackImage}
						/>
					);
				})}
			</div>
		</section>
	);
};

EventsGrid.propTypes = {
	events: PropTypes.array,
	onEventClick: PropTypes.func,
	fallbackImage: PropTypes.string,
};

export default React.memo(EventsGrid);
