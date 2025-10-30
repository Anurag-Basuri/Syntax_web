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
			{/* Single subtle site background */}
			<div className="fixed inset-0 -z-50 bg-gradient-to-b from-slate-950 via-blue-950/15 to-slate-950" />
			<div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
				<div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:30px_30px]" />
				{/* center-top watermark, softly masked and blended; hidden on very small screens */}
				<motion.div
					className="absolute inset-x-0 top-0 flex items-start justify-center pt-[9vh] sm:pt-[11vh] lg:pt-[13vh]"
					initial={{ opacity: 0, scale: 0.96, y: -8 }}
					animate={{ opacity: 0.05, scale: 1, y: 0 }}
					transition={{ duration: 1.1, ease: 'easeOut' }}
				>
					<img
						src={Logo}
						alt="Syntax Logo"
						className="w-[82vw] max-w-[820px] md:w-[70vw] md:max-w-[780px] h-auto object-contain mask-fade mix-soft-light tilt-1"
						loading="eager"
						decoding="async"
					/>
				</motion.div>
				{/* toned-down orbs */}
				<div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/4 rounded-full blur-3xl animate-glow-pulse" />
				<div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/4 rounded-full blur-3xl animate-glow-pulse" />
				<div className="absolute bottom-0 left-1/2 w-[600px] h-[400px] bg-indigo-600/3 rounded-full blur-3xl animate-glow-pulse" />
			</div>
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
