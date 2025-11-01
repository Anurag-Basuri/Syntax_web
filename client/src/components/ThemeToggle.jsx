import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';

const ThemeToggle = () => {
	const { mode, setMode } = useTheme();
	const [pillStyle, setPillStyle] = useState({});
	const buttonsRef = useRef([]);
	const containerRef = useRef(null);

	const options = [
		{ value: 'light', icon: Sun },
		{ value: 'dark', icon: Moon },
		{ value: 'system', icon: Laptop },
	];

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
