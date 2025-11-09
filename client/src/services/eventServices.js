import { apiClient, publicClient } from './api.js';

// Fetches all events with filtering and pagination.
export const getAllEvents = async (params) => {
	try {
		const response = await publicClient.get('/api/v1/events', { params });
		// Return the paginated payload only
		return response.data.data; // { docs, totalDocs, page, totalPages, ... }
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch events.');
	}
};

// Fetches a single event by its ID.
export const getEventById = async (id) => {
	try {
		const response = await publicClient.get(`/api/v1/events/${id}`);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch event details.');
	}
};

// Creates a new event (Admin only).
export const createEvent = async (formData) => {
	try {
		const response = await apiClient.post('/api/v1/events', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to create event.');
	}
};

// Updates an event's details (Admin only).
export const updateEventDetails = async (id, updateData) => {
	try {
		const response = await apiClient.patch(`/api/v1/events/${id}/details`, updateData);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to update event details.');
	}
};

// Deletes an event (Admin only).
export const deleteEvent = async (id) => {
	try {
		const response = await apiClient.delete(`/api/v1/events/${id}`);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to delete event.');
	}
};

// Fetches statistics about all events (Admin only).
export const getEventStats = async () => {
	try {
		const response = await apiClient.get('/api/v1/events/admin/statistics');
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch event stats.');
	}
};

// Fetches registrations for a specific event (Admin only).
export const getEventRegistrations = async (id) => {
	try {
		const response = await apiClient.get(`/api/v1/events/${id}/registrations`);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch event registrations.');
	}
};

// Adds a poster (Admin only).
export const addEventPoster = async (id, formData) => {
	try {
		const response = await apiClient.post(`/api/v1/events/${id}/posters`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to add poster.');
	}
};

// Removes a poster (Admin only).
export const removeEventPoster = async (id, publicId) => {
	try {
		const response = await apiClient.delete(`/api/v1/events/${id}/posters/${publicId}`);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to remove poster.');
	}
};
