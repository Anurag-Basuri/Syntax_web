import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, Calendar, MapPin, Tag, Users, Globe, Copy, CreditCard, Sun, Moon } from 'lucide-react';
import { getEventById } from '../../services/eventServices.js';

/*
 EventDetailModal (refined)
 - Removed tickets / spots UI (no tickets, no spots-left shown)
 - Prominent price (shows "Free" when 0)
 - Better responsive behavior: modal stacks on small screens, right pane scrolls independently
 - Partners rendered as large logo tiles; no counts
 - Keeps "Show raw" + copy JSON
*/

const fetchEvent = async (id, signal) => {
	if (!id) return null;
	return getEventById(id, { signal });
};

const DetailRow = ({ icon: Icon, label, children }) => (
	<div className="flex items-start gap-3">
		<div className="p-1 rounded bg-white/10 dark:bg-white/6">
			<Icon className="text-indigo-400" />
		</div>
		<div>
			<div className="text-xs text-slate-400 dark:text-slate-300">{label}</div>
			<div className="font-medium text-slate-900 dark:text-white mt-0.5">{children}</div>
		</div>
	</div>
);

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
			className={`inline-flex items-baseline gap-2 px-4 py-2 rounded-xl font-semibold shadow-sm
        ${
			isFree
				? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
				: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
		}`}
			aria-hidden
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

