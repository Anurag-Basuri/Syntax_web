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
		// Server sets refresh token as httpOnly cookie and returns accessToken + user
		const { accessToken, user } = response.data.data;
		// Persist only the access token client-side — refresh token is cookie-only
		setToken(accessToken);
		return user;
	} catch (error) {
		throw getApiError(error, 'Login failed. Please check your credentials.');
	}
};

// Logs out the currently authenticated member.
export const memberLogout = async () => {
	try {
		await apiClient.post('/api/v1/members/logout');
	} catch (error) {
		console.error('Server logout failed, but logging out client-side anyway.', error);
	} finally {
		// Always remove the token from local storage on logout.
		removeToken();
	}
};

// Fetches the profile of the currently authenticated member.
export const getCurrentMember = async () => {
	try {
		const response = await apiClient.get('/api/v1/members/me');
		return response.data.data;
	} catch (error) {
		throw getApiError(error, 'Failed to fetch your profile.');
	}
};

// =================================================================
// Admin Authentication & Management Services
// =================================================================

// Logs in an admin.
export const adminLogin = async (credentials) => {
	try {
		const response = await publicClient.post('/api/v1/admin/login', credentials);
		const { accessToken, user } = response.data.data;
		setToken(accessToken);
		return user;
	} catch (error) {
		throw getApiError(error, 'Admin login failed. Please check your credentials.');
	}
};

// Logs out the currently authenticated admin.
export const adminLogout = async () => {
	try {
		await apiClient.post('/api/v1/admin/logout');
	} catch (error) {
		console.error('Server logout failed, but logging out client-side anyway.', error);
	} finally {
		// Always remove the token from local storage on logout.
		removeToken();
	}
};

// Fetches the profile of the currently authenticated admin.
export const getCurrentAdmin = async () => {
	try {
		const response = await apiClient.get('/api/v1/admin/me');
		return response.data.data;
	} catch (error) {
		throw getApiError(error, 'Failed to fetch admin profile.');
	}
};

// Registers a new admin.
export const adminRegister = async (adminDetails) => {
	try {
		const response = await publicClient.post('/api/v1/admin/register', adminDetails);
		const { accessToken, user } = response.data.data;
		setToken(accessToken);
		return user;
	} catch (error) {
		throw getApiError(error, 'Failed to register admin.');
	}
};

// Registers a new member (Admin only).
export const memberRegister = async (memberDetails) => {
	try {
		const response = await apiClient.post('/api/v1/members/register', memberDetails);
		return response.data.data;
	} catch (error) {
		throw getApiError(error, 'Failed to register member.');
	}
};
