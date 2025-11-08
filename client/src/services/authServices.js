import { apiClient, publicClient } from './api.js';
import { setToken, removeToken } from '../utils/handleTokens.js';

// Helper function to extract error message from API responses
const getApiError = (error, fallbackMessage) => {
	const message = error?.response?.data?.message || error?.message || fallbackMessage;
	return new Error(message);
};

// =================================================================
// Member Authentication Services
// =================================================================

// Logs in a member.
export const memberLogin = async (credentials) => {
	try {
		const response = await publicClient.post('/api/v1/members/login', credentials);
		const { accessToken, refreshToken, user } = response.data.data;
		setToken({ accessToken, refreshToken });
		return user;
	} catch (error) {
		throw getApiError(error, 'Failed to log in.');
	}
};

// Logs out the currently authenticated member.
export const memberLogout = async () => {
	try {
		await apiClient.post('/api/v1/members/logout');
		removeToken();
	} catch (error) {
		// Even if the API call fails, we should clear the token to log the user out client-side.
		removeToken();
		throw getApiError(error, 'Failed to log out.');
	}
};

// Fetches the profile of the currently authenticated member.
export const getCurrentMember = async () => {
	try {
		const response = await apiClient.get('/api/v1/members/me');
		return response.data.data.user;
	} catch (error) {
		throw getApiError(error, 'Failed to fetch member profile.');
	}
};

// =================================================================
// Admin Authentication & Management Services
// =================================================================

// Logs in an admin.
export const adminLogin = async (credentials) => {
	try {
		const response = await publicClient.post('/api/v1/admin/login', credentials);
		const { accessToken, refreshToken, user } = response.data.data;
		setToken({ accessToken, refreshToken });
		return user;
	} catch (error) {
		throw getApiError(error, 'Failed to log in as admin.');
	}
};

// Logs out the currently authenticated admin.
export const adminLogout = async () => {
	try {
		await apiClient.post('/api/v1/admin/logout');
		removeToken();
	} catch (error) {
		// Even if the API call fails, we should clear the token to log the user out client-side.
		removeToken();
		throw getApiError(error, 'Failed to log out as admin.');
	}
};

// Fetches the profile of the currently authenticated admin.
export const getCurrentAdmin = async () => {
	try {
		const response = await apiClient.get('/api/v1/admin/me');
		return response.data.data.user;
	} catch (error) {
		throw getApiError(error, 'Failed to fetch admin profile.');
	}
};

// Registers a new admin.
export const adminRegister = async (adminDetails) => {
	try {
		const response = await publicClient.post('/api/v1/admin/register', adminDetails);
		const { accessToken, refreshToken, user } = response.data.data;
		setToken({ accessToken, refreshToken });
		return user;
	} catch (error) {
		throw getApiError(error, 'Failed to register admin.');
	}
};

// Registers a new member (Admin only).
export const memberRegister = async (memberDetails) => {
	try {
		// This requires an admin to be logged in, hence `apiClient`.
		const response = await apiClient.post('/api/v1/members/register', memberDetails);
		// Assuming the response for creating a user returns the user object
		return response.data.data.user;
	} catch (error) {
		throw getApiError(error, 'Failed to register member.');
	}
};
