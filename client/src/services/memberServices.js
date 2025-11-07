import { apiClient, publicClient } from './api.js';

// ==================================================
// Public Member Services
// ==================================================

// Fetches a list of all members.
export const getAllMembers = async () => {
	try {
		const response = await publicClient.get('/api/v1/members/getall');
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch members.');
	}
};

// Fetches a list of all members with leadership roles.
export const getLeaders = async () => {
	try {
		const response = await publicClient.get('/api/v1/members/getleaders');
		return response.data.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to fetch leaders.');
	}
};

// Sends a password reset email to the user.
export const sendResetPasswordEmail = async (data) => {
	try {
		const response = await publicClient.post('/api/v1/members/send-reset-email', data);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to send password reset email.');
	}
};

// Resets a member's password using their LPU ID.
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

// Updates the profile of the currently logged-in member.
export const updateMyProfile = async (memberId, data) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/update`, data);
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to update profile.');
	}
};

// Uploads a profile picture for the specified member.
export const uploadProfilePicture = async (memberId, formData) => {
	try {
		const response = await apiClient.post(
			`/api/v1/members/${memberId}/profile-picture`,
			formData,
			{
				headers: { 'Content-Type': 'multipart/form-data' },
			}
		);
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to upload profile picture.');
	}
};

// Uploads a resume for the specified member.
export const uploadResume = async (memberId, formData) => {
	try {
		const response = await apiClient.post(`/api/v1/members/${memberId}/resume`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to upload resume.');
	}
};

// ==================================================
// Admin-Only Member Services
// ==================================================

// Updates any member's profile information (Admin only).
export const updateMemberByAdmin = async (memberId, data) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/admin`, data);
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to update member details.');
	}
};

// Bans a member (Admin only).
export const banMember = async (memberId, data) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/ban`, data);
		return response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to ban member.');
	}
};

// Unbans a member (Admin only).
export const unbanMember = async (memberId) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/unban`);
		return response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to unban member.');
	}
};

// Marks a member as removed from the club (Admin only).
export const removeMember = async (memberId, data) => {
	try {
		const response = await apiClient.put(`/api/v1/members/${memberId}/remove`, data);
		return response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to remove member.');
	}
};
