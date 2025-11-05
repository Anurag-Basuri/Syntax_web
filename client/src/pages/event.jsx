import { useState, useEffect, useMemo } from 'react';
import { useGetAllEvents } from '../hooks/useEvents.js';
import EventCard from '../components/event/EventCard.jsx';
import EventFilter from '../components/event/EventFilter.jsx';
import LoadingSpinner from '../components/event/LoadingSpinner.jsx';
import { AnimatePresence, motion } from 'framer-motion';

// Enhanced floating background matching home page exactly
const EventFloatingBackground = () => (
	<div className="absolute inset-0 overflow-hidden pointer-events-none">
		{/* Primary floating elements */}
		<motion.div
			animate={{
				x: [0, 30, 0],
				y: [0, -20, 0],
				rotate: [0, 180, 360],
			}}
			transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
			className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-full blur-2xl"
		/>
		<motion.div
			animate={{
				x: [0, -25, 0],
				y: [0, 15, 0],
				scale: [1, 1.2, 1],
			}}
			transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
			className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-purple-500/15 to-pink-500/10 rounded-full blur-2xl"
		/>
		<motion.div
			animate={{
				x: [0, 20, 0],
				y: [0, -15, 0],
				scale: [1, 1.1, 1],
			}}
			transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
			className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-tr from-indigo-500/12 to-blue-500/8 rounded-full blur-2xl"
		/>

		{/* Additional subtle elements */}
		<motion.div
			animate={{
				x: [0, -15, 0],
				y: [0, 25, 0],
				opacity: [0.3, 0.6, 0.3],
			}}
			transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
			className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-tl from-cyan-500/10 to-blue-500/5 rounded-full blur-xl"
		/>
	</div>
);

// Enhanced hero section with better theme integration
const EventHero = ({ events, loading }) => {
	const upcomingCount = events?.filter((e) => new Date(e.date) > new Date()).length || 0;
	const ongoingCount = events?.filter((e) => e.status === 'ongoing').length || 0;
	const pastCount =
		events?.filter((e) => new Date(e.date) < new Date() && e.status !== 'ongoing').length || 0;

	return (
		<div className="relative bg-gradient-to-b from-[#0a0e17] to-[#1a1f3a] text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
			<EventFloatingBackground />
			<div className="absolute inset-0 bg-grid-white/[0.03] bg-[length:20px_20px]" />

			{/* Additional theme overlay */}
			<div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-900/5 to-indigo-900/10" />

			<div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
				{/* Enhanced Header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: 'easeOut' }}
					className="text-center mb-8 sm:mb-12"
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className="relative"
					>
						<p className="text-base sm:text-lg lg:text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed px-4">
							Discover, join, and explore our vibrant community events
						</p>
						<motion.div
							className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg blur opacity-30"
							animate={{ opacity: [0.2, 0.4, 0.2] }}
							transition={{ duration: 3, repeat: Infinity }}
						/>
					</motion.div>
				</motion.div>

				{/* Enhanced Stats */}
				{!loading && events && events.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6, duration: 0.8 }}
						className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-2xl mx-auto"
					>
						{/* Upcoming Events */}
						<motion.div
							whileHover={{ scale: 1.05, y: -5 }}
							whileTap={{ scale: 0.95 }}
							className="glass-card-success p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl text-center group cursor-pointer relative overflow-hidden"
						>
							<motion.div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
							<motion.div
								className="relative z-10 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-300 mb-2"
								animate={{ scale: [1, 1.05, 1] }}
								transition={{ duration: 2, repeat: Infinity }}
							>
								{upcomingCount}
							</motion.div>
							<div className="relative z-10 text-xs sm:text-sm text-green-200 font-medium">
								Upcoming
							</div>
							<motion.div className="absolute inset-0 border border-green-400/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
						</motion.div>

						{/* Live Events */}
						<motion.div
							whileHover={{ scale: 1.05, y: -5 }}
							whileTap={{ scale: 0.95 }}
							className="glass-card-error p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl text-center group cursor-pointer relative overflow-hidden"
						>
							{ongoingCount > 0 && (
								<motion.div
									className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/15"
									animate={{ opacity: [0.3, 0.7, 0.3] }}
									transition={{ duration: 2, repeat: Infinity }}
								/>
							)}
							<motion.div
								className="relative z-10 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-red-300 mb-2"
								animate={
									ongoingCount > 0
										? {
												scale: [1, 1.1, 1],
												textShadow: [
													'0 0 0px #ff0000',
													'0 0 10px #ff0000',
													'0 0 0px #ff0000',
												],
										  }
										: {}
								}
								transition={{ duration: 1.5, repeat: Infinity }}
							>
								{ongoingCount}
							</motion.div>
							<div className="relative z-10 text-xs sm:text-sm text-red-200 font-medium">
								Live Now
							</div>
							{ongoingCount > 0 && (
								<motion.div
									className="absolute inset-0 border border-red-400/30 rounded-xl sm:rounded-2xl"
									animate={{ opacity: [0.5, 1, 0.5] }}
									transition={{ duration: 1, repeat: Infinity }}
								/>
							)}
						</motion.div>

						{/* Past Events */}
						<motion.div
							whileHover={{ scale: 1.05, y: -5 }}
							whileTap={{ scale: 0.95 }}
							className="glass-card p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl text-center group cursor-pointer relative overflow-hidden"
						>
							<motion.div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
							<div className="relative z-10 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-purple-300 mb-2">
								{pastCount}
							</div>
							<div className="relative z-10 text-xs sm:text-sm text-purple-200 font-medium">
								Past Events
							</div>
							<motion.div className="absolute inset-0 border border-purple-400/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
						</motion.div>
					</motion.div>
				)}
			</div>
		</div>
	);
};

