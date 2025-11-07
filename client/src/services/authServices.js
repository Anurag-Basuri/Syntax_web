import { apiClient, publicClient } from './api.js';
import { setToken, removeToken } from '../utils/handleTokens.js';

// Registers a new member (Admin only).
export const memberRegister = async (data) => {
	try {
		const response = await apiClient.post('/api/v1/members/register', data);
		return response.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to register member.');
	}
};

// Logs in a member.
export const memberLogin = async (data) => {
	try {
		const response = await publicClient.post('/api/v1/members/login', data);
		const { accessToken, refreshToken, user } = response.data.data;
		setToken({ accessToken, refreshToken });
		return user;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to log in.');
	}
};

// Logs out the currently authenticated member.
export const memberLogout = async () => {
	try {
		await apiClient.post('/api/v1/members/logout');
		removeToken();
	} catch (error) {
		throw new Error(error.message || 'Failed to log out.');
	}
};

// Registers a new admin.
export const adminRegister = async (data) => {
	try {
		const response = await publicClient.post('/api/v1/admin/register', data);
		const { accessToken, refreshToken, user } = response.data.data;
		setToken({ accessToken, refreshToken });
		return user;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to register admin.');
	}
};

// Logs in an admin.
export const adminLogin = async (data) => {
	try {
		const response = await publicClient.post('/api/v1/admin/login', data);
		const { accessToken, refreshToken, user } = response.data.data;
		setToken({ accessToken, refreshToken });
		return user;
	} catch (error) {
		throw new Error(error.response?.data?.message || 'Failed to log in.');
	}
};

// Logs out the currently authenticated admin.
export const adminLogout = async () => {
	try {
		await apiClient.post('/api/v1/admin/logout');
		removeToken();
	} catch (error) {
		throw new Error(error.message || 'Failed to log out.');
	}
};

// Fetches the profile of the currently authenticated admin.
export const getCurrentAdmin = async () => {
	try {
		const response = await apiClient.get('/api/v1/admin/me');
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch admin profile.');
	}
};

// Fetches the profile of the currently authenticated member.
export const getCurrentMember = async () => {
	try {
		const response = await apiClient.get('/api/v1/members/me');
		return response.data.data;
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch member profile.');
	}
};
