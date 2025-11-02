import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const Background3D = () => {
	const canvasRef = useRef(null);
	const mousePos = useRef({ x: 0.5, y: 0.5 });
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const location = useLocation();

	// Determine if the background should be in a "calm" state for auth pages
	const isAuthPage =
		location.pathname.startsWith('/login') || location.pathname.startsWith('/join');

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
		let particles = [];
		const particleCount = window.innerWidth < 768 ? 150 : 300;

		// Particle class
		class Particle {
			constructor() {
				this.x = (Math.random() - 0.5) * canvas.width * 2;
				this.y = (Math.random() - 0.5) * canvas.height * 2;
				this.z = Math.random() * 2000;
				this.pz = this.z; // Previous Z
			}

			update() {
				this.z -= isAuthPage ? 3 : 8; // Slower speed on auth pages
				if (this.z < 1) {
					this.z = Math.random() * 2000;
					this.x = (Math.random() - 0.5) * canvas.width * 2;
					this.y = (Math.random() - 0.5) * canvas.height * 2;
					this.pz = this.z;
				}
			}

			draw() {
				const fov = 300;
				const scale = fov / (fov + this.z);
				const x2d = this.x * scale + canvas.width / 2;
				const y2d = this.y * scale + canvas.height / 2;

				const pScale = fov / (fov + this.pz);
				const pX2d = this.x * pScale + canvas.width / 2;
				const pY2d = this.y * pScale + canvas.height / 2;

				const alpha = Math.min(1, (2000 - this.z) / 1000);
				const size = scale * 2;

				ctx.beginPath();
				ctx.moveTo(pX2d, pY2d);
				ctx.lineTo(x2d, y2d);
				ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`; // Use accent-1 color
				ctx.lineWidth = size;
				ctx.stroke();

				this.pz = this.z;
			}
		}

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			particles = [];
			for (let i = 0; i < particleCount; i++) {
				particles.push(new Particle());
			}
		};

		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Parallax effect
			const targetX = (0.5 - mousePos.current.x) * 0.1;
			const targetY = (0.5 - mousePos.current.y) * 0.1;
			ctx.translate(canvas.width / 2, canvas.height / 2);
			ctx.rotateX(targetY);
			ctx.rotateY(targetX);
			ctx.translate(-canvas.width / 2, -canvas.height / 2);

			particles.forEach((p) => {
				p.update();
				p.draw();
			});

			animationId = requestAnimationFrame(animate);
		};

		resize();
		window.addEventListener('resize', resize);

		if (!prefersReducedMotion) {
			animate();
		}

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
		};
	}, [prefersReducedMotion, isAuthPage]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
			{/* Base gradient layers */}
			<div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-slate-900 to-gray-950" />
			<div
				className="absolute inset-0 opacity-20"
				style={{
					background:
						'radial-gradient(ellipse 80% 50% at 50% 40%, var(--accent-1), transparent)',
				}}
			/>

			{/* 3D Particle Canvas */}
			<canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

			{/* Logo watermark - positioned lower and responsive */}
			<div className="absolute inset-0 flex items-start justify-center pt-28 sm:pt-32 lg:pt-40">
				<div
					className="relative w-[min(80vw,800px)] aspect-[2/1] opacity-5"
					style={{
						WebkitMaskImage: `url(${logo})`,
						maskImage: `url(${logo})`,
						WebkitMaskSize: 'contain',
						maskSize: 'contain',
						WebkitMaskRepeat: 'no-repeat',
						maskRepeat: 'no-repeat',
						WebkitMaskPosition: 'center',
						maskPosition: 'center',
						background: 'linear-gradient(45deg, var(--accent-1), var(--accent-2))',
					}}
				/>
			</div>

			{/* Bottom fade to blend with content */}
			<div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg-base to-transparent" />
		</div>
	);
};

export default Background3D;
