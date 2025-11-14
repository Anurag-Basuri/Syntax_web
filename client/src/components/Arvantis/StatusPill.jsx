export const StatusPill = ({ status }) => {
	const map = {
		upcoming: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
		ongoing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
		completed: 'bg-slate-200 text-slate-800 dark:bg-slate-700/60 dark:text-slate-100',
		cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
		postponed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
	};
	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
				map[status] ||
				'bg-slate-200 text-slate-800 dark:bg-slate-700/60 dark:text-slate-100'
			}`}
		>
			{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Status'}
		</span>
	);
};
