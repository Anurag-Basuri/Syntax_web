import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedTeamCard from './UnifiedTeamCard.jsx';
import { ChevronRight } from 'lucide-react';

const DepartmentSection = ({ title, members, onClick, isExpanded, onToggle }) => {
	if (!members?.length) return null;

	return (
		<motion.section layout className="mb-8">
			<button
				type="button"
				onClick={onToggle}
				className="w-full flex items-center justify-between p-3 mb-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
				aria-expanded={isExpanded}
			>
				<div className="flex items-center gap-3">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						{title}
					</h2>
					<span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
						{members.length}
					</span>
				</div>
				<motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
					<ChevronRight size={20} className="text-gray-500" />
				</motion.div>
			</button>

			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.25 }}
						className="overflow-hidden"
					>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
							{members.map((member) => (
								<UnifiedTeamCard
									key={member._id}
									member={member}
									onClick={onClick}
								/>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.section>
	);
};

export default React.memo(DepartmentSection);
