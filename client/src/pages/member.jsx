import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api.js';
import {
	updateMyProfile,
	uploadProfilePicture as svcUploadProfilePicture,
	uploadResume as svcUploadResume,
	resetPassword as svcResetPassword,
} from '../services/memberServices.js';
import ImageEditor from '../components/member/ImageEditor.jsx';
import UploadProgress from '../components/member/UploadProgress.jsx';
import ProfileHeader from '../components/member/ProfileHeader.jsx';
import ProfileForm from '../components/member/ProfileForm.jsx';
import ProfileDisplay from '../components/member/ProfileDisplay.jsx';
import PasswordResetModal from '../components/member/PasswordResetModal.jsx';
import MessageNotification from '../components/member/MessageNotification.jsx';
import { validateFile, simulateProgress } from '../utils/fileUtils.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';
import { Edit2, Ticket, Calendar, Bell, User } from 'lucide-react';
import './member.css';

const StatItem = ({ label, value }) => (
	<div className="stat-item">
		<div className="stat-value">{value}</div>
		<div className="stat-label">{label}</div>
	</div>
);

const EmptyBlock = ({ title, hint, actionLabel, onAction }) => (
	<div className="empty-block">
		<div className="empty-icon">
			<User size={36} />
		</div>
		<h4>{title}</h4>
		<p className="muted">{hint}</p>
		{actionLabel && (
			<button className="btn-primary mt-3" onClick={onAction}>
				{actionLabel}
			</button>
		)}
	</div>
);

