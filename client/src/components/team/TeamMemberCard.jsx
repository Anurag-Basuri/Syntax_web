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

const FALLBACK_AVATAR = (name) =>
	`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || '??')}`;

const getSocialIcon = (platform = '') => {
	const p = (platform || '').toLowerCase();
	if (p.includes('github')) return Github;
	if (p.includes('linkedin')) return Linkedin;
	if (p.includes('twitter')) return Twitter;
	return Globe;
};

const TeamMemberCard = React.memo(function TeamMemberCard({ member, onClick }) {
	const [imageError, setImageError] = useState(false);
	const ref = useRef(null);

	const avatar =
		(member.profilePicture && (member.profilePicture.url || member.profilePicture)) ||
		FALLBACK_AVATAR(member.fullname);
	const initials =
		(member.fullname || '??')
			.split(' ')
			.map((p) => p[0])
			.filter(Boolean)
			.join('')
			.substring(0, 2)
			.toUpperCase() || '??';

	// Keyboard activation
	useEffect(() => {
		const el = ref.current;
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

	const openProfile = useCallback(
		(e) => {
			if (e?.defaultPrevented) return;
			onClick?.(member);
		},
		[member, onClick]
	);

	return (
		<motion.article
			ref={ref}
			layout
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 6 }}
			transition={{ duration: 0.28, ease: 'easeOut' }}
			onClick={openProfile}
			role="button"
			tabIndex={0}
			aria-label={`Open profile for ${member.fullname}`}
			className="group relative rounded-2xl overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] focus:shadow-[var(--shadow-md)] transition-transform transform hover:-translate-y-1 focus:-translate-y-1 cursor-pointer"
		>
			{/* Cover */}
			<div className="relative h-36 sm:h-40 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/8 dark:to-purple-900/8">
				{!imageError ? (
					<img
						src={avatar}
						alt={`${member.fullname} avatar`}
						onError={() => setImageError(true)}
						className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity"
						loading="lazy"
						decoding="async"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl font-bold">
						{initials}
					</div>
				)}

				{/* Overlapping avatar */}
				<div className="absolute left-4 -bottom-8">
					<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-2 ring-white dark:ring-gray-900 overflow-hidden bg-gray-100 shadow-lg">
						{!imageError ? (
							<img
								src={avatar}
								alt={`${member.fullname}`}
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

				{/* Leader badge */}
				{member.isLeader && (
					<div className="absolute right-3 top-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-200 shadow-sm">
						<ShieldCheck size={14} /> Leader
					</div>
				)}
			</div>

			{/* Body */}
			<div className="pt-10 pb-4 px-4 sm:px-5">
				<div className="flex items-start gap-3">
					<div className="min-w-0 flex-1">
						<h3 className="text-base sm:text-lg font-semibold leading-tight truncate" title={member.fullname} style={{ color: 'var(--text-primary)' }}>
							{member.fullname}
						</h3>
						<div className="mt-1 text-sm text-[var(--text-secondary)] truncate">
							{member.primaryRole || member.primaryDesignation || 'Member'}
						</div>
						<div className="text-xs text-[var(--text-muted)] mt-1 truncate flex items-center gap-2">
							<Briefcase size={12} /> <span>{member.primaryDept || 'Team'}</span>
						</div>
					</div>
				</div>

				{/* Skills */}
				{Array.isArray(member.skills) && member.skills.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2">
						{member.skills.slice(0, 6).map((s, i) => (
							<span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
								{s}
							</span>
						))}
					</div>
				)}

				{/* Footer with socials & quick actions */}
				<div className="mt-4 flex items-center gap-2 justify-between">
					<div className="flex items-center gap-2">
						{Array.isArray(member.socialLinks) && member.socialLinks.slice(0, 3).map((s, i) => {
							const Icon = getSocialIcon(s.platform);
							const url = (s.url || '').startsWith('http') ? s.url : `https://${s.url || ''}`;
							return (
								<a
									key={i}
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => e.stopPropagation()}
									className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/6 hover:bg-white/10 transition-colors text-[var(--text-secondary)]"
									aria-label={`${member.fullname} ${s.platform || 'profile'}`}
									title={s.platform || 'profile'}
								>
									<Icon size={14} />
								</a>
							);
						})}
					</div>

					{/* Hover actions */}
					<div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
						{member.email && (
							<a
								href={`mailto:${member.email}`}
								onClick={(e) => e.stopPropagation()}
								className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
								aria-label={`Email ${member.fullname}`}
								title={`Email ${member.fullname}`}
							>
								<Mail size={14} /> <span className="sr-only">Email</span>
							</a>
						)}
						{member.phone && (
							<a
								href={`tel:${member.phone}`}
								onClick={(e) => e.stopPropagation()}
								className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
								aria-label={`Call ${member.fullname}`}
								title={`Call ${member.fullname}`}
							>
								<Phone size={14} /> <span className="sr-only">Call</span>
							</a>
						)}
						<button
							onClick={(e) => { e.stopPropagation(); onClick?.(member); }}
							className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))] text-white text-sm"
							aria-label={`Open profile for ${member.fullname}`}
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
