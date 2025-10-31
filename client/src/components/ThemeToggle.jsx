import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';

const SegButton = ({ active, onClick, label, children }) => (
	<button
		type="button"
		aria-pressed={active}
		onClick={onClick}
		className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-sm transition-colors ${
			active ? 'bg-white/15 text-primary' : 'text-secondary hover:bg-white/10'
		}`}
	>
		{children}
		<span className="hidden sm:inline">{label}</span>
	</button>
);

const ThemeToggle = () => {
	const { mode, setMode } = useTheme();

	return (
		<div className="fixed right-4 top-4 z-50 glass-card rounded-xl">
			<div className="flex items-center gap-1 p-1">
				<SegButton active={mode === 'light'} onClick={() => setMode('light')} label="Light">
					<Sun className="w-4 h-4" />
				</SegButton>
				<SegButton active={mode === 'dark'} onClick={() => setMode('dark')} label="Dark">
					<Moon className="w-4 h-4" />
				</SegButton>
				<SegButton
					active={mode === 'system'}
					onClick={() => setMode('system')}
					label="Auto"
				>
					<Laptop className="w-4 h-4" />
				</SegButton>
			</div>
		</div>
	);
};

export default ThemeToggle;
