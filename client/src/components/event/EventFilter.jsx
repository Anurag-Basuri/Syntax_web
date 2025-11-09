import React from 'react';

const FILTERS = [
	{ key: 'all', label: 'All', icon: '🎭' },
	{ key: 'upcoming', label: 'Upcoming', icon: '🚀' },
	{ key: 'ongoing', label: 'Live', icon: '🔴' },
	{ key: 'past', label: 'Past', icon: '📚' },
];

const EventFilter = ({ activeFilter, setActiveFilter }) => {
	return (
		<div className="flex flex-wrap gap-2">
			{FILTERS.map((f) => {
				const active = activeFilter === f.key;
				return (
					<button
						key={f.key}
						type="button"
						onClick={() => setActiveFilter(f.key)}
						className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition
                            ${
								active
									? 'bg-blue-600 text-white border-blue-600 shadow-sm'
									: 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
							}`}
						aria-pressed={active}
					>
						<span>{f.icon}</span>
						<span>{f.label}</span>
					</button>
				);
			})}
		</div>
	);
};

export default EventFilter;
