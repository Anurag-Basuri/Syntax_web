import React, { useMemo } from 'react';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, index = 0 }) => {
	const display = useMemo(() => {
		if (typeof value === 'number') return value.toLocaleString();
		return value ?? '—';
	}, [value]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.1 * index, duration: 0.5 }}
			className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
			role="region"
			aria-label={label}
		>
			<div className="flex items-center gap-4">
				<div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
					<Icon size={20} aria-hidden />
				</div>
				<div>
					<div className="text-sm text-gray-400">{label}</div>
					<div className="text-2xl font-bold text-white">{display}</div>
				</div>
			</div>
		</motion.div>
	);
};

export default React.memo(StatCard);
