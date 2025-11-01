import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes.jsx';
import Navbar from './components/Navbar.jsx';
import Background3D from './components/Background3D.jsx';
import './App.css';

function App() {
	const location = useLocation();
	const [scrollProgress, setScrollProgress] = useState(0);
	const [showNavbar, setShowNavbar] = useState(true);
	const lastScrollY = useRef(0);
	const scrollTimeout = useRef(null);

	// Hide navbar for specific routes
	const hideNavbar = [
		'/auth',
		'/admin/auth',
		'/terms',
		'/refund',
		'/policy',
		'/privacy',
		'/cookie',
	].some((p) => location.pathname.startsWith(p));

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const progress = (currentScrollY / Math.max(docHeight, 1)) * 100;

			setScrollProgress(Math.min(100, Math.max(0, progress)));

			// Slide-away / slide-in with threshold
			if (currentScrollY < 100) setShowNavbar(true);
			else if (currentScrollY > lastScrollY.current + 22) setShowNavbar(false);
			else if (currentScrollY < lastScrollY.current - 18) setShowNavbar(true);

			lastScrollY.current = currentScrollY;

			if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
			scrollTimeout.current = setTimeout(() => setShowNavbar(true), 900);
		};

		if (!hideNavbar) {
			window.addEventListener('scroll', handleScroll, { passive: true });
			return () => {
				window.removeEventListener('scroll', handleScroll);
				if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
			};
		}
	}, [hideNavbar]);

	return (
		<ReactLenis
			root
			options={{
				lerp: 0.12,
				duration: 1.1,
				smoothWheel: true,
				smoothTouch: true,
				touchMultiplier: 1.8,
			}}
		>
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 4000,
					className: '!bg-transparent !border-0 !shadow-none',
					style: { background: 'transparent' },
				}}
			/>

			{!hideNavbar && (
				<header className={`nav-shell ${showNavbar ? 'show' : 'hide'}`}>
					{/* Progress bar */}
					<div
						className="absolute top-0 left-0 h-[2px] transition-all duration-300"
						style={{
							width: `${scrollProgress}%`,
							background: 'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
							boxShadow: '0 0 20px var(--accent-1)',
						}}
					/>
					<Navbar />
				</header>
			)}

			<Background3D />

			<main
				id="main"
				className={`relative z-10 transition-all duration-300 ${
					!hideNavbar ? 'pt-20' : ''
				}`}
			>
				<div className="page-transition-wrapper">
					<AppRoutes />
				</div>
			</main>

			{/* Optional scroll % */}
			<div
				className="fixed right-3 sm:right-4 bottom-3 sm:bottom-4 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center font-mono text-[11px] sm:text-sm"
				style={{ opacity: scrollProgress > 2 ? 0.85 : 0, transition: 'opacity .25s ease' }}
			>
				{Math.round(scrollProgress)}%
			</div>
		</ReactLenis>
	);
}

export default App;
