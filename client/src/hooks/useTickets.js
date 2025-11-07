import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	registerForEvent,
	getTicketById,
	getTicketsByEvent,
	updateTicketStatus,
} from '../services/ticketServices.js';
import { toast } from 'react-hot-toast';

// Hook for the public event registration form
export const useRegisterForEvent = () => {
	return useMutation({
		mutationFn: registerForEvent,
		onSuccess: () => {
			toast.success('Successfully registered for the event!');
		},
		onError: (error) => {
			toast.error(error.message);
			console.error('Failed to register:', error);
		},
	});
};

// Hook to fetch a single ticket by its public ID (for ticket verification page)
export const useTicket = (ticketId) => {
	return useQuery({
		queryKey: ['ticket', ticketId],
		queryFn: () => getTicketById(ticketId),
		enabled: !!ticketId,
	});
};

// Hook for admins to get all tickets for a specific event
export const useEventTickets = (eventId) => {
	return useQuery({
		queryKey: ['tickets', eventId],
		queryFn: () => getTicketsByEvent({ eventId }),
		enabled: !!eventId,
	});
};

// Hook for admins to update a ticket's status (e.g., mark as 'used')
export const useUpdateTicketStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ ticketId, status }) => updateTicketStatus(ticketId, status),
		// Optimistically update the ticket status for a snappy UI
		onMutate: async ({ ticketId, status }) => {
			await queryClient.cancelQueries({ queryKey: ['tickets'] });
			const previousTickets = queryClient.getQueryData(['tickets']);
			queryClient.setQueryData(['tickets'], (old) =>
				old.map((ticket) => (ticket._id === ticketId ? { ...ticket, status } : ticket))
			);
			return { previousTickets };
		},
		onError: (err, newStatus, context) => {
			toast.error('Failed to update status. Reverting changes.');
			queryClient.setQueryData(['tickets'], context.previousTickets);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['tickets'] });
		},
	});
};
