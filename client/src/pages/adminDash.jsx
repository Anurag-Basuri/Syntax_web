import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	ShieldCheck,
	Ticket,
	LogOut,
	Users,
	CalendarDays,
	LayoutDashboard,
	Menu,
	X,
	Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useGetAllEvents } from '../hooks/useEvents.js';
import { useNavigate } from 'react-router-dom';
import DashboardTab from '../components/admin/DashboardTab.jsx';
import MembersTab from '../components/admin/MembersTab.jsx';
import EventsTab from '../components/admin/EventsTab.jsx';
import TicketsTab from '../components/admin/TicketsTab.jsx';
import CreateTicket from '../components/admin/CreateTicket.jsx';
import ErrorMessage from '../components/admin/ErrorMessage.jsx';
import ArvantisTab from '../components/admin/ArvantisTab.jsx';
import Modal from '../components/admin/Modal.jsx';

const TABS = [
	{
		key: 'dashboard',
		label: 'Dashboard',
		icon: <LayoutDashboard className="h-5 w-5" />,
	},
	{
		key: 'members',
		label: 'Members',
		icon: <Users className="h-5 w-5" />,
	},
	{
		key: 'events',
		label: 'Events',
		icon: <CalendarDays className="h-5 w-5" />,
	},
	{
		key: 'tickets',
		label: 'Tickets',
		icon: <Ticket className="h-5 w-5" />,
	},
	{
		key: 'arvantis',
		label: 'Arvantis',
		icon: <Sparkles className="h-5 w-5" />,
	},
];

const AdminDash = () => {
	// include isAuthenticated so we can guard the route properly
	const { user, loading: authLoading, logoutAdmin, token, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState('dashboard');
	const [dashboardError, setDashboardError] = useState('');
	const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Events
	const { getAllEvents, events, loading: eventsLoading, error: eventsError } = useGetAllEvents();

	// fetch events on mount (include getAllEvents in deps to satisfy hooks rules)
	useEffect(() => {
		const fetchData = async () => {
			try {
				await getAllEvents();
			} catch (err) {
				setDashboardError('Failed to load dashboard data');
			}
		};
		fetchData();
	}, [getAllEvents]);

	// Redirect unauthenticated users to admin auth page and block non-admin roles
	useEffect(() => {
		if (!authLoading) {
			// If not authenticated or user is not admin, redirect to admin login
			if (!isAuthenticated || (user && user.role && user.role !== 'admin')) {
				navigate('/admin/auth', { replace: true });
			}
		}
	}, [authLoading, isAuthenticated, user, navigate]);

	// surface event errors into dashboard error UI
	useEffect(() => {
		if (eventsError) {
			setDashboardError(eventsError?.message || 'Failed to load events');
		}
	}, [eventsError]);

	const handleLogout = async () => {
		try {
			await logoutAdmin();
			navigate('/admin/auth', { replace: true });
		} catch (error) {
			setDashboardError('Logout failed');
		}
	};

	if (authLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
				<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
				<span className="text-lg font-semibold text-blue-400 animate-pulse">
					Loading Dashboard...
				</span>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex">
			{/* Sidebar */}
			<aside
				className={`fixed z-30 inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300
                ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} md:translate-x-0 md:static md:block`}
			>
				<div className="flex items-center gap-3 px-6 py-6 border-b border-gray-800">
					<ShieldCheck className="h-8 w-8 text-blue-400" />
					<span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
						Admin
					</span>
				</div>
				<nav className="flex-1 py-4">
					{TABS.map((tab) => (
						<button
							key={tab.key}
							className={`w-full flex items-center gap-3 px-6 py-3 text-lg font-medium transition
                                ${
									activeTab === tab.key
										? 'bg-blue-900/30 text-blue-400'
										: 'text-gray-300 hover:bg-gray-800 hover:text-white'
								}`}
							onClick={() => {
								setActiveTab(tab.key);
								setSidebarOpen(false);
							}}
						>
							{tab.icon}
							{tab.label}
						</button>
					))}
				</nav>
				<div className="mt-auto px-6 py-4 border-t border-gray-800">
					<button
						onClick={handleLogout}
						className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700/80 text-white hover:bg-red-600 transition"
					>
						<LogOut className="h-5 w-5" />
						Logout
					</button>
				</div>
			</aside>

			{/* Overlay for mobile sidebar */}
			<div
				className={`fixed inset-0 z-20 bg-black/40 transition-opacity duration-300 md:hidden ${
					sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
				}`}
				onClick={() => setSidebarOpen(false)}
				aria-hidden={!sidebarOpen}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col min-h-screen">
				{/* Sticky Header */}
				<header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6 py-4">
					<div className="flex items-center gap-3">
						<button
							className="md:hidden text-gray-400 hover:text-white"
							onClick={() => setSidebarOpen((v) => !v)}
							aria-label="Open sidebar"
						>
							{sidebarOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
						</button>
						<span className="text-xl font-bold text-white hidden md:inline">
							{TABS.find((t) => t.key === activeTab)?.label || 'Dashboard'}
						</span>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-4 py-2">
							<span className="text-white font-medium">
								{user?.fullname || user?.name || 'Admin'}
							</span>
						</div>
						{activeTab === 'tickets' && (
							<button
								onClick={() => setShowCreateTicketModal(true)}
								className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700/80 text-white hover:bg-blue-600 transition"
							>
								<Ticket className="h-5 w-5" />
								Create Ticket
							</button>
						)}
					</div>
				</header>

				{/* Error Message */}
				{dashboardError && (
					<div className="px-6 pt-4">
						<ErrorMessage error={dashboardError} />
					</div>
				)}

				{/* Main Tab Content */}
				<main className="flex-1 p-4 md:p-8 bg-gradient-to-br from-gray-900/80 to-gray-800/80">
					<AnimatePresence mode="wait">
						{activeTab === 'dashboard' && (
							<motion.div
								key="dashboard"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={{ duration: 0.3 }}
							>
								<DashboardTab
									events={events}
									eventsLoading={eventsLoading}
									setActiveTab={setActiveTab}
								/>
							</motion.div>
						)}
						{activeTab === 'members' && (
							<motion.div
								key="members"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={{ duration: 0.3 }}
							>
								<MembersTab token={token} setDashboardError={setDashboardError} />
							</motion.div>
						)}
						{activeTab === 'events' && (
							<motion.div
								key="events"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={{ duration: 0.3 }}
							>
								<EventsTab
									events={events}
									eventsLoading={eventsLoading}
									eventsError={eventsError}
									token={token}
									setDashboardError={setDashboardError}
									getAllEvents={getAllEvents}
								/>
							</motion.div>
						)}
						{activeTab === 'tickets' && (
							<motion.div
								key="tickets"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={{ duration: 0.3 }}
							>
								<TicketsTab
									token={token}
									events={events}
									setDashboardError={setDashboardError}
								/>
							</motion.div>
						)}
						{activeTab === 'arvantis' && (
							<motion.div
								key="arvantis"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={{ duration: 0.3 }}
							>
								<ArvantisTab token={token} setDashboardError={setDashboardError} />
							</motion.div>
						)}
					</AnimatePresence>
				</main>
			</div>

			{/* Create Ticket Modal */}
			{showCreateTicketModal && (
				<Modal
					title="Create Ticket"
					onClose={() => setShowCreateTicketModal(false)}
					size="lg"
				>
					<CreateTicket
						token={token}
						events={events}
						onClose={() => setShowCreateTicketModal(false)}
					/>
				</Modal>
			)}
		</div>
	);
};

export default AdminDash;
