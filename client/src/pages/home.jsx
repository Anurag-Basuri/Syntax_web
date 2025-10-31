import React from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import ClubDescription from '../components/ClubDescription.jsx';
import EventsPreview from '../components/EventsPreview.jsx';
import TeamPreview from '../components/TeamPreview.jsx';
import Testimonials from '../components/Testimonials.jsx';
import Footer from '../components/Footer.jsx';
import Logo from '../assets/logo.png';
import AboutSyntax from '../components/AboutSyntax.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const Home = () => {
	return (
		<div className="relative min-h-screen bg-transparent text-white overflow-x-hidden">
			{/* Single themed site background */}
			<div className="fixed inset-0 -z-50 bg-app" />
			<div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
				<div className="absolute inset-0 grid-overlay" />
				{/* center-top watermark (theme-aware) */}
				<motion.div
					className="absolute inset-x-0 top-0 flex items-start justify-center pt-[9vh] sm:pt-[11vh] lg:pt-[13vh]"
					initial={{ opacity: 0, scale: 0.96, y: -8 }}
					animate={{ opacity: 0.06, scale: 1, y: 0 }}
					transition={{ duration: 1.1, ease: 'easeOut' }}
				>
					<img
						src={Logo}
						alt="Syntax Logo"
						className="logo-watermark w-[82vw] max-w-[820px] md:w-[70vw] md:max-w-[780px] h-auto object-contain mask-fade tilt-1"
						loading="eager"
						decoding="async"
					/>
				</motion.div>
				{/* toned-down orbs (kept subtle) */}
				<div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/4 rounded-full blur-3xl animate-glow-pulse" />
				<div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/4 rounded-full blur-3xl animate-glow-pulse" />
				<div className="absolute bottom-0 left-1/2 w-[600px] h-[400px] bg-indigo-600/3 rounded-full blur-3xl animate-glow-pulse" />
			</div>

			{/* Theme toggle */}
			<ThemeToggle />

			{/* Content remains transparent */}
			<div className="relative z-10">
				<Hero />
				<AboutSyntax />
				<ClubDescription />
				<EventsPreview />
				<TeamPreview />
				<Testimonials />
				<Footer />
			</div>
		</div>
	);
};

export default Home;
