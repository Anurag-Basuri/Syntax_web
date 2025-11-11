import axios from 'axios';
import { getToken, setToken, removeToken } from '../utils/handleTokens.js';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Public client — include credentials so server can read/send httpOnly refresh cookie
const publicClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: { 'Content-Type': 'application/json' },
	withCredentials: true,
});

// Authenticated client — also sends cookies
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: { 'Content-Type': 'application/json' },
	withCredentials: true,
});

// Attach access token when available
apiClient.interceptors.request.use(
	(config) => {
		const tokens = getToken();
		const accessToken = tokens?.accessToken;
		if (accessToken) config.headers['Authorization'] = `Bearer ${accessToken}`;
		return config;
	},
	(error) => Promise.reject(error)
);

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

		// Only attempt refresh once per request
		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers['Authorization'] = 'Bearer ' + token;
						return apiClient(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				// Determine refresh endpoint by inspecting URL path
				const url = originalRequest.url || '';
				const isAdmin = url.includes('/api/v1/admin') || url.includes('/admin/');
				const refreshUrl = isAdmin
					? '/api/v1/admin/refresh-token'
					: '/api/v1/members/refresh-token';

				// Call refresh endpoint — server reads httpOnly cookie; no refreshToken in body required
				const resp = await publicClient.post(refreshUrl, {}, { withCredentials: true });

				const newAccessToken = resp?.data?.data?.accessToken;
				if (!newAccessToken) {
					throw new Error('Refresh did not return access token');
				}

				// Persist only the access token locally
				setToken({ accessToken: newAccessToken });

				originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
				processQueue(null, newAccessToken);
				return apiClient(originalRequest);
			} catch (refreshErr) {
				processQueue(refreshErr, null);
				// Clear local token and force a full re-login
				removeToken();
				// Redirect to admin auth if URL suggests admin area, otherwise to member login
				try {
					const wasAdmin = (originalRequest.url || '').includes('/api/v1/admin');
					window.location.href = wasAdmin ? '/admin/auth' : '/login';
				} catch {}
				return Promise.reject(refreshErr);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

export { apiClient, publicClient };
