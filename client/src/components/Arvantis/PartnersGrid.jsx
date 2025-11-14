import { motion } from 'framer-motion';

const PartnersGrid = ({ partners }) => {
	if (!partners?.length) return null;
	return (
		<section>
			<h3 className="text-2xl font-bold mb-4 text-white">Our Partners</h3>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
				{partners.map((p, idx) => (
					<motion.a
						key={`${p?.name || 'partner'}-${idx}`}
						href={p?.website || '#'}
						target={p?.website ? '_blank' : '_self'}
						rel="noopener noreferrer"
						className="group p-4 h-24 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
						title={p?.name}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.05 * idx, duration: 0.5 }}
					>
						{p?.logo?.url ? (
							<img
								src={p.logo.url}
								alt={p.name || 'Partner'}
								loading="lazy"
								className="max-h-12 object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
							/>
						) : (
							<span className="text-sm text-gray-300 font-semibold">
								{p?.name || 'Partner'}
							</span>
						)}
					</motion.a>
				))}
			</div>
		</section>
	);
};

export default PartnersGrid;
