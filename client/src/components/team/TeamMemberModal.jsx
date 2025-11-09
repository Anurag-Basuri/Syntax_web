import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	X,
	Mail,
	Linkedin,
	Github,
	Globe,
	Phone,
	Code,
	GraduationCap,
	Building,
	FileText,
	User,
	ExternalLink,
	Download,
	Calendar,
	Badge,
	Clock,
	Sparkles,
	MapPin,
	School,
	Star,
	Award,
} from 'lucide-react';

// Utility function for formatting dates
const formatDate = (dateString) => {
	if (!dateString) return 'N/A';
	try {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	} catch {
		return 'Invalid date';
	}
};

// Get icon based on social platform
const getSocialIcon = (platform) => {
	const platformLower = platform?.toLowerCase() || '';
	if (platformLower.includes('linkedin')) return Linkedin;
	if (platformLower.includes('github')) return Github;
	return Globe;
};

// Component for social link item with premium styling
const SocialLinkItem = ({ social }) => {
	const IconComponent = getSocialIcon(social.platform);
	const url = social.url?.startsWith('http') ? social.url : `https://${social.url}`;

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-sm"
			aria-label={`Visit ${social.platform} profile`}
		>
			<div className="flex items-center min-w-0 flex-1">
				<div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20 mr-4 flex-shrink-0">
					<IconComponent size={18} className="text-blue-400" />
				</div>
				<div className="min-w-0 flex-1">
					<span className="text-slate-200 group-hover:text-white font-medium text-sm block truncate">
						{social.platform}
					</span>
					<span className="text-slate-400 text-xs">Social Profile</span>
				</div>
			</div>
			<ExternalLink
				size={16}
				className="text-slate-400 group-hover:text-blue-400 flex-shrink-0 ml-2 transition-colors"
			/>
		</a>
	);
};

// Component for info card with premium styling
const InfoCard = ({ icon: Icon, label, value, className = '', accent = false }) => (
	<div
		className={`group relative bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-xl p-4 border border-slate-600/30 hover:border-blue-400/30 transition-all duration-300 backdrop-blur-sm ${
			accent ? 'ring-2 ring-blue-500/20' : ''
		} ${className}`}
	>
		<div className="flex items-center text-blue-300 mb-3">
			<div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-400/20 mr-3 flex-shrink-0">
				<Icon size={16} className="text-blue-400" />
			</div>
			<span className="font-semibold text-sm">{label}</span>
		</div>
		<div className="text-slate-100 font-medium text-sm leading-relaxed break-words pl-9">
			{value}
		</div>
	</div>
);

