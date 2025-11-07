import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getAllApplications,
	getApplicationById,
	getApplicationStats,
	updateApplicationStatus,
	deleteApplication,
} from '../services/applyServices.js';
import { toast } from 'react-hot-toast'; // Example: Import a toast library

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

	const { mutate: updateStatus, isPending: isUpdating } = useMutation({
		mutationFn: ({ id, status }) => updateApplicationStatus(id, status),
		onSuccess: (data, { id }) => {
			toast.success('Application status updated!');
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			queryClient.invalidateQueries({ queryKey: ['application', id] });
			queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
		},
		onError: (error) => {
			toast.error(error.message);
			console.error('Failed to update status:', error);
		},
	});

	const { mutate: removeApplication, isPending: isDeleting } = useMutation({
		mutationFn: deleteApplication,
		onSuccess: () => {
			toast.success('Application deleted.');
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
		},
		onError: (error) => {
			toast.error(error.message);
			console.error('Failed to delete application:', error);
		},
	});

	return { updateStatus, isUpdating, removeApplication, isDeleting };
};
