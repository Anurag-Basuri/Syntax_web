import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Plus, Search, ChevronDown, AlertCircle } from 'lucide-react';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../hooks/useEvents.js';
import LoadingSpinner from './LoadingSpinner.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import EventModal from './EventModal.jsx';
import EventCard from './EventCard.jsx';
import { useTheme } from '../../hooks/useTheme.js';

// helper: convert a Date/string into a value suitable for <input type="datetime-local">
const toDatetimeLocalInput = (value) => {
	if (!value) return '';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '';
	// adjust to local time and format YYYY-MM-DDTHH:mm
	const tzOffsetMs = d.getTimezoneOffset() * 60000;
	const local = new Date(d.getTime() - tzOffsetMs);
	return local.toISOString().slice(0, 16);
};

// NEW helper: convert a datetime-local input value (YYYY-MM-DDTHH:mm or with seconds) into an ISO string
const datetimeLocalToISO = (localValue) => {
	if (!localValue) return '';
	// localValue may be "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
	const [datePart, timePart = '00:00:00'] = localValue.split('T');
	if (!datePart) return '';
	const [year, month, day] = datePart.split('-').map((n) => Number(n));
	const timeParts = timePart.split(':').map((n) => Number(n));
	const hour = timeParts[0] ?? 0;
	const minute = timeParts[1] ?? 0;
	const second = timeParts[2] ?? 0;
	// Construct a Date in local timezone explicitly
	const dt = new Date(year, (month || 1) - 1, day || 1, hour, minute, second);
	if (Number.isNaN(dt.getTime())) return '';
	return dt.toISOString();
};

const statusOptions = [
	{ value: 'all', label: 'All Statuses' },
	{ value: 'upcoming', label: 'Upcoming' },
	{ value: 'ongoing', label: 'Ongoing' },
	{ value: 'completed', label: 'Completed' },
];

const formatApiError = (err) => {
	if (!err) return 'Unknown error';
	return (
		err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err)
	);
};

