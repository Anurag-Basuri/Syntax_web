import { apiClient, publicClient } from './api.js';

// Submits a new application for club membership.
export const submitApplication = async (applicationData) => {
	try {
		const response = await publicClient.post('/api/v1/apply', applicationData);
		return response.data.data ?? response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to submit application.');
	}
};

// Fetches statistics about all applications (Admin only).
export const getApplicationStats = async () => {
	try {
		const response = await apiClient.get('/api/v1/apply/stats');
		// Normalise: return the inner stats object when present
		const payload = response.data?.data ?? response.data;
		// If server returned { stats: { ... } }, return the stats object directly
		return payload?.stats ?? payload;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch application stats.');
	}
};

// Fetches all applications with filtering and pagination (Admin only).
export const getAllApplications = async (params) => {
	try {
		const response = await apiClient.get('/api/v1/apply', { params });
		// Normalise to return response.data.data if present (ApiResponse wrapper) otherwise full response
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch applications.');
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
		throw new Error(error.message || 'Failed to update application status.');
	}
};

// Marks an application as seen by an admin (Admin only).
export const markApplicationAsSeen = async (id) => {
	try {
		const response = await apiClient.patch(`/api/v1/apply/${id}/seen`);
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to mark application as seen.');
	}
};

// Updates the status of multiple applications in bulk (Admin only).
export const bulkUpdateApplicationStatus = async (ids, status) => {
	try {
		const response = await apiClient.patch('/api/v1/apply/bulk/status', { ids, status });
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to perform bulk update.');
	}
};

// Deletes a single application (Admin only).
export const deleteApplication = async (id) => {
	try {
		const response = await apiClient.delete(`/api/v1/apply/${id}`);
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to delete application.');
	}
};
