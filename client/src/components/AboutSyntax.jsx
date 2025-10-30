import React from 'react';
import { motion } from 'framer-motion';
import { Users2, Target, GraduationCap, Lightbulb, Rocket, Quote } from 'lucide-react';

const container = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const AboutSyntax = () => {
	return (
		<section className="py-20 md:py-24 px-4 bg-transparent relative overflow-hidden">
			{/* soft background accents */}
			<div className="absolute inset-0 pointer-events-none -z-10">
				<div className="absolute -top-10 -left-16 w-64 h-64 bg-indigo-600/10 blur-3xl rounded-full" />
				<div className="absolute bottom-0 right-[-40px] w-72 h-72 bg-purple-600/10 blur-3xl rounded-full" />
			</div>

			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.3 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12"
				>
					<span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-200 text-xs sm:text-sm backdrop-blur-md">
						<Users2 className="w-4 h-4" />
						Multidisciplinary • Community • Open to all
					</span>
					<h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-blue-200 to-purple-200 bg-clip-text text-transparent">
						What is Syntax?
					</h2>
					<p className="mt-4 text-indigo-200/90 max-w-3xl mx-auto text-sm sm:text-base">
						We bring together people across disciplines to collaborate, innovate, and
						grow.
					</p>
				</motion.div>

				{/* Pillars */}
				<motion.div
					variants={container}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.25 }}
					className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6"
				>
					<motion.div
						variants={item}
						className="bg-gradient-to-br from-blue-900/25 to-indigo-900/20 border border-white/10 rounded-2xl p-6 md:p-7 backdrop-blur-xl hover:border-white/20 transition-colors"
					>
						<div className="flex items-center gap-3 mb-3">
							<GraduationCap className="w-5 h-5 text-cyan-300" />
							<h3 className="text-xl font-semibold text-white">Learn, Build, Lead</h3>
						</div>
						<p className="text-indigo-100 text-sm sm:text-base">
							Learn by doing, lead with initiative, share what you know.
						</p>
					</motion.div>

					<motion.div
						variants={item}
						className="bg-gradient-to-br from-indigo-900/25 to-purple-900/20 border border-white/10 rounded-2xl p-6 md:p-7 backdrop-blur-xl hover:border-white/20 transition-colors"
					>
						<div className="flex items-center gap-3 mb-3">
							<Lightbulb className="w-5 h-5 text-amber-300" />
							<h3 className="text-xl font-semibold text-white">Ideas → Impact</h3>
						</div>
						<p className="text-indigo-100 text-sm sm:text-base">
							Turn ideas into projects, events, and tools that help others.
						</p>
					</motion.div>

					<motion.div
						variants={item}
						className="bg-gradient-to-br from-purple-900/25 to-pink-900/20 border border-white/10 rounded-2xl p-6 md:p-7 backdrop-blur-xl hover:border-white/20 transition-colors"
					>
						<div className="flex items-center gap-3 mb-3">
							<Rocket className="w-5 h-5 text-pink-300" />
							<h3 className="text-xl font-semibold text-white">Hands-on Exposure</h3>
						</div>
						<p className="text-indigo-100 text-sm sm:text-base">
							Practice in teams, ship often, showcase your work.
						</p>
					</motion.div>
				</motion.div>

				{/* Quote */}
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.3 }}
					transition={{ duration: 0.6 }}
					className="mt-10 md:mt-12 relative"
				>
					<div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 sm:p-6 text-center">
						<Quote className="w-6 h-6 text-purple-300/70 mx-auto mb-2" />
						<p className="text-sm sm:text-base text-indigo-100 italic">
							“Syntax is where creativity meets execution.”
						</p>
					</div>
				</motion.div>

				{/* Why + Purpose */}
				<motion.div
					variants={container}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.25 }}
					className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6"
				>
					<motion.div
						variants={item}
						className="relative bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl overflow-hidden"
					>
						<div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
						<div className="flex items-center gap-3 mb-4">
							<Target className="w-5 h-5 text-cyan-300" />
							<h3 className="text-2xl font-bold text-white">Why We Formed Syntax</h3>
						</div>
						<p className="text-indigo-100/90 text-sm sm:text-base">
							We created a space to experiment, initiate, and express ideas
							freely—supported by a community of doers.
						</p>
					</motion.div>

					<motion.div
						variants={item}
						className="relative bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl overflow-hidden"
					>
						<div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl" />
						<div className="flex items-center gap-3 mb-4">
							<Target className="w-5 h-5 text-purple-300" />
							<h3 className="text-2xl font-bold text-white">Our Purpose</h3>
						</div>
						<ul className="list-disc pl-5 space-y-2 text-indigo-100 text-sm sm:text-base">
							<li>Bridge the gap between theory and real-world implementation.</li>
							<li>Help members find strengths—technical, managerial, or creative.</li>
							<li>Build a supportive network working toward shared goals.</li>
						</ul>
						<p className="mt-4 text-indigo-100/90 text-sm sm:text-base italic">
							“We are not just a group—we are a community of builders.”
						</p>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
};

export default AboutSyntax;
