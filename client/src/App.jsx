import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
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

	// Updated list of routes where the navbar should be hidden
	const hideNavbarRoutes = [
		'/login',
		'/join',
		'/admin/auth',
		'/policy/terms',
		'/policy/refund',
		'/policy/privacy',
		'/policy/cookie',
	];
	const hideNavbar = hideNavbarRoutes.includes(location.pathname);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const progress = (currentScrollY / Math.max(docHeight, 1)) * 100;

			setScrollProgress(Math.min(100, Math.max(0, progress)));

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
		} else {
			// Reset scroll progress on routes without a navbar
			setScrollProgress(0);
		}
	}, [hideNavbar]);

	const pageVariants = {
		initial: { opacity: 0, y: 15 },
		in: { opacity: 1, y: 0 },
		out: { opacity: 0, y: -15 },
	};

	const pageTransition = {
		type: 'tween',
		ease: 'anticipate',
		duration: 0.5,
	};

	return (
		<ReactLenis
			root
			options={{
				lerp: 0.1,
				duration: 1.2,
				smoothWheel: true,
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

			{!hideNavbar && <Navbar scrollProgress={scrollProgress} />}

			<Background3D />

			<main
				id="main"
				className={`relative z-10 transition-all duration-300 ${
					!hideNavbar ? 'pt-28' : ''
				}`}
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={location.pathname}
						initial="initial"
						animate="in"
						exit="out"
						variants={pageVariants}
						transition={pageTransition}
					>
						<AppRoutes />
					</motion.div>
				</AnimatePresence>
			</main>

			{/* Restyled Scroll Progress Indicator */}
			{!hideNavbar && (
				<div
					className="fixed right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-semibold"
					style={{
						background: `conic-gradient(var(--accent-1) ${
							scrollProgress * 3.6
						}deg, var(--glass-bg) 0deg)`,
						opacity: scrollProgress > 2 ? 1 : 0,
						transition: 'opacity .25s ease',
						border: '1px solid var(--glass-border)',
						backdropFilter: 'blur(8px)',
					}}
				>
					{Math.round(scrollProgress)}
				</div>
			)}
		</ReactLenis>
	);
}

export default App;
