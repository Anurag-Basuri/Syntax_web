import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
	const navigate = useNavigate();

	// Lightweight particles (reduced count for performance on mobile)
	const dots = Array.from({ length: 8 });

	return (
		<section className="relative min-h-[80vh] md:min-h-screen px-4 py-16 flex items-center bg-transparent">
			{/* Transparent background (no overlays) */}

			{/* Subtle floating particles */}
			{dots.map((_, i) => (
				<motion.span
					key={i}
					className="pointer-events-none absolute w-1 h-1 rounded-full bg-indigo-300/30"
					style={{
						top: `${(i * 13 + 7) % 90}%`,
						left: `${(i * 23 + 11) % 90}%`,
					}}
					animate={{ y: [0, -10, 0], opacity: [0.3, 0.8, 0.3] }}
					transition={{
						duration: 3 + (i % 3),
						repeat: Infinity,
						delay: i * 0.2,
						ease: 'easeInOut',
					}}
				/>
			))}

			<div className="relative z-[1] w-full max-w-6xl mx-auto text-center">
				{/* Top badge */}
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="inline-flex items-center mx-auto mb-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1.5 text-xs md:text-sm text-indigo-200"
				>
					Student Organization • Lovely Professional University
				</motion.div>

				{/* Brand name */}
				<motion.h1
					initial={{ opacity: 0, y: 10, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.7 }}
					className="mb-3"
				>
					<span className="font-brand text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight inline-block bg-gradient-to-r from-indigo-300 via-blue-300 to-purple-300 text-transparent bg-clip-text drop-shadow-[0_4px_24px_rgba(99,102,241,0.25)]">
						SYNTAX
					</span>
				</motion.h1>

				{/* Short descriptor */}
				<motion.p
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.05 }}
					className="text-sm sm:text-base md:text-lg text-indigo-200/90"
				>
					A multidisciplinary student organization at Lovely Professional University.
				</motion.p>

				{/* Mission */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.1 }}
					className="mt-6 space-y-4 max-w-3xl mx-auto text-indigo-100"
				>
					<p className="text-base sm:text-lg leading-relaxed">
						We bring together students from every department — not just computer science
						— to collaborate, innovate, and grow together.
					</p>

					<div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 sm:p-5 text-left">
						<p className="text-sm sm:text-base font-semibold text-indigo-200 mb-2">
							Our Mission
						</p>
						<ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
							<li>Students learn, build, and lead through real experiences.</li>
							<li>Ideas evolve into impactful projects and events.</li>
							<li>Everyone gains hands-on exposure beyond classroom learning.</li>
						</ul>
					</div>

					<p className="italic text-indigo-200/90 text-sm sm:text-base">
						“Syntax is where creativity meets execution.”
					</p>
				</motion.div>

				{/* CTAs */}
				<motion.div
					initial={{ opacity: 0, y: 14 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.2 }}
					className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
				>
					<motion.button
						whileHover={{ scale: 1.04 }}
						whileTap={{ scale: 0.97 }}
						onClick={() => navigate('/auth', { state: { tab: 'register' } })}
						className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base font-semibold shadow-lg shadow-indigo-900/30"
						aria-label="Join Syntax"
					>
						Join Syntax
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.04 }}
						whileTap={{ scale: 0.97 }}
						onClick={() => navigate('/event')}
						className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl border border-white/15 bg-white/5 backdrop-blur-md text-white/90 text-sm sm:text-base"
						aria-label="Explore Events"
					>
						Explore Events
					</motion.button>
				</motion.div>

				{/* Scroll indicator */}
				<motion.div
					className="mt-10 flex justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6 }}
				>
					<div className="h-10 w-6 rounded-full border border-white/20 flex items-start justify-center p-1">
						<motion.div
							className="h-2 w-2 rounded-full bg-white/70"
							animate={{ y: [0, 16, 0], opacity: [1, 0.5, 1] }}
							transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
						/>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default Hero;
