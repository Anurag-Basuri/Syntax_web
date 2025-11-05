import React, { Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import logo from '../assets/logo.png';

useTexture.preload?.(logo);

// --- Hooks & Helpers ---
const useTheme = () => {
	const [theme, setTheme] = React.useState(
		typeof document !== 'undefined'
			? document.documentElement.getAttribute('data-theme') || 'dark'
			: 'dark'
	);
	useEffect(() => {
		if (typeof document === 'undefined') return;
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
	const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

	useEffect(() => {
		const update = () => {
			const w = window.innerWidth;
			const h = window.innerHeight;
			setDimensions({ width: w, height: h });

			if (w < 480) setBreakpoint('mobile');
			else if (w < 768) setBreakpoint('tablet-sm');
			else if (w < 1024) setBreakpoint('tablet');
			else if (w < 1440) setBreakpoint('desktop');
			else setBreakpoint('desktop-lg');
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);

	return { breakpoint, dimensions };
};

const readCssVar = (name) =>
	typeof document !== 'undefined'
		? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#06b6d4'
		: '#06b6d4';

const isWebGLAvailable = () => {
	if (typeof document === 'undefined') return false;
	try {
		const canvas = document.createElement('canvas');
		return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
	} catch {
		return false;
	}
};

// --- R3F Scene Components ---

// Grid with 3D perspective view
const Grid = ({ theme, breakpoint }) => {
	const meshRef = useRef();
	const materialRef = useRef();

	const prefersReduced = useMemo(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}, []);

	const uniforms = useMemo(() => {
		const isLight = theme === 'light';

		const minorHex = isLight ? '#94a3b8' : '#64748b';
		const majorHex = isLight ? '#64748b' : '#94a3b8';
		const accentHex = readCssVar('--accent-1');

		const gridSizes = {
			mobile: 18.0,
			'tablet-sm': 20.0,
			tablet: 22.0,
			desktop: 24.0,
			'desktop-lg': 26.0,
		};

		const gridSize = gridSizes[breakpoint] || 24.0;

		return {
			uTime: { value: 0 },
			uMinorColor: { value: new THREE.Color(minorHex) },
			uMajorColor: { value: new THREE.Color(majorHex) },
			uAccentColor: { value: new THREE.Color(accentHex) },
			uMinorSize: { value: gridSize },
			uMajorEvery: { value: 5.0 },
			uMinorWidth: { value: 0.025 },
			uMajorWidth: { value: 0.045 },
			uFadeNear: { value: 0.1 },
			uFadeFar: { value: 0.95 },
			uMinorAlpha: { value: isLight ? 0.45 : 0.55 },
			uMajorAlpha: { value: isLight ? 0.65 : 0.75 },
			uAccentAlpha: { value: isLight ? 0.15 : 0.2 },
			uSpeed: { value: prefersReduced ? 0.0 : 0.012 },
			uClothFreq: { value: 1.8 },
			uClothAmp: { value: 0.04 },
			uWaveAmp: { value: breakpoint === 'mobile' ? 0.15 : 0.25 },
			uWaveFreq: { value: 0.12 },
			uWaveSpeed: { value: prefersReduced ? 0.0 : 0.25 },
		};
	}, [theme, prefersReduced, breakpoint]);

	useFrame((state) => {
		if (materialRef.current) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
		}

		// Add subtle 3D rotation based on mouse movement
		if (meshRef.current && !prefersReduced) {
			const { pointer } = state;
			const targetRotX = THREE.MathUtils.degToRad(-15 + pointer.y * 5); // Tilt based on Y
			const targetRotY = THREE.MathUtils.degToRad(pointer.x * 8); // Rotate based on X

			meshRef.current.rotation.x = THREE.MathUtils.damp(
				meshRef.current.rotation.x,
				targetRotX,
				4,
				0.016
			);
			meshRef.current.rotation.y = THREE.MathUtils.damp(
				meshRef.current.rotation.y,
				targetRotY,
				4,
				0.016
			);
		}
	});

	return (
		// Position and rotate for 3D perspective effect
		<mesh
			ref={meshRef}
			position={[0, -12, -15]}
			rotation={[THREE.MathUtils.degToRad(-15), 0, 0]} // Initial tilt
			renderOrder={-2}
		>
			<planeGeometry args={[120, 80, 320, 240]} />
			<shaderMaterial
				ref={materialRef}
				transparent
				depthWrite={false}
				uniforms={uniforms}
				vertexShader={`
          uniform float uTime;
          uniform float uSpeed;
          uniform float uClothFreq;
          uniform float uClothAmp;
          uniform float uWaveAmp;
          uniform float uWaveFreq;
          uniform float uWaveSpeed;

          varying vec2 vUv;
          varying vec3 vPosition;
          varying float vElevation;
          varying float vDepth;

          void main() {
            vUv = uv;
            vec3 pos = position;

            // Cloth-like texture displacement
            float cloth = sin(pos.x * uClothFreq + uTime * uSpeed) *
                          cos(pos.y * uClothFreq * 1.2 + uTime * uSpeed * 0.8) * uClothAmp;

            // Wavy motion
            float wave1 = sin(pos.x * uWaveFreq + uTime * uWaveSpeed) * uWaveAmp;
            float wave2 = cos(pos.y * uWaveFreq * 0.7 + uTime * uWaveSpeed * 1.1) * uWaveAmp * 0.4;

            float elevation = cloth + wave1 + wave2;
            pos.z += elevation;

            vPosition = pos;
            vElevation = elevation;
            
            // Calculate depth for perspective fade
            vDepth = (pos.y + 40.0) / 80.0; // Normalize depth

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
				fragmentShader={`
          uniform vec3 uMinorColor;
          uniform vec3 uMajorColor;
          uniform vec3 uAccentColor;
          uniform float uMinorSize;
          uniform float uMajorEvery;
          uniform float uMinorWidth;
          uniform float uMajorWidth;
          uniform float uFadeNear;
          uniform float uFadeFar;
          uniform float uMinorAlpha;
          uniform float uMajorAlpha;
          uniform float uAccentAlpha;

          varying vec2 vUv;
          varying vec3 vPosition;
          varying float vElevation;
          varying float vDepth;

          void main() {
            vec2 coord = vPosition.xy;

            // Perspective depth fade - fade out towards the back
            float depthFade = smoothstep(0.0, 0.4, vDepth);
            if (depthFade < 0.01) discard;

            vec2 g = abs(fract(coord / uMinorSize - 0.5) - 0.5) / fwidth(coord / uMinorSize);
            float minor = 1.0 - min(min(g.x, g.y) * uMinorWidth, 1.0);

            vec2 G = abs(fract((coord / (uMinorSize * uMajorEvery)) - 0.5) - 0.5) / fwidth(coord / (uMinorSize * uMajorEvery));
            float major = 1.0 - min(min(G.x, G.y) * uMajorWidth, 1.0);

            // Elevation-based accent glow
            float accentGlow = smoothstep(-0.2, 0.2, vElevation) * uAccentAlpha;

            vec3 minorTint = mix(uMinorColor, uAccentColor, accentGlow * 0.4);
            vec3 majorTint = mix(uMajorColor, uAccentColor, accentGlow * 0.6);

            vec3 color = minorTint * minor * uMinorAlpha + majorTint * major * uMajorAlpha;
            float alpha = (minor * uMinorAlpha + major * uMajorAlpha + accentGlow * 0.3);

            // Horizontal fade from center
            float distFromCenter = length(vec2(vUv.x - 0.5, 0.0)) * 2.0;
            float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, distFromCenter);
            
            // Combine perspective depth with horizontal fade
            alpha *= fade * depthFade;
            alpha *= 0.95 + vElevation * 0.05;

            if (alpha <= 0.01) discard;
            gl_FragColor = vec4(color, alpha);
          }
        `}
			/>
		</mesh>
	);
};

// Clean logo
const EnhancedLogo = ({ breakpoint }) => {
	const base = useRef();
	const anim = useRef();
	const texture = useTexture(logo);

	useEffect(() => {
		if (!texture) return;
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = 16;
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.generateMipmaps = true;
		texture.needsUpdate = true;
	}, [texture]);

	const [aspect, setAspect] = useState(1);
	useEffect(() => {
		if (texture?.image?.width && texture?.image?.height) {
			setAspect(texture.image.width / texture.image.height);
		}
	}, [texture]);

	const { camera } = useThree();
	const targetZ = -12;

	const logoScales = {
		mobile: 0.22,
		'tablet-sm': 0.26,
		tablet: 0.3,
		desktop: 0.34,
		'desktop-lg': 0.38,
	};

	const frac = logoScales[breakpoint] || 0.3;
	const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
	const scaleXY = useMemo(() => {
		const dist = Math.abs(targetZ - (camera?.position?.z ?? 5));
		const worldH = 2 * Math.tan(THREE.MathUtils.degToRad((camera?.fov ?? 60) / 2)) * dist;
		const h = clamp(worldH * frac, 6, 20);
		return [h * aspect, h];
	}, [camera?.fov, camera?.position?.z, aspect, frac]);

	useEffect(() => {
		if (base.current) base.current.scale.set(scaleXY[0], scaleXY[1], 1);
	}, [scaleXY]);

	const prefersReduced =
		typeof window !== 'undefined' && window.matchMedia
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	useFrame((state) => {
		if (!anim.current) return;
		const { pointer, clock } = state;
		const t = clock.elapsedTime;

		const parallaxFactors = {
			mobile: 0.1,
			'tablet-sm': 0.15,
			tablet: 0.2,
			desktop: 0.25,
			'desktop-lg': 0.3,
		};

		const factor = parallaxFactors[breakpoint] || 0.2;
		const px = prefersReduced ? 0 : factor * pointer.x;
		const py = prefersReduced ? 0 : factor * pointer.y;

		anim.current.position.x = THREE.MathUtils.damp(anim.current.position.x, px, 5.0, 0.016);
		anim.current.position.y = THREE.MathUtils.damp(anim.current.position.y, py, 5.0, 0.016);

		const tiltX = prefersReduced ? 0 : THREE.MathUtils.degToRad(py * 1.5);
		const tiltY = prefersReduced ? 0 : THREE.MathUtils.degToRad(px * -2.0);
		anim.current.rotation.x = THREE.MathUtils.damp(anim.current.rotation.x, tiltX, 5.0, 0.016);
		anim.current.rotation.y = THREE.MathUtils.damp(anim.current.rotation.y, tiltY, 5.0, 0.016);

		const s = 1 + (prefersReduced ? 0 : Math.sin(t * 0.2) * 0.004);
		anim.current.scale.set(s, s, 1);
	});

	return (
		<group ref={base} position={[0, 0, 0]} renderOrder={-1}>
			<group ref={anim}>
				<mesh position={[0, 0, targetZ]}>
					<planeGeometry args={[1, 1]} />
					<meshBasicMaterial map={texture} transparent depthWrite={false} />
				</mesh>
			</group>
		</group>
	);
};

// Main component
const Background3D = () => {
	const theme = useTheme();
	const { breakpoint, dimensions } = useResponsive();

	const [webglOk, setWebglOk] = useState(true);
	const [ctxLost, setCtxLost] = useState(false);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setWebglOk(isWebGLAvailable());
		const t = setTimeout(() => setReady(true), 500);
		return () => clearTimeout(t);
	}, []);

	const cameraConfig = useMemo(() => {
		const configs = {
			mobile: { position: [0, 0, 8], fov: 75 },
			'tablet-sm': { position: [0, 0, 7], fov: 70 },
			tablet: { position: [0, 0, 6], fov: 65 },
			desktop: { position: [0, 0, 5], fov: 60 },
			'desktop-lg': { position: [0, 0, 5], fov: 58 },
		};
		return configs[breakpoint] || { position: [0, 0, 5], fov: 60 };
	}, [breakpoint]);

	const baseGradient = `var(--bg-base)`;

	const showFallback = !webglOk || ctxLost;
	const cssPreviewOpacity = showFallback ? 0.9 : ready ? 0.12 : 0.35;

	return (
		<div
			className="fixed inset-0 -z-10 overflow-hidden"
			aria-hidden="true"
			style={{ background: baseGradient }}
		>
			{/* CSS preview grid - bottom only with perspective */}
			<div
				className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out"
				style={{ opacity: cssPreviewOpacity }}
			>
				<div
					className="absolute bottom-0 left-0 right-0 pointer-events-none animate-grid-flow"
					style={{
						height: '55%',
						backgroundImage: `
                            linear-gradient(to right, ${
								theme === 'light'
									? 'rgba(148,163,184,0.18)'
									: 'rgba(100,116,139,0.20)'
							} 1.5px, transparent 1.5px),
                            linear-gradient(to bottom, ${
								theme === 'light'
									? 'rgba(148,163,184,0.18)'
									: 'rgba(100,116,139,0.20)'
							} 1.5px, transparent 1.5px)
                        `,
						backgroundSize: '24px 24px',
						transform: 'perspective(600px) rotateX(45deg)',
						transformOrigin: 'bottom center',
						maskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
						WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
					}}
				/>
			</div>

			{/* WebGL scene with 3D perspective */}
			{!showFallback && (
				<Canvas
					camera={cameraConfig}
					style={{ position: 'absolute', inset: 0 }}
					gl={{
						antialias: true,
						alpha: true,
						powerPreference: 'high-performance',
					}}
					dpr={[1, Math.min(2, window.devicePixelRatio || 2)]}
					onCreated={({ gl }) => {
						gl.setClearColor(0x000000, 0);
						gl.outputColorSpace = THREE.SRGBColorSpace;
						requestAnimationFrame(() => setReady(true));

						const el = gl.domElement;
						const onLost = (e) => {
							e.preventDefault();
							setCtxLost(true);
						};
						const onRestored = () => setCtxLost(false);
						el.addEventListener('webglcontextlost', onLost, { passive: false });
						el.addEventListener('webglcontextrestored', onRestored, { passive: true });
						return () => {
							el.removeEventListener('webglcontextlost', onLost);
							el.removeEventListener('webglcontextrestored', onRestored);
						};
					}}
				>
					<Grid theme={theme} breakpoint={breakpoint} dimensions={dimensions} />
					<Suspense fallback={null}>
						<EnhancedLogo breakpoint={breakpoint} />
					</Suspense>
				</Canvas>
			)}
		</div>
	);
};

export default Background3D;
