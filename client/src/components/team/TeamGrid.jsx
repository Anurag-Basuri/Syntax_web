import React from 'react';
import { AnimatePresence } from 'framer-motion';
import TeamMemberCard from './TeamMemberCard.jsx';

const TeamGrid = ({ members, onCardClick }) => {
	if (!members || members.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center text-center py-16">
				<div className="text-5xl mb-4">🤷</div>
				<h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
					No members found
				</h3>
				<p className="max-w-sm" style={{ color: 'var(--text-secondary)' }}>
					Try adjusting your search or filter. There are no members that match the current
					criteria.
				</p>
			</div>
		);
	}

	return (
		<div className="team-grid">
			<AnimatePresence>
				{members.map((member) => (
					<TeamMemberCard key={member._id} member={member} onClick={onCardClick} />
				))}
			</AnimatePresence>
		</div>
	);
};

export default TeamGrid;
