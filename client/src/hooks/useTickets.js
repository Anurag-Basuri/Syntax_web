import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
	getTicketsByEvent as getTicketsByEventService,
	updateTicketStatus as updateTicketStatusService,
	deleteTicket as deleteTicketService,
} from '../services/ticketServices.js';

// Hook for admins to get tickets for a specific event (imperative fetch)
export const useGetTicketsByEvent = () => {
	const [tickets, setTickets] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const reset = useCallback(() => {
		setError(null);
	}, []);

	const getTicketsByEvent = useCallback(async (eventId, token) => {
		if (!eventId) {
			setTickets([]);
			return [];
		}
		setLoading(true);
		setError(null);
		try {
			const params = { eventId };
			const response = await getTicketsByEventService(params, token);
			// response may be { data: {...} } or full payload depending on service
			const payload = response?.data ?? response ?? {};
			// common shapes: payload.docs, payload.results, payload (array)
			let list = [];
			if (Array.isArray(payload)) list = payload;
			else if (Array.isArray(payload.docs)) list = payload.docs;
			else if (Array.isArray(payload.results)) list = payload.results;
			else list = [];
			setTickets(list);
			return list;
		} catch (err) {
			const msg = err?.response?.data?.message || err?.message || String(err);
			setError(msg);
			setTickets([]);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		getTicketsByEvent,
		tickets,
		loading,
		error,
		reset,
	};
};

// Hook to update a ticket (admin). Exposes updateTicket(ticketId, data, token)
export const useUpdateTicket = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const reset = useCallback(() => {
		setError(null);
	}, []);

	const updateTicket = useCallback(async (ticketId, data = {}, token) => {
		if (!ticketId) {
			throw new Error('Missing ticket id');
		}
		setLoading(true);
		setError(null);
		try {
			// Normalize payloads for backend:
			// - If caller sends { isUsed: boolean } -> translate to status string
			// - If caller sends { status: 'used' } -> send status string
			// - If caller passes a raw string, treat as status
			let statusPayload = null;
			if (typeof data === 'string') {
				statusPayload = data;
			} else if (typeof data === 'object') {
				if ('isUsed' in data) {
					statusPayload = data.isUsed ? 'used' : 'active';
				} else if ('status' in data && typeof data.status === 'string') {
					statusPayload = data.status;
				}
			}
			if (statusPayload === null) {
				// fallback: try to send data as-is (best-effort)
				await updateTicketStatusService(ticketId, data, token);
			} else {
				await updateTicketStatusService(ticketId, statusPayload, token);
			}
			toast.success('Ticket updated.');
		} catch (err) {
			const msg = err?.response?.data?.message || err?.message || String(err);
			setError(msg);
			toast.error(msg || 'Failed to update ticket');
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	return { updateTicket, loading, error, reset };
};

// Hook to delete a ticket (admin). Exposes deleteTicket(ticketId, token)
export const useDeleteTicket = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const reset = useCallback(() => {
		setError(null);
	}, []);

	const deleteTicket = useCallback(async (ticketId, token) => {
		if (!ticketId) {
			throw new Error('Missing ticket id');
		}
		setLoading(true);
		setError(null);
		try {
			await deleteTicketService(ticketId, token);
			toast.success('Ticket deleted.');
		} catch (err) {
			const msg = err?.response?.data?.message || err?.message || String(err);
			setError(msg);
			toast.error(msg || 'Failed to delete ticket');
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	return { deleteTicket, loading, error, reset };
};
