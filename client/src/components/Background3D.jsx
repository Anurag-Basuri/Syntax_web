import React, { useEffect, useRef, useState } from 'react';
import logo from '../assets/logo.png';

const Background3D = () => {
	const canvasRef = useRef(null);
	const mousePos = useRef({ x: 0.5, y: 0.5 });
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		setPrefersReducedMotion(mediaQuery.matches);
		const handleChange = (e) => setPrefersReducedMotion(e.matches);
		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	useEffect(() => {
		if (prefersReducedMotion) return;
		const handleMouseMove = (e) => {
			mousePos.current = {
				x: e.clientX / window.innerWidth,
				y: e.clientY / window.innerHeight,
			};
		};
		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, [prefersReducedMotion]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		let animationId;
		let time = 0;

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resize();
		window.addEventListener('resize', resize);

		const drawGrid = () => {
			const { width, height } = canvas;
			const gridSize = 50;
			const perspective = 600;
			const horizonY = height * 0.65;

			ctx.clearRect(0, 0, width, height);

			// Parallax
			const offsetX = prefersReducedMotion ? 0 : (mousePos.current.x - 0.5) * 40;
			const offsetY = prefersReducedMotion ? 0 : (mousePos.current.y - 0.5) * 20;
			const waveTime = prefersReducedMotion ? 0 : time * 0.0005;

			// Vertical lines (cyan strong)
			ctx.strokeStyle = 'rgba(0, 200, 255, 0.15)';
			ctx.lineWidth = 1;
			for (let i = -10; i <= 10; i++) {
				const x = width / 2 + i * gridSize + offsetX;
				ctx.beginPath();
				ctx.moveTo(x, horizonY);
				for (let j = 0; j < 20; j++) {
					const y = horizonY + j * gridSize;
					const depth = j / 20;
					const scale = perspective / (perspective + depth * 500);
					const wave = prefersReducedMotion
						? 0
						: Math.sin(waveTime + i * 0.3 + j * 0.2) * 3;
					const projX = width / 2 + (x - width / 2) * scale + wave + offsetX * depth;
					const projY = horizonY + (y - horizonY) * scale + offsetY * depth;
					ctx.lineTo(projX, projY);
				}
				ctx.stroke();
			}

			// Horizontal lines (fade by depth)
			for (let j = 0; j < 20; j++) {
				const depth = j / 20;
				const scale = perspective / (perspective + depth * 500);
				const alpha = 0.15 * (1 - depth * 0.5);
				ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
				ctx.beginPath();
				for (let i = -10; i <= 10; i++) {
					const x = width / 2 + i * gridSize;
					const y = horizonY + j * gridSize;
					const wave = prefersReducedMotion
						? 0
						: Math.sin(waveTime + i * 0.3 + j * 0.2) * 3;
					const projX = width / 2 + (x - width / 2) * scale + wave + offsetX * depth;
					const projY = horizonY + (y - horizonY) * scale + offsetY * depth;
					if (i === -10) ctx.moveTo(projX, projY);
					else ctx.lineTo(projX, projY);
				}
				ctx.stroke();
			}

			// Glowing dots
			if (!prefersReducedMotion) {
				ctx.fillStyle = 'rgba(0, 200, 255, 0.6)';
				for (let i = -10; i <= 10; i += 2) {
					for (let j = 0; j < 20; j += 2) {
						const x = width / 2 + i * gridSize;
						const y = horizonY + j * gridSize;
						const depth = j / 20;
						const scale = perspective / (perspective + depth * 500);
						const wave = Math.sin(waveTime + i * 0.3 + j * 0.2) * 3;
						const projX = width / 2 + (x - width / 2) * scale + wave + offsetX * depth;
						const projY = horizonY + (y - horizonY) * scale + offsetY * depth;
						const pulse = Math.sin(time * 0.003 + i + j) * 0.5 + 0.5;
						ctx.beginPath();
						ctx.arc(projX, projY, 1.5 * pulse, 0, Math.PI * 2);
						ctx.fill();
					}
				}
			}

			if (!prefersReducedMotion) {
				time++;
				animationId = requestAnimationFrame(drawGrid);
			}
		};

		drawGrid();
		if (prefersReducedMotion) drawGrid();

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
		};
	}, [prefersReducedMotion]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
			{/* Cyan/blue base layers */}
			<div className="absolute inset-0 bg-next-base" />
			<div className="absolute inset-0 next-spotlights" />
			<div
				className="absolute inset-0 opacity-40"
				style={{
					background:
						'radial-gradient(ellipse 80% 50% at 50% 40%, var(--spotlight), transparent)',
				}}
			/>

			{/* Grid */}
			<canvas
				ref={canvasRef}
				className="absolute inset-0 w-full h-full"
				style={{ mixBlendMode: 'screen' }}
			/>

			{/* Logo watermark (uses shared logo-mask gradient) */}
			<div className="absolute inset-0 flex items-start justify-center pt-16 sm:pt-20 lg:pt-24">
				<div
					className="relative w-[min(85vw,900px)] aspect-[2.1/1] logo-mask animate"
					style={{
						WebkitMaskImage: `url(${logo})`,
						maskImage: `url(${logo})`,
					}}
				/>
			</div>

			{/* Floating particles */}
			{!prefersReducedMotion && (
				<div className="absolute inset-0">
					{Array.from({ length: 20 }).map((_, i) => (
						<div
							key={i}
							className="absolute w-1 h-1 rounded-full animate-float"
							style={{
								left: `${Math.random() * 100}%`,
								top: `${Math.random() * 100}%`,
								background: 'var(--accent-1)',
								opacity: 0.3,
								animationDelay: `${Math.random() * 5}s`,
								animationDuration: `${10 + Math.random() * 10}s`,
							}}
						/>
					))}
				</div>
			)}

			{/* Bottom fade */}
			<div className="absolute inset-x-0 bottom-0 h-32 bg-bottom-fade" />
		</div>
	);
};

export default Background3D;
