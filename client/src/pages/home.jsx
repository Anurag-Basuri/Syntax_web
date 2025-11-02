import React from 'react';
import Hero from '../components/Hero';
import ClubDescription from '../components/ClubDescription.jsx';
import EventsPreview from '../components/EventsPreview.jsx';
import TeamPreview from '../components/TeamPreview.jsx';
import Footer from '../components/Footer.jsx';
import AboutSyntax from '../components/AboutSyntax.jsx';

const Home = () => {
	return (
		<div className="relative min-h-screen bg-transparent overflow-x-hidden text-primary">
			<div className="relative z-10">
				<Hero />
				<main className="relative">
					{/* The Guiding Line will be rendered inside the sections */}
					<AboutSyntax />
					<ClubDescription />
				</main>
				<EventsPreview />
				<TeamPreview />
				<Footer />
			</div>
		</div>
	);
};

export default Home;
