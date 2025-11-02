import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './protectedRoutes.jsx';

// Import your page components
import Home from '../pages/home.jsx';
import AuthPage from '../pages/auth/auth.jsx';
import AdminAuth from '../pages/auth/adminAuth.jsx';
import AdminDash from '../pages/adminDash.jsx';
import MemberDashboard from '../pages/member.jsx';
import Event from '../pages/event.jsx';
import Team from '../pages/team.jsx';
import Contact from '../pages/contact.jsx';
import QrScanner from '../components/QrScanner.jsx';
import Show from '../pages/show.jsx';
import Socials from '../pages/socials.jsx';
import Cookie from '../pages/policies/cookie.jsx';
import Privacy from '../pages/policies/privacy.jsx';
import Terms from '../pages/policies/terms.jsx';
import Refund from '../pages/policies/refund.jsx';

const AppRoutes = () => {
	return (
		<Routes>
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
			<Route
				path="/auth/*"
				element={
					<PublicRoute>
						<AuthPage />
					</PublicRoute>
				}
			/>
			<Route
				path="/admin/auth"
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

			{/* Shared protected routes */}
			<Route
				path="/vib/qrscanner"
				element={
					<ProtectedRoute requireAuth>
						<QrScanner />
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
	);
};

export default AppRoutes;
