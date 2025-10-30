import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
	const navigate = useNavigate();

	return (
		<section className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden">
			{/* Background Gradient */}
			<div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-[#1a1f3a]"></div>
			</div>

			{/* Floating particles */}
			{[...Array(15)].map((_, i) => (
				<motion.div
					key={i}
					className="absolute rounded-full pointer-events-none"
					style={{
						top: `${Math.random() * 90 + 5}%`,
						left: `${Math.random() * 90 + 5}%`,
						width: `${Math.random() * 10 + 5}px`,
						height: `${Math.random() * 10 + 5}px`,
						background: `rgba(99, 102, 241, ${Math.random() * 0.4 + 0.1})`,
					}}
					animate={{
						y: [0, Math.random() * 40 - 20],
						x: [0, Math.random() * 40 - 20],
					}}
					transition={{
						duration: Math.random() * 5 + 5,
						repeat: Infinity,
						repeatType: 'reverse',
						ease: 'easeInOut',
					}}
				></motion.div>
			))}

			<div className="max-w-6xl w-full mx-auto text-center relative z-10 pt-10 pb-16 md:pt-32 md:pb-24">
				<motion.div
					initial="hidden"
					animate="visible"
					variants={{
						hidden: { opacity: 0 },
						visible: {
							opacity: 1,
							transition: { staggerChildren: 0.15, delayChildren: 0.2 },
						},
					}}
					className="mb-12"
				>
					{/* Club name with elegant typography */}
					<motion.div
						variants={{
							hidden: { opacity: 0, scale: 0.9, y: 10 },
							visible: { opacity: 1, scale: 1, y: 0 },
						}}
						transition={{ duration: 0.8, type: 'spring' }}
						className="inline-block mb-10"
					>
						<div className="flex items-center justify-center gap-4">
							<span className="text-5xl md:text-7xl font-extrabold tracking-widest bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg animate-gradient-x">
								SYNTAX
							</span>
						</div>
						<div className="text-sm md:text-base font-light text-indigo-300 tracking-wide mt-1">
							The official coding and development club of our institution.
						</div>
					</motion.div>

					<motion.h1
						className="text-4xl md:text-6xl font-bold mt-4 mb-6"
						variants={{
							hidden: { opacity: 0, y: 30 },
							visible: { opacity: 1, y: 0 },
						}}
						transition={{ duration: 0.8, ease: 'easeOut' }}
					>
						<div className="font-serif italic text-white mb-3">Where Logic Meets</div>
						<div className="bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
							Creative Code
						</div>
					</motion.h1>

					<motion.p
						className="text-lg md:text-xl max-w-3xl mx-auto text-indigo-200 font-light"
						variants={{
							hidden: { opacity: 0 },
							visible: { opacity: 1 },
						}}
						transition={{ duration: 0.8 }}
					>
						A community of developers building tomorrow through collaboration,
						creativity, and transformative technology.
					</motion.p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.9, duration: 0.8 }}
					className="mt-8 md:mt-16 flex flex-col sm:flex-row gap-5 justify-center"
				>
					<motion.button
						whileHover={{
							scale: 1.05,
							boxShadow: '0 5px 20px rgba(99, 102, 241, 0.4)',
						}}
						whileTap={{ scale: 0.95 }}
						className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-lg shadow-lg flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
						onClick={() => navigate('/auth', { state: { tab: 'register' } })}
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
							/>
						</svg>
						Join Our Community
					</motion.button>

					<motion.button
						whileHover={{
							scale: 1.05,
							backgroundColor: 'rgba(255, 255, 255, 0.08)',
						}}
						whileTap={{ scale: 0.95 }}
						className="px-8 py-4 bg-white/5 backdrop-blur-lg border border-indigo-500/30 rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
						onClick={() => navigate('/event')}
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						Explore Events
					</motion.button>
				</motion.div>
			</div>

			{/* Animated "Discover More" scroll indicator */}
			<motion.div
				className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-20"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 1.2, duration: 0.8 }}
			>
				<motion.div
					animate={{ y: [0, 12, 0] }}
					transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
					className="w-8 h-12 rounded-full border-2 border-indigo-400/60 bg-gradient-to-b from-indigo-700/30 to-purple-700/20 shadow-xl flex flex-col items-center justify-start p-1 backdrop-blur-md"
				>
					<motion.div
						className="w-2 h-2 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 rounded-full mt-2 shadow-md"
						animate={{ y: [0, 10, 0], opacity: [1, 0.7, 1] }}
						transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
					/>
					<motion.div
						className="w-1 h-4 mt-1 rounded-full bg-indigo-400/30"
						animate={{ scaleY: [1, 1.2, 1] }}
						transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
					/>
				</motion.div>
			</motion.div>

			{/* Enhanced floating decorative elements */}
			<motion.div
				className="absolute top-1/4 left-2 md:left-10 w-32 md:w-56 h-32 md:h-56 rounded-full bg-gradient-to-br from-indigo-700/20 via-blue-700/10 to-purple-700/20 blur-3xl shadow-2xl pointer-events-none"
				animate={{ scale: [1, 1.12, 1], rotate: [0, 8, 0] }}
				transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
			></motion.div>
			<motion.div
				className="absolute bottom-1/3 right-6 md:right-10 w-44 md:w-64 h-44 md:h-64 rounded-full bg-gradient-to-br from-purple-700/20 via-indigo-700/10 to-blue-700/20 blur-3xl shadow-2xl pointer-events-none"
				animate={{ scale: [1, 1.18, 1], rotate: [0, -8, 0] }}
				transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
			></motion.div>
		</section>
	);
};

export default Hero;
