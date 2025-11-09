import React from 'react';
import { AnimatePresence } from 'framer-motion';
import TeamMemberCard from './TeamMemberCard.jsx';
import { Users } from 'lucide-react';

const TeamGrid = ({ members, onCardClick }) => {
	if (!members || members.length === 0) {
		return (
			<div className="team-grid-empty">
				<div className="flex flex-col items-center justify-center text-center py-12 sm:py-16 md:py-20 px-4">
					<div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 sm:mb-6">
						<Users
							size={32}
							className="sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400 dark:text-gray-500"
						/>
					</div>
					<h3
						className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3"
						style={{ color: 'var(--text-primary)' }}
					>
						No members found
					</h3>
					<p
						className="max-w-md text-sm sm:text-base"
						style={{ color: 'var(--text-secondary)' }}
					>
						Try adjusting your search or filter. There are no members that match the
						current criteria.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="team-grid">
			<AnimatePresence mode="popLayout">
				{members.map((member) => (
					<TeamMemberCard key={member._id} member={member} onClick={onCardClick} />
				))}
			</AnimatePresence>
		</div>
	);
};

export default TeamGrid;
