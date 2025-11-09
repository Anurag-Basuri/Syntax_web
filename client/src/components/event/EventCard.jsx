import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EventDetailModal = ({ event, isOpen, onClose }) => {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [imageLoading, setImageLoading] = useState(true);
	// FIX: Use event.eventDate fallback to event.date
	const eventDate = new Date(event.eventDate || event.date);
	const isUpcoming = eventDate > new Date();
	const isOngoing =
		eventDate.toDateString() === new Date().toDateString() || event.status === 'ongoing';

	const formatDate = (date) => {
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(date);
	};

	const nextImage = () => {
		if (event.posters && event.posters.length > 1) {
			setImageLoading(true);
			setCurrentImageIndex((prev) => (prev + 1) % event.posters.length);
		}
	};

	const prevImage = () => {
		if (event.posters && event.posters.length > 1) {
			setImageLoading(true);
			setCurrentImageIndex(
				(prev) => (prev - 1 + event.posters.length) % event.posters.length
			);
		}
	};

	const goToImage = (index) => {
		setImageLoading(true);
		setCurrentImageIndex(index);
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
				onClick={onClose}
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.9, y: 50 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.9, y: 50 }}
					className="glass-card rounded-2xl sm:rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-y-auto relative"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Close button - always visible */}
					<motion.button
						whileHover={{ scale: 1.1, rotate: 90 }}
						whileTap={{ scale: 0.9 }}
						onClick={onClose}
						className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 bg-red-500/90 hover:bg-red-600 text-white p-2 sm:p-3 rounded-full shadow-xl backdrop-blur-sm transition-all duration-300"
					>
						<svg
							className="w-5 h-5 sm:w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</motion.button>

					{/* Enhanced Image Gallery Section */}
					<div className="relative">
						<div className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden rounded-t-2xl sm:rounded-t-3xl bg-black">
							{event.posters && event.posters.length > 0 ? (
								<>
									{/* Image Loading State */}
									{imageLoading && (
										<div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
											<motion.div
												animate={{ rotate: 360 }}
												transition={{
													duration: 1,
													repeat: Infinity,
													ease: 'linear',
												}}
												className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"
											/>
										</div>
									)}

									{/* Main Image - Full visibility with proper aspect ratio */}
									<motion.img
										key={currentImageIndex}
										src={event.posters[currentImageIndex].url}
										alt={`${event.title} - Image ${currentImageIndex + 1}`}
										className="w-full h-full object-contain bg-black"
										style={{ objectPosition: 'center' }}
										initial={{ opacity: 0, scale: 1.05 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.5 }}
										onLoad={() => setImageLoading(false)}
										onError={() => setImageLoading(false)}
									/>

									{/* Dark overlay for better text visibility */}
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

									{/* Navigation arrows - Enhanced */}
									{event.posters.length > 1 && (
										<>
											<motion.button
												whileHover={{ scale: 1.1, x: -2 }}
												whileTap={{ scale: 0.9 }}
												onClick={prevImage}
												className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-300 shadow-lg z-10"
											>
												<svg
													className="w-5 h-5 sm:w-6 h-6"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M15 19l-7-7 7-7"
													/>
												</svg>
											</motion.button>
											<motion.button
												whileHover={{ scale: 1.1, x: 2 }}
												whileTap={{ scale: 0.9 }}
												onClick={nextImage}
												className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-300 shadow-lg z-10"
											>
												<svg
													className="w-5 h-5 sm:w-6 h-6"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M9 5l7 7-7 7"
													/>
												</svg>
											</motion.button>
										</>
									)}

									{/* Enhanced Image indicators */}
									{event.posters.length > 1 && (
										<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
											{event.posters.map((_, index) => (
												<motion.button
													key={index}
													whileHover={{ scale: 1.3 }}
													whileTap={{ scale: 0.9 }}
													onClick={() => goToImage(index)}
													className={`w-2.5 h-2.5 sm:w-3 h-3 rounded-full transition-all duration-300 shadow-lg ${
														index === currentImageIndex
															? 'bg-white ring-2 ring-blue-500'
															: 'bg-white/60 hover:bg-white/80'
													}`}
												/>
											))}
										</div>
									)}

									{/* Image counter */}
									{event.posters.length > 1 && (
										<div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm z-10">
											{currentImageIndex + 1} / {event.posters.length}
										</div>
									)}
								</>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-800/60 to-purple-800/60">
									<motion.div
										animate={{ rotate: [0, 360] }}
										transition={{
											duration: 10,
											repeat: Infinity,
											ease: 'linear',
										}}
										className="text-6xl sm:text-8xl opacity-30"
									>
										🎭
									</motion.div>
								</div>
							)}

							{/* Status badge */}
							{(isOngoing || isUpcoming) && (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									className={`absolute top-4 right-16 sm:right-20 px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg backdrop-blur-sm z-10 ${
										isOngoing
											? 'bg-red-500/90 text-white'
											: 'bg-blue-500/90 text-white'
									}`}
								>
									{isOngoing ? '🔴 LIVE NOW' : '🚀 UPCOMING'}
								</motion.div>
							)}
						</div>
					</div>

					{/* Enhanced Content Section */}
					<div className="p-4 sm:p-6 lg:p-8 space-y-6">
						{/* Title and basic info */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
						>
							<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">
								{event.title}
							</h2>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
								<motion.div
									whileHover={{ x: 5 }}
									className="flex items-center gap-3 text-blue-300 p-3 rounded-xl glass-card"
								>
									<div className="p-2 rounded-full bg-blue-500/20 shrink-0">
										<svg
											className="w-4 h-4 sm:w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
									<div>
										<div className="text-xs text-blue-200 opacity-80">
											Date & Time
										</div>
										<div className="font-medium">{formatDate(eventDate)}</div>
									</div>
								</motion.div>

								<motion.div
									whileHover={{ x: 5 }}
									className="flex items-center gap-3 text-cyan-300 p-3 rounded-xl glass-card"
								>
									<div className="p-2 rounded-full bg-cyan-500/20 shrink-0">
										<svg
											className="w-4 h-4 sm:w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											/>
										</svg>
									</div>
									<div>
										<div className="text-xs text-cyan-200 opacity-80">
											Venue
										</div>
										<div className="font-medium">{event.venue}</div>
									</div>
								</motion.div>
							</div>
						</motion.div>

						{/* Description */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
						>
							<h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
								<span>📝</span> About This Event
							</h3>
							<div className="glass-card p-4 rounded-xl">
								<p className="text-gray-300 leading-relaxed text-sm sm:text-base">
									{event.description}
								</p>
							</div>
						</motion.div>

						{/* Tags */}
						{event.tags && event.tags.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
							>
								<h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
									<span>🏷️</span> Tags
								</h3>
								<div className="flex flex-wrap gap-2">
									{event.tags.map((tag, index) => (
										<motion.span
											key={tag}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											whileHover={{ scale: 1.05, y: -2 }}
											transition={{ delay: index * 0.05 }}
											className="px-3 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-full text-sm font-medium backdrop-blur-sm border border-blue-400/30 hover:border-blue-300/50 transition-all duration-300"
										>
											{tag}
										</motion.span>
									))}
								</div>
							</motion.div>
						)}

						{/* Action buttons */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5 }}
							className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-white/10"
						>
							{isUpcoming && (
								<motion.button
									whileHover={{ scale: 1.02, y: -2 }}
									whileTap={{ scale: 0.98 }}
									className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-medium hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg text-white relative overflow-hidden group"
								>
									<span className="relative z-10">🎫 Register Now</span>
									<motion.div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								</motion.button>
							)}

							<motion.button
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
								className="flex-1 py-3 px-6 glass-card rounded-xl font-medium hover-lift transition-all duration-300 text-white border border-white/10 hover:border-white/20"
							>
								📤 Share Event
							</motion.button>

							{!isUpcoming && !isOngoing && (
								<motion.button
									whileHover={{ scale: 1.02, y: -2 }}
									whileTap={{ scale: 0.98 }}
									className="flex-1 py-3 px-6 glass-card rounded-xl font-medium hover-lift transition-all duration-300 text-white border border-purple-400/30 hover:border-purple-300/50"
								>
									📸 View Gallery
								</motion.button>
							)}
						</motion.div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

