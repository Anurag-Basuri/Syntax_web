import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TeamMemberCard from './TeamMemberCard.jsx';
import { Users } from 'lucide-react';

/**
 * Rebuilt TeamGrid
 * - stable keys
 * - leaders displayed as featured section
 * - responsive grid using CSS from design.css / index.css
 * - accessible empty state
 */

const containerVariants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.04 },
	},
};

const TeamGrid = ({ members = [], onCardClick }) => {
	const safeMembers = Array.isArray(members) ? members : [];

	const { leaders, rest } = useMemo(() => {
		const l = [];
		const r = [];
		for (const m of safeMembers) {
			if (m && m.isLeader) l.push(m);
			else r.push(m);
		}
		return { leaders: l, rest: r };
	}, [safeMembers]);

	if (safeMembers.length === 0) {
		return (
			<div className="team-grid-empty" role="status" aria-live="polite">
				<div className="flex flex-col items-center justify-center text-center py-16 px-4">
					<div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
						<Users size={36} className="text-white" />
					</div>
					<h3
						className="text-xl font-semibold mb-2"
						style={{ color: 'var(--text-primary)' }}
					>
						No members found
					</h3>
					<p className="max-w-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
						Try adjusting filters or search — we couldn't find anyone matching the
						current criteria.
					</p>
				</div>
			</div>
		);
	}

	// helper for stable key
	const getKey = (m, idx) =>
		m?._id || m?.id || m?.memberID || `${m?.fullname || 'member'}-${idx}`;

	return (
		<motion.div
			className="team-grid"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			{/* Featured leaders row */}
			{leaders.length > 0 && (
				<section aria-label="Leadership" className="mb-6">
					<h3 className="text-lg font-semibold mb-3">Leadership</h3>
					<div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<AnimatePresence>
							{leaders.map((m, i) => (
								<motion.div
									key={getKey(m, i)}
									layout
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 8 }}
								>
									<div className="h-64 sm:h-72 lg:h-80">
										<TeamMemberCard member={m} onClick={onCardClick} />
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</section>
			)}

			{/* Main grid */}
			<section aria-label="Team members">
				<div className="team-grid">
					<AnimatePresence>
						{rest.map((m, i) => (
							<motion.div
								key={getKey(m, i)}
								layout
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.98 }}
								transition={{ duration: 0.22 }}
							>
								<div className="h-64 sm:h-72 lg:h-80">
									<TeamMemberCard member={m} onClick={onCardClick} />
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</section>
		</motion.div>
	);
};

export default React.memo(TeamGrid);
