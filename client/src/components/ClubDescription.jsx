import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Layers, Code, Cloud, Bot, Palette, Rocket, Zap, Mic } from 'lucide-react';

const ClubDescription = () => {
	const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
	};
	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
	};

	const tracks = [
		{ name: 'Web Dev', icon: Code },
		{ name: 'AI/ML', icon: Bot },
		{ name: 'Cloud/DevOps', icon: Cloud },
		{ name: 'UI/UX Design', icon: Palette },
		{ name: 'Product', icon: Rocket },
		{ name: 'Core Infra', icon: Layers },
	];

	const journey = [
		{
			title: 'Build Sprints',
			desc: 'Two-week sprints with async reviews and demos.',
			icon: Zap,
		},
		{
			title: 'Demo Day',
			desc: 'Showcase your work, get feedback, and celebrate wins.',
			icon: Mic,
		},
	];

	return (
		<section ref={ref} className="section-padding page-container">
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate={inView ? 'visible' : 'hidden'}
				className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
			>
				{/* Left Card: Tracks */}
				<motion.div variants={itemVariants} className="glass-card p-8 hover-lift">
					<h2 className="text-3xl font-bold font-display mb-6 brand-text">
						Programs & Tracks
					</h2>
					<p className="text-secondary leading-relaxed mb-6">
						Pick a track that ignites your curiosity. Join a small, focused pod and
						start shipping real-world projects from day one.
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
						{tracks.map((track) => (
							<div
								key={track.name}
								className="glass-card p-3 rounded-lg flex items-center gap-2 text-sm text-secondary border-white/10"
							>
								<track.icon className="w-4 h-4 text-accent-1" />
								<span>{track.name}</span>
							</div>
						))}
					</div>
				</motion.div>

				{/* Right Card: Journey */}
				<motion.div variants={itemVariants} className="glass-card p-8 hover-lift">
					<h2 className="text-3xl font-bold font-display mb-6 brand-text">
						The Build Journey
					</h2>
					<p className="text-secondary leading-relaxed mb-6">
						Our entire process is built around a simple, powerful loop: build, ship, and
						learn.
					</p>
					<div className="flex flex-col gap-4">
						{journey.map((item) => (
							<div
								key={item.title}
								className="glass-card p-5 rounded-lg flex items-start gap-4 border-white/10"
							>
								<div className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center bg-slate-700/50">
									<item.icon className="w-5 h-5 text-accent-1" />
								</div>
								<div>
									<h3 className="font-semibold text-primary mb-1">
										{item.title}
									</h3>
									<p className="text-secondary text-sm">{item.desc}</p>
								</div>
							</div>
						))}
					</div>
				</motion.div>
			</motion.div>
		</section>
	);
};

export default ClubDescription;
