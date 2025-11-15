import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

const GalleryGrid = ({ gallery = [], onImageClick }) => {
	if (!gallery?.length) return null;
	return (
		<section aria-labelledby="arvantis-gallery">
			<h3 id="arvantis-gallery" className="text-2xl font-bold mb-6 text-white">Gallery</h3>

			{/* Masonry-like responsive grid */}
			<div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
				{gallery.map((m, idx) => (
					<motion.button
						key={m?.publicId || idx}
						type="button"
						onClick={() => onImageClick(m)}
						className="group relative w-full break-inside-avoid rounded-xl overflow-hidden border border-white/6"
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.04 * idx, duration: 0.35 }}
						aria-label={m?.caption || `Gallery image ${idx + 1}`}
					>
						<img
							src={m?.url}
							alt={m?.caption || `Gallery ${idx + 1}`}
							loading="lazy"
							className="w-full h-auto object-cover transition-transform duration-400 transform group-hover:scale-105"
						/>
						<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<Eye className="text-white" size={34} aria-hidden />
						</div>
					</motion.button>
				))}
			</div>
		</section>
	);
};

GalleryGrid.propTypes = {
	gallery: PropTypes.array,
	onImageClick: PropTypes.func,
};

export default React.memo(GalleryGrid);
