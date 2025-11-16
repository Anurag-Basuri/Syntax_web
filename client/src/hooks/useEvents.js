import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getAllEvents,
	getEventById,
	getPublicEventDetails,
	createEvent,
	updateEventDetails,
	deleteEvent,
} from '../services/eventServices.js';
import { toast } from 'react-hot-toast';
import formatApiError from '../utils/formatApiError.js';

/**
 * Hooks for events — improved:
 * - Passes AbortController signal to service layer (cancellation)
 * - Uses formatApiError for readable toasts
 * - Fixes incorrect service function names
 * - Centralizes exports at the end
 */

/* Fetch a paginated list of events (param-aware cache key) */
const useEvents = (params = {}) => {
	const defaultParams = { page: 1, limit: 9, sortBy: 'eventDate', sortOrder: 'desc' };
	const merged = { ...defaultParams, ...params };

	return useQuery({
		queryKey: ['events', merged],
		queryFn: ({ signal }) => getAllEvents(merged, { signal }),
		staleTime: 60_000,
		refetchOnWindowFocus: false,
	});
};

/* Compatibility helper: fetch many events for admin UI */
const useGetAllEvents = () => {
	const query = useQuery({
		queryKey: ['events', 'all'],
		queryFn: ({ signal }) => getAllEvents({ limit: 1000, page: 1 }, { signal }),
		staleTime: 60_000,
		refetchOnWindowFocus: false,
	});

	return {
		refetch: query.refetch,
		events: Array.isArray(query.data?.docs)
			? query.data.docs
			: query.data?.events ?? query.data ?? [],
		loading: query.isLoading,
		error: query.error,
	};
};

/* Fetch single event by id */
const useEvent = (id) => {
	return useQuery({
		queryKey: ['event', id],
		queryFn: ({ signal }) => getEventById(id, { signal }),
		enabled: !!id,
		staleTime: 60_000,
	});
};

/* Get the next upcoming event (returns single item or undefined) */
const useUpcomingEvent = () => {
	return useQuery({
		queryKey: ['upcomingEvent'],
		queryFn: ({ signal }) =>
			getAllEvents({ period: 'upcoming', limit: 1, sortBy: 'eventDate' }, { signal }),
		select: (data) => data?.docs?.[0],
		staleTime: 60_000,
	});
};

/* Create event mutation */
const useCreateEvent = () => {
	const queryClient = useQueryClient();
	const { mutateAsync, isLoading } = useMutation({
		mutationFn: (payload) => createEvent(payload),
		onSuccess: () => {
			toast.success('Event created successfully!');
			// Invalidate any query keys that start with 'events'
			queryClient.invalidateQueries({ queryKey: ['events'] });
		},
		onError: (err) => {
			toast.error(formatApiError(err));
			throw err;
		},
	});

	return { createEvent: mutateAsync, loading: isLoading };
};

/* Update event mutation (wraps API call to match existing component usage) */
const useUpdateEvent = () => {
	const queryClient = useQueryClient();
	const { mutateAsync, isLoading } = useMutation({
		mutationFn: ({ id, data }) => updateEventDetails(id, data),
		onSuccess: (_data, variables) => {
			toast.success('Event updated successfully!');
			queryClient.invalidateQueries({ queryKey: ['events'] });
			if (variables?.id) queryClient.invalidateQueries({ queryKey: ['event', variables.id] });
		},
		onError: (err) => {
			toast.error(formatApiError(err));
			throw err;
		},
	});

	// compatibility: accept updateEvent(id, data)
	const updateEvent = (id, data) => mutateAsync({ id, data });

	return { updateEvent, loading: isLoading };
};

/* Delete event mutation */
const useDeleteEvent = () => {
	const queryClient = useQueryClient();
	const { mutateAsync, isLoading } = useMutation({
		mutationFn: (id) => deleteEvent(id),
		onSuccess: () => {
			toast.success('Event deleted.');
			queryClient.invalidateQueries({ queryKey: ['events'] });
		},
		onError: (err) => {
			toast.error(formatApiError(err));
			throw err;
		},
	});

	return { deleteEvent: mutateAsync, loading: isLoading };
};

/* Backwards-compatible grouping */
const useManageEvent = () => {
	const create = useCreateEvent();
	const update = useUpdateEvent();
	const remove = useDeleteEvent();

	return {
		addEvent: create.createEvent,
		isCreating: create.loading,
		updateEvent: update.updateEvent,
		isUpdating: update.loading,
		removeEvent: remove.deleteEvent,
		isDeleting: remove.loading,
	};
};

/* Export everything at once */
export {
	useEvents,
	useGetAllEvents,
	useEvent,
	useUpcomingEvent,
	useCreateEvent,
	useUpdateEvent,
	useDeleteEvent,
	useManageEvent,
};
