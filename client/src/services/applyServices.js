import { apiClient, publicClient } from './api.js';

// Submits a new application for club membership.
export const submitApplication = async (applicationData) => {
	try {
		const response = await publicClient.post('/api/v1/apply', applicationData);
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to submit application.');
	}
};

// Fetches statistics about all applications (Admin only).
export const getApplicationStats = async () => {
	try {
		const response = await apiClient.get('/api/v1/apply/stats');
		const payload = response.data?.data ?? response.data;
		return payload?.stats ?? payload;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch application stats.');
	}
};

// Helper to normalize paginated responses into a stable shape
const normalizePaginated = (payload = {}, params = {}) => {
	const source = payload.docs ? payload : payload.data ?? payload;

	const docs = source.docs ?? (Array.isArray(source) ? source : []);
	const totalDocs = source.totalDocs ?? source.total ?? docs.length;
	const limit = source.limit ?? params.limit ?? 10;
	const page = source.page ?? source.currentPage ?? params.page ?? 1;
	const totalPages =
		source.totalPages ??
		(limit ? Math.ceil(totalDocs / limit) : Math.ceil(docs.length / (params.limit || 10)));

	return {
		docs,
		totalDocs,
		totalPages,
		page: Number(page),
		limit: Number(limit),
		hasNextPage: source.hasNextPage ?? page < totalPages,
		hasPrevPage: source.hasPrevPage ?? page > 1,
		_raw: payload,
	};
};

// Fetches all applications with filtering and pagination (Admin only).
export const getAllApplications = async (params = {}) => {
	try {
		const response = await apiClient.get('/api/v1/apply', { params });
		const payload = response.data?.data ?? response.data;
		// Return normalized paginated object always
		return normalizePaginated(payload, params);
	} catch (error) {
		// Surface server message when available
		const msg =
			error.response?.data?.message ?? error.message ?? 'Failed to fetch applications.';
		throw new Error(msg);
	}
};

// Fetches a single application by its ID (Admin only).
export const getApplicationById = async (id) => {
	try {
		const response = await apiClient.get(`/api/v1/apply/${id}`);
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch application details.');
	}
};

// Updates the status of a single application (Admin only).
export const updateApplicationStatus = async (id, status) => {
	try {
		const response = await apiClient.patch(`/api/v1/apply/${id}/status`, { status });
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to update application status.');
	}
};

// Marks an application as seen by an admin (Admin only).
export const markApplicationAsSeen = async (id) => {
	try {
		const response = await apiClient.patch(`/api/v1/apply/${id}/seen`);
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to mark application as seen.');
	}
};

// Updates the status of multiple applications in bulk (Admin only).
export const bulkUpdateApplicationStatus = async (ids, status) => {
	try {
		const response = await apiClient.patch('/api/v1/apply/bulk/status', { ids, status });
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to perform bulk update.');
	}
};

// Deletes a single application (Admin only).
export const deleteApplication = async (id) => {
	try {
		const response = await apiClient.delete(`/api/v1/apply/${id}`);
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to delete application.');
	}
};
