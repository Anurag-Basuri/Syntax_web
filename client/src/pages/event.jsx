import { useMemo, useState, useCallback, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents.js';
import EventCard from '../components/event/EventCard.jsx';
import EventFilter from '../components/event/EventFilter.jsx';

const pickDate = (e) => {
	const d = e?.eventDate || e?.date;
	if (!d) return null;
	const parsed = new Date(d);
	return isNaN(parsed.getTime()) ? null : parsed;
};

const categorize = (events) => {
	const now = new Date();
	return events.reduce(
		(acc, ev) => {
			if (ev.status === 'cancelled') return acc;
			const dt = pickDate(ev);
			if (ev.status === 'ongoing' || (dt && dt.toDateString() === now.toDateString()))
				acc.ongoing.push(ev);
			else if (dt && dt > now) acc.upcoming.push(ev);
			else acc.past.push(ev);
			return acc;
		},
		{ ongoing: [], upcoming: [], past: [] }
	);
};

const LoadingGrid = () => (
	<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
		{Array.from({ length: 6 }).map((_, i) => (
			<div
				key={i}
				className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4"
				aria-hidden
			>
				<div className="h-32 rounded-md bg-gray-200 dark:bg-gray-700" />
				<div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
				<div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
				<div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
			</div>
		))}
	</div>
);

const EmptyCreative = ({ searchActive }) => (
	<div className="flex flex-col items-center justify-center py-24 text-center">
		<div className="text-6xl mb-4 animate-pulse">🛰️</div>
		<h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
			{searchActive ? 'No matches found' : 'No events yet'}
		</h2>
		<p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
			{searchActive
				? 'Try different keywords or remove filters.'
				: 'Stay tuned. Fresh experiences are being prepared.'}
		</p>
		<div className="mt-6 text-xs text-gray-400 dark:text-gray-600">
			<pre>{`/* orbit idle – queue awaiting launch */`}</pre>
		</div>
	</div>
);

const ErrorBlock = ({ message, onRetry }) => (
	<div className="py-24 text-center">
		<div className="text-5xl mb-4">⚠️</div>
		<h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
			Failed to load events
		</h2>
		<p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
		<button
			onClick={onRetry}
			className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500"
		>
			Retry
		</button>
	</div>
);

const Pager = ({ page, totalPages, onPrev, onNext, disabledPrev, disabledNext }) => (
	<div className="flex items-center justify-center gap-2 mt-8">
		<button
			onClick={onPrev}
			disabled={disabledPrev}
			className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-transparent text-sm disabled:opacity-50"
		>
			Previous
		</button>
		<span className="text-sm text-gray-600 dark:text-gray-400">
			Page {page} of {Math.max(1, totalPages || 1)}
		</span>
		<button
			onClick={onNext}
			disabled={disabledNext}
			className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-transparent text-sm disabled:opacity-50"
		>
			Next
		</button>
	</div>
);

const EventPage = () => {
	const [filter, setFilter] = useState('all');
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const limit = 9;

	// Debounce the search input to avoid firing queries every keystroke
	useEffect(() => {
		const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
		return () => clearTimeout(id);
	}, [search]);

	// Use server-side search when debouncedSearch exists (reduces client-side compute)
	const queryParams = useMemo(() => {
		const p = {
			page,
			limit,
			sortBy: 'eventDate',
			sortOrder: 'desc',
		};
		if (debouncedSearch) p.search = debouncedSearch;
		// if user selected a period filter and it's not 'all', pass to server as well
		if (filter && filter !== 'all') p.period = filter;
		return p;
	}, [page, limit, debouncedSearch, filter]);

	const { data, isLoading, isError, error, refetch, isFetching } = useEvents(queryParams);

	const events = data?.docs || [];
	const {
		totalDocs = events.length,
		totalPages = 1,
	} = data || {};

	// Categorize the events returned from server
	const categorized = useMemo(() => categorize(events), [events]);

	// When we used server search (debouncedSearch is set), we trust the server and avoid extra client filtering
	const filtered = useMemo(() => {
		// apply client-side basic filtering only when server search is not active
		if (debouncedSearch) {
			// when server search used, server already filtered; present categorized as returned
			return categorized;
		}

		const applySearch = (list) =>
			!search
				? list
				: list.filter((e) =>
						[
							e.title,
							e.description,
							e.venue,
							...(e.tags || []),
							(pickDate(e) && pickDate(e).toISOString().slice(0, 10)) || '',
						]
							.filter(Boolean)
							.join(' ')
							.toLowerCase()
							.includes(search.toLowerCase())
				  );

		if (filter === 'all')
			return {
				ongoing: applySearch(categorized.ongoing),
				upcoming: applySearch(categorized.upcoming),
				past: applySearch(categorized.past),
			};
		return { [filter]: applySearch(categorized[filter]) };
	}, [categorized, filter, search, debouncedSearch]);

	const empty = Object.values(filtered).reduce((sum, list) => sum + list.length, 0) === 0;

	// Memoized pager callbacks to avoid function recreation on each render
	const onPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
	const onNext = useCallback(() => setPage((p) => Math.min(totalPages || 1, p + 1)), [totalPages]);

	if (isError) return <ErrorBlock message={error?.message || 'Unknown error'} onRetry={refetch} />;

	return (
		<div className="min-h-screen mx-auto max-w-7xl px-4 py-8 text-gray-900 dark:text-gray-100 bg-transparent">
			<header className="space-y-6 mb-8">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold tracking-tight">
						Events
						<span className="ml-2 text-base font-medium text-gray-500 dark:text-gray-400">
							/ discover & engage
						</span>
					</h1>
					<p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
						{isFetching ? 'Loading…' : `Showing ${events.length} of ${totalDocs} events`}
					</p>
				</div>

				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<EventFilter activeFilter={filter} setActiveFilter={(f) => { setFilter(f); setPage(1); }} />
					<div className="relative w-full md:w-72">
						<input
							type="text"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search events..."
							className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
							aria-label="Search events"
						/>
						{search && (
							<button
								type="button"
								aria-label="Clear search"
								onClick={() => {
									setSearch('');
									setDebouncedSearch('');
								}}
								className="absolute top-1/2 -translate-y-1/2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs"
							>
								✕
							</button>
						)}
					</div>
				</div>
			</header>

			{isLoading ? (
				<LoadingGrid />
			) : empty ? (
				<EmptyCreative searchActive={!!search || !!debouncedSearch} />
			) : (
				<>
					{/* Render categories in a deterministic order */}
					{['ongoing', 'upcoming', 'past'].map((category) => {
						const list = filtered[category] || [];
						if (!list.length) return null;
						return (
							<section key={category} className="mb-10">
								<h2 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
									{category === 'ongoing' ? '🔴 Live' : category === 'upcoming' ? '🚀 Upcoming' : '📚 Past'}
									<span className="text-xs font-medium text-gray-500 dark:text-gray-400">({list.length})</span>
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
									{list.map((ev) => (
										<EventCard key={ev._id || ev.id} event={ev} />
									))}
								</div>
							</section>
						);
					})}
				</>
			)}

			<Pager
				page={page}
				totalPages={totalPages}
				onPrev={onPrev}
				onNext={onNext}
				disabledPrev={page <= 1}
				disabledNext={page >= (totalPages || 1)}
			/>
		</div>
	);
};

export default EventPage;