const EventCard = ({ event }) => {
	const [imageError, setImageError] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const eventDate = new Date(event.eventDate || event.date);
	const now = new Date();
	const isUpcoming = eventDate > now;
	const isOngoing = eventDate.toDateString() === now.toDateString() || event.status === 'ongoing';

	const formatDate = (date) => {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(date);
	};

	if (!event) return null;

	return (
		<>
			<motion.div
				className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover-lift transition-all duration-500 group relative cursor-pointer border border-white/5 hover:border-white/10"
				whileHover={{ y: -8, rotateY: 2 }}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				onClick={() => setShowModal(true)}
				layout
			>
				{/* Enhanced Image Section */}
				<div className="relative h-48 sm:h-56 overflow-hidden">
					{event.posters && event.posters.length > 0 && !imageError ? (
						<motion.img
							src={event.posters[0].url}
							alt={event.title}
							onError={() => setImageError(true)}
							className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-800/60 to-purple-800/60 relative">
							<motion.div
								animate={{ rotate: [0, 360] }}
								transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
								className="text-4xl sm:text-6xl opacity-20"
							>
								🎭
							</motion.div>
							<div className="absolute inset-0 animate-shimmer" />
						</div>
					)}

					{/* Enhanced overlay gradient */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

					{/* Status badge */}
					{(isOngoing || isUpcoming) && (
						<motion.div
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							className={`absolute top-3 right-3 px-2.5 py-1 rounded-full font-bold text-xs shadow-lg backdrop-blur-sm border ${
								isOngoing
									? 'bg-red-500/90 text-white border-red-400/50'
									: 'bg-blue-500/90 text-white border-blue-400/50'
							}`}
						>
							{isOngoing ? '🔴 LIVE' : '🚀 UPCOMING'}
						</motion.div>
					)}

					{/* Multiple images indicator */}
					{event.posters && event.posters.length > 1 && (
						<motion.div
							whileHover={{ scale: 1.05 }}
							className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-white/20"
						>
							📷 {event.posters.length}
						</motion.div>
					)}

					{/* Enhanced date overlay */}
					<motion.div
						className="absolute bottom-3 left-3 text-white"
						whileHover={{ scale: 1.05 }}
					>
						<div className="text-2xl font-black drop-shadow-lg">
							{eventDate.getDate()}
						</div>
						<div className="text-xs opacity-90 font-medium drop-shadow">
							{eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()}
						</div>
					</motion.div>

					{/* Click to view overlay */}
					<motion.div
						className="absolute inset-0 bg-gradient-to-t from-blue-600/30 to-transparent opacity-0 flex items-center justify-center"
						animate={{ opacity: isHovered ? 1 : 0 }}
						transition={{ duration: 0.3 }}
					>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: isHovered ? 1 : 0 }}
							transition={{ duration: 0.2 }}
							className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium border border-white/20"
						>
							👁️ View Details
						</motion.div>
					</motion.div>
				</div>

				{/* Enhanced Content Section */}
				<div className="p-4 space-y-3">
					<motion.h3
						className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 line-clamp-2"
						whileHover={{ x: 2 }}
					>
						{event.title}
					</motion.h3>

					<div className="space-y-2">
						<motion.div
							whileHover={{ x: 2 }}
							className="flex items-center gap-2 text-blue-300 text-sm"
						>
							<svg
								className="w-4 h-4 shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span className="font-medium">{formatDate(eventDate)}</span>
						</motion.div>

						<motion.div
							whileHover={{ x: 2 }}
							className="flex items-center gap-2 text-cyan-300 text-sm"
						>
							<svg
								className="w-4 h-4 shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
							</svg>
							<span className="font-medium truncate">{event.venue}</span>
						</motion.div>
					</div>

					<p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
						{event.description}
					</p>

					{/* Enhanced Tags */}
					{event.tags && event.tags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{event.tags.slice(0, 2).map((tag, index) => (
								<motion.span
									key={tag}
									whileHover={{ scale: 1.05 }}
									className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-400/20"
								>
									{tag}
								</motion.span>
							))}
							{event.tags.length > 2 && (
								<span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs border border-gray-400/20">
									+{event.tags.length - 2}
								</span>
							)}
						</div>
					)}
				</div>

				{/* Enhanced border glow effect */}
				<motion.div
					className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 pointer-events-none"
					style={{
						background:
							'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)',
						filter: 'blur(2px)',
					}}
					animate={{ opacity: isHovered ? 1 : 0 }}
					transition={{ duration: 0.3 }}
				/>
			</motion.div>

			{/* Event Detail Modal */}
			<EventDetailModal
				event={event}
				isOpen={showModal}
				onClose={() => setShowModal(false)}
			/>
		</>
	);
};

export default EventCard;
