import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './protectedRoutes.jsx';

// --- Loading Fallback Component ---
const PageLoadingFallback = () => (
	<div className="min-h-screen bg-gradient-to-br from-[#0a0e17] to-[#0f172a] flex items-center justify-center">
		<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
	</div>
);

// --- Page Imports ---

// Statically import the main landing page for the fastest initial load.
import Home from '../pages/home.jsx';

// Lazy-load all other pages to split the code into smaller chunks.
const LoginPage = lazy(() => import('../pages/auth/Login.jsx'));
const JoinPage = lazy(() => import('../pages/auth/Join.jsx'));
const AdminAuth = lazy(() => import('../pages/auth/adminAuth.jsx'));
const AdminDash = lazy(() => import('../pages/adminDash.jsx'));
const MemberDashboard = lazy(() => import('../pages/member.jsx'));
const Event = lazy(() => import('../pages/event.jsx'));
const Team = lazy(() => import('../pages/team.jsx'));
const Contact = lazy(() => import('../pages/contact.jsx'));
const Show = lazy(() => import('../pages/show.jsx'));
const Socials = lazy(() => import('../pages/socials.jsx'));
const Cookie = lazy(() => import('../pages/policies/cookie.jsx'));
const Privacy = lazy(() => import('../pages/policies/privacy.jsx'));
const Terms = lazy(() => import('../pages/policies/terms.jsx'));
const Refund = lazy(() => import('../pages/policies/refund.jsx'));

// Lazy-load heavy components that are not pages.
const Background3D = lazy(() => import('../components/Background3D.jsx'));

const AppRoutes = () => {
	return (
		<Suspense fallback={<PageLoadingFallback />}>
			<Routes>
				<Route path="/background" element={<Background3D />} />
				{/* Public routes */}
				<Route path="/" element={<Home />} />
				<Route path="/event" element={<Event />} />
				<Route path="/team" element={<Team />} />
				<Route path="/contact" element={<Contact />} />
				<Route path="/socials" element={<Socials />} />
				<Route path="/policy/cookie" element={<Cookie />} />
				<Route path="/policy/privacy" element={<Privacy />} />
				<Route path="/policy/terms" element={<Terms />} />
				<Route path="/policy/refund" element={<Refund />} />

				{/* Auth routes */}
				<Route path="/auth" element={<Navigate to="/login" replace />} />
				<Route
					path="/login"
					element={
						<PublicRoute>
							<LoginPage />
						</PublicRoute>
					}
				/>
				<Route
					path="/join"
					element={
						<PublicRoute>
							<JoinPage />
						</PublicRoute>
					}
				/>
				<Route
					path="/admin/secret/auth"
					element={
						<PublicRoute>
							<AdminAuth />
						</PublicRoute>
					}
				/>

				{/* Member protected routes */}
				<Route
					path="/member/dashboard"
					element={
						<ProtectedRoute requireAuth>
							<MemberDashboard />
						</ProtectedRoute>
					}
				/>

				{/* Admin protected routes */}
				<Route
					path="/admin/dashboard"
					element={
						<ProtectedRoute requireAuth adminOnly>
							<AdminDash />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/show"
					element={
						<ProtectedRoute requireAuth>
							<Show />
						</ProtectedRoute>
					}
				/>

				{/* 404 fallback */}
				<Route
					path="*"
					element={
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								height: '80vh',
								fontSize: '1.5rem',
								color: '#888',
							}}
						>
							<h1>404</h1>
							<p>Sorry, the page you are looking for does not exist.</p>
						</div>
					}
				/>
			</Routes>
		</Suspense>
	);
};

export default AppRoutes;
