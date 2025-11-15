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
		fest?.poster?.url || 'https://via.placeholder.com/1400x800/071826/FFFFFF?text=Arvantis';

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
			className="relative overflow-hidden rounded-3xl min-h-[340px] md:min-h-[420px] flex items-center text-white"
			aria-label={`${fest?.name || 'Arvantis'} hero`}
			style={{ background: 'transparent' }}
		>
			{/* Background image (visual only) */}
			<img
				src={posterUrl}
				alt={fest?.poster?.caption || `${fest?.name || 'Arvantis'} poster`}
				className="absolute inset-0 w-full h-full object-cover filter saturate-[.9] brightness-[.7]"
				loading="eager"
			/>

			{/* Gentle gradient to ensure legibility while keeping transparency */}
			<div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.24), rgba(0,0,0,0.08))' }} />

			<div className="relative z-10 max-w-6xl w-full mx-auto px-6 py-10 md:py-14 lg:py-16">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
					{/* Left / Hero text */}
					<div className="col-span-2">
						<motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
							<div className="flex items-center gap-3 mb-4">
								<Sparkles size={20} aria-hidden style={{ color: 'var(--accent-1)' }} />
								<span className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>Syntax Club Presents</span>
							</div>

							<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tighter mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, system-ui' }}>
								{fest?.name || 'Arvantis'}
								<span className="ml-2" style={{ color: 'var(--accent-1)' }}>{fest?.year ? ` ’${String(fest.year).slice(-2)}` : ''}</span>
							</h1>

							<p className="text-base md:text-lg text-gray-300 max-w-3xl leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
								{fest?.description || 'A flagship celebration of technology, creativity and collaboration hosted by Syntax Club.'}
							</p>

							<div className="flex flex-wrap gap-3 items-center">
								<StatusPill status={fest?.status} />
								<div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
									<Calendar size={16} />
									<span>{formatDate(fest?.startDate)} — {formatDate(fest?.endDate)}</span>
								</div>
							</div>

							<div className="mt-6 flex flex-wrap gap-3">
								<a href="#events" className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold shadow-lg transform transition" style={{ background: 'var(--button-primary-bg)', color: 'var(--text-primary)' }}>
									Explore Events
								</a>
								{fest?.ticketsUrl && (
									<a href={fest.ticketsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: 'var(--button-secondary-bg)', color: 'var(--text-primary)', border: `1px solid var(--button-secondary-border)` }}>
										<Ticket size={16} /> Buy Tickets
									</a>
								)}
							</div>
						</motion.div>
					</div>

					{/* Right / Visual card */}
					<div className="hidden lg:flex lg:justify-end">
						<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="w-full max-w-sm rounded-2xl p-4" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)' }}>
							<div className="flex items-center gap-3">
								<div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-white">
									<img src={fest?.logo?.url || posterUrl} alt={fest?.name || 'Arvantis'} className="w-full h-full object-cover" />
								</div>
								<div>
									<div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fest?.name}</div>
									<div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{fest?.venue || 'Venue TBA'}</div>
								</div>
							</div>

							{Array.isArray(fest?.highlights) && fest.highlights.length > 0 && (
								<ul className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
