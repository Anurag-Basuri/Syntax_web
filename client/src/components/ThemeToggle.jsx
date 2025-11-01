import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';

const ThemeToggle = () => {
	const { mode, setMode } = useTheme();
	const [pillStyle, setPillStyle] = useState({});
	const buttonsRef = useRef([]);
	const containerRef = useRef(null);

	// Only two modes: bright (light) and dark
	const options = [
		{ value: 'light', icon: Sun, aria: 'Bright' },
		{ value: 'dark', icon: Moon, aria: 'Dark' },
	];

	// On first load, if the theme is 'system' or unknown, initialize
	// according to the device preference. After this, the user selection
	// (via setMode) will persist/useTheme's storage behavior.
	useEffect(() => {
		if (!mode || mode === 'system' || !['light', 'dark'].includes(mode)) {
			const prefersDark =
				typeof window !== 'undefined' &&
				window.matchMedia &&
				window.matchMedia('(prefers-color-scheme: dark)').matches;
			setMode(prefersDark ? 'dark' : 'light');
		}
		// run when mode or setMode change; setMode is stable in most hooks but included for safety
	}, [mode, setMode]);

	// position the sliding pill over the active button
	useEffect(() => {
		const activeIndex = options.findIndex((opt) => opt.value === mode);
		const activeButton = buttonsRef.current[activeIndex];

		if (activeButton && containerRef.current) {
			const containerRect = containerRef.current.getBoundingClientRect();
			const buttonRect = activeButton.getBoundingClientRect();
			setPillStyle({
				width: `${buttonRect.width}px`,
				transform: `translateX(${buttonRect.left - containerRect.left}px)`,
			});
		}
	}, [mode]);

	return (
		<div
			ref={containerRef}
			className="relative flex items-center gap-1 rounded-xl p-1"
			style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
			aria-label="Theme"
			role="group"
		>
			{/* Sliding Pill */}
			<div
				className="absolute h-[calc(100%-8px)] rounded-lg transition-all duration-300 ease-out"
				style={{
					...pillStyle,
					background: 'rgba(255, 255, 255, 0.1)',
					top: '4px',
					left: '0',
				}}
			/>

			{options.map((option, index) => (
				<button
					key={option.value}
					ref={(el) => (buttonsRef.current[index] = el)}
					type="button"
					aria-pressed={mode === option.value}
					aria-label={option.aria}
					onClick={() => setMode(option.value)}
					className={`relative z-10 rounded-lg inline-flex items-center justify-center transition-colors duration-300 w-9 h-7 text-sm ${
						mode === option.value ? 'text-primary' : 'text-secondary hover:text-primary'
					}`}
				>
					<option.icon className="w-4 h-4" />
				</button>
			))}
		</div>
	);
};

export default ThemeToggle;
