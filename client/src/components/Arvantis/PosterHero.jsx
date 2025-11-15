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
		fest?.poster?.url || 'https://via.placeholder.com/1400x800/0f172a/FFFFFF?text=Arvantis';

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
			className="relative overflow-hidden rounded-3xl min-h-[340px] md:min-h-[420px] flex items-center text-white bg-gray-900"
			aria-label={`${fest?.name || 'Arvantis'} hero`}
		>
			{/* Background image */}
			<img
				src={posterUrl}
				alt={fest?.poster?.caption || `${fest?.name || 'Arvantis'} poster`}
				className="absolute inset-0 w-full h-full object-cover filter saturate-[.9] brightness-[.6] lg:brightness-[.55]"
				loading="eager"
			/>
			{/* Gradient overlays */}
			<div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
			<div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent pointer-events-none hidden lg:block" />

			{/* Content */}
			<div className="relative z-10 max-w-6xl w-full mx-auto px-6 py-10 md:py-14 lg:py-16">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
					{/* Left / Hero text */}
					<div className="col-span-2">
						<motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
							<div className="flex items-center gap-3 mb-4">
								<Sparkles className="text-cyan-300" size={20} aria-hidden />
								<span className="text-sm font-semibold tracking-wide text-gray-200 uppercase">Syntax Club Presents</span>
							</div>

							<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tighter mb-3">
								{fest?.name || 'Arvantis'}
								<span className="ml-2 text-cyan-300">{fest?.year ? ` ’${String(fest.year).slice(-2)}` : ''}</span>
							</h1>

							<p className="text-base md:text-lg text-gray-300 max-w-3xl leading-relaxed mb-6">
								{fest?.description || 'A flagship celebration of technology, creativity and collaboration hosted by Syntax Club.'}
							</p>

							<div className="flex flex-wrap gap-3 items-center">
								<StatusPill status={fest?.status} />
								<div className="flex items-center gap-2 text-sm text-gray-300">
									<Calendar size={16} />
									<span>{formatDate(fest?.startDate)} — {formatDate(fest?.endDate)}</span>
								</div>
							</div>

							<div className="mt-6 flex flex-wrap gap-3">
								<a href="#events" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow-lg transform hover:-translate-y-0.5 transition">Explore Events</a>
								{fest?.ticketsUrl && (
									<a href={fest.ticketsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white/6 hover:bg-white/8 text-sm text-white">
										<Ticket size={16} /> Buy Tickets
									</a>
								)}
							</div>
						</motion.div>
					</div>

					{/* Right / Visual card */}
					<div className="hidden lg:flex lg:justify-end">
						<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="w-full max-w-sm bg-white/6 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-2xl">
							<div className="flex items-center gap-3">
								<div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-white">
									<img src={fest?.logo?.url || posterUrl} alt={fest?.name || 'Arvantis'} className="w-full h-full object-cover" />
								</div>
								<div>
									<div className="text-sm text-gray-200 font-semibold">{fest?.name}</div>
									<div className="text-xs text-gray-300">{fest?.venue || 'Venue TBA'}</div>
								</div>
							</div>

							{Array.isArray(fest?.highlights) && fest.highlights.length > 0 && (
								<ul className="mt-3 text-sm text-gray-300 space-y-1">
									{fest.highlights.slice(0, 4).map((h, i) => (
										<li key={i} className="truncate">• {h}</li>
									))}
								</ul>
							)}
						</motion.div>
					</div>
				</div>
			</div>
		</motion.section>
	);
};

export default PosterHero;
