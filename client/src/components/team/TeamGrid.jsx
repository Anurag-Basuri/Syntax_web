import React from 'react';
import { AnimatePresence } from 'framer-motion';
import TeamMemberCard from './TeamMemberCard.jsx';

const TeamGrid = ({ members, onCardClick }) => {
	if (!members || members.length === 0) {
		return (
			<div className="team-grid-empty">
				<div className="text-6xl mb-4">🤷</div>
				<h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
					No members found
				</h3>
				<p className="max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
					Try adjusting your search or filter. There are no members that match the current
					criteria.
				</p>
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
