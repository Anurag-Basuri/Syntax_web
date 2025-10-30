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
		<div className="min-h-screen bg-transparent relative overflow-hidden flex items-center">
			<div className="relative z-10 px-4 py-16 sm:py-24 w-full">
				<div className="max-w-7xl mx-auto">
					{/* Header Section */}
					<div className="text-center mb-16">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="mb-6"
						>
							<span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/40 text-purple-200 text-base font-semibold shadow-lg backdrop-blur-md">
								Meet Our Core Team
							</span>
							<p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
								The driving force behind Syntax. A diverse team of leaders, mentors,
								and builders working together to shape our future.
							</p>
						</motion.div>
					</div>

					{/* Team Grid */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
					>
						{teamMembers.slice(0, 6).map((member, index) => {
							const theme = getTheme(index);
							return (
								<motion.div
									key={member._id || index}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: index * 0.1 }}
									className="relative group"
								>
									<div
										className={`bg-gradient-to-br ${theme.bg} backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl`}
										style={{
											boxShadow: `0 0 20px rgba(${theme.glow})`,
										}}
									>
										{/* Decorative elements */}
										<div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full backdrop-blur-sm transition-all duration-300 group-hover:scale-125" />
										<div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-tr-full backdrop-blur-sm transition-all duration-300 group-hover:scale-125" />

										<div className="relative z-10 text-center">
											<div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-white/20 to-white/10 border border-white/20 flex items-center justify-center shadow-lg">
												<span className="text-2xl font-bold text-white">
													{member.name?.charAt(0).toUpperCase() || '?'}
												</span>
											</div>
											<h3 className="text-xl font-bold text-white mb-1">
												{member.name || 'Team Member'}
											</h3>
											<p className={`text-${theme.accent} font-medium`}>
												{member.role || 'Role'}
											</p>
											<p className="text-gray-300 text-sm mt-2 leading-relaxed">
												{member.bio ||
													'Passionate about technology and innovation.'}
											</p>
										</div>
									</div>
								</motion.div>
							);
						})}
					</motion.div>

					{/* CTA Button */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.8 }}
						className="text-center mt-16"
					>
						<motion.button
							onClick={() => navigate('/team')}
							whileHover={{
								scale: 1.05,
								boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
							}}
							whileTap={{ scale: 0.95 }}
							className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full font-semibold text-white text-lg shadow-2xl overflow-hidden"
						>
							<span className="relative z-10 flex items-center gap-3">
								Explore Full Team
								<motion.svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									whileHover={{ x: 5 }}
									transition={{ type: 'spring', stiffness: 400 }}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									/>
								</motion.svg>
							</span>
							<div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
						</motion.button>
					</motion.div>
				</div>
			</div>
		</div>
	);
};

export default TeamPreview;
