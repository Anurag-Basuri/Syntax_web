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
	Download,
	Calendar,
	School,
	Badge,
	Clock,
} from 'lucide-react';

const getAvatarUrl = (profilePicture) => {
	if (!profilePicture) return null;
	if (typeof profilePicture === 'string') return profilePicture;
	if (typeof profilePicture === 'object') return profilePicture.url || null;
	return null;
};

const formatDate = (dateString) => {
	if (!dateString) return 'N/A';
	const d = new Date(dateString);
	if (isNaN(d.getTime())) return 'Invalid date';
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const TeamMemberModal = ({ member, isOpen, onClose, isAuthenticated = false }) => {
	const [activeTab, setActiveTab] = useState('about');
	const [imageError, setImageError] = useState(false);

	const initials = useMemo(() => {
		if (!member?.fullname) return '??';
		return member.fullname
			.split(' ')
			.map((n) => n?.[0] || '')
			.join('')
			.substring(0, 2)
			.toUpperCase();
	}, [member?.fullname]);

	const avatar = getAvatarUrl(member?.profilePicture);

	const tabs = useMemo(() => {
		if (!member) return [];
		return [
			{ id: 'about', label: 'About', icon: User, show: true },
			{
				id: 'contact',
				label: 'Contact',
				icon: Mail,
				show: !!(member.email || member.phone || (member.socialLinks?.length ?? 0) > 0),
			},
			{
				id: 'skills',
				label: 'Skills',
				icon: Code,
				show: Array.isArray(member.skills) && member.skills.length > 0,
			},
			{
				id: 'academic',
				label: 'Academic',
				icon: GraduationCap,
				show: !!(member.program || member.year),
			},
			{
				id: 'documents',
				label: 'Documents',
				icon: FileText,
				show: !!member.resume?.url,
			},
		].filter((t) => t.show);
	}, [member]);

	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === 'Escape' && isOpen) onClose();
		},
		[isOpen, onClose]
	);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
			setActiveTab('about');
			setImageError(false);
			window.addEventListener('keydown', handleKeyDown);
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, handleKeyDown]);

	if (!isOpen || !member) return null;

	const departmentText =
		member.primaryDepartment ||
		(Array.isArray(member.department)
			? member.department.filter(Boolean).join(', ')
			: member.department) ||
		'';
	const designationText =
		member.primaryDesignation ||
		(Array.isArray(member.designation)
			? member.designation.filter(Boolean).join(', ')
			: member.designation) ||
		'';

	return (
		<div
			className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			role="dialog"
			aria-modal="true"
			aria-label={`Profile of ${member.fullname}`}
		>
			<div
				className="relative w-full max-w-3xl h-[85vh] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
					aria-label="Close"
				>
					<X size={18} className="text-gray-800 dark:text-gray-100" />
				</button>

				<div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-5">
					<div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
						{!imageError && avatar ? (
							<img
								src={avatar}
								alt={member.fullname}
								className="w-full h-full object-cover"
								onError={() => setImageError(true)}
								loading="lazy"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-xl">
								{initials}
							</div>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 break-words">
							{member.fullname}
						</h2>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{departmentText && (
								<div className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<Badge size={14} className="mr-2" />
										Department
									</div>
									<div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
										{departmentText}
									</div>
								</div>
							)}
							{designationText && (
								<div className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<User size={14} className="mr-2" />
										Role
									</div>
									<div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
										{designationText}
									</div>
								</div>
							)}
							{isAuthenticated && member.LpuId && (
								<div className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<School size={14} className="mr-2" />
										Student ID
									</div>
									<div className="text-sm font-medium text-gray-800 dark:text-gray-100">
										{member.LpuId}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
									activeTab === tab.id
										? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
										: 'text-gray-500 border-transparent hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
								}`}
							>
								<Icon size={16} />
								{tab.label}
							</button>
						);
					})}
				</div>

				<div className="flex-1 overflow-y-auto p-6 text-sm text-gray-800 dark:text-gray-200 space-y-6">
					{activeTab === 'about' && (
						<div className="space-y-4">
							<p className="p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
								{member.bio || 'No bio provided.'}
							</p>
							{member.joinedAt && (
								<div className="p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
									<Clock size={16} className="text-blue-600 dark:text-blue-400" />
									<span>Member since: {formatDate(member.joinedAt)}</span>
								</div>
							)}
						</div>
					)}

					{activeTab === 'contact' && (
						<div className="space-y-3">
							{member.email && (
								<a
									href={`mailto:${member.email}`}
									className="flex items-center gap-2 text-blue-600 dark:text-blue-400 underline break-all"
								>
									<Mail size={16} /> {member.email}
								</a>
							)}
							{member.phone && (
								<a
									href={`tel:${member.phone}`}
									className="flex items-center gap-2 text-blue-600 dark:text-blue-400 underline"
								>
									<Phone size={16} /> {member.phone}
								</a>
							)}
							{member.socialLinks?.length > 0 && (
								<div className="flex flex-col gap-1">
									{member.socialLinks.map((s, i) => {
										const url = s?.url?.startsWith('http')
											? s.url
											: `https://${s?.url || ''}`;
										const platform = (s.platform || '').toLowerCase();
										const Icon = platform.includes('github')
											? Github
											: platform.includes('linkedin')
											? Linkedin
											: Globe;
										return (
											<a
												key={i}
												href={url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 text-blue-600 dark:text-blue-400 underline truncate"
												title={s.platform}
											>
												<Icon size={16} /> {s.platform || 'Profile'}
											</a>
										);
									})}
								</div>
							)}
						</div>
					)}

					{activeTab === 'skills' && (
						<div className="flex flex-wrap gap-2">
							{member.skills?.map((skill, idx) => (
								<span
									key={idx}
									className="px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs"
								>
									{skill}
								</span>
							))}
						</div>
					)}

					{activeTab === 'academic' && (
						<div className="grid gap-4 sm:grid-cols-2">
							{member.program && (
								<div className="p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<School size={14} />
										Program
									</div>
									<div>{member.program}</div>
								</div>
							)}
							{member.year && (
								<div className="p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<Calendar size={14} />
										Academic Year
									</div>
									<div>Year {member.year}</div>
								</div>
							)}
							{typeof member.hosteler === 'boolean' && (
								<div className="p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 sm:col-span-2">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<Building size={14} />
										Residence
									</div>
									<div>
										{member.hosteler
											? `Hosteler${
													member.hostel ? ` - ${member.hostel}` : ''
											  }`
											: 'Day Scholar'}
									</div>
								</div>
							)}
						</div>
					)}

					{activeTab === 'documents' && (
						<div>
							{member.resume?.url ? (
								<a
									href={member.resume.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-500"
								>
									<Download size={16} /> View Resume
								</a>
							) : (
								<p className="text-gray-600 dark:text-gray-400">
									No documents available.
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TeamMemberModal;
