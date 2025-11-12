import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useLeaders } from '../hooks/useMembers';

const CARD_THEME = {
	bg: 'from-cyan-500/20 via-blue-500/20 to-sky-500/20',
	glow: '0, 200, 255, 0.30',
};

// tiny SVG placeholder (data URL) used when profile image fails to load
const PLACEHOLDER =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="%233b4252"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="64" fill="%23ffffff">?</text></svg>';

const TeamPreview = () => {
	const { data: rawLeaders, isLoading, isError, refetch } = useLeaders();
	const navigate = useNavigate();

	// normalize shape: API may return either an array or { members: [...] }
	const leaders = React.useMemo(() => {
		if (!rawLeaders) return [];
		return Array.isArray(rawLeaders) ? rawLeaders : rawLeaders?.members ?? [];
	}, [rawLeaders]);

	// show a small unobtrusive error UI with retry so page doesn't disappear
	if (!isLoading && isError) {
		return (
			<section
				className="section-container py-normal bg-transparent"
				aria-labelledby="team-heading"
			>
				<div className="max-w-4xl mx-auto text-center">
					<h2 id="team-heading" className="text-2xl font-semibold mb-4">
						Meet Our Core Team
					</h2>
					<p className="mb-6 text-muted">We couldn't load the team right now.</p>
					<div className="flex items-center justify-center gap-3">
						<button
							onClick={() => refetch()}
							className="btn-outline px-4 py-2 rounded"
							aria-label="Retry loading team"
						>
							Retry
						</button>
						<button
							onClick={() => navigate('/team')}
							className="btn-primary px-4 py-2 rounded text-white"
						>
							View Full Team
						</button>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section
			className="section-container py-normal bg-transparent relative overflow-hidden"
			aria-labelledby="team-heading"
		>
			<div className="relative z-10 px-4 w-full">
				<div className="max-w-7xl mx-auto">
					{/* Header */}
					<div className="text-center mb-12">
						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.55 }}
						>
							<span
								id="team-heading"
								className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/15 text-accent text-base font-semibold"
							>
								Meet Our Core Team
							</span>
							<p className="text-secondary text-lg max-w-2xl mx-auto leading-relaxed mt-4">
								The driving force behind Syntax — leaders, mentors and core
								contributors.
							</p>
						</motion.div>
					</div>

					{/* Grid */}
					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.08 }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
						role="list"
					>
						{isLoading
							? // skeletons
							  Array.from({ length: 3 }).map((_, i) => (
									<div
										key={i}
										className="glass-card p-6 shadow border border-white/10 animate-pulse"
										role="listitem"
										aria-busy="true"
									>
										<div className="text-center">
											<div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-700/40 border border-white/10" />
											<div className="h-4 w-3/4 mx-auto mb-2 rounded bg-slate-700/40" />
											<div className="h-3 w-1/2 mx-auto rounded bg-slate-700/40" />
										</div>
									</div>
							  ))
							: // members
							  (leaders || []).slice(0, 6).map((member, idx) => {
									const id =
										member?._id ||
										member?.id ||
										member?.memberID ||
										`member-${idx}`;
									const name = (
										member?.fullname ||
										member?.name ||
										'Team Member'
									).trim();
									const role = Array.isArray(member?.designation)
										? member.designation[0]
										: member?.designation || member?.role || 'Role';
									const img = member?.profilePicture?.url || member?.avatar || '';

									return (
										<motion.div
											key={id}
											initial={{ opacity: 0, y: 12 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.5, delay: idx * 0.05 }}
											role="listitem"
										>
											<Link
												to={`/team/${encodeURIComponent(id)}`}
												className="w-full text-left glass-card p-6 shadow hover:scale-[1.01] transition-transform duration-150 border border-white/10 rounded-lg block focus:outline-none focus:ring-2 focus:ring-accent"
												aria-label={`View profile for ${name}`}
											>
												<div className="relative z-10 text-center">
													{img ? (
														<img
															src={img}
															alt={name}
															className="w-20 h-20 mx-auto mb-4 rounded-full object-cover border-2 border-white/10"
															loading="lazy"
															onError={(e) => {
																e.currentTarget.onerror = null;
																e.currentTarget.src = PLACEHOLDER;
															}}
														/>
													) : (
														<div className="w-20 h-20 mx-auto mb-4 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
															<span className="text-2xl font-semibold text-primary">
																{(
																	name?.charAt(0) || '?'
																).toUpperCase()}
															</span>
														</div>
													)}

													<h3 className="text-lg font-semibold text-primary mb-1 truncate">
														{name}
													</h3>
													<p className="text-accent text-sm truncate">
														{role}
													</p>
												</div>
											</Link>
										</motion.div>
									);
							  })}
					</motion.div>

					{/* CTA */}
					<div className="text-center mt-12">
						<motion.button
							onClick={() => navigate('/team')}
							whileHover={{ scale: 1.03 }}
							whileTap={{ scale: 0.98 }}
							className="inline-flex items-center gap-3 px-6 py-3 btn-primary rounded-full font-semibold text-white shadow"
						>
							Explore Full Team
						</motion.button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default TeamPreview;
