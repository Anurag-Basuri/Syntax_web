import { apiClient, publicClient } from './api.js';

// ==================================================
// Public Member Services
// ==================================================

// Get all members (public)
export const getAllMembers = async () => {
	try {
		const response = await publicClient.get('/api/v1/members/getall');
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch members.');
	}
};

// Get Leaders (public)
export const getLeaders = async () => {
	try {
		const response = await publicClient.get('/api/v1/members/getleaders');
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch leaders.');
	}
};

// Send Password Reset Email
export const sendResetPasswordEmail = async (data) => {
	try {
		const response = await publicClient.post('/api/v1/members/send-reset-email', data);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to send password reset email.');
	}
};

// Reset Password
export const resetPassword = async (data) => {
	try {
		const response = await publicClient.post('/api/v1/members/reset-password', data);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to reset password.');
	}
};

// ==================================================
// Authenticated Member Services
// ==================================================

// Update Current Member Profile
export const updateMyProfile = async (memberId, data) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/update`, data);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to update profile.');
	}
};

// Upload Profile Picture
export const uploadProfilePicture = async (memberId, formData) => {
	try {
		const response = await apiClient.post(
			`/api/v1/members/${memberId}/profile-picture`,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to upload profile picture.');
	}
};

// Upload Resume
export const uploadResume = async (memberId, formData) => {
	try {
		const response = await apiClient.post(`/api/v1/members/${memberId}/resume`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to upload resume.');
	}
};

// ==================================================
// Admin-Only Member Services
// ==================================================

// Update Member by Admin
export const updateMemberByAdmin = async (memberId, data) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/admin`, data);
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to update member details.');
	}
};

// Ban a member. (Admin only)
export const banMember = async (memberId, data) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/ban`, data);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to ban member.');
	}
};

// Unban a member. (Admin only)
export const unbanMember = async (memberId) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/unban`);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to unban member.');
	}
};

// Remove a member. (Admin only)
export const removeMember = async (memberId, data) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/remove`, data);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to remove member.');
	}
};
