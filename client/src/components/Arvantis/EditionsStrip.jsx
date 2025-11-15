import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const EditionsStrip = ({ editions, currentIdentifier, onSelect }) => {
	if (!editions?.length) return null;
	return (
		<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="p-3 rounded-xl border border-white/6 bg-white/3 backdrop-blur-sm overflow-x-auto">
			<div className="flex items-center gap-3">
				<span className="text-sm font-semibold text-gray-200 whitespace-nowrap">Past Editions</span>
				<ChevronRight className="text-gray-400" size={18} />
				<div className="flex items-center gap-2 overflow-x-auto py-1">
					{editions.map((f) => {
						const id = f?.slug || String(f?.year || '');
						const active = id && id === currentIdentifier;
						return (
							<button
								key={id}
								onClick={() => onSelect(id)}
								className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
									active
										? 'bg-cyan-500 text-gray-900 shadow-md'
										: 'bg-white/5 text-gray-200 hover:bg-white/8'
								}`}
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
