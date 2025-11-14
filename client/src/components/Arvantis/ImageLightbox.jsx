import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const ImageLightbox = ({ image, onClose }) => {
	if (!image) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.8, y: 20 }}
				animate={{ scale: 1, y: 0 }}
				exit={{ scale: 0.8, y: 20 }}
				className="relative"
				onClick={(e) => e.stopPropagation()}
			>
				<img
					src={image.url}
					alt={image.caption || 'Gallery Image'}
					className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
				/>
				<button
					onClick={onClose}
					className="absolute -top-3 -right-3 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
					aria-label="Close image view"
				>
					<X size={20} />
				</button>
			</motion.div>
		</motion.div>
	);
};

export default ImageLightbox;
