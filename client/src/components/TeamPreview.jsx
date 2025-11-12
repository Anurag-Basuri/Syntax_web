import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLeaders } from '../hooks/useMembers';

const CARD_THEME = {
	bg: 'from-cyan-500/20 via-blue-500/20 to-sky-500/20',
	glow: '0, 200, 255, 0.30',
};

const TeamPreview = () => {
	const { data: leaders = [], isLoading, isError } = useLeaders();
	const navigate = useNavigate();

	// If there's an error or no leaders are found after loading, don't render the component.
	if (!isLoading && (isError || leaders.length === 0)) {
		return null;
	}

	return (
		<section
			className="section-container py-normal bg-transparent relative overflow-hidden"
			aria-labelledby="team-heading"
		>
			<div className="relative z-10 px-4 w-full">
				<div className="max-w-7xl mx-auto">
					{/* Header Section */}
					<div className="text-center mb-16">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="mb-6"
						>
							<span
								id="team-heading"
								className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/15 text-accent text-base font-semibold shadow-lg backdrop-blur-md"
							>
								Meet Our Core Team
							</span>
							<p className="text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mt-4">
								The driving force behind Syntax. A diverse team of leaders, mentors,
								and builders.
							</p>
						</motion.div>
					</div>

					{/* Team Grid */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
						role="list"
					>
						{isLoading
							? // Skeleton Loader
							  Array.from({ length: 3 }).map((_, index) => (
									<div
										key={index}
										className="glass-card p-6 shadow-2xl border border-white/12 animate-pulse"
										style={{ boxShadow: `0 0 24px rgba(${CARD_THEME.glow})` }}
										role="listitem"
										aria-busy="true"
									>
										<div className="text-center">
											<div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-700/50 border border-white/20"></div>
											<div className="h-6 w-3/4 mx-auto mb-2 rounded bg-slate-700/50"></div>
											<div className="h-4 w-1/2 mx-auto rounded bg-slate-700/50"></div>
										</div>
									</div>
							  ))
							: // Actual Team Members
							  leaders.slice(0, 6).map((member, index) => {
									const id = member._id || `member-${index}`;
									const name = member.fullname || 'Team Member';
									const role = member.designation || 'Role';
									const img = member.profilePicture?.url;

									return (
										<motion.div
											key={id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.6, delay: index * 0.06 }}
											role="listitem"
										>
											<button
												type="button"
												onClick={() => navigate(`/team/${id}`)}
												className="w-full text-left glass-card p-6 shadow-2xl hover-lift border border-white/12 focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
												style={{
													boxShadow: `0 0 24px rgba(${CARD_THEME.glow})`,
												}}
												aria-label={`View profile for ${name}`}
											>
												<div className="relative z-10 text-center">
													{img ? (
														<img
															src={img}
															alt={name}
															className="w-20 h-20 mx-auto mb-4 rounded-full object-cover border-2 border-white/20"
															loading="lazy"
														/>
													) : (
														<div className="w-20 h-20 mx-auto mb-4 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
															<span className="text-2xl font-bold text-primary">
																{(
																	name?.charAt(0) || '?'
																).toUpperCase()}
															</span>
														</div>
													)}
													<h3 className="text-xl font-bold text-primary mb-1">
														{name}
													</h3>
													<p className="text-accent font-medium">
														{role}
													</p>
												</div>
											</button>
										</motion.div>
									);
							  })}
					</motion.div>

					{/* CTA Button */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.8 }}
						className="text-center mt-16"
					>
						<motion.button
							onClick={() => navigate('/team')}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="group relative px-8 py-4 btn-primary rounded-full font-semibold text-white text-lg shadow-2xl overflow-hidden"
						>
							<span className="relative z-10">Explore Full Team</span>
						</motion.button>
					</motion.div>
				</div>
			</div>
		</section>
	);
};

export default TeamPreview;
