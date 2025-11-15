import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TeamMemberCard from './TeamMemberCard.jsx';
import { Users } from 'lucide-react';

const containerVariants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.04 },
	},
};

const TeamGrid = ({ members, onCardClick }) => {
	if (!members || members.length === 0) {
		return (
			<div className="team-grid-empty">
				<div className="flex flex-col items-center justify-center text-center py-16 px-4">
					<div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
						<Users size={36} className="text-white" />
					</div>
					<h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
						No members found
					</h3>
					<p className="max-w-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
						Try adjusting your search or filters. We couldn't find anyone matching the current criteria.
					</p>
				</div>
			</div>
		);
	}

	return (
		<motion.div
			className="team-grid px-2 sm:px-0"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			<div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				<AnimatePresence mode="popLayout">
					{members.map((member) => (
						<motion.div key={member._id} layout>
							<TeamMemberCard member={member} onClick={onCardClick} />
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</motion.div>
	);
};

export default TeamGrid;
