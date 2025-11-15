import { useState, useMemo, useEffect, useRef } from 'react';
import {
	CalendarDays,
	Plus,
	Search,
	ChevronDown,
	AlertCircle,
	Filter,
	RefreshCw,
	Grid,
	List,
} from 'lucide-react';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../hooks/useEvents.js';
import LoadingSpinner from './LoadingSpinner.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import EventModal from './EventModal.jsx';
import EventCard from './EventCard.jsx';
import { useTheme } from '../../hooks/useTheme.js';

// Converts a Date/string to <input type="datetime-local"> value
const toDatetimeLocalInput = (value) => {
	if (!value) return '';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '';
	const tzOffsetMs = d.getTimezoneOffset() * 60000;
	const local = new Date(d.getTime() - tzOffsetMs);
	return local.toISOString().slice(0, 16);
};

// Converts datetime-local input to ISO string
const datetimeLocalToISO = (localValue) => {
	if (!localValue) return '';
	const [datePart, timePart = '00:00:00'] = localValue.split('T');
	if (!datePart) return '';
	const [year, month, day] = datePart.split('-').map(Number);
	const timeParts = timePart.split(':').map(Number);
	const hour = timeParts[0] ?? 0;
	const minute = timeParts[1] ?? 0;
	const second = timeParts[2] ?? 0;
	const dt = new Date(year, (month || 1) - 1, day || 1, hour, minute, second);
	if (Number.isNaN(dt.getTime())) return '';
	return dt.toISOString();
};

const statusOptions = [
	{ value: 'all', label: 'All Statuses' },
	{ value: 'upcoming', label: 'Upcoming' },
	{ value: 'ongoing', label: 'Ongoing' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
	{ value: 'postponed', label: 'Postponed' },
];

const formatApiError = (err) => {
	if (!err) return 'Unknown error';
	return (
		err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err)
	);
};

const initialEventFields = {
	title: '',
	date: '',
	eventTime: '',
	location: '',
	room: '',
	description: '',
	status: 'upcoming',
	organizer: '',
	category: '',
	subcategory: '',
	totalSpots: '',
	ticketPrice: '',
	tags: [],
	posters: [],
	registrationMode: 'none',
	externalUrl: '',
	allowGuests: true,
	capacityOverride: '',
	registrationOpenDate: '',
	registrationCloseDate: '',
};

