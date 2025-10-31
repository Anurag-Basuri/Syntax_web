import React from 'react';
import Hero from '../components/Hero';
import ClubDescription from '../components/ClubDescription.jsx';
import EventsPreview from '../components/EventsPreview.jsx';
import TeamPreview from '../components/TeamPreview.jsx';
import Footer from '../components/Footer.jsx';
import AboutSyntax from '../components/AboutSyntax.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Background3D from '../components/Background3D.jsx';

const Home = () => {
	return (
		<div className="relative min-h-screen bg-transparent text-white overflow-x-hidden">
			{/* Themed, Next-like 3D background */}
			<Background3D />

			{/* Theme toggle */}
			<ThemeToggle />

			{/* Content remains transparent */}
			<div className="relative z-10">
				<Hero />
				<AboutSyntax />
				<ClubDescription />
				<EventsPreview />
				<TeamPreview />
				<Footer />
			</div>
		</div>
	);
};

export default Home;
