import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
	Sparkles,
	ArrowRight,
	Users,
	Rocket,
	Palette,
	PlayCircle,
	Calendar,
	Lightbulb,
	Handshake,
	BarChart,
	ChevronsDown,
} from 'lucide-react';

const Hero = () => {
	const navigate = useNavigate();
	const prefersReducedMotion = useReducedMotion();

	const fadeUp = (delay = 0, duration = 0.6) => ({
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0, transition: { duration, delay, ease: [0.16, 1, 0.3, 1] } },
	});

	const pillars = [
		{ name: 'Events', icon: Calendar },
		{ name: 'Projects', icon: Lightbulb },
		{ name: 'Community', icon: Handshake },
		{ name: 'Growth', icon: BarChart },
	];

	return (
		<section className="relative overflow-hidden bg-transparent min-h-[72vh] flex items-center">
			<div className="page-container">
				{/* Use a single-column flow on small screens so narrative appears first,
                    and two-column layout on large screens for balanced composition */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-x-12 items-center">
					{/* Left: Narrative (kept first on mobile) */}
					<div className="lg:col-span-7 text-center lg:text-left order-1">
						<motion.div
							{...fadeUp(0)}
							className="mb-4 inline-flex justify-center lg:justify-start"
						>
							<div className="hero-badge inline-flex items-center gap-2 rounded-full px-3 py-1 bg-[rgba(124,58,237,0.06)] text-sm">
								<Sparkles className="w-4 h-4 text-accent-1" />
								<span className="font-medium">Learn. Build. Lead.</span>
							</div>
						</motion.div>

						<motion.h1
							{...fadeUp(0.06)}
							className="font-display font-extrabold tracking-tighter leading-[1.05] text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
						>
							<span className="block text-primary">Empowering Students To</span>
							<span className="block mt-1 brand-text">Build, Lead & Innovate.</span>
						</motion.h1>

						<motion.p
							{...fadeUp(0.14)}
							className="mt-4 text-base md:text-lg text-secondary max-w-2xl mx-auto lg:mx-0"
						>
							Syntax is a multidisciplinary student-driven community at LPU where
							ideas turn into real-world impact through projects, events and
							mentorship.
						</motion.p>

						{/* Pillars */}
						<motion.div
							{...fadeUp(0.2)}
							className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm"
						>
							{pillars.map((pillar, i) => (
								<div key={i} className="flex items-center gap-2 text-secondary">
									<pillar.icon className="w-4 h-4 text-accent-1" />
									<span>{pillar.name}</span>
									{i < pillars.length - 1 && (
										<span className="hidden sm:inline text-muted">|</span>
									)}
								</div>
							))}
						</motion.div>

						{/* CTAs */}
						<motion.div
							{...fadeUp(0.28)}
							className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full"
						>
							<motion.button
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								onClick={() => navigate('/join')}
								className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
								aria-label="Join Syntax Club"
							>
								<span>Join Syntax</span>
								<ArrowRight className="w-4 h-4" />
							</motion.button>

							<motion.button
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								onClick={() =>
									document
										.getElementById('about-syntax')
										?.scrollIntoView({ behavior: 'smooth' })
								}
								className="btn btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
								aria-label="Explore our mission"
							>
								<PlayCircle className="w-5 h-5" />
								<span>Explore Our Mission</span>
							</motion.button>
						</motion.div>

						{/* Scroll cue */}
						<motion.div
							{...fadeUp(0.36)}
							className="mt-8 flex items-center justify-center lg:justify-start gap-2 text-muted text-sm"
							aria-hidden
						>
							<ChevronsDown className="w-4 h-4" />
							<span>Scroll to continue the story</span>
						</motion.div>
					</div>

					{/* Right: Visual cues (placed after narrative on mobile) */}
					<motion.div {...fadeUp(0.1)} className="lg:col-span-5 order-2">
						{/* visuals: stack into a responsive grid; reduce size on small screens */}
						<div
							className="hero-visuals-container grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4"
							role="presentation"
							aria-hidden={prefersReducedMotion}
						>
							{/* Card 1 */}
							<motion.div
								className="hero-card rounded-lg p-3 border border-[rgba(0,0,0,0.04)] bg-[color-mix(in srgb, var(--card-bg) 60%, transparent)]"
								initial={{ rotate: -6 }}
								animate={
									prefersReducedMotion
										? {}
										: {
												y: [0, -10, 0],
												transition: {
													duration: 8,
													repeat: Infinity,
													ease: 'easeInOut',
												},
										  }
								}
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-blue-500/12 border border-blue-500/20 flex items-center justify-center">
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

							{/* Card 2 */}
							<motion.div
								className="hero-card rounded-lg p-3 border border-[rgba(0,0,0,0.04)] bg-[color-mix(in srgb, var(--card-bg) 60%, transparent)]"
								initial={{ rotate: 6 }}
								animate={
									prefersReducedMotion
										? {}
										: {
												y: [0, 12, 0],
												transition: {
													duration: 10,
													repeat: Infinity,
													ease: 'easeInOut',
													delay: 0.6,
												},
										  }
								}
							>
								<div>
									<p className="font-mono text-xs text-secondary mb-2">
										// deploying...
									</p>
									<div className="flex items-center gap-2">
										<span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
										<p className="font-mono text-xs text-green-300">
											<span className="text-secondary">status:</span> success
										</p>
									</div>
								</div>
							</motion.div>

							{/* Card 3 */}
							<motion.div
								className="hero-card rounded-lg p-3 border border-[rgba(0,0,0,0.04)] bg-[color-mix(in srgb, var(--card-bg) 60%, transparent)]"
								initial={{ rotate: 8 }}
								animate={
									prefersReducedMotion
										? {}
										: {
												y: [0, -8, 0],
												transition: {
													duration: 9,
													repeat: Infinity,
													ease: 'easeInOut',
													delay: 0.3,
												},
										  }
								}
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-pink-500/12 border border-pink-500/20 flex items-center justify-center">
										<Palette className="w-5 h-5 text-pink-400" />
									</div>
									<div>
										<p className="font-bold text-sm text-primary">UI Kit v2</p>
										<p className="text-xs text-secondary">Figma Library</p>
									</div>
								</div>
							</motion.div>

							{/* Card 4 */}
							<motion.div
								className="hero-card rounded-lg p-3 border border-[rgba(0,0,0,0.04)] bg-[color-mix(in srgb, var(--card-bg) 60%, transparent)]"
								initial={{ rotate: -2 }}
								animate={
									prefersReducedMotion
										? {}
										: {
												y: [0, 10, 0],
												transition: {
													duration: 11,
													repeat: Infinity,
													ease: 'easeInOut',
													delay: 0.9,
												},
										  }
								}
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-purple-500/12 border border-purple-500/20 flex items-center justify-center">
										<Rocket className="w-5 h-5 text-purple-400" />
									</div>
									<div>
										<p className="font-bold text-sm text-primary">Launch Day</p>
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
