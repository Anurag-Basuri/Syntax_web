import React, { useMemo } from 'react';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, index = 0 }) => {
	const display = useMemo(() => {
		if (typeof value === 'number') return value.toLocaleString();
		return value ?? '—';
	}, [value]);

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * index, duration: 0.45 }}>
			<GlassCard className="p-4 glass-tech">
				<div className="flex items-center gap-4">
					<div className="p-3 rounded-lg stat-icon" style={{ background: 'rgba(6,182,212,0.06)', color: 'var(--accent-1)' }}>
						<Icon size={20} aria-hidden />
					</div>
					<div>
						<div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</div>
						<div className="text-2xl font-bold mono stat-value" style={{ color: 'var(--text-primary)' }}>{display}</div>
					</div>
				</div>
			</GlassCard>
		</motion.div>
	);
};

export default React.memo(StatCard);
