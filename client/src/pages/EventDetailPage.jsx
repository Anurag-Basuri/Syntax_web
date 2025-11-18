import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Home, Users, Tag, FileText, CheckCircle } from 'lucide-react';
import { getEventById } from '../services/eventServices.js';
import LoadingBlock from '../components/Arvantis/LoadingBlock.jsx';
import '../arvantis.css';

const prettyDate = (d) => {
	if (!d) return 'TBD';
	const dt = new Date(d);
	if (isNaN(dt.getTime())) return String(d);
	return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
const prettyTime = (t) => (t ? String(t) : 'TBD');

const InfoRow = ({ icon: Icon, label, value }) => (
	<div className="flex items-start gap-3">
		<div className="text-indigo-500 mt-1">
			<Icon size={18} />
		</div>
		<div className="min-w-0">
			<div className="text-xs text-[var(--text-secondary)]">{label}</div>
			<div className="font-medium break-words">{value ?? '—'}</div>
		</div>
	</div>
);

const EventDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const {
		data: payload,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['event-public', id],
		queryFn: ({ signal }) => getEventById(id, { signal }),
		enabled: !!id,
		staleTime: 60_000,
		retry: 1,
	});

	// stable derived values before returns
	const event = useMemo(() => payload || {}, [payload]);
	const title = event.title || 'Untitled Event';
	const poster = event.posters?.[0]?.url || event.posters?.[0]?.secure_url || null;
	const dateLabel = event.eventDate ? prettyDate(event.eventDate) : 'TBD';
	const timeLabel = event.eventTime ? prettyTime(event.eventTime) : 'TBD';
	const venue = event.venue || 'TBD';
	const room = event.room || null;
	const organizer = event.organizer || 'Syntax Organization';
	const coOrganizers = Array.isArray(event.coOrganizers)
		? event.coOrganizers
		: event.coOrganizers
		? [event.coOrganizers]
		: [];
	const category = event.category || '—';
	const subcategory = event.subcategory || '—';
	const partners = Array.isArray(event.partners) ? event.partners : [];
	const speakers = Array.isArray(event.speakers) ? event.speakers : [];
	const resources = Array.isArray(event.resources) ? event.resources : [];
	const ticketPrice =
		typeof event.ticketPrice === 'number'
			? `₹${new Intl.NumberFormat().format(event.ticketPrice)}`
			: event.ticketPrice ?? 'TBD';
	const status = event.status || 'upcoming';

	useEffect(() => {
		if (!id) navigate(-1);
	}, [id, navigate]);

	if (isLoading) return <LoadingBlock label="Loading event..." />;
	if (isError)
		return <div className="p-8">Error loading event: {error?.message || 'Unknown'}</div>;

	return (
		<motion.main
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="min-h-screen py-8"
		>
			<div className="max-w-6xl mx-auto px-4">
				<nav className="flex items-center gap-3 text-sm mb-4">
					<button onClick={() => navigate(-1)} className="btn-ghost small">
						← Back
					</button>
					<Link to="/events" className="text-xs muted">
						All events
					</Link>
					<span className="text-xs muted">/</span>
					<span className="font-medium">{title}</span>
				</nav>

				{/* Header */}
				<header className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-6">
					<div className="md:col-span-2 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-900">
						{poster ? (
							<img
								src={poster}
								alt={title}
								className="w-full h-64 md:h-96 object-cover block"
								loading="lazy"
							/>
						) : (
							<div className="w-full h-64 md:h-96 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
								<div className="text-6xl">🎭</div>
							</div>
						)}
						<div className="absolute left-6 bottom-6 z-20 text-white">
							<h1 className="text-2xl md:text-4xl font-extrabold neon-text leading-tight">
								{title}
							</h1>
							<div className="mt-1 mono-tech text-sm">
								{venue} • {dateLabel}
							</div>
						</div>
					</div>

					{/* Right column: compact info card */}
					<aside className="space-y-4">
						<div className="glass-card p-4 tech">
							<div className="flex items-center justify-between">
								<div>
									<div className="text-xs text-[var(--text-secondary)]">
										Status
									</div>
									<div className="font-semibold flex items-center gap-2">
										{status === 'upcoming' ? (
											<span className="text-cyan-400">
												{status.toUpperCase()}
											</span>
										) : (
											<span className="text-[var(--text-secondary)]">
												{status}
											</span>
										)}
										{status === 'upcoming' && (
											<CheckCircle size={16} className="text-cyan-400" />
										)}
									</div>
								</div>
								<div>
									<div className="text-xs text-[var(--text-secondary)]">
										Price
									</div>
									<div className="font-medium">{ticketPrice}</div>
								</div>
							</div>

							<div className="mt-4 space-y-3">
								<InfoRow icon={Calendar} label="Date" value={dateLabel} />
								<InfoRow icon={Clock} label="Time" value={timeLabel} />
								<InfoRow icon={MapPin} label="Venue" value={venue} />
								{room && <InfoRow icon={Home} label="Room" value={room} />}
								<InfoRow icon={Users} label="Organizer" value={organizer} />
								{coOrganizers.length > 0 && (
									<InfoRow
										icon={Users}
										label="Co-organizers"
										value={coOrganizers.join(', ')}
									/>
								)}
								<InfoRow
									icon={Tag}
									label="Category"
									value={`${category}${subcategory ? ` · ${subcategory}` : ''}`}
								/>
							</div>
						</div>

						{/* Resources (if any) */}
						{resources.length > 0 && (
							<div className="glass-card p-3">
								<div className="text-xs text-[var(--text-secondary)]">
									Resources
								</div>
								<ul className="mt-2 list-inside list-disc text-sm space-y-1">
									{resources.map((r, i) => (
										<li key={i}>
											<a
												className="text-indigo-600 dark:text-indigo-400 underline"
												href={r.url}
												target="_blank"
												rel="noreferrer"
											>
												{r.title || r.url}
											</a>
										</li>
									))}
								</ul>
							</div>
						)}
					</aside>
				</header>

				{/* Main area: description, speakers, partners */}
				<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<main className="lg:col-span-2 space-y-6">
						{/* Description */}
						<div className="glass-card p-6">
							<h2
								className="text-lg font-semibold"
								style={{ color: 'var(--text-primary)' }}
							>
								About the event
							</h2>
							<p className="mt-3 text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
								{event.description || 'No description available.'}
							</p>
						</div>

						{/* Speakers */}
						{speakers.length > 0 && (
							<div className="glass-card p-6">
								<h3 className="text-lg font-semibold mb-4">Speakers</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{speakers.map((s, i) => (
										<div
											key={i}
											className="flex items-start gap-4 p-3 rounded-md border bg-white/5"
										>
											{s.photo?.url ? (
												<img
													src={s.photo.url}
													alt={s.name}
													className="w-14 h-14 rounded-md object-cover"
												/>
											) : (
												<div className="w-14 h-14 rounded-md bg-indigo-600 text-white flex items-center justify-center font-medium">
													{(s.name || 'S').slice(0, 2).toUpperCase()}
												</div>
											)}
											<div>
												<div className="font-semibold">{s.name}</div>
												{s.title && (
													<div className="text-xs muted">{s.title}</div>
												)}
												{s.bio && (
													<div className="mt-2 text-sm text-[var(--text-secondary)]">
														{s.bio}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Partners */}
						{partners.length > 0 && (
							<div className="glass-card p-6">
								<h3 className="text-lg font-semibold mb-4">Partners</h3>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
									{partners.map((p, i) => (
										<div
											key={i}
											className="flex flex-col items-center text-center gap-2 p-3 rounded-md border bg-white/5"
										>
											{p.logo?.url ? (
												<img
													src={p.logo.url}
													alt={p.name}
													className="max-h-16 object-contain"
												/>
											) : (
												<div className="h-12 w-full rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
													{(p.name || '—').slice(0, 22)}
												</div>
											)}
											<div className="font-medium mt-1">{p.name}</div>
											{p.tier && (
												<div className="text-xs mono muted">{p.tier}</div>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</main>

					{/* Right quick links / CTA placeholder to keep layout balanced */}
					<aside className="space-y-6">
						<div className="glass-card p-4">
							<div className="text-xs text-[var(--text-secondary)]">Quick links</div>
							<div className="mt-3 flex flex-col gap-2">
								{event.website && (
									<a
										href={event.website}
										target="_blank"
										rel="noreferrer"
										className="btn-ghost w-full text-center"
									>
										Event website
									</a>
								)}
								<Link to="/events" className="btn-ghost w-full text-center">
									All events
								</Link>
							</div>
						</div>
					</aside>
				</section>
			</div>
		</motion.main>
	);
};

export default EventDetailPage;
