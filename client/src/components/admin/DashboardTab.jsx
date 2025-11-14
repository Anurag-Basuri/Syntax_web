import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Users, Ticket, Activity } from 'lucide-react';
import StatsCard from './StatsCard.jsx';
import UpcomingEvents from './UpcomingEvents.jsx';
import RecentActivity from './RecentActivity.jsx';
import { apiClient } from '../../services/api.js';
import { useTheme } from '../../hooks/useTheme.js';

const DashboardTab = ({ events, eventsLoading, setActiveTab }) => {
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	const [stats, setStats] = useState({
		members: null,
		tickets: null,
		engagement: null,
	});
	const [statsLoading, setStatsLoading] = useState(true);
	const [statsError, setStatsError] = useState('');

	useEffect(() => {
		const fetchStats = async () => {
			setStatsLoading(true);
			setStatsError('');
			try {
				const res = await apiClient.get('/api/admin/dashboard-stats');
				setStats({
					members: res.data?.data?.members ?? null,
					tickets: res.data?.data?.tickets ?? null,
					engagement: res.data?.data?.engagement ?? null,
				});
			} catch (err) {
				setStatsError('Failed to load dashboard stats');
				setStats({
					members: null,
					tickets: null,
					engagement: null,
				});
			} finally {
				setStatsLoading(false);
			}
		};
		fetchStats();
	}, []);

	const panelClass = isDark
		? 'bg-gray-800/50 rounded-xl p-6 border border-gray-700'
		: 'bg-white shadow-sm rounded-xl p-6 border border-gray-200';

	return (
		<div className="space-y-8">
			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<StatsCard
					icon={<Users size={24} />}
					title="Total Members"
					value={statsLoading ? '...' : stats.members !== null ? stats.members : ''}
					change=""
					color="blue"
				/>
				<StatsCard
					icon={<Ticket size={24} />}
					title="Tickets Sold"
					value={statsLoading ? '...' : stats.tickets !== null ? stats.tickets : ''}
					change=""
					color="green"
				/>
				<StatsCard
					icon={<CalendarDays size={24} />}
					title="Upcoming Events"
					value={eventsLoading ? '...' : events?.length ?? ''}
					change=""
					color="purple"
				/>
				<StatsCard
					icon={<Activity size={24} />}
					title="Engagement Rate"
					value={
						statsLoading
							? '...'
							: stats.engagement !== null
							? `${stats.engagement}%`
							: ''
					}
					change=""
					color="orange"
				/>
			</div>

			{statsError && <div className="text-red-400 text-sm mt-2">{statsError}</div>}

			{/* Charts and Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className={`${panelClass}`}>
					<div className="flex justify-between items-center mb-6">
						<h3
							className={`${
								isDark ? 'text-white' : 'text-gray-900'
							} text-lg font-semibold`}
						>
							Activity Overview
						</h3>
						<div className="flex gap-2">
							<button
								className={`px-3 py-1 text-sm ${
									isDark ? 'bg-gray-700' : 'bg-gray-100'
								} rounded-lg`}
							>
								Week
							</button>
							<button
								className={`px-3 py-1 text-sm ${
									isDark ? 'bg-blue-700' : 'bg-blue-100'
								} rounded-lg`}
							>
								Month
							</button>
							<button
								className={`px-3 py-1 text-sm ${
									isDark ? 'bg-gray-700' : 'bg-gray-100'
								} rounded-lg`}
							>
								Year
							</button>
						</div>
					</div>

					<div className="h-64 flex items-end gap-2 pt-4">
						{/* Optionally, fetch chart data from backend and map here */}
						{[40, 60, 75, 50, 80, 65, 90].map((height, index) => (
							<motion.div
								key={index}
								className="flex-1 rounded-t-lg"
								style={{ background: isDark ? undefined : undefined }}
								initial={{ height: 0 }}
								animate={{ height: `${height}%` }}
								transition={{ duration: 0.8, delay: index * 0.1 }}
							/>
						))}
					</div>
				</div>

				<RecentActivity theme={theme} />
			</div>

			<UpcomingEvents
				events={events}
				eventsLoading={eventsLoading}
				setActiveTab={setActiveTab}
				theme={theme}
			/>
		</div>
	);
};

export default DashboardTab;
