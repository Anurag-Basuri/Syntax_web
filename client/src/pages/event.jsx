import { useMemo, useState } from 'react';
import { useEvents } from '../hooks/useEvents.js';
import EventCard from '../components/event/EventCard.jsx';
import EventFilter from '../components/event/EventFilter.jsx';

const pickDate = (e) => new Date(e?.eventDate || e?.date || Date.now());

const categorize = (events) => {
	const now = new Date();
	return events.reduce(
		(acc, ev) => {
			if (ev.status === 'cancelled') return acc;
			const dt = pickDate(ev);
			if (ev.status === 'ongoing' || dt.toDateString() === now.toDateString())
				acc.ongoing.push(ev);
			else if (dt > now) acc.upcoming.push(ev);
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
	const [page, setPage] = useState(1);
	const limit = 9;

	const { data, isLoading, isError, error, refetch, isFetching } = useEvents({
		page,
		limit,
		sortBy: 'eventDate',
		sortOrder: 'desc',
		// send search/filter to server if desired:
		// search,
		// period: filter === 'all' ? undefined : filter
	});

	const events = data?.docs || [];
	const {
		totalDocs = events.length,
		totalPages = 1,
		hasPrevPage = page > 1,
		hasNextPage = page < (data?.totalPages || 1),
	} = data || {};

	const categorized = useMemo(() => categorize(events), [events]);

	const filtered = useMemo(() => {
		const applySearch = (list) =>
			!search
				? list
				: list.filter((e) =>
						[
							e.title,
							e.description,
							e.venue,
							...(e.tags || []),
							pickDate(e).toLocaleDateString(),
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
	}, [categorized, filter, search]);

	const empty = Object.values(filtered).reduce((sum, list) => sum + list.length, 0) === 0;

	if (isError)
		return <ErrorBlock message={error?.message || 'Unknown error'} onRetry={refetch} />;

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
						{isFetching
							? 'Loading…'
							: `Showing ${events.length} of ${totalDocs} events`}
					</p>
				</div>

				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<EventFilter activeFilter={filter} setActiveFilter={setFilter} />
					<div className="relative w-full md:w-72">
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search events..."
							className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
						/>
						{search && (
							<button
								type="button"
								aria-label="Clear search"
								onClick={() => setSearch('')}
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
				<EmptyCreative searchActive={!!search} />
			) : (
				Object.entries(filtered).map(([category, list]) =>
					list.length ? (
						<section key={category} className="mb-10">
							<h2 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
								{category === 'ongoing'
									? '🔴 Live'
									: category === 'upcoming'
									? '🚀 Upcoming'
									: '📚 Past'}
								<span className="text-xs font-medium text-gray-500 dark:text-gray-400">
									({list.length})
								</span>
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
								{list.map((ev) => (
									<EventCard key={ev._id} event={ev} />
								))}
							</div>
						</section>
					) : null
				)
			)}

			{/* Simple pager (transparent, dark-mode friendly) */}
			<Pager
				page={page}
				totalPages={totalPages}
				onPrev={() => setPage((p) => Math.max(1, p - 1))}
				onNext={() => setPage((p) => (hasNextPage ? p + 1 : p))}
				disabledPrev={!hasPrevPage}
				disabledNext={!hasNextPage}
			/>
		</div>
	);
};

export default EventPage;