const MemberProfile = () => {
	// --- react-query / services setup ---
	const queryClient = useQueryClient();

	// fetch current member (object signature required by v5)
	const memberQuery = useQuery({
		queryKey: ['currentMember'],
		queryFn: async () => {
			const resp = await apiClient.get('/api/v1/members/me');
			return resp.data?.data;
		},
		enabled: false,
	});

	const getCurrentMember = memberQuery.refetch;
	const member = memberQuery.data;
	const memberLoading = memberQuery.isLoading;
	const memberError = memberQuery.error;

	// mutations (v5 object signature)
	const {
		mutateAsync: updateProfileMut,
		isLoading: updateLoading,
		error: updateError,
	} = useMutation({
		mutationFn: ({ memberId, data }) => updateMyProfile(memberId, data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentMember'] }),
	});

	const {
		mutateAsync: uploadProfilePicMut,
		isLoading: uploadLoading,
		error: uploadError,
	} = useMutation({
		mutationFn: ({ memberId, formData }) => svcUploadProfilePicture(memberId, formData),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentMember'] }),
	});

	const {
		mutateAsync: uploadResumeMut,
		isLoading: uploadResumeLoading,
		error: uploadResumeError,
	} = useMutation({
		mutationFn: ({ memberId, formData }) => svcUploadResume(memberId, formData),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentMember'] }),
	});

	const {
		mutateAsync: resetPasswordMut,
		isLoading: resetLoading,
		error: resetError,
	} = useMutation({
		mutationFn: ({ LpuId, password }) => svcResetPassword({ LpuId, password }),
	});

	// --- STATE ---
	const [isEditing, setIsEditing] = useState(false);
	const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);
	const [formData, setFormData] = useState({
		email: '',
		phone: '',
		program: '',
		year: '',
		hosteler: false,
		hostel: '',
		socialLinks: [],
		bio: '',
		skills: [],
	});
	const [message, setMessage] = useState('');
	const [showPasswordReset, setShowPasswordReset] = useState(false);
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [newSkill, setNewSkill] = useState('');
	const [showImageEditor, setShowImageEditor] = useState(false);
	const [editorImage, setEditorImage] = useState(null);
	const [isEditingImage, setIsEditingImage] = useState(false);
	const [originalFile, setOriginalFile] = useState(null); // presence indicates blob URL needs revoking
	const [uploadProgress, setUploadProgress] = useState(null);
	const [showProfilePicture, setShowProfilePicture] = useState(false);

	// --- REFS ---
	const fileInputRef = useRef(null);
	const resumeInputRef = useRef(null);

	// --- DATA FETCHING & STATE SYNC ---
	useEffect(() => {
		if (!hasInitiallyFetched) {
			setHasInitiallyFetched(true);
			getCurrentMember().catch((err) => {
				console.error('Failed to fetch member data:', err);
				setMessage('Failed to load member data. Please try again.');
			});
		}
	}, [getCurrentMember, hasInitiallyFetched]);

	useEffect(() => {
		if (member?._id) {
			setFormData({
				email: member.email || '',
				phone: member.phone || '',
				program: member.program || '',
				year: member.year || '',
				hosteler: member.hosteler || false,
				hostel: member.hostel || '',
				socialLinks: member.socialLinks || [],
				bio: member.bio || '',
				skills: member.skills || [],
			});
		}
	}, [member?._id]);

	useEffect(() => {
		const errors = [
			memberError,
			updateError,
			uploadError,
			uploadResumeError,
			resetError,
		].filter(Boolean);
		if (errors.length > 0) {
			const first = errors[0];
			setMessage(typeof first === 'string' ? first : first?.message || 'An error occurred');
		}
	}, [memberError, updateError, uploadError, uploadResumeError, resetError]);

	useEffect(() => {
		return () => {
			if (originalFile && editorImage && editorImage.startsWith('blob:')) {
				try {
					URL.revokeObjectURL(editorImage);
				} catch (e) {
					/* ignore */
				}
			}
		};
	}, [editorImage, originalFile]);

	useEffect(() => {
		if (message) {
			const timer = setTimeout(() => setMessage(''), 5000);
			return () => clearTimeout(timer);
		}
	}, [message]);

	// --- CALLBACKS ---
	const handleEditToggle = useCallback(() => setIsEditing((prev) => !prev), []);
	const handleCancelEdit = useCallback(() => setIsEditing(false), []);
	const handlePasswordResetOpen = useCallback(() => setShowPasswordReset(true), []);
	const handlePasswordResetClose = useCallback(() => setShowPasswordReset(false), []);
	const handleMessageClose = useCallback(() => setMessage(''), []);
	const handleUploadProgressCancel = useCallback(() => setUploadProgress(null), []);

	const handleProfilePictureView = useCallback(() => {
		setShowProfilePicture(true);
	}, []);

	const handleProfilePictureClick = useCallback((imageUrl) => {
		if (!imageUrl) return;
		setEditorImage(imageUrl);
		setIsEditingImage(false);
		setOriginalFile(null);
		setShowImageEditor(true);
	}, []);

	const handleImageSelect = useCallback((e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = '';
		const validation = validateFile(file, 'image');
		if (!validation.isValid) {
			setMessage(validation.errors[0]);
			return;
		}
		const url = URL.createObjectURL(file);
		setOriginalFile(file);
		setEditorImage(url);
		setIsEditingImage(true);
		setShowImageEditor(true);
	}, []);

	const handleImageSave = useCallback(
		async (croppedBlob) => {
			if (!croppedBlob) return;

			if (!member?._id) {
				setMessage('Unable to upload image. Please refresh and try again.');
				return;
			}

			let progressInterval;
			try {
				setShowImageEditor(false);

				setUploadProgress({
					fileName: originalFile?.name || 'profile.jpg',
					progress: 0,
					type: 'image',
				});

				progressInterval = simulateProgress((p) =>
					setUploadProgress((prev) => (prev ? { ...prev, progress: p } : null))
				);

				const formDataToUpload = new FormData();
				formDataToUpload.append(
					'profilePicture',
					croppedBlob,
					originalFile?.name || 'profile.jpg'
				);

				await uploadProfilePicMut({ memberId: member._id, formData: formDataToUpload });

				if (progressInterval) clearInterval(progressInterval);
				setUploadProgress((prev) => (prev ? { ...prev, progress: 100 } : null));

				setTimeout(() => {
					setUploadProgress(null);
					setOriginalFile(null);
					if (editorImage && editorImage.startsWith('blob:')) {
						try {
							URL.revokeObjectURL(editorImage);
						} catch (e) {}
						setEditorImage(null);
					}
				}, 800);

				setMessage('Profile picture updated successfully!');
				await getCurrentMember();
			} catch (error) {
				console.error('Upload error:', error);
				if (progressInterval) clearInterval(progressInterval);
				setUploadProgress(null);
				setMessage(error?.message || 'Failed to upload profile picture. Please try again.');
			}
		},
		[member?._id, originalFile, editorImage, uploadProfilePicMut, getCurrentMember]
	);

	const handleResumeUpload = useCallback(
		async (e) => {
			const file = e.target.files?.[0];
			if (!file) return;
			e.target.value = '';

			if (!member?._id) {
				setMessage('Unable to upload resume. Please refresh and try again.');
				return;
			}

			const validation = validateFile(file, 'document');
			if (!validation.isValid) {
				setMessage(validation.errors[0]);
				return;
			}

			let progressInterval;
			try {
				setUploadProgress({
					fileName: file.name,
					progress: 0,
					type: 'document',
				});

				progressInterval = simulateProgress((p) =>
					setUploadProgress((prev) => (prev ? { ...prev, progress: p } : null))
				);

				const formDataToUpload = new FormData();
				formDataToUpload.append('resume', file);

				await uploadResumeMut({ memberId: member._id, formData: formDataToUpload });

				if (progressInterval) clearInterval(progressInterval);
				setUploadProgress((prev) => (prev ? { ...prev, progress: 100 } : null));
				setTimeout(() => setUploadProgress(null), 800);

				setMessage('Resume uploaded successfully!');
				await getCurrentMember();
			} catch (error) {
				console.error('Upload error:', error);
				if (progressInterval) clearInterval(progressInterval);
				setUploadProgress(null);
				setMessage(error?.message || 'Failed to upload resume. Please try again.');
			}
		},
		[member?._id, uploadResumeMut, getCurrentMember]
	);

	const handlePasswordReset = useCallback(
		async (e) => {
			e.preventDefault();

			if (!member?.LpuId) {
				setMessage('Unable to reset password. Please refresh and try again.');
				return;
			}

			if (newPassword !== confirmPassword) {
				setMessage('Passwords do not match');
				return;
			}

			if (newPassword.length < 8) {
				setMessage('Password must be at least 8 characters long');
				return;
			}

			try {
				await resetPasswordMut({ LpuId: member.LpuId, password: newPassword });
				setMessage('Password reset successfully!');
				setShowPasswordReset(false);
				setNewPassword('');
				setConfirmPassword('');
			} catch (error) {
				console.error('Password reset error:', error);
				setMessage(error?.message || 'Failed to reset password. Please try again.');
			}
		},
		[member?.LpuId, newPassword, confirmPassword, resetPasswordMut]
	);

	const handleInputChange = useCallback((e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	}, []);

	const handleSocialLinkChange = useCallback((index, keyOrValue, valueIfKey) => {
		setFormData((prev) => {
			const links = Array.isArray(prev.socialLinks) ? [...prev.socialLinks] : [];
			const current = links[index] || { platform: '', url: '' };
			if (typeof keyOrValue === 'string' && valueIfKey !== undefined) {
				current[keyOrValue] = valueIfKey;
			} else {
				links[index] = keyOrValue;
				return { ...prev, socialLinks: links };
			}
			links[index] = current;
			return { ...prev, socialLinks: links };
		});
	}, []);

	const addSocialLink = useCallback(() => {
		setFormData((prev) => ({
			...prev,
			socialLinks: [...(prev.socialLinks || []), { platform: '', url: '' }],
		}));
	}, []);

	const removeSocialLink = useCallback((index) => {
		setFormData((prev) => ({
			...prev,
			socialLinks: prev.socialLinks.filter((_, i) => i !== index),
		}));
	}, []);

	const addSkill = useCallback(
		(skillValue) => {
			let skill = skillValue !== undefined ? skillValue : newSkill;
			if (typeof skill === 'object' && skill !== null)
				skill = skill.label || skill.value || '';
			skill = (skill || '').trim();
			if (!skill) return;
			setFormData((prev) => {
				const skills = Array.isArray(prev.skills) ? [...prev.skills] : [];
				if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return prev;
				return { ...prev, skills: [...skills, skill].slice(0, 15) };
			});
			setNewSkill('');
		},
		[newSkill]
	);

	const removeSkill = useCallback((index) => {
		setFormData((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
	}, []);

	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			if (!member?._id) {
				setMessage('Unable to update profile. Please refresh and try again.');
				return;
			}
			try {
				await updateProfileMut({ memberId: member._id, data: formData });
				setMessage('Profile updated successfully!');
				setIsEditing(false);
				await getCurrentMember();
			} catch (error) {
				console.error('Profile update error:', error);
				setMessage(error?.message || 'Failed to update profile. Please try again.');
			}
		},
		[member?._id, formData, updateProfileMut, getCurrentMember]
	);

	// --- RENDER STATES --- (rest unchanged)
	if (memberLoading && !member) {
		return (
			<div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
				>
					<div className="relative mb-6">
						<div className="w-20 h-20 border-4 border-blue-100 dark:border-blue-900 rounded-full mx-auto"></div>
						<div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
					</div>
					<h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
						Loading Profile
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						Please wait while we fetch your information...
					</p>
				</motion.div>
			</div>
		);
	}

	if (!member && hasInitiallyFetched && !memberLoading) {
		return (
			<div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
				>
					<div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
						<svg
							className="w-10 h-10 text-red-600 dark:text-red-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
						Profile Not Found
					</h2>
					<p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
						{memberError ||
							'We encountered an issue loading your profile. Please try refreshing the page.'}
					</p>
					<button
						onClick={() => {
							setHasInitiallyFetched(false);
							setMessage('');
						}}
						className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold shadow-lg"
					>
						Try Again
					</button>
				</motion.div>
			</div>
		);
	}

	const { currentUser } = useAuth();
	const { theme } = useTheme();
	const navigate = useNavigate();

	// lightweight derived values (safe defaults)
	const name = currentUser?.fullname || currentUser?.name || 'Member';
	const avatar = currentUser?.profilePicture?.url || currentUser?.avatar || '';
	const joined = currentUser?.createdAt ? new Date(currentUser.createdAt).getFullYear() : '';
	const stats = useMemo(
		() => ({
			events: currentUser?.stats?.eventsAttended || 0,
			tickets: currentUser?.stats?.tickets || 0,
			projects: currentUser?.stats?.projects || 0,
		}),
		[currentUser]
	);

	const upcoming = currentUser?.upcomingEvents || [];
	const activity = currentUser?.recentActivity || [];

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<MessageNotification message={message} onClose={handleMessageClose} />

				<AnimatePresence>
					{uploadProgress && (
						<UploadProgress
							progress={uploadProgress.progress}
							fileName={uploadProgress.fileName}
							type={uploadProgress.type}
							onCancel={handleUploadProgressCancel}
						/>
					)}
				</AnimatePresence>

				{member && (
					<div className="space-y-8">
						<ProfileHeader
							member={member}
							isEditing={isEditing}
							onEditToggle={handleEditToggle}
							onPasswordReset={handlePasswordResetOpen}
							onProfilePictureClick={handleProfilePictureClick}
							uploadLoading={uploadLoading}
							uploadResumeLoading={uploadResumeLoading}
							fileInputRef={fileInputRef}
							onImageSelect={handleImageSelect}
							onResumeUpload={handleResumeUpload}
						/>

						<AnimatePresence mode="wait">
							{isEditing ? (
								<ProfileForm
									key="profile-form"
									formData={formData}
									onInputChange={handleInputChange}
									onSocialLinkChange={handleSocialLinkChange}
									onAddSocialLink={addSocialLink}
									onRemoveSocialLink={removeSocialLink}
									onAddSkill={addSkill}
									onRemoveSkill={removeSkill}
									newSkill={newSkill}
									setNewSkill={setNewSkill}
									onSubmit={handleSubmit}
									onCancel={handleCancelEdit}
									isLoading={updateLoading}
								/>
							) : (
								<ProfileDisplay
									key="profile-display"
									member={member}
									onEditToggle={handleEditToggle}
									onProfilePictureView={handleProfilePictureView}
								/>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Password modal */}
				<PasswordResetModal
					isOpen={showPasswordReset}
					onClose={handlePasswordResetClose}
					newPassword={newPassword}
					setNewPassword={setNewPassword}
					confirmPassword={confirmPassword}
					setConfirmPassword={setConfirmPassword}
					showPassword={showPassword}
					setShowPassword={setShowPassword}
					showConfirmPassword={showConfirmPassword}
					setShowConfirmPassword={setShowConfirmPassword}
					onSubmit={handlePasswordReset}
					isLoading={resetLoading}
				/>

				{/* Image editor */}
				<AnimatePresence>
					{showImageEditor && editorImage && (
						<ImageEditor
							image={editorImage}
							onSave={isEditingImage ? handleImageSave : undefined}
							onCancel={() => {
								setShowImageEditor(false);
								if (
									originalFile &&
									editorImage &&
									editorImage.startsWith('blob:')
								) {
									try {
										URL.revokeObjectURL(editorImage);
									} catch (e) {}
									setEditorImage(null);
									setOriginalFile(null);
								}
							}}
							isEditing={isEditingImage}
							onUploadNew={() => fileInputRef.current?.click()}
						/>
					)}
				</AnimatePresence>

				{/* Profile picture viewer */}
				<AnimatePresence>
					{showProfilePicture && member?.profilePicture?.url && <div />}
				</AnimatePresence>
			</div>
		</div>
	);
};

export default MemberProfile;