const EventsTab = ({
	events = [],
	eventsLoading = false,
	eventsError = null,
	token, // kept for API hooks that may need it later
	setDashboardError,
	getAllEvents,
}) => {
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	const panelClass = isDark
		? 'bg-gray-800/50 rounded-xl p-4 border border-gray-700'
		: 'bg-white rounded-xl p-4 border border-gray-200';

	const [showCreateEvent, setShowCreateEvent] = useState(false);
	const [showEditEvent, setShowEditEvent] = useState(false);
	const [eventFields, setEventFields] = useState({
		title: '',
		date: '',
		location: '',
		description: '',
		status: 'upcoming',
	});
	const [editEventId, setEditEventId] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [formError, setFormError] = useState('');
	const [actionError, setActionError] = useState('');

	const { createEvent, loading: createLoading } = useCreateEvent();
	const { updateEvent, loading: updateLoading } = useUpdateEvent();
	const { deleteEvent, loading: deleteLoading } = useDeleteEvent();

	// keep dashboard-level error in sync
	useEffect(() => {
		if (eventsError) {
			const msg = formatApiError(eventsError);
			setDashboardError?.(msg);
			setActionError(msg);
		}
	}, [eventsError, setDashboardError]);

	const totalCount = (events || []).length;
	const upcomingCount = (events || []).filter((e) => e.status === 'upcoming').length;

	const filteredEvents = useMemo(() => {
		const q = (searchTerm || '').trim().toLowerCase();
		return (events || [])
			.filter((event) => {
				if (!q) return true;
				return (
					(event.title || '').toLowerCase().includes(q) ||
					(event.location || '').toLowerCase().includes(q) ||
					(event.description || '').toLowerCase().includes(q)
				);
			})
			.filter((event) => (statusFilter === 'all' ? true : event.status === statusFilter));
	}, [events, searchTerm, statusFilter]);

	const resetForm = () =>
		setEventFields({
			title: '',
			date: '',
			location: '',
			description: '',
			status: 'upcoming',
		});

	const validateFields = (fields) => {
		if (!fields.title || fields.title.trim().length < 3) {
			return 'Title is required (min 3 characters).';
		}
		if (!fields.date) {
			return 'Date & time are required.';
		}
		// basic datetime check
		const dt = new Date(fields.date);
		if (Number.isNaN(dt.getTime())) return 'Please provide a valid date & time.';
		if (!fields.location || fields.location.trim().length < 2) {
			return 'Location is required.';
		}
		// new: organizer required (server validates this)
		if (!fields.organizer || fields.organizer.trim().length < 2) {
			return 'Organizer is required (min 2 characters).';
		}
		// new: description required (server validates this)
		if (!fields.description || fields.description.trim().length < 10) {
			return 'Description is required (min 10 characters).';
		}
		return '';
	};

	const handleCreateEvent = async () => {
		setFormError('');
		setActionError('');
		// ensure eventFields includes posters when creating
		const validation = validateFields(eventFields);
		if (validation) {
			setFormError(validation);
			return;
		}

		// require posters on create
		if (!eventFields.posters || !eventFields.posters.length) {
			setFormError('At least one poster image is required.');
			return;
		}

		try {
			// Build FormData for multipart upload
			const fd = new FormData();
			fd.append('title', eventFields.title);
			// send full ISO string to backend (ISO-8601)
			const iso = eventFields.date ? datetimeLocalToISO(eventFields.date) : '';
			if (iso) fd.append('eventDate', iso);
			fd.append('venue', eventFields.location);
			fd.append('description', eventFields.description || '');
			fd.append('organizer', eventFields.organizer || ''); // optional field
			fd.append('category', eventFields.category || 'General');
			fd.append('status', eventFields.status || 'upcoming');

			// optional numeric fields if provided
			if (typeof eventFields.totalSpots !== 'undefined')
				fd.append('totalSpots', String(eventFields.totalSpots));
			if (typeof eventFields.ticketPrice !== 'undefined')
				fd.append('ticketPrice', String(eventFields.ticketPrice));

			// tags: if array -> join by comma so backend normalize middleware can parse
			if (eventFields.tags) {
				if (Array.isArray(eventFields.tags)) fd.append('tags', eventFields.tags.join(','));
				else fd.append('tags', String(eventFields.tags));
			}

			// append posters (multiple)
			for (const file of eventFields.posters) {
				fd.append('posters', file);
			}

			await createEvent(fd);
			resetForm();
			setShowCreateEvent(false);
			await getAllEvents?.();
		} catch (err) {
			const msg = formatApiError(err);
			setActionError(msg);
			setDashboardError?.(msg);
		}
	};

	const handleEditEvent = async () => {
		setFormError('');
		setActionError('');
		const validation = validateFields(eventFields);
		if (validation) {
			setFormError(validation);
			return;
		}
		if (!editEventId) {
			setActionError('Missing event id to update.');
			return;
		}
		try {
			// Map frontend names to backend expected fields
			const updatePayload = {
				title: eventFields.title?.trim(),
				description: eventFields.description?.trim(),
				eventDate: eventFields.date ? datetimeLocalToISO(eventFields.date) : undefined,
				venue: eventFields.location?.trim(),
				organizer: eventFields.organizer?.trim(),
				category: eventFields.category?.trim(),
				status: eventFields.status,
			};
			// optional numeric fields
			if (typeof eventFields.totalSpots !== 'undefined')
				updatePayload.totalSpots = Number(eventFields.totalSpots);
			if (typeof eventFields.ticketPrice !== 'undefined')
				updatePayload.ticketPrice = Number(eventFields.ticketPrice);
			if (eventFields.tags) updatePayload.tags = eventFields.tags;

			await updateEvent(editEventId, updatePayload);
			resetForm();
			setShowEditEvent(false);
			setEditEventId(null);
			await getAllEvents?.();
		} catch (err) {
			const msg = formatApiError(err);
			setActionError(msg);
			setDashboardError?.(msg);
		}
	};

	const handleDeleteEvent = async (id) => {
		setActionError('');
		// simple confirm dialog - replace with modal if needed
		if (!window.confirm('Delete this event? This action cannot be undone.')) return;
		try {
			await deleteEvent(id);
			await getAllEvents?.();
		} catch (err) {
			const msg = formatApiError(err);
			setActionError(msg);
			setDashboardError?.(msg);
		}
	};

	const openEditEventModal = (event) => {
		setEditEventId(event._id);
		setEventFields({
			title: event.title || '',
			// convert to datetime-local local value
			date: toDatetimeLocalInput(event.eventDate || event.date),
			location: event.venue || event.location || '',
			description: event.description || '',
			status: event.status || 'upcoming',
			organizer: event.organizer || '',
			category: event.category || '',
		});
		setFormError('');
		setActionError('');
		setShowEditEvent(true);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
				<div className="flex items-start gap-4">
					<h2 className="text-2xl font-bold text-white flex items-center gap-3">
						Event Management
						<span className="text-sm text-gray-400 font-medium">({totalCount})</span>
					</h2>
					<div className="hidden md:flex items-center gap-3 text-sm text-gray-300">
						<span className="px-2 py-1 bg-blue-700/20 text-blue-300 rounded-full">
							{upcomingCount} upcoming
						</span>
						<span className="px-2 py-1 bg-gray-700/20 text-gray-300 rounded-full">
							{totalCount} total
						</span>
					</div>
				</div>

				<div className="flex gap-2 w-full md:w-auto">
					<div className="relative w-full md:w-64">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search events by title, location or description..."
							className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							aria-label="Search events"
						/>
					</div>

					<div className="relative">
						<select
							className="appearance-none bg-gray-700/50 border border-gray-600 rounded-lg pl-4 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							aria-label="Filter by status"
						>
							{statusOptions.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
						<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
					</div>

					<button
						className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition disabled:opacity-60"
						onClick={() => {
							resetForm();
							setFormError('');
							setActionError('');
							setShowCreateEvent(true);
						}}
						disabled={createLoading || updateLoading}
						title="Create event"
					>
						<Plus className="h-5 w-5" />
						Create Event
					</button>
				</div>
			</div>

			{/* action-level errors */}
			{(formError || actionError) && (
				<div
					className={`${
						isDark
							? 'bg-red-900/10 border border-red-700 text-red-300'
							: 'bg-red-50 border border-red-200 text-red-700'
					} rounded-lg p-3 flex items-center gap-3`}
				>
					<AlertCircle className="h-5 w-5 text-red-400" />
					<div className="text-sm">{formError || actionError}</div>
				</div>
			)}

			{/* server error component */}
			<ErrorMessage error={eventsError ? formatApiError(eventsError) : null} />

			{/* content */}
			{eventsLoading ? (
				<LoadingSpinner />
			) : filteredEvents.length === 0 ? (
				<div className={`${panelClass} text-center py-12 rounded-xl`}>
					<CalendarDays className="h-12 w-12 mx-auto text-gray-500" />
					<h3
						className={`${
							isDark ? 'text-gray-300' : 'text-gray-700'
						} text-xl font-bold mt-4`}
					>
						No events found
					</h3>
					<p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
						Create your first event to get started.
					</p>
					<button
						className={`${
							isDark
								? 'mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white'
								: 'mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white'
						}`}
						onClick={() => {
							resetForm();
							setShowCreateEvent(true);
						}}
					>
						<Plus className="h-4 w-4" /> Create event
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredEvents.map((event) => (
						<EventCard
							key={event._id}
							event={event}
							onEdit={() => openEditEventModal(event)}
							onDelete={() => handleDeleteEvent(event._id)}
							deleteLoading={deleteLoading}
							theme={theme}
						/>
					))}
				</div>
			)}

			{/* Create Event Modal */}
			{showCreateEvent && (
				<EventModal
					isEdit={false}
					open={showCreateEvent}
					onClose={() => setShowCreateEvent(false)}
					eventFields={eventFields}
					setEventFields={setEventFields}
					onSubmit={handleCreateEvent}
					loading={createLoading}
				/>
			)}

			{/* Edit Event Modal */}
			{showEditEvent && (
				<EventModal
					isEdit={true}
					open={showEditEvent}
					onClose={() => setShowEditEvent(false)}
					eventFields={eventFields}
					setEventFields={setEventFields}
					onSubmit={handleEditEvent}
					loading={updateLoading}
				/>
			)}
		</div>
	);
};

export default EventsTab;
