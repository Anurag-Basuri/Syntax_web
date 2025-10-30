import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Quote } from 'lucide-react';

const Hero = () => {
	const navigate = useNavigate();
	const dots = Array.from({ length: 8 });

	// Rotating micro-quotes
	const quotes = [
		'Start small. Ship often. Grow together.',
		'Design bravely. Build kindly.',
		'Real learning happens when you ship.',
		'Ideas are drafts—shipping is the edit.',
		'Make. Share. Iterate.',
	];
	const [qIndex, setQIndex] = useState(0);

	useEffect(() => {
		const t = setInterval(() => setQIndex((p) => (p + 1) % quotes.length), 4200);
		return () => clearInterval(t);
	}, []);

	return (
		<section className="relative min-h-[78vh] md:min-h-screen px-4 py-20 md:py-24 flex items-center bg-transparent">
			{/* Lightweight particles */}
			{dots.map((_, i) => (
				<motion.span
					key={i}
					className="pointer-events-none absolute w-1 h-1 rounded-full bg-indigo-300/20"
					style={{ top: `${(i * 13 + 7) % 90}%`, left: `${(i * 23 + 11) % 90}%` }}
					animate={{ y: [0, -10, 0], opacity: [0.2, 0.6, 0.2] }}
					transition={{
						duration: 3 + (i % 3),
						repeat: Infinity,
						delay: i * 0.2,
						ease: 'easeInOut',
					}}
				/>
			))}

			<div className="relative z-[1] w-full max-w-6xl mx-auto text-center">
				{/* Subtle glowing ring behind the heading */}
				<div
					className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full opacity-10 blur-3xl hidden md:block"
					style={{
						background:
							'radial-gradient(40% 40% at 50% 50%, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0.0) 60%)',
					}}
				/>

				{/* Main heading */}
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.96 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.8, ease: 'easeOut' }}
					className="mb-4 md:mb-5"
				>
					<h1 className="text-display-lg font-brand bg-gradient-to-r from-indigo-200 via-blue-200 to-purple-200 bg-clip-text text-transparent tracking-tight drop-shadow-[0_0_30px_rgba(99,102,241,0.18)]">
						SYNTAX
					</h1>
				</motion.div>

				{/* Curved, italic accent line */}
				<motion.p
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
					className="font-accent italic-soft text-xl md:text-2xl text-slate-200/95 -rotate-[1.2deg] mb-6 md:mb-8"
				>
					Create • Collaborate • Ship
				</motion.p>

				{/* Animated swoosh under the accent line */}
				<motion.svg
					viewBox="0 0 600 80"
					className="mx-auto mb-10 md:mb-14 w-[82%] max-w-[620px] h-10"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
				>
					<defs>
						<linearGradient id="hero-swoosh" x1="0" x2="1" y1="0" y2="0">
							<stop offset="0%" stopColor="#a78bfa" />
							<stop offset="50%" stopColor="#60a5fa" />
							<stop offset="100%" stopColor="#34d399" />
						</linearGradient>
					</defs>
					<motion.path
						d="M10,60 C150,10 450,110 590,30"
						fill="none"
						stroke="url(#hero-swoosh)"
						strokeWidth="3"
						strokeLinecap="round"
						strokeDasharray="640"
						strokeDashoffset="640"
						animate={{ strokeDashoffset: [640, 0] }}
						transition={{ duration: 1.6, ease: 'easeInOut' }}
					/>
				</motion.svg>

				{/* Supporting copy */}
				<motion.p
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
					className="text-lg md:text-xl text-slate-300 font-body max-w-2xl mx-auto mb-10 md:mb-14 leading-relaxed"
				>
					A multidisciplinary community where builders turn ideas into impact.
				</motion.p>

				{/* CTAs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.22, ease: 'easeOut' }}
					className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6"
				>
					<motion.button
						whileHover={{ scale: 1.05, y: -2 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => navigate('/event')}
						className="w-full sm:w-auto btn-primary"
						aria-label="Explore Events"
					>
						Explore Events
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.05, y: -2 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => navigate('/auth', { state: { tab: 'register' } })}
						className="w-full sm:w-auto btn-secondary"
						aria-label="Join Syntax"
					>
						Join Syntax
					</motion.button>
				</motion.div>

				{/* Rotating micro‑quotes */}
				<div className="mt-8 md:mt-10 flex justify-center">
					<div className="hero-quote inline-flex items-center gap-2 px-4 py-2">
						<Quote className="w-4 h-4 text-purple-300/80" />
						<div className="relative h-5 overflow-hidden">
							<AnimatePresence mode="wait">
								<motion.span
									key={qIndex}
									initial={{ y: 20, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: -20, opacity: 0 }}
									transition={{ duration: 0.35, ease: 'easeOut' }}
									className="text-slate-200 text-sm font-accent italic-soft whitespace-nowrap"
								>
									{quotes[qIndex]}
								</motion.span>
							</AnimatePresence>
						</div>
					</div>
				</div>

				{/* Scroll indicator */}
				<motion.div
					className="mt-12 md:mt-16 flex justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6 }}
				>
					<div className="h-10 w-6 rounded-full border border-slate-400/30 flex items-start justify-center p-1">
						<motion.div
							className="h-2 w-2 rounded-full bg-slate-300/60"
							animate={{ y: [0, 16, 0], opacity: [0.8, 0.3, 0.8] }}
							transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
						/>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default Hero;
