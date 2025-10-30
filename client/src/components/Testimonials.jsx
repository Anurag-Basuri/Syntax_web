import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Quote, Star } from 'lucide-react';

const testimonials = [
	{
		quote: 'Syntax gave me the confidence to lead a project from scratch. The mentorship and collaborative environment are unparalleled.',
		name: 'Alex Johnson',
		role: 'Project Lead, AI Division',
		avatar: 'https://i.pravatar.cc/150?img=1',
	},
	{
		quote: "Joining Syntax was the best decision of my college career. I've learned more from the workshops and hackathons than in any class.",
		name: 'Samantha Lee',
		role: 'Frontend Developer',
		avatar: 'https://i.pravatar.cc/150?img=2',
	},
	{
		quote: 'The community is incredible. Everyone is so willing to help and share their knowledge. It feels like a second family.',
		name: 'Michael Chen',
		role: 'Cloud Engineering Member',
		avatar: 'https://i.pravatar.cc/150?img=3',
	},
	{
		quote: 'From zero to deploying a full-stack app, Syntax provided the roadmap and the support. I highly recommend it to any aspiring developer.',
		name: 'Jessica Rodriguez',
		role: 'Full-Stack Developer',
		avatar: 'https://i.pravatar.cc/150?img=4',
	},
];

