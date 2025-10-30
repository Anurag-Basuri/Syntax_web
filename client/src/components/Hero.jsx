import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
	const navigate = useNavigate();
	const dots = Array.from({ length: 8 });

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
				{/* Main heading */}
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.8, ease: 'easeOut' }}
					className="mb-6 md:mb-8"
				>
					<h1 className="text-display-lg font-brand bg-gradient-to-r from-indigo-200 via-blue-200 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(99,102,241,0.2)]">
						SYNTAX
					</h1>
				</motion.div>

				{/* Subheading */}
				<motion.p
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
					className="text-lg md:text-xl text-slate-300 font-body max-w-2xl mx-auto mb-12 md:mb-16 leading-relaxed"
				>
					Create. Collaborate. Ship. A multidisciplinary community where builders turn
					ideas into impact.
				</motion.p>

				{/* CTAs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
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

				{/* Scroll indicator */}
				<motion.div
					className="mt-16 md:mt-20 flex justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.8 }}
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
