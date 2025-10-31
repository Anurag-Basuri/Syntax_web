import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
	{
		quote: 'Syntax gave me the confidence to lead a project from scratch. The mentorship and collaboration are unmatched.',
		name: 'Alex Johnson',
		role: 'Project Lead',
		avatar: 'https://i.pravatar.cc/150?img=1',
	},
	{
		quote: "I've learned more shipping with peers than from any course. The feedback loops are fast and kind.",
		name: 'Samantha Lee',
		role: 'Frontend Engineer',
		avatar: 'https://i.pravatar.cc/150?img=2',
	},
	{
		quote: 'Everyone shares knowledge. You always have support when you try something new.',
		name: 'Michael Chen',
		role: 'Cloud Enthusiast',
		avatar: 'https://i.pravatar.cc/150?img=3',
	},
	{
		quote: 'From zero to a full-stack app—this community showed me how to build and iterate.',
		name: 'Jessica Rodriguez',
		role: 'Full‑Stack Developer',
		avatar: 'https://i.pravatar.cc/150?img=4',
	},
];

const Testimonials = () => {
	const [current, setCurrent] = useState(0);
	const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

	useEffect(() => {
		const t = setInterval(
			() => setCurrent((p) => (p === testimonials.length - 1 ? 0 : p + 1)),
			6000
		);
		return () => clearInterval(t);
	}, []);

	const next = () => setCurrent((p) => (p === testimonials.length - 1 ? 0 : p + 1));
	const prev = () => setCurrent((p) => (p === 0 ? testimonials.length - 1 : p - 1));

	return (
		<section ref={ref} className="section-container py-loose relative z-10">
			<div className="max-w-5xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={inView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<div className="glass-card inline-flex items-center gap-2 px-4 py-2 mb-6">
						<Quote className="w-4 h-4 text-brand-1" />
						<span className="text-sm text-secondary font-medium">Testimonials</span>
					</div>
					<h2 className="text-4xl sm:text-5xl font-display font-bold text-primary mb-4">
						Member <span className="brand-text">Stories</span>
					</h2>
					<p className="text-lg text-secondary max-w-2xl mx-auto">
						Hear from members who build, learn, and lead together.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={inView ? { opacity: 1, scale: 1 } : {}}
					transition={{ duration: 0.7, delay: 0.2 }}
					className="glass-card p-8 md:p-12 min-h-[400px] flex flex-col justify-center relative overflow-hidden"
				>
					<Quote className="absolute top-8 left-8 w-16 h-16 text-brand-1/10" />

					<AnimatePresence mode="wait">
						<motion.div
							key={current}
							initial={{ opacity: 0, x: 40 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -40 }}
							transition={{ duration: 0.4 }}
							className="w-full text-center relative z-10"
						>
							<p className="text-xl md:text-2xl text-primary leading-relaxed mb-10 max-w-3xl mx-auto font-light">
								"{testimonials[current].quote}"
							</p>
							<div className="flex items-center justify-center gap-4">
								<img
									src={testimonials[current].avatar}
									alt={testimonials[current].name}
									className="w-16 h-16 rounded-full border-2 border-brand-1/30 object-cover"
								/>
								<div className="text-left">
									<h4 className="text-lg font-semibold text-primary">
										{testimonials[current].name}
									</h4>
									<p className="text-sm text-secondary">
										{testimonials[current].role}
									</p>
								</div>
							</div>
						</motion.div>
					</AnimatePresence>

					{/* Navigation */}
					<div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6">
						<button
							onClick={prev}
							className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-glass-hover transition-colors"
							aria-label="Previous testimonial"
						>
							<ChevronLeft className="w-5 h-5 text-secondary" />
						</button>

						<div className="flex gap-2">
							{testimonials.map((_, i) => (
								<button
									key={i}
									onClick={() => setCurrent(i)}
									className={`rounded-full transition-all duration-300 ${
										current === i
											? 'bg-brand-1 w-8 h-3'
											: 'bg-muted/30 w-3 h-3 hover:bg-muted/50'
									}`}
									aria-label={`Go to testimonial ${i + 1}`}
								/>
							))}
						</div>

						<button
							onClick={next}
							className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-glass-hover transition-colors"
							aria-label="Next testimonial"
						>
							<ChevronRight className="w-5 h-5 text-secondary" />
						</button>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default Testimonials;
