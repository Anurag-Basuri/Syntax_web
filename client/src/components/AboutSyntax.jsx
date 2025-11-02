import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Lightbulb, Users, Zap } from 'lucide-react';

const AboutSyntax = () => {
	const culture = [
		{
			icon: Lightbulb,
			title: 'Creativity',
			desc: 'We encourage new ideas and innovative thinking to solve real problems.',
		},
		{
			icon: BrainCircuit,
			title: 'Curiosity',
			desc: 'Learning in public, exploring, and asking better questions.',
		},
		{
			icon: Zap,
			title: 'Leadership',
			desc: 'Take ownership, lead pods, and ship work that matters.',
		},
		{
			icon: Users,
			title: 'Collaboration',
			desc: 'The best work comes from diverse teams building together.',
		},
	];

	return (
		<section className="narrative-section page-container" id="about-syntax">
			{/* Guiding Line and Node */}
			<div className="guiding-line-wrapper">
				<motion.div
					className="line-node"
					initial={{ scale: 0 }}
					whileInView={{ scale: 1 }}
					viewport={{ once: true, amount: 'all' }}
					transition={{ duration: 0.5, delay: 0.3 }}
				/>
				<motion.div
					className="guiding-line"
					initial={{ height: 0 }}
					whileInView={{ height: '100%' }}
					viewport={{ once: false, margin: '0px 0px -150px 0px' }}
					transition={{ duration: 1.5, ease: 'circOut' }}
				/>
			</div>

			{/* Content */}
			<div className="narrative-block">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.5 }}
					transition={{ duration: 0.7 }}
					className="mb-24"
				>
					<h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-primary mb-4">
						What is <span className="brand-text">Syntax?</span>
					</h2>
					<p className="text-lg sm:text-xl text-secondary max-w-4xl leading-relaxed">
						Syntax is a dynamic student organization at Lovely Professional University
						focused on innovation, leadership, and collaborative learning. We bridge
						academics with real-world execution through hands-on projects, real roles,
						and community-driven growth.
					</p>
				</motion.div>

				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.2 }}
					variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
					className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-24"
				>
					{culture.map((item) => (
						<motion.div
							key={item.title}
							variants={{
								hidden: { opacity: 0, y: 20 },
								visible: { opacity: 1, y: 0 },
							}}
							className="culture-card"
						>
							<div className="culture-icon-wrapper">
								<item.icon className="w-6 h-6 text-accent-1" />
							</div>
							<div>
								<h3 className="text-xl font-display font-semibold text-primary mb-2">
									{item.title}
								</h3>
								<p className="text-secondary text-sm leading-relaxed">
									{item.desc}
								</p>
							</div>
						</motion.div>
					))}
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					whileInView={{ opacity: 1, scale: 1 }}
					viewport={{ once: true, amount: 0.5 }}
					transition={{ duration: 0.7 }}
					className="vision-mission-card"
				>
					<div className="text-center">
						<h3 className="text-2xl font-bold text-primary mb-2">Our Vision</h3>
						<p className="text-lg text-secondary max-w-3xl mx-auto">
							To build one of the most impactful student communities in India — where
							students learn by doing, grow through collaboration, and lead with
							confidence.
						</p>
						<div className="vision-mission-divider" />
						<h3 className="text-2xl font-bold text-primary mb-2">Our Mission</h3>
						<p className="text-lg brand-text font-semibold">
							Empower students to turn ideas into action.
						</p>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default AboutSyntax;
