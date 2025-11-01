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

	return (
		<section className="relative min-h-[85vh] md:min-h-screen px-4 py-24 md:py-32 flex items-center bg-transparent overflow-hidden">
			{/* Soft accent glows */}
			<div
				aria-hidden
				className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full blur-[90px] opacity-60"
				style={{
					background:
						'radial-gradient(circle at 40% 40%, color-mix(in srgb, var(--accent-1) 45%, transparent), transparent 60%)',
				}}
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -bottom-16 -right-16 w-80 h-80 rounded-full blur-[90px] opacity-60"
				style={{
					background:
						'radial-gradient(circle at 60% 60%, color-mix(in srgb, var(--accent-2) 40%, transparent), transparent 60%)',
				}}
			/>

			{/* Floating particles */}
			{!prefersReducedMotion &&
				Array.from({ length: 6 }).map((_, i) => (
					<motion.div
						key={i}
						className="pointer-events-none absolute w-1.5 h-1.5 rounded-full"
						style={{
							background: 'color-mix(in srgb, var(--accent-1) 40%, transparent)',
							top: `${(i * 17 + 10) % 80}%`,
							left: `${(i * 29 + 15) % 85}%`,
						}}
						animate={{ y: [0, -12, 0], opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
						transition={{
							duration: 4 + (i % 2),
							repeat: Infinity,
							delay: i * 0.3,
							ease: 'easeInOut',
						}}
					/>
				))}

			<div className="relative z-10 w-full max-w-6xl mx-auto text-center">
				{/* Badge */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="mb-8 inline-flex"
				>
					<div className="glass-card px-5 py-2.5 inline-flex items-center gap-2 text-sm">
						<Sparkles className="w-4 h-4 text-accent" />
						<span className="text-secondary font-medium">
							Builder-first club for designers & developers
						</span>
					</div>
				</motion.div>

				{/* Heading */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.1 }}
					className="mb-6"
				>
					<h1 className="font-display font-extrabold tracking-tight leading-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
						<span className="block brand-text">Ship real projects.</span>
						<span className="block mt-1 text-primary">Together.</span>
					</h1>
					<p className="mt-4 text-xl sm:text-2xl md:text-3xl text-muted font-display font-medium tracking-wide">
						Learn by building. Grow by sharing. Win as a team.
					</p>
				</motion.div>

				{/* Subheading */}
				<motion.p
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.2 }}
					className="text-base sm:text-lg md:text-xl text-secondary font-body max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed"
				>
					Hands-on pods, peer reviews, and mentorship to help you design, code, and ship
					production-grade work—then showcase it with the community.
				</motion.p>

				{/* CTAs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.3 }}
					className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-10"
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
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.35 }}
					className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-8"
				>
					<div className="glass-card px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm">
						<Users className="w-4 h-4 text-accent" />
						<span className="text-secondary">Peer-led pods</span>
					</div>
					<div className="glass-card px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm">
						<Code2 className="w-4 h-4 text-accent" />
						<span className="text-secondary">Design × Code collabs</span>
					</div>
					<div className="glass-card px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm">
						<Rocket className="w-4 h-4 text-accent" />
						<span className="text-secondary">Ship + showcase</span>
					</div>
					<div className="glass-card px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm">
						<CalendarDays className="w-4 h-4 text-accent" />
						<span className="text-secondary">Weekly sprints</span>
					</div>
				</motion.div>

				{/* Stats */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.45 }}
					className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm sm:text-base text-muted mb-10"
				>
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
						<span>
							<strong className="text-primary">200+</strong> members
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div
							className="w-2 h-2 rounded-full bg-accent animate-pulse-soft"
							style={{ animationDelay: '0.6s', opacity: 0.9 }}
						/>
						<span>
							<strong className="text-primary">60+</strong> projects
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div
							className="w-2 h-2 rounded-full bg-accent animate-pulse-soft"
							style={{ animationDelay: '1.2s', opacity: 0.7 }}
						/>
						<span>
							<strong className="text-primary">15+</strong> pods
						</span>
					</div>
				</motion.div>

				{/* Rotating quote */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.55 }}
					className="flex justify-center"
				>
					<div className="glass-card px-6 py-3 max-w-xl">
						<div className="relative h-6 sm:h-7 overflow-hidden">
							<AnimatePresence mode="wait">
								<motion.p
									key={qIndex}
									initial={{ y: 20, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: -20, opacity: 0 }}
									transition={{ duration: 0.4 }}
									className="text-xs sm:text-sm text-secondary font-medium italic text-center"
								>
									"{quotes[qIndex]}"
								</motion.p>
							</AnimatePresence>
						</div>
					</div>
				</motion.div>

				{/* Scroll indicator */}
				<motion.div
					className="mt-14 md:mt-16 flex justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.7 }}
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
