import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { isTokenValid, shouldBeAuthenticated } from '../utils/handleTokens.js';

// A loading spinner component to show while authentication status is being checked.
const AuthLoadingSpinner = () => (
	<div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
		<div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
	</div>
);

// A route guard for protected routes that require authentication.
export const ProtectedRoute = () => {
	const { isAuthenticated, loading, revalidateAuth } = useAuth();
	const location = useLocation();

	useEffect(() => {
		// If we expect to be authenticated but token is invalid, revalidate
		if (shouldBeAuthenticated() && !isTokenValid()) {
			console.log('Token validation failed, revalidating auth...');
			if (typeof revalidateAuth === 'function') {
				revalidateAuth();
			}
		}
	}, [revalidateAuth]);

	if (loading) {
		return <AuthLoadingSpinner />;
	}

	return isAuthenticated ? (
		<Outlet />
	) : (
		<Navigate to="/login" state={{ from: location }} replace />
	);
};

// A route guard for admin-only routes.
export const AdminRoute = () => {
	const { isAuthenticated, user, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return <AuthLoadingSpinner />;
	}

	// Safely check for role after confirming authentication and user object exist.
	if (isAuthenticated && user?.role === 'admin') {
		return <Outlet />;
	}

	// If authenticated but not an admin, redirect to the member dashboard.
	if (isAuthenticated) {
		return <Navigate to="/member/dashboard" replace />;
	}

	// If not authenticated at all, redirect to the admin login page.
	return <Navigate to="/admin/secret/auth" state={{ from: location }} replace />;
};

// A route guard for public routes that should not be accessible to authenticated users.
export const PublicRoute = () => {
	const { isAuthenticated, user, loading } = useAuth();

	if (loading) {
		// It's often fine to show the public route during load, but a spinner is safer.
		return <AuthLoadingSpinner />;
	}

	if (isAuthenticated) {
		// Redirect to the appropriate dashboard based on role.
		const redirectTo = user?.role === 'admin' ? '/admin/dashboard' : '/member/dashboard';
		return <Navigate to={redirectTo} replace />;
	}

	return <Outlet />;
};
