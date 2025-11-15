import { Sparkles, Calendar, Ticket } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { motion } from 'framer-motion';
import './tech.css';

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
			className="arvantis-hero relative overflow-hidden rounded-3xl min-h-[340px] md:min-h-[420px] flex items-center text-white"
			aria-label={`${fest?.name || 'Arvantis'} hero`}
			style={{ background: 'transparent' }}
		>
			{/* Background image */}
			<img
				src={posterUrl}
				alt={fest?.poster?.caption || `${fest?.name || 'Arvantis'} poster`}
				className="absolute inset-0 w-full h-full object-cover hero-poster"
				loading="eager"
			/>

			{/* Tech grid overlay */}
			<svg className="absolute inset-0 hero-grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
				<defs>
					<linearGradient id="g1" x1="0" x2="1">
						<stop offset="0" stopColor="var(--accent-1)" stopOpacity="0.09" />
						<stop offset="1" stopColor="var(--accent-2)" stopOpacity="0.06" />
					</linearGradient>
				</defs>
				<rect x="0" y="0" width="100" height="100" fill="url(#g1)" />
				{/* faint circuit lines */}
				<g stroke="rgba(255,255,255,0.03)" strokeWidth="0.4">
					<path d="M0 20 L100 20" />
					<path d="M0 40 L100 40" />
					<path d="M0 60 L100 60" />
					<path d="M0 80 L100 80" />
				</g>
			</svg>

			{/* Gentle gradient to ensure legibility while keeping transparency */}
			<div className="absolute inset-0 hero-gradient" />

			<div className="relative z-10 max-w-6xl w-full mx-auto px-6 py-10 md:py-14 lg:py-16">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
					{/* Left / Hero text */}
					<div className="col-span-2">
						<motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
							<div className="flex items-center gap-3 mb-4">
								<Sparkles size={20} aria-hidden style={{ color: 'var(--accent-1)' }} />
								<span className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
									Syntax Club Presents
								</span>
								<span className="ml-3 code-chip">{fest?.tagline || 'Tech • Hack • Build'}</span>
							</div>

							<h1
								className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tighter mb-3"
								style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, system-ui' }}
							>
								{fest?.name || 'Arvantis'}
								<span className="ml-2 accent-neon">{fest?.year ? ` ’${String(fest.year).slice(-2)}` : ''}</span>
							</h1>

							<p className="hero-subtitle text-base md:text-lg max-w-3xl leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
								{fest?.description || 'A flagship celebration of technology, creativity and collaboration hosted by Syntax Club.'}
							</p>

							<div className="flex flex-wrap gap-3 items-center">
								<StatusPill status={fest?.status} />
								<div className="flex items-center gap-2 text-sm mono" style={{ color: 'var(--text-secondary)' }}>
									<Calendar size={16} />
									<span>{formatDate(fest?.startDate)} — {formatDate(fest?.endDate)}</span>
								</div>
							</div>

							<div className="mt-6 flex flex-wrap gap-3">
								<a href="#events" className="btn-primary neon-btn">
									Explore Events
								</a>
								{fest?.ticketsUrl && (
									<a href={fest.ticketsUrl} target="_blank" rel="noreferrer" className="btn-ghost">
										<Ticket size={16} /> Buy Tickets
									</a>
								)}
							</div>
						</motion.div>
					</div>

					{/* Right / Visual card */}
					<div className="hidden lg:flex lg:justify-end">
						<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="w-full max-w-sm rounded-2xl p-4 arvantis-card">
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

							<div className="mt-4 mono small-stats">
								<span className="stat-label">Edition</span>
								<span className="stat-value">{fest?.year || '—'}</span>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</motion.section>
	);
};

export default PosterHero;
