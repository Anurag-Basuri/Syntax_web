import axios from 'axios';
import { getToken, setToken } from '../utils/handleTokens.js';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// --- Public Client (No changes needed) ---
const publicClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: { 'Content-Type': 'application/json' },
});

// --- Authenticated Client (With Token Refresh Logic) ---
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: { 'Content-Type': 'application/json' },
	withCredentials: true, // Important for sending cookies (like the refresh token)
});

// Request Interceptor: Attach the access token to every request
apiClient.interceptors.request.use(
	(config) => {
		const { accessToken } = getToken();
		if (accessToken) {
			config.headers['Authorization'] = `Bearer ${accessToken}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// --- Token Refresh Logic ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

// Response Interceptor: Handle expired tokens and retry requests
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// Check if the error is a 401 and it's not a retry attempt
		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				// If a refresh is already in progress, queue the request
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers['Authorization'] = 'Bearer ' + token;
						return apiClient(originalRequest);
					})
					.catch((err) => {
						return Promise.reject(err);
					});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			const { refreshToken } = getToken();
			if (!refreshToken) {
				// If there's no refresh token, we can't do anything.
				isRefreshing = false;
				// Optionally, trigger a global logout event here
				return Promise.reject(error);
			}

			try {
				// Determine which refresh endpoint to call based on the original request URL
				const role = originalRequest.url.includes('/admin/') ? 'admin' : 'member';
				const refreshUrl = `/api/v1/${role}s/refresh-token`;

				const response = await publicClient.post(refreshUrl, { refreshToken });
				const { accessToken: newAccessToken } = response.data.data;

				setToken({ accessToken: newAccessToken, refreshToken });

				// Update the header of the original request
				originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

				// Process the queue with the new token
				processQueue(null, newAccessToken);

				// Retry the original request
				return apiClient(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError, null);
				window.location = '/login';
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

export { apiClient, publicClient };
