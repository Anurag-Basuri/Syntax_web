import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, Calendar, MapPin, Tag, Users, Globe } from 'lucide-react';
import { getPublicEventDetails } from '../../services/eventServices.js';

/*
 EventDetailModal
 - Fetches public event details on open (uses getPublicEventDetails)
 - Attractive two-column layout on wide screens, stacks on mobile
 - Poster hero, metadata panel, speakers & partners lists, registration CTA
 - Basic focus management and Esc-to-close
*/

const fetchEvent = async (id, signal) => {
	if (!id) return null;
	return getPublicEventDetails(id, { signal });
};

const DetailRow = ({ icon: Icon, label, children }) => (
	<div className="flex items-start gap-3">
		<Icon className="text-indigo-500 mt-1" />
		<div>
			<div className="text-xs text-[var(--text-muted)]">{label}</div>
			<div className="font-medium mt-0.5">{children}</div>
		</div>
	</div>
);

const EventDetailModal = ({ event: initialEvent, isOpen, onClose }) => {
	const id = initialEvent?._id || initialEvent?.id;
	const {
		data: event,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ['event-public', id],
		queryFn: ({ signal }) => fetchEvent(id, signal),
		enabled: !!isOpen && !!id,
		staleTime: 60_000,
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e) => {
			if (e.key === 'Escape') onClose?.();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	// Use the listing data as fallback while fetching
	const payload = event || initialEvent || {};

	const poster = payload.posters?.[0]?.url || payload.posters?.[0]?.secure_url || null;
	const title = payload.title || 'Untitled Event';
	const dateLabel = payload.eventDate ? new Date(payload.eventDate).toLocaleString() : 'TBD';
	const venue = payload.venue || 'Venue TBD';
	const organizer = payload.organizer || 'Syntax Organization';
	const tags = payload.tags || [];
	const speakers = payload.speakers || [];
	const partners = payload.partners || [];
	const desc = payload.description || payload.summary || 'No description available.';
	const registrationInfo = payload.registrationInfo || payload.registration || null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center p-4"
			>
				{/* backdrop */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="absolute inset-0 bg-black/50 backdrop-blur-sm"
					onClick={onClose}
				/>

				{/* modal */}
				<motion.div
					initial={{ y: 20, scale: 0.98, opacity: 0 }}
					animate={{ y: 0, scale: 1, opacity: 1 }}
					exit={{ y: 20, scale: 0.98, opacity: 0 }}
					transition={{ duration: 0.22 }}
					className="relative z-10 w-full max-w-6xl max-h-[90vh] bg-[var(--card-bg)] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-3"
					role="dialog"
					aria-modal="true"
					aria-label={`Event details: ${title}`}
				>
					{/* left: hero poster */}
					<div className="col-span-1 bg-gradient-to-br from-slate-800 via-slate-900 to-black flex flex-col">
						<div className="relative h-56 sm:h-72 lg:h-full w-full overflow-hidden">
							{poster ? (
								<img
									src={poster}
									alt={title}
									className="w-full h-full object-cover"
									loading="lazy"
									decoding="async"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
									<div className="text-6xl text-white opacity-90">🎭</div>
								</div>
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
						</div>

						{/* quick meta stack at bottom */}
						<div className="p-4 md:p-6 text-sm text-white/90 bg-gradient-to-t from-black/60">
							<div className="flex items-start gap-3">
								<Calendar className="mt-1 text-white/90" />
								<div>
									<div className="text-xs text-white/70">When</div>
									<div className="font-semibold">{dateLabel}</div>
								</div>
							</div>

							<div className="mt-3 flex items-start gap-3">
								<MapPin className="mt-1 text-white/90" />
								<div>
									<div className="text-xs text-white/70">Where</div>
									<div className="font-semibold">{venue}</div>
								</div>
							</div>

							<div className="mt-3 flex items-start gap-3">
								<Users className="mt-1 text-white/90" />
								<div>
									<div className="text-xs text-white/70">Organizer</div>
									<div className="font-semibold">{organizer}</div>
								</div>
							</div>
						</div>
					</div>

					{/* right: details */}
					<div className="col-span-2 p-6 overflow-y-auto">
						<div className="flex items-start justify-between gap-4">
							<div className="min-w-0">
								<h2 className="text-2xl font-extrabold leading-tight">{title}</h2>
								<div className="mt-2 flex items-center gap-2 flex-wrap">
									{tags.slice(0, 6).map((t) => (
										<span
											key={t}
											className="text-xs px-2 py-1 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)]"
										>
											<Tag className="inline-block mr-1" /> {t}
										</span>
									))}
								</div>
							</div>

							<button
								onClick={onClose}
								className="p-2 rounded-md text-[var(--text-muted)] hover:bg-gray-100"
								aria-label="Close event details"
							>
								<X size={20} />
							</button>
						</div>

						{/* registration + highlights */}
						<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
								<div className="text-xs text-[var(--text-muted)]">Registration</div>
								<div className="mt-1 flex items-center gap-3">
									<div className="font-medium">
										{registrationInfo?.actionLabel ||
											registrationInfo?.actionUrl ||
											'No registration'}
									</div>
									{registrationInfo?.isOpen && registrationInfo?.actionUrl && (
										<a
											href={registrationInfo.actionUrl}
											target="_blank"
											rel="noreferrer"
											className="px-3 py-1 rounded bg-emerald-600 text-white text-sm inline-flex items-center gap-2"
											onClick={(e) => e.stopPropagation()}
										>
											{registrationInfo.actionLabel || 'Register'}
											<Globe size={14} />
										</a>
									)}
								</div>
								{registrationInfo?.message && (
									<div className="mt-2 text-xs text-[var(--text-muted)]">
										{registrationInfo.message}
									</div>
								)}
							</div>

							<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
								<div className="text-xs text-[var(--text-muted)]">Details</div>
								<div className="mt-1 text-sm">
									{payload.ticketPrice ? (
										<div>
											Price: <strong>₹{payload.ticketPrice}</strong>
										</div>
									) : (
										<div>Free event</div>
									)}
									{typeof payload.spotsLeft !== 'undefined' && (
										<div className="mt-1">
											Spots left:{' '}
											<strong>
												{payload.spotsLeft === Infinity
													? 'Unlimited'
													: payload.spotsLeft}
											</strong>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* description */}
						<div className="mt-6">
							<h3 className="text-lg font-semibold mb-2">About</h3>
							<p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
								{desc}
							</p>
						</div>

						{/* speakers */}
						{speakers.length > 0 && (
							<div className="mt-6">
								<h3 className="text-lg font-semibold mb-3">Speakers</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{speakers.map((s, idx) => (
										<div
											key={idx}
											className="flex items-start gap-3 p-3 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)]"
										>
											{s.photo && s.photo.url ? (
												<img
													src={s.photo.url}
													alt={s.name}
													className="w-12 h-12 rounded-md object-cover"
												/>
											) : (
												<div className="w-12 h-12 rounded-md bg-indigo-600 text-white flex items-center justify-center font-semibold">
													{(s.name || 'S').slice(0, 2).toUpperCase()}
												</div>
											)}
											<div>
												<div className="font-medium">{s.name}</div>
												<div className="text-xs text-[var(--text-muted)]">
													{s.title}
												</div>
												{s.bio && (
													<div className="text-xs mt-1 text-[var(--text-secondary)] line-clamp-3">
														{s.bio}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* partners */}
						{partners.length > 0 && (
							<div className="mt-6">
								<h3 className="text-lg font-semibold mb-3">Partners</h3>
								<div className="flex gap-3 flex-wrap items-center">
									{partners.map((p, i) => (
										<a
											key={i}
											href={p.website || '#'}
											target="_blank"
											rel="noreferrer"
											className="inline-flex items-center gap-3 p-2 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)]"
										>
											{p.logo?.url ? (
												<img
													src={p.logo.url}
													alt={p.name}
													className="w-10 h-10 object-contain"
												/>
											) : (
												<div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-xs">
													{p.name?.slice(0, 2)}
												</div>
											)}
											<div className="text-sm">{p.name}</div>
										</a>
									))}
								</div>
							</div>
						)}
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

export default React.memo(EventDetailModal);
