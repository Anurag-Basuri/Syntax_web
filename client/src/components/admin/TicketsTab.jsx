import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
	Ticket,
	Download,
	Search,
	ChevronDown,
	Trash2,
	CheckCircle,
	XCircle,
	ArrowUpDown,
	Filter,
	Mail,
	Phone,
	Home,
	Users,
	Calendar,
	Loader2,
	AlertCircle,
	RefreshCw,
	Grid,
	List,
	X,
} from 'lucide-react';
import { useGetTicketsByEvent, useUpdateTicket, useDeleteTicket } from '../../hooks/useTickets';
import TicketStats from './TicketStats';

const formatDate = (dateString) => {
	if (!dateString) return 'N/A';
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return 'N/A';
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const StatusBadge = ({ status }) => {
	const s = (status || '').toLowerCase();
	const map = {
		used: { bg: 'bg-green-900/30', text: 'text-green-300', label: 'Used' },
		cancelled: { bg: 'bg-red-900/30', text: 'text-red-300', label: 'Cancelled' },
		active: { bg: 'bg-blue-900/20', text: 'text-blue-200', label: 'Active' },
	};
	const cfg = map[s] || { bg: 'bg-gray-700', text: 'text-gray-300', label: status || 'N/A' };
	return (
		<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
			{cfg.label}
		</span>
	);
};

const MobileFilterMenu = React.memo(
	({
		isOpen,
		onClose,
		events = [],
		selectedEventId,
		setSelectedEventId,
		sortBy,
		setSortBy,
		handleExportTickets,
		exportLoading,
	}) => {
		if (!isOpen) return null;

		return (
			<div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose}>
				<div
					className="absolute right-0 top-0 bottom-0 w-72 bg-gray-800 p-4 shadow-xl"
					onClick={(e) => e.stopPropagation()}
					role="dialog"
					aria-modal="true"
				>
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-lg font-semibold text-white">Filters</h3>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-white"
							aria-label="Close filters"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
					<div className="space-y-4">
						<div>
							<label className="block text-sm text-gray-400 mb-2">Event</label>
							<select
								className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
								value={selectedEventId}
								onChange={(e) => setSelectedEventId(e.target.value)}
							>
								<option value="">All events</option>
								{(events || []).map((event) => (
									<option key={event._id} value={event._id}>
										{event.title}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm text-gray-400 mb-2">Sort By</label>
							<select
								className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
							>
								<option value="newest">Newest First</option>
								<option value="oldest">Oldest First</option>
							</select>
						</div>
						<button
							onClick={handleExportTickets}
							disabled={exportLoading || !selectedEventId}
							className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
								exportLoading || !selectedEventId
									? 'bg-gray-600 cursor-not-allowed'
									: 'bg-cyan-700/80 hover:bg-cyan-600'
							} transition text-white mt-4`}
						>
							{exportLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Download className="h-5 w-5" />
							)}
							{exportLoading ? 'Exporting...' : 'Export CSV'}
						</button>
					</div>
				</div>
			</div>
		);
	}
);

const TicketRow = React.memo(
	({ ticket, onToggleIsUsed, onDeleteTicket, updateLoading, deleteLoading }) => {
		const status =
			ticket.status || (ticket.isUsed ? 'used' : ticket.isCancelled ? 'cancelled' : 'active');

		return (
			<tr className="hover:bg-gray-750/50 transition">
				<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
					{ticket.lpuId || '—'}
				</td>
				<td className="px-4 py-3 max-w-[180px] truncate text-sm font-medium text-white">
					{ticket.fullName || '—'}
				</td>
				<td className="px-4 py-3 text-sm text-gray-300 max-w-[220px] truncate">
					{ticket.email || '—'}
				</td>
				<td className="px-4 py-3 text-sm text-gray-300">{ticket.phone || '—'}</td>
				<td className="px-4 py-3 text-sm text-gray-300">{ticket.hostel || '—'}</td>
				<td className="px-4 py-3 text-sm text-gray-300">{ticket.club || '—'}</td>
				<td className="px-4 py-3 text-sm">
					<StatusBadge status={status} />
				</td>
				<td className="px-4 py-3 text-sm text-gray-400">
					{ticket.createdAt ? formatDate(ticket.createdAt) : '—'}
				</td>
				<td className="px-4 py-3 whitespace-nowrap text-sm font-medium flex items-center gap-3">
					<button
						onClick={() => onToggleIsUsed(ticket._id, status === 'used')}
						disabled={updateLoading}
						className={`flex items-center gap-2 ${
							updateLoading ? 'opacity-60 cursor-not-allowed' : 'hover:underline'
						}`}
						title={status === 'used' ? 'Mark as Not Used' : 'Mark as Used'}
					>
						{status === 'used' ? (
							<XCircle className="h-4 w-4 text-yellow-400" />
						) : (
							<CheckCircle className="h-4 w-4 text-green-400" />
						)}
						<span className="hidden lg:inline text-sm">
							{status === 'used' ? 'Mark Not Used' : 'Mark Used'}
						</span>
					</button>

					<button
						onClick={() => onDeleteTicket(ticket._id)}
						disabled={deleteLoading}
						className={`flex items-center gap-2 ${
							deleteLoading
								? 'opacity-60 cursor-not-allowed'
								: 'hover:underline text-red-500'
						}`}
						title="Delete Ticket"
					>
						<Trash2 className="h-4 w-4" />
						<span className="hidden lg:inline text-sm">Delete</span>
					</button>
				</td>
			</tr>
		);
	}
);

const TicketCard = React.memo(
	({ ticket, onToggleIsUsed, onDeleteTicket, updateLoading, deleteLoading }) => {
		const status =
			ticket.status || (ticket.isUsed ? 'used' : ticket.isCancelled ? 'cancelled' : 'active');

		return (
			<div className="md:hidden bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-sm">
				<div className="flex justify-between items-start">
					<div className="min-w-0">
						<div className="flex items-center gap-3">
							<div className="bg-blue-900/20 p-2 rounded">
								<Ticket className="h-4 w-4 text-blue-400" />
							</div>
							<div className="min-w-0">
								<div className="text-sm text-gray-300">{ticket.lpuId || '—'}</div>
								<h3 className="text-base font-semibold text-white truncate">
									{ticket.fullName || '—'}
								</h3>
							</div>
						</div>
					</div>

					<div>
						<StatusBadge status={status} />
					</div>
				</div>

				<div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-300">
					<div className="flex items-center gap-2">
						<Mail className="h-4 w-4 text-gray-400" />
						<span className="truncate">{ticket.email || '—'}</span>
					</div>
					<div className="flex items-center gap-2">
						<Phone className="h-4 w-4 text-gray-400" />
						<span>{ticket.phone || '—'}</span>
					</div>
					<div className="flex items-center gap-2">
						<Home className="h-4 w-4 text-gray-400" />
						<span>{ticket.hostel || '—'}</span>
					</div>
					<div className="flex items-center gap-2">
						<Users className="h-4 w-4 text-gray-400" />
						<span>{ticket.club || '—'}</span>
					</div>
				</div>

				<div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
					<button
						onClick={() => onToggleIsUsed(ticket._id, status === 'used')}
						disabled={updateLoading}
						className={`flex items-center gap-2 text-sm ${
							updateLoading
								? 'opacity-60 cursor-not-allowed'
								: 'text-blue-400 hover:underline'
						}`}
					>
						{status === 'used' ? (
							<XCircle className="h-4 w-4" />
						) : (
							<CheckCircle className="h-4 w-4" />
						)}
						{status === 'used' ? 'Mark Not Used' : 'Mark Used'}
					</button>
					<button
						onClick={() => onDeleteTicket(ticket._id)}
						disabled={deleteLoading}
						className={`flex items-center gap-2 text-sm ${
							deleteLoading
								? 'opacity-60 cursor-not-allowed'
								: 'text-red-400 hover:underline'
						}`}
					>
						<Trash2 className="h-4 w-4" />
						Delete
					</button>
				</div>
			</div>
		);
	}
);

const TicketsTab = ({ token, events = [], setDashboardError }) => {
	const [selectedEventId, setSelectedEventId] = useState('');
	const [sortBy, setSortBy] = useState('newest');
	const [searchTerm, setSearchTerm] = useState('');
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [compactView, setCompactView] = useState(false);

	const {
		getTicketsByEvent,
		tickets,
		loading: ticketsLoading,
		error: ticketsError,
		reset: resetTicketsError,
	} = useGetTicketsByEvent();

	const {
		updateTicket,
		loading: updateLoading,
		error: updateError,
		reset: resetUpdateError,
	} = useUpdateTicket();

	const {
		deleteTicket,
		loading: deleteLoading,
		error: deleteError,
		reset: resetDeleteError,
	} = useDeleteTicket();

	// auto-select first event for convenience
	useEffect(() => {
		if (!selectedEventId && events?.length) {
			setSelectedEventId(events[0]._id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [events]);

	const ticketStats = useMemo(() => {
		const list = tickets || [];
		if (list.length === 0) return null;
		return {
			total: list.length,
			cancelled: list.filter((t) => t.status === 'cancelled' || t.isCancelled).length,
			used: list.filter((t) => t.status === 'used' || t.isUsed).length,
		};
	}, [tickets]);

	// fetch tickets when selectedEventId changes
	useEffect(() => {
		resetTicketsError();
		resetUpdateError();
		resetDeleteError();

		if (!selectedEventId) return;

		if (typeof getTicketsByEvent !== 'function') return;

		getTicketsByEvent(selectedEventId, token).catch((err) => {
			const msg = err?.message || 'Failed to load tickets';
			setDashboardError?.(msg);
		});
	}, [
		selectedEventId,
		token,
		getTicketsByEvent,
		resetTicketsError,
		resetUpdateError,
		resetDeleteError,
		setDashboardError,
	]);

	const handleDeleteTicket = useCallback(
		async (ticketId) => {
			if (!ticketId) return;
			if (!window.confirm('Are you sure you want to delete this ticket?')) return;
			try {
				await deleteTicket(ticketId, token);
				await getTicketsByEvent(selectedEventId, token);
			} catch (err) {
				const msg = err?.message || 'Ticket deletion failed';
				setDashboardError?.(msg);
			}
		},
		[deleteTicket, getTicketsByEvent, selectedEventId, token, setDashboardError]
	);

	const handleToggleIsUsed = useCallback(
		async (ticketId, currentlyUsed) => {
			if (!ticketId) return;
			try {
				// prefer backend status field; translate from boolean to 'used'/'active'
				const newStatus = currentlyUsed ? 'active' : 'used';
				await updateTicket(ticketId, { status: newStatus }, token);
				await getTicketsByEvent(selectedEventId, token);
			} catch (err) {
				const msg = err?.message || 'Ticket update failed';
				setDashboardError?.(msg);
			}
		},
		[updateTicket, getTicketsByEvent, selectedEventId, token, setDashboardError]
	);

	const [exportLoading, setExportLoading] = useState(false);
	const [exportError, setExportError] = useState('');
	const handleExportTickets = useCallback(async () => {
		setExportError('');
		setExportLoading(true);
		try {
			const list = tickets || [];
			if (list.length === 0) {
				setExportError('No tickets to export.');
				return;
			}

			const headers = [
				'Ticket ID',
				'Full Name',
				'Email',
				'Phone',
				'LPU ID',
				'Gender',
				'Hosteler',
				'Hostel',
				'Course',
				'Club',
				'Event ID',
				'Event Name',
				'Status',
				'QR Code URL',
				'QR Code Public ID',
				'Created At',
			];
			const rows = list.map((t) => [
				t.ticketId || t._id || '',
				t.fullName || '',
				t.email || '',
				t.phone || '',
				t.lpuId || '',
				t.gender || '',
				t.hosteler ? 'Yes' : 'No',
				t.hostel || '',
				t.course || '',
				t.club || '',
				(t.eventId && (typeof t.eventId === 'object' ? t.eventId._id : t.eventId)) || '',
				t.eventName || '',
				t.status || (t.isUsed ? 'used' : t.isCancelled ? 'cancelled' : 'active'),
				t.qrCode?.url || '',
				t.qrCode?.publicId || '',
				t.createdAt ? new Date(t.createdAt).toLocaleString() : '',
			]);

			const csvContent = [headers, ...rows]
				.map((row) =>
					row
						.map((cell) =>
							typeof cell === 'string' && cell.includes(',')
								? `"${cell.replace(/"/g, '""')}"`
								: cell
						)
						.join(',')
				)
				.join('\n');

			const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `tickets_${selectedEventId || 'all'}_${new Date()
				.toISOString()
				.slice(0, 10)}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			setExportError('Export failed');
		} finally {
			setExportLoading(false);
		}
	}, [tickets, selectedEventId]);

	const filteredTickets = useMemo(() => {
		const list = tickets || [];
		return list
			.filter((t) => {
				if (!searchTerm) return true;
				const term = searchTerm.toLowerCase();
				return (
					String(t.lpuId || '')
						.toLowerCase()
						.includes(term) ||
					(t.email || '').toLowerCase().includes(term) ||
					(t.fullName || '').toLowerCase().includes(term)
				);
			})
			.sort((a, b) => {
				if (sortBy === 'newest') {
					return new Date(b.createdAt) - new Date(a.createdAt);
				}
				return new Date(a.createdAt) - new Date(b.createdAt);
			});
	}, [tickets, sortBy, searchTerm]);

	const toggleSort = () => setSortBy((prev) => (prev === 'newest' ? 'oldest' : 'newest'));

	const clearAllErrors = () => {
		resetTicketsError();
		resetUpdateError();
		resetDeleteError();
		setExportError('');
	};

	const selectedEvent = (events || []).find((e) => e._id === selectedEventId);

	return (
		<div className="space-y-6">
			{/* header */}
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold text-white flex items-center gap-3">
						Tickets
						<span className="text-sm text-gray-400 font-medium">
							({tickets?.length ?? 0})
						</span>
					</h2>
					<p className="text-sm text-gray-400 mt-1">
						{selectedEvent ? (
							<>
								<span className="font-medium text-gray-200">
									{selectedEvent.title}
								</span>
								<span className="text-gray-500 ml-2">
									— {ticketStats?.total ?? 0} tickets
								</span>
							</>
						) : (
							'Select an event to view tickets'
						)}
					</p>
				</div>

				<div className="flex gap-2 w-full md:w-auto items-center">
					{/* Event select (desktop) */}
					<div className="hidden md:block">
						<select
							className="appearance-none bg-gray-700/50 border border-gray-600 rounded-lg pl-4 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={selectedEventId}
							onChange={(e) => setSelectedEventId(e.target.value)}
						>
							<option value="">Select event</option>
							{(events || []).map((event) => (
								<option key={event._id} value={event._id}>
									{event.title}
								</option>
							))}
						</select>
					</div>

					<div className="relative w-full md:w-72">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search LPU ID, name or email"
							className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							aria-label="Search tickets"
						/>
					</div>

					<button
						className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/40 border border-gray-600 text-white hover:bg-gray-700"
						onClick={() => {
							resetTicketsError();
							if (selectedEventId)
								getTicketsByEvent(selectedEventId, token).catch(() => {});
						}}
						title="Refresh"
					>
						<RefreshCw className="h-4 w-4" />
					</button>

					<button
						onClick={() => setIsMobileMenuOpen(true)}
						className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/40 border border-gray-600 text-white"
						aria-label="Open filters"
					>
						<Filter className="h-4 w-4" />
					</button>

					<button
						onClick={() => setCompactView((v) => !v)}
						className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/40 border border-gray-600 text-white"
						title="Toggle compact view"
					>
						{compactView ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
					</button>

					<button
						onClick={handleExportTickets}
						disabled={exportLoading || !selectedEventId || (tickets || []).length === 0}
						className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
							exportLoading || !selectedEventId || (tickets || []).length === 0
								? 'bg-gray-600 cursor-not-allowed'
								: 'bg-cyan-700/80 hover:bg-cyan-600'
						} transition text-white`}
						title="Export CSV"
					>
						{exportLoading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Download className="h-5 w-5" />
						)}
						<span className="hidden sm:inline">
							{exportLoading ? 'Exporting' : 'Export'}
						</span>
					</button>
				</div>
			</div>

			{/* errors */}
			{(ticketsError || updateError || deleteError || exportError) && (
				<div className="bg-red-700/10 border border-red-500 text-red-300 px-4 py-3 rounded flex items-center justify-between">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-5 w-5" />
						<span className="text-sm">
							{ticketsError || updateError || deleteError || exportError}
						</span>
					</div>
					<button
						className="text-sm text-red-200 hover:underline"
						onClick={clearAllErrors}
					>
						Dismiss
					</button>
				</div>
			)}

			{/* stats */}
			{selectedEventId && ticketStats && (
				<TicketStats stats={ticketStats} tickets={filteredTickets} />
			)}

			{/* content */}
			{ticketsLoading ? (
				<div className="flex justify-center py-12">
					<div className="flex flex-col items-center">
						<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
						<p className="mt-2 text-gray-400">Loading tickets...</p>
					</div>
				</div>
			) : !selectedEventId ? (
				<div className="text-center py-12 bg-gray-700/30 rounded-xl border border-gray-600">
					<Ticket className="h-12 w-12 mx-auto text-gray-500" />
					<h3 className="text-xl font-bold text-gray-400 mt-4">Select an Event</h3>
					<p className="text-gray-500 mt-2">
						Choose an event from the dropdown to view its tickets
					</p>
				</div>
			) : filteredTickets.length === 0 ? (
				<div className="text-center py-12 bg-gray-700/30 rounded-xl border border-gray-600">
					<Ticket className="h-12 w-12 mx-auto text-gray-500" />
					<h3 className="text-xl font-bold text-gray-400 mt-4">
						{searchTerm ? 'No matching tickets' : 'No tickets yet'}
					</h3>
					<p className="text-gray-500 mt-2">
						{searchTerm ? 'Try a different search' : 'This event has no tickets'}
					</p>
				</div>
			) : compactView ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredTickets.map((ticket) => (
						<TicketCard
							key={ticket._id}
							ticket={ticket}
							onToggleIsUsed={handleToggleIsUsed}
							onDeleteTicket={handleDeleteTicket}
							updateLoading={updateLoading}
							deleteLoading={deleteLoading}
						/>
					))}
				</div>
			) : (
				<>
					<div className="hidden md:block rounded-lg border border-gray-700 bg-gray-900/80 mt-4 overflow-x-auto">
						<table className="w-full divide-y divide-gray-700 min-w-[1000px]">
							<thead className="bg-gray-750 sticky top-0 z-10">
								<tr>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										LPU ID
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Name
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Email
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Phone
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Hostel
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Club
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Status
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Created
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-gray-800 divide-y divide-gray-700">
								{filteredTickets.map((ticket) => (
									<TicketRow
										key={ticket._id}
										ticket={ticket}
										onToggleIsUsed={handleToggleIsUsed}
										onDeleteTicket={handleDeleteTicket}
										updateLoading={updateLoading}
										deleteLoading={deleteLoading}
									/>
								))}
							</tbody>
						</table>
					</div>

					<div className="md:hidden space-y-3">
						{filteredTickets.map((ticket) => (
							<TicketCard
								key={ticket._id}
								ticket={ticket}
								onToggleIsUsed={handleToggleIsUsed}
								onDeleteTicket={handleDeleteTicket}
								updateLoading={updateLoading}
								deleteLoading={deleteLoading}
							/>
						))}
					</div>
				</>
			)}

			<MobileFilterMenu
				isOpen={isMobileMenuOpen}
				onClose={() => setIsMobileMenuOpen(false)}
				events={events || []}
				selectedEventId={selectedEventId}
				setSelectedEventId={setSelectedEventId}
				sortBy={sortBy}
				setSortBy={setSortBy}
				handleExportTickets={handleExportTickets}
				exportLoading={exportLoading}
			/>
		</div>
	);
};

export default TicketsTab;