// Enhanced skill badge component
const SkillBadge = ({ skill, isPrimary = false }) => (
	<span
		className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
			isPrimary
				? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
				: 'bg-gradient-to-r from-slate-700/50 to-slate-600/30 text-slate-200 border border-slate-600/40 hover:border-blue-400/50 hover:bg-gradient-to-r hover:from-blue-900/30 hover:to-indigo-900/20'
		} hover:scale-105`}
	>
		{skill}
	</span>
);

// Tab content component
const TabContent = ({ activeTab, member, isAuthenticated }) => {
	if (!member) return null;

	const renderContent = () => {
		switch (activeTab) {
			case 'about':
				return (
					<div className="space-y-6 pb-4">
						<div>
							<h3 className="text-xl font-bold text-white mb-4 flex items-center">
								<div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20 mr-3">
									<User size={20} className="text-blue-400" />
								</div>
								About Me
							</h3>
							<div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-xl p-6 border border-slate-600/30 backdrop-blur-sm">
								<p className="text-slate-200 leading-relaxed text-base">
									{member.bio ||
										'This member prefers to keep their bio private for now. Connect with them to learn more!'}
								</p>
							</div>
						</div>

						{member.joinedAt && (
							<InfoCard
								icon={Clock}
								label="Member Since"
								value={formatDate(member.joinedAt)}
								accent={true}
							/>
						)}
					</div>
				);

			case 'contact':
				return (
					<div className="space-y-6 pb-4">
						<h3 className="text-xl font-bold text-white mb-6 flex items-center">
							<div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20 mr-3">
								<Mail size={20} className="text-blue-400" />
							</div>
							Get In Touch
						</h3>

						<div className="space-y-4">
							{/* Email and Phone with enhanced styling */}
							{member.email && (
								<a
									href={`mailto:${member.email}`}
									className="group relative flex items-center p-5 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 backdrop-blur-sm"
									aria-label={`Send email to ${member.email}`}
								>
									<div className="p-3 rounded-lg bg-green-500/10 border border-green-400/20 mr-4 flex-shrink-0">
										<Mail size={20} className="text-green-400" />
									</div>
									<div className="min-w-0 flex-1">
										<span className="text-slate-200 group-hover:text-white font-medium block break-all">
											{member.email}
										</span>
										<span className="text-slate-400 text-sm">
											Primary Email
										</span>
									</div>
								</a>
							)}

							{member.phone && (
								<a
									href={`tel:${member.phone}`}
									className="group relative flex items-center p-5 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm"
									aria-label={`Call ${member.phone}`}
								>
									<div className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/20 mr-4 flex-shrink-0">
										<Phone size={20} className="text-purple-400" />
									</div>
									<div className="min-w-0 flex-1">
										<span className="text-slate-200 group-hover:text-white font-medium">
											{member.phone}
										</span>
										<span className="text-slate-400 text-sm block">
											Phone Number
										</span>
									</div>
								</a>
							)}

							{/* Enhanced Social Links */}
							{member.socialLinks && member.socialLinks.length > 0 && (
								<div>
									<h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
										<div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-400/20 mr-2">
											<Globe size={16} className="text-blue-400" />
										</div>
										Social Profiles
									</h4>
									<div className="grid gap-3">
										{member.socialLinks.map((social, index) => (
											<SocialLinkItem
												key={`social-${index}`}
												social={social}
											/>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				);

			case 'skills':
				return (
					<div className="space-y-6 pb-4">
						<h3 className="text-xl font-bold text-white mb-6 flex items-center">
							<div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20 mr-3">
								<Code size={20} className="text-blue-400" />
							</div>
							Skills
						</h3>
						<div className="flex flex-wrap gap-3">
							{member.skills?.map((skill, index) => (
								<SkillBadge key={`skill-${index}-${skill}`} skill={skill} />
							))}
						</div>
					</div>
				);

			case 'academic':
				return (
					<div className="space-y-6 pb-4">
						<h3 className="text-xl font-bold text-white mb-6 flex items-center">
							<div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20 mr-3">
								<GraduationCap size={20} className="text-blue-400" />
							</div>
							Academic Journey
						</h3>

						<div className="grid gap-4 sm:grid-cols-2">
							{member.program && (
								<InfoCard
									icon={School}
									label="Program"
									value={member.program}
									accent={true}
								/>
							)}

							{member.year && (
								<InfoCard
									icon={Calendar}
									label="Academic Year"
									value={`Year ${member.year}`}
								/>
							)}
						</div>

						{/* Residence Information for authenticated users */}
						{isAuthenticated && member.hosteler !== undefined && (
							<InfoCard
								icon={Building}
								label="Residence Status"
								value={
									member.hosteler
										? `Hosteler${member.hostel ? ` - ${member.hostel}` : ''}`
										: 'Day Scholar'
								}
								accent={member.hosteler}
							/>
						)}
					</div>
				);

			case 'documents':
				return (
					<div className="space-y-6 pb-4">
						<h3 className="text-xl font-bold text-white mb-6 flex items-center">
							<div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20 mr-3">
								<FileText size={20} className="text-blue-400" />
							</div>
							Professional Documents
						</h3>

						{member.resume?.url ? (
							<a
								href={member.resume.url}
								target="_blank"
								rel="noopener noreferrer"
								className="group relative flex items-center justify-between p-6 bg-gradient-to-r from-emerald-900/20 to-green-800/20 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 backdrop-blur-sm"
								aria-label="Download resume"
							>
								<div className="flex items-center min-w-0 flex-1">
									<div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/20 mr-4 flex-shrink-0">
										<FileText size={24} className="text-emerald-400" />
									</div>
									<div className="min-w-0 flex-1">
										<span className="text-slate-200 group-hover:text-white font-semibold block text-lg">
											Resume / CV
										</span>
										<span className="text-emerald-300 text-sm">
											Click to view or download
										</span>
									</div>
								</div>
								<div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20 ml-4">
									<Download
										size={20}
										className="text-emerald-400 group-hover:scale-110 transition-transform"
									/>
								</div>
							</a>
						) : (
							<div className="text-center py-12 bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-xl border border-slate-600/30">
								<FileText size={48} className="text-slate-500 mx-auto mb-4" />
								<p className="text-slate-400 text-lg">No documents available</p>
								<p className="text-slate-500 text-sm">
									The member hasn't uploaded any documents yet
								</p>
							</div>
						)}
					</div>
				);

			default:
				return (
					<div className="text-center py-12 pb-4">
						<div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-xl p-8 border border-slate-600/30">
							<p className="text-slate-400 text-lg">No content available</p>
						</div>
					</div>
				);
		}
	};

	return <div className="animate-in fade-in duration-300">{renderContent()}</div>;
};

// Main modal component
const TeamMemberModal = ({ member, isOpen, onClose, isAuthenticated = false }) => {
	const [activeTab, setActiveTab] = useState('about');
	const [imageError, setImageError] = useState(false);

	// Memoized initials calculation
	const initials = useMemo(() => {
		if (!member?.fullname) return '??';
		return member.fullname
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase();
	}, [member?.fullname]);

	// Handle keyboard events
	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		},
		[isOpen, onClose]
	);

	// Handle close with proper event stopping
	const handleClose = useCallback(
		(e) => {
			e?.stopPropagation();
			onClose();
		},
		[onClose]
	);

	// Handle modal click (close on backdrop)
	const handleModalClick = useCallback(
		(e) => {
			if (e.target === e.currentTarget) {
				onClose();
			}
		},
		[onClose]
	);

	// Handle modal visibility
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
			setActiveTab('about');
			setImageError(false);
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	// Keyboard event listener
	useEffect(() => {
		if (isOpen) {
			window.addEventListener('keydown', handleKeyDown);
			return () => window.removeEventListener('keydown', handleKeyDown);
		}
	}, [isOpen, handleKeyDown]);

	// Dynamic tabs based on available data
	const tabs = useMemo(
		() =>
			[
				{ id: 'about', label: 'About', icon: User, show: true },
				{
					id: 'contact',
					label: 'Contact',
					icon: Mail,
					show: member?.email || member?.phone || member?.socialLinks?.length > 0,
				},
				{
					id: 'skills',
					label: 'Skills',
					icon: Code,
					show: member?.skills && member.skills.length > 0,
				},
				{
					id: 'academic',
					label: 'Academic',
					icon: GraduationCap,
					show: member?.program || member?.year,
				},
				{
					id: 'documents',
					label: 'Documents',
					icon: FileText,
					show: member?.resume?.url,
				},
			].filter((tab) => tab.show),
		[member]
	);

	if (!isOpen || !member) return null;

	return (
		<div
			className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300 overflow-hidden"
			onClick={handleModalClick}
		>
			<div
				className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-3xl xl:max-w-4xl h-[95vh] sm:h-[90vh] md:h-[85vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-600/50 shadow-2xl shadow-black/50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header with glassmorphism effect */}
				<div className="relative bg-gradient-to-r from-blue-900/80 via-indigo-800/80 to-purple-800/80 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex-shrink-0 border-b border-white/10">
					{/* Close button with premium styling */}
					<button
						onClick={handleClose}
						className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm group z-20"
						aria-label="Close modal"
						type="button"
					>
						<X
							size={20}
							className="text-white group-hover:rotate-90 transition-transform duration-300"
						/>
					</button>

					{/* Enhanced Profile section */}
					<div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-4 sm:gap-6 pr-16">
						{/* Profile image with enhanced styling */}
						<div className="flex-shrink-0 relative">
							<div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl">
								{!imageError && member.profilePicture?.url ? (
									<img
										src={member.profilePicture.url}
										alt={member.fullname || 'Profile'}
										className="w-full h-full object-cover"
										onError={() => setImageError(true)}
										loading="lazy"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700">
										<span className="text-white font-bold text-lg sm:text-xl md:text-2xl">
											{initials}
										</span>
									</div>
								)}
							</div>
							{/* Online status indicator */}
							<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white/20 rounded-full"></div>
						</div>

						{/* Enhanced Profile info */}
						<div className="flex-1 min-w-0">
							<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 break-words leading-tight">
								{member.fullname}
							</h2>

							{/* Enhanced info grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
								{/* Department */}
								{member.department && (
									<div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
										<div className="flex items-center text-blue-200 mb-2">
											<Sparkles size={14} className="mr-2 flex-shrink-0" />
											<span className="font-semibold">Department</span>
										</div>
										<div
											className="text-white font-bold truncate"
											title={member.department}
										>
											{member.department}
										</div>
									</div>
								)}

								{/* Designation */}
								{member.designation && (
									<div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
										<div className="flex items-center text-blue-200 mb-2">
											<Badge size={14} className="mr-2 flex-shrink-0" />
											<span className="font-semibold">Role</span>
										</div>
										<div
											className="text-white font-bold truncate"
											title={member.designation}
										>
											{member.designation}
										</div>
									</div>
								)}

								{/* LPU ID for authenticated users */}
								{isAuthenticated && member.LpuId && (
									<div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
										<div className="flex items-center text-blue-200 mb-2">
											<School size={14} className="mr-2 flex-shrink-0" />
											<span className="font-semibold">Student ID</span>
										</div>
										<div className="text-white font-bold">{member.LpuId}</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Tabs with better mobile experience */}
				<div className="flex border-b border-slate-600/50 bg-slate-800/90 backdrop-blur-sm flex-shrink-0 overflow-x-auto">
					<div className="flex min-w-full sm:min-w-0">
						{tabs.map((tab) => {
							const IconComponent = tab.icon;
							return (
								<button
									key={tab.id}
									className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold transition-all duration-300 whitespace-nowrap flex-shrink-0 min-w-[100px] sm:min-w-[120px] relative ${
										activeTab === tab.id
											? 'text-blue-400 bg-blue-900/30 border-b-2 border-blue-400'
											: 'text-slate-400 hover:text-white hover:bg-slate-700/50'
									}`}
									onClick={() => setActiveTab(tab.id)}
								>
									<IconComponent size={16} className="flex-shrink-0" />
									<span>{tab.label}</span>
									{activeTab === tab.id && (
										<div className="absolute inset-0 bg-blue-500/10 rounded-t-lg"></div>
									)}
								</button>
							);
						})}
					</div>
				</div>

				{/* Enhanced Tab content with proper scrolling */}
				<div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
					<div className="p-4 sm:p-6 md:p-8">
						<TabContent
							activeTab={activeTab}
							member={member}
							isAuthenticated={isAuthenticated}
						/>
					</div>
				</div>
			</div>

			{/* Add custom scrollbar styles */}
			<style jsx>{`
				.scrollbar-thin {
					scrollbar-width: thin;
					scrollbar-color: rgb(71 85 105) rgb(30 41 59);
				}

				.scrollbar-thin::-webkit-scrollbar {
					width: 6px;
				}

				.scrollbar-thin::-webkit-scrollbar-track {
					background: rgb(30 41 59);
					border-radius: 3px;
				}

				.scrollbar-thin::-webkit-scrollbar-thumb {
					background: rgb(71 85 105);
					border-radius: 3px;
				}

				.scrollbar-thin::-webkit-scrollbar-thumb:hover {
					background: rgb(100 116 139);
				}

				/* Hide scrollbar for tabs on mobile */
				.overflow-x-auto::-webkit-scrollbar {
					height: 2px;
				}

				.overflow-x-auto::-webkit-scrollbar-thumb {
					background: rgb(59 130 246);
					border-radius: 1px;
				}
			`}</style>
		</div>
	);
};

export default TeamMemberModal;
