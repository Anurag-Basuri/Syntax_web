import React from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import ClubDescription from '../components/ClubDescription.jsx';
import EventsPreview from '../components/EventsPreview.jsx';
import TeamPreview from '../components/TeamPreview.jsx';
import Testimonials from '../components/Testimonials.jsx';
import Footer from '../components/Footer.jsx';
import Logo from '../assets/logo.png';

const Home = () => {
	return (
		<div className="relative min-h-screen bg-gradient-to-b from-[#0a0e17] to-[#1a1f3a] text-white overflow-x-hidden">
			{/* Fixed background elements */}
			<div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
				{/* Grid */}
				<div className="absolute inset-0 bg-grid-white/[0.03] bg-[length:20px_20px]" />
				{/* Logo */}
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: `url(${Logo})`,
						backgroundSize: '50%',
						backgroundPosition: 'center 20%',
						backgroundRepeat: 'no-repeat',
						opacity: 0.05,
					}}
				/>
				{/* Blur shapes */}
				<div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-500/10 filter blur-3xl animate-pulse-slow" />
				<div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-indigo-500/15 filter blur-3xl animate-pulse-slow" />
				<div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-purple-500/12 filter blur-3xl animate-pulse-slow" />
			</div>

			{/* Content */}
			<div className="relative z-10">
				<Hero />
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
