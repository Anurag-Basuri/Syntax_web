import { createContext, useEffect, useState, useCallback } from 'react';
import {
	memberLogin,
	memberLogout,
	adminLogin,
	adminLogout,
	adminRegister,
	getCurrentAdmin,
	getCurrentMember,
} from '../services/authServices.js';
import { getToken, decodeToken, removeToken, isTokenValid } from '../utils/handleTokens.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);

	// Function to clear all authentication state
	const clearAuth = useCallback(() => {
		setUser(null);
		setIsAuthenticated(false);
		removeToken();
		setLoading(false);
	}, []);

	// Unified function to check token and fetch fresh user data from the backend
	const checkAuthStatus = useCallback(async () => {
		setLoading(true);
		const { accessToken } = getToken();

		if (!accessToken || !isTokenValid()) {
			clearAuth();
			return;
		}

		try {
			const decoded = decodeToken(accessToken);
			if (!decoded || !decoded.role) {
				throw new Error('Invalid token');
			}

			let currentUser;
			// Fetch user data based on role stored in the token
			if (decoded.role === 'admin') {
				currentUser = await getCurrentAdmin();
			} else if (decoded.role === 'member') {
				currentUser = await getCurrentMember();
			} else {
				throw new Error('Invalid user role in token');
			}

			setUser(currentUser);
			setIsAuthenticated(true);
		} catch (error) {
			console.error('Authentication check failed, clearing session:', error);
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
