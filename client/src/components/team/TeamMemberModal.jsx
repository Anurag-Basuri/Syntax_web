import React, { useState, useEffect, useRef } from 'react';
import {
	X,
	Mail,
	Linkedin,
	Github,
	Globe,
	Phone,
	Download,
	Clock,
	Shield,
	FileText,
	Clipboard,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * TeamMemberModal - improved:
 * - Responsive two-column layout that stacks on small screens
 * - Focus trap (basic), Escape to close
 * - Tab keyboard navigation between sections
 * - Copy contact and vCard download
 * - Cleaner visual grouping and accessible controls
 */

const getAvatar = (p) => {
	if (!p) return null;
	if (typeof p === 'string') return p;
	return p?.url || null;
};

const formatDate = (d) => {
	if (!d) return 'N/A';
	const dt = new Date(d);
	if (isNaN(dt.getTime())) return 'Invalid date';
	return dt.toLocaleDateString();
};

const buildVCard = (member) => {
	const lines = [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`FN:${member.fullname || ''}`,
		member.primaryRole ? `TITLE:${member.primaryRole}` : '',
		member.email ? `EMAIL;TYPE=INTERNET:${member.email}` : '',
		member.phone ? `TEL;TYPE=CELL:${member.phone}` : '',
		member.primaryDept ? `ORG:${member.primaryDept}` : '',
		'END:VCARD',
	].filter(Boolean);
	return lines.join('\r\n');
};

const TeamMemberModal = ({ member, isOpen, onClose }) => {
	const { isAuthenticated } = useAuth();
	const [active, setActive] = useState('about');
	const [imgError, setImgError] = useState(false);
	const modalRef = useRef(null);
	const closeBtnRef = useRef(null);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
			setActive('about');
			setImgError(false);
			// focus close button for quick keyboard access
			setTimeout(() => closeBtnRef.current?.focus?.(), 50);
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	// basic focus trap: keep focus inside modal
	useEffect(() => {
		const el = modalRef.current;
		if (!isOpen || !el) return;
		const focusable = el.querySelectorAll(
			'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
		);
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const handleKey = (e) => {
			if (e.key === 'Escape') onClose?.();
			if (e.key === 'Tab' && focusable.length > 0) {
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
			// quick left/right for tabs
			if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
				const tabs = ['about', 'contact', 'skills', 'academic', 'documents', 'details'];
				const visible = tabs.filter(Boolean);
				const idx = visible.indexOf(active);
				if (idx >= 0) {
					const next =
						e.key === 'ArrowRight'
							? visible[(idx + 1) % visible.length]
							: visible[(idx - 1 + visible.length) % visible.length];
					setActive(next);
				}
			}
		};
		el.addEventListener('keydown', handleKey);
		return () => el.removeEventListener('keydown', handleKey);
	}, [isOpen, active, onClose]);

	if (!isOpen || !member) return null;

	const avatar =
		getAvatar(member.profilePicture) ||
		`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(member.fullname)}`;
	const initials = (member.fullname || '??')
		.split(' ')
		.map((s) => s[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	const tabs = [
		{ id: 'about', label: 'About', show: true },
		{
			id: 'contact',
			label: 'Contact',
			show: isAuthenticated || member.socialLinks?.length > 0,
		},
		{ id: 'skills', label: 'Skills', show: member.skills?.length > 0 },
		{
			id: 'academic',
			label: 'Academic',
			show: !!(member.program || member.year || typeof member.hosteler === 'boolean'),
		},
		{ id: 'documents', label: 'Documents', show: !!member.resume?.url },
	].filter((t) => t.show);

	const copyContact = async () => {
		const text = `Name: ${member.fullname}\nEmail: ${member.email || 'N/A'}\nPhone: ${
			member.phone || 'N/A'
		}`;
		try {
			await navigator.clipboard.writeText(text);
			if (typeof window !== 'undefined')
				window.dispatchEvent(
					new CustomEvent('toast', { detail: { message: 'Contact copied to clipboard' } })
				);
		} catch {
			// ignore
		}
	};

	const downloadVCard = () => {
		const vcard = buildVCard(member);
		const blob = new Blob([vcard], { type: 'text/vcard' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${(member.fullname || 'contact').replace(/\s+/g, '_')}.vcf`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	return (
		<div
			className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-label={`Profile of ${member.fullname}`}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose?.();
			}}
		>
			<div
				ref={modalRef}
				className="w-full max-w-5xl max-h-[calc(100vh-4rem)] bg-[var(--card-bg)] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-3"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Left: cover & actions */}
				<div className="col-span-1 p-5 bg-gradient-to-b from-indigo-600/6 to-purple-600/6 flex flex-col gap-4">
					<div className="flex items-start gap-4">
						<div className="w-20 h-20 rounded-xl overflow-hidden ring-4 ring-white shadow">
							{!imgError ? (
								<img
									src={avatar}
									alt={member.fullname}
									className="w-full h-full object-cover"
									onError={() => setImgError(true)}
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white font-bold text-2xl">
									{initials}
								</div>
							)}
						</div>
						<div className="min-w-0">
							<h2 className="text-lg font-bold">{member.fullname}</h2>
							<div className="text-sm text-[var(--text-secondary)]">
								{member.primaryRole || member.primaryDesignation || 'Member'}
							</div>
							<div className="text-xs text-[var(--text-muted)] mt-1">
								{member.primaryDept || 'Team'}
							</div>
						</div>
					</div>

					<div className="flex gap-2 flex-wrap mt-2">
						{member.email && (
							<a
								href={`mailto:${member.email}`}
								className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white text-indigo-700 hover:opacity-95"
							>
								<Mail size={14} /> Email
							</a>
						)}
						{member.phone && (
							<a
								href={`tel:${member.phone}`}
								className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/8 text-white hover:opacity-95"
							>
								<Phone size={14} /> Call
							</a>
						)}
						{member.resume?.url && (
							<a
								href={member.resume.url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white"
							>
								<Download size={14} /> Resume
							</a>
						)}
					</div>

					{member.socialLinks?.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-2">
							{member.socialLinks.map((s, i) => {
								const raw = (s?.url || '').startsWith('http')
									? s.url
									: `https://${s?.url || ''}`;
								const Icon = (s.platform || '').toLowerCase().includes('github')
									? Github
									: (s.platform || '').toLowerCase().includes('linkedin')
									? Linkedin
									: Globe;
								return (
									<a
										key={i}
										href={raw}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
									>
										<Icon size={14} /> <span>{s.platform || 'Profile'}</span>
									</a>
								);
							})}
						</div>
					)}

					{/* Copy / vCard actions */}
					<div className="mt-auto flex gap-2">
						<button
							onClick={copyContact}
							className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)]"
						>
							<Clipboard size={14} /> Copy contact
						</button>
						<button
							onClick={downloadVCard}
							className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--glass-bg)] border border-[var,--glass-border)]"
						>
							<FileText size={14} /> Download vCard
						</button>
					</div>
				</div>

				{/* Right: tabbed content */}
				<div className="col-span-2 p-5 overflow-y-auto">
					<div className="flex items-center justify-between gap-4 mb-3">
						<div className="flex items-center gap-2">
							{member.isLeader && (
								<div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs">
									<Shield size={12} /> Leader
								</div>
							)}
						</div>
						<button
							ref={closeBtnRef}
							onClick={onClose}
							className="p-2 rounded-md text-[var(--text-muted)] hover:bg-gray-100"
						>
							<X size={18} />
						</button>
					</div>

					{/* Tabs */}
					<nav className="mb-4" aria-label="Profile sections">
						<ul className="flex gap-2 overflow-x-auto">
							{tabs.map((t) => (
								<li key={t.id}>
									<button
										onClick={() => setActive(t.id)}
										className={`px-3 py-2 rounded-md text-sm ${
											active === t.id
												? 'bg-indigo-50 text-indigo-700'
												: 'text-[var(--text-secondary)] hover:bg-gray-50'
										}`}
										aria-current={active === t.id ? 'true' : undefined}
									>
										{t.label}
									</button>
								</li>
							))}
						</ul>
					</nav>

					{/* content */}
					<div className="space-y-4 text-sm">
						{active === 'about' && (
							<div className="space-y-3">
								<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
									{member.bio ? (
										<p className="text-sm">{member.bio}</p>
									) : (
										<p className="text-sm italic text-[var(--text-muted)]">
											No bio available.
										</p>
									)}
								</div>

								{/* meta grid */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{member.joinedAt && (
										<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-start gap-3">
											<Clock size={18} className="text-indigo-600" />
											<div>
												<div className="text-xs text-[var(--text-muted)]">
													Member since
												</div>
												<div className="font-medium">
													{formatDate(member.joinedAt)}
												</div>
											</div>
										</div>
									)}
									{member.status && (
										<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-start gap-3">
											<Shield size={18} className="text-gray-600" />
											<div>
												<div className="text-xs text-[var(--text-muted)]">
													Account status
												</div>
												<div className="font-medium">{member.status}</div>
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{active === 'contact' && (
							<div className="space-y-3">
								{isAuthenticated && member.email && (
									<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
										<div className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-2">
											<Mail size={14} /> Email
										</div>
										<a
											href={`mailto:${member.email}`}
											className="font-medium break-all text-indigo-700"
										>
											{member.email}
										</a>
									</div>
								)}
								{isAuthenticated && member.phone && (
									<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var,--glass-border)]">
										<div className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-2">
											<Phone size={14} /> Phone
										</div>
										<a
											href={`tel:${member.phone}`}
											className="font-medium text-indigo-700"
										>
											{member.phone}
										</a>
									</div>
								)}
								{!isAuthenticated && !member.socialLinks?.length && (
									<p className="text-[var(--text-muted)] italic">
										Sign in to view direct contact details. Public profiles are
										shown below.
									</p>
								)}
								{member.socialLinks?.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{member.socialLinks.map((s, i) => {
											const url = (s?.url || '').startsWith('http')
												? s.url
												: `https://${s?.url || ''}`;
											const Icon = (s?.platform || '')
												.toLowerCase()
												.includes('github')
												? Github
												: (s?.platform || '')
														.toLowerCase()
														.includes('linkedin')
												? Linkedin
												: Globe;
											return (
												<a
													key={i}
													href={url}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--glass-bg)] border border-[var,--glass-border)] text-sm"
												>
													<Icon size={14} /> {s.platform || 'Profile'}
												</a>
											);
										})}
									</div>
								)}
							</div>
						)}

						{active === 'skills' && (
							<div>
								{member.skills?.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{member.skills.map((s, i) => (
											<span
												key={i}
												className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs"
											>
												{s}
											</span>
										))}
									</div>
								) : (
									<p className="text-[var(--text-muted)] italic">
										No skills listed.
									</p>
								)}
							</div>
						)}

						{active === 'academic' && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{member.program && (
									<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var,--glass-border)]">
										<div className="text-xs text-[var(--text-muted)]">
											Program
										</div>
										<div className="font-medium mt-1">{member.program}</div>
									</div>
								)}
								{member.year && (
									<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var,--glass-border)]">
										<div className="text-xs text-[var(--text-muted)]">
											Academic Year
										</div>
										<div className="font-medium mt-1">Year {member.year}</div>
									</div>
								)}
								{isAuthenticated && typeof member.hosteler === 'boolean' && (
									<div className="rounded-md p-3 bg-[var(--glass-bg)] border border-[var,--glass-border)] sm:col-span-2">
										<div className="text-xs text-[var(--text-muted)]">
											Residence
										</div>
										<div className="font-medium mt-1">
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

						{active === 'documents' && (
							<div>
								{member.resume?.url ? (
									<a
										href={member.resume.url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white"
									>
										<Download size={14} /> View Resume
									</a>
								) : (
									<p className="text-[var(--text-muted)] italic">
										No documents available.
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TeamMemberModal;
