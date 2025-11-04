import React, { useEffect, useMemo, useRef, useState } from 'react';
import logo from '../assets/logo.png';

// Theme hook (unchanged)
const useTheme = () => {
	const [theme, setTheme] = React.useState(
		document.documentElement.getAttribute('data-theme') || 'dark'
	);
	useEffect(() => {
		const observer = new MutationObserver(() => {
			setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme'],
		});
		return () => observer.disconnect();
	}, []);
	return theme;
};

// Breakpoints hook (unchanged)
const useResponsive = () => {
	const [breakpoint, setBreakpoint] = useState('desktop');
	useEffect(() => {
		const update = () => {
			const w = window.innerWidth;
			if (w < 640) setBreakpoint('mobile');
			else if (w < 1024) setBreakpoint('tablet');
			else setBreakpoint('desktop');
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);
	return breakpoint;
};

// Helpers
const readCssVar = (name) =>
	getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';

const toRgb = (input) => {
	// supports #rgb, #rrggbb, rgb(), rgba()
	if (!input) return '0,0,0';
	if (input.startsWith('rgb')) {
		const m = input.match(/rgba?\(([^)]+)\)/i);
		return m
			? m[1]
					.split(',')
					.slice(0, 3)
					.map((v) => parseInt(v.trim(), 10))
					.join(',')
			: '0,0,0';
	}
	let c = input.replace('#', '');
	if (c.length === 3)
		c = c
			.split('')
			.map((x) => x + x)
			.join('');
	const n = parseInt(c, 16);
	const r = (n >> 16) & 255,
		g = (n >> 8) & 255,
		b = n & 255;
	return `${r},${g},${b}`;
};

const Background3D = () => {
	const theme = useTheme();
	const breakpoint = useResponsive();
	const containerRef = useRef(null);

	// Pointer-driven spotlight (subtle)
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const handleMove = (e) => {
			const rect = el.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			const y = ((e.clientY - rect.top) / rect.height) * 100;
			el.style.setProperty('--spot-x', `${x.toFixed(2)}%`);
			el.style.setProperty('--spot-y', `${Math.max(0, y - 20).toFixed(2)}%`);

			// Lightweight parallax for logo
			const relX = x / 100 - 0.5;
			const relY = y / 100 - 0.5;
			const prefReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			const strength = prefReduce ? 0 : breakpoint === 'mobile' ? 6 : 10;
			el.style.setProperty('--logo-ox', `${(relX * strength).toFixed(2)}px`);
			el.style.setProperty('--logo-oy', `${(relY * strength).toFixed(2)}px`);
		};

		window.addEventListener('pointermove', handleMove, { passive: true });
		// initial
		el.style.setProperty('--spot-x', '50%');
		el.style.setProperty('--spot-y', '0%');
		el.style.setProperty('--logo-ox', '0px');
		el.style.setProperty('--logo-oy', '0px');

		return () => window.removeEventListener('pointermove', handleMove);
	}, [breakpoint]);

	// Theme-aware styles (very subtle)
	const styles = useMemo(() => {
		const accent1 = readCssVar('--accent-1');
		const accent2 = readCssVar('--accent-2');
		const bgBase = readCssVar('--bg-base');
		const bgSoft = readCssVar('--bg-soft');

		const a1 = toRgb(accent1);
		const a2 = toRgb(accent2);

		const isLight = theme === 'light';

		return {
			// Base radial wash
			baseGradient: `radial-gradient(ellipse 120% 70% at 50% -15%, ${bgSoft} 0%, ${bgBase} 60%)`,
			// Next.js-like spotlight from the top, reacts to pointer via CSS vars
			spotlight: `radial-gradient(800px 520px at var(--spot-x, 50%) var(--spot-y, 0%), rgba(${a1}, ${
				isLight ? 0.05 : 0.08
			}), transparent 65%)`,
			// Secondary aura for depth
			aura: `radial-gradient(1100px 800px at 105% -10%, rgba(${a2}, ${
				isLight ? 0.03 : 0.045
			}), transparent 70%)`,
			// Grid config
			gridColor: isLight ? 'rgba(15, 23, 42, 0.012)' : 'rgba(203, 213, 225, 0.012)',
			gridSize: breakpoint === 'mobile' ? '32px 32px' : '36px 36px',
			gridMask: 'radial-gradient(ellipse 80% 65% at 50% -10%, black 25%, transparent 85%)',
			gridOpacity: isLight ? 0.2 : 0.24,
			// Vignette to de-emphasize edges
			vignette:
				'radial-gradient(ellipse 120% 85% at 50% 50%, transparent 55%, rgba(0,0,0,0.08) 100%)',
			// Ultra subtle film grain
			noiseOpacity: isLight ? 0.005 : 0.007,

			// Logo presentation (subtle, responsive)
			logoOpacity: isLight ? 0.14 : 0.2,
			logoTop: breakpoint === 'mobile' ? '14vh' : '16vh',
			logoWidth:
				breakpoint === 'mobile' ? 'clamp(160px, 42vw, 360px)' : 'clamp(220px, 28vw, 520px)',
			logoShadow: `drop-shadow(0 6px 28px rgba(${a1}, ${isLight ? 0.08 : 0.1}))`,
		};
	}, [theme, breakpoint]);

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 -z-10 overflow-hidden"
			aria-hidden="true"
			style={{ background: styles.baseGradient }}
		>
			<div
				className="absolute inset-0 transition-opacity duration-700"
				style={{ background: styles.spotlight, opacity: 0.5 }}
			/>
			<div
				className="absolute inset-0 transition-opacity duration-700"
				style={{ background: styles.aura, opacity: 0.35 }}
			/>

			{/* Subtle logo (no background), under grid, with tiny parallax */}
			<img
				src={logo}
				alt=""
				aria-hidden="true"
				draggable="false"
				className="absolute select-none pointer-events-none"
				style={{
					top: styles.logoTop,
					left: '50%',
					width: styles.logoWidth,
					opacity: styles.logoOpacity,
					transform:
						'translate(-50%, -50%) translate(var(--logo-ox, 0px), var(--logo-oy, 0px))',
					filter: styles.logoShadow,
					transition: 'transform 220ms ease-out, opacity 220ms ease',
				}}
			/>

			<div
				className="absolute inset-0 pointer-events-none animate-grid-flow"
				style={{
					backgroundImage: `
                        linear-gradient(to right, ${styles.gridColor} 1px, transparent 1px),
                        linear-gradient(to bottom, ${styles.gridColor} 1px, transparent 1px)
                    `,
					backgroundSize: styles.gridSize,
					maskImage: styles.gridMask,
					WebkitMaskImage: styles.gridMask,
					opacity: styles.gridOpacity,
				}}
			/>

			<div
				className="absolute inset-0 pointer-events-none"
				style={{ background: styles.vignette, opacity: 0.9 }}
			/>
			<div
				className="absolute inset-0 pointer-events-none mix-blend-overlay"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
					opacity: styles.noiseOpacity,
				}}
			/>
			<div
				className="absolute inset-x-0 bottom-0 h-56 pointer-events-none"
				style={{
					background: `linear-gradient(to top, var(--bg-base) 35%, transparent 100%)`,
				}}
			/>
		</div>
	);
};

export default Background3D;
