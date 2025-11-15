import React from 'react';

const GlassCard = ({ children, className = '', hover = false, gradient = false }) => (
	<div
		className={`bg-white/4 backdrop-blur backdrop-saturate-110 border border-white/6 rounded-2xl ${gradient ? 'bg-gradient-to-br from-white/3 to-white/6' : ''} ${
			hover ? 'hover:scale-[1.02] hover:shadow-2xl transition-all duration-300' : ''
		} ${className}`}
	>
		{children}
	</div>
);

export default GlassCard;
