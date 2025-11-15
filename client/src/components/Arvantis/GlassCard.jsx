import React from 'react';

const GlassCard = ({ children, className = '', hover = false, gradient = false }) => (
	<div
		className={`${className}`}
		style={{
			background: 'var(--glass-bg)',
			backdropFilter: 'blur(10px)',
			border: '1px solid var(--glass-border)',
			borderRadius: 18,
			boxShadow: 'var(--shadow-md)',
			transition: hover ? 'transform .28s ease, box-shadow .28s ease' : undefined,
		}}
	>
		{children}
	</div>
);

export default GlassCard;