const EventDetailModal = ({ event: initialEvent, isOpen, onClose }) => {
	const id = initialEvent?._id || initialEvent?.id;
	const [showRaw, setShowRaw] = useState(false);
	const rightPaneRef = useRef(null);
	const modalRootRef = useRef(null);

	// theme state persisted
	const [theme, setTheme] = useState(() => {
		try {
			return (
				localStorage.getItem('site-theme') ||
				(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light')
			);
		} catch {
			return 'light';
		}
	});

	useEffect(() => {
		// apply theme on mount/update
		if (theme === 'dark') document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');
		try {
			localStorage.setItem('site-theme', theme);
		} catch {}
	}, [theme]);

	const { data: event } = useQuery({
		queryKey: ['event-full', id],
		queryFn: ({ signal }) => fetchEvent(id, signal),
		enabled: !!isOpen && !!id,
		staleTime: 60_000,
		refetchOnWindowFocus: false,
	});

	// stable derived data
	const payload = event || initialEvent || {};
	const rawJson = useMemo(() => {
		try {
			return JSON.stringify(payload, null, 2);
		} catch {
			return String(payload);
		}
	}, [payload]);

	// lock background scroll while modal open
	useEffect(() => {
		if (!isOpen) return;
		const prev = {
			overflow: document.body.style.overflow,
			paddingRight: document.body.style.paddingRight,
		};
		// reserve scrollbar width to avoid layout jump
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		document.body.style.overflow = 'hidden';
		if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
		return () => {
			document.body.style.overflow = prev.overflow || '';
			document.body.style.paddingRight = prev.paddingRight || '';
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e) => {
			if (e.key === 'Escape') onClose?.();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!isOpen) setShowRaw(false);
	}, [isOpen]);

	if (!isOpen) return null;

	const poster = payload.posters?.[0]?.url || payload.posters?.[0]?.secure_url || null;
	const title = payload.title || 'Untitled Event';
	const dateLabel = payload.eventDate ? prettyDate(payload.eventDate) : 'TBD';
	const venue = payload.venue || 'Venue TBD';
	const organizer = payload.organizer || 'Syntax Organization';
	const tags = Array.isArray(payload.tags) ? payload.tags : payload.tags ? [payload.tags] : [];
	const speakers = Array.isArray(payload.speakers) ? payload.speakers : [];
	const partners = Array.isArray(payload.partners) ? payload.partners : [];
	const resources = Array.isArray(payload.resources) ? payload.resources : [];
	const coOrganizers = Array.isArray(payload.coOrganizers) ? payload.coOrganizers : [];
	const desc = payload.description || payload.summary || 'No description available.';
	const registrationInfo = payload.registrationInfo || payload.registration || {};
	const price =
		typeof payload.ticketPrice === 'number' ? payload.ticketPrice : payload.ticketPrice ?? null;

	const copyRaw = async () => {
		try {
			await navigator.clipboard.writeText(rawJson);
			window.dispatchEvent(
				new CustomEvent('toast', { detail: { message: 'Event JSON copied' } })
			);
		} catch {
			/* ignore */
		}
	};

	// Respect navbar height variable and keep modal below nav on all viewports
	const modalMaxHeight = 'calc(100vh - var(--navbar-height, 4.5rem) - 2rem)';

	// Forward wheel events to right pane so scrolling works reliably even when pointer is on left
	useEffect(() => {
		const root = modalRootRef.current;
		const right = rightPaneRef.current;
		if (!root || !right) return;

		const onWheel = (e) => {
			// prefer letting the right pane handle it if it can scroll in that direction
			const canScrollUp = right.scrollTop > 0;
			const canScrollDown = right.scrollTop + right.clientHeight < right.scrollHeight;
			if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
				right.scrollBy({ top: e.deltaY, behavior: 'auto' });
				e.preventDefault();
			}
		};

		root.addEventListener('wheel', onWheel, { passive: false });
		return () => root.removeEventListener('wheel', onWheel);
	}, [isOpen]);

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-start justify-center"
				style={{
					paddingTop: 'calc(var(--navbar-height, 4.5rem) + 0.75rem)',
					paddingBottom: '1rem',
				}}
			>
				{/* backdrop */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
					onClick={onClose}
				/>

				{/* modal */}
				<motion.div
					ref={modalRootRef}
					initial={{ y: 18, scale: 0.99, opacity: 0 }}
					animate={{ y: 0, scale: 1, opacity: 1 }}
					exit={{ y: 18, scale: 0.99, opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="relative z-10 w-full max-w-5xl sm:max-w-6xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 bg-white dark:bg-slate-900"
					role="dialog"
					aria-modal="true"
					aria-label={`Event details: ${title}`}
					style={{ maxHeight: modalMaxHeight }}
				>
					{/* left: hero poster + condensed meta */}
					<div className="col-span-1 bg-gradient-to-br from-indigo-700 to-purple-700 text-white flex flex-col">
						<div className="relative h-56 sm:h-72 lg:h-full w-full overflow-hidden flex-shrink-0">
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
									<div className="text-6xl text-white/90">🎭</div>
								</div>
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
						</div>

						<div className="p-5 md:p-6 text-sm bg-gradient-to-t from-black/40 flex-shrink-0">
							<div className="space-y-3">
								<DetailRow icon={Calendar} label="When">
									{dateLabel}
								</DetailRow>
								<DetailRow icon={MapPin} label="Where">
									{venue}
									{payload.room ? ` • ${payload.room}` : ''}
								</DetailRow>
								<DetailRow icon={Users} label="Organizer">
									{organizer}
								</DetailRow>
							</div>

							{/* subtle meta - tickets/spots intentionally omitted */}
							<div className="mt-5 grid grid-cols-2 gap-3 text-xs text-white/80">
								<div>
									<div className="text-[10px] text-white/70">Category</div>
									<div className="font-medium">{payload.category || '—'}</div>
								</div>
								<div>
									<div className="text-[10px] text-white/70">Status</div>
									<div className="font-medium">{payload.status || '—'}</div>
								</div>
								<div className="col-span-2 mt-2">
									<div className="text-[10px] text-white/70">Registration</div>
									<div className="font-medium">
										{registrationInfo?.message || '—'}
									</div>
								</div>
								<div className="col-span-2 mt-2">
									<div className="text-[10px] text-white/70">Price</div>
									<div className="font-medium">
										{typeof price === 'number'
											? price === 0
												? 'Free'
												: `₹${new Intl.NumberFormat().format(price)}`
											: '—'}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* right: full details (scrollable) */}
					<div
						ref={rightPaneRef}
						className="col-span-2 p-6 overflow-y-auto"
						style={{
							maxHeight: modalMaxHeight,
							// enable smooth native scrolling on touch devices
							WebkitOverflowScrolling: 'touch',
							touchAction: 'auto',
						}}
					>
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
							<div className="min-w-0">
								<h2 className="text-2xl font-extrabold leading-tight text-slate-900 dark:text-white">
									{title}
								</h2>

								{/* tags + price row: stack on small screens */}
								<div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
									<div className="flex flex-wrap gap-2">
										{tags.slice(0, 8).map((t) => (
											<span
												key={t}
												className="flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
											>
												<Tag className="w-3 h-3" /> {t}
											</span>
										))}
									</div>

									{/* price aligned right on wide screens, below tags on small */}
									<div className="sm:ml-auto mt-2 sm:mt-0">
										<PricePill price={price} />
									</div>
								</div>
							</div>

							<div className="flex items-center gap-2">
								{/* theme toggle */}
								<button
									onClick={() =>
										setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
									}
									title="Toggle theme"
									className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
									aria-label="Toggle theme"
								>
									{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
								</button>

								<button
									onClick={copyRaw}
									title="Copy full JSON"
									className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
								>
									<Copy size={18} />
								</button>
								<button
									onClick={() => setShowRaw((s) => !s)}
									className="px-3 py-1 rounded-md border text-sm bg-transparent"
								>
									{showRaw ? 'Hide raw' : 'Show raw'}
								</button>
								<button
									onClick={onClose}
									className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
									aria-label="Close event details"
								>
									<X size={20} />
								</button>
							</div>
						</div>

						{/* registration card */}
						<div className="mt-5">
							<div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
								<div className="text-xs text-slate-500 dark:text-slate-300">
									Registration
								</div>
								<div className="mt-2 flex items-center gap-3">
									<div className="font-medium text-slate-900 dark:text-white">
										{registrationInfo?.actionLabel ||
											registrationInfo?.actionUrl ||
											'No registration'}
									</div>

									{registrationInfo?.isOpen && registrationInfo?.actionUrl && (
										<a
											href={registrationInfo.actionUrl}
											target="_blank"
											rel="noreferrer"
											className="ml-auto inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm shadow-sm"
										>
											{registrationInfo.actionLabel || 'Register'}{' '}
											<Globe size={14} />
										</a>
									)}
								</div>
								{registrationInfo?.message && (
									<div className="mt-2 text-xs text-slate-500 dark:text-slate-300">
										{registrationInfo.message}
									</div>
								)}
							</div>
						</div>

						{/* description */}
						<div className="mt-6">
							<h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
								About
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
								{desc}
							</p>
						</div>

						{/* speakers */}
						{speakers.length > 0 && (
							<div className="mt-6">
								<h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
									Speakers
								</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{speakers.map((s, idx) => (
										<div
											key={idx}
											className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
										>
											{s.photo?.url ? (
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
												<div className="font-medium text-slate-900 dark:text-white">
													{s.name}
												</div>
												<div className="text-xs text-slate-500 dark:text-slate-300">
													{s.title}
												</div>
												{s.bio && (
													<div className="text-xs mt-1 text-slate-600 dark:text-slate-300 line-clamp-3">
														{s.bio}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* partners: prominent tiles */}
						{partners.length > 0 && (
							<div className="mt-6">
								<h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
									Partners
								</h3>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
									{partners.map((p, i) => (
										<a
											key={i}
											href={p.website || '#'}
											target="_blank"
											rel="noreferrer"
											className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:scale-105 transition-transform"
										>
											{p.logo?.url ? (
												<img
													src={p.logo.url}
													alt={p.name}
													className="w-full h-12 object-contain max-w-[140px]"
												/>
											) : (
												<div className="w-full h-12 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-700 dark:text-slate-200 font-medium">
													{(p.name || '—').slice(0, 12)}
												</div>
											)}
											<div className="text-sm text-slate-700 dark:text-slate-200 text-center">
												{p.name}
											</div>
										</a>
									))}
								</div>
							</div>
						)}

						{/* co-organizers & resources */}
						{(coOrganizers.length > 0 || resources.length > 0) && (
							<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
								{coOrganizers.length > 0 && (
									<div className="rounded-md p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
										<div className="text-xs text-slate-500 dark:text-slate-300">
											Co-organizers
										</div>
										<ul className="mt-2 list-disc list-inside text-sm text-slate-700 dark:text-slate-200">
											{coOrganizers.map((c, i) => (
												<li key={i}>{c}</li>
											))}
										</ul>
									</div>
								)}

								{resources.length > 0 && (
									<div className="rounded-md p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
										<div className="text-xs text-slate-500 dark:text-slate-300">
											Resources
										</div>
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
							</div>
						)}

						{/* raw JSON */}
						{showRaw && (
							<div className="mt-6">
								<h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
									Raw event JSON
								</h3>
								<pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto max-h-60 text-slate-800 dark:text-slate-200">
									{rawJson}
								</pre>
							</div>
						)}
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

export default React.memo(EventDetailModal);
