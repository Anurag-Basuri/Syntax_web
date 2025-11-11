import { apiClient, publicClient } from './api.js';

// Registers a user for an event and creates a ticket.
export const registerForEvent = async (registrationData) => {
	try {
		const response = await publicClient.post('/api/v1/tickets/register', registrationData);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to register for the event.');
	}
};

// Checks if an email or LPU ID is already registered for a specific event.
export const checkTicketAvailability = async (checkData) => {
	try {
		const response = await publicClient.post('/api/v1/tickets/check-availability', checkData);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to check availability.');
	}
};

// Fetches a ticket by its unique ticket ID.
export const getTicketById = async (ticketId) => {
	try {
		const response = await publicClient.get(`/api/v1/tickets/${ticketId}`);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch ticket.');
	}
};

// Fetches tickets with filtering by event (Admin only).
export const getTicketsByEvent = async (params = {}) => {
	try {
		// Ensure we request enough items to show all tickets/graphs in the admin UI.
		// You can tweak this value if you expect more tickets.
		const paramsWithLimit = { ...params, limit: params.limit ?? 10000 };
		const response = await apiClient.get('/api/v1/tickets', { params: paramsWithLimit });
		return response.data;
	} catch (error) {
		// Preserve any server message when possible
		const msg = error.response?.data?.message || error.message || 'Failed to fetch tickets.';
		throw new Error(msg);
	}
};

// Updates a ticket's status (Admin only).
export const updateTicketStatus = async (ticketId, status) => {
	try {
		const response = await apiClient.patch(`/api/v1/tickets/${ticketId}/status`, { status });
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to update ticket status.');
	}
};

// Deletes a ticket (Admin only).
export const deleteTicket = async (ticketId) => {
	try {
		const response = await apiClient.delete(`/api/v1/tickets/${ticketId}`);
		return response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to delete ticket.');
	}
};
