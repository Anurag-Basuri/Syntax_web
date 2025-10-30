import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const ClubDescription = () => {
	const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
	};
	const itemVariants = {
		hidden: { opacity: 0, y: 30 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.6, type: 'spring', damping: 12 } },
	};
	const statVariants = {
		hidden: { opacity: 0, scale: 0.8 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: { duration: 0.6, type: 'spring', stiffness: 300 },
		},
	};

	return (
		<section className="section-container py-normal px-4 bg-transparent relative z-10 overflow-hidden">
			{/* Decorative floating elements */}
			<motion.div
				className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indigo-600/5 blur-3xl -z-10"
				animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.5, 0.35] }}
				transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
			/>
			<motion.div
				className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-purple-600/5 blur-3xl -z-10"
				animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.4, 0.25] }}
				transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
			/>
			<div className="max-w-7xl mx-auto">
				<motion.div
					ref={ref}
					variants={containerVariants}
					initial="hidden"
					animate={inView ? 'visible' : 'hidden'}
					className="grid grid-cols-1 lg:grid-cols-2 gap-8"
				>
					{/* Programs & Tracks */}
					<motion.div variants={itemVariants} className="relative group">
						<div className="glass-card p-6 md:p-8 h-full hover-lift transition-all">
							<div className="relative z-10">
								<h2 className="text-display-sm mb-4 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
									Programs & Tracks
								</h2>
								<p className="text-base md:text-lg text-slate-200/90 leading-relaxed mb-6">
									Pick a track, join a pod, and start shipping. We keep cohorts
									small and focused.
								</p>
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
									{['Web', 'AI/ML', 'Cloud', 'DevOps', 'Design', 'Product'].map(
										(t) => (
											<span
												key={t}
												className="text-center text-sm text-cyan-200/90 glass-card border-white/15 rounded-lg py-2"
											>
												{t}
											</span>
										)
									)}
								</div>
								<div className="mt-8 grid grid-cols-3 gap-4">
									{[
										{ value: '200+', label: 'Members' },
										{ value: '60+', label: 'Projects' },
										{ value: '15+', label: 'Pods' },
									].map((stat, i) => (
										<motion.div
											key={i}
											variants={statVariants}
											className="glass-card text-center py-4"
										>
											<div className="text-2xl font-bold text-cyan-300">
												{stat.value}
											</div>
											<div className="text-sm text-slate-300 mt-1">
												{stat.label}
											</div>
										</motion.div>
									))}
								</div>
							</div>
						</div>
					</motion.div>

					{/* The Build Journey */}
					<motion.div variants={itemVariants} className="relative group">
						<div className="glass-card p-6 md:p-8 h-full hover-lift transition-all">
							<div className="relative z-10">
								<h2 className="text-display-sm mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
									The Build Journey
								</h2>

								<motion.div
									variants={containerVariants}
									initial="hidden"
									animate={inView ? 'visible' : 'hidden'}
									className="grid grid-cols-1 sm:grid-cols-2 gap-4"
								>
									{[
										{
											title: 'Starter Labs',
											desc: 'Foundations and tools to get you shipping fast.',
											icon: '🧩',
										},
										{
											title: 'Build Sprints',
											desc: 'Two-week sprints with async reviews and demos.',
											icon: '⚡',
										},
										{
											title: 'Open Source Hours',
											desc: 'Pair on issues and learn the flow.',
											icon: '🌐',
										},
										{
											title: 'Demo Day',
											desc: 'Showcase, get feedback, celebrate.',
											icon: '🎤',
										},
									].map((item, idx) => (
										<motion.div
											key={idx}
											variants={itemVariants}
											className="glass-card p-5 hover-lift"
										>
											<div className="flex gap-4 items-start">
												<div className="text-3xl mt-1">{item.icon}</div>
												<div>
													<h3 className="text-lg font-semibold text-white mb-1">
														{item.title}
													</h3>
													<p className="text-slate-200/90 text-sm">
														{item.desc}
													</p>
												</div>
											</div>
										</motion.div>
									))}
								</motion.div>
							</div>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
};

export default ClubDescription;
