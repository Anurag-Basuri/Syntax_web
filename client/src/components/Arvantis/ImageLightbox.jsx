import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

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

	// prevent background scroll while lightbox open
	useEffect(() => {
		if (!image) return;
		const prevOverflow = document.body.style.overflow;
		const prevPaddingRight = document.body.style.paddingRight || '';
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		document.body.style.overflow = 'hidden';
		if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
		return () => {
			document.body.style.overflow = prevOverflow || '';
			document.body.style.paddingRight = prevPaddingRight;
		};
	}, [image]);

	if (!image) return null;

	const src = image?.url || image?.src || image?.publicUrl;

	const lightbox = (
		<div
			className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lightbox-wrap"
			onClick={(e) => {
				// close only when clicking backdrop (not the panel)
				if (e.target === e.currentTarget) onClose && onClose();
			}}
			aria-modal="true"
			role="dialog"
			aria-label={image?.caption || 'Image preview'}
		>
			<div className="absolute inset-0 lightbox-backdrop bg-black/60 backdrop-blur-sm" />

			<div className="relative max-w-6xl w-full max-h-[90vh] lightbox-panel z-10">
				<button
					onClick={onClose}
					className="absolute top-3 right-3 p-2 rounded-md control-btn bg-white/90 dark:bg-slate-900/80 z-20"
					aria-label="Close"
				>
					<X size={18} />
				</button>

				{onPrev && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onPrev();
						}}
						className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-md control-btn z-20"
						aria-label="Previous"
					>
						<ChevronLeft size={20} />
					</button>
				)}
				{onNext && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onNext();
						}}
						className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md control-btn z-20"
						aria-label="Next"
					>
						<ChevronRight size={20} />
					</button>
				)}

				<div
					className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center"
					style={{ background: 'var(--bg-base)' }}
					onClick={(e) => e.stopPropagation()}
				>
					<img
						src={src}
						alt={image?.caption || 'Image'}
						className="w-full h-auto max-h-[85vh] object-contain mx-auto"
					/>
				</div>

				{image?.caption && (
					<div
						className="mt-3 text-sm text-center"
						style={{ color: 'var(--text-secondary)' }}
					>
						{image.caption}
					</div>
				)}
			</div>
		</div>
	);

	// render at document.body so lightbox is not affected by transformed ancestors
	return createPortal(lightbox, document.body);
};

export default ImageLightbox;
