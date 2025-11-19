import axios from 'axios';
import { getToken, setToken, removeToken } from '../utils/handleTokens.js';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.orgsyntax.xyz';

// Public client — include credentials so server can read/send httpOnly refresh cookie
const publicClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	withCredentials: true,
});

// Authenticated client — also sends cookies
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	withCredentials: true,
});

// Attach access token when available and preserve FormData
apiClient.interceptors.request.use(
	(config) => {
		// If body is FormData, let axios/browser set Content-Type (with boundary)
		if (config && config.data instanceof FormData) {
			if (config.headers) {
				delete config.headers['Content-Type'];
				delete config.headers['content-type'];
			}
		}

		// Attach Authorization header if we have an access token
		const tokens = getToken();
		const accessToken = tokens?.accessToken;
		if (accessToken) {
			if (!config.headers) config.headers = {};
			config.headers['Authorization'] = `Bearer ${accessToken}`;
		}

		return config;
	},
	(error) => Promise.reject(error)
);

// Simple refresh-token flow (keeps existing behavior, avoids infinite loops)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
	failedQueue = [];
};

apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error?.config;
		if (!originalRequest) return Promise.reject(error);

		// If unauthorized, try token refresh once
		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				// queue the request
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers['Authorization'] = `Bearer ${token}`;
						return axios(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				// Call your refresh endpoint - adjust path if different
				const resp = await publicClient.post('/api/v1/auth/refresh');
				const newTokens = resp.data?.data;
				if (newTokens?.accessToken) {
					setToken(newTokens);
				}
				processQueue(null, newTokens?.accessToken);
				originalRequest.headers['Authorization'] = `Bearer ${newTokens?.accessToken}`;
				return axios(originalRequest);
			} catch (err) {
				processQueue(err, null);
				removeToken();
				return Promise.reject(err);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

export { apiClient, publicClient };
