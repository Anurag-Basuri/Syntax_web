import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import './tech.css';

const EditionsStrip = ({ editions, currentIdentifier, onSelect }) => {
	if (!editions?.length) return null;
	return (
		<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="editions-strip p-3 rounded-xl overflow-x-auto">
			<div className="flex items-center gap-3">
				<span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Past Editions</span>
				<ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
				<div className="flex items-center gap-2 overflow-x-auto py-1">
					{editions.map((f) => {
						const id = f?.slug || String(f?.year || '');
						const active = id && id === currentIdentifier;
						return (
							<button
								key={id}
								onClick={() => onSelect(id)}
								className={`edition-pill ${active ? 'active' : ''}`}
								title={`${f?.name || 'Arvantis'} ${f?.year || ''}`}
								aria-pressed={active}
							>
								<span className="mono">{f?.year || 'Year'}</span>
							</button>
						);
					})}
				</div>
			</div>
		</motion.div>
	);
};

export default EditionsStrip;
