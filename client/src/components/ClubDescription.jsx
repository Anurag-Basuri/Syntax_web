import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const ClubDescription = () => {
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 30 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.6,
				type: 'spring',
				damping: 12,
			},
		},
	};

	const statVariants = {
		hidden: { opacity: 0, scale: 0.8 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: {
				duration: 0.6,
				type: 'spring',
				stiffness: 300,
			},
		},
	};

	return (
		<section className="py-24 px-4 relative z-10 overflow-hidden">
			{/* Decorative floating elements */}
			<motion.div
				className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl -z-10"
				animate={{
					scale: [1, 1.1, 1],
					rotate: [0, 10, 0],
				}}
				transition={{
					duration: 8,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
			/>
			<motion.div
				className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl -z-10"
				animate={{
					scale: [1, 1.15, 1],
					rotate: [0, -15, 0],
				}}
				transition={{
					duration: 10,
					repeat: Infinity,
					ease: 'easeInOut',
					delay: 2,
				}}
			/>

			<div className="max-w-6xl mx-auto">
				<motion.div
					ref={ref}
					variants={containerVariants}
					initial="hidden"
					animate={inView ? 'visible' : 'hidden'}
					className="grid grid-cols-1 lg:grid-cols-2 gap-10"
				>
					{/* Who We Are Card */}
					<motion.div variants={itemVariants} className="relative">
						<div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 h-full shadow-2xl shadow-blue-900/20 overflow-hidden">
							{/* Decorative corner element */}
							<div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-bl-full backdrop-blur-sm" />

							<div className="relative z-10">
								<div className="flex items-center gap-3 mb-6">
									<div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
										<svg
											className="w-6 h-6 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											/>
										</svg>
									</div>
									<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
										Who We Are
									</h2>
								</div>

								<div className="space-y-4">
									<p className="text-base md:text-lg text-blue-100 leading-relaxed">
										Syntax is a collective of passionate developers, designers,
										and tech enthusiasts dedicated to fostering a vibrant
										culture of innovation and learning.
									</p>
									<p className="text-base md:text-lg text-blue-100 leading-relaxed">
										We bridge the gap between theory and practice, providing a
										platform for members to grow their skills, build amazing
										projects, and connect with the tech industry.
									</p>
								</div>

								<div className="mt-8 grid grid-cols-3 gap-4">
									{[
										{ value: '200+', label: 'Members' },
										{ value: '50+', label: 'Projects' },
										{ value: '12+', label: 'Domains' },
									].map((stat, index) => (
										<motion.div
											key={index}
											variants={statVariants}
											className="text-center bg-blue-900/30 backdrop-blur-sm py-4 rounded-xl border border-white/10"
										>
											<div className="text-2xl font-bold text-cyan-300">
												{stat.value}
											</div>
											<div className="text-sm text-blue-200 mt-1">
												{stat.label}
											</div>
										</motion.div>
									))}
								</div>
							</div>
						</div>

						{/* Floating abstract shape */}
						<motion.div
							className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-xl -z-10"
							animate={{
								scale: [1, 1.2, 1],
								rotate: [0, 15, 0],
							}}
							transition={{
								duration: 8,
								repeat: Infinity,
								repeatType: 'reverse',
								ease: 'easeInOut',
							}}
						/>
					</motion.div>

					{/* What We Do Card */}
					<motion.div variants={itemVariants} className="relative">
						<div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 h-full shadow-2xl shadow-indigo-900/20 overflow-hidden">
							{/* Decorative corner element */}
							<div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-bl-full backdrop-blur-sm" />

							<div className="relative z-10">
								<div className="flex items-center gap-3 mb-6">
									<div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
										<svg
											className="w-6 h-6 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
									</div>
									<h2 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
										What We Do
									</h2>
								</div>

								<motion.div
									className="grid grid-cols-1 md:grid-cols-2 gap-6"
									variants={containerVariants}
								>
									{[
										{
											title: 'Skill Development',
											desc: 'Workshops on AI, blockchain, cloud computing and emerging tech.',
											icon: '📚',
											color: 'from-blue-600/20 to-cyan-600/20',
										},
										{
											title: 'Project Building',
											desc: 'Collaborative solutions to real-world problems.',
											icon: '🚀',
											color: 'from-indigo-600/20 to-purple-600/20',
										},
										{
											title: 'Industry Connect',
											desc: 'Tech talks and networking with professionals.',
											icon: '🤝',
											color: 'from-purple-600/20 to-pink-600/20',
										},
										{
											title: 'Innovation Labs',
											desc: 'Hackathons and creative coding challenges.',
											icon: '💻',
											color: 'from-pink-600/20 to-red-600/20',
										},
									].map((item, index) => (
										<motion.div
											key={index}
											variants={itemVariants}
											className={`bg-gradient-to-br ${item.color} backdrop-blur-lg border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.03]`}
										>
											<div className="flex gap-4 items-start">
												<div className="text-3xl mt-1">{item.icon}</div>
												<div>
													<h3 className="text-xl font-semibold text-white mb-1">
														{item.title}
													</h3>
													<p className="text-blue-100 text-sm">
														{item.desc}
													</p>
												</div>
											</div>
										</motion.div>
									))}
								</motion.div>
							</div>
						</div>

						{/* Floating abstract shape */}
						<motion.div
							className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl -z-10"
							animate={{
								scale: [1, 1.3, 1],
								rotate: [0, -15, 0],
							}}
							transition={{
								duration: 10,
								repeat: Infinity,
								repeatType: 'reverse',
								ease: 'easeInOut',
							}}
						/>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
};

export default ClubDescription;
