import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
	Search,
	RefreshCw,
	ChevronDown,
	Grid,
	List,
	Plus,
	AlertCircle,
	CalendarDays,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.js';
import ErrorMessage from './ErrorMessage.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import EventCard from './EventCard.jsx';
import EventModal from './EventModal.jsx';
import ManageModal from './ManageModal.jsx';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../hooks/useEvents.js';
import formatApiError from '../../utils/formatApiError.js';

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
	posters: [], // File objects for new uploads
	registrationMode: 'none',
	externalUrl: '',
	allowGuests: true,
	capacityOverride: '',
	registrationOpenDate: '',
	registrationCloseDate: '',
};

const MAX_POSTERS = 5;

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
	// Keep existing posters for edit separately (server-owned posters)
	const [editExistingPosters, setEditExistingPosters] = useState([]);

	// Filters & search
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [sortBy, setSortBy] = useState('eventDate');
	const [sortOrder, setSortOrder] = useState('asc');

	// UI/errors
	const [formError, setFormError] = useState('');
	const [actionError, setActionError] = useState('');
	const [showManageModal, setShowManageModal] = useState(false);
	const [manageTargetEvent, setManageTargetEvent] = useState(null);

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

	// debounce search
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

	// filtering + sorting
	const filteredEvents = useMemo(() => {
		const q = debouncedSearch || '';
		let list = Array.isArray(events) ? events.slice() : [];

		if (q) {
			list = list.filter((ev) => {
				const combined = [
					ev.title,
					ev.venue || ev.location,
					ev.description,
					ev.organizer,
					(ev.tags || []).join(','),
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				return combined.includes(q);
			});
		}

		if (statusFilter !== 'all') {
			list = list.filter((e) => e.status === statusFilter);
		}

		list.sort((a, b) => {
			const dir = sortOrder === 'asc' ? 1 : -1;
			if (sortBy === 'eventDate') {
				const ad = new Date(a.eventDate || a.date || 0).getTime();
				const bd = new Date(b.eventDate || b.date || 0).getTime();
				return (ad - bd) * dir;
			}
			const sa = String(a[sortBy] ?? '').toLowerCase();
			const sb = String(b[sortBy] ?? '').toLowerCase();
			if (sa < sb) return -1 * dir;
			if (sa > sb) return 1 * dir;
			return 0;
		});

		return list;
	}, [events, debouncedSearch, statusFilter, sortBy, sortOrder]);

	const resetForm = () => setEventFields(initialEventFields);

	// validate util aligned with backend rules (short, returns string error or empty)
	const isValidUrl = (u) => {
		if (!u) return false;
		try {
			/* eslint-disable no-new */
			new URL(u);
			return true;
		} catch {
			return false;
		}
	};

	const validateFields = (fields, forEdit = false) => {
		// Title
		if (!fields.title || typeof fields.title !== 'string' || fields.title.trim().length < 3)
			return 'Title must be at least 3 characters.';
		if (fields.title.trim().length > 150) return 'Title cannot exceed 150 characters.';

		// Date (client uses datetime-local in 'date' field)
		if (!fields.date) return 'Event date is required.';
		const iso = datetimeLocalToISO(fields.date);
		if (!iso) return 'Invalid event date.';
		const dt = new Date(iso);
		if (Number.isNaN(dt.getTime())) return 'Invalid event date.';
		// server allows 60s leeway
		if (dt.getTime() < Date.now() - 60_000) return 'Event date cannot be in the past.';

		// Venue
		if (!fields.location || fields.location.trim().length < 2) return 'Venue is required.';
		if (fields.location.trim().length > 150) return 'Venue cannot exceed 150 characters.';

		// Category
		if (!fields.category || fields.category.trim().length < 1) return 'Category is required.';

		// Description
		if (
			!fields.description ||
			typeof fields.description !== 'string' ||
			fields.description.trim().length < 10
		)
			return 'Description must be at least 10 characters.';
		if (fields.description.trim().length > 2000)
			return 'Description cannot exceed 2000 characters.';

		// Numeric constraints (totalSpots)
		if (
			fields.totalSpots !== '' &&
			typeof fields.totalSpots !== 'undefined' &&
			fields.totalSpots !== null
		) {
			const n = Number(fields.totalSpots);
			if (Number.isNaN(n) || !Number.isInteger(n) || n < 0)
				return 'Total spots must be a non-negative integer.';
		}

		// ticketPrice
		if (
			fields.ticketPrice !== '' &&
			typeof fields.ticketPrice !== 'undefined' &&
			fields.ticketPrice !== null
		) {
			const p = Number(fields.ticketPrice);
			if (Number.isNaN(p) || p < 0) return 'Ticket price must be a non-negative number.';
		}

		// capacityOverride (registration)
		if (
			typeof fields.capacityOverride !== 'undefined' &&
			fields.capacityOverride !== '' &&
			fields.capacityOverride !== null
		) {
			const c = Number(fields.capacityOverride);
			if (Number.isNaN(c) || !Number.isInteger(c) || c < 0)
				return 'Capacity override must be a non-negative integer.';
		}

		// registration external URL rule
		const mode =
			(fields.registration && fields.registration.mode) || fields.registrationMode || 'none';
		const externalUrl =
			(fields.registration && fields.registration.externalUrl) || fields.externalUrl || '';
		if (mode === 'external' && !externalUrl)
			return 'External registration mode requires an external URL.';
		if (externalUrl && !isValidUrl(externalUrl)) return 'External registration URL is invalid.';

		// registration window ordering
		const open = fields.registrationOpenDate || '';
		const close = fields.registrationCloseDate || '';
		if (open && close) {
			const o = new Date(datetimeLocalToISO(open)).getTime();
			const c = new Date(datetimeLocalToISO(close)).getTime();
			if (Number.isNaN(o) || Number.isNaN(c)) return 'Invalid registration open/close dates.';
			if (o > c) return 'Registration open date cannot be after close date.';
		}

		// Posters client-side guard
		if (Array.isArray(fields.posters) && fields.posters.length > MAX_POSTERS) {
			return `You can upload a maximum of ${MAX_POSTERS} posters.`;
		}

		return '';
	};

	// Build payload for create/update: if posters (File objects) present, use FormData and field name "posters"
	const buildPayload = (fields) => {
		// If there are File objects in fields.posters, create FormData
		const hasFiles =
			Array.isArray(fields.posters) && fields.posters.some((f) => f instanceof File);
		if (hasFiles) {
			const fd = new FormData();
			// fields mapping - flattened keys are accepted and normalized by server middleware
			fd.append('title', fields.title.trim());
			fd.append('description', fields.description.trim());
			fd.append('date', datetimeLocalToISO(fields.date)); // normalized server-side -> eventDate
			if (fields.eventTime) fd.append('eventTime', fields.eventTime);
			fd.append('location', fields.location.trim());
			if (fields.room) fd.append('room', fields.room.trim());
			if (fields.organizer) fd.append('organizer', fields.organizer.trim());
			fd.append('category', fields.category.trim());
			if (fields.subcategory) fd.append('subcategory', fields.subcategory.trim());
			if (fields.totalSpots !== '') fd.append('totalSpots', String(fields.totalSpots));
			if (fields.ticketPrice !== '') fd.append('ticketPrice', String(fields.ticketPrice));
			fd.append('status', fields.status || 'upcoming');
			// registration fields (flattened)
			fd.append('registrationMode', fields.registrationMode || 'none');
			if (fields.externalUrl) fd.append('externalUrl', fields.externalUrl);
			if (typeof fields.allowGuests !== 'undefined')
				fd.append('allowGuests', fields.allowGuests ? 'true' : 'false');
			if (fields.capacityOverride !== '')
				fd.append('capacityOverride', String(fields.capacityOverride));
			if (fields.registrationOpenDate)
				fd.append('registrationOpenDate', datetimeLocalToISO(fields.registrationOpenDate));
			if (fields.registrationCloseDate)
				fd.append(
					'registrationCloseDate',
					datetimeLocalToISO(fields.registrationCloseDate)
				);
			// tags as JSON or comma string
			if (Array.isArray(fields.tags)) {
				fd.append('tags', JSON.stringify(fields.tags));
			} else if (typeof fields.tags === 'string') {
				fd.append('tags', fields.tags);
			}
			// files under "posters" (server expects field name "posters" for create)
			(fields.posters || []).forEach((f) => {
				if (f instanceof File) fd.append('posters', f);
			});
			return fd;
		}

		// Otherwise return plain JSON object (server's normalize middleware handles flattened fields)
		const obj = {
			title: fields.title.trim(),
			description: fields.description.trim(),
			date: datetimeLocalToISO(fields.date),
			eventTime: fields.eventTime || undefined,
			location: fields.location.trim(),
			room: fields.room?.trim(),
			organizer: fields.organizer?.trim(),
			category: fields.category?.trim(),
			subcategory: fields.subcategory?.trim(),
			totalSpots: fields.totalSpots === '' ? undefined : Number(fields.totalSpots),
			ticketPrice: fields.ticketPrice === '' ? undefined : Number(fields.ticketPrice),
			status: fields.status || 'upcoming',
			registrationMode: fields.registrationMode || 'none',
			externalUrl: fields.externalUrl || undefined,
			allowGuests: typeof fields.allowGuests === 'boolean' ? fields.allowGuests : undefined,
			capacityOverride:
				fields.capacityOverride === '' ? undefined : Number(fields.capacityOverride),
			registrationOpenDate: fields.registrationOpenDate
				? datetimeLocalToISO(fields.registrationOpenDate)
				: undefined,
			registrationCloseDate: fields.registrationCloseDate
				? datetimeLocalToISO(fields.registrationCloseDate)
				: undefined,
		};
		if (Array.isArray(fields.tags)) obj.tags = fields.tags;
		return obj;
	};

	const handleCreateEvent = async () => {
		setFormError('');
		setActionError('');
		const validation = validateFields(eventFields, false);
		if (validation) {
			setFormError(validation);
			return;
		}
		const payload = buildPayload(eventFields);
		try {
			await createEvent(payload);
			setShowCreateEvent(false);
			resetForm();
			// refresh
			if (getAllEvents) await getAllEvents();
		} catch (err) {
			const msg = formatApiError(err);
			setActionError(msg);
		}
	};

	const handleEditEvent = async () => {
		setFormError('');
		setActionError('');
		const validation = validateFields(eventFields, true);
		if (validation) {
			setFormError(validation);
			return;
		}
		if (!editEventId) {
			setActionError('No event selected for editing.');
			return;
		}
		const payload = buildPayload(eventFields);
		try {
			// updateEvent in hook expects (id, data) wrapper
			await updateEvent(editEventId, payload);
			setShowEditEvent(false);
			resetForm();
			setEditEventId(null);
			if (getAllEvents) await getAllEvents();
		} catch (err) {
			const msg = formatApiError(err);
			setActionError(msg);
		}
	};

	const handleDeleteEvent = async (id) => {
		setActionError('');
		if (!window.confirm('Delete this event? This action cannot be undone.')) return;
		try {
			await deleteEvent(id);
			if (getAllEvents) await getAllEvents();
		} catch (err) {
			const msg = formatApiError(err);
			setActionError(msg);
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
			posters: [], // new uploads only
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
		setEditExistingPosters(event.posters || []);
		setFormError('');
		setActionError('');
		setShowEditEvent(true);
	};

	const handleRemoveExistingPoster = async (publicId) => {
		// Note: this will be called from EventModal via onRemovePoster prop
		if (!publicId) return;
		if (!editEventId) return setActionError('Missing event id for poster removal.');
		if (!window.confirm('Remove poster?')) return;
		try {
			await import('../../services/eventServices.js').then((m) =>
				m.removeEventPoster(editEventId, publicId)
			);
			// update local state
			setEditExistingPosters((prev) =>
				prev.filter((p) => (p.publicId || p.public_id) !== publicId)
			);
			if (getAllEvents) await getAllEvents();
		} catch (err) {
			const msg = formatApiError(err);
			setActionError(msg);
		}
	};

	const handleManageEventOpen = (event) => {
		setManageTargetEvent(event);
		setShowManageModal(true);
	};

	const onManageDone = async () => {
		setShowManageModal(false);
		setManageTargetEvent(null);
		// refresh list
		if (getAllEvents) await getAllEvents();
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
								<div key={event._id} className="relative">
									<EventCard
										event={event}
										compact={compactCards}
										onEdit={() => openEditEventModal(event)}
										onDelete={() => handleDeleteEvent(event._id)}
										deleteLoading={deleteLoading}
									/>
									{/* Manage button */}
									<button
										onClick={() => handleManageEventOpen(event)}
										title="Manage event (partners, speakers, resources, co-organizers)"
										className="absolute right-3 top-3 z-10 px-2 py-1 rounded bg-black/40 text-xs text-white hover:bg-black/60"
										aria-label={`Manage ${event.title}`}
									>
										Manage
									</button>
								</div>
							))}
						</div>
					) : (
						<div className="space-y-4">
							{filteredEvents.map((event) => (
								<div
									key={event._id}
									className="bg-gray-800/40 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
								>
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
										<button
											onClick={() => handleManageEventOpen(event)}
											className="px-3 py-1 rounded bg-black/40 text-white text-sm"
										>
											Manage
										</button>
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
					existingPosters={[]}
					onRemovePoster={null}
				/>
			)}
			{showEditEvent && (
				<EventModal
					isEdit={true}
					open={showEditEvent}
					onClose={() => {
						setShowEditEvent(false);
						setEditEventId(null);
						resetForm();
					}}
					eventFields={eventFields}
					setEventFields={setEventFields}
					onSubmit={handleEditEvent}
					loading={updateLoading}
					existingPosters={editExistingPosters}
					onRemovePoster={handleRemoveExistingPoster}
				/>
			)}

			{showManageModal && manageTargetEvent && (
				<ManageModal
					open={showManageModal}
					event={manageTargetEvent}
					onClose={() => setShowManageModal(false)}
					onDone={onManageDone}
					setParentError={setDashboardError}
				/>
			)}
		</div>
	);
};

export default EventsTab;
