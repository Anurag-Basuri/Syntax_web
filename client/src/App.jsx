import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AppRoutes from './routes/AppRoutes.jsx';
import Navbar from './components/Navbar.jsx';
import Background3D from './components/Background3D.jsx';
import './App.css';

function App() {
	const location = useLocation();
	const [scrollProgress, setScrollProgress] = useState(0);
	const [isNavbarVisible, setIsNavbarVisible] = useState(true);
	const lastScrollY = useRef(0);

	const hideNavbarRoutes = [
		'/login',
		'/join',
		'/admin/secret/auth',
		'/policy/terms',
		'/policy/refund',
		'/policy/privacy',
		'/policy/cookie',
	];
	const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const progress = (currentScrollY / Math.max(docHeight, 1)) * 100;

			setScrollProgress(Math.min(100, Math.max(0, progress)));

			// Navbar visibility logic
			if (currentScrollY < 100) {
				setIsNavbarVisible(true);
			} else if (currentScrollY > lastScrollY.current) {
				// Scrolling down
				setIsNavbarVisible(false);
			} else {
				// Scrolling up
				setIsNavbarVisible(true);
			}

			lastScrollY.current = currentScrollY;
		};

		if (!shouldHideNavbar) {
			window.addEventListener('scroll', handleScroll, { passive: true });
			return () => window.removeEventListener('scroll', handleScroll);
		} else {
			setScrollProgress(0);
			setIsNavbarVisible(true); // Ensure it's visible if we navigate back to a page with a navbar
		}
	}, [shouldHideNavbar]);

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

			{!shouldHideNavbar && (
				<Navbar scrollProgress={scrollProgress} isVisible={isNavbarVisible} />
			)}

			<Background3D />

			<main
				id="main"
				className={`relative z-10 transition-all duration-300 ${
					!shouldHideNavbar ? 'pt-28' : ''
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
			{!shouldHideNavbar && (
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
