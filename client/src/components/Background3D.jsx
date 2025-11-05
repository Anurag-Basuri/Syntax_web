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

	const gridSize = useMemo(() => {
		const map = {
			mobile: 14.0,
			'tablet-sm': 18.0,
			tablet: 22.0,
			desktop: 26.0,
			'desktop-lg': 30.0,
		};
		return map[breakpoint] || 22.0;
	}, [breakpoint]);

	// Higher segment count for ultra-smooth waves
	const segs = Math.max(48, Math.floor(gridSize * 2.5));
	const segsY = Math.max(32, Math.floor(gridSize * 1.8));

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			// Dramatically increased amplitude for powerful 3D effect
			uWaveAmplitude: { value: breakpoint === 'mobile' ? 2.8 : 4.2 },
			uWaveFrequency: { value: 0.06 },
			uWaveSpeed: { value: prefersReduced ? 0.0 : 0.32 },
			uDepthFade: { value: 0.88 },
			uWireOpacity: { value: theme === 'light' ? 0.38 : 0.62 },
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

			if (!prefersReduced && meshRef.current) {
				const { pointer } = state;

				// Smooth mouse tracking
				wireMatRef.current.uniforms.uMouseX.value = THREE.MathUtils.lerp(
					wireMatRef.current.uniforms.uMouseX.value,
					pointer.x * 0.4,
					0.06
				);
				wireMatRef.current.uniforms.uMouseY.value = THREE.MathUtils.lerp(
					wireMatRef.current.uniforms.uMouseY.value,
					pointer.y * 0.3,
					0.06
				);

				// Enhanced 3D tilt with more dramatic angles
				const targetRotX = THREE.MathUtils.degToRad(-22 + pointer.y * 5);
				const targetRotY = THREE.MathUtils.degToRad(pointer.x * 6);

				meshRef.current.rotation.x = THREE.MathUtils.lerp(
					meshRef.current.rotation.x,
					targetRotX,
					0.06
				);
				meshRef.current.rotation.y = THREE.MathUtils.lerp(
					meshRef.current.rotation.y,
					targetRotY,
					0.06
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
        varying vec3 vWorldPos;

        // Enhanced noise functions
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for(int i = 0; i < 5; i++) {
                value += amplitude * noise(p);
                p *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vUv = uv;
            vec3 pos = position;

            // Multi-layered wave system for complex motion
            float wave1 = sin(pos.x * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.8) *
                          cos(pos.y * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.6);
            
            float wave2 = sin(pos.x * uWaveFrequency * 1.4 + uTime * uWaveSpeed * 1.2) *
                          cos(pos.y * uWaveFrequency * 1.1 + uTime * uWaveSpeed * 0.85);
            
            float wave3 = sin(pos.x * uWaveFrequency * 2.2 + uTime * uWaveSpeed * 1.6) *
                          sin(pos.y * uWaveFrequency * 1.8 + uTime * uWaveSpeed * 1.3);
            
            // High-frequency details
            float ripple = sin(pos.x * uWaveFrequency * 5.0 + uTime * uWaveSpeed * 2.5) *
                           sin(pos.y * uWaveFrequency * 4.2 + uTime * uWaveSpeed * 2.0) * 0.12;
            
            // Organic turbulence
            float organic = (fbm(pos.xy * 0.045 + uTime * 0.018) - 0.5) * 0.5;
            
            // Combine all layers with varying weights
            float elevation = (wave1 * 1.0 + wave2 * 0.7 + wave3 * 0.4) * uWaveAmplitude + 
                              ripple + organic;
            
            // Mouse-driven deformation
            float mouseInfluence = sin(pos.x * 0.08 + uMouseX * 3.5) * 
                                   cos(pos.y * 0.08 + uMouseY * 3.5) * 0.4;
            elevation += mouseInfluence;

            // Enhanced depth calculation for stronger perspective
            vDepth = (pos.y + 32.0) / 64.0;
            
            // Exponential depth attenuation for dramatic vanishing effect
            float depthAtten = smoothstep(0.0, 0.92, 1.0 - vDepth);
            depthAtten = pow(depthAtten, 2.2);
            elevation *= depthAtten;

            pos.z += elevation;
            vElevation = elevation;
            vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
            
            // Calculate surface normal for advanced lighting
            float delta = 0.1;
            vec3 tangentX = vec3(delta, 0.0, 
                (sin((pos.x + delta) * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.8) *
                 cos(pos.y * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.6) * uWaveAmplitude * depthAtten) - elevation);
            vec3 tangentY = vec3(0.0, delta,
                (sin(pos.x * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.8) *
                 cos((pos.y + delta) * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.6) * uWaveAmplitude * depthAtten) - elevation);
            
            vNormal = normalize(cross(tangentX, tangentY));

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

	return (
		<group
			ref={meshRef}
			position={[0, -32, -16]}
			rotation={[THREE.MathUtils.degToRad(-22), 0, 0]}
		>
			<mesh renderOrder={0}>
				<planeGeometry args={[140, 64, segs, segsY]} />
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
                        varying vec3 vWorldPos;
                        
                        void main() {
                            // Enhanced exponential depth fade
                            float depthFade = smoothstep(0.0, uDepthFade, 1.0 - vDepth);
                            depthFade = pow(depthFade, 2.4);
                            
                            // Elevation-based glow with sharper peaks
                            float elevationGlow = smoothstep(0.8, 2.8, abs(vElevation)) * 1.2;
                            
                            // Multi-frequency shimmer for dynamic highlights
                            float shimmer = sin(uTime * 2.8 + vUv.x * 12.0 + vUv.y * 8.0) * 
                                           cos(uTime * 3.2 + vUv.y * 10.0) * 0.15 + 0.85;
                            
                            // Advanced fresnel with view-dependent highlight
                            vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
                            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.8);
                            float edgeGlow = fresnel * 0.9;
                            
                            // Rim lighting effect on wave crests
                            float rimLight = smoothstep(1.5, 3.2, vElevation) * fresnel * 0.8;
                            
                            // Combine all lighting factors
                            float totalGlow = clamp(
                                elevationGlow * 0.6 + 
                                edgeGlow * 0.7 + 
                                rimLight, 
                                0.0, 1.0
                            );
                            totalGlow *= shimmer;
                            
                            // Enhanced color mixing with stronger accent on peaks
                            vec3 finalColor = mix(
                                uWireColor, 
                                uAccent, 
                                totalGlow * 0.95
                            );
                            
                            // Boost brightness on wave peaks
                            if (vElevation > 2.0) {
                                finalColor = mix(finalColor, uAccent * 1.3, 0.5);
                            }
                            
                            // Dynamic opacity with glow boost
                            float alpha = uWireOpacity * depthFade * (0.65 + totalGlow * 0.45);
                            
                            // Extra glow for extreme peaks
                            if (vElevation > 2.5) {
                                alpha += 0.25;
                                finalColor += uAccent * 0.3;
                            }
                            
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
			// Enhanced FOV and positioning for stronger perspective
			mobile: { position: [0, 2, 10], fov: 82 },
			'tablet-sm': { position: [0, 2, 8.5], fov: 76 },
			tablet: { position: [0, 2, 7], fov: 72 },
			desktop: { position: [0, 2, 6], fov: 68 },
			'desktop-lg': { position: [0, 2, 5.5], fov: 64 },
		};
		return configs[breakpoint] || { position: [0, 2, 6], fov: 68 };
	}, [breakpoint]);

	if (!webglOk) {
		return null;
	}

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
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
