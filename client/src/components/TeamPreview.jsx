import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { publicClient } from '../services/api';

const CARD_THEMES = [
	{
		bg: 'from-violet-500/20 via-purple-500/20 to-fuchsia-500/20',
		accent: 'violet-400',
		glow: '143, 101, 255, 0.3',
	},
	{
		bg: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
		accent: 'cyan-400',
		glow: '34, 211, 238, 0.3',
	},
	{
		bg: 'from-emerald-500/20 via-green-500/20 to-lime-500/20',
		accent: 'emerald-400',
		glow: '52, 211, 153, 0.3',
	},
	{
		bg: 'from-orange-500/20 via-amber-500/20 to-yellow-500/20',
		accent: 'amber-400',
		glow: '251, 191, 36, 0.3',
	},
	{
		bg: 'from-pink-500/20 via-rose-500/20 to-red-500/20',
		accent: 'rose-400',
		glow: '251, 113, 133, 0.3',
	},
	{
		bg: 'from-indigo-500/20 via-blue-500/20 to-purple-500/20',
		accent: 'indigo-400',
		glow: '99, 102, 241, 0.3',
	},
];

const footerLinks = [
	{
		title: 'Company',
		links: [
			{ label: 'About', url: '/about' },
			{ label: 'Team', url: '/team' },
			{ label: 'Careers', url: '/careers' },
		],
	},
	{
		title: 'Community',
		links: [
			{ label: 'Projects', url: '/projects' },
			{ label: 'Blog', url: '/blog' },
			{ label: 'Instagram', url: 'https://www.instagram.com/syntaxclub/' },
		],
	},
	{
		title: 'Support',
		links: [
			{ label: 'FAQ', url: '/faq' },
			{ label: 'Contact', url: '/contact' },
			{ label: 'Privacy', url: '/privacy' },
		],
	},
];

