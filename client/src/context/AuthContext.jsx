import { createContext, useEffect, useState, useCallback } from 'react';
import {
	memberLogin,
	memberLogout,
	adminLogin,
	adminLogout,
	adminRegister,
	getCurrentAdmin,
	getCurrentMember,
	refreshAccessToken,
} from '../services/authServices.js';
import {
	getToken,
	decodeToken,
	removeToken,
	isTokenValid,
	setToken,
} from '../utils/handleTokens.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);
	const [token, setLocalToken] = useState(null);

	// Function to clear all authentication state
	const clearAuth = useCallback(() => {
		setUser(null);
		setIsAuthenticated(false);
		setLocalToken(null);
		removeToken();
		setLoading(false);
	}, []);

	// Try to refresh the access token using the refresh token
	const attemptRefreshAndFetch = async () => {
		// Try admin refresh first, then member
		try {
			const newAccess = await refreshAccessToken('admin');
			if (newAccess) {
				setLocalToken(newAccess);
				return { accessToken: newAccess, role: 'admin' };
			}
		} catch (e) {
			/* ignore */
		}
		try {
			const newAccess = await refreshAccessToken('members');
			if (newAccess) {
				setLocalToken(newAccess);
				return { accessToken: newAccess, role: 'member' };
			}
		} catch (e) {
			/* ignore */
		}
		return null;
	};

	// Unified function to check token and fetch fresh user data from the backend
	const checkAuthStatus = useCallback(async () => {
		setLoading(true);
		const tokens = getToken();
		let accessToken = tokens?.accessToken || null;

		// If no token or expired, attempt a refresh (server uses httpOnly cookie)
		if (!accessToken || isTokenValid() === false) {
			const refreshed = await attemptRefreshAndFetch();
			if (!refreshed) {
				clearAuth();
				return;
			}
			accessToken = refreshed.accessToken;
			// store refreshed access token
			setToken(accessToken);
			setLocalToken(accessToken);
		}

		try {
			const decoded = decodeToken(accessToken);
			if (!decoded || !decoded.role) throw new Error('Invalid token');

			let currentUser;
			if (decoded.role === 'admin') currentUser = await getCurrentAdmin();
			else if (decoded.role === 'member') currentUser = await getCurrentMember();
			else throw new Error('Invalid role');

			setUser(currentUser);
			setIsAuthenticated(true);
			setLocalToken(accessToken);
		} catch (err) {
			console.error('Auth check failed:', err);
			clearAuth();
		} finally {
			setLoading(false);
		}
	}, [clearAuth]);

	// Initial authentication check on component mount
	useEffect(() => {
		checkAuthStatus();
	}, [checkAuthStatus]);

	// Member Login
	const loginMember = useCallback(
		async (credentials) => {
			// Handle identifier being either email or LpuId
			const loginData = { ...credentials };
			if (loginData.identifier) {
				if (loginData.identifier.includes('@')) {
					loginData.email = loginData.identifier;
				} else {
					loginData.LpuId = loginData.identifier;
				}
				delete loginData.identifier;
			}
			await memberLogin(loginData);
			await checkAuthStatus(); // Fetch fresh user data after login
		},
		[checkAuthStatus]
	);

	// Member Logout
	const logoutMember = useCallback(async () => {
		try {
			await memberLogout();
		} catch (error) {
			console.error('Member logout API call failed:', error);
		} finally {
			clearAuth(); // Always clear local state
		}
	}, [clearAuth]);

	// Admin Login
	const loginAdmin = useCallback(
		async (credentials) => {
			await adminLogin(credentials);
			await checkAuthStatus(); // Fetch fresh user data after login
		},
		[checkAuthStatus]
	);

	// Admin Register
	const registerAdmin = useCallback(
		async (details) => {
			await adminRegister(details);
			await checkAuthStatus(); // Fetch fresh user data after registration
		},
		[checkAuthStatus]
	);

	// Admin Logout
	const logoutAdmin = useCallback(async () => {
		try {
			await adminLogout();
		} catch (error) {
			console.error('Admin logout API call failed:', error);
		} finally {
			clearAuth(); // Always clear local state
		}
	}, [clearAuth]);

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				loading,
				token, // <- expose access token string for consumers
				loginMember,
				logoutMember,
				loginAdmin,
				registerAdmin,
				logoutAdmin,
				revalidateAuth: checkAuthStatus, // Expose the unified check function
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
