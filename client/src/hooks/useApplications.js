import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getAllApplications,
	getApplicationById,
	getApplicationStats,
	updateApplicationStatus,
	deleteApplication,
} from '../services/applyServices.js';
import { toast } from 'react-hot-toast';

// Hook to fetch a paginated list of all applications
export const useApplications = (params) => {
	return useQuery({
		queryKey: ['applications', params],
		queryFn: () => getAllApplications(params),
		keepPreviousData: true,
	});
};

// Hook to fetch a single application's details
export const useApplication = (id) => {
	return useQuery({
		queryKey: ['application', id],
		queryFn: () => getApplicationById(id),
		enabled: !!id,
	});
};

// Hook to fetch application statistics
export const useApplicationStats = () => {
	return useQuery({
		queryKey: ['applicationStats'],
		queryFn: getApplicationStats,
	});
};

// Hook to manage application mutations (update status, delete)
export const useManageApplication = () => {
	const queryClient = useQueryClient();

	const updateStatusMutation = useMutation({
		mutationFn: ({ id, status }) => updateApplicationStatus(id, status),
		onSuccess: (data, variables) => {
			toast.success('Application status updated!');
			// variables contains the object passed to mutate: { id, status }
			if (variables?.id) {
				queryClient.invalidateQueries({ queryKey: ['application', variables.id] });
			}
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
		},
		onError: (error) => {
			toast.error(error.message);
			console.error('Failed to update status:', error);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id) => deleteApplication(id),
		onSuccess: (_data, id) => {
			toast.success('Application deleted.');
			// id is the variable passed to mutate
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
			if (id) queryClient.invalidateQueries({ queryKey: ['application', id] });
		},
		onError: (error) => {
			toast.error(error.message);
			console.error('Failed to delete application:', error);
		},
	});

	return {
		updateStatus: updateStatusMutation.mutate,
		updateStatusAsync: updateStatusMutation.mutateAsync,
		isUpdating: updateStatusMutation.isLoading,
		removeApplication: deleteMutation.mutate,
		removeApplicationAsync: deleteMutation.mutateAsync,
		isDeleting: deleteMutation.isLoading,
	};
};
