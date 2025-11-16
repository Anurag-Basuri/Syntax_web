import { useEffect, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { createPortal } from 'react-dom';

// Simple slide-over modal to show full speaker profile
const SpeakerDetailModal = ({ speaker, onClose }) => {
	const closeRef = useRef(null);

	useEffect(() => {
		closeRef.current?.focus();
		const onKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	if (!speaker) return null;

	return createPortal(
		<AnimatePresence>
			<Motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-[100000] flex"
				onClick={onClose}
			>
				{/* backdrop */}
				<Motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />

				{/* slide-over panel */}
				<Motion.aside
					initial={{ x: '100%' }}
					animate={{ x: 0 }}
					exit={{ x: '100%' }}
					transition={{ type: 'spring', stiffness: 300, damping: 30 }}
					className="relative ml-auto w-full max-w-md h-full bg-gradient-to-br from-gray-900/96 to-black p-6 overflow-auto"
					onClick={(e) => e.stopPropagation()}
					aria-labelledby="speaker-title"
				>
					<button ref={closeRef} onClick={onClose} aria-label="Close" className="absolute top-4 right-4 bg-white/6 p-2 rounded-full">
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
					</button>

					<header className="flex items-center gap-4">
						{speaker.photo ? (
							<img src={speaker.photo} alt={speaker.name || 'speaker'} className="w-20 h-20 rounded-full object-cover" />
						) : (
							<div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-white"> {((speaker.name || '').slice(0,1) || '–')} </div>
						)}
						<div>
							<h2 id="speaker-title" className="text-xl font-bold text-white">{speaker.name}</h2>
							{speaker.title && <div className="text-sm text-gray-300">{speaker.title}</div>}
							{speaker.company && <div className="text-sm text-gray-400 mt-1">{speaker.company}</div>}
						</div>
					</header>

					<section className="mt-4 text-sm text-gray-200 leading-relaxed">
						{speaker.bio || speaker.description || 'No bio available.'}
					</section>

					{(speaker.links || speaker.website) && (
						<section className="mt-4">
							<h3 className="text-sm font-semibold mb-2 text-white">Links</h3>
							<div className="flex flex-wrap gap-2">
								{speaker.links?.twitter && <a href={speaker.links.twitter} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded bg-blue-500 text-white">Twitter</a>}
								{speaker.links?.linkedin && <a href={speaker.links.linkedin} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded bg-blue-700 text-white">LinkedIn</a>}
								{speaker.website && <a href={speaker.website} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded bg-gray-800 text-white">Website</a>}
							</div>
						</section>
					)}
				</Motion.aside>
			</Motion.div>
		</AnimatePresence>,
		document.body
	);
};

export default SpeakerDetailModal;
