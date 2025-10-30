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
		<section ref={ref} className="py-24 px-4 relative z-10 overflow-hidden">
			{/* Background elements */}
			<div className="absolute inset-0 -z-10">
				<div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/30 backdrop-blur-2xl"></div>
				<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
				<div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
			</div>

			<div className="max-w-4xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={inView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent tracking-tight">
						Member Spotlights
					</h2>
					<p className="text-xl text-purple-200 max-w-2xl mx-auto">
						Hear what our members have to say about their journey with Syntax.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={inView ? { opacity: 1, scale: 1 } : {}}
					transition={{ duration: 0.7, delay: 0.2 }}
					className="relative bg-gradient-to-br from-indigo-900/30 to-purple-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 min-h-[350px] flex flex-col justify-center items-center overflow-hidden"
				>
					<Quote className="absolute top-6 left-6 w-16 h-16 text-purple-600/30" />
					<AnimatePresence initial={false} custom={1}>
						<motion.div
							key={current}
							custom={1}
							variants={variants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{
								x: { type: 'spring', stiffness: 300, damping: 30 },
								opacity: { duration: 0.2 },
							}}
							className="w-full text-center"
						>
							<p className="text-xl md:text-2xl font-light text-white leading-relaxed mb-8 max-w-3xl mx-auto">
								"{testimonials[current].quote}"
							</p>
							<div className="flex items-center justify-center gap-4">
								<img
									src={testimonials[current].avatar}
									alt={testimonials[current].name}
									className="w-14 h-14 rounded-full border-2 border-purple-400/50 object-cover"
								/>
								<div>
									<h4 className="text-lg font-bold text-white">
										{testimonials[current].name}
									</h4>
									<p className="text-purple-300">{testimonials[current].role}</p>
								</div>
							</div>
						</motion.div>
					</AnimatePresence>
					<div className="absolute bottom-6 flex gap-2">
						{testimonials.map((_, i) => (
							<button
								key={i}
								onClick={() => setCurrent(i)}
								className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
									current === i ? 'bg-purple-400 w-6' : 'bg-white/30'
								}`}
								aria-label={`Go to testimonial ${i + 1}`}
							/>
						))}
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default EventEchoes;