const getCategorizedEvents = (events) => {
	const now = new Date();
	const categorized = { ongoing: [], upcoming: [], past: [] };

	events.forEach((event) => {
		if (event.status === 'cancelled') return;
		const eventDate = new Date(event.date);

		if (event.status === 'ongoing' || eventDate.toDateString() === now.toDateString()) {
			categorized.ongoing.push(event);
		} else if (eventDate > now) {
			categorized.upcoming.push(event);
		} else {
			categorized.past.push(event);
		}
	});

	return categorized;
};

// Enhanced section with better animations
const EventCategorySection = ({ categoryKey, events, emptyMessage }) => {
	const categoryMeta = {
		ongoing: {
			title: 'Live Events',
			emoji: '🔴',
			gradient: 'from-red-400 to-orange-400',
			description: 'Happening right now',
			accent: 'red',
		},
		upcoming: {
			title: 'Upcoming Events',
			emoji: '🚀',
			gradient: 'from-blue-400 to-cyan-400',
			description: 'Coming soon',
			accent: 'blue',
		},
		past: {
			title: 'Past Events',
			emoji: '🏆',
			gradient: 'from-purple-400 to-pink-400',
			description: 'Event archive',
			accent: 'purple',
		},
	};

	const meta = categoryMeta[categoryKey];

	return (
		<section className="mb-16 sm:mb-20 lg:mb-24">
			<motion.div
				initial={{ opacity: 0, x: -30 }}
				whileInView={{ opacity: 1, x: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.6, ease: 'easeOut' }}
				className="mb-8 sm:mb-12 lg:mb-16"
			>
				{/* Enhanced header */}
				<div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mb-3">
					<motion.span
						whileHover={{ scale: 1.2, rotate: 10 }}
						className="text-2xl sm:text-3xl lg:text-4xl"
					>
						{meta.emoji}
					</motion.span>
					<h2
						className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold ${
							events.length > 0
								? `bg-clip-text text-transparent bg-gradient-to-r ${meta.gradient}`
								: 'text-gray-400'
						}`}
					>
						{meta.title}
					</h2>
					<motion.div
						initial={{ width: 0 }}
						whileInView={{ width: '100%' }}
						viewport={{ once: true }}
						transition={{ duration: 1, delay: 0.3 }}
						className="flex-1 h-px bg-gradient-to-r from-white/30 via-white/10 to-transparent ml-4"
					/>
					<motion.span
						initial={{ opacity: 0, scale: 0 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ delay: 0.4, type: 'spring' }}
						className={`glass-card px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-bold shrink-0 border border-${meta.accent}-400/20`}
					>
						{events.length}
					</motion.span>
				</div>
				<motion.p
					initial={{ opacity: 0, y: 10 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.2 }}
					className="text-gray-400 text-sm sm:text-base ml-8 sm:ml-12 lg:ml-16"
				>
					{meta.description}
				</motion.p>
			</motion.div>

			{events.length === 0 ? (
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="glass-card p-12 sm:p-16 lg:p-20 rounded-3xl text-center group hover-lift transition-all duration-700 border border-white/5"
				>
					<motion.div
						whileHover={{ scale: 1.1, rotate: 5 }}
						className="text-6xl sm:text-8xl lg:text-9xl mb-6 sm:mb-8 opacity-30 group-hover:opacity-50 transition-opacity duration-700"
					>
						{meta.emoji}
					</motion.div>
					<p className="text-lg sm:text-xl lg:text-2xl text-gray-400 group-hover:text-gray-300 transition-colors duration-500">
						{emptyMessage}
					</p>
				</motion.div>
			) : (
				<motion.div
					layout
					className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10"
				>
					<AnimatePresence mode="popLayout">
						{events.map((event, index) => (
							<motion.div
								key={event._id}
								layout
								initial={{ opacity: 0, scale: 0.9, y: 30 }}
								whileInView={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.9, y: -30 }}
								viewport={{ once: true, margin: '-50px' }}
								transition={{
									duration: 0.5,
									delay: index * 0.1,
									type: 'spring',
									damping: 25,
									stiffness: 200,
								}}
							>
								<EventCard event={event} />
							</motion.div>
						))}
					</AnimatePresence>
				</motion.div>
			)}
		</section>
	);
};

const EventPage = () => {
	const { getAllEvents, events, loading, error } = useGetAllEvents();
	const [activeCategory, setActiveCategory] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		getAllEvents();
		// eslint-disable-next-line
	}, []);

	const categorizedEvents = useMemo(() => getCategorizedEvents(events || []), [events]);

	const filteredCategories = useMemo(() => {
		const filterEvents = (eventList) => {
			if (!searchTerm) return eventList;
			return eventList.filter(
				(event) =>
					event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
					event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(event.tags &&
						event.tags.some((tag) =>
							tag.toLowerCase().includes(searchTerm.toLowerCase())
						))
			);
		};

		if (activeCategory === 'all') {
			return {
				ongoing: filterEvents(categorizedEvents.ongoing),
				upcoming: filterEvents(categorizedEvents.upcoming),
				past: filterEvents(categorizedEvents.past),
			};
		}

		return { [activeCategory]: filterEvents(categorizedEvents[activeCategory] || []) };
	}, [categorizedEvents, activeCategory, searchTerm]);

	const isEmpty =
		Object.values(filteredCategories).reduce((acc, arr) => acc + arr.length, 0) === 0;

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
				<motion.div
					initial={{ opacity: 0, y: 30, scale: 0.9 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					className="glass-card-error p-8 sm:p-12 lg:p-16 text-center max-w-md sm:max-w-lg lg:max-w-xl w-full rounded-3xl relative z-10 border border-red-400/20"
				>
					<motion.div
						animate={{
							rotate: [0, 10, -10, 0],
							scale: [1, 1.1, 1],
						}}
						transition={{ duration: 3, repeat: Infinity }}
						className="text-6xl sm:text-8xl lg:text-9xl mb-6"
					>
						⚠️
					</motion.div>
					<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-200 mb-4 sm:mb-6">
						Unable to Load Events
					</h2>
					<p className="text-sm sm:text-base text-red-100 mb-8 sm:mb-10 leading-relaxed">
						{error}
					</p>
					<motion.button
						whileHover={{ scale: 1.05, y: -2 }}
						whileTap={{ scale: 0.95 }}
						onClick={getAllEvents}
						className="px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl sm:rounded-2xl font-medium hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-xl text-sm sm:text-base"
					>
						Try Again
					</motion.button>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-white overflow-x-hidden">
			{/* Content */}
			<div className="relative z-10">
				<EventHero events={events} loading={loading} />

				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
					{/* Enhanced Search and Filter */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="sticky top-4 sm:top-6 lg:top-8 z-30 mb-12 sm:mb-16 lg:mb-20"
					>
						<div className="glass-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10">
							<div className="flex flex-col gap-4 sm:gap-6">
								{/* Enhanced Search Input */}
								<div className="relative group">
									<motion.div
										whileHover={{ scale: 1.02 }}
										className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
									>
										<svg
											className="w-5 h-5 sm:w-6 h-6 text-blue-400 group-hover:text-cyan-400 transition-colors duration-300"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
											/>
										</svg>
									</motion.div>
									<input
										type="text"
										placeholder="Search events by title, description, venue, or tags..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-12 pr-12 py-3 sm:py-4 w-full bg-white/5 border border-white/20 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base hover:bg-white/10 placeholder-gray-400 backdrop-blur-sm"
									/>
									{searchTerm && (
										<motion.button
											initial={{ scale: 0, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											onClick={() => setSearchTerm('')}
											className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-sm"
										>
											✕
										</motion.button>
									)}
								</div>

								{/* Enhanced Category Filter */}
								<EventFilter
									activeFilter={activeCategory}
									setActiveFilter={setActiveCategory}
								/>
							</div>
						</div>
					</motion.div>

					{/* Events or Empty State */}
					{loading ? (
						<div className="flex justify-center py-16 sm:py-20 lg:py-24">
							<LoadingSpinner />
						</div>
					) : isEmpty ? (
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							className="glass-card p-12 sm:p-16 lg:p-24 rounded-3xl text-center max-w-3xl lg:max-w-4xl mx-auto border border-white/10"
						>
							<motion.div
								animate={{
									scale: [1, 1.05, 1],
									rotate: [0, 5, -5, 0],
								}}
								transition={{ duration: 4, repeat: Infinity }}
								className="text-6xl sm:text-8xl lg:text-9xl mb-6 sm:mb-8 lg:mb-10"
							>
								🔍
							</motion.div>
							<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
								{searchTerm ? `No results found` : 'No events found'}
							</h2>
							<p className="text-base sm:text-lg lg:text-xl text-blue-200 mb-8 sm:mb-10 lg:mb-12 leading-relaxed">
								{searchTerm
									? 'Try adjusting your search terms or browse all events'
									: 'New events are being planned. Check back soon for exciting updates!'}
							</p>
							{searchTerm && (
								<motion.button
									whileHover={{ scale: 1.05, y: -2 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => {
										setSearchTerm('');
										setActiveCategory('all');
									}}
									className="px-8 sm:px-10 lg:px-12 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-medium hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-xl text-sm sm:text-base"
								>
									Show All Events
								</motion.button>
							)}
						</motion.div>
					) : (
						<div>
							{Object.entries(filteredCategories).map(
								([category, eventsArr]) =>
									eventsArr.length > 0 && (
										<EventCategorySection
											key={category}
											categoryKey={category}
											events={eventsArr}
											emptyMessage={`No ${
												category === 'ongoing' ? 'live' : category
											} events at the moment`}
										/>
									)
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default EventPage;
