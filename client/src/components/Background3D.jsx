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

// Grid with 3D perspective view and water waves
const Grid = ({ theme, breakpoint }) => {
	const meshRef = useRef();
	const fillMatRef = useRef();
	const wireMatRef = useRef();

	const prefersReduced = useMemo(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}, []);

	// grid / geometry density driven by a single "uniform size" concept
	const gridSize = useMemo(() => {
		const map = {
			mobile: 12.0,
			'tablet-sm': 16.0,
			tablet: 20.0,
			desktop: 24.0,
			'desktop-lg': 28.0,
		};
		return map[breakpoint] || 20.0;
	}, [breakpoint]);

	// segments must be integers; use gridSize to derive a uniform mesh density
	const segs = Math.max(8, Math.floor(gridSize * 1.5));
	const segsY = Math.max(6, Math.floor(gridSize));

	// cloth / wave uniforms
	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uWaveAmplitude: { value: breakpoint === 'mobile' ? 0.35 : 0.55 },
			uWaveFrequency: { value: 0.09 },
			uWaveSpeed: { value: prefersReduced ? 0.0 : 0.45 },
			uClothColor: { value: new THREE.Color(theme === 'light' ? '#f1f5f9' : '#0f1724') },
			uAccent: { value: new THREE.Color(readCssVar('--accent-1')) },
			uDepthFade: { value: 0.95 },
			uWireOpacity: { value: theme === 'light' ? 0.12 : 0.18 },
			uWireColor: { value: new THREE.Color(theme === 'light' ? '#cbd5e1' : '#334155') },
		}),
		[theme, prefersReduced, breakpoint]
	);

	// animate time and subtle rotation
	useFrame((state) => {
		const t = state.clock.elapsedTime;
		if (fillMatRef.current) fillMatRef.current.uniforms.uTime.value = t;
		if (wireMatRef.current) wireMatRef.current.uniforms.uTime.value = t;

		// subtle 3D tilt based on pointer unless reduced motion requested
		if (meshRef.current && !prefersReduced) {
			const { pointer } = state;
			const targetX = THREE.MathUtils.degToRad(-10 + pointer.y * 4);
			const targetY = THREE.MathUtils.degToRad(pointer.x * 6);
			meshRef.current.rotation.x = THREE.MathUtils.damp(
				meshRef.current.rotation.x,
				targetX,
				3,
				0.016
			);
			meshRef.current.rotation.y = THREE.MathUtils.damp(
				meshRef.current.rotation.y,
				targetY,
				3,
				0.016
			);
		}
	});

	// Shared vertex shader for both fill and wireframe to ensure they match
	const vertexShader = `
        uniform float uTime;
        uniform float uWaveAmplitude;
        uniform float uWaveFrequency;
        uniform float uWaveSpeed;

        varying vec2 vUv;
        varying float vElevation;
        varying float vDepth;

        // small analytic noise (cheap)
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
        }
        float noise(vec2 p){
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f*f*(3.0-2.0*f);
            float a = hash(i);
            float b = hash(i+vec2(1.0,0.0));
            float c = hash(i+vec2(0.0,1.0));
            float d = hash(i+vec2(1.0,1.0));
            return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
        }

        void main(){
            vUv = uv;
            vec3 pos = position;

            // rolling waves + small high-frequency cloth ripples
            float wave = sin(pos.x * uWaveFrequency + uTime * uWaveSpeed) * 
                         cos(pos.y * uWaveFrequency * 0.75 + uTime * uWaveSpeed * 0.9) * uWaveAmplitude;
            float small = sin(pos.x * uWaveFrequency * 3.2 + uTime * uWaveSpeed * 1.8) * 0.12;
            float n = (noise((pos.xy) * 0.08 + uTime * 0.03) - 0.5) * 0.18;

            float elevation = wave + small + n;

            // gentle distance attenuation so far cloth lies flatter
            vDepth = (pos.y + 40.0) / 80.0;
            elevation *= smoothstep(0.0, 0.9, 1.0 - vDepth);

            pos.z += elevation;

            vElevation = elevation;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

	return (
		<group
			ref={meshRef}
			position={[0, -10, -12]}
			rotation={[THREE.MathUtils.degToRad(-12), 0, 0]}
		>
			{/* fill mesh: displaced vertices produce cloth look */}
			<mesh renderOrder={-1}>
				<planeGeometry args={[120, 80, segs, segsY]} />
				<shaderMaterial
					ref={fillMatRef}
					uniforms={uniforms}
					transparent={true}
					depthWrite={false}
					side={THREE.DoubleSide}
					vertexShader={vertexShader}
					fragmentShader={`
                        uniform vec3 uClothColor;
                        uniform vec3 uAccent;
                        uniform float uDepthFade;

                        varying vec2 vUv;
                        varying float vElevation;
                        varying float vDepth;

                        void main(){
                            // base cloth tint
                            vec3 base = uClothColor;

                            // subtle highlight based on elevation
                            float h = smoothstep(0.06, 0.35, vElevation);
                            vec3 color = mix(base, uAccent, h * 0.25);

                            // simulate soft shadow in troughs
                            float shadow = smoothstep(-0.25, -0.04, vElevation) * 0.18;
                            color *= 1.0 - shadow;

                            // vignette/fade by depth and radial distance
                            float depthFade = smoothstep(0.0, uDepthFade, 1.0 - vDepth);
                            
                            // Fade out towards the edges for a contained look
                            vec2 centerUv = vUv - 0.5;
                            float radialDist = length(centerUv * vec2(1.0, 1.5)); // Elliptical shape
                            float radialFade = smoothstep(0.5, 0.25, radialDist);

                            float alpha = 0.9 * depthFade * radialFade;

                            if (alpha <= 0.01) discard;
                            gl_FragColor = vec4(color, alpha);
                        }
                    `}
				/>
			</mesh>

			{/* wire overlay: uses the same vertex shader to match the displacement */}
			<mesh renderOrder={0}>
				<planeGeometry args={[120, 80, segs, segsY]} />
				<shaderMaterial
					ref={wireMatRef}
					uniforms={uniforms}
					transparent={true}
					depthWrite={false}
					wireframe={true}
					side={THREE.DoubleSide}
					vertexShader={vertexShader}
					fragmentShader={`
                        uniform vec3 uWireColor;
                        uniform float uWireOpacity;
                        uniform float uDepthFade;

                        varying vec2 vUv;
                        varying float vDepth;

                        void main(){
                            float depthFade = smoothstep(0.0, uDepthFade, 1.0 - vDepth);

                            // Fade out towards the edges to match the fill
                            vec2 centerUv = vUv - 0.5;
                            float radialDist = length(centerUv * vec2(1.0, 1.5));
                            float radialFade = smoothstep(0.5, 0.25, radialDist);

                            float alpha = uWireOpacity * depthFade * radialFade;

                            if (alpha <= 0.01) discard;
                            gl_FragColor = vec4(uWireColor, alpha);
                        }
                    `}
				/>
			</mesh>
		</group>
	);
};

// Clean logo
const FloatingLogo = ({ breakpoint }) => {
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
			{/* Enhanced CSS preview grid with better visibility */}
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
									? 'rgba(203,213,225,0.35)' // Increased from 0.18
									: 'rgba(71,85,105,0.4)' // Increased from 0.20
							} 1.8px, transparent 1.8px),
                            linear-gradient(to bottom, ${
								theme === 'light' ? 'rgba(203,213,225,0.35)' : 'rgba(71,85,105,0.4)'
							} 1.8px, transparent 1.8px)
                        `,
						backgroundSize: '24px 24px',
						transform: 'perspective(600px) rotateX(45deg)',
						transformOrigin: 'bottom center',
						maskImage: 'linear-gradient(to top, black 45%, transparent 100%)',
						WebkitMaskImage: 'linear-gradient(to top, black 45%, transparent 100%)',
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
						<FloatingLogo breakpoint={breakpoint} />
					</Suspense>
				</Canvas>
			)}
		</div>
	);
};

export default Background3D;
