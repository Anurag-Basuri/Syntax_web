import { apiClient, publicClient } from './api.js';

/**
 * Normalizes paginated API responses to a single object
 * { docs, totalDocs, page, totalPages, limit, hasPrevPage, hasNextPage, prevPage, nextPage }
 */
const normalizePagination = (res) => {
	const payload = res?.data ?? {};
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

// Public sanitized details endpoint
export const getPublicEventDetails = async (id) => {
	if (!id) throw new Error('Event id is required');
	const response = await publicClient.get(`/api/v1/events/${id}/public`);
	return response.data?.data ?? null;
};

// Creates a new event (Admin only).
// NOTE: when uploading posters, use the field name "posters" (array) to match the server multer config.
// Accepts either FormData (files) or plain JSON object.
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
// Accepts FormData instance containing a key 'poster'.
export const addEventPoster = async (id, formData) => {
	if (!id) throw new Error('Event id is required');
	if (!(formData instanceof FormData)) throw new Error('FormData with poster file is required');
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

// Partners

// Add partner (Admin only).
// Accepts either FormData (with 'logo' file + fields) or plain object { name, website, tier, booth, description }.
export const addEventPartner = async (id, payload) => {
	if (!id) throw new Error('Event id is required');
	let response;
	if (payload instanceof FormData) {
		response = await apiClient.post(`/api/v1/events/${id}/partners`, payload);
	} else {
		response = await apiClient.post(`/api/v1/events/${id}/partners`, payload, {
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return response.data?.data ?? null;
};

export const removeEventPartner = async (id, partnerId) => {
	if (!id) throw new Error('Event id is required');
	if (!partnerId) throw new Error('partnerId is required');
	const response = await apiClient.delete(`/api/v1/events/${id}/partners/${partnerId}`);
	return response.data ?? null;
};

// Speakers

// Add speaker (Admin only).
// Accepts FormData (with 'photo' file + name/title/bio/links) or plain object.
export const addEventSpeaker = async (id, payload) => {
	if (!id) throw new Error('Event id is required');
	let response;
	if (payload instanceof FormData) {
		response = await apiClient.post(`/api/v1/events/${id}/speakers`, payload);
	} else {
		response = await apiClient.post(`/api/v1/events/${id}/speakers`, payload, {
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return response.data?.data ?? null;
};

export const removeEventSpeaker = async (id, index) => {
	if (!id) throw new Error('Event id is required');
	if (typeof index === 'undefined' || index === null)
		throw new Error('speaker index is required');
	const response = await apiClient.delete(`/api/v1/events/${id}/speakers/${index}`);
	return response.data?.data ?? null;
};

// Resources

export const addEventResource = async (id, { title, url }) => {
	if (!id) throw new Error('Event id is required');
	if (!title || !url) throw new Error('title and url are required');
	const response = await apiClient.post(`/api/v1/events/${id}/resources`, { title, url });
	return response.data?.data ?? null;
};

export const removeEventResource = async (id, index) => {
	if (!id) throw new Error('Event id is required');
	if (typeof index === 'undefined' || index === null)
		throw new Error('resource index is required');
	const response = await apiClient.delete(`/api/v1/events/${id}/resources/${index}`);
	return response.data?.data ?? null;
};

// Co-organizers

export const addEventCoOrganizer = async (id, { name }) => {
	if (!id) throw new Error('Event id is required');
	if (!name) throw new Error('name is required');
	const response = await apiClient.post(`/api/v1/events/${id}/co-organizers`, { name });
	return response.data?.data ?? null;
};

export const removeEventCoOrganizerByIndex = async (id, index) => {
	if (!id) throw new Error('Event id is required');
	if (typeof index === 'undefined' || index === null) throw new Error('index is required');
	const response = await apiClient.delete(`/api/v1/events/${id}/co-organizers/${index}`);
	return response.data?.data ?? null;
};

export const removeEventCoOrganizerByName = async (id, name) => {
	if (!id) throw new Error('Event id is required');
	if (!name) throw new Error('name is required');
	const response = await apiClient.delete(
		`/api/v1/events/${id}/co-organizers/name/${encodeURIComponent(name)}`
	);
	return response.data?.data ?? null;
};
