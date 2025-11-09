import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedTeamCard from './UnifiedTeamCard';
import { ChevronRight, ChevronDown, Users, Eye, EyeOff } from 'lucide-react';

const DepartmentSection = ({
	department,
	members,
	onClick,
	isAuthenticated,
	isExpanded,
	onToggle,
}) => {
	// Remove local state and use props instead
	const [isHovered, setIsHovered] = useState(false);

	// Sort members to show heads first, then alphabetically by designation
	const sortedMembers = [...members].sort((a, b) => {
		if (a.designation === 'Head' && b.designation !== 'Head') return -1;
		if (b.designation === 'Head' && a.designation !== 'Head') return 1;
		return a.designation.localeCompare(b.designation);
	});

	const toggleExpansion = () => {
		if (onToggle) {
			onToggle();
		}
	};

	// Add default value for isExpanded if not provided
	const expanded = isExpanded !== undefined ? isExpanded : true;

	return (
		<motion.div
			className="mb-12 sm:mb-16"
			initial={{ opacity: 0, y: 40 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-50px' }}
			transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
			layout
		>
			{/* Enhanced Department Header */}
			<div className="flex flex-col items-center mb-6 sm:mb-8 px-4">
				<motion.div
					className="relative group overflow-hidden mb-4 w-full max-w-lg"
					onHoverStart={() => setIsHovered(true)}
					onHoverEnd={() => setIsHovered(false)}
					layout
				>
					{/* Background effects with better animation */}
					<motion.div
						className="absolute -inset-4 bg-gradient-to-r from-indigo-600/20 via-blue-600/30 to-purple-600/20 
                            rounded-2xl blur-xl transition-opacity duration-700"
						animate={{
							opacity: isHovered ? 1 : 0.6,
							scale: isHovered ? 1.05 : 1,
						}}
						transition={{ duration: 0.5, ease: 'easeOut' }}
					/>

					<motion.button
						onClick={toggleExpansion}
						className="relative w-full flex items-center justify-between gap-3 py-4 px-6 
                            rounded-2xl bg-gradient-to-br from-slate-800/95 via-slate-700/90 to-slate-800/95 
                            backdrop-blur-xl border border-indigo-500/30 hover:border-indigo-400/50
                            shadow-xl shadow-indigo-900/20 hover:shadow-2xl hover:shadow-indigo-600/30
                            transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						aria-expanded={expanded}
						aria-label={`${expanded ? 'Collapse' : 'Expand'} ${department} department`}
					>
						{/* Left side content */}
						<div className="flex items-center gap-3 flex-1">
							{/* Animated accent bar */}
							<motion.div
								className="w-1.5 h-8 rounded-full bg-gradient-to-b from-blue-400 via-indigo-500 to-purple-600"
								animate={{
									boxShadow: isHovered
										? [
												'0 0 10px rgba(79, 70, 229, 0.5)',
												'0 0 20px rgba(79, 70, 229, 0.8)',
												'0 0 10px rgba(79, 70, 229, 0.5)',
										  ]
										: '0 0 5px rgba(79, 70, 229, 0.3)',
								}}
								transition={{ duration: 2, repeat: Infinity }}
							/>

							{/* Department title */}
							<div className="flex-1 text-left">
								<h3
									className="text-xl sm:text-2xl font-bold text-white group-hover:text-blue-100 
                                    transition-colors duration-300"
								>
									{department}
								</h3>
								<p className="text-sm text-slate-400 mt-1">
									{members.length} {members.length === 1 ? 'member' : 'members'}
								</p>
							</div>
						</div>

						{/* Right side controls */}
						<div className="flex items-center gap-2">
							{/* Members count badge */}
							<motion.div
								className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300"
								whileHover={{ scale: 1.05 }}
							>
								<Users size={12} />
								<span className="text-xs font-medium">{members.length}</span>
							</motion.div>

							{/* Expand/Collapse icon */}
							<motion.div
								animate={{ rotate: expanded ? 90 : 0 }}
								transition={{ duration: 0.3, ease: 'easeOut' }}
								className="p-1"
							>
								<ChevronRight size={18} className="text-blue-400" />
							</motion.div>
						</div>

						{/* Hover overlay */}
						<div
							className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/0 to-indigo-600/10 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none"
						></div>
					</motion.button>
				</motion.div>

				{/* Enhanced decorative element */}
				<motion.div
					className="relative"
					initial={{ scaleX: 0 }}
					whileInView={{ scaleX: 1 }}
					transition={{ delay: 0.3, duration: 0.8 }}
					layout
				>
					<div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-600 rounded-full"></div>
					<motion.div
						className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-600 
                            filter blur-lg opacity-50 rounded-full"
						animate={{
							opacity: [0.5, 0.8, 0.5],
							scale: [1, 1.1, 1],
						}}
						transition={{ duration: 3, repeat: Infinity }}
					/>
				</motion.div>
			</div>

			{/* Animated Cards Grid */}
			<AnimatePresence mode="wait">
				{expanded && (
					<motion.div
						className="px-3 sm:px-4 lg:px-6"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.5, ease: 'easeInOut' }}
						layout
					>
						<motion.div
							className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 
                                gap-4 sm:gap-5 lg:gap-6 max-w-7xl mx-auto"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2, duration: 0.4 }}
							layout
						>
							{sortedMembers.map((member, index) => (
								<motion.div
									key={member._id || index}
									className="flex justify-center"
									initial={{ opacity: 0, y: 30, scale: 0.9 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: -30, scale: 0.9 }}
									transition={{
										delay: index * 0.05,
										duration: 0.5,
										ease: [0.25, 0.46, 0.45, 0.94],
									}}
									layout
								>
									<div className="w-full max-w-[300px]">
										<UnifiedTeamCard
											member={member}
											delay={index * 0.02}
											onClick={onClick}
											isAuthenticated={isAuthenticated}
										/>
									</div>
								</motion.div>
							))}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
};

export default React.memo(DepartmentSection);
