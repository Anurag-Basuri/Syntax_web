import React from 'react';
import { useTheme } from '../hooks/useTheme.js';
import logo from '../assets/logo.png';

const NavLogo = ({ onClick, elevated }) => {
	const { mode } = useTheme();
	const isLight = mode === 'light';

	// Fixed size - no change on elevation
	const logoHeight = 'clamp(44px, 4vw, 52px)';

	return (
		<button
			onClick={onClick}
			aria-label="Go to home"
			className="relative group inline-flex items-center px-3 py-2 select-none transition-transform duration-300 hover:scale-105"
			style={{ borderRadius: 12 }}
		>
			<div className="relative inline-flex items-center justify-center">
				{/* Ambient halo */}
				<div
					aria-hidden="true"
					className="absolute -inset-3 rounded-[20px] pointer-events-none transition-all duration-500"
					style={{
						background: isLight
							? 'radial-gradient(80% 60% at 50% 50%, rgba(0,0,0,0.08), transparent 70%)'
							: 'radial-gradient(80% 60% at 50% 50%, rgba(0,200,255,0.18), transparent 70%)',
						filter: 'blur(14px)',
						opacity: 0.75,
						transform: 'translateZ(0)',
					}}
				/>

				{/* Main logo - inverted in light mode */}
				<img
					src={logo}
					alt="Logo"
					draggable="false"
					decoding="async"
					className="relative z-10 block w-auto transition-all duration-300"
					style={{
						height: logoHeight,
						filter: isLight
							? 'invert(1) brightness(0.1) drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 4px 12px rgba(0,0,0,0.1))'
							: 'drop-shadow(0 3px 12px rgba(0,200,255,0.32)) drop-shadow(0 8px 28px rgba(0,150,255,0.2))',
					}}
				/>

				{/* Edge glow */}
				<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
					<div
						className="w-full h-full transition-all duration-400"
						style={{
							WebkitMaskImage: `url(${logo})`,
							maskImage: `url(${logo})`,
							WebkitMaskRepeat: 'no-repeat',
							maskRepeat: 'no-repeat',
							WebkitMaskSize: 'contain',
							maskSize: 'contain',
							WebkitMaskPosition: 'center',
							maskPosition: 'center',
							background: isLight
								? 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 30%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0) 100%)'
								: 'linear-gradient(90deg, rgba(0,200,255,0) 0%, rgba(0,200,255,0.35) 30%, rgba(0,150,255,0.35) 70%, rgba(0,200,255,0) 100%)',
							filter: `blur(${isLight ? 6 : 8}px)`,
							opacity: 0.7,
							transform: 'scale(1.08)',
						}}
					/>
				</div>

				{/* Hover sheen */}
				<div
					aria-hidden="true"
					className="absolute inset-y-0 -left-8 w-12 skew-x-12 opacity-0 group-hover:opacity-50 transition-opacity duration-400"
					style={{
						background: isLight
							? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
							: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
						filter: 'blur(8px)',
					}}
				/>
			</div>
		</button>
	);
};

export default NavLogo;
