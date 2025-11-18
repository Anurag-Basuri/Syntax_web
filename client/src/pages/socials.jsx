import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Heart,
	MessageCircle,
	Share2,
	Plus,
	ChevronUp,
	Play,
	Pause,
	Volume2,
	VolumeX,
	MoreHorizontal,
	Trash2,
	X,
	Upload,
	Video as VideoIcon,
	Sparkles,
	Lightbulb,
	AlertCircle,
	Loader2,
	Image as ImageIcon,
	Clock,
	User,
	Copy,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { createPost, deletePost } from '../services/socialsServices.js';
import useSocials from '../hooks/useSocials.js';
import toast from 'react-hot-toast';
import './socials.css';

/* ----------------------
   Helpers & Transformers
   ---------------------- */

const formatTimeAgo = (dateString) => {
	if (!dateString) return 'Just now';
	const date = new Date(dateString);
	const now = new Date();
	const diff = Math.floor((now - date) / 1000);
	if (diff < 60) return `${diff}s ago`;
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const transformPost = (post) => {
	const media = (post.media || []).map((item) => ({
		id: item.publicId || item._id || Math.random().toString(36),
		url: item.url,
		type:
			item.resource_type === 'video' || (item.url || '').match(/\.(mp4|webm|ogg)$/)
				? 'video'
				: 'image',
		publicId: item.publicId,
		resource_type: item.resource_type,
	}));

	return {
		_id: post._id,
		user: {
			id: post.author?._id || post.author?.id,
			// Always display "Admin" as the poster name per requirement
			name: 'Admin',
			fullname: 'Admin',
			role: 'admin',
			avatar: post.author?.profilePicture?.url || post.author?.avatar || '',
			verified: !!post.author?.verified,
		},
		title: post.title || '',
		content: post.content || '',
		media,
		images: media.filter((m) => m.type === 'image'),
		videos: media.filter((m) => m.type === 'video'),
		likes: post.likes || 0,
		comments: post.comments || 0,
		createdAt: post.createdAt,
		updatedAt: post.updatedAt,
		status: post.status,
	};
};

/* ----------------------
   PostCard (memoized)
   ---------------------- */

const PostCard = React.memo(({ post, currentUser, onDelete }) => {
	const [showOptions, setShowOptions] = useState(false);
	const [expandedMedia, setExpandedMedia] = useState(null);
	const videoRefs = useRef({});
	const optionsRef = useRef(null);

	// Only admins can delete (server enforces, this is UI guard)
	const canDelete = currentUser?.role === 'admin' || currentUser?.id === post.user?.id;
	const isViewer = currentUser?.role !== 'admin';

	useEffect(() => {
		const handle = (e) => {
			if (optionsRef.current && !optionsRef.current.contains(e.target)) {
				setShowOptions(false);
			}
		};
		if (showOptions) document.addEventListener('mousedown', handle);
		return () => document.removeEventListener('mousedown', handle);
	}, [showOptions]);

	const toggleVideo = useCallback((id) => {
		const v = videoRefs.current[id];
		if (!v) return;
		if (v.paused) v.play().catch(() => {});
		else v.pause();
	}, []);

	const initials =
		post.user?.name
			?.split(' ')
			.map((n) => n?.[0] || '')
			.join('')
			.substring(0, 2)
			.toUpperCase() || '??';

	const handleShare = async (e) => {
		e.stopPropagation();
		const url = `${window.location.origin}/socials/${post._id}`;
		const text = post.title || (post.content && post.content.slice(0, 120));
		// Use Web Share API if available
		if (navigator.share) {
			try {
				await navigator.share({
					title: post.title || 'Organization Update',
					text: text || '',
					url,
				});
				toast.success('Shared');
				return;
			} catch (err) {
				// user cancelled or failed — fall back to clipboard
			}
		}
		// Fallback: copy link
		try {
			await navigator.clipboard.writeText(url);
			toast.success('Link copied to clipboard');
		} catch (err) {
			// Last fallback: open share window
			window.open(url, '_blank', 'noopener,noreferrer');
			toast('Opened link');
		}
	};

	return (
		<motion.article
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ duration: 0.28 }}
			className="post-card relative bg-[var(--card-bg)] backdrop-blur-lg rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-[var(--shadow-md)] mb-6 sm:mb-8"
		>
			{/* Header */}
			<div className="p-4 sm:p-6">
				<div className="flex items-start gap-3">
					<div className="flex-shrink-0">
						{post.user?.avatar ? (
							<img
								src={post.user.avatar}
								alt={`${post.user.name} avatar`}
								className="w-12 h-12 rounded-full object-cover"
								loading="lazy"
								decoding="async"
							/>
						) : (
							<div className="w-12 h-12 rounded-full admin-avatar flex items-center justify-center text-white font-semibold">
								{initials}
							</div>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between gap-3">
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<h3 className="font-semibold text-[var(--text-primary)] truncate text-sm sm:text-base">
										{post.user?.name}
									</h3>
									{post.user?.role === 'admin' && (
										<span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] text-white">
											Admin
										</span>
									)}
								</div>
								<p className="text-xs text-[var(--text-muted)] mt-1">
									{formatTimeAgo(post.createdAt)}
								</p>
							</div>

							{canDelete && (
								<div ref={optionsRef} className="relative">
									<button
										onClick={() => setShowOptions((s) => !s)}
										className="p-2 rounded-full hover:bg-[var(--glass-hover)]"
										aria-label="Options"
									>
										<MoreHorizontal className="w-5 h-5 text-[var(--text-muted)]" />
									</button>

									<AnimatePresence>
										{showOptions && (
											<motion.div
												initial={{ opacity: 0, scale: 0.95, y: -6 }}
												animate={{ opacity: 1, scale: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95, y: -6 }}
												className="absolute right-0 top-full mt-2 bg-[var(--glass-bg)] rounded-lg border border-[var(--glass-border)] shadow-[var(--shadow-lg)] z-10"
											>
												<button
													onClick={() => {
														if (window.confirm('Delete this post?'))
															onDelete(post._id);
														setShowOptions(false);
													}}
													className="flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-[var(--glass-hover)] rounded-lg text-sm"
												>
													<Trash2 className="w-4 h-4" />
													Delete Post
												</button>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Title & content */}
				{(post.title || post.content) && (
					<div className="mt-4">
						{post.title && (
							<h4 className="text-lg font-bold text-[var(--text-primary)]">
								{post.title}
							</h4>
						)}
						{post.content && (
							<p className="mt-2 text-[var(--text-secondary)] whitespace-pre-wrap">
								{post.content}
							</p>
						)}
					</div>
				)}
			</div>

			{/* Media */}
			{post.media && post.media.length > 0 && (
				<div className="px-4 sm:px-6 pb-3">
					{/* Single media: show large; multiple: responsive mosaic */}
					{post.media.length === 1 ? (
						<div className="rounded-xl overflow-hidden border border-[var(--glass-border)] media-single">
							{post.media[0].type === 'image' ? (
								<img
									src={post.media[0].url}
									alt="post image"
									className="w-full h-auto max-h-[520px] object-cover"
									loading="lazy"
									decoding="async"
									onClick={() => setExpandedMedia(post.media[0])}
								/>
							) : (
								<div className="relative media-video-hero">
									<video
										ref={(el) => (videoRefs.current[post.media[0].id] = el)}
										src={post.media[0].url}
										className="w-full h-auto max-h-[520px] object-cover"
										muted
										loop
										playsInline
										preload="metadata"
									/>
									<div className="video-overlay">
										<button
											onClick={() => toggleVideo(post.media[0].id)}
											className="play-button"
											aria-label="Play/Pause video"
										>
											{videoRefs.current[post.media[0].id] &&
											!videoRefs.current[post.media[0].id].paused ? (
												<Pause />
											) : (
												<Play />
											)}
										</button>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="grid gap-2 rounded-xl overflow-hidden border border-[var(--glass-border)] media-mosaic">
							{post.media.slice(0, 8).map((m, idx) => (
								<div
									key={m.id}
									className="relative media-cell"
									onClick={() => setExpandedMedia(m)}
								>
									{m.type === 'image' ? (
										<img
											src={m.url}
											alt="media"
											className="w-full h-full object-cover"
											loading="lazy"
											decoding="async"
										/>
									) : (
										<div className="relative h-full">
											<video
												ref={(el) => (videoRefs.current[m.id] = el)}
												src={m.url}
												className="w-full h-full object-cover"
												muted
												loop
												playsInline
												preload="metadata"
											/>
											<div className="video-overlay">
												<button
													onClick={(e) => {
														e.stopPropagation();
														toggleVideo(m.id);
													}}
													className="play-button small"
													aria-label="Play/Pause video"
												>
													{videoRefs.current[m.id] &&
													!videoRefs.current[m.id].paused ? (
														<Pause />
													) : (
														<Play />
													)}
												</button>
											</div>
										</div>
									)}
									{post.media.length > 8 && idx === 7 && (
										<div className="absolute inset-0 overlay-count">
											+{post.media.length - 8}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Actions */}
			<div className="px-4 sm:px-6 py-3 border-t border-[var(--glass-border)] flex items-center gap-4">
				{/* Likes & comments are intentionally shown only to admins (post management & preview). Viewers can only share. */}
				{!isViewer && (
					<>
						<button
							className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
							aria-label="Like (admin preview)"
						>
							<Heart className="w-5 h-5" />
							<span>{post.likes || 0}</span>
						</button>

						<button
							className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
							aria-label="Comments (admin preview)"
						>
							<MessageCircle className="w-5 h-5" />
							<span>{post.comments || 0}</span>
						</button>
					</>
				)}

				<button
					onClick={handleShare}
					className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
					aria-label="Share"
				>
					<Share2 className="w-5 h-5" />
					<span className="hidden sm:inline">Share</span>
				</button>
			</div>

			{/* Fullscreen media viewer */}
			<AnimatePresence>
				{expandedMedia && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4"
						onClick={() => setExpandedMedia(null)}
					>
						<motion.div
							initial={{ scale: 0.96 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0.96 }}
							onClick={(e) => e.stopPropagation()}
							className="relative max-w-6xl max-h-[90vh] w-full"
						>
							<button
								onClick={() => setExpandedMedia(null)}
								className="absolute -top-12 right-0 p-2 bg-white/10 rounded-full text-white"
							>
								<X className="w-6 h-6" />
							</button>

							{expandedMedia.type === 'image' ? (
								<img
									src={expandedMedia.url}
									alt="expanded"
									className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
								/>
							) : (
								<video
									src={expandedMedia.url}
									className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
									controls
									autoPlay
								/>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.article>
	);
});

/* ----------------------
   CreatePostModal (updated)
   ---------------------- */

const CreatePostModal = ({ isOpen, onClose, onSubmit, currentUser }) => {
	const [content, setContent] = useState('');
	const [title, setTitle] = useState('');
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');
	const fileInputRef = useRef();

	const handleFileSelect = (e) => {
		const files = Array.from(e.target.files || []);
		if (selectedFiles.length + files.length > 6) {
			setError('Max 6 files allowed');
			return;
		}
		const mapped = files
			.map((file) => {
				if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
					setError('Only images and videos allowed');
					return null;
				}
				return {
					id: Math.random().toString(36).slice(2),
					url: URL.createObjectURL(file),
					file,
					type: file.type.startsWith('image/') ? 'image' : 'video',
				};
			})
			.filter(Boolean);
		setSelectedFiles((s) => [...s, ...mapped]);
		setError('');
	};

	const removeFile = (id) => {
		setSelectedFiles((prev) => {
			const f = prev.find((x) => x.id === id);
			if (f?.url) URL.revokeObjectURL(f.url);
			return prev.filter((x) => x.id !== id);
		});
	};

	const handleSubmit = async (ev) => {
		ev.preventDefault();
		setError('');

		// ensure only admins can submit (client-side guard; server also enforces)
		if (!currentUser || currentUser.role !== 'admin') {
			setError('Only admins may create posts.');
			toast.error('Only admins may create posts.');
			return;
		}

		if (!title.trim() && !content.trim() && selectedFiles.length === 0) {
			setError('Add a title, content or media to create a post.');
			return;
		}

		setIsSubmitting(true);
		try {
			const formData = new FormData();
			formData.append('title', title.trim());
			formData.append('content', content.trim());
			formData.append('status', 'published');
			selectedFiles.forEach((f) => formData.append('media', f.file));
			await createPost(formData);
			toast.success('Post created');
			setContent('');
			setTitle('');
			setSelectedFiles([]);
			onSubmit();
			onClose();
		} catch (err) {
			setError(err.message || 'Failed to create post');
			toast.error(err.message || 'Failed to create post');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setContent('');
		setTitle('');
		selectedFiles.forEach((f) => f.url && URL.revokeObjectURL(f.url));
		setSelectedFiles([]);
		setError('');
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={handleClose}
			/>
			<motion.form
				onSubmit={handleSubmit}
				initial={{ opacity: 0, scale: 0.98 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.98 }}
				onClick={(e) => e.stopPropagation()}
				className="relative bg-[var(--glass-bg)] rounded-2xl shadow-[var(--shadow-xl)] max-w-2xl w-full p-4 sm:p-6 border border-[var(--glass-border)]"
			>
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-semibold text-[var(--text-primary)]">
						Create post
					</h3>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 rounded-full hover:bg-[var(--glass-hover)]"
						aria-label="Close create post"
					>
						<X className="w-5 h-5 text-[var(--accent-1)]" />
					</button>
				</div>

				{error && (
					<div className="mb-3 text-sm text-red-400 flex items-center gap-2">
						<AlertCircle className="w-4 h-4" />
						{error}
					</div>
				)}

				<div className="mb-3">
					<label className="block text-sm text-[var(--text-secondary)] mb-1">Title</label>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg"
						placeholder="Title (optional)"
					/>
				</div>

				<div className="mb-3">
					<label className="block text-sm text-[var(--text-secondary)] mb-1">
						Content
					</label>
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="Share an update..."
						className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg min-h-[120px]"
					/>
				</div>

				{selectedFiles.length > 0 && (
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
						{selectedFiles.map((f) => (
							<div
								key={f.id}
								className="relative rounded-lg overflow-hidden border border-[var(--glass-border)]"
							>
								{f.type === 'image' ? (
									<img src={f.url} alt="" className="w-full h-28 object-cover" />
								) : (
									<div className="w-full h-28 flex items-center justify-center bg-[var(--bg-soft)]">
										<VideoIcon className="w-6 h-6 text-[var(--accent-1)]" />
									</div>
								)}
								<button
									type="button"
									onClick={() => removeFile(f.id)}
									className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"
									aria-label="Remove file"
								>
									<X className="w-3 h-3" />
								</button>
							</div>
						))}
					</div>
				)}

				<div className="flex items-center justify-between gap-3">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*,video/*"
						multiple
						className="hidden"
						onChange={handleFileSelect}
					/>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="px-3 py-2 bg-[var(--button-secondary-bg)] border border-[var(--button-secondary-border)] rounded-lg text-[var(--accent-1)]"
							aria-label="Add media"
						>
							<Upload className="w-4 h-4 inline-block" />{' '}
							<span className="ml-2 hidden sm:inline">Add media</span>
						</button>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleClose}
							className="px-3 py-2 rounded-lg border border-[var(--glass-border)]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 bg-[var(--button-primary-bg)] text-white rounded-lg"
							aria-label="Post"
						>
							{isSubmitting ? (
								<Loader2 className="w-4 h-4 animate-spin inline-block" />
							) : (
								'Post'
							)}
						</button>
					</div>
				</div>
			</motion.form>
		</div>
	);
};

/* ----------------------
   QuickComposer (inline)
   ---------------------- */

const QuickComposer = ({ canCreate, onOpenModal, currentUser }) => {
	if (!canCreate) return null;
	return (
		<div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-4 mb-6 flex gap-4 items-start">
			<div className="flex-shrink-0">
				{currentUser?.avatar ? (
					<img
						src={currentUser.avatar}
						alt={`${currentUser.name} avatar`}
						className="w-10 h-10 rounded-full object-cover"
					/>
				) : (
					<div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-1)] to-[var(--accent-2)] flex items-center justify-center text-white">
						{(currentUser?.name || 'U').slice(0, 1)}
					</div>
				)}
			</div>
			<button
				onClick={onOpenModal}
				className="flex-1 text-left p-3 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)]"
				aria-label="Open composer"
			>
				Share an update, photo or video...
			</button>
			<button
				onClick={onOpenModal}
				className="p-2 rounded-full bg-[var(--button-primary-bg)] text-white"
				aria-label="Open composer"
			>
				<Plus className="w-4 h-4" />
			</button>
		</div>
	);
};

/* ----------------------
   SocialsFeedPage
   ---------------------- */

const SocialsFeedPage = () => {
	const { isAuthenticated, user } = useAuth();
	const { socials, loading, error, refetch } = useSocials();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const posts = useMemo(
		() => (Array.isArray(socials) ? socials.map(transformPost) : []),
		[socials]
	);

	const currentUser = useMemo(() => {
		if (!isAuthenticated || !user)
			return { id: 'guest', name: 'Guest', role: 'viewer', avatar: '' };
		return {
			id: user._id || user.id,
			name: user.fullname || user.name,
			role: user.role || 'viewer',
			avatar: user.profilePicture?.url || user.avatar || '',
		};
	}, [isAuthenticated, user]);

	useEffect(() => {
		const onScroll = () => setShowScrollTop(window.scrollY > 300);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	const handleDeletePost = async (id) => {
		if (!window.confirm('Delete post permanently?')) return;
		try {
			await deletePost(id);
			toast.success('Post removed');
			refetch();
		} catch (err) {
			toast.error(err.message || 'Failed to delete');
		}
	};

	const handleCreate = () => refetch();

	const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

	// Only admins can create posts
	const canCreate = isAuthenticated && user?.role === 'admin';

	// No search: show all posts
	const filteredPosts = posts;

	return (
		<div className="socials-page relative min-h-screen bg-transparent overflow-x-hidden">
			{/* Sticky header */}
			<div className="sticky top-0 z-40 bg-[var(--nav-bg)] backdrop-blur-lg border-b border-[var(--nav-border)]">
				<div className="page-container">
					<div className="flex items-center justify-between gap-4 py-4">
						<div className="flex items-center gap-3">
							<div className="bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] p-2 rounded-xl">
								<Sparkles className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-xl font-bold brand-text">
									Organization Updates
								</h1>
								<p className="text-xs text-[var(--text-secondary)]">
									Official updates, event recaps and announcements
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							{canCreate && (
								<button
									onClick={() => setShowCreateModal(true)}
									className="btn btn-primary flex items-center gap-2"
								>
									<Plus className="w-4 h-4" /> Create Post
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Feed container */}
			<div className="page-container py-6">
				{/* Quick composer (admin only) */}
				<QuickComposer
					canCreate={canCreate}
					onOpenModal={() => setShowCreateModal(true)}
					currentUser={currentUser}
				/>

				{/* Error */}
				{error && (
					<div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded">
						{error}
					</div>
				)}

				{/* Posts */}
				<div>
					<AnimatePresence>
						{!loading && filteredPosts.length === 0 && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="py-12 text-center text-[var(--text-secondary)]"
							>
								<div className="mx-auto w-20 h-20 bg-[var(--glass-bg)] rounded-full flex items-center justify-center mb-4">
									<Sparkles className="w-8 h-8 text-[var(--accent-1)]" />
								</div>
								<h3 className="text-lg font-semibold text-[var(--text-primary)]">
									No updates found
								</h3>
								<p className="text-sm">
									Check back later for official announcements and event recaps.
								</p>
							</motion.div>
						)}

						{filteredPosts.map((p) => (
							<PostCard
								key={p._id}
								post={p}
								currentUser={currentUser}
								onDelete={handleDeletePost}
							/>
						))}
					</AnimatePresence>

					{loading && (
						<div className="flex justify-center py-10">
							<Loader2 className="w-8 h-8 animate-spin text-[var(--accent-1)]" />
						</div>
					)}
				</div>

				{/* TODO: Pagination or "Load more" button here (backend supports pagination). */}
			</div>

			{/* Scroll to top */}
			<AnimatePresence>
				{showScrollTop && (
					<motion.button
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						onClick={scrollToTop}
						className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[var(--button-primary-bg)] text-white shadow-[var(--shadow-lg)]"
						aria-label="Scroll to top"
					>
						<ChevronUp className="w-5 h-5" />
					</motion.button>
				)}
			</AnimatePresence>

			{/* Create modal (pass currentUser so modal also enforces admin-only submission) */}
			<CreatePostModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSubmit={handleCreate}
				currentUser={currentUser}
			/>
		</div>
	);
};

export default SocialsFeedPage;
