import React from 'react';
import GlassCard from './GlassCard';

import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, index }) => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ delay: 0.1 * (index || 0), duration: 0.5 }}
		className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
	>
		<div className="flex items-center gap-4">
			<div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
				<Icon size={20} />
			</div>
			<div>
				<div className="text-sm text-gray-400">{label}</div>
				<div className="text-2xl font-bold text-white">{value}</div>
			</div>
		</div>
	</motion.div>
);

export default StatCard;

export default StatCard;
