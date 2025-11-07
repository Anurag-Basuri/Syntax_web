import { apiClient, publicClient } from './api.js';
import { setToken, removeToken } from '../utils/handleTokens.js';

// ===========================================
// Auth Service Functions
// ==================================================

// Registers a new member.
export const memberRegister = async (data) => {
	// This is an admin action, so it uses the authenticated apiClient
	const response = await apiClient.post('/api/v1/members/register', data);
	return response.data;
};

// Logs in a member.
export const memberLogin = async (data) => {
	// Login is a public action, so it uses publicClient
	const response = await publicClient.post('/api/v1/members/login', data);
	const { accessToken, refreshToken, user } = response.data.data;
	setToken({ accessToken, refreshToken });
	return user;
};

// Logs out the currently authenticated member.
export const memberLogout = async () => {
	await apiClient.post('/api/v1/members/logout');
	removeToken(); // Clear tokens on logout
};

/* Registers a new admin.
export const adminRegister = async (data) => {
	// Registration is a public action, so use publicClient
	const response = await publicClient.post('/api/v1/admin/register', data);
	const { accessToken, refreshToken, user } = response.data.data;
	setToken({ accessToken, refreshToken });
	return user;
};*/

// Logs in an admin.
export const adminLogin = async (data) => {
	// Login is a public action, so use publicClient
	const response = await publicClient.post('/api/v1/admin/login', data);
	const { accessToken, refreshToken, user } = response.data.data;
	setToken({ accessToken, refreshToken });
	return user;
};

// Logs out the currently authenticated admin.
export const adminLogout = async () => {
	// The backend identifies the user via the token in the header; no body is needed.
	await apiClient.post('/api/v1/admin/logout');
	removeToken(); // Clear tokens on logout
};

// Fetches the profile of the currently authenticated admin.
export const getCurrentAdmin = async () => {
	const response = await apiClient.get('/api/v1/admin/me');
	return response.data.data;
};

// Fetches the profile of the currently authenticated member.
export const getCurrentMember = async () => {
	const response = await apiClient.get('/api/v1/members/me');
	return response.data.data;
};
