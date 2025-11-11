import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getAllMembers,
	getLeaders,
	updateMemberByAdmin,
	banMember,
	unbanMember,
	removeMember as removeMemberService,
} from '../services/memberServices.js';
import { toast } from 'react-hot-toast';

// Legacy / admin-friendly hook kept for pages that expect a simple list
export const useMembers = () => {
	return useQuery({
		queryKey: ['members'],
		queryFn: getAllMembers,
		staleTime: 60_000,
	});
};

// convenience hook returning only leaders array
export const useLeaders = () => {
	return useQuery({
		queryKey: ['leaders'],
		queryFn: async () => {
			const data = await getLeaders();
			return data?.members || []; // return array
		},
		staleTime: 60_000,
	});
};

export const useGetAllMembers = () => {
	const query = useQuery({
		queryKey: ['members'],
		queryFn: getAllMembers,
		staleTime: 60_000,
		refetchOnWindowFocus: false,
	});

	// Provide a friendly API compatible with existing components
	return {
		getAllMembers: query.refetch, // async refetch function
		members: query.data?.members ?? [], // consistent: array
		totalMembers: query.data?.totalMembers ?? query.data?.members?.length ?? 0,
		loading: query.isLoading,
		error: query.error,
	};
};

export const useBanMember = () => {
	const queryClient = useQueryClient();
	const {
		mutateAsync: mutateBan,
		isLoading,
		error,
		reset,
	} = useMutation({
		mutationFn: async ({ memberId, reason, reviewTime, token }) => {
			// forward params to service; service may ignore token if not needed
			return await banMember(memberId, { reason, reviewTime }, token);
		},
		onSuccess: () => {
			toast.success('Member banned.');
			queryClient.invalidateQueries({ queryKey: ['members'] });
		},
		onError: (err) => {
			toast.error(err?.message || 'Failed to ban member');
		},
	});

	const banMemberFn = async (id, reason, reviewTime, token) =>
		await mutateBan({ memberId: id, reason, reviewTime, token });

	return { banMember: banMemberFn, loading: isLoading, error, reset };
};

export const useUnbanMember = () => {
	const queryClient = useQueryClient();
	const {
		mutateAsync: mutateUnban,
		isLoading,
		error,
		reset,
	} = useMutation({
		mutationFn: async ({ memberId, token }) => {
			return await unbanMember(memberId, token);
		},
		onSuccess: () => {
			toast.success('Member unbanned.');
			queryClient.invalidateQueries({ queryKey: ['members'] });
		},
		onError: (err) => {
			toast.error(err?.message || 'Failed to unban member');
		},
	});

	const unbanMemberFn = async (id, token) => await mutateUnban({ memberId: id, token });

	return { unbanMember: unbanMemberFn, loading: isLoading, error, reset };
};

export const useRemoveMember = () => {
	const queryClient = useQueryClient();
	const {
		mutateAsync: mutateRemove,
		isLoading,
		error,
		reset,
	} = useMutation({
		mutationFn: async ({ memberId, reason, reviewTime, token }) => {
			return await removeMemberService(memberId, { reason, reviewTime }, token);
		},
		onSuccess: () => {
			toast.success('Member removed.');
			queryClient.invalidateQueries({ queryKey: ['members'] });
		},
		onError: (err) => {
			toast.error(err?.message || 'Failed to remove member');
		},
	});

	const removeMember = async (id, reason, reviewTime, token) =>
		await mutateRemove({ memberId: id, reason, reviewTime, token });

	return { removeMember, loading: isLoading, error, reset };
};

export const useUpdateMemberByAdmin = () => {
	const queryClient = useQueryClient();
	const {
		mutateAsync: mutateUpdate,
		isLoading,
		error,
		reset,
	} = useMutation({
		mutationFn: async ({ memberId, data, token }) => {
			return await updateMemberByAdmin(memberId, data, token);
		},
		onSuccess: () => {
			toast.success('Member updated.');
			queryClient.invalidateQueries({ queryKey: ['members'] });
		},
		onError: (err) => {
			toast.error(err?.message || 'Failed to update member');
		},
	});

	const updateMemberByAdminFn = async (id, data, token) =>
		await mutateUpdate({ memberId: id, data, token });

	return {
		updateMemberByAdmin: updateMemberByAdminFn,
		loading: isLoading,
		error,
		reset,
	};
};
