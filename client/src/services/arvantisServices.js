import { apiClient, publicClient } from './api.js';

/**
 * Helper: normalize API responses that may be paginated or plain.
 * Expected server shapes:
 * - { status, message, data: [...], pagination: { ... } }
 * - { status, message, data: { docs: [...], pagination... } }
 * - { docs: [...], totalDocs, page, totalPages, limit, ... } (already normalized)
 */
const normalizePagination = (raw) => {
	const payload = raw?.data ?? raw ?? {};
	// Case: server returned ApiResponse with data array + pagination object
	if (Array.isArray(payload.data) || Array.isArray(payload.docs)) {
		const docs = payload.data || payload.docs || [];
		const pagination = payload.pagination || payload;
		// pick standard keys with sensible defaults
		return {
			docs,
			totalDocs: pagination.totalDocs ?? pagination.total ?? docs.length,
			page: pagination.page ?? pagination.currentPage ?? 1,
			totalPages: pagination.totalPages ?? pagination.totalPages ?? 1,
			limit: pagination.limit ?? pagination.perPage ?? docs.length,
			hasPrevPage: !!pagination.hasPrevPage,
			hasNextPage: !!pagination.hasNextPage,
			prevPage: pagination.prevPage ?? null,
			nextPage: pagination.nextPage ?? null,
		};
	}

	// If server returned a single object in data (non-paginated)
	if (payload.data && !Array.isArray(payload.data)) {
		return { docs: [payload.data], totalDocs: 1, page: 1, totalPages: 1, limit: 1 };
	}

	// Fallback: try to use top-level docs
	if (Array.isArray(payload.docs)) {
		return {
			docs: payload.docs,
			totalDocs: payload.totalDocs ?? payload.docs.length,
			page: payload.page ?? 1,
			totalPages: payload.totalPages ?? 1,
			limit: payload.limit ?? payload.docs.length,
			hasPrevPage: !!payload.hasPrevPage,
			hasNextPage: !!payload.hasNextPage,
			prevPage: payload.prevPage ?? null,
			nextPage: payload.nextPage ?? null,
		};
	}

	// Empty fallback
	return { docs: [], totalDocs: 0, page: 1, totalPages: 0, limit: 0 };
};

const extractError = (err, fallback = 'Request failed') =>
	err?.response?.data?.message || err?.message || fallback;

// ==================================================
// Public Arvantis Services
// ==================================================

export const getArvantisLandingData = async () => {
	try {
		const response = await publicClient.get('/api/v1/arvantis/landing');
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to fetch landing page data.'));
	}
};

/**
 * Fetches a paginated list of all fests.
 * By default uses public client; set options.admin = true to call admin (authenticated) endpoint.
 * Returns normalized pagination: { docs, totalDocs, page, totalPages, limit, hasPrevPage, hasNextPage, prevPage, nextPage }
 */
export const getAllFests = async (params = {}, options = { admin: false }) => {
	try {
		const client = options.admin ? apiClient : publicClient;
		const response = await client.get('/api/v1/arvantis', { params });
		return normalizePagination(response);
	} catch (error) {
		throw new Error(extractError(error, 'Failed to fetch fests.'));
	}
};

export const getFestDetails = async (identifier, options = { admin: false }) => {
	try {
		const client = options.admin ? apiClient : publicClient;
		const response = await client.get(`/api/v1/arvantis/${identifier}`);
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to fetch fest details.'));
	}
};

// ==================================================
// Admin-Only Arvantis Services
// ==================================================

export const createFest = async (festData) => {
	try {
		// allow FormData or plain object
		const isForm = festData instanceof FormData;
		const response = await apiClient.post('/api/v1/arvantis', festData, {
			headers: isForm
				? { 'Content-Type': 'multipart/form-data' }
				: { 'Content-Type': 'application/json' },
		});
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to create fest.'));
	}
};

export const updateFestDetails = async (identifier, updateData) => {
	try {
		// route path is /:identifier/update
		const isForm = updateData instanceof FormData;
		const response = await apiClient.patch(
			`/api/v1/arvantis/${identifier}/update`,
			updateData,
			{
				headers: isForm
					? { 'Content-Type': 'multipart/form-data' }
					: { 'Content-Type': 'application/json' },
			}
		);
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to update fest details.'));
	}
};

export const deleteFest = async (identifier) => {
	try {
		const response = await apiClient.delete(`/api/v1/arvantis/${identifier}`);
		// server returns 204 with no body; still return success indicator
		return response.status === 204 ? { success: true } : response.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to delete fest.'));
	}
};

export const addPartner = async (identifier, formData) => {
	try {
		const response = await apiClient.post(`/api/v1/arvantis/${identifier}/partners`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to add partner.'));
	}
};

export const removePartner = async (identifier, partnerName) => {
	try {
		const response = await apiClient.delete(
			`/api/v1/arvantis/${identifier}/partners/${encodeURIComponent(partnerName)}`
		);
		return response.status === 204 ? { success: true } : response.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to remove partner.'));
	}
};

export const linkEventToFest = async (identifier, eventId) => {
	try {
		const response = await apiClient.post(`/api/v1/arvantis/${identifier}/events`, { eventId });
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to link event.'));
	}
};

export const unlinkEventFromFest = async (identifier, eventId) => {
	try {
		const response = await apiClient.delete(`/api/v1/arvantis/${identifier}/events/${eventId}`);
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to unlink event.'));
	}
};

export const updateFestPoster = async (identifier, formData) => {
	try {
		const response = await apiClient.patch(`/api/v1/arvantis/${identifier}/poster`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to update poster.'));
	}
};

export const addGalleryMedia = async (identifier, formData) => {
	try {
		const response = await apiClient.post(`/api/v1/arvantis/${identifier}/gallery`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to add gallery media.'));
	}
};

export const removeGalleryMedia = async (identifier, publicId) => {
	try {
		const response = await apiClient.delete(
			`/api/v1/arvantis/${identifier}/gallery/${publicId}`
		);
		return response.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to remove gallery media.'));
	}
};

export const exportFestsCSV = async () => {
	try {
		const response = await apiClient.get('/api/v1/arvantis/export/csv', {
			responseType: 'blob',
		});
		return response.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to export CSV.'));
	}
};

export const getFestAnalytics = async () => {
	try {
		const response = await apiClient.get('/api/v1/arvantis/analytics/overview');
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to fetch analytics.'));
	}
};

export const getFestStatistics = async () => {
	try {
		const response = await apiClient.get('/api/v1/arvantis/statistics/overview');
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to fetch statistics.'));
	}
};

export const generateFestReport = async (identifier) => {
	try {
		const response = await apiClient.get(`/api/v1/arvantis/reports/${identifier}`);
		return response.data.data;
	} catch (error) {
		throw new Error(extractError(error, 'Failed to generate report.'));
	}
};
