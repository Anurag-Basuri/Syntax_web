import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Plane, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const Logo3D = () => {
	const ref = useRef();
	const chevronRight = new THREE.Shape();
	chevronRight.moveTo(0, 0.75);
	chevronRight.lineTo(0.5, 0);
	chevronRight.lineTo(0, -0.75);
	chevronRight.lineTo(0.25, -0.75);
	chevronRight.lineTo(0.75, 0);
	chevronRight.lineTo(0.25, 0.75);
	chevronRight.closePath();

	const chevronLeft = new THREE.Shape();
	chevronLeft.moveTo(0, 0.75);
	chevronLeft.lineTo(-0.5, 0);
	chevronLeft.lineTo(0, -0.75);
	chevronLeft.lineTo(-0.25, -0.75);
	chevronLeft.lineTo(-0.75, 0);
	chevronLeft.lineTo(-0.25, 0.75);
	chevronLeft.closePath();

	const extrudeSettings = { depth: 0.1, bevelEnabled: false };

	useFrame((state) => {
		if (ref.current) {
			ref.current.rotation.y = THREE.MathUtils.lerp(
				ref.current.rotation.y,
				(state.mouse.x * Math.PI) / 10,
				0.05
			);
			ref.current.rotation.x = THREE.MathUtils.lerp(
				ref.current.rotation.x,
				(-state.mouse.y * Math.PI) / 10,
				0.05
			);
		}
	});

	return (
		<group ref={ref} position={[0, 0, 0]} scale={1.5}>
			<mesh position={[-0.5, 0, 0]}>
				<extrudeGeometry args={[chevronLeft, extrudeSettings]} />
				<meshStandardMaterial
					color="var(--accent-1)"
					emissive="var(--accent-1)"
					emissiveIntensity={0.5}
					metalness={0.8}
					roughness={0.4}
				/>
			</mesh>
			<mesh position={[0.5, 0, 0]}>
				<extrudeGeometry args={[chevronRight, extrudeSettings]} />
				<meshStandardMaterial
					color="var(--accent-2)"
					emissive="var(--accent-2)"
					emissiveIntensity={0.3}
					metalness={0.8}
					roughness={0.4}
				/>
			</mesh>
		</group>
	);
};

// Component for the infinite grid background
const InfiniteGrid = () => {
	const gridRef = useRef();
	useFrame((state) => {
		if (gridRef.current) {
			gridRef.current.position.z = (gridRef.current.position.z + 0.02) % 10;
		}
	});

	return (
		<Plane
			ref={gridRef}
			args={[100, 100, 100, 100]}
			rotation-x={-Math.PI / 2}
			position={[0, -5, 0]}
		>
			<shaderMaterial
				transparent
				vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
				fragmentShader={`
          varying vec2 vUv;
          void main() {
            vec2 grid = abs(fract(vUv * 20.0 - 0.5) - 0.5) / fwidth(vUv * 20.0);
            float line = min(grid.x, grid.y);
            float opacity = 1.0 - min(line, 1.0);
            gl_FragColor = vec4(vec3(0.0, 0.5, 1.0), opacity * 0.1);
          }
        `}
			/>
		</Plane>
	);
};

const Background3D = () => {
	const canvasRef = useRef(null);
	const mousePos = useRef({ x: 0.5, y: 0.5 });
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const location = useLocation();

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
		let nodes = [];
		const nodeCount = window.innerWidth < 768 ? 60 : 100;
		const maxDist = 200; // Max distance to draw a line between nodes

		class Node {
			constructor() {
				this.x = Math.random() * canvas.width;
				this.y = Math.random() * canvas.height;
				this.vx = (Math.random() - 0.5) * 0.5; // Velocity X
				this.vy = (Math.random() - 0.5) * 0.5; // Velocity Y
				this.radius = Math.random() * 1.5 + 1;
			}

			update() {
				this.x += this.vx;
				this.y += this.vy;

				// Bounce off edges
				if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
				if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
			}

			draw() {
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(14, 165, 233, 0.8)'; // accent-1
				ctx.fill();
			}
		}

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			nodes = [];
			for (let i = 0; i < nodeCount; i++) {
				nodes.push(new Node());
			}
		};

		const drawLines = () => {
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
					if (dist < maxDist) {
						const opacity = 1 - dist / maxDist;
						ctx.beginPath();
						ctx.moveTo(nodes[i].x, nodes[i].y);
						ctx.lineTo(nodes[j].x, nodes[j].y);
						ctx.strokeStyle = `rgba(37, 99, 235, ${opacity * 0.5})`; // accent-2
						ctx.lineWidth = 0.5;
						ctx.stroke();
					}
				}
			}
		};

		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Parallax effect on the entire canvas
			const targetX = (0.5 - mousePos.current.x) * 20;
			const targetY = (0.5 - mousePos.current.y) * 20;
			ctx.save();
			ctx.translate(targetX, targetY);

			nodes.forEach((node) => {
				node.update();
				node.draw();
			});
			drawLines();

			ctx.restore();
			animationId = requestAnimationFrame(animate);
		};

		resize();
		window.addEventListener('resize', resize);

		if (!prefersReducedMotion && !isAuthPage) {
			animate();
		} else {
			// Draw a static frame for auth pages or reduced motion
			nodes.forEach((node) => node.draw());
			drawLines();
		}

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
		};
	}, [prefersReducedMotion, isAuthPage]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
			{/* Base gradient layers */}
			<div className="absolute inset-0 bg-bg-base" />
			<div
				className="absolute inset-0 opacity-25"
				style={{
					background:
						'radial-gradient(ellipse 80% 50% at 50% 40%, var(--accent-1), transparent)',
				}}
			/>

			{/* 3D Scene */}
			<Suspense fallback={null}>
				<Canvas
					camera={{ position: [0, 0, 5], fov: 45 }}
					style={{ pointerEvents: 'auto' }}
					className="opacity-50"
				>
					<ambientLight intensity={0.5} />
					<directionalLight position={[5, 5, 5]} intensity={1} />
					<Logo3D />
					<InfiniteGrid />
				</Canvas>
			</Suspense>

			{/* Bottom fade to blend with content */}
			<div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg-base to-transparent" />
		</div>
	);
};

export default Background3D;
