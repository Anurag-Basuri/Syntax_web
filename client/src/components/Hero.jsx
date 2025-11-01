import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Users, Code2, Rocket, CalendarDays, PlayCircle } from 'lucide-react';

const Hero = () => {
	const navigate = useNavigate();
	const prefersReducedMotion = useReducedMotion();

	const quotes = [
		'Make. Share. Iterate.',
		'Design bravely. Build kindly.',
		'Start small. Ship often. Grow together.',
		'Real learning happens when you ship.',
		'Ideas are drafts—shipping is the edit.',
	];
	const [qIndex, setQIndex] = useState(0);

	useEffect(() => {
		const t = setInterval(() => setQIndex((p) => (p + 1) % quotes.length), 4500);
		return () => clearInterval(t);
	}, []);

	const fadeUp = (delay = 0) => ({
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
	});

	return (
		<section className="relative overflow-hidden">
			{/* Decorative mesh */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="hero-mesh top-[-15%] left-[-10%]" />
				<div className="hero-mesh bottom-[-20%] right-[-15%]" />
			</div>

			<div className="page-container section-padding">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
					{/* Left: Copy */}
					<div className="text-center lg:text-left lg:col-span-7">
						<motion.div {...fadeUp(0)} className="mb-6 inline-flex">
							<div className="glass-card px-4 py-2 inline-flex items-center gap-2 text-sm">
								<Sparkles className="w-4 h-4 text-primary" />
								<span className="text-secondary font-medium">
									Builder-first club for designers & developers
								</span>
							</div>
						</motion.div>

						<motion.h1
							{...fadeUp(0.05)}
							className="font-display font-extrabold tracking-tight leading-[1.05] text-4xl sm:text-6xl md:text-7xl"
						>
							<span className="block brand-text">Ship real projects.</span>
							<span className="block mt-1 text-primary">Together.</span>
						</motion.h1>

						<motion.p
							{...fadeUp(0.12)}
							className="mt-5 text-base sm:text-lg md:text-xl text-secondary max-w-2xl mx-auto lg:mx-0"
						>
							Hands-on pods, peer reviews, and mentorship to help you design, code,
							and ship production-grade work—then showcase it with the community.
						</motion.p>

						<motion.div
							{...fadeUp(0.2)}
							className="mt-8 flex flex-col sm:flex-row items-center lg:items-start gap-3.5 sm:gap-4"
						>
							<motion.button
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								onClick={() => navigate('/event')}
								className="btn btn-primary group inline-flex items-center gap-2"
							>
								<span>Explore Events</span>
								<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
							</motion.button>

							<motion.button
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								onClick={() => navigate('/auth', { state: { tab: 'register' } })}
								className="btn btn-secondary"
							>
								Join Syntax
							</motion.button>

							<button
								onClick={() =>
									document
										.getElementById('about-syntax')
										?.scrollIntoView({ behavior: 'smooth', block: 'start' })
								}
								className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
								aria-label="See how it works"
							>
								<PlayCircle className="w-4 h-4" />
								How it works
							</button>
						</motion.div>

						{/* Feature chips */}
						<motion.div
							{...fadeUp(0.28)}
							className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3"
						>
							<div className="glass-card px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm">
								<Users className="w-4 h-4 text-primary" />
								<span className="text-secondary">Peer-led pods</span>
							</div>
							<div className="glass-card px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm">
								<Code2 className="w-4 h-4 text-primary" />
								<span className="text-secondary">Design × Code collabs</span>
							</div>
							<div className="glass-card px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm">
								<Rocket className="w-4 h-4 text-primary" />
								<span className="text-secondary">Ship + showcase</span>
							</div>
							<div className="glass-card px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm">
								<CalendarDays className="w-4 h-4 text-primary" />
								<span className="text-secondary">Weekly sprints</span>
							</div>
						</motion.div>

						{/* Stats + rotating quote */}
						<motion.div {...fadeUp(0.35)} className="mt-8 space-y-6">
							<div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-sm sm:text-base text-muted">
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
									<span>
										<strong className="text-primary">200+</strong> members
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-2 h-2 rounded-full bg-accent animate-pulse-soft"
										style={{ animationDelay: '0.6s' }}
									/>
									<span>
										<strong className="text-primary">60+</strong> projects
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-2 h-2 rounded-full bg-accent animate-pulse-soft"
										style={{ animationDelay: '1.2s' }}
									/>
									<span>
										<strong className="text-primary">15+</strong> pods
									</span>
								</div>
							</div>

							<div className="flex justify-center lg:justify-start">
								<div className="glass-card px-5 py-3 max-w-xl w-full">
									<div className="relative h-6 sm:h-7 overflow-hidden text-center">
										<AnimatePresence mode="wait">
											<motion.p
												key={qIndex}
												initial={{ y: 20, opacity: 0 }}
												animate={{ y: 0, opacity: 1 }}
												exit={{ y: -20, opacity: 0 }}
												transition={{ duration: 0.4 }}
												className="text-xs sm:text-sm text-secondary font-medium italic"
											>
												"{quotes[qIndex]}"
											</motion.p>
										</AnimatePresence>
									</div>
								</div>
							</div>
						</motion.div>
					</div>

					{/* Right: Media card */}
					<motion.div {...fadeUp(0.15)} className="lg:col-span-5">
						<div className="relative">
							{/* Soft spotlight */}
							<div
								className="absolute -inset-8 rounded-[28px] blur-2xl opacity-70"
								style={{
									background:
										'radial-gradient(60% 60% at 60% 40%, var(--spotlight), transparent 70%)',
								}}
								aria-hidden
							/>
							{/* Card */}
							<div
								className="relative glass-card overflow-hidden rounded-3xl p-4 sm:p-5 md:p-6 tilt-card animate-float"
								style={{ animationDuration: prefersReducedMotion ? '0s' : '16s' }}
							>
								{/* Window bar */}
								<div className="flex items-center gap-1.5 mb-4">
									<span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
									<span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
									<span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
									<span className="ml-3 text-xs text-muted">app.jsx — demo</span>
								</div>

								{/* Mock code lines with shimmer */}
								<div className="space-y-2.5">
									<div className="code-line w-[76%]" />
									<div className="code-line w-[58%]" />
									<div className="code-line w-[88%]" />
									<div className="code-line w-[65%]" />
									<div className="code-line w-[42%]" />
									<div className="code-block mt-3">
										<div className="code-line w-[82%]" />
										<div className="code-line w-[72%]" />
										<div className="code-line w-[54%]" />
									</div>
								</div>

								{/* Sheen */}
								<div className="sheen" aria-hidden />
							</div>
						</div>
					</motion.div>
				</div>

				{/* Scroll cue */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="mt-12 md:mt-16 flex justify-center"
				>
					<div
						className="h-12 w-7 rounded-full border flex items-start justify-center p-2"
						style={{ borderColor: 'var(--glass-border)' }}
					>
						<motion.div
							className="h-2.5 w-2.5 rounded-full"
							style={{ background: 'var(--accent-1)' }}
							animate={
								prefersReducedMotion
									? {}
									: { y: [0, 20, 0], opacity: [0.8, 0.3, 0.8] }
							}
							transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
						/>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default Hero;
