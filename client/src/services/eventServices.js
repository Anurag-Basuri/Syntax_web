import { apiClient, publicClient } from './api.js';

// Generic request wrapper to handle errors
const request = async (fn) => {
	try {
		const res = await fn();
		return res;
	} catch (err) {
		// Normalize axios errors
		if (err?.response) {
			const payload = err.response.data ?? {};
			const message =
				payload.message || payload.error || err.response.statusText || err.message;
			const error = new Error(message);
			error.status = err.response.status;
			error.payload = payload;
			throw error;
		}
		// Non-HTTP or cancellation
		throw err;
	}
};

// Normalize pagination responses from various endpoints
const normalizePagination = (axiosResponse) => {
	const payload = axiosResponse?.data ?? {};
	const data = payload.data ?? payload;
	let docs = [];
	let meta = {};

	// payload.data could be an array, an object with docs, or pagination wrapper
	if (Array.isArray(payload.data)) {
		docs = payload.data;
		meta = payload.pagination || payload.meta || {};
	} else if (payload.data && Array.isArray(payload.data.docs)) {
		docs = payload.data.docs;
		meta = payload.pagination ?? payload.data.pagination ?? payload.data.meta ?? {};
	} else if (Array.isArray(data.docs)) {
		docs = data.docs;
		meta = data.pagination ?? data.meta ?? payload.pagination ?? {};
	} else if (Array.isArray(data)) {
		docs = data;
		meta = payload.pagination ?? payload.meta ?? {};
	} else {
		// fallback: wrap single item
		docs = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
		meta = payload.pagination ?? payload.meta ?? {};
	}

	// Normalize meta defaults
	const normalizedMeta = {
		totalDocs: typeof meta.totalDocs !== 'undefined' ? meta.totalDocs : meta.total || 0,
		page: typeof meta.page !== 'undefined' ? meta.page : meta.currentPage || 1,
		limit: typeof meta.limit !== 'undefined' ? meta.limit : meta.pageSize || docs.length,
		totalPages:
			typeof meta.totalPages !== 'undefined'
				? meta.totalPages
				: Math.ceil(
						(meta.totalDocs || meta.total || docs.length) /
							(meta.limit || docs.length || 1)
				  ),
		hasPrevPage: !!meta.hasPrevPage,
		hasNextPage: !!meta.hasNextPage,
		prevPage: meta.prevPage ?? null,
		nextPage: meta.nextPage ?? null,
		raw: payload,
	};

	return { docs, ...normalizedMeta };
};

// Sanitize and validate query parameters for event listing
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

const encodeSegment = (v) => encodeURIComponent(String(v));

/**
 * Public API methods
 */

// GET /events (public) - supports pagination/filtering
const getAllEvents = async (params = {}, { signal } = {}) => {
	const sanitized = sanitizeParams(params);
	return request(() =>
		publicClient.get('/api/v1/events', {
			params: sanitized,
			signal,
		})
	).then(normalizePagination);
};

// GET /events/:id (public)
const getEventById = async (id, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	const url = `/api/v1/events/${encodeSegment(id)}`;
	return request(() => publicClient.get(url, { signal })).then((res) => res.data?.data ?? null);
};

// GET /events/:id/public (public sanitized)
const getPublicEventDetails = async (id, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	const url = `/api/v1/events/${encodeSegment(id)}/public`;
	return request(() => publicClient.get(url, { signal })).then((res) => res.data?.data ?? null);
};

// POST /events (admin) - accepts FormData OR plain object
const createEvent = async (payload, { signal } = {}) => {
	if (!payload) throw new Error('Payload is required');
	const config = { signal };

	// Let browser/axios set Content-Type when sending FormData
	if (!(payload instanceof FormData)) {
		config.headers = { 'Content-Type': 'application/json' };
	}

	return request(() => apiClient.post('/api/v1/events', payload, config)).then(
		(res) => res.data?.data ?? null
	);
};

// PATCH /events/:id/details (admin)
const updateEventDetails = async (id, updateData, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (!updateData) throw new Error('updateData is required');
	const url = `/api/v1/events/${encodeSegment(id)}/details`;
	const config = { signal };

	// If sending JSON ensure proper header; if FormData, allow axios to set header
	if (!(updateData instanceof FormData)) config.headers = { 'Content-Type': 'application/json' };

	return request(() => apiClient.patch(url, updateData, config)).then(
		(res) => res.data?.data ?? null
	);
};

// DELETE /events/:id (admin)
const deleteEvent = async (id, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	const url = `/api/v1/events/${encodeSegment(id)}`;
	return request(() => apiClient.delete(url, { signal })).then((res) =>
		res.status === 204 ? null : res.data ?? null
	);
};

// GET /events/admin/statistics (admin)
const getEventStats = async ({ signal } = {}) => {
	return request(() => apiClient.get('/api/v1/events/admin/statistics', { signal })).then(
		(res) => res.data?.data ?? null
	);
};

