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

/**
 * ## 🚀 Updated Grid Component: True Squares, Enhanced 3D, and Visibility
 * This version corrects the geometry to be a true square grid, increases amplitude
 * for stronger 3D effect, and reduces depth fade for better visibility.
 */
const Grid = ({ theme, breakpoint }) => {
	const meshRef = useRef();
	const wireMatRef = useRef();

	const prefersReduced = useMemo(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}, []);

	// **CHANGE:** Increased Grid density and size mapping
	const gridSize = useMemo(() => {
		const map = {
			mobile: 18.0,
			'tablet-sm': 24.0,
			tablet: 30.0,
			desktop: 36.0,
			'desktop-lg': 40.0,
		};
		return map[breakpoint] || 30.0;
	}, [breakpoint]);

	// **CHANGE:** Both segments are equal for square cells (e.g., 60x60 grid with 40x40 segments)
	const segs = Math.max(20, Math.floor(gridSize));
	const segsY = segs;

	// **CHANGE:** Plane size set to be a perfect square, centered around logo (y=0)
	const planeSize = 60;

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			// **CHANGE:** Significantly increased amplitude for dramatic 3D effect
			uWaveAmplitude: { value: breakpoint === 'mobile' ? 1.5 : 2.5 },
			uWaveFrequency: { value: 0.08 },
			uWaveSpeed: { value: prefersReduced ? 0.0 : 0.4 },
			// **CHANGE:** Reduced Depth Fade parameter for better visibility far away
			uDepthFade: { value: 0.65 },
			// **CHANGE:** Higher opacity
			uWireOpacity: { value: theme === 'light' ? 0.4 : 0.65 },
			uWireColor: { value: new THREE.Color(theme === 'light' ? '#94a3b8' : '#475569') },
			uAccent: { value: new THREE.Color(readCssVar('--accent-1')) },
			uMouseX: { value: 0 },
			uMouseY: { value: 0 },
		}),
		[theme, prefersReduced, breakpoint]
	);

	useFrame((state) => {
		const t = state.clock.elapsedTime;
		if (wireMatRef.current) {
			wireMatRef.current.uniforms.uTime.value = t;

			// ... (Mouse tracking and gentle tilt logic retained)
			if (!prefersReduced && meshRef.current) {
				const { pointer } = state;
				// Lerp mouse uniforms
				wireMatRef.current.uniforms.uMouseX.value = THREE.MathUtils.lerp(
					wireMatRef.current.uniforms.uMouseX.value,
					pointer.x * 0.3,
					0.05
				);
				wireMatRef.current.uniforms.uMouseY.value = THREE.MathUtils.lerp(
					wireMatRef.current.uniforms.uMouseY.value,
					pointer.y * 0.2,
					0.05
				);

				// Gentle tilt based on mouse position
				const targetRotX = THREE.MathUtils.degToRad(-15 + pointer.y * 2);
				const targetRotY = THREE.MathUtils.degToRad(pointer.x * 3);
				meshRef.current.rotation.x = THREE.MathUtils.lerp(
					meshRef.current.rotation.x,
					targetRotX,
					0.05
				);
				meshRef.current.rotation.y = THREE.MathUtils.lerp(
					meshRef.current.rotation.y,
					targetRotY,
					0.05
				);
			}
		}
	});

	const vertexShader = `
        uniform float uTime;
        uniform float uWaveAmplitude;
        uniform float uWaveFrequency;
        uniform float uWaveSpeed;
        uniform float uMouseX;
        uniform float uMouseY;

        varying vec2 vUv;
        varying float vElevation;
        varying float vDepth;
        varying vec3 vNormal;

        // FBM and Noise functions (retained)
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for(int i = 0; i < 4; i++) {
                value += amplitude * noise(p);
                p *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vUv = uv;
            vec3 pos = position;

            // Primary wave layers
            float wave1 = sin(pos.x * uWaveFrequency * 0.8 + uTime * uWaveSpeed) * cos(pos.y * uWaveFrequency * 0.6 + uTime * uWaveSpeed * 0.7);
            
            float wave2 = sin(pos.x * uWaveFrequency * 1.5 + uTime * uWaveSpeed * 1.3) *
                          cos(pos.y * uWaveFrequency * 1.2 + uTime * uWaveSpeed * 0.9);
            
            float ripple = sin(pos.x * uWaveFrequency * 4.0 + uTime * uWaveSpeed * 2.0) *
                           sin(pos.y * uWaveFrequency * 3.5 + uTime * uWaveSpeed * 1.8) * 0.15;
            
            float organic = (fbm(pos.xy * 0.05 + uTime * 0.02) - 0.5) * 0.4;
            
            float elevation = (wave1 + wave2 * 0.6) * uWaveAmplitude + ripple + organic;
            
            // Mouse influence is better applied as a subtle deformation
            float mouseInfluence = sin(pos.x * 0.1 + uMouseX * 3.0) * cos(pos.y * 0.1 + uMouseY * 3.0) * 0.5;
            elevation += mouseInfluence;

            // **CHANGE:** vDepth calculation for planeSize (60 units high)
            vDepth = (pos.y + ${planeSize / 2}.0) / ${planeSize}.0;
            
            // **CHANGE:** We use uDepthFade (now 0.65) here, and pow(depthAtten, 1.5) is now in the fragment shader
            float depthAtten = smoothstep(0.0, 0.85, 1.0 - vDepth);
            elevation *= depthAtten;

            pos.z += elevation;
            vElevation = elevation;
            
            // Calculate normal for lighting/fresnel effects
            vNormal = normalize(vec3(-elevation, -elevation, 1.0));

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

	return (
		<group
			ref={meshRef}
			// **CHANGE:** Positioned so the top edge of the 60x60 plane (y=30) sits just below logo (y=0)
			position={[0, -planeSize / 2, -14]}
			rotation={[THREE.MathUtils.degToRad(-15), 0, 0]} // Default rotation slightly reduced
		>
			<mesh renderOrder={0}>
				{/* **CRITICAL CHANGE:** planeGeometry is now square */}
				<planeGeometry args={[planeSize, planeSize, segs, segsY]} />
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
                        uniform vec3 uAccent;
                        uniform float uTime;
                        
                        varying vec2 vUv;
                        varying float vDepth;
                        varying float vElevation;
                        varying vec3 vNormal;
                        
                        void main() {
                            // **IMPROVEMENT:** Stronger depth fade and better visibility
                            float depthFade = smoothstep(0.0, uDepthFade, 1.0 - vDepth);
                            depthFade = pow(depthFade, 1.3); // Less severe falloff
                            
                            // Dynamic glow based on elevation (makes wave peaks bright)
                            float elevationGlow = smoothstep(0.5, 1.8, abs(vElevation));
                            
                            // Animated shimmer effect (focused on top half of the screen)
                            float shimmer = sin(uTime * 3.0 + vUv.x * 8.0) * 0.2 + 0.8; 
                            
                            // **IMPROVEMENT:** Stronger Fresnel-like edge highlight
                            float edgeGlow = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0) * 1.5;
                            
                            // Combine glow factors
                            float totalGlow = clamp(elevationGlow * 0.7 + edgeGlow, 0.0, 1.0);
                            totalGlow *= shimmer;
                            
                            // Mix wire color with accent based on glow
                            vec3 finalColor = mix(uWireColor, uAccent, totalGlow);
                            
                            // Enhanced opacity with glow boost
                            float alpha = uWireOpacity * depthFade * (0.8 + totalGlow * 0.5);
                            
                            // Discard transparent pixels
                            if (alpha <= 0.01) discard;
                            gl_FragColor = vec4(finalColor, alpha);
                        }
                    `}
				/>
			</mesh>
		</group>
	);
};

