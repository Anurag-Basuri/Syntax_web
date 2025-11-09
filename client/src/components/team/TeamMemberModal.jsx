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
	IdCard,
	Shield,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Info,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

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

const formatDateTime = (dateString) => {
	if (!dateString) return 'N/A';
	const d = new Date(dateString);
	if (isNaN(d.getTime())) return 'Invalid date';
	return d.toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const TeamMemberModal = ({ member, isOpen, onClose }) => {
	const { isAuthenticated } = useAuth();
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

	// Enhanced tabs with authentication-aware visibility
	const tabs = useMemo(() => {
		if (!member) return [];
		const hasContactInfo =
			(isAuthenticated && (member.email || member.phone)) ||
			(member.socialLinks?.length ?? 0) > 0;
		const hasAcademicInfo = !!(member.program || member.year || member.hosteler !== undefined);
		const hasStatusInfo = isAuthenticated && (member.status || member.memberID);

		return [
			{ id: 'about', label: 'About', icon: User, show: true },
			{
				id: 'contact',
				label: 'Contact',
				icon: Mail,
				show: hasContactInfo,
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
				show: hasAcademicInfo,
			},
			{
				id: 'documents',
				label: 'Documents',
				icon: FileText,
				show: !!member.resume?.url,
			},
			{
				id: 'details',
				label: 'Details',
				icon: Info,
				show: isAuthenticated && (member.memberID || member.status || member._id),
			},
		].filter((t) => t.show);
	}, [member, isAuthenticated]);

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

	// Get all departments and designations (not just primary)
	const allDepartments = Array.isArray(member.department)
		? member.department.filter(Boolean)
		: member.department
		? [member.department]
		: [];
	const allDesignations = Array.isArray(member.designation)
		? member.designation.filter(Boolean)
		: member.designation
		? [member.designation]
		: [];

	const departmentText = member.primaryDepartment || allDepartments.join(', ') || '';
	const designationText = member.primaryDesignation || allDesignations.join(', ') || '';

	// Status badge component
	const StatusBadge = ({ status }) => {
		const statusConfig = {
			active: {
				icon: CheckCircle,
				color: 'text-green-600 dark:text-green-400',
				label: 'Active',
			},
			banned: { icon: XCircle, color: 'text-red-600 dark:text-red-400', label: 'Banned' },
			removed: { icon: XCircle, color: 'text-gray-600 dark:text-gray-400', label: 'Removed' },
		};
		const config = statusConfig[status] || statusConfig.active;
		const Icon = config.icon;

		return (
			<div className={`flex items-center gap-2 ${config.color}`}>
				<Icon size={16} />
				<span className="font-medium">{config.label}</span>
			</div>
		);
	};

	return (
		<div
			className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
			style={{
				paddingTop:
					'calc(env(safe-area-inset-top, 0px) + var(--navbar-height, 4.5rem) + 1rem)',
				paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			role="dialog"
			aria-modal="true"
			aria-label={`Profile of ${member.fullname}`}
		>
			<div
				className="relative w-full max-w-4xl max-h-[calc(100vh-var(--navbar-height,4.5rem)-2rem)] md:max-h-[calc(100vh-var(--navbar-height,4.5rem)-3rem)] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col team-member-modal overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
					aria-label="Close"
				>
					<X size={18} className="text-gray-800 dark:text-gray-100" />
				</button>

				{/* Header Section */}
				<div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:gap-5 flex-shrink-0">
					<div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex-shrink-0 mx-auto sm:mx-0">
						{!imageError && avatar ? (
							<img
								src={avatar}
								alt={member.fullname}
								className="w-full h-full object-cover"
								onError={() => setImageError(true)}
								loading="lazy"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-lg sm:text-xl">
								{initials}
							</div>
						)}
					</div>
					<div className="flex-1 min-w-0 text-center sm:text-left">
						<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
							<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words">
								{member.fullname}
							</h2>
							{member.isLeader && (
								<div className="flex items-center justify-center sm:justify-start gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0 w-fit mx-auto sm:mx-0">
									<Shield size={14} /> Leader
								</div>
							)}
						</div>
						<div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
							{departmentText && (
								<div className="p-2 sm:p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center justify-center sm:justify-start text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<Badge size={14} className="mr-2" />
										Department{allDepartments.length > 1 ? 's' : ''}
									</div>
									<div
										className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 truncate text-center sm:text-left"
										title={departmentText}
									>
										{departmentText}
									</div>
									{allDepartments.length > 1 && (
										<div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
											{allDepartments.length} department
											{allDepartments.length !== 1 ? 's' : ''}
										</div>
									)}
								</div>
							)}
							{designationText && (
								<div className="p-2 sm:p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center justify-center sm:justify-start text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<User size={14} className="mr-2" />
										Role{allDesignations.length > 1 ? 's' : ''}
									</div>
									<div
										className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 truncate text-center sm:text-left"
										title={designationText}
									>
										{designationText}
									</div>
									{allDesignations.length > 1 && (
										<div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
											{allDesignations.length} role
											{allDesignations.length !== 1 ? 's' : ''}
										</div>
									)}
								</div>
							)}
							{isAuthenticated && member.LpuId && (
								<div className="p-2 sm:p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center justify-center sm:justify-start text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<School size={14} className="mr-2" />
										Student ID
									</div>
									<div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 text-center sm:text-left">
										{member.LpuId}
									</div>
								</div>
							)}
							{isAuthenticated && member.status && (
								<div className="p-2 sm:p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center justify-center sm:justify-start text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<Shield size={14} className="mr-2" />
										Status
									</div>
									<div className="flex justify-center sm:justify-start">
										<StatusBadge status={member.status} />
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Tabs Navigation */}
				<div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide flex-shrink-0">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
									activeTab === tab.id
										? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
										: 'text-gray-500 border-transparent hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
								}`}
							>
								<Icon size={14} className="sm:w-4 sm:h-4" />
								<span className="hidden xs:inline">{tab.label}</span>
							</button>
						);
					})}
				</div>

				{/* Tab Content */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-6 text-sm text-gray-800 dark:text-gray-200 space-y-4 sm:space-y-6 min-h-0">
					{/* About Tab */}
					{activeTab === 'about' && (
						<div className="space-y-4">
							<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
								<p
									className={
										member.bio
											? 'text-sm sm:text-base text-gray-800 dark:text-gray-200'
											: 'text-sm text-gray-500 dark:text-gray-400 italic'
									}
								>
									{member.bio || 'No bio provided.'}
								</p>
							</div>
							{member.joinedAt && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
									<Clock
										size={16}
										className="text-blue-600 dark:text-blue-400 flex-shrink-0"
									/>
									<span className="text-xs sm:text-sm">
										Member since: {formatDate(member.joinedAt)}
									</span>
								</div>
							)}
							{isAuthenticated && member.restriction?.isRestricted && (
								<div className="p-3 sm:p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
									<AlertTriangle
										size={18}
										className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
									/>
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-amber-900 dark:text-amber-300 mb-1 text-sm sm:text-base">
											Account Restriction
										</p>
										{member.restriction.reason && (
											<p className="text-amber-800 dark:text-amber-400 text-xs sm:text-sm mb-2 break-words">
												{member.restriction.reason}
											</p>
										)}
										{member.restriction.time && (
											<p className="text-amber-700 dark:text-amber-500 text-xs">
												Restricted on: {formatDate(member.restriction.time)}
											</p>
										)}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Contact Tab */}
					{activeTab === 'contact' && (
						<div className="space-y-3 sm:space-y-4">
							{isAuthenticated && member.email && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
										<Mail size={14} />
										Email
									</div>
									<a
										href={`mailto:${member.email}`}
										className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline break-all text-sm sm:text-base"
									>
										{member.email}
									</a>
								</div>
							)}
							{isAuthenticated && member.phone && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
										<Phone size={14} />
										Phone
									</div>
									<a
										href={`tel:${member.phone}`}
										className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base"
									>
										{member.phone}
									</a>
								</div>
							)}
							{member.socialLinks?.length > 0 && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
										<Globe size={14} />
										Social Links
									</div>
									<div className="flex flex-wrap gap-2 sm:gap-3">
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
													className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm"
													title={s.platform || 'Social Profile'}
												>
													<Icon size={14} className="sm:w-4 sm:h-4" />
													<span>{s.platform || 'Profile'}</span>
												</a>
											);
										})}
									</div>
								</div>
							)}
							{!isAuthenticated && !member.socialLinks?.length && (
								<p className="text-gray-500 dark:text-gray-400 italic text-center py-4 text-sm sm:text-base">
									Contact information is only available to authenticated users.
								</p>
							)}
						</div>
					)}

					{/* Skills Tab */}
					{activeTab === 'skills' && (
						<div>
							{member.skills?.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{member.skills.map((skill, idx) => (
										<span
											key={idx}
											className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium"
										>
											{skill}
										</span>
									))}
								</div>
							) : (
								<p className="text-gray-500 dark:text-gray-400 italic text-center py-4 text-sm sm:text-base">
									No skills listed.
								</p>
							)}
						</div>
					)}

					{/* Academic Tab */}
					{activeTab === 'academic' && (
						<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
							{member.program && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<School size={14} />
										Program
									</div>
									<div className="text-sm sm:text-base font-medium">
										{member.program}
									</div>
								</div>
							)}
							{member.year && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<Calendar size={14} />
										Academic Year
									</div>
									<div className="text-sm sm:text-base font-medium">
										Year {member.year}
									</div>
								</div>
							)}
							{typeof member.hosteler === 'boolean' && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 sm:col-span-2">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<Building size={14} />
										Residence
									</div>
									<div className="text-sm sm:text-base font-medium">
										{member.hosteler
											? `Hosteler${
													member.hostel ? ` - ${member.hostel}` : ''
											  }`
											: 'Day Scholar'}
									</div>
								</div>
							)}
							{!member.program && !member.year && member.hosteler === undefined && (
								<p className="text-gray-500 dark:text-gray-400 italic text-center py-4 sm:col-span-2 text-sm sm:text-base">
									No academic information available.
								</p>
							)}
						</div>
					)}

					{/* Documents Tab */}
					{activeTab === 'documents' && (
						<div>
							{member.resume?.url ? (
								<a
									href={member.resume.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm sm:text-base hover:bg-emerald-500 transition-colors"
								>
									<Download size={16} /> View Resume
								</a>
							) : (
								<p className="text-gray-500 dark:text-gray-400 italic text-center py-4 text-sm sm:text-base">
									No documents available.
								</p>
							)}
						</div>
					)}

					{/* Details Tab (Authenticated Only) */}
					{activeTab === 'details' && isAuthenticated && (
						<div className="space-y-3 sm:space-y-4">
							{member.memberID && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<IdCard size={14} />
										Member ID
									</div>
									<div className="text-xs sm:text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
										{member.memberID}
									</div>
								</div>
							)}
							{member._id && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<IdCard size={14} />
										Database ID
									</div>
									<div className="text-xs sm:text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
										{member._id}
									</div>
								</div>
							)}
							{member.status && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
										<Shield size={14} />
										Account Status
									</div>
									<StatusBadge status={member.status} />
								</div>
							)}
							{member.role && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<User size={14} />
										Role
									</div>
									<div className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 capitalize">
										{member.role}
									</div>
								</div>
							)}
							{allDepartments.length > 0 && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
										<Badge size={14} />
										All Departments
									</div>
									<div className="flex flex-wrap gap-2">
										{allDepartments.map((dept, idx) => (
											<span
												key={idx}
												className="px-2 sm:px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm"
											>
												{dept}
											</span>
										))}
									</div>
								</div>
							)}
							{allDesignations.length > 0 && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
										<User size={14} />
										All Designations
									</div>
									<div className="flex flex-wrap gap-2">
										{allDesignations.map((desig, idx) => (
											<span
												key={idx}
												className="px-2 sm:px-3 py-1 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs sm:text-sm"
											>
												{desig}
											</span>
										))}
									</div>
								</div>
							)}
							{member.createdAt && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<Clock size={14} />
										Created At
									</div>
									<div className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
										{formatDateTime(member.createdAt)}
									</div>
								</div>
							)}
							{member.updatedAt && (
								<div className="p-3 sm:p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										<Clock size={14} />
										Last Updated
									</div>
									<div className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
										{formatDateTime(member.updatedAt)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TeamMemberModal;