const EventEchoes = () => {
	const [activeTab, setActiveTab] = useState('ghostboard');
	const [newMessage, setNewMessage] = useState('');
	const [messages, setMessages] = useState([]);
	const [flippedCards, setFlippedCards] = useState([]);
	const [oneLiners, setOneLiners] = useState(0);
	const [energyLevels, setEnergyLevels] = useState({
		crowdHype: 85,
		djDrops: 92,
		lightshow: 78,
		foodWipeout: 65,
	});
	const [current, setCurrent] = useState(0);
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.2,
	});

	// Sample data
	const eventFacts = [
		{ id: 1, content: 'Over 500 attendees danced through the night', emoji: '💃' },
		{ id: 2, content: 'DJ set lasted 4 hours non-stop', emoji: '🎧' },
		{ id: 3, content: 'Lightshow featured 10,000+ LEDs', emoji: '✨' },
		{ id: 4, content: 'Record crowd jump: 3.5 ft average', emoji: '🚀' },
		{ id: 5, content: '15 gallons of glow paint used', emoji: '🎨' },
		{ id: 6, content: 'Midnight flash mob surprised everyone', emoji: '👯' },
	];

	// Add new message to ghostboard
	const handleSubmit = (e) => {
		e.preventDefault();
		if (newMessage.trim()) {
			setMessages([
				...messages,
				{
					id: Date.now(),
					text: newMessage,
					timestamp: new Date().toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					}),
					visible: true,
				},
			]);
			setNewMessage('');
		}
	};

	// Handle card flip
	const flipCard = (id) => {
		if (!flippedCards.includes(id)) {
			setFlippedCards([...flippedCards, id]);
		}
	};

	// Rotate through one-liners
	useEffect(() => {
		const interval = setInterval(() => {
			setOneLiners((prev) => (prev + 1) % testimonials.length);
		}, 4000);
		return () => clearInterval(interval);
	}, []);

	// Animate energy levels
	useEffect(() => {
		const interval = setInterval(() => {
			setEnergyLevels({
				crowdHype: Math.floor(Math.random() * 20) + 80,
				djDrops: Math.floor(Math.random() * 15) + 85,
				lightshow: Math.floor(Math.random() * 25) + 75,
				foodWipeout: Math.floor(Math.random() * 30) + 60,
			});
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
		}, 5000);
		return () => clearInterval(timer);
	}, []);

	const variants = {
		enter: (direction) => ({
			x: direction > 0 ? 100 : -100,
			opacity: 0,
		}),
		center: {
			zIndex: 1,
			x: 0,
			opacity: 1,
		},
		exit: (direction) => ({
			zIndex: 0,
			x: direction < 0 ? 100 : -100,
			opacity: 0,
		}),
	};

	return (
		<section className="py-24 px-4 relative z-10 overflow-hidden">
			{/* Background elements */}
			<div className="absolute inset-0 -z-10">
				<div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/30 backdrop-blur-2xl"></div>
				<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
				<div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
			</div>

			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-16">
					<motion.h2
						className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent tracking-tight"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						Event Echoes
					</motion.h2>
					<motion.p
						className="text-xl text-purple-200 max-w-2xl mx-auto"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						Relive the moments through the eyes of the crowd
					</motion.p>
				</div>

				{/* Tab navigation */}
				<div className="flex flex-wrap justify-center gap-2 mb-12">
					{[
						{ id: 'ghostboard', label: '🎟️ Ghostboard' },
						{ id: 'arcade', label: '🕹️ Memory Game' },
						{ id: 'one-liners', label: '🌀 One-Liners' },
						{ id: 'energy', label: '🧿 Energy Meter' },
					].map((tab) => (
						<motion.button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${
								activeTab === tab.id
									? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
									: 'bg-white/10 text-purple-200 hover:bg-white/20'
							}`}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							{tab.label}
						</motion.button>
					))}
				</div>

				{/* Tab content */}
				<div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 min-h-[500px]">
					<AnimatePresence mode="wait">
						<motion.div
							key={activeTab}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.4 }}
							className="h-full"
						>
							{/* Ghostboard */}
							{activeTab === 'ghostboard' && (
								<div className="h-full flex flex-col">
									<div className="mb-6">
										<h3 className="text-2xl font-bold text-white mb-2">
											Message Wall
										</h3>
										<p className="text-purple-200">
											Share your experience anonymously
										</p>
									</div>

									<form onSubmit={handleSubmit} className="mb-6 flex gap-3">
										<input
											type="text"
											value={newMessage}
											onChange={(e) => setNewMessage(e.target.value)}
											placeholder="Leave your echo..."
											className="flex-1 bg-indigo-900/30 backdrop-blur-sm border border-white/10 rounded-xl py-3 px-4 text-white placeholder-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
											maxLength={100}
										/>
										<motion.button
											type="submit"
											className="px-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium"
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
										>
											Post
										</motion.button>
									</form>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow overflow-auto max-h-[350px] pr-2">
										{messages.length > 0 ? (
											messages.map((message) => (
												<motion.div
													key={message.id}
													initial={{ opacity: 0, scale: 0.8 }}
													animate={{ opacity: 1, scale: 1 }}
													className="bg-indigo-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
												>
													<p className="text-white mb-2">
														{message.text}
													</p>
													<div className="text-right text-purple-300 text-sm opacity-80">
														{message.timestamp}
													</div>
												</motion.div>
											))
										) : (
											<div className="col-span-full flex flex-col items-center justify-center h-full text-center py-12 text-purple-300">
												<div className="text-5xl mb-4">👻</div>
												<p>Be the first to leave a message!</p>
												<p className="mt-2 text-sm opacity-80">
													Your anonymous echo will appear here
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Memory Game */}
							{activeTab === 'arcade' && (
								<div className="h-full">
									<div className="mb-6">
										<h3 className="text-2xl font-bold text-white mb-2">
											Event Memory Game
										</h3>
										<p className="text-purple-200">
											Flip cards to reveal fun facts about the event
										</p>
									</div>

									<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
										{eventFacts.map((fact) => (
											<motion.div
												key={fact.id}
												className="aspect-square cursor-pointer"
												onClick={() => flipCard(fact.id)}
												whileHover={{ y: -5 }}
											>
												<div className="relative w-full h-full perspective">
													<motion.div
														className={`absolute w-full h-full rounded-2xl backface-hidden ${
															flippedCards.includes(fact.id)
																? 'bg-gradient-to-br from-pink-600/30 to-purple-600/30'
																: 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30'
														} border border-white/10 flex items-center justify-center p-4`}
														animate={{
															rotateY: flippedCards.includes(fact.id)
																? 180
																: 0,
														}}
														transition={{
															duration: 0.6,
															ease: 'easeInOut',
														}}
													>
														{!flippedCards.includes(fact.id) ? (
															<div className="text-4xl">❔</div>
														) : (
															<div className="rotate-y-180 text-center">
																<div className="text-3xl mb-2">
																	{fact.emoji}
																</div>
																<p className="text-white text-sm">
																	{fact.content}
																</p>
															</div>
														)}
													</motion.div>
												</div>
											</motion.div>
										))}
									</div>
								</div>
							)}

							{/* One-Liners */}
							{activeTab === 'one-liners' && (
								<div className="h-full flex flex-col items-center justify-center">
									<div className="text-center max-w-2xl">
										<h3 className="text-2xl font-bold text-white mb-2">
											Crowd Reactions
										</h3>
										<p className="text-purple-200 mb-8">
											What attendees said in one sentence
										</p>

										<div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
											<AnimatePresence mode="wait">
												<motion.div
													key={oneLiners}
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: -20 }}
													transition={{ duration: 0.5 }}
													className="text-2xl md:text-3xl font-light text-white leading-relaxed"
												>
													"{testimonials[oneLiners]}"
												</motion.div>
											</AnimatePresence>
										</div>

										<div className="mt-8 flex justify-center gap-2">
											{testimonials.map((_, idx) => (
												<div
													key={idx}
													className={`w-2 h-2 rounded-full ${
														idx === oneLiners
															? 'bg-purple-400'
															: 'bg-white/30'
													}`}
												/>
											))}
										</div>
									</div>
								</div>
							)}

							{/* Energy Meter */}
							{activeTab === 'energy' && (
								<div className="h-full">
									<div className="mb-8 text-center">
										<h3 className="text-2xl font-bold text-white mb-2">
											Event Energy Meter
										</h3>
										<p className="text-purple-200">
											Vibes measured throughout the night
										</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
										<div className="space-y-6">
											{[
												{
													label: 'Crowd Hype',
													value: energyLevels.crowdHype,
													color: 'from-cyan-400 to-blue-500',
												},
												{
													label: 'DJ Drops',
													value: energyLevels.djDrops,
													color: 'from-purple-400 to-fuchsia-500',
												},
												{
													label: 'Lightshow',
													value: energyLevels.lightshow,
													color: 'from-amber-400 to-orange-500',
												},
												{
													label: 'Food Wipeout',
													value: energyLevels.foodWipeout,
													color: 'from-green-400 to-emerald-500',
												},
											].map((metric, index) => (
												<div key={index}>
													<div className="flex justify-between mb-1">
														<span className="text-purple-200">
															{metric.label}
														</span>
														<span className="text-white font-bold">
															{metric.value}%
														</span>
													</div>
													<div className="h-3 bg-white/10 rounded-full overflow-hidden">
														<motion.div
															className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
															initial={{ width: 0 }}
															animate={{ width: `${metric.value}%` }}
															transition={{
																duration: 1,
																ease: 'easeOut',
															}}
														/>
													</div>
												</div>
											))}
										</div>

										<div className="flex items-center justify-center">
											<div className="relative">
												<div className="w-48 h-48 rounded-full border-4 border-purple-500/30 flex items-center justify-center">
													<motion.div
														className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20"
														animate={{
															scale: [1, 1.1, 1],
															opacity: [0.3, 0.5, 0.3],
														}}
														transition={{
															duration: 3,
															repeat: Infinity,
														}}
													/>
													<div className="text-center z-10">
														<div className="text-5xl mb-2">⚡</div>
														<div className="text-white text-xl font-bold">
															{energyLevels.crowdHype > 85
																? 'EPIC VIBES'
																: energyLevels.crowdHype > 70
																	? 'HIGH ENERGY'
																	: 'GOOD FLOW'}
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>

			{/* Floating elements */}
			<motion.div
				className="absolute top-1/3 left-10 w-24 h-24 rounded-full bg-gradient-to-r from-purple-600/10 to-pink-600/10 blur-xl -z-1"
				animate={{
					y: [0, -30, 0],
					x: [0, 20, 0],
				}}
				transition={{
					duration: 8,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
			/>
		</section>
	);
};

export default EventEchoes;
