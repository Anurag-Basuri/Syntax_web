import { apiClient, publicClient } from './api.js';

// Submits a contact form message.
export const sendContactMessage = async (contactData) => {
	try {
		const response = await publicClient.post('/api/v1/contact/send', contactData);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to send message.');
	}
};

// Fetches statistics about contact messages (Admin only).
export const getContactStats = async () => {
	try {
		const response = await apiClient.get('/api/v1/contact/stats');
		// Normalize to expected shape
		return response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch contact stats.');
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

// Fetches all contact messages with pagination (Admin only).
export const getAllContacts = async (params) => {
	try {
		const response = await apiClient.get('/api/v1/contact', { params });
		const payload = response.data?.data ?? response.data;
		// Return normalized paginated object always
		return normalizePaginated(payload, params);
	} catch (error) {
		const msg = error.response?.data?.message ?? error.message ?? 'Failed to fetch contacts.';
		throw new Error(msg);
	}
};

// Fetches a single contact message by ID (Admin only).
export const getContactById = async (id) => {
	try {
		const response = await apiClient.get(`/api/v1/contact/${id}`);
		// API returns { data: { contact } } - return the contact directly
		return response.data?.data?.contact ?? response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch contact details.');
	}
};

// Updates the status of a contact message (Admin only).
export const updateContactStatus = async (id, status) => {
	try {
		const response = await apiClient.patch(`/api/v1/contact/${id}/status`, { status });
		return response.data?.data?.contact ?? response.data?.data ?? response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to update contact status.');
	}
};

// Deletes a single contact message by ID (Admin only).
export const deleteContact = async (id) => {
	try {
		const response = await apiClient.delete(`/api/v1/contact/${id}`);
		return response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to delete contact.');
	}
};

// Deletes multiple contact messages in bulk (Admin only).
export const bulkDeleteContacts = async (ids) => {
	try {
		const response = await apiClient.delete('/api/v1/contact', { data: { ids } });
		return response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to bulk delete contacts.');
	}
};
