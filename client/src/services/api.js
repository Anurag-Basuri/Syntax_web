import axios from 'axios';
import { getToken, removeToken, isTokenValid } from '../utils/handleTokens.js';

// Use centralized environment configuration
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Create an Axios instance with default settings
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
	withCredentials: true,
});

// Public client for unauthenticated requests
const publicClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
	withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
	const { accessToken } = getToken();

	// Check if token is valid before making request
	if (accessToken && isTokenValid()) {
		config.headers['Authorization'] = `Bearer ${accessToken}`;
	} else if (accessToken && !isTokenValid()) {
		// Token is expired, remove it and redirect
		removeToken();
		window.location.href = '/auth';
		return Promise.reject(new Error('Token expired'));
	}

	return config;
});

apiClient.interceptors.response.use(
	(response) => {
		// Handle successful responses
		return response;
	},
	(error) => {
		// Handle errors
		if (error.response) {
			const { status } = error.response;
			if (status === 401) {
				removeToken();
				window.location.href = '/auth';
			}
			return Promise.reject(error.response.data);
		}
		return Promise.reject(error);
	}
);

export { apiClient, publicClient };
