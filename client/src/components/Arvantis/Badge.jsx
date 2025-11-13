import React from 'react';

const Badge = ({ children, variant = 'default', className = '', size = 'md' }) => {
	const variants = {
		default: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
		upcoming:
			'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/20',
		ongoing:
			'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/20',
		completed:
			'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/20',
		cancelled:
			'bg-red-500/20 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/20',
		postponed:
			'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/20',
		sponsor:
			'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30',
		collaborator:
			'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30',
		premium:
			'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30',
	};

	const sizes = {
		sm: 'px-2 py-1 text-xs',
		md: 'px-3 py-1.5 text-sm',
		lg: 'px-4 py-2 text-base',
	};

	return (
		<span
			className={`inline-flex items-center rounded-full font-semibold backdrop-blur-sm transition-all duration-300 ${variants[variant]} ${sizes[size]} ${className}`}
		>
			{children}
		</span>
	);
};

export default Badge;
