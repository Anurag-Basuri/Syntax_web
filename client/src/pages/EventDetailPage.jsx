import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin, Globe, CreditCard } from 'lucide-react';
import { getEventById } from '../services/eventServices.js';
import LoadingBlock from '../components/Arvantis/LoadingBlock.jsx';
import '../arvantis.css';

/**
 * EventDetailPage
 * - Fetches full event (public) by id
 * - Renders same content as previous modal but as a dedicated page
 * - Back button navigates back
 */
const prettyDate = (d) => {
	if (!d) return 'TBD';
	const dt = new Date(d);
	if (isNaN(dt.getTime())) return String(d);
	return dt.toLocaleString();
};

const PricePill = ({ price }) => {
	const isFree = typeof price === 'number' ? price === 0 : !price;
	const formatted =
		typeof price === 'number'
			? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(price)
			: null;
	return (
		<div
			className={`inline-flex items-baseline gap-2 px-4 py-2 rounded-full font-semibold ${
				isFree
					? 'bg-emerald-50 text-emerald-700'
					: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
			}`}
		>
			{isFree ? (
				<span className="text-sm">Free</span>
			) : (
				<>
					<CreditCard size={16} />
					<span className="text-sm opacity-80">₹</span>
					<span className="text-lg tracking-wider">{formatted}</span>
				</>
			)}
		</div>
	);
};

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

	useEffect(() => {
		if (!id) navigate(-1);
	}, [id, navigate]);

	if (isLoading) return <LoadingBlock label="Loading event..." />;
	if (isError)
		return <div className="p-8">Error loading event: {error?.message || 'Unknown'}</div>;

	const event = payload || {};
	const poster = event.posters?.[0]?.url || event.posters?.[0]?.secure_url || null;
	const title = event.title || 'Untitled Event';
	const dateLabel = event.eventDate ? prettyDate(event.eventDate) : 'TBD';
	const venue = event.venue || 'Venue TBD';
	const tags = Array.isArray(event.tags) ? event.tags : event.tags ? [event.tags] : [];
	const speakers = Array.isArray(event.speakers) ? event.speakers : [];
	const partners = Array.isArray(event.partners) ? event.partners : [];
	const resources = Array.isArray(event.resources) ? event.resources : [];
	const coOrganizers = Array.isArray(event.coOrganizers) ? event.coOrganizers : [];
	const desc = event.description || event.summary || 'No description available.';
	const registrationInfo = event.registrationInfo || event.registration || {};
	const price =
		typeof event.ticketPrice === 'number' ? event.ticketPrice : event.ticketPrice ?? null;

	return (
		<motion.main
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="min-h-screen py-8 bg-transparent"
		>
			<div className="max-w-5xl mx-auto px-4">
				<button
					onClick={() => navigate(-1)}
					className="inline-flex items-center gap-2 mb-4 btn-ghost"
				>
					&lt; Back
				</button>

				<div className="rounded-2xl overflow-hidden shadow-lg">
					{/* Poster */}
					<div className="w-full h-64 md:h-96 bg-slate-100 dark:bg-slate-800">
						{poster ? (
							<img
								src={poster}
								alt={`${title} poster`}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
								<div className="text-6xl text-white/90">🎭</div>
							</div>
						)}
					</div>

					{/* Content */}
					<div className="p-6 md:p-8 bg-white dark:bg-slate-900">
						<h1 className="text-2xl md:text-4xl font-extrabold mb-3 text-slate-900 dark:text-white">
							{title}
						</h1>

						<div className="flex items-center gap-4 mb-4 text-sm text-slate-600 dark:text-slate-300">
							<div className="flex items-center gap-2">
								<Calendar size={16} className="text-indigo-500" />
								{dateLabel}
							</div>
							<div className="flex items-center gap-2">
								<MapPin size={16} className="text-indigo-500" />
								{venue}
							</div>
							<div className="ml-auto">
								<PricePill price={price} />
							</div>
						</div>

						{/* Tags */}
						<div className="flex flex-wrap gap-2 mb-6">
							{tags.slice(0, 8).map((t) => (
								<span
									key={t}
									className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm"
								>
									{t}
								</span>
							))}
						</div>

						<section className="mb-6">
							<h2 className="text-lg font-semibold mb-2">About</h2>
							<p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
								{desc}
							</p>
						</section>

						{/* Speakers */}
						{speakers.length > 0 && (
							<section className="mb-6">
								<h3 className="text-lg font-semibold mb-3">Speakers</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{speakers.map((s, i) => (
										<div
											key={i}
											className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
										>
											{s.photo?.url ? (
												<img
													src={s.photo.url}
													alt={s.name}
													className="w-12 h-12 rounded-md object-cover"
												/>
											) : (
												<div className="w-12 h-12 rounded-md bg-indigo-600 text-white flex items-center justify-center font-medium">
													{(s.name || 'S').slice(0, 2).toUpperCase()}
												</div>
											)}
											<div>
												<div className="font-medium text-slate-900 dark:text-white">
													{s.name}
												</div>
												<div className="text-xs text-slate-500 dark:text-slate-300">
													{s.title}
												</div>
												{s.bio && (
													<div className="text-xs mt-1 text-slate-600 dark:text-slate-300">
														{s.bio}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</section>
						)}

						{/* Partners */}
						{partners.length > 0 && (
							<section className="mb-6">
								<h3 className="text-lg font-semibold mb-3">Partners</h3>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
									{partners.map((p, i) => (
										<a
											key={i}
											href={p.website || '#'}
											target="_blank"
											rel="noreferrer"
											className="flex items-center justify-center p-4 rounded-lg bg-white border"
										>
											{p.logo?.url ? (
												<img
													src={p.logo.url}
													alt={p.name}
													className="max-h-16 object-contain"
												/>
											) : (
												<div className="h-12 w-full rounded bg-slate-100 flex items-center justify-center">
													{(p.name || '—').slice(0, 22)}
												</div>
											)}
										</a>
									))}
								</div>
							</section>
						)}

						{/* Resources & Co-organizers */}
						{(coOrganizers.length > 0 || resources.length > 0) && (
							<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
								{coOrganizers.length > 0 && (
									<div className="rounded-md p-3 bg-slate-50 dark:bg-slate-800 border">
										<div className="text-xs text-slate-500">Co-organizers</div>
										<ul className="mt-2 list-disc list-inside text-sm">
											{coOrganizers.map((c, i) => (
												<li key={i}>{c}</li>
											))}
										</ul>
									</div>
								)}
								{resources.length > 0 && (
									<div className="rounded-md p-3 bg-slate-50 dark:bg-slate-800 border">
										<div className="text-xs text-slate-500">Resources</div>
										<ul className="mt-2 space-y-2 text-sm">
											{resources.map((r, i) => (
												<li key={i}>
													<a
														href={r.url}
														target="_blank"
														rel="noreferrer"
														className="text-indigo-600 dark:text-indigo-400 underline"
													>
														{r.title || r.url}
													</a>
												</li>
											))}
										</ul>
									</div>
								)}
							</section>
						)}

						{/* Footer actions */}
						<div className="flex items-center gap-2 justify-end">
							<button
								onClick={() =>
									navigator.clipboard?.writeText(JSON.stringify(event, null, 2))
								}
								className="px-3 py-1 rounded-md border"
							>
								Copy JSON
							</button>
							<Link to="/events" className="px-3 py-1 rounded-md border">
								All events
							</Link>
						</div>
					</div>
				</div>
			</div>
		</motion.main>
	);
};

export default EventDetailPage;
