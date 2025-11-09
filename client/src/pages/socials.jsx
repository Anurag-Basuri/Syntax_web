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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { createPost, deletePost } from '../services/socialsServices.js';
import useSocials from '../hooks/useSocials.js';
import toast from 'react-hot-toast';

// Helper for time ago formatting
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

// Transform backend post to frontend format
const transformPost = (post) => {
	const media = (post.media || []).map((item) => ({
		id: item.publicId || item._id || Math.random().toString(36),
		url: item.url,
		type: item.resource_type === 'video' ? 'video' : 'image',
		publicId: item.publicId,
	}));

	return {
		_id: post._id,
		user: {
			id: post.author?._id || post.author?.id,
			name: post.author?.fullname || 'Unknown',
			fullname: post.author?.fullname || 'Unknown',
			role: post.author?.role || 'admin',
			avatar: post.author?.profilePicture?.url || post.author?.avatar || '',
			verified: post.author?.verified || false,
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
	};
};

const PostCard = ({ post, currentUser, onDelete }) => {
	const [showOptions, setShowOptions] = useState(false);
	const [isLiked, setIsLiked] = useState(false);
	const [imageLoaded, setImageLoaded] = useState({});
	const [videoStates, setVideoStates] = useState({});
	const videoRefs = useRef({});
	const optionsRef = useRef(null);

	const canDelete = currentUser?.role === 'admin' || currentUser?.id === post.user?.id;

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (optionsRef.current && !optionsRef.current.contains(e.target)) {
				setShowOptions(false);
			}
		};
		if (showOptions) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [showOptions]);

	const toggleVideo = useCallback((id) => {
		const video = videoRefs.current[id];
		if (video) {
			if (video.paused) {
				video.play().catch(() => {});
				setVideoStates((prev) => ({ ...prev, [id]: { ...prev[id], playing: true } }));
			} else {
				video.pause();
				setVideoStates((prev) => ({ ...prev, [id]: { ...prev[id], playing: false } }));
			}
		}
	}, []);

	const toggleMute = useCallback((id) => {
		const video = videoRefs.current[id];
		if (video) {
			video.muted = !video.muted;
			setVideoStates((prev) => ({ ...prev, [id]: { ...prev[id], muted: video.muted } }));
		}
	}, []);

	const media = post.media || [];

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, x: -100 }}
			transition={{ duration: 0.3 }}
			className="relative bg-[var(--card-bg)] backdrop-blur-lg rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-[var(--shadow-md)] group mb-6 sm:mb-8 transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:border-[var(--accent-1)]/30"
		>
			{/* Post Header */}
			<div className="p-4 sm:p-6 pb-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center space-x-3 flex-1 min-w-0">
						<div className="relative flex-shrink-0">
							<motion.img
								whileHover={{ scale: 1.05 }}
								src={
									post.user?.avatar ||
									`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
										post.user?.name || 'User'
									)}`
								}
								alt={post.user?.name || 'User'}
								className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-[var(--accent-1)]/50 transition-all duration-300"
								onError={(e) => {
									e.target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
										post.user?.name || 'User'
									)}`;
								}}
							/>
							{post.user?.verified && (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.2 }}
									className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] rounded-full flex items-center justify-center"
								>
									<div className="w-2 h-2 bg-white rounded-full"></div>
								</motion.div>
							)}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center space-x-2 flex-wrap gap-1">
								<h3 className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-1)] transition-colors cursor-pointer truncate text-sm sm:text-base">
									{post.user?.name || post.user?.fullname || 'Unknown'}
								</h3>
								{post.user?.role === 'admin' && (
									<motion.span
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] text-white rounded-full flex-shrink-0"
									>
										Admin
									</motion.span>
								)}
							</div>
							<p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
								{formatTimeAgo(post.createdAt)}
							</p>
						</div>
					</div>
					{canDelete && (
						<div className="relative flex-shrink-0" ref={optionsRef}>
							<motion.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => setShowOptions(!showOptions)}
								className="p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 hover:bg-[var(--glass-hover)]"
								aria-label="Post options"
							>
								<MoreHorizontal className="w-5 h-5 text-[var(--accent-1)]" />
							</motion.button>
							<AnimatePresence>
								{showOptions && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95, y: -10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.95, y: -10 }}
										className="absolute right-0 top-full mt-2 bg-[var(--glass-bg)] backdrop-blur-lg rounded-lg shadow-[var(--shadow-lg)] border border-[var(--glass-border)] z-10 min-w-[150px]"
									>
										<button
											onClick={() => {
												onDelete(post._id);
												setShowOptions(false);
											}}
											className="flex items-center space-x-2 px-4 py-3 text-red-400 hover:bg-[var(--glass-hover)] w-full text-left rounded-lg transition-colors text-sm"
										>
											<Trash2 className="w-4 h-4" />
											<span>Delete Post</span>
										</button>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}
				</div>
			</div>

			{/* Post Content */}
			{(post.title || post.content) && (
				<div className="px-4 sm:px-6 pb-4">
					{post.title && (
						<h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2">
							{post.title}
						</h2>
					)}
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
						className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words text-sm sm:text-base"
					>
						{post.content}
					</motion.p>
				</div>
			)}

			{/* Media Grid */}
			{media.length > 0 && (
				<div className="mb-4">
					{media.length === 1 ? (
						<div className="px-4 sm:px-6">
							<div className="rounded-xl overflow-hidden">
								{media[0].type === 'image' ? (
									<motion.div
										initial={{ opacity: 0, scale: 1.05 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.4 }}
										className="relative overflow-hidden"
									>
										<img
											src={media[0].url}
											alt="Post media"
											className="w-full h-64 sm:h-80 md:h-96 object-cover transition-transform duration-500 hover:scale-105"
											onLoad={() =>
												setImageLoaded((prev) => ({
													...prev,
													[media[0].id]: true,
												}))
											}
											onError={(e) => {
												e.target.style.display = 'none';
											}}
										/>
										{!imageLoaded[media[0].id] && (
											<div className="absolute inset-0 bg-[var(--bg-soft)] animate-pulse"></div>
										)}
									</motion.div>
								) : (
									<div className="relative">
										<video
											ref={(el) => (videoRefs.current[media[0].id] = el)}
											src={media[0].url}
											className="w-full h-64 sm:h-80 md:h-96 object-cover"
											muted
											loop
											playsInline
										/>
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="flex space-x-3 sm:space-x-4">
												<motion.button
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.95 }}
													onClick={() => toggleVideo(media[0].id)}
													className="p-2.5 sm:p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm"
													aria-label={
														videoStates[media[0].id]?.playing
															? 'Pause'
															: 'Play'
													}
												>
													{videoStates[media[0].id]?.playing ? (
														<Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
													) : (
														<Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" />
													)}
												</motion.button>
												<motion.button
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.95 }}
													onClick={() => toggleMute(media[0].id)}
													className="p-2.5 sm:p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm"
													aria-label={
														videoStates[media[0].id]?.muted !== false
															? 'Unmute'
															: 'Mute'
													}
												>
													{videoStates[media[0].id]?.muted !== false ? (
														<VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
													) : (
														<Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
													)}
												</motion.button>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="px-4 sm:px-6">
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.4 }}
								className={`grid gap-2 rounded-xl overflow-hidden ${
									media.length === 2
										? 'grid-cols-2'
										: media.length === 3
										? 'grid-cols-3'
										: media.length === 4
										? 'grid-cols-2 grid-rows-2'
										: 'grid-cols-2 grid-rows-3'
								}`}
							>
								{media.slice(0, 4).map((m, index) => (
									<motion.div
										key={m.id}
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.3, delay: index * 0.1 }}
										className={`relative overflow-hidden ${
											media.length === 5 && index === 0 ? 'row-span-2' : ''
										}`}
									>
										{m.type === 'image' ? (
											<img
												src={m.url}
												alt="Post media"
												className="w-full h-full object-cover min-h-[120px] sm:min-h-[150px] transition-transform duration-300 hover:scale-110"
												onError={(e) => {
													e.target.style.display = 'none';
												}}
											/>
										) : (
											<div className="relative">
												<video
													ref={(el) => (videoRefs.current[m.id] = el)}
													src={m.url}
													className="w-full h-full object-cover min-h-[120px] sm:min-h-[150px]"
													muted
													loop
													playsInline
												/>
												<button
													onClick={() => toggleVideo(m.id)}
													className="absolute inset-0 flex items-center justify-center"
													aria-label={
														videoStates[m.id]?.playing
															? 'Pause'
															: 'Play'
													}
												>
													<motion.div
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.95 }}
														className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm"
													>
														{videoStates[m.id]?.playing ? (
															<Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
														) : (
															<Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
														)}
													</motion.div>
												</button>
											</div>
										)}
										{media.length > 4 && index === 3 && (
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"
											>
												<span className="text-white font-semibold text-base sm:text-lg">
													+{media.length - 4}
												</span>
											</motion.div>
										)}
									</motion.div>
								))}
							</motion.div>
						</div>
					)}
				</div>
			)}

			{/* Post Actions */}
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--glass-border)]">
				<div className="flex items-center space-x-4 sm:space-x-6">
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => setIsLiked(!isLiked)}
						className={`flex items-center space-x-2 transition-all duration-300 ${
							isLiked
								? 'text-red-500 dark:text-red-400'
								: 'text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400'
						}`}
						aria-label={isLiked ? 'Unlike' : 'Like'}
					>
						<Heart
							className={`w-5 h-5 transition-all duration-300 ${
								isLiked ? 'fill-current scale-110' : ''
							}`}
						/>
						<span className="text-sm font-medium">
							{(post.likes || 0) + (isLiked ? 1 : 0)}
						</span>
					</motion.button>
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="flex items-center space-x-2 text-[var(--text-muted)] hover:text-[var(--accent-1)] transition-colors"
						aria-label="Comments"
					>
						<MessageCircle className="w-5 h-5" />
						<span className="text-sm font-medium">{post.comments || 0}</span>
					</motion.button>
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="flex items-center space-x-2 text-[var(--text-muted)] hover:text-emerald-400 transition-colors"
						aria-label="Share"
					>
						<Share2 className="w-5 h-5" />
						<span className="text-sm font-medium hidden sm:inline">Share</span>
					</motion.button>
				</div>
			</div>
		</motion.div>
	);
};

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
	const [content, setContent] = useState('');
	const [title, setTitle] = useState('');
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');
	const fileInputRef = useRef();

	const handleFileSelect = (e) => {
		const files = Array.from(e.target.files);
		if (selectedFiles.length + files.length > 5) {
			setError('Maximum 5 files allowed');
			return;
		}
		const mapped = files
			.map((file) => {
				if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
					setError('Only images and videos are allowed');
					return null;
				}
				return {
					id: Math.random().toString(36).substr(2, 9),
					url: URL.createObjectURL(file),
					file,
					type: file.type.startsWith('image/') ? 'image' : 'video',
				};
			})
			.filter(Boolean);
		setSelectedFiles((prev) => [...prev, ...mapped]);
		setError('');
	};

	const removeFile = (id) => {
		setSelectedFiles((prev) => {
			const file = prev.find((f) => f.id === id);
			if (file?.url) URL.revokeObjectURL(file.url);
			return prev.filter((f) => f.id !== id);
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (!content.trim() && selectedFiles.length === 0) {
			setError('Please add content or media');
			return;
		}

		if (!title.trim()) {
			setError('Title is required');
			return;
		}

		if (selectedFiles.length === 0) {
			setError('At least one image or video is required');
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
			toast.success('Post created successfully!');
			setContent('');
			setTitle('');
			setSelectedFiles([]);
			onSubmit();
			onClose();
		} catch (err) {
			setError(err.message || 'Failed to create post. Please try again.');
			toast.error(err.message || 'Failed to create post');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setContent('');
		setTitle('');
		setSelectedFiles.forEach((f) => {
			if (f.url) URL.revokeObjectURL(f.url);
		});
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
			></motion.div>
			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				onClick={(e) => e.stopPropagation()}
				className="relative bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl shadow-[var(--shadow-xl)] max-w-2xl w-full max-h-[90vh] overflow-hidden border border-[var(--glass-border)] flex flex-col"
			>
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--glass-border)] flex-shrink-0">
					<h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
						Create Post
					</h2>
					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleClose}
						className="p-2 rounded-full transition-colors hover:bg-[var(--glass-hover)]"
						aria-label="Close"
					>
						<X className="w-5 h-5 text-[var(--accent-1)]" />
					</motion.button>
				</div>
				<form
					onSubmit={handleSubmit}
					className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
				>
					{error && (
						<div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
							<AlertCircle className="w-4 h-4 flex-shrink-0" />
							<span>{error}</span>
						</div>
					)}
					<div>
						<label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
							Title <span className="text-red-400">*</span>
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter post title"
							className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl focus:ring-2 focus:ring-[var(--accent-1)] focus:border-transparent transition-all duration-300 placeholder:text-[var(--input-placeholder)]"
							maxLength={200}
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
							Content
						</label>
						<textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="What's on your mind?"
							className="w-full h-32 p-4 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl resize-none focus:ring-2 focus:ring-[var(--accent-1)] focus:border-transparent transition-all duration-300 placeholder:text-[var(--input-placeholder)]"
							maxLength={5000}
						/>
					</div>
					{selectedFiles.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="grid grid-cols-2 gap-4"
						>
							{selectedFiles.map((file, index) => (
								<motion.div
									key={file.id}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: index * 0.1 }}
									className="relative group"
								>
									{file.type === 'image' ? (
										<img
											src={file.url}
											alt="Selected"
											className="w-full h-32 object-cover rounded-lg"
										/>
									) : (
										<div className="w-full h-32 bg-[var(--bg-soft)] rounded-lg flex items-center justify-center">
											<VideoIcon className="w-8 h-8 text-[var(--accent-1)]" />
										</div>
									)}
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										type="button"
										onClick={() => removeFile(file.id)}
										className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
										aria-label="Remove file"
									>
										<X className="w-4 h-4" />
									</motion.button>
								</motion.div>
							))}
						</motion.div>
					)}
					<div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)] flex-wrap gap-3">
						<div className="flex items-center space-x-4">
							<input
								ref={fileInputRef}
								type="file"
								multiple
								accept="image/*,video/*"
								onChange={handleFileSelect}
								className="hidden"
							/>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={selectedFiles.length >= 5}
								className="flex items-center space-x-2 px-4 py-2 bg-[var(--button-secondary-bg)] border border-[var(--button-secondary-border)] text-[var(--accent-1)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base hover:bg-[var(--button-secondary-hover)]"
							>
								<Upload className="w-4 h-4 sm:w-5 sm:h-5" />
								<span>Add Media ({selectedFiles.length}/5)</span>
							</motion.button>
						</div>
						<div className="flex items-center space-x-3">
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								type="button"
								onClick={handleClose}
								className="px-4 sm:px-6 py-2 text-[var(--text-secondary)] hover:bg-[var(--glass-hover)] rounded-lg transition-colors text-sm sm:text-base"
							>
								Cancel
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								type="submit"
								disabled={
									isSubmitting || !title.trim() || selectedFiles.length === 0
								}
								className="px-4 sm:px-6 py-2 bg-[var(--button-primary-bg)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm sm:text-base shadow-[var(--shadow-md)]"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Posting...</span>
									</>
								) : (
									<span>Post</span>
								)}
							</motion.button>
						</div>
					</div>
				</form>
			</motion.div>
		</div>
	);
};

const SocialsFeedPage = () => {
	const { isAuthenticated, user } = useAuth();
	const { socials, loading, error, refetch } = useSocials();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const transformedPosts = useMemo(() => {
		if (!socials || !Array.isArray(socials)) return [];
		return socials.map(transformPost);
	}, [socials]);

	const currentUser = useMemo(() => {
		if (!isAuthenticated || !user) {
			return {
				id: 'guest',
				name: 'Guest',
				role: 'guest',
				avatar: '',
			};
		}
		return {
			id: user._id || user.id,
			name: user.fullname || 'User',
			role: user.role || 'member',
			avatar: user.profilePicture?.url || user.avatar || '',
		};
	}, [isAuthenticated, user]);

	useEffect(() => {
		const handleScroll = () => setShowScrollTop(window.scrollY > 200);
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const handleDeletePost = async (id) => {
		if (!window.confirm('Are you sure you want to delete this post?')) return;
		try {
			await deletePost(id);
			toast.success('Post deleted successfully');
			refetch();
		} catch (err) {
			toast.error(err.message || 'Failed to delete post');
		}
	};

	const handleCreatePost = () => {
		refetch();
	};

	const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

	const canCreatePost = isAuthenticated && (user?.role === 'admin' || user?.role === 'member');

	return (
		<div className="relative min-h-screen bg-transparent overflow-x-hidden">
			{/* Header */}
			<div className="sticky top-0 z-40 bg-[var(--nav-bg)] backdrop-blur-lg border-b border-[var(--nav-border)] shadow-[var(--nav-shadow)]">
				<div className="page-container">
					<div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-4 py-4 sm:py-6">
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.6 }}
							className="flex items-center gap-3"
						>
							<div className="bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] p-2 rounded-xl shadow-[var(--shadow-md)]">
								<Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
							</div>
							<div>
								<h1 className="text-2xl sm:text-3xl font-bold brand-text">
									Vibrant Community
								</h1>
								<p className="text-[var(--text-secondary)] mt-1 text-xs sm:text-sm">
									Where technology meets purpose
								</p>
							</div>
						</motion.div>
						{canCreatePost && (
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => setShowCreateModal(true)}
								className="btn btn-primary flex items-center gap-2 text-sm sm:text-base"
							>
								<Plus className="w-4 h-4 sm:w-5 sm:h-5" />
								<span>Create Post</span>
							</motion.button>
						)}
					</div>
				</div>
			</div>

			{/* Content Tips Banner */}
			<div className="page-container mt-6 sm:mt-8">
				<div className="bg-[var(--glass-bg)] backdrop-blur-lg rounded-xl border border-[var(--glass-border)] p-3 sm:p-4 shadow-[var(--shadow-sm)]">
					<div className="flex items-center justify-between flex-wrap gap-3">
						<div className="flex items-center gap-3 flex-1 min-w-0">
							<Lightbulb className="w-5 h-5 text-[var(--accent-1)] flex-shrink-0" />
							<p className="text-[var(--text-secondary)] text-xs sm:text-sm">
								<span className="font-semibold text-[var(--text-primary)]">
									Content Tip:
								</span>{' '}
								Share your tech-for-good journey with #TechForGood
							</p>
						</div>
						<div className="flex gap-2">
							<motion.button
								whileHover={{ scale: 1.05 }}
								className="text-xs px-3 py-1 bg-[var(--glass-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--accent-1)] transition-colors"
							>
								#ImpactCoding
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.05 }}
								className="text-xs px-3 py-1 bg-[var(--glass-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--accent-1)] transition-colors"
							>
								#TechForGood
							</motion.button>
						</div>
					</div>
				</div>
			</div>

			{/* Feed */}
			<div className="page-container py-6 sm:py-10">
				{error && (
					<div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 mb-6">
						<AlertCircle className="w-5 h-5" />
						<span>{error}</span>
					</div>
				)}
				<AnimatePresence>
					{!loading && transformedPosts.length === 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							className="text-center text-[var(--text-secondary)] py-20"
						>
							<Sparkles className="w-16 h-16 mx-auto mb-4 text-[var(--accent-1)] opacity-50" />
							<p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
								No posts found
							</p>
							<p className="text-sm">Be the first to share something amazing!</p>
						</motion.div>
					)}
					{transformedPosts.map((post) => (
						<PostCard
							key={post._id}
							post={post}
							currentUser={currentUser}
							onDelete={handleDeletePost}
						/>
					))}
				</AnimatePresence>
				{loading && (
					<div className="flex justify-center py-10">
						<Loader2 className="w-8 h-8 border-4 border-[var(--accent-1)] border-t-transparent rounded-full animate-spin" />
					</div>
				)}
			</div>

			{/* Scroll to Top Button */}
			<AnimatePresence>
				{showScrollTop && (
					<motion.button
						initial={{ opacity: 0, y: 40 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 40 }}
						onClick={scrollToTop}
						className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 p-3 rounded-full bg-[var(--button-primary-bg)] text-white shadow-[var(--shadow-lg)] hover:scale-110 transition-transform"
						aria-label="Scroll to top"
					>
						<ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
					</motion.button>
				)}
			</AnimatePresence>

			{/* Create Post Modal */}
			<CreatePostModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSubmit={handleCreatePost}
			/>
		</div>
	);
};

export default SocialsFeedPage;
