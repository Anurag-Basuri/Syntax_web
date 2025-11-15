import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageLightbox = ({ image, onClose, onPrev, onNext }) => {
	useEffect(() => {
		const handler = (e) => {
			if (e.key === 'Escape') onClose && onClose();
			if (e.key === 'ArrowLeft' && onPrev) onPrev();
			if (e.key === 'ArrowRight' && onNext) onNext();
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [onClose, onPrev, onNext]);

	if (!image) return null;

	const src = image?.url || image?.src || image?.publicUrl;

	return (
		<div
			className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose && onClose();
			}}
			aria-modal="true"
			role="dialog"
			aria-label={image?.caption || 'Image preview'}
		>
			<div className="relative max-w-6xl w-full max-h-[90vh]">
				<button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-md bg-white/8 text-white">
					<X size={18} />
				</button>

				{onPrev && (
					<button onClick={onPrev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-white/6 text-white">
						<ChevronLeft size={20} />
					</button>
				)}
				{onNext && (
					<button onClick={onNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-white/6 text-white">
						<ChevronRight size={20} />
					</button>
				)}

				<div className="w-full h-full rounded-xl overflow-hidden">
					<img src={src} alt={image?.caption || 'Image'} className="w-full h-auto max-h-[85vh] object-contain mx-auto" />
				</div>

				{image?.caption && <div className="mt-3 text-sm text-gray-300 text-center">{image.caption}</div>}
			</div>
		</div>
	);
};

export default ImageLightbox;
