import React from 'react';
import './tech.css';

const GlassCard = ({ children, className = '', hover = false, gradient = false }) => (
	<div
		className={`glass-card ${className}`}
		data-hover={hover ? '1' : '0'}
		data-gradient={gradient ? '1' : '0'}
	>
		{children}
	</div>
);

export default GlassCard;
