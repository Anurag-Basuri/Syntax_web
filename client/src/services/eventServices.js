import { apiClient, publicClient } from './api.js';

/**
 * Normalizes paginated API responses to a single object
 * { docs, totalDocs, page, totalPages, limit, hasPrevPage, hasNextPage, prevPage, nextPage }
 */
const normalizePagination = (res) => {
	const payload = res?.data ?? {};
	// Support different shapes: { data: [docs], pagination: {...} } or { data: { docs: [...] }, pagination: {...} }
	let docs = [];
	if (Array.isArray(payload.data)) {
		docs = payload.data;
	} else if (payload.data && Array.isArray(payload.data.docs)) {
		docs = payload.data.docs;
	} else if (Array.isArray(payload.data?.docs)) {
		docs = payload.data.docs;
	}
	const meta =
		payload.pagination ?? payload.meta ?? (payload.data && payload.data.pagination) ?? {};
	return { docs, ...meta };
};

const sanitizeParams = (params = {}) => {
	const allowed = ['page', 'limit', 'search', 'status', 'period', 'sortBy', 'sortOrder'];
	const out = {};
	for (const k of allowed) {
		if (typeof params[k] !== 'undefined' && params[k] !== null && params[k] !== '') {
			out[k] = params[k];
		}
	}
	// ensure numeric params are numbers
	if (out.page) out.page = Number(out.page);
	if (out.limit) out.limit = Number(out.limit);
	return out;
};

// Fetches all events with filtering and pagination.
// params: { page, limit, search, status, period, sortBy, sortOrder }
export const getAllEvents = async (params) => {
	const response = await publicClient.get('/api/v1/events', {
		params: sanitizeParams(params),
	});
	return normalizePagination(response);
};

// Fetches a single event by its ID.
export const getEventById = async (id) => {
	if (!id) throw new Error('Event id is required');
	const response = await publicClient.get(`/api/v1/events/${id}`);
	return response.data?.data ?? null;
};

// Creates a new event (Admin only).
// NOTE: when uploading posters, use the field name "posters" (array) to match the server multer config.
export const createEvent = async (formData) => {
	const response = await apiClient.post('/api/v1/events', formData);
	return response.data?.data ?? null;
};

// Updates an event's details (Admin only).
export const updateEventDetails = async (id, updateData) => {
	if (!id) throw new Error('Event id is required');
	const response = await apiClient.patch(`/api/v1/events/${id}/details`, updateData, {
		headers: { 'Content-Type': 'application/json' },
	});
	return response.data?.data ?? null;
};

// Deletes an event (Admin only).
export const deleteEvent = async (id) => {
	if (!id) throw new Error('Event id is required');
	const response = await apiClient.delete(`/api/v1/events/${id}`);
	if (response.status === 204) return null;
	return response.data ?? null;
};

// Fetches statistics about all events (Admin only).
export const getEventStats = async () => {
	const response = await apiClient.get('/api/v1/events/admin/statistics');
	return response.data?.data ?? null;
};

// Fetches registrations for a specific event (Admin only).
export const getEventRegistrations = async (id) => {
	if (!id) throw new Error('Event id is required');
	const response = await apiClient.get(`/api/v1/events/${id}/registrations`);
	return response.data?.data ?? [];
};

// Adds a poster (Admin only).
// NOTE: server expects single file under field name "poster" for this endpoint.
export const addEventPoster = async (id, formData) => {
	if (!id) throw new Error('Event id is required');
	const response = await apiClient.post(`/api/v1/events/${id}/posters`, formData);
	return response.data?.data ?? null;
};

// Removes a poster (Admin only).
export const removeEventPoster = async (id, publicId) => {
	if (!id) throw new Error('Event id is required');
	if (!publicId) throw new Error('publicId is required');
	const response = await apiClient.delete(`/api/v1/events/${id}/posters/${publicId}`);
	return response.data ?? null;
};
