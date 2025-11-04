import React, { Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import logo from '../assets/logo.png';

// --- Hooks & Helpers ---
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

// Faint, animated grid inspired by Next.js (valid THREE.Color inputs)
const Grid = ({ theme }) => {
	const uniforms = useMemo(() => {
		const isLight = theme === 'light';
		// Use solid hex colors; alpha is controlled via fragment shader
		const gridHex = isLight ? '#0f172a' /* slate-900 */ : '#cbd5e1'; /* slate-300 */
		return {
			uTime: { value: 0 },
			uGridColor: { value: new THREE.Color(gridHex) },
			uGridSize: { value: 36.0 },
			uFadeDistance: { value: 0.65 },
			uFadeSharpness: { value: 0.8 },
			uAlpha: { value: isLight ? 0.22 : 0.18 }, // overall opacity control
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
          uniform float uAlpha;
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

            vec3 color = uGridColor;
            float alpha = grid * fade * uAlpha;
            gl_FragColor = vec4(color, alpha);
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
					opacity={isLight ? 0.12 : 0.14}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
				/>
			</mesh>
			{/* Secondary aura */}
			<mesh position={[40, 10, -35]} renderOrder={-4}>
				<planeGeometry args={[150, 150]} />
				<meshBasicMaterial
					transparent
					color={accent2}
					opacity={isLight ? 0.07 : 0.09}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
				/>
			</mesh>
		</>
	);
};

// Subtle, blended logo with parallax (fades in when texture ready)
const SubtleLogo = ({ breakpoint }) => {
	const ref = useRef();
	const [opacity, setOpacity] = useState(0);
	const texture = useTexture(logo);
	const theme = useTheme();
	const isLight = theme === 'light';

	useEffect(() => {
		if (!texture) return;
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = 4;
		setOpacity(isLight ? 0.06 : 0.08);
	}, [texture, isLight]);

	const { scale } = useMemo(() => {
		const scaleFactor = breakpoint === 'mobile' ? 14 : breakpoint === 'tablet' ? 18 : 22;
		return { scale: scaleFactor };
	}, [breakpoint]);

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

	const [ready, setReady] = useState(false); // first-frame readiness
	useEffect(() => {
		// safety timeout to ensure we don't hang on blank if something fails
		const t = setTimeout(() => setReady(true), 800);
		return () => clearTimeout(t);
	}, []);

	const cameraConfig = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { position: [0, 0, 5], fov: 75 };
			default:
				return { position: [0, 0, 5], fov: 60 };
		}
	}, [breakpoint]);

	// Base gradient always visible (prevents “blank” while WebGL warms up)
	const baseGradient =
		'radial-gradient(ellipse 120% 70% at 50% -15%, var(--bg-soft) 0%, var(--bg-base) 60%)';

	return (
		<div
			className="fixed inset-0 -z-10 overflow-hidden"
			aria-hidden="true"
			style={{ background: baseGradient }}
		>
			{/* Canvas sits above base gradient; clear color is transparent */}
			<Canvas
				camera={cameraConfig}
				style={{ position: 'absolute', inset: 0 }}
				gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
				dpr={[1, 1.5]}
				onCreated={({ gl }) => {
					gl.setClearColor(0x000000, 0); // transparent, so base gradient shows through
					// Mark ready on first raf
					requestAnimationFrame(() => setReady(true));
				}}
			>
				{/* Render non-async components immediately */}
				<Glows theme={theme} />
				<Grid theme={theme} />

				{/* Suspend only the component that loads assets */}
				<Suspense fallback={null}>
					<SubtleLogo breakpoint={breakpoint} />
				</Suspense>
			</Canvas>

			{/* Gentle entrance cover to avoid pop-in (fades away once ready) */}
			<div
				className="absolute inset-0 transition-opacity duration-500 ease-out pointer-events-none"
				style={{
					background:
						'radial-gradient(900px 600px at 50% 0%, color-mix(in srgb, var(--accent-1) 8%, transparent), transparent 65%)',
					opacity: ready ? 0 : 1,
				}}
			/>

			{/* Bottom fade and noise overlay (very subtle, non-blocking) */}
			<div
				className="absolute inset-x-0 bottom-0 h-56 pointer-events-none"
				style={{
					background: 'linear-gradient(to top, var(--bg-base) 35%, transparent 100%)',
				}}
			/>
			<div
				className="absolute inset-0 pointer-events-none mix-blend-overlay"
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
					opacity: theme === 'light' ? 0.005 : 0.007,
				}}
			/>
		</div>
	);
};

export default Background3D;
