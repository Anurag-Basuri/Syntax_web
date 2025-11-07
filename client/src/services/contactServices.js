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
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch contact stats.');
	}
};

// Fetches all contact messages with pagination (Admin only).
export const getAllContacts = async (params) => {
	try {
		const response = await apiClient.get('/api/v1/contact', { params });
		return response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch contacts.');
	}
};

// Fetches a single contact message by ID (Admin only).
export const getContactById = async (id) => {
	try {
		const response = await apiClient.get(`/api/v1/contact/${id}`);
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch contact details.');
	}
};

// Updates the status of a contact message (Admin only).
export const updateContactStatus = async (id, status) => {
	try {
		const response = await apiClient.patch(`/api/v1/contact/${id}/status`, { status });
		return response.data.data;
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
