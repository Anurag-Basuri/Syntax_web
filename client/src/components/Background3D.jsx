import React, { Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import logo from '../assets/logo.png';

// --- Hooks & Helpers (largely unchanged) ---
const useTheme = () => {
	const [theme, setTheme] = React.useState(
		document.documentElement.getAttribute('data-theme') || 'dark'
	);
	useEffect(() => {
		const observer = new MutationObserver(() => {
			setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme'],
		});
		return () => observer.disconnect();
	}, []);
	return theme;
};

const useResponsive = () => {
	const [breakpoint, setBreakpoint] = useState('desktop');
	useEffect(() => {
		const update = () => {
			const w = window.innerWidth;
			if (w < 640) setBreakpoint('mobile');
			else if (w < 1024) setBreakpoint('tablet');
			else setBreakpoint('desktop');
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);
	return breakpoint;
};

const readCssVar = (name) =>
	getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';

// --- R3F Scene Components ---

// Faint, animated grid inspired by Next.js
const Grid = ({ theme }) => {
	const uniforms = useMemo(() => {
		const isLight = theme === 'light';
		return {
			uTime: { value: 0 },
			uGridColor: {
				value: new THREE.Color(
					isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(203, 213, 225, 0.03)'
				),
			},
			uGridSize: { value: 36.0 },
			uFadeDistance: { value: 0.65 },
			uFadeSharpness: { value: 0.8 },
		};
	}, [theme]);

	useFrame((state) => {
		uniforms.uTime.value = state.clock.elapsedTime;
	});

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} renderOrder={-2}>
			<planeGeometry args={[500, 500, 1, 1]} />
			<shaderMaterial
				transparent
				uniforms={uniforms}
				vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
				fragmentShader={`
          uniform float uTime;
          uniform vec3 uGridColor;
          uniform float uGridSize;
          uniform float uFadeDistance;
          uniform float uFadeSharpness;
          varying vec3 vWorldPosition;

          float line(float v) {
            return smoothstep(0.0, 0.02, abs(fract(v) - 0.5) * 2.0);
          }

          void main() {
            vec2 gridUv = vWorldPosition.xz / uGridSize;
            gridUv.y += uTime * 0.01; // Slow scroll

            float gridX = line(gridUv.x);
            float gridY = line(gridUv.y);
            float grid = 1.0 - min(gridX, gridY);

            float dist = length(vWorldPosition.xz);
            float fade = 1.0 - smoothstep(uFadeDistance, uFadeDistance + uFadeSharpness, dist / 100.0);

            gl_FragColor = vec4(uGridColor, grid * fade * 0.5);
          }
        `}
			/>
		</mesh>
	);
};

// Soft accent glows
const Glows = ({ theme }) => {
	const accent1 = useMemo(() => new THREE.Color(readCssVar('--accent-1')), [theme]);
	const accent2 = useMemo(() => new THREE.Color(readCssVar('--accent-2')), [theme]);
	const isLight = theme === 'light';

	return (
		<>
			{/* Main spotlight */}
			<mesh position={[0, 0, -25]} renderOrder={-3}>
				<planeGeometry args={[120, 120]} />
				<meshBasicMaterial
					transparent
					color={accent1}
					opacity={isLight ? 0.08 : 0.12}
					blending={THREE.AdditiveBlending}
				/>
			</mesh>
			{/* Secondary aura */}
			<mesh position={[40, 10, -35]} renderOrder={-4}>
				<planeGeometry args={[150, 150]} />
				<meshBasicMaterial
					transparent
					color={accent2}
					opacity={isLight ? 0.05 : 0.07}
					blending={THREE.AdditiveBlending}
				/>
			</mesh>
		</>
	);
};

// Subtle, blended logo with parallax
const SubtleLogo = ({ breakpoint }) => {
	const ref = useRef();
	const texture = useTexture(logo);
	const theme = useTheme();
	const isLight = theme === 'light';

	const { scale, opacity } = useMemo(() => {
		const s =
			breakpoint === 'mobile'
				? 'min(70vw, 30vh, 420px)'
				: breakpoint === 'tablet'
				? 'min(44vw, 34vh, 560px)'
				: 'min(32vw, 36vh, 640px)';
		// This is a CSS value, so we need a representative number for R3F scale
		const scaleFactor = breakpoint === 'mobile' ? 14 : breakpoint === 'tablet' ? 18 : 22;
		return {
			scale: scaleFactor,
			opacity: isLight ? 0.05 : 0.07,
		};
	}, [breakpoint, isLight]);

	useFrame((state) => {
		if (!ref.current) return;
		const { pointer } = state;
		const t = state.clock.elapsedTime;
		const strength = breakpoint === 'mobile' ? 0.2 : 0.4;

		// Parallax
		ref.current.position.x = THREE.MathUtils.lerp(
			ref.current.position.x,
			pointer.x * strength,
			0.1
		);
		ref.current.position.y = THREE.MathUtils.lerp(
			ref.current.position.y,
			pointer.y * strength,
			0.1
		);

		// Gentle float
		ref.current.position.z = -15 + Math.sin(t * 0.3) * 0.2;
	});

	return (
		<mesh ref={ref} position={[0, 0, -15]} scale={scale} renderOrder={-1}>
			<planeGeometry args={[1, 1]} />
			<meshBasicMaterial
				map={texture}
				transparent
				alphaTest={0.1}
				opacity={opacity}
				blending={isLight ? THREE.MultiplyBlending : THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</mesh>
	);
};

// Main component orchestrator
const Background3D = () => {
	const theme = useTheme();
	const breakpoint = useResponsive();

	const cameraConfig = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { position: [0, 0, 5], fov: 75 };
			default:
				return { position: [0, 0, 5], fov: 60 };
		}
	}, [breakpoint]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			<Canvas
				camera={cameraConfig}
				gl={{
					antialias: true,
					alpha: true,
					powerPreference: 'high-performance',
				}}
				dpr={[1, 1.5]} // Cap DPR for performance
			>
				<Suspense fallback={null}>
					<Glows theme={theme} />
					<Grid theme={theme} />
					<SubtleLogo breakpoint={breakpoint} />
				</Suspense>
			</Canvas>

			{/* CSS layers for base color and fades, which are cheaper than full-screen shaders */}
			<div
				className="absolute inset-0 transition-colors duration-300"
				style={{ background: 'var(--bg-base)' }}
			/>
			<div
				className="absolute inset-x-0 bottom-0 h-56 pointer-events-none"
				style={{
					background: `linear-gradient(to top, var(--bg-base) 35%, transparent 100%)`,
				}}
			/>
			<div
				className="absolute inset-0 pointer-events-none mix-blend-overlay"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
					opacity: theme === 'light' ? 0.005 : 0.007,
				}}
			/>
		</div>
	);
};

export default Background3D;
