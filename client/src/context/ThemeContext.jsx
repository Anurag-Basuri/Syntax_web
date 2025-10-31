import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({
	theme: 'dark',
	toggleTheme: () => {},
	setTheme: () => {},
});

const getSystemTheme = () =>
	window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
		? 'light'
		: 'dark';

const getInitialTheme = () => {
	const saved = localStorage.getItem('theme');
	if (saved === 'light' || saved === 'dark') return saved;
	return getSystemTheme();
};

const applyTheme = (t) => {
	document.documentElement.setAttribute('data-theme', t);
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', t === 'light' ? '#f7f9ff' : '#0b1022');
};

export const ThemeProvider = ({ children }) => {
	const [theme, setThemeState] = useState(getInitialTheme);

	const setTheme = useCallback((t) => {
		setThemeState(t);
		localStorage.setItem('theme', t);
		applyTheme(t);
	}, []);

	const toggleTheme = useCallback(() => {
		setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
	}, [setTheme]);

	useEffect(() => {
		applyTheme(theme);
		// If user never set a theme manually, sync with system changes
		const mql = window.matchMedia('(prefers-color-scheme: light)');
		const saved = localStorage.getItem('theme');
		const handler = () => {
			if (!saved) {
				const next = mql.matches ? 'light' : 'dark';
				setThemeState(next);
				applyTheme(next);
			}
		};
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	}, []); // init once

	const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