const EventsTab = ({
	events = [],
	eventsLoading = false,
	eventsError = null,
	token,
	setDashboardError,
	getAllEvents,
}) => {
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	// Visual state
	const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
	const [compactCards, setCompactCards] = useState(false);

	// Modal & form
	const [showCreateEvent, setShowCreateEvent] = useState(false);
	const [showEditEvent, setShowEditEvent] = useState(false);
	const [eventFields, setEventFields] = useState(initialEventFields);
	const [editEventId, setEditEventId] = useState(null);

	// Filters & search
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [sortBy, setSortBy] = useState('eventDate');
	const [sortOrder, setSortOrder] = useState('asc');

	// UI/errors
	const [formError, setFormError] = useState('');
	const [actionError, setActionError] = useState('');
	const [isFilteringOpen, setIsFilteringOpen] = useState(false);

	const searchTimer = useRef(null);

	const { createEvent, loading: createLoading } = useCreateEvent();
	const { updateEvent, loading: updateLoading } = useUpdateEvent();
	const { deleteEvent, loading: deleteLoading } = useDeleteEvent();

	// sync API errors
	useEffect(() => {
		if (eventsError) {
			const msg = formatApiError(eventsError);
			setDashboardError?.(msg);
			setActionError(msg);
		}
	}, [eventsError, setDashboardError]);

	// debounce search for better UX
	useEffect(() => {
		if (searchTimer.current) clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => {
			setDebouncedSearch(searchTerm.trim().toLowerCase());
		}, 300);
		return () => {
			if (searchTimer.current) clearTimeout(searchTimer.current);
		};
	}, [searchTerm]);

	// counts
	const totalCount = (events || []).length;
	const upcomingCount = (events || []).filter((e) => e.status === 'upcoming').length;

	// improved filtering + sorting
	const filteredEvents = useMemo(() => {
		const q = debouncedSearch || '';
		let list = Array.isArray(events) ? events.slice() : [];

		// search across multiple fields
		if (q) {
			list = list.filter((event) => {
				const title = (event.title || '').toLowerCase();
				const location = (event.venue || event.location || '').toLowerCase();
				const description = (event.description || '').toLowerCase();
				const organizer = (event.organizer || '').toLowerCase();
				const tags = (event.tags || []).join(',').toLowerCase();
				return (
					title.includes(q) ||
					location.includes(q) ||
					description.includes(q) ||
					organizer.includes(q) ||
					tags.includes(q)
				);
			});
		}

		// status
		if (statusFilter !== 'all') {
			list = list.filter((e) => e.status === statusFilter);
		}

		// sort
		list.sort((a, b) => {
			const aVal = a[sortBy];
			const bVal = b[sortBy];
			if (sortBy === 'eventDate') {
				const da = new Date(aVal || a.eventDate || a.date || 0).getTime();
				const db = new Date(bVal || b.eventDate || b.date || 0).getTime();
				return sortOrder === 'asc' ? da - db : db - da;
			}
			// fallback string compare
			const sa = String(aVal ?? '').toLowerCase();
			const sb = String(bVal ?? '').toLowerCase();
			if (sa < sb) return sortOrder === 'asc' ? -1 : 1;
			if (sa > sb) return sortOrder === 'asc' ? 1 : -1;
			return 0;
		});

		return list;
	}, [events, debouncedSearch, statusFilter, sortBy, sortOrder]);

	// reset form
	const resetForm = () => setEventFields(initialEventFields);

	// validation (aligned with backend requirements)
	const validateFields = (fields, forEdit = false) => {
		if (!fields.title || fields.title.trim().length < 3)
			return 'Title is required (min 3 characters).';
		if (!fields.date) return 'Date & time are required.';
		const iso = datetimeLocalToISO(fields.date);
		if (!iso) return 'Please provide a valid date & time.';
		const dt = new Date(iso);
		if (Number.isNaN(dt.getTime())) return 'Please provide a valid date & time.';
		// backend requires venue (frontend uses location -> normalized to venue)
		if (!fields.location || fields.location.trim().length < 2) return 'Venue is required.';
		if (!fields.category || fields.category.trim().length < 2) return 'Category is required.';
		if (!fields.description || fields.description.trim().length < 10)
			return 'Description is required (min 10 characters).';
		// keep external registration rule: backend enforces externalUrl when mode is external
		if (fields.registrationMode === 'external' && !fields.externalUrl)
			return 'External registration URL is required for external mode.';
		return '';
	};

	// create
	const handleCreateEvent = async () => {
		setFormError('');
		setActionError('');
		const validation = validateFields(eventFields, false);
		if (validation) {
			setFormError(validation);
			return;
		}
		try {
			const fd = new FormData();
			fd.append('title', eventFields.title);
			const iso = eventFields.date ? datetimeLocalToISO(eventFields.date) : '';
			if (iso) fd.append('eventDate', iso);
			if (eventFields.eventTime) fd.append('eventTime', eventFields.eventTime);
			fd.append('venue', eventFields.location);
			if (eventFields.room) fd.append('room', eventFields.room);
			fd.append('description', eventFields.description);
			fd.append('organizer', eventFields.organizer);
			fd.append('category', eventFields.category);
			if (eventFields.subcategory) fd.append('subcategory', eventFields.subcategory);
			fd.append('status', eventFields.status);

			if (eventFields.totalSpots !== '')
				fd.append('totalSpots', String(eventFields.totalSpots));
			if (eventFields.ticketPrice !== '')
				fd.append('ticketPrice', String(eventFields.ticketPrice));

			if (eventFields.tags) {
				if (Array.isArray(eventFields.tags)) fd.append('tags', eventFields.tags.join(','));
				else fd.append('tags', String(eventFields.tags));
			}

			for (const file of eventFields.posters || []) {
				fd.append('posters', file);
			}

			// Registration fields
			fd.append('registrationMode', eventFields.registrationMode || 'none');
			if (eventFields.externalUrl) fd.append('externalUrl', eventFields.externalUrl);
			fd.append('allowGuests', String(eventFields.allowGuests));
			if (eventFields.capacityOverride !== '')
				fd.append('capacityOverride', String(eventFields.capacityOverride));
			if (eventFields.registrationOpenDate)
				fd.append(
					'registrationOpenDate',
					datetimeLocalToISO(eventFields.registrationOpenDate)
				);
			if (eventFields.registrationCloseDate)
				fd.append(
					'registrationCloseDate',
					datetimeLocalToISO(eventFields.registrationCloseDate)
				);

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

	// edit
	const handleEditEvent = async () => {
		setFormError('');
		setActionError('');
		const validation = validateFields(eventFields, true);
		if (validation) {
			setFormError(validation);
			return;
		}
		if (!editEventId) {
			setActionError('Missing event id to update.');
			return;
		}
		try {
			const updatePayload = {
				title: eventFields.title?.trim(),
				description: eventFields.description?.trim(),
				eventDate: eventFields.date ? datetimeLocalToISO(eventFields.date) : undefined,
				eventTime: eventFields.eventTime || undefined,
				venue: eventFields.location?.trim(),
				room: eventFields.room?.trim(),
				organizer: eventFields.organizer?.trim(),
				category: eventFields.category?.trim(),
				subcategory: eventFields.subcategory?.trim(),
				status: eventFields.status,
				totalSpots:
					eventFields.totalSpots !== '' ? Number(eventFields.totalSpots) : undefined,
				ticketPrice:
					eventFields.ticketPrice !== '' ? Number(eventFields.ticketPrice) : undefined,
				tags: eventFields.tags,
				registrationOpenDate: eventFields.registrationOpenDate
					? datetimeLocalToISO(eventFields.registrationOpenDate)
					: undefined,
				registrationCloseDate: eventFields.registrationCloseDate
					? datetimeLocalToISO(eventFields.registrationCloseDate)
					: undefined,
				registration: {
					mode: eventFields.registrationMode || 'none',
					externalUrl: eventFields.externalUrl || undefined,
					allowGuests: eventFields.allowGuests,
					capacityOverride:
						eventFields.capacityOverride !== ''
							? Number(eventFields.capacityOverride)
							: undefined,
				},
			};
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
			date: toDatetimeLocalInput(event.eventDate || event.date),
			eventTime: event.eventTime || '',
			location: event.venue || event.location || '',
			room: event.room || '',
			description: event.description || '',
			status: event.status || 'upcoming',
			organizer: event.organizer || '',
			category: event.category || '',
			subcategory: event.subcategory || '',
			totalSpots: event.totalSpots ?? '',
			ticketPrice: event.ticketPrice ?? '',
			tags: event.tags || [],
			posters: [],
			registrationMode: event.registration?.mode || 'none',
			externalUrl: event.registration?.externalUrl || '',
			allowGuests:
				typeof event.registration?.allowGuests === 'boolean'
					? event.registration.allowGuests
					: true,
			capacityOverride: event.registration?.capacityOverride ?? '',
			registrationOpenDate: event.registrationOpenDate
				? toDatetimeLocalInput(event.registrationOpenDate)
				: '',
			registrationCloseDate: event.registrationCloseDate
				? toDatetimeLocalInput(event.registrationCloseDate)
				: '',
		});
		setFormError('');
		setActionError('');
		setShowEditEvent(true);
	};

	// small responsive helpers
	const isEmpty = !eventsLoading && filteredEvents.length === 0;

	return (
		<div className="space-y-6">
			{/* Top bar */}
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
				<div className="flex items-start gap-4">
					<h2 className="text-2xl font-semibold text-white">Events</h2>
					<div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
						<span className="px-2 py-1 bg-blue-700/20 text-blue-300 rounded-full">
							{upcomingCount} upcoming
						</span>
						<span className="px-2 py-1 bg-gray-700/20 text-gray-300 rounded-full">
							{totalCount} total
						</span>
					</div>
				</div>

				{/* controls */}
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
					{/* search */}
					<div className="flex items-center gap-2 w-full sm:w-72">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="search"
								placeholder="Search events, organizers, tags..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-700/10 border border-gray-200 dark:bg-gray-800/40 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								aria-label="Search events"
							/>
						</div>
						<button
							onClick={() => {
								// quick refresh
								getAllEvents?.();
							}}
							title="Refresh"
							className="p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/40 text-gray-200"
						>
							<RefreshCw className="h-4 w-4" />
						</button>
					</div>

					{/* filter / sort / view */}
					<div className="flex items-center gap-2">
						{/* status */}
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="appearance-none bg-gray-700/10 border border-gray-200 dark:bg-gray-800/40 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{statusOptions.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>

						{/* sort */}
						<div className="relative">
							<select
								value={`${sortBy}:${sortOrder}`}
								onChange={(e) => {
									const [sBy, sOrder] = e.target.value.split(':');
									setSortBy(sBy);
									setSortOrder(sOrder);
								}}
								className="appearance-none bg-gray-700/10 border border-gray-200 dark:bg-gray-800/40 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								aria-label="Sort by"
							>
								<option value="eventDate:asc">Date ↑</option>
								<option value="eventDate:desc">Date ↓</option>
								<option value="title:asc">Title A→Z</option>
								<option value="title:desc">Title Z→A</option>
							</select>
							<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
						</div>

						{/* view toggle */}
						<div className="flex items-center gap-1 bg-gray-700/10 rounded-lg p-1">
							<button
								className={`p-2 rounded ${
									viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-300'
								}`}
								onClick={() => setViewMode('grid')}
								aria-label="Grid view"
							>
								<Grid className="h-4 w-4" />
							</button>
							<button
								className={`p-2 rounded ${
									viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-300'
								}`}
								onClick={() => setViewMode('list')}
								aria-label="List view"
							>
								<List className="h-4 w-4" />
							</button>
						</div>

						{/* create */}
						<button
							className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
							onClick={() => {
								resetForm();
								setFormError('');
								setActionError('');
								setShowCreateEvent(true);
							}}
							disabled={createLoading || updateLoading}
						>
							<Plus className="h-4 w-4" />
							<span className="hidden sm:inline">Create</span>
						</button>
					</div>
				</div>
			</div>

			{/* errors */}
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

			<ErrorMessage error={eventsError ? formatApiError(eventsError) : null} />

			{/* content */}
			{eventsLoading ? (
				<div className="rounded-xl p-6 bg-gray-800/40">
					<LoadingSpinner size="lg" />
				</div>
			) : isEmpty ? (
				<div className="rounded-xl p-8 text-center bg-transparent border border-dashed border-gray-700">
					<CalendarDays className="h-12 w-12 mx-auto text-gray-400" />
					<h3 className="text-lg font-semibold text-white mt-4">No events found</h3>
					<p className="text-sm text-gray-400 mt-2">
						Use the Create button to add your first event.
					</p>
					<button
						className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
						onClick={() => {
							resetForm();
							setShowCreateEvent(true);
						}}
					>
						<Plus className="h-4 w-4" /> Create event
					</button>
				</div>
			) : (
				<>
					{viewMode === 'grid' ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{filteredEvents.map((event) => (
								<EventCard
									key={event._id}
									event={event}
									compact={compactCards}
									onEdit={() => openEditEventModal(event)}
									onDelete={() => handleDeleteEvent(event._id)}
									deleteLoading={deleteLoading}
								/>
							))}
						</div>
					) : (
						<div className="space-y-4">
							{filteredEvents.map((event) => (
								<div
									key={event._id}
									className="bg-gray-800/40 rounded-lg p-4 border border-gray-700"
								>
									<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
										<div className="flex items-start gap-3">
											<div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-800 to-blue-800 flex items-center justify-center text-white text-sm font-semibold">
												{(event.title || '').slice(0, 2).toUpperCase()}
											</div>
											<div>
												<h4 className="font-semibold text-white">
													{event.title}
												</h4>
												<p className="text-xs text-gray-400">
													{event.venue || event.location || 'TBA'}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<button
												onClick={() => openEditEventModal(event)}
												className="px-3 py-1 rounded bg-gray-700/30 text-white text-sm"
											>
												Edit
											</button>
											<button
												onClick={() => handleDeleteEvent(event._id)}
												disabled={deleteLoading}
												className="px-3 py-1 rounded bg-red-700/60 text-white text-sm disabled:opacity-50"
											>
												Delete
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}

			{/* modals */}
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