// Clean logo (no 3D animation)
const FloatingLogo = ({ breakpoint }) => {
	const base = useRef();
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

	return (
		<group ref={base} position={[0, 0, 0]} renderOrder={-1}>
			<mesh position={[0, 0, targetZ]}>
				<planeGeometry args={[1, 1]} />
				<meshBasicMaterial map={texture} transparent depthWrite={false} />
			</mesh>
		</group>
	);
};

// Main component
const Background3D = () => {
	const theme = useTheme();
	const { breakpoint } = useResponsive();

	const [webglOk, setWebglOk] = useState(true);
	useEffect(() => {
		setWebglOk(isWebGLAvailable());
	}, []);

	const cameraConfig = useMemo(() => {
		const configs = {
			// **CHANGE:** Increased FOV slightly to better capture the wider grid area
			mobile: { position: [0, 0, 8], fov: 78 },
			'tablet-sm': { position: [0, 0, 7], fov: 72 },
			tablet: { position: [0, 0, 6], fov: 68 },
			desktop: { position: [0, 0, 5], fov: 64 },
			'desktop-lg': { position: [0, 0, 5], fov: 60 },
		};
		return configs[breakpoint] || { position: [0, 0, 5], fov: 64 };
	}, [breakpoint]);

	if (!webglOk) {
		return null; // Render nothing if WebGL is not supported
	}

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{/* WebGL scene with 3D perspective */}
			<Canvas
				camera={cameraConfig}
				gl={{
					antialias: true,
					alpha: true,
					powerPreference: 'high-performance',
				}}
				dpr={[1, Math.min(2, window.devicePixelRatio || 2)]}
				onCreated={({ gl }) => {
					gl.setClearColor(0x000000, 0);
					gl.outputColorSpace = THREE.SRGBColorSpace;
				}}
			>
				<Grid theme={theme} breakpoint={breakpoint} />
				<Suspense fallback={null}>
					<FloatingLogo breakpoint={breakpoint} />
				</Suspense>
			</Canvas>
		</div>
	);
};

export default Background3D;
