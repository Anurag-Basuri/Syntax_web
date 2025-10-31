import React, { useEffect, useRef, useState } from 'react';
import Logo from '../assets/logo.png';

const Background3D = () => {
	const canvasRef = useRef(null);
	const mousePos = useRef({ x: 0.5, y: 0.5 });
	const [prefersReducedMotion, setPRM] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		setPRM(mq.matches);
		const onChange = (e) => setPRM(e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	}, []);

	useEffect(() => {
		if (prefersReducedMotion) return;
		const onMove = (e) => {
			mousePos.current = {
				x: e.clientX / window.innerWidth,
				y: e.clientY / window.innerHeight,
			};
		};
		window.addEventListener('pointermove', onMove, { passive: true });
		return () => window.removeEventListener('pointermove', onMove);
	}, [prefersReducedMotion]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');

		let raf;
		let t = 0;

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resize();
		window.addEventListener('resize', resize);

		const getVar = (name, fallback) => {
			const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
			return v || fallback;
		};

		const draw = () => {
			const { width, height } = canvas;
			const gridSize = 50;
			const perspective = 600;
			const horizonY = height * 0.65;

			// theme-aware colors
			const strong = getVar('--grid-stroke-strong', 'rgba(139, 92, 246, 0.18)');
			const soft = getVar('--grid-line', 'rgba(255,255,255,0.07)');
			const dot = getVar('--grid-dot', 'rgba(56, 189, 248, 0.55)');

			ctx.clearRect(0, 0, width, height);

			const ox = prefersReducedMotion ? 0 : (mousePos.current.x - 0.5) * 40;
			const oy = prefersReducedMotion ? 0 : (mousePos.current.y - 0.5) * 20;
			const wtime = prefersReducedMotion ? 0 : t * 0.0005;

			// vertical lines (strong)
			ctx.lineWidth = 1;
			ctx.strokeStyle = strong;
			for (let i = -10; i <= 10; i++) {
				const x = width / 2 + i * gridSize + ox;
				ctx.beginPath();
				ctx.moveTo(x, horizonY);
				for (let j = 0; j < 20; j++) {
					const y = horizonY + j * gridSize;
					const depth = j / 20;
					const scale = perspective / (perspective + depth * 500);
					const wave = prefersReducedMotion ? 0 : Math.sin(wtime + i * 0.3 + j * 0.2) * 3;
					const px = width / 2 + (x - width / 2) * scale + wave + ox * depth;
					const py = horizonY + (y - horizonY) * scale + oy * depth;
					ctx.lineTo(px, py);
				}
				ctx.stroke();
			}

			// horizontal lines (soft, fade with depth)
			for (let j = 0; j < 20; j++) {
				const depth = j / 20;
				const scale = perspective / (perspective + depth * 500);
				ctx.strokeStyle = soft;
				ctx.globalAlpha = 1 - depth * 0.5;

				ctx.beginPath();
				for (let i = -10; i <= 10; i++) {
					const x = width / 2 + i * gridSize;
					const y = horizonY + j * gridSize;
					const wave = prefersReducedMotion ? 0 : Math.sin(wtime + i * 0.3 + j * 0.2) * 3;
					const px = width / 2 + (x - width / 2) * scale + wave + ox * depth;
					const py = horizonY + (y - horizonY) * scale + oy * depth;
					if (i === -10) ctx.moveTo(px, py);
					else ctx.lineTo(px, py);
				}
				ctx.stroke();
				ctx.globalAlpha = 1;
			}

			// glowing dots
			if (!prefersReducedMotion) {
				ctx.fillStyle = dot;
				for (let i = -10; i <= 10; i += 2) {
					for (let j = 0; j < 20; j += 2) {
						const x = width / 2 + i * gridSize;
						const y = horizonY + j * gridSize;
						const depth = j / 20;
						const scale = perspective / (perspective + depth * 500);
						const wave = Math.sin(wtime + i * 0.3 + j * 0.2) * 3;
						const px = width / 2 + (x - width / 2) * scale + wave + ox * depth;
						const py = horizonY + (y - horizonY) * scale + oy * depth;
						const pulse = Math.sin(t * 0.003 + i + j) * 0.5 + 0.5;
						ctx.beginPath();
						ctx.arc(px, py, 1.5 * pulse, 0, Math.PI * 2);
						ctx.fill();
					}
				}
			}

			t++;
			raf = prefersReducedMotion ? null : requestAnimationFrame(draw);
		};

		draw();
		if (prefersReducedMotion) draw();

		return () => {
			if (raf) cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
		};
	}, [prefersReducedMotion]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
			{/* Next-like layered base */}
			<div className="absolute inset-0 bg-next-base" />
			<div className="absolute inset-0 next-spotlights" />
			<div className="absolute inset-0 next-vignette" />

			{/* Canvas grid */}
			<canvas
				ref={canvasRef}
				className="absolute inset-0 w-full h-full"
				style={{ mixBlendMode: 'screen' }}
			/>

			{/* Gradient-masked logo watermark (theme-aware) */}
			<div className="absolute inset-x-0 top-0 flex items-start justify-center pt-[10vh] sm:pt-[12vh] lg:pt-[14vh]">
				<div
					className="logo-mask animate"
					style={{
						WebkitMaskImage: `url(${Logo})`,
						maskImage: `url(${Logo})`,
						width: 'min(84vw, 880px)',
						aspectRatio: '2.1 / 1',
					}}
				/>
			</div>

			{/* Floating particles (soft) */}
			{!prefersReducedMotion && (
				<div className="absolute inset-0">
					{Array.from({ length: 18 }).map((_, i) => (
						<div
							key={i}
							className="absolute w-1 h-1 rounded-full animate-float"
							style={{
								left: `${Math.random() * 100}%`,
								top: `${Math.random() * 100}%`,
								background: 'var(--brand-2)',
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
