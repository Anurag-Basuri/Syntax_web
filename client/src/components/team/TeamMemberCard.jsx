import React from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Twitter, Github, Star } from 'lucide-react';

const cardVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
};

const TeamMemberCard = ({ member, onClick }) => {
	const hasSocials = member.linkedin || member.twitter || member.github;
	const avatarUrl =
		member.profilePicture?.secure_url ||
		`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(member.fullname)}`;
	const isLeader = member.isLeader;

	return (
		<motion.div
			layout
			variants={cardVariants}
			initial="hidden"
			animate="visible"
			exit="hidden"
			transition={{ duration: 0.3, ease: 'easeInOut' }}
			className="team-card enhanced-card"
			onClick={() => onClick(member)}
			tabIndex={0}
			role="button"
			aria-label={`Open profile for ${member.fullname}`}
			onKeyDown={(e) => e.key === 'Enter' && onClick(member)}
		>
			<div className="team-card-image-wrapper">
				<img
					src={avatarUrl}
					alt={member.fullname}
					className="team-card-image"
					loading="lazy"
				/>
				<div className="team-card-image-overlay" />
				{isLeader && (
					<div className="absolute top-2 left-2 bg-amber-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold flex items-center gap-1 shadow">
						<Star size={12} /> Leader
					</div>
				)}
			</div>
			<div className="team-card-content">
				<h3 className="team-card-name">{member.fullname}</h3>
				<p className="team-card-role">{member.primaryRole}</p>
				<p className="team-card-dept">{member.primaryDept}</p>
				{hasSocials && (
					<div className="team-card-socials">
						{member.linkedin && (
							<a
								href={member.linkedin}
								target="_blank"
								rel="noopener noreferrer"
								className="social-link"
								onClick={(e) => e.stopPropagation()}
								aria-label={`${member.fullname}'s LinkedIn`}
							>
								<Linkedin size={16} />
							</a>
						)}
						{member.twitter && (
							<a
								href={member.twitter}
								target="_blank"
								rel="noopener noreferrer"
								className="social-link"
								onClick={(e) => e.stopPropagation()}
								aria-label={`${member.fullname}'s Twitter`}
							>
								<Twitter size={16} />
							</a>
						)}
						{member.github && (
							<a
								href={member.github}
								target="_blank"
								rel="noopener noreferrer"
								className="social-link"
								onClick={(e) => e.stopPropagation()}
								aria-label={`${member.fullname}'s GitHub`}
							>
								<Github size={16} />
							</a>
						)}
					</div>
				)}
			</div>
		</motion.div>
	);
};

export default TeamMemberCard;
