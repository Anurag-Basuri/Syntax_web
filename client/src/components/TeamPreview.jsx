import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLeaders } from '../hooks/useMembers';

const CARD_THEME = {
	bg: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
	glow: '0, 160, 255, 0.12',
};

const PLACEHOLDER =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="%233b4252"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="64" fill="%23ffffff">?</text></svg>';

const TeamPreview = () => {
	const { data: rawLeaders, isLoading, isError, refetch } = useLeaders();
	const navigate = useNavigate();

	const leaders = React.useMemo(() => {
		if (!rawLeaders) return [];
		if (Array.isArray(rawLeaders)) return rawLeaders;
		if (Array.isArray(rawLeaders.members)) return rawLeaders.members;
		if (rawLeaders.data && Array.isArray(rawLeaders.data.members))
			return rawLeaders.data.members;
		return [];
	}, [rawLeaders]);

	// Always go to team listing on card click
	const goToTeamPage = () => navigate('/team');

	// glass style used inline so it behaves the same across environments
	const glassStyle = {
		background: CARD_THEME.bg,
		backdropFilter: 'blur(8px) saturate(1.04)',
		WebkitBackdropFilter: 'blur(8px) saturate(1.04)',
		border: '1px solid rgba(255,255,255,0.06)',
		boxShadow: `0 8px 28px rgba(${CARD_THEME.glow})`,
	};

	// Two-line clamp that works in modern browsers; keeps card heights consistent
	const nameClamp = {
		display: '-webkit-box',
		WebkitLineClamp: 2,
		WebkitBoxOrient: 'vertical',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		lineHeight: '1.15rem',
		maxHeight: '2.3rem',
	};

	const roleClamp = {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	};

	// Header component: bigger title, subtitle, underline and count pill
	const Header = () => (
		<div className="text-center mb-8">
			<motion.h2
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.45 }}
				className="text-3xl sm:text-4xl font-extrabold text-primary leading-tight"
				id="team-heading"
			>
				Our Core Team
			</motion.h2>

			<p className="text-accent text-sm sm:text-base mt-3 max-w-2xl mx-auto">
				People who build, mentor and guide Syntax — talented, diverse and committed.
			</p>

			<div className="flex items-center justify-center gap-3 mt-4">
				<div className="h-0.5 w-28 bg-gradient-to-r from-cyan-400 via-blue-400 to-sky-400 rounded" />
				{!isLoading && leaders.length > 0 && (
					<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/6 border border-white/8 text-accent">
						{leaders.length} {leaders.length === 1 ? 'leader' : 'leaders'}
					</span>
				)}
			</div>
		</div>
	);

	// friendly error UI
	if (!isLoading && isError) {
		return (
			<section
				className="section-container py-normal bg-transparent"
				aria-labelledby="team-heading"
			>
				<div className="max-w-4xl mx-auto text-center">
					<Header />
					<p className="mb-6 text-muted" role="status">
						We couldn't load the team — network issue or service error.
					</p>
					<div className="flex items-center justify-center gap-3">
						<button onClick={() => refetch()} className="btn-outline px-4 py-2 rounded">
							Retry
						</button>
						<button
							onClick={goToTeamPage}
							className="btn-primary px-4 py-2 rounded text-white"
						>
							View Team
						</button>
					</div>
				</div>
			</section>
		);
	}

	// empty state
	if (!isLoading && leaders.length === 0) {
		return (
			<section
				className="section-container py-normal bg-transparent"
				aria-labelledby="team-heading"
			>
				<div className="max-w-4xl mx-auto text-center">
					<Header />
					<p className="mb-6 text-muted">
						No leaders published yet — we are growing the team. Check back soon.
					</p>
					<button
						onClick={goToTeamPage}
						className="btn-primary px-5 py-2 rounded text-white"
					>
						Explore Team Page
					</button>
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
					<Header />

					{/* Responsive grid — uniform card heights via fixed height classes */}
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
						role="list"
						aria-live="polite"
					>
						{isLoading
							? Array.from({ length: 8 }).map((_, i) => (
									<div
										key={i}
										className="p-2 sm:p-3 rounded-lg animate-pulse"
										role="listitem"
										aria-busy="true"
									>
										<div
											style={{ ...glassStyle }}
											className="h-56 sm:h-60 md:h-64 p-4 rounded-lg flex flex-col items-center justify-between"
										>
											<div className="flex flex-col items-center gap-3">
												<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-700/40 border border-white/8" />
												<div className="h-4 w-28 rounded bg-slate-700/40" />
												<div className="h-3 w-20 rounded bg-slate-700/40" />
											</div>
										</div>
									</div>
							  ))
							: leaders.slice(0, 12).map((member, idx) => {
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
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.45, delay: idx * 0.03 }}
											role="listitem"
										>
											{/* whole card is a semantic button for accessibility */}
											<button
												type="button"
												onClick={goToTeamPage}
												aria-label="Open team page"
												className="w-full rounded-lg block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transform transition duration-150 hover:-translate-y-0.5"
												style={{
													padding: 0,
													background: 'transparent',
													border: 'none',
												}}
											>
												<div
													style={{ ...glassStyle }}
													className="h-56 sm:h-60 md:h-64 p-4 rounded-lg flex flex-col justify-between items-center"
												>
													{/* Avatar */}
													<div className="flex flex-col items-center gap-3">
														{img ? (
															<img
																src={img}
																alt={name}
																loading="lazy"
																onError={(e) => {
																	e.currentTarget.onerror = null;
																	e.currentTarget.src =
																		PLACEHOLDER;
																}}
																className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/10 shadow-sm"
																style={{ objectFit: 'cover' }}
															/>
														) : (
															<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white/10 bg-white/4 flex items-center justify-center">
																<span className="text-lg sm:text-2xl font-semibold text-primary">
																	{(
																		name?.charAt(0) || '?'
																	).toUpperCase()}
																</span>
															</div>
														)}
													</div>

													{/* Name + role anchored at bottom to keep uniform layout */}
													<div className="text-center px-2 w-full">
														<h3
															title={name}
															style={nameClamp}
															className="text-sm sm:text-base font-semibold text-primary mb-1 leading-tight"
														>
															{name}
														</h3>
														<p
															title={role}
															style={roleClamp}
															className="text-xs sm:text-sm text-accent"
														>
															{role}
														</p>
													</div>
												</div>
											</button>
										</motion.div>
									);
							  })}
					</motion.div>

					{/* CTA */}
					<div className="text-center mt-8">
						<motion.button
							onClick={goToTeamPage}
							whileHover={{ scale: 1.02 }}
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
