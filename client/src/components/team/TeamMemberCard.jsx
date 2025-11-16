import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
	Linkedin,
	Twitter,
	Github,
	Globe,
	Mail,
	Phone,
	ShieldCheck,
	Briefcase,
} from 'lucide-react';

/**
 * Rebuilt TeamMemberCard
 * - small, accessible, predictable props
 * - defensive access to member fields
 * - consistent avatar fallback
 */

const FALLBACK_AVATAR = (seed) =>
	`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed || '??')}`;

const getSocialIcon = (platform = '') => {
	const p = (platform || '').toLowerCase();
	if (p.includes('github')) return Github;
	if (p.includes('linkedin')) return Linkedin;
	if (p.includes('twitter')) return Twitter;
	return Globe;
};

const TeamMemberCard = React.memo(function TeamMemberCard({ member = {}, onClick }) {
	const [imageError, setImageError] = useState(false);
	const elRef = useRef(null);

	const fullname = member.fullname || member.name || 'Unknown';
	const avatarSrc =
		(member.profilePicture && (member.profilePicture.url || member.profilePicture)) ||
		FALLBACK_AVATAR(fullname || member.memberID || 'member');

	const initials =
		(fullname || '??')
			.split(' ')
			.map((p) => p?.[0])
			.filter(Boolean)
			.join('')
			.substring(0, 2)
			.toUpperCase() || '??';

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
			aria-label={`Open profile for ${fullname}`}
			className="team-card group relative rounded-2xl overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1 cursor-pointer flex flex-col h-full"
		>
			{/* cover */}
			<div className="team-card-image-wrapper relative h-28 sm:h-32 flex-shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50">
				{!imageError ? (
					<img
						src={avatarSrc}
						alt={`${fullname} avatar`}
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

				{/* small circular avatar overlapping */}
				<div className="absolute left-4 -bottom-10">
					<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 shadow-lg">
						{!imageError ? (
							<img
								src={avatarSrc}
								alt={fullname}
								onError={() => setImageError(true)}
								className="w-full h-full object-cover"
								loading="lazy"
								decoding="async"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white font-bold text-lg">
								{initials}
							</div>
						)}
					</div>
				</div>

				{/* leader badge */}
				{member.isLeader && (
					<div className="absolute right-3 top-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 shadow-sm">
						<ShieldCheck size={14} /> Leader
					</div>
				)}
			</div>

			{/* content */}
			<div className="team-card-content flex-1 pt-12 pb-4 px-4 sm:px-5 flex flex-col">
				<div className="min-w-0">
					<h3
						className="team-card-name text-base sm:text-lg font-semibold leading-tight truncate"
						title={fullname}
					>
						{fullname}
					</h3>
					<div className="team-card-role mt-1 text-sm text-[var(--text-secondary)] truncate">
						{member.primaryRole ||
							member.primaryDesignation ||
							member.designationFlat ||
							'Member'}
					</div>
					<div className="team-card-dept text-xs text-[var(--text-muted)] mt-1 truncate flex items-center gap-2">
						<Briefcase size={12} />{' '}
						<span>{member.primaryDept || member.primaryDepartment || 'Team'}</span>
					</div>
				</div>

				{/* skills */}
				{Array.isArray(member.skills) && member.skills.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2">
						{member.skills.slice(0, 6).map((s, i) => (
							<span
								key={i}
								className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
							>
								{s}
							</span>
						))}
					</div>
				)}

				{/* footer */}
				<div className="mt-auto flex items-center gap-2 justify-between team-card-socials">
					<div className="flex items-center gap-2">
						{Array.isArray(member.socialLinks) &&
							member.socialLinks.slice(0, 3).map((s, i) => {
								const Icon = getSocialIcon(s.platform);
								const url = (s.url || '').startsWith('http')
									? s.url
									: `https://${s.url || ''}`;
								return (
									<a
										key={i}
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										onClick={(e) => e.stopPropagation()}
										className="social-link inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--glass-hover)] transition-colors text-[var(--text-secondary)]"
										aria-label={`${fullname} ${s.platform || 'profile'}`}
										title={s.platform || 'profile'}
									>
										<Icon size={14} />
									</a>
								);
							})}
					</div>

					<div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
						{member.email && (
							<a
								href={`mailto:${member.email}`}
								onClick={(e) => e.stopPropagation()}
								className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
								aria-label={`Email ${fullname}`}
							>
								<Mail size={14} />
							</a>
						)}
						{member.phone && (
							<a
								href={`tel:${member.phone}`}
								onClick={(e) => e.stopPropagation()}
								className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
								aria-label={`Call ${fullname}`}
							>
								<Phone size={14} />
							</a>
						)}
						<button
							onClick={(e) => {
								e.stopPropagation();
								onClick?.(member);
							}}
							className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))] text-white text-sm"
							aria-label={`Open profile for ${fullname}`}
						>
							View
						</button>
					</div>
				</div>
			</div>
		</motion.article>
	);
});

export default TeamMemberCard;
