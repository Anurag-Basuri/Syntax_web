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

const Home = () => {
	return (
		<div className="relative min-h-screen bg-transparent text-white overflow-x-hidden">
			{/* Fixed background gradient - subtle and consistent */}
			<div className="fixed inset-0 -z-50 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950" />

			{/* Fixed background elements */}
			<div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
				{/* Grid */}
				<div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:30px_30px]" />

				{/* Logo watermark */}
				<motion.div
					className="absolute inset-0 flex items-start justify-center pt-[12vh] md:pt-[14vh] lg:pt-[16vh]"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 0.03, scale: 1 }}
					transition={{ duration: 1.2, ease: 'easeOut' }}
				>
					<img
						src={Logo}
						alt="Syntax Logo"
						className="w-[85vw] max-w-[900px] md:w-[70vw] md:max-w-[800px] h-auto object-contain"
						loading="eager"
						decoding="async"
					/>
				</motion.div>

				{/* Subtle gradient orbs */}
				<div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-600/5 to-transparent rounded-full blur-3xl animate-glow-pulse" />
				<div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-purple-600/5 to-transparent rounded-full blur-3xl animate-glow-pulse" />
				<div className="absolute bottom-0 left-1/2 w-[600px] h-[400px] bg-gradient-to-t from-indigo-600/3 to-transparent rounded-full blur-3xl animate-glow-pulse" />
			</div>

			{/* Content */}
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