// GET /events/:id/registrations (admin)
const getEventRegistrations = async (id, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	const url = `/api/v1/events/${encodeSegment(id)}/registrations`;
	return request(() => apiClient.get(url, { signal })).then((res) => res.data?.data ?? []);
};

// POST /events/:id/posters (admin) - single file field "poster" (FormData)
const addEventPoster = async (id, formData, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (!(formData instanceof FormData)) throw new Error('FormData with poster file is required');
	const url = `/api/v1/events/${encodeSegment(id)}/posters`;
	return request(() => apiClient.post(url, formData, { signal })).then(
		(res) => res.data?.data ?? null
	);
};

// DELETE /events/:id/posters/:publicId (admin)
const removeEventPoster = async (id, publicId, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (!publicId) throw new Error('publicId is required');
	const url = `/api/v1/events/${encodeSegment(id)}/posters/${encodeSegment(publicId)}`;
	return request(() => apiClient.delete(url, { signal })).then((res) => res.data ?? null);
};

// Partners

// POST /events/:id/partners (admin) - FormData or JSON
const addEventPartner = async (id, payload, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (!payload) throw new Error('payload is required');
	const url = `/api/v1/events/${encodeSegment(id)}/partners`;
	const config = { signal };
	if (!(payload instanceof FormData)) config.headers = { 'Content-Type': 'application/json' };
	return request(() => apiClient.post(url, payload, config)).then(
		(res) => res.data?.data ?? null
	);
};

const removeEventPartner = async (id, partnerId, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (!partnerId) throw new Error('partnerId is required');
	const url = `/api/v1/events/${encodeSegment(id)}/partners/${encodeSegment(partnerId)}`;
	return request(() => apiClient.delete(url, { signal })).then((res) => res.data ?? null);
};

// Speakers

const addEventSpeaker = async (id, payload, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (!payload) throw new Error('payload is required');
	const url = `/api/v1/events/${encodeSegment(id)}/speakers`;
	const config = { signal };
	if (!(payload instanceof FormData)) config.headers = { 'Content-Type': 'application/json' };
	return request(() => apiClient.post(url, payload, config)).then(
		(res) => res.data?.data ?? null
	);
};

const removeEventSpeaker = async (id, index, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (typeof index === 'undefined' || index === null)
		throw new Error('speaker index is required');
	const url = `/api/v1/events/${encodeSegment(id)}/speakers/${encodeSegment(index)}`;
	return request(() => apiClient.delete(url, { signal })).then((res) => res.data?.data ?? null);
};

// Resources

const addEventResource = async (id, { title, url }, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (!title || !url) throw new Error('title and url are required');
	const endpoint = `/api/v1/events/${encodeSegment(id)}/resources`;
	return request(() => apiClient.post(endpoint, { title, url }, { signal })).then(
		(res) => res.data?.data ?? null
	);
};

const removeEventResource = async (id, index, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (typeof index === 'undefined' || index === null)
		throw new Error('resource index is required');
	const url = `/api/v1/events/${encodeSegment(id)}/resources/${encodeSegment(index)}`;
	return request(() => apiClient.delete(url, { signal })).then((res) => res.data?.data ?? null);
};

// Co-organizers

const addEventCoOrganizer = async (id, { name }, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (!name) throw new Error('name is required');
	const url = `/api/v1/events/${encodeSegment(id)}/co-organizers`;
	return request(() => apiClient.post(url, { name }, { signal })).then(
		(res) => res.data?.data ?? null
	);
};

const removeEventCoOrganizerByIndex = async (id, index, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (typeof index === 'undefined' || index === null) throw new Error('index is required');
	const url = `/api/v1/events/${encodeSegment(id)}/co-organizers/${encodeSegment(index)}`;
	return request(() => apiClient.delete(url, { signal })).then((res) => res.data?.data ?? null);
};

const removeEventCoOrganizerByName = async (id, name, { signal } = {}) => {
	if (!id) throw new Error('Event id is required');
	if (!name) throw new Error('name is required');
	const url = `/api/v1/events/${encodeSegment(id)}/co-organizers/name/${encodeSegment(name)}`;
	return request(() => apiClient.delete(url, { signal })).then((res) => res.data?.data ?? null);
};

// Export all methods at once
export {
	getAllEvents,
	getEventById,
	getPublicEventDetails,
	createEvent,
	updateEventDetails,
	deleteEvent,
	getEventStats,
	getEventRegistrations,
	addEventPoster,
	removeEventPoster,
	addEventPartner,
	removeEventPartner,
	addEventSpeaker,
	removeEventSpeaker,
	addEventResource,
	removeEventResource,
	addEventCoOrganizer,
	removeEventCoOrganizerByIndex,
	removeEventCoOrganizerByName,
};
