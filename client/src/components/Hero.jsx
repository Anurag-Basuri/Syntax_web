import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Users, Code2, Rocket, CalendarDays, PlayCircle } from 'lucide-react';

const Hero = () => {
	const navigate = useNavigate();
	const prefersReducedMotion = useReducedMotion();

	const fadeUp = (delay = 0, duration = 0.6) => ({
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0, transition: { duration, delay, ease: [0.16, 1, 0.3, 1] } },
	});

	return (
		<section className="relative overflow-hidden">
			{/* Background elements */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="hero-grid-glow" />
				<div className="hero-mesh top-[-20%] left-[-25%]" />
				<div
					className="hero-mesh bottom-[-25%] right-[-20%]"
					style={{ animationDelay: '2s' }}
				/>
			</div>

			<div className="page-container section-padding">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16 items-center">
					{/* Left Column: Content */}
					<div className="text-center lg:text-left">
						<motion.div {...fadeUp(0)} className="mb-6 inline-flex">
							<div className="hero-badge">
								<Sparkles className="w-4 h-4 text-accent-1" />
								<span className="font-medium">From Idea to Impact</span>
							</div>
						</motion.div>

						<motion.h1
							{...fadeUp(0.1)}
							className="font-display font-extrabold tracking-tighter leading-[1.05] text-5xl sm:text-6xl md:text-7xl"
						>
							<span className="block brand-text">Build What's Next.</span>
							<span className="block mt-1 text-primary">Together.</span>
						</motion.h1>

						<motion.p
							{...fadeUp(0.2)}
							className="mt-6 text-base sm:text-lg md:text-xl text-secondary max-w-xl mx-auto lg:mx-0"
						>
							Syntax is a hands-on community for builders. Join project pods, get peer
							feedback, and ship work that matters.
						</motion.p>

						<motion.div
							{...fadeUp(0.3)}
							className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
						>
							<motion.button
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								onClick={() => navigate('/auth', { state: { tab: 'register' } })}
								className="btn btn-primary group w-full sm:w-auto"
							>
								<span>Join the Club</span>
								<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
							</motion.button>

							<motion.button
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								onClick={() =>
									document
										.getElementById('about-syntax')
										?.scrollIntoView({ behavior: 'smooth' })
								}
								className="btn btn-secondary w-full sm:w-auto"
							>
								<PlayCircle className="w-5 h-5" />
								<span>How It Works</span>
							</motion.button>
						</motion.div>
					</div>

					{/* Right Column: Visual */}
					<motion.div
						{...fadeUp(0.25)}
						className="relative h-full min-h-[380px] lg:min-h-[500px]"
					>
						<div className="hero-visuals-container">
							{/* Floating Card 1: Team Pod */}
							<motion.div
								className="hero-card"
								initial={{ y: 0, x: 0, rotate: -8 }}
								animate={
									prefersReducedMotion
										? {}
										: {
												y: [0, -12, 0],
												transition: {
													duration: 8,
													repeat: Infinity,
													ease: 'easeInOut',
												},
										  }
								}
							>
								<div className="flex items-center gap-3 p-3">
									<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20">
										<Users className="w-5 h-5 text-blue-400" />
									</div>
									<div>
										<p className="font-bold text-sm text-primary">
											Project Pod: 'Aura'
										</p>
										<p className="text-xs text-secondary">Weekly Sync</p>
									</div>
								</div>
							</motion.div>

							{/* Floating Card 2: Code Snippet */}
							<motion.div
								className="hero-card"
								initial={{ y: 0, x: 0, rotate: 6 }}
								animate={
									prefersReducedMotion
										? {}
										: {
												y: [0, 15, 0],
												transition: {
													duration: 10,
													repeat: Infinity,
													ease: 'easeInOut',
													delay: 1,
												},
										  }
								}
							>
								<div className="p-3">
									<p className="font-mono text-xs text-secondary mb-2">
										// Deploying to production...
									</p>
									<div className="flex items-center gap-2">
										<div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
										<p className="font-mono text-xs text-green-300">
											<span className="text-secondary">status:</span> success
										</p>
									</div>
								</div>
							</motion.div>

							{/* Floating Card 3: Design Component */}
							<motion.div
								className="hero-card"
								initial={{ y: 0, x: 0, rotate: -2 }}
								animate={
									prefersReducedMotion
										? {}
										: {
												y: [0, -10, 0],
												transition: {
													duration: 9,
													repeat: Infinity,
													ease: 'easeInOut',
													delay: 0.5,
												},
										  }
								}
							>
								<div className="flex items-center gap-3 p-3">
									<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20">
										<Rocket className="w-5 h-5 text-purple-400" />
									</div>
									<div>
										<p className="font-bold text-sm text-primary">
											New Component
										</p>
										<p className="text-xs text-secondary">Ready to ship</p>
									</div>
								</div>
							</motion.div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
};

export default Hero;
