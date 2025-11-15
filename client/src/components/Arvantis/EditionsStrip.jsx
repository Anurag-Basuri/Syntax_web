import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const EditionsStrip = ({ editions, currentIdentifier, onSelect }) => {
	if (!editions?.length) return null;
	return (
		<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="p-3 rounded-xl overflow-x-auto" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>
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
								className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none"
								style={{
									background: active ? 'var(--button-primary-bg)' : 'transparent',
									color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
									boxShadow: active ? 'var(--shadow-md)' : 'none',
									border: active ? 'none' : '1px solid rgba(255,255,255,0.02)',
								}}
								title={`${f?.name || 'Arvantis'} ${f?.year || ''}`}
								aria-pressed={active}
							>
								{f?.year || 'Year'}
							</button>
						);
					})}
				</div>
			</div>
		</motion.div>
	);
};

export default EditionsStrip;
