import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getAllContacts as svcGetAllContacts,
	getContactById as svcGetContactById,
	updateContactStatus as svcUpdateContactStatus,
	deleteContact as svcDeleteContact,
	bulkDeleteContacts as svcBulkDeleteContacts,
	getContactStats as svcGetContactStats,
} from '../services/contactServices.js';

// Fetch paginated contacts on-demand (returns a callable function)
export const useGetAllContacts = () => {
	const queryClient = useQueryClient();

	const {
		mutateAsync: fetchAll,
		isLoading,
		error,
		reset,
	} = useMutation({
		mutationFn: (params) => svcGetAllContacts(params),
		onSuccess: (data, params) => {
			// prime cache for this params set (useful if other hooks read the same key)
			const key = ['contacts', JSON.stringify(params)];
			queryClient.setQueryData(key, data);
		},
	});

	// getAllContacts(params) -> resolves to normalized paginated object
	const getAllContacts = async (params) => {
		return await fetchAll(params);
	};

	return {
		getAllContacts,
		loading: isLoading,
		error: error?.message || null,
		reset,
	};
};

// Fetch a single contact by id (on-demand)
export const useGetContactById = () => {
	const [id, setId] = useState(null);
	const query = useQuery({
		queryKey: ['contact', id],
		queryFn: () => svcGetContactById(id),
		enabled: !!id,
		staleTime: 30_000,
		cacheTime: 5 * 60_000,
	});

	const getContactById = async (contactId) => {
		setId(contactId);
		// wait for query to fetch
		return query.refetch();
	};

	const reset = () => setId(null);

	return {
		getContactById,
		contact: query.data ?? null,
		loading: query.isLoading || query.isFetching,
		error: query.error?.message || null,
		reset,
	};
};

// Mark contact as resolved
export const useMarkContactAsResolved = () => {
	const queryClient = useQueryClient();
	const { mutateAsync, isLoading, error, reset } = useMutation({
		mutationFn: (id) => svcUpdateContactStatus(id, 'resolved'),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['contacts'] });
		},
	});

	const markAsResolved = async (id) => {
		return await mutateAsync(id);
	};

	return {
		markAsResolved,
		loading: isLoading,
		error: error?.message || null,
		reset,
	};
};

// Delete single contact
export const useDeleteContact = () => {
	const queryClient = useQueryClient();
	const { mutateAsync, isLoading, error, reset } = useMutation({
		mutationFn: (id) => svcDeleteContact(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
	});

	const deleteContact = async (id) => {
		return await mutateAsync(id);
	};

	return {
		deleteContact,
		loading: isLoading,
		error: error?.message || null,
		reset,
	};
};

// Bulk delete (admin)
export const useBulkDeleteContacts = () => {
	const queryClient = useQueryClient();
	const { mutateAsync, isLoading, error, reset } = useMutation({
		mutationFn: (ids) => svcBulkDeleteContacts(ids),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
	});

	return {
		bulkDeleteContacts: mutateAsync,
		loading: isLoading,
		error: error?.message || null,
		reset,
	};
};

// Contact stats
export const useContactStats = () => {
	return useQuery({
		queryKey: ['contactStats'],
		queryFn: svcGetContactStats,
		staleTime: 60_000,
	});
};
