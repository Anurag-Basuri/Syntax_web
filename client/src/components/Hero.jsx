import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Users, Code2, Rocket, Palette, PlayCircle } from 'lucide-react';

const Hero = () => {
	const navigate = useNavigate();
	const prefersReducedMotion = useReducedMotion();

	const fadeUp = (delay = 0, duration = 0.6) => ({
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0, transition: { duration, delay, ease: [0.16, 1, 0.3, 1] } },
	});

	return (
		<section className="relative overflow-hidden bg-transparent">
			{/* Background glows (transparent-friendly) */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="hero-grid-glow" aria-hidden />
				<div className="hero-mesh top-[-22%] left-[-26%]" aria-hidden />
				<div
					className="hero-mesh bottom-[-24%] right-[-18%]"
					style={{ animationDelay: '2s' }}
					aria-hidden
				/>
			</div>

			<div className="page-container section-padding">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-x-12 items-center">
					{/* Left Column: Content (First on mobile) */}
					<div className="order-2 lg:order-1 lg:col-span-7 text-center lg:text-left">
						<motion.div {...fadeUp(0)} className="mb-5 inline-flex">
							<div className="hero-badge">
								<Sparkles className="w-4 h-4 text-accent-1" />
								<span className="font-medium">From Idea to Impact</span>
							</div>
						</motion.div>

						<motion.h1
							{...fadeUp(0.06)}
							className="font-display font-extrabold tracking-tighter leading-[1.05] text-4xl sm:text-5xl md:text-6xl"
						>
							<span className="block brand-text">Build What’s Next.</span>
							<span className="block mt-1 text-primary">Together.</span>
						</motion.h1>

						<motion.p
							{...fadeUp(0.14)}
							className="mt-5 text-[0.98rem] sm:text-lg md:text-xl text-secondary max-w-2xl mx-auto lg:mx-0"
						>
							A hands-on community for builders. Join project pods, get peer feedback,
							and ship work that matters.
						</motion.p>

						<motion.div
							{...fadeUp(0.22)}
							className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 sm:gap-4 w-full"
						>
							<motion.button
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								onClick={() => navigate('/auth', { state: { tab: 'register' } })}
								className="btn btn-primary w-full sm:w-auto"
							>
								Join the Club
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
								className="btn btn-secondary w-full sm:w-auto"
							>
								<PlayCircle className="w-5 h-5" />
								How It Works
							</motion.button>
						</motion.div>
					</div>

					{/* Right Column: Visuals (Second on mobile) */}
					<motion.div {...fadeUp(0.1)} className="order-1 lg:order-2 lg:col-span-5">
						<div className="hero-visuals-container min-h-[clamp(340px,45vw,520px)]">
							{/* Card 1: Team Pod */}
							<motion.div
								className="hero-card"
								initial={{ rotate: -8 }}
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
									<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/12 border border-blue-500/20">
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

							{/* Card 2: Code */}
							<motion.div
								className="hero-card"
								initial={{ rotate: 6 }}
								animate={
									prefersReducedMotion
										? {}
										: {
												y: [0, 15, 0],
												transition: {
													duration: 10,
													repeat: Infinity,
													ease: 'easeInOut',
													delay: 0.8,
												},
										  }
								}
							>
								<div className="p-3">
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

							{/* Card 3: Design */}
							<motion.div
								className="hero-card"
								initial={{ rotate: 10 }}
								animate={
									prefersReducedMotion
										? {}
										: {
												y: [0, -8, 0],
												transition: {
													duration: 9,
													repeat: Infinity,
													ease: 'easeInOut',
													delay: 0.4,
												},
										  }
								}
							>
								<div className="flex items-center gap-3 p-3">
									<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-500/12 border border-pink-500/20">
										<Palette className="w-5 h-5 text-pink-400" />
									</div>
									<div>
										<p className="font-bold text-sm text-primary">UI Kit v2</p>
										<p className="text-xs text-secondary">Figma Library</p>
									</div>
								</div>
							</motion.div>

							{/* Card 4: Shipping */}
							<motion.div
								className="hero-card"
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
													delay: 1.2,
												},
										  }
								}
							>
								<div className="flex items-center gap-3 p-3">
									<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/12 border border-purple-500/20">
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
