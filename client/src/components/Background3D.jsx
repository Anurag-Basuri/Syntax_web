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
		? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#6366f1'
		: '#6366f1';

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
 * Enhanced Grid Component with Dramatic 3D Wave Effect
 */
const Grid = ({ theme, breakpoint }) => {
	const meshRef = useRef();
	const wireMatRef = useRef();

	const prefersReduced = useMemo(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}, []);

	// Responsive grid dimensions
	const gridParams = useMemo(() => {
		const configs = {
			mobile: { width: 80, height: 50, segs: 60 },
			'tablet-sm': { width: 100, height: 60, segs: 70 },
			tablet: { width: 120, height: 70, segs: 80 },
			desktop: { width: 140, height: 80, segs: 90 },
			'desktop-lg': { width: 160, height: 90, segs: 100 },
		};
		return configs[breakpoint] || configs.desktop;
	}, [breakpoint]);

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uWaveAmplitude: { value: breakpoint === 'mobile' ? 2.5 : 3.8 },
			uWaveFrequency: { value: 0.06 },
			uWaveSpeed: { value: prefersReduced ? 0.0 : 0.35 },
			uDepthFade: { value: 0.85 },
			uWireOpacity: { value: theme === 'light' ? 0.5 : 0.8 },
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
					pointer.x * 0.5,
					0.08
				);
				wireMatRef.current.uniforms.uMouseY.value = THREE.MathUtils.lerp(
					wireMatRef.current.uniforms.uMouseY.value,
					pointer.y * 0.4,
					0.08
				);

				// Dynamic 3D tilt
				const targetRotX = THREE.MathUtils.degToRad(-18 + pointer.y * 6);
				const targetRotY = THREE.MathUtils.degToRad(pointer.x * 7);

				meshRef.current.rotation.x = THREE.MathUtils.lerp(
					meshRef.current.rotation.x,
					targetRotX,
					0.08
				);
				meshRef.current.rotation.y = THREE.MathUtils.lerp(
					meshRef.current.rotation.y,
					targetRotY,
					0.08
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
        
        // Noise functions
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

            // Multi-layered wave system
            float wave1 = sin(pos.x * uWaveFrequency * 0.8 + uTime * uWaveSpeed) *
                          cos(pos.y * uWaveFrequency * 0.6 + uTime * uWaveSpeed * 0.7);
            
            float wave2 = sin(pos.x * uWaveFrequency * 1.5 + uTime * uWaveSpeed * 1.3) *
                          cos(pos.y * uWaveFrequency * 1.2 + uTime * uWaveSpeed * 0.9);
            
            float wave3 = sin(pos.x * uWaveFrequency * 2.3 + uTime * uWaveSpeed * 1.7) *
                          sin(pos.y * uWaveFrequency * 1.9 + uTime * uWaveSpeed * 1.4);
            
            // Fine details
            float ripple = sin(pos.x * uWaveFrequency * 5.5 + uTime * uWaveSpeed * 2.8) *
                           sin(pos.y * uWaveFrequency * 4.8 + uTime * uWaveSpeed * 2.2) * 0.12;
            
            // Organic turbulence
            float organic = (fbm(pos.xy * 0.045 + uTime * 0.02) - 0.5) * 0.5;
            
            // Combine waves
            float elevation = (wave1 * 1.0 + wave2 * 0.7 + wave3 * 0.45) * uWaveAmplitude + 
                              ripple + organic;
            
            // Mouse interaction
            float mouseInfluence = sin(pos.x * 0.09 + uMouseX * 4.0) * 
                                   cos(pos.y * 0.09 + uMouseY * 4.0) * 0.5;
            elevation += mouseInfluence;

            // Depth calculation (normalized Y position)
            vDepth = (pos.y + ${gridParams.height / 2}.0) / ${gridParams.height}.0;
            
            // Depth-based attenuation for perspective
            float depthAtten = smoothstep(0.0, 0.92, 1.0 - vDepth);
            depthAtten = pow(depthAtten, 2.2);
            elevation *= depthAtten;

            pos.z += elevation;
            vElevation = elevation;
            
            // Calculate surface normal
            float delta = 0.1;
            vec3 tangentX = vec3(delta, 0.0, 
                (sin((pos.x + delta) * uWaveFrequency * 0.8 + uTime * uWaveSpeed) *
                 cos(pos.y * uWaveFrequency * 0.6 + uTime * uWaveSpeed * 0.7) * 
                 uWaveAmplitude * depthAtten) - elevation);
            vec3 tangentY = vec3(0.0, delta,
                (sin(pos.x * uWaveFrequency * 0.8 + uTime * uWaveSpeed) *
                 cos((pos.y + delta) * uWaveFrequency * 0.6 + uTime * uWaveSpeed * 0.7) * 
                 uWaveAmplitude * depthAtten) - elevation);
            
            vNormal = normalize(cross(tangentX, tangentY));

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

	const fragmentShader = `
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
            // Enhanced depth fade
            float depthFade = smoothstep(0.0, uDepthFade, 1.0 - vDepth);
            depthFade = pow(depthFade, 2.5);
            
            // Elevation-based glow
            float elevationGlow = smoothstep(0.5, 2.5, abs(vElevation)) * 1.3;
            
            // Multi-frequency shimmer
            float shimmer = sin(uTime * 2.5 + vUv.x * 10.0 + vUv.y * 8.0) * 
                           cos(uTime * 3.0 + vUv.y * 12.0) * 0.18 + 0.82;
            
            // Fresnel effect
            vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
            float edgeGlow = fresnel * 0.95;
            
            // Rim lighting on wave peaks
            float rimLight = smoothstep(1.2, 2.8, vElevation) * fresnel * 0.85;
            
            // Combine lighting
            float totalGlow = clamp(
                elevationGlow * 0.65 + 
                edgeGlow * 0.75 + 
                rimLight * 0.6, 
                0.0, 1.0
            );
            totalGlow *= shimmer;
            
            // Color mixing
            vec3 finalColor = mix(uWireColor, uAccent, totalGlow * 0.92);
            
            // Brighten peaks
            if (vElevation > 1.8) {
                finalColor = mix(finalColor, uAccent * 1.25, 0.55);
            }
            
            // Dynamic opacity
            float alpha = uWireOpacity * depthFade * (0.6 + totalGlow * 0.5);
            
            // Extra boost for extreme peaks
            if (vElevation > 2.3) {
                alpha += 0.28;
                finalColor += uAccent * 0.35;
            }
            
            if (alpha <= 0.01) discard;
            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

	return (
		<group
			ref={meshRef}
			position={[0, -12, -18]}
			rotation={[THREE.MathUtils.degToRad(-18), 0, 0]}
		>
			<mesh renderOrder={0}>
				<planeGeometry
					args={[
						gridParams.width,
						gridParams.height,
						gridParams.segs,
						gridParams.segs * 0.7,
					]}
				/>
				<shaderMaterial
					ref={wireMatRef}
					uniforms={uniforms}
					transparent={true}
					depthWrite={false}
					wireframe={true}
					side={THREE.DoubleSide}
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
				/>
			</mesh>
		</group>
	);
};

// Floating Logo Component
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

	const logoScales = {
		mobile: 0.24,
		'tablet-sm': 0.28,
		tablet: 0.32,
		desktop: 0.36,
		'desktop-lg': 0.4,
	};

	const frac = logoScales[breakpoint] || 0.32;

	const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
	const scaleXY = useMemo(() => {
		const dist = Math.abs(-10 - (camera?.position?.z ?? 5));
		const worldH = 2 * Math.tan(THREE.MathUtils.degToRad((camera?.fov ?? 60) / 2)) * dist;
		const h = clamp(worldH * frac, 6, 22);
		return [h * aspect, h];
	}, [camera?.fov, camera?.position?.z, aspect, frac]);

	useEffect(() => {
		if (base.current) base.current.scale.set(scaleXY[0], scaleXY[1], 1);
	}, [scaleXY]);

	return (
		<group ref={base} position={[0, 0, -10]} renderOrder={1}>
			<mesh>
				<planeGeometry args={[1, 1]} />
				<meshBasicMaterial map={texture} transparent depthWrite={false} />
			</mesh>
		</group>
	);
};

// Main Background Component
const Background3D = () => {
	const theme = useTheme();
	const { breakpoint } = useResponsive();

	const [webglOk, setWebglOk] = useState(true);
	useEffect(() => {
		setWebglOk(isWebGLAvailable());
	}, []);

	const cameraConfig = useMemo(() => {
		const configs = {
			mobile: { position: [0, 1, 12], fov: 80 },
			'tablet-sm': { position: [0, 1, 10], fov: 75 },
			tablet: { position: [0, 1, 8], fov: 70 },
			desktop: { position: [0, 1, 7], fov: 65 },
			'desktop-lg': { position: [0, 1, 6], fov: 62 },
		};
		return configs[breakpoint] || { position: [0, 1, 7], fov: 65 };
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
