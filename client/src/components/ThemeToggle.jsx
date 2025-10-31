import React, { useEffect, useState, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
	const getPreferred = () => {
		const saved = localStorage.getItem('theme');
		if (saved === 'light' || saved === 'dark') return saved;
		return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
			? 'light'
			: 'dark';
	};

	const [theme, setTheme] = useState(getPreferred());

	const apply = useCallback((t) => {
		document.documentElement.setAttribute('data-theme', t);
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute('content', t === 'light' ? '#f7f9ff' : '#0b1022');
	}, []);

	useEffect(() => {
		apply(theme);
		localStorage.setItem('theme', theme);
	}, [theme, apply]);

	useEffect(() => {
		const mql = window.matchMedia('(prefers-color-scheme: light)');
		const handler = () => {
			const saved = localStorage.getItem('theme');
			if (!saved) setTheme(mql.matches ? 'light' : 'dark');
		};
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	}, []);

	return (
		<button
			type="button"
			aria-label="Toggle theme"
			onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
			className="fixed right-4 top-4 z-50 glass-card p-2 rounded-xl hover-lift"
		>
			{theme === 'light' ? (
				<div className="flex items-center gap-2">
					<Moon className="w-5 h-5 text-secondary" />
					<span className="text-sm text-secondary">Dark</span>
				</div>
			) : (
				<div className="flex items-center gap-2">
					<Sun className="w-5 h-5 text-secondary" />
					<span className="text-sm text-secondary">Light</span>
				</div>
			)}
		</button>
	);
};

export default ThemeToggle;
