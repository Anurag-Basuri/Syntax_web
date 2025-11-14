import { Sparkles, Calendar, Ticket } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { motion } from 'framer-motion';

const formatDate = (date) => {
	if (!date) return 'TBA';
	const d = new Date(date);
	if (isNaN(d.getTime())) return 'TBA';
	return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
};

const PosterHero = ({ fest }) => {
	const posterUrl =
		fest?.poster?.url || 'https://via.placeholder.com/1200x600/000000/FFFFFF?text=Arvantis';

	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="relative overflow-hidden rounded-2xl min-h-[400px] md:min-h-[450px] flex items-center justify-center text-white bg-gray-900"
		>
			<div
				className="absolute inset-0 bg-cover bg-center"
				style={{ backgroundImage: `url(${posterUrl})` }}
			>
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
			</div>

			<div className="relative z-10 text-center p-6 md:p-8 max-w-4xl mx-auto">
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.2, duration: 0.5 }}
					className="flex items-center justify-center gap-2 mb-4"
				>
					<Sparkles className="text-cyan-300" size={22} />
					<span className="text-sm font-medium tracking-wider text-gray-200 uppercase">
						Syntax Club Presents
					</span>
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.6 }}
					className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-3"
				>
					{fest?.name || 'Arvantis'}
					<span className="text-cyan-400">
						{fest?.year ? ` ’${String(fest.year).slice(-2)}` : ''}
					</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.6 }}
					className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-6"
				>
					{fest?.description ||
						'The annual flagship tech and innovation fest by Syntax Club.'}
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5, duration: 0.6 }}
					className="flex flex-wrap items-center justify-center gap-4 mb-8"
				>
					<StatusPill status={fest?.status} />
					<div className="text-sm text-gray-300 flex items-center gap-2">
						<Calendar size={16} />
						<span>
							{formatDate(fest?.startDate)} — {formatDate(fest?.endDate)}
						</span>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.6, duration: 0.5 }}
				>
					<button className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto">
						<Ticket size={20} />
						<span>Register for Events</span>
					</button>
				</motion.div>
			</div>
		</motion.section>
	);
};

export default PosterHero;
