import './App.css';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes.jsx';
import Navbar from './components/Navbar.jsx';
import React from 'react';
import Background3D from './components/Background3D.jsx';

function App() {
	const location = useLocation();

	// Hide navbar for specific routes
	const hideNavbar =
		location.pathname.startsWith('/auth') ||
		location.pathname.startsWith('/admin/auth') ||
		location.pathname.startsWith('/terms') ||
		location.pathname.startsWith('/refund') ||
		location.pathname.startsWith('/policy') ||
		location.pathname.startsWith('/privacy') ||
		location.pathname.startsWith('/cookie');

	const [showNavbar, setShowNavbar] = useState(true);
	const lastScrollY = useRef(0);
	const ticking = useRef(false);

	useEffect(() => {
		const handleScroll = () => {
			if (!ticking.current) {
				requestAnimationFrame(() => {
					const currentScrollY = window.scrollY;
					if (currentScrollY <= 10) {
						setShowNavbar(true);
					} else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
						setShowNavbar(false);
					} else if (currentScrollY < lastScrollY.current - 5) {
						setShowNavbar(true);
					}
					lastScrollY.current = currentScrollY;
					ticking.current = false;
				});
				ticking.current = true;
			}
		};

		if (!hideNavbar) {
			window.addEventListener('scroll', handleScroll, { passive: true });
			return () => window.removeEventListener('scroll', handleScroll);
		}
	}, [hideNavbar]);

	return (
		<ReactLenis
			root
			options={{
				lerp: 0.1,
				duration: 1.2,
				easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
				orientation: 'vertical',
				gestureOrientation: 'vertical',
				smoothWheel: true,
				wheelMultiplier: 1,
				touchMultiplier: 2,
				syncTouch: true,
				touchInertiaMultiplier: 35,
				infinite: false,
			}}
		>
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 4000,
					style: {
						background: 'rgba(0, 0, 0, 0.8)',
						color: '#fff',
						border: '1px solid rgba(255, 255, 255, 0.1)',
						borderRadius: '12px',
						backdropFilter: 'blur(10px)',
						boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
					},
					success: {
						iconTheme: { primary: '#10B981', secondary: '#fff' },
						style: {
							border: '1px solid rgba(16, 185, 129, 0.3)',
							background: 'rgba(16, 185, 129, 0.1)',
						},
					},
					error: {
						iconTheme: { primary: '#EF4444', secondary: '#fff' },
						style: {
							border: '1px solid rgba(239, 68, 68, 0.3)',
							background: 'rgba(239, 68, 68, 0.1)',
						},
					},
					loading: {
						iconTheme: { primary: '#3B82F6', secondary: '#fff' },
						style: {
							border: '1px solid rgba(59, 130, 246, 0.3)',
							background: 'rgba(59, 130, 246, 0.1)',
						},
					},
				}}
			/>

			{!hideNavbar && (
				<div
					className="fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-out"
					style={{
						transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
						opacity: showNavbar ? 1 : 0,
						pointerEvents: showNavbar ? 'auto' : 'none',
					}}
				>
					<Navbar />
				</div>
			)}

			{/* Global themed background (toggle moved into Navbar) */}
			<Background3D />

			<main id="main" className={`relative z-10 ${!hideNavbar ? 'pt-20' : ''}`}>
				<AppRoutes />
			</main>
		</ReactLenis>
	);
}

export default App;