const TeamPreview = () => {
	const [teamMembers, setTeamMembers] = useState([]);
	const [hoveredCard, setHoveredCard] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchLeaders = async () => {
			try {
				const response = await publicClient.get('/api/members/getleaders');
				setTeamMembers(
					Array.isArray(response.data?.data?.members) ? response.data.data.members : []
				);
			} catch (error) {
				setTeamMembers([]);
			}
		};
		fetchLeaders();
	}, []);

	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.08, delayChildren: 0.2 },
		},
	};

	const cardVariants = {
		hidden: { opacity: 0, y: 50, scale: 0.9, rotateX: -15 },
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			rotateX: 0,
			transition: { duration: 0.6, type: 'spring', stiffness: 100, damping: 15 },
		},
	};

	const getTheme = (index) => CARD_THEMES[index % CARD_THEMES.length];

	return (
		<div className="min-h-screen bg-transparent relative overflow-hidden">
			<div className="relative z-10 px-4 py-16 sm:py-24">
				<div className="max-w-7xl mx-auto">
					{/* Header Section */}
					<div className="text-center mb-16">
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8 }}
							className="space-y-6"
						>
							<motion.span
								className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/40 text-purple-200 text-base font-semibold shadow-lg backdrop-blur-md"
								whileHover={{ scale: 1.08 }}
							>
								Meet Our Core Team
							</motion.span>
							<p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
								The driving force behind Syntax. A diverse team of leaders, mentors,
								and builders working together to shape our future.
							</p>
						</motion.div>
					</div>
					<motion.div
						ref={ref}
						variants={containerVariants}
						initial="hidden"
						animate={inView ? 'visible' : 'hidden'}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16"
					>
						{teamMembers.map((member, index) => {
							const theme = getTheme(index);
							const isHovered = hoveredCard === index;

							return (
								<motion.div
									key={member.id}
									variants={cardVariants}
									onHoverStart={() => setHoveredCard(index)}
									onHoverEnd={() => setHoveredCard(null)}
									whileHover={{
										y: -10,
										transition: { duration: 0.3 },
									}}
									className="group relative"
								>
									{/* Glow Effect */}
									<motion.div
										className={`absolute -inset-0.5 bg-gradient-to-r ${theme.bg} rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
										style={
											isHovered
												? { boxShadow: `0 0 30px rgba(${theme.glow})` }
												: {}
										}
									/>

									{/* Card */}
									<div
										className={`relative bg-gradient-to-br ${theme.bg} backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden h-full bg-transparent`}
									>
										{/* Avatar Section */}
										<div className="relative p-6 pb-4">
											<motion.div
												className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24"
												whileHover={{ scale: 1.1 }}
												transition={{ duration: 0.3 }}
											>
												<div
													className={`absolute inset-0 rounded-full bg-gradient-to-br from-${theme.accent} to-white/20 blur-md opacity-50`}
												/>
												<img
													src={member.profilePicture}
													alt={member.fullName}
													className="relative w-full h-full rounded-full object-cover border-2 border-white/20 shadow-lg"
												/>
												<motion.div
													className={`absolute -bottom-1 -right-1 w-6 h-6 bg-${theme.accent} rounded-full border-2 border-gray-900 flex items-center justify-center`}
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													transition={{ delay: 0.5, type: 'spring' }}
												>
													<div className="w-2 h-2 bg-white rounded-full" />
												</motion.div>
											</motion.div>
										</div>

										{/* Content Section */}
										<div className="px-6 pb-6 text-center">
											<motion.h3
												className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-gray-100 transition-colors"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 0.3 }}
											>
												{member.fullName}
											</motion.h3>

											<motion.p
												className={`text-${theme.accent} text-sm sm:text-base font-medium opacity-90`}
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 0.4 }}
											>
												{member.designation}
											</motion.p>

											{/* Subtle decoration */}
											<motion.div
												className={`mt-4 h-0.5 bg-gradient-to-r from-transparent via-${theme.accent}/50 to-transparent`}
												initial={{ scaleX: 0 }}
												animate={{ scaleX: 1 }}
												transition={{ delay: 0.6, duration: 0.5 }}
											/>
										</div>
									</div>
								</motion.div>
							);
						})}
					</motion.div>

					{/* CTA Section */}
					<motion.div
						className="text-center"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.8, duration: 0.6 }}
					>
						<motion.button
							onClick={() => navigate('/team')}
							whileHover={{
								scale: 1.05,
								boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
							}}
							whileTap={{ scale: 0.95 }}
							className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full font-semibold text-white text-lg shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={true}
						>
							<span className="relative z-10 flex items-center gap-3">
								Explore Full Team
								<motion.svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									animate={{ x: [0, 5, 0] }}
									transition={{
										duration: 1.5,
										repeat: Infinity,
										ease: 'easeInOut',
									}}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									/>
								</motion.svg>
							</span>

							{/* Button glow effect */}
							<motion.div
								className="absolute inset-0 bg-gradient-to-r from-purple-400/50 via-pink-400/50 to-cyan-400/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
								animate={{
									scale: [1, 1.2, 1],
								}}
								transition={{
									duration: 2,
									repeat: Infinity,
									ease: 'easeInOut',
								}}
							/>
						</motion.button>
					</motion.div>
				</div>
			</div>

			{/* Footer Section */}
			<div className="bg-gray-900 py-16">
				<div className="max-w-7xl mx-auto px-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
						{/* Brand column */}
						<div className="lg:col-span-2">
							<div className="flex items-center gap-3 mb-6">
								<h3 className="text-white font-bold text-2xl bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
									Syntax Club
								</h3>
							</div>

							<p className="text-blue-200 mb-8 max-w-md leading-relaxed">
								Empowering the next generation of innovators through hands-on
								projects, mentorship, and a vibrant community. Join us in shaping
								the future of technology and creativity.
							</p>

							<motion.a
								href="https://www.instagram.com/syntaxclub/"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
							>
								Instagram
								<motion.svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									animate={{ x: [0, 5, 0] }}
									transition={{
										duration: 1.5,
										repeat: Infinity,
										ease: 'easeInOut',
									}}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									/>
								</motion.svg>
							</motion.a>
						</div>

						{/* Links columns */}
						<div className="grid grid-cols-2 gap-8 lg:col-span-3">
							<div>
								<h4 className="text-white font-semibold mb-4">Quick Links</h4>
								<ul className="space-y-2">
									<li>
										<motion.a
											href="/about"
											className="text-blue-300 hover:text-white transition-colors"
										>
											About Us
										</motion.a>
									</li>
									<li>
										<motion.a
											href="/team"
											className="text-blue-300 hover:text-white transition-colors"
										>
											Our Team
										</motion.a>
									</li>
									<li>
										<motion.a
											href="/projects"
											className="text-blue-300 hover:text-white transition-colors"
										>
											Projects
										</motion.a>
									</li>
									<li>
										<motion.a
											href="/contact"
											className="text-blue-300 hover:text-white transition-colors"
										>
											Contact
										</motion.a>
									</li>
								</ul>
							</div>

							<div>
								<h4 className="text-white font-semibold mb-4">Resources</h4>
								<ul className="space-y-2">
									<li>
										<motion.a
											href="/blog"
											className="text-blue-300 hover:text-white transition-colors"
										>
											Blog
										</motion.a>
									</li>
									<li>
										<motion.a
											href="/faq"
											className="text-blue-300 hover:text-white transition-colors"
										>
											FAQ
										</motion.a>
									</li>
									<li>
										<motion.a
											href="/terms"
											className="text-blue-300 hover:text-white transition-colors"
										>
											Terms of Service
										</motion.a>
									</li>
									<li>
										<motion.a
											href="/privacy"
											className="text-blue-300 hover:text-white transition-colors"
										>
											Privacy Policy
										</motion.a>
									</li>
								</ul>
							</div>
						</div>
					</div>

					<div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
						<p className="text-blue-300 text-center md:text-left">
							© 2024 Syntax Club. All rights reserved.
						</p>

						<div className="flex flex-wrap gap-6 justify-center md:justify-end">
							{footerLinks.map((section, index) => (
								<div key={index} className="text-sm">
									<h4 className="text-white font-semibold mb-2">
										{section.title}
									</h4>
									<ul className="space-y-1">
										{section.links.map((link, linkIndex) => (
											<li key={linkIndex}>
												<motion.a
													href={link.url}
													className="text-blue-300 hover:text-white transition-colors"
												>
													{link.label}
												</motion.a>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TeamPreview;
