import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

// Helper to generate fallback avatar URL
const FALLBACK_AVATAR = (seed) =>
	`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed || '??')}`;

// TeamMemberCard Component
const TeamMemberCard = React.memo(function TeamMemberCard({ member = {}, onClick }) {
	const [imageError, setImageError] = useState(false);
	const elRef = useRef(null);

	const name = member.fullname || member.name || 'Unknown';
	const designation =
		member.primaryDesignation ||
		member.primaryRole ||
		(Array.isArray(member.designation) ? member.designation[0] : member.designation) ||
		'Member';
	const department =
		member.primaryDept ||
		member.primaryDepartment ||
		(Array.isArray(member.department) ? member.department[0] : member.department) ||
		'Team';

	const avatar =
		(member.profilePicture && (member.profilePicture.url || member.profilePicture)) ||
		FALLBACK_AVATAR(name || member.memberID || 'member');

	useEffect(() => {
		const el = elRef.current;
		if (!el) return;
		const onKey = (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onClick?.(member);
			}
		};
		el.addEventListener('keydown', onKey);
		return () => el.removeEventListener('keydown', onKey);
	}, [member, onClick]);

	const handleClick = useCallback(
		(e) => {
			if (e?.defaultPrevented) return;
			onClick?.(member);
		},
		[member, onClick]
	);

	const initials =
		(name || '??')
			.split(' ')
			.map((p) => p?.[0])
			.filter(Boolean)
			.join('')
			.substring(0, 2)
			.toUpperCase() || '??';

	return (
		<motion.article
			ref={elRef}
			layout
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 6 }}
			transition={{ duration: 0.18 }}
			onClick={handleClick}
			role="button"
			tabIndex={0}
			aria-label={`Open profile for ${name}`}
			className="team-card group relative rounded-2xl overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1 cursor-pointer flex flex-col h-full"
		>
			<div className="team-card-image-wrapper relative w-full aspect-square flex-shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50">
				{!imageError ? (
					<img
						src={avatar}
						alt={`${name} avatar`}
						onError={() => setImageError(true)}
						className="team-card-image w-full h-full object-cover"
						loading="lazy"
						decoding="async"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-2xl font-bold">
						{initials}
					</div>
				)}
			</div>

			<div className="team-card-content flex-1 p-4 flex flex-col items-center text-center">
				<h3
					className="team-card-name text-base sm:text-lg font-semibold truncate"
					title={name}
				>
					{name}
				</h3>

				<div className="team-card-role mt-1 text-sm text-[var(--text-secondary)] font-medium truncate">
					{designation}
				</div>

				<div className="team-card-dept mt-1 text-xs text-[var(--text-muted)] truncate flex items-center gap-2">
					<Briefcase size={12} /> <span>{department}</span>
				</div>
			</div>
		</motion.article>
	);
});

export default TeamMemberCard;
