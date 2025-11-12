import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLeaders } from '../hooks/useMembers';

const CARD_THEME = {
	bg: 'from-cyan-500/20 via-blue-500/20 to-sky-500/20',
	glow: '0, 200, 255, 0.18', // softer glow for subtle shadow
};

// tiny SVG placeholder (data URL) used when profile image fails to load
const PLACEHOLDER =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="%233b4252"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="64" fill="%23ffffff">?</text></svg>';

const TeamPreview = () => {
	const { data: rawLeaders, isLoading, isError, refetch } = useLeaders();
	const navigate = useNavigate();

	// Normalize possible shapes returned by hook/service
	const leaders = React.useMemo(() => {
		if (!rawLeaders) return [];
		if (Array.isArray(rawLeaders)) return rawLeaders;
		if (Array.isArray(rawLeaders.members)) return rawLeaders.members;
		if (rawLeaders.data && Array.isArray(rawLeaders.data.members))
			return rawLeaders.data.members;
		return [];
	}, [rawLeaders]);

	// Clicking any card always goes to the team list page
	const goToTeamPage = () => navigate('/team');

	// Glass card base style (uses backdrop blur for 'frosted glass' effect)
	const glassStyle = {
		background:
			'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
		backdropFilter: 'blur(10px) saturate(1.05)',
		WebkitBackdropFilter: 'blur(10px) saturate(1.05)',
		border: '1px solid rgba(255,255,255,0.06)',
		boxShadow: `0 12px 40px rgba(${CARD_THEME.glow})`,
	};

	// text clamp styles for long names/roles
	const nameClampStyle = {
		display: '-webkit-box',
		WebkitLineClamp: 2,
		WebkitBoxOrient: 'vertical',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		lineHeight: '1.15rem',
		maxHeight: '2.3rem',
	};
	const roleClampStyle = {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	};

	// Error UI (non-blocking): show retry + view full team CTA
	if (!isLoading && isError) {
		return (
			<section
				className="section-container py-normal bg-transparent"
				aria-labelledby="team-heading"
			>
				<div className="max-w-4xl mx-auto text-center">
					<h2 id="team-heading" className="text-2xl font-semibold mb-3">
						Meet Our Core Team
					</h2>
					<p className="mb-6 text-muted">
						Something went wrong loading the team. This might be a temporary network
						issue.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<button
							onClick={() => refetch()}
							className="btn-outline px-4 py-2 rounded"
							aria-label="Retry"
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
					<p className="mt-4 text-sm text-muted">
						If the problem persists, contact support or try again later.
					</p>
				</div>
			</section>
		);
	}

	// Empty-state UI when the request succeeded but there are no leaders
	if (!isLoading && !isError && leaders.length === 0) {
		return (
			<section
				className="section-container py-normal bg-transparent"
				aria-labelledby="team-heading"
			>
				<div className="max-w-4xl mx-auto text-center">
					<h2 id="team-heading" className="text-2xl font-semibold mb-3">
						Meet Our Core Team
					</h2>
					<div className="mx-auto mb-6 w-full max-w-md">
						<div className="rounded-lg bg-white/3 p-6 flex items-center justify-center">
							<svg
								width="160"
								height="100"
								viewBox="0 0 160 100"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden
							>
								<rect width="160" height="100" rx="8" fill="#0b1220" />
								<g opacity="0.9" fill="#9fb4ff">
									<circle cx="40" cy="48" r="14" />
									<circle cx="80" cy="36" r="10" />
									<circle cx="120" cy="50" r="12" />
								</g>
							</svg>
						</div>
					</div>
					<p className="text-muted mb-6">
						No leaders published yet — we are growing the team. Check back soon.
					</p>
					<div className="flex items-center justify-center gap-3">
						<button
							onClick={() => navigate('/team')}
							className="btn-primary px-5 py-2 rounded text-white"
						>
							Explore Team Page
						</button>
						<button onClick={() => refetch()} className="btn-outline px-5 py-2 rounded">
							Refresh
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
					<div className="text-center mb-10">
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

					{/* Grid: responsive columns and spacing */}
					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.08 }}
						className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
						role="list"
					>
						{isLoading
							? Array.from({ length: 4 }).map((_, i) => (
									<div
										key={i}
										className="p-3 sm:p-4 rounded-lg animate-pulse"
										role="listitem"
										aria-busy="true"
									>
										<div
											className="h-full p-4 rounded-lg"
											style={{ ...glassStyle, minHeight: 170 }}
										>
											<div className="text-center">
												<div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-slate-700/40 border border-white/10" />
												<div className="h-4 w-3/4 mx-auto mb-2 rounded bg-slate-700/40" />
												<div className="h-3 w-1/2 mx-auto rounded bg-slate-700/40" />
											</div>
										</div>
									</div>
							  ))
							: (leaders || []).slice(0, 8).map((member, idx) => {
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
											transition={{ duration: 0.45, delay: idx * 0.04 }}
											role="listitem"
										>
											{/* Entire card clickable — always navigates to /team */}
											<div
												onClick={goToTeamPage}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														goToTeamPage();
													}
												}}
												role="button"
												tabIndex={0}
												className="w-full text-left p-3 sm:p-4 rounded-lg block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer transform transition duration-150 hover:-translate-y-0.5"
											>
												<div
													className="h-full rounded-lg flex flex-col items-center justify-center gap-3"
													style={{ ...glassStyle, minHeight: 170 }}
												>
													{img ? (
														<img
															src={img}
															alt={name}
															className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-1 rounded-full object-cover border-2 border-white/10 shadow-sm"
															loading="lazy"
															onError={(e) => {
																e.currentTarget.onerror = null;
																e.currentTarget.src = PLACEHOLDER;
															}}
														/>
													) : (
														<div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-1 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
															<span className="text-xl sm:text-2xl font-semibold text-primary">
																{(
																	name?.charAt(0) || '?'
																).toUpperCase()}
															</span>
														</div>
													)}

													<div className="text-center px-3 w-full">
														<h3
															className="text-sm sm:text-base font-semibold text-primary mb-1"
															style={nameClampStyle}
														>
															{name}
														</h3>
														<p
															className="text-xs sm:text-sm text-accent"
															style={roleClampStyle}
														>
															{role}
														</p>
													</div>
												</div>
											</div>
										</motion.div>
									);
							  })}
					</motion.div>

					{/* CTA */}
					<div className="text-center mt-8">
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
