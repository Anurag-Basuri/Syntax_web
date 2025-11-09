import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AdminRoute } from './protectedRoutes.jsx';

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
const AdminAuthPage = lazy(() => import('../pages/auth/adminAuth.jsx'));
const AdminDashboard = lazy(() => import('../pages/adminDash.jsx'));
const MemberDashboard = lazy(() => import('../pages/member.jsx'));
const ArvantisPage = lazy(() => import('../pages/arvantis.jsx'));
const EventPage = lazy(() => import('../pages/event.jsx'));
const TeamPage = lazy(() => import('../pages/team.jsx'));
const ContactPage = lazy(() => import('../pages/contact.jsx'));
const ShowPage = lazy(() => import('../pages/show.jsx'));
const SocialsPage = lazy(() => import('../pages/socials.jsx'));
const CookiePolicy = lazy(() => import('../pages/policies/cookie.jsx'));
const PrivacyPolicy = lazy(() => import('../pages/policies/privacy.jsx'));
const TermsPolicy = lazy(() => import('../pages/policies/terms.jsx'));
const RefundPolicy = lazy(() => import('../pages/policies/refund.jsx'));

const AppRoutes = () => {
	return (
		<Suspense fallback={<PageLoadingFallback />}>
			<Routes>
				{/* Public routes */}
				<Route path="/" element={<Home />} />
				<Route path="/arvantis" element={<ArvantisPage />} />
				<Route path="/event" element={<EventPage />} />
				<Route path="/team" element={<TeamPage />} />
				<Route path="/contact" element={<ContactPage />} />
				<Route path="/socials" element={<SocialsPage />} />
				<Route path="/policy/cookie" element={<CookiePolicy />} />
				<Route path="/policy/privacy" element={<PrivacyPolicy />} />
				<Route path="/policy/terms" element={<TermsPolicy />} />
				<Route path="/policy/refund" element={<RefundPolicy />} />

				{/* Auth routes */}
				<Route path="/auth" element={<Navigate to="/login" replace />} />
				<Route element={<PublicRoute />}>
					<Route path="/login" element={<LoginPage />} />
					<Route path="/join" element={<JoinPage />} />
					<Route path="/admin/secret/auth" element={<AdminAuthPage />} />
				</Route>

				{/* Protected Member Routes */}
				<Route element={<ProtectedRoute />}>
					<Route path="/member/dashboard" element={<MemberDashboard />} />
					<Route path="/show" element={<ShowPage />} />
				</Route>

				{/* Protected Admin Routes */}
				<Route element={<AdminRoute />}>
					<Route path="/admin/dashboard" element={<AdminDashboard />} />
				</Route>

				{/* 404 fallback */}
				<Route
					path="*"
					element={
						<div className="flex flex-col items-center justify-center h-[80vh] text-lg text-gray-400">
							<h1 className="text-4xl font-bold mb-2">404</h1>
							<p>Sorry, the page you are looking for does not exist.</p>
						</div>
					}
				/>
			</Routes>
		</Suspense>
	);
};

export default AppRoutes;
