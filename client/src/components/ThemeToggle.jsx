import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';

const ThemeToggle = ({ size = 'sm' }) => {
	const { mode, setMode } = useTheme();
	const [pillStyle, setPillStyle] = useState({ transform: 'translateX(0)', width: 0 });
	const containerRef = useRef(null);
	const btnRefs = useRef([]);

	// Initialize if mode is 'system' or unknown -> respect device preference once
	useEffect(() => {
		if (mode !== 'light' && mode !== 'dark') {
			const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
			setMode(prefersDark ? 'dark' : 'light');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Position the sliding pill over the active option
	const updatePill = () => {
		const activeIndex = mode === 'dark' ? 1 : 0;
		const activeBtn = btnRefs.current[activeIndex];
		const container = containerRef.current;
		if (!activeBtn || !container) return;
		const c = container.getBoundingClientRect();
		const b = activeBtn.getBoundingClientRect();
		setPillStyle({
			width: b.width,
			transform: `translateX(${b.left - c.left}px)`,
		});
	};

	useEffect(() => {
		updatePill();
		window.addEventListener('resize', updatePill);
		return () => window.removeEventListener('resize', updatePill);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode]);

	const btnClass =
		size === 'sm' ? 'h-8 min-w-[2.25rem] px-2 text-xs' : 'h-9 min-w-[2.5rem] px-2.5 text-sm';

	return (
		<div
			ref={containerRef}
			className="relative flex items-center gap-1 rounded-xl"
			style={{
				background: 'var(--glass-bg)',
				border: '1px solid var(--glass-border)',
				padding: '4px',
			}}
			role="group"
			aria-label="Theme toggle"
		>
			<div
				aria-hidden="true"
				className="absolute top-1 left-1 h-[calc(100%-8px)] rounded-lg transition-all duration-300 ease-out"
				style={{
					...pillStyle,
					background: 'color-mix(in srgb, var(--glass-bg), var(--glass-hover) 60%)',
				}}
			/>
			<button
				ref={(el) => (btnRefs.current[0] = el)}
				type="button"
				className={`relative z-10 inline-flex items-center justify-center rounded-lg ${btnClass} transition-colors ${
					mode === 'light' ? 'text-primary' : 'text-secondary hover:text-primary'
				}`}
				aria-pressed={mode === 'light'}
				aria-label="Bright mode"
				onClick={() => setMode('light')}
			>
				<Sun className="w-4 h-4" />
			</button>
			<button
				ref={(el) => (btnRefs.current[1] = el)}
				type="button"
				className={`relative z-10 inline-flex items-center justify-center rounded-lg ${btnClass} transition-colors ${
					mode === 'dark' ? 'text-primary' : 'text-secondary hover:text-primary'
				}`}
				aria-pressed={mode === 'dark'}
				aria-label="Dark mode"
				onClick={() => setMode('dark')}
			>
				<Moon className="w-4 h-4" />
			</button>
		</div>
	);
};

export default ThemeToggle;
