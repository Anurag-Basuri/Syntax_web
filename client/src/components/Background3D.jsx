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
 * Ultra-Enhanced Grid Component with Advanced 3D Wave Effects
 */
const Grid = ({ theme, breakpoint }) => {
	const meshRef = useRef();
	const wireMatRef = useRef();

	const prefersReduced = useMemo(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}, []);

	// Enhanced responsive grid dimensions with higher segment count
	const gridParams = useMemo(() => {
		const configs = {
			mobile: { width: 100, height: 60, segs: 80 },
			'tablet-sm': { width: 120, height: 70, segs: 90 },
			tablet: { width: 140, height: 80, segs: 100 },
			desktop: { width: 160, height: 90, segs: 110 },
			'desktop-lg': { width: 180, height: 100, segs: 120 },
		};
		return configs[breakpoint] || configs.desktop;
	}, [breakpoint]);

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uWaveAmplitude: { value: breakpoint === 'mobile' ? 3.5 : 5.0 },
			uWaveFrequency: { value: 0.055 },
			// wave speed kept elevated but respects reduced motion
			uWaveSpeed: { value: prefersReduced ? 0.0 : 0.38 },
			uDepthFade: { value: 0.92 }, // slightly increased so distant grid fades more
			// lowered opacity because this should be a subtle background
			uWireOpacity: { value: theme === 'light' ? 0.45 : 0.55 }, // lowered from 1.0 / 1.2
			uWireColor: { value: new THREE.Color(theme === 'light' ? '#94a3b8' : '#64748b') },
			uAccent: { value: new THREE.Color(readCssVar('--accent-1')) },
			// global fade to control overall visibility (easier tweak)
			uGlobalFade: { value: theme === 'light' ? 0.7 : 0.75 },
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

				// Smooth mouse tracking with enhanced influence
				wireMatRef.current.uniforms.uMouseX.value = THREE.MathUtils.lerp(
					wireMatRef.current.uniforms.uMouseX.value,
					pointer.x * 0.6,
					0.05
				);
				wireMatRef.current.uniforms.uMouseY.value = THREE.MathUtils.lerp(
					wireMatRef.current.uniforms.uMouseY.value,
					pointer.y * 0.5,
					0.05
				);

				// Enhanced 3D tilt with more dramatic angles
				const targetRotX = THREE.MathUtils.degToRad(-22 + pointer.y * 8);
				const targetRotY = THREE.MathUtils.degToRad(pointer.x * 9);

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
        varying vec3 vWorldPos;
        
        // Enhanced noise functions for more organic movement
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
            float frequency = 1.0;
            for(int i = 0; i < 6; i++) {
                value += amplitude * noise(p * frequency);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vUv = uv;
            vec3 pos = position;

            // Complex multi-layered wave system
            float wave1 = sin(pos.x * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.9) *
                          cos(pos.y * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.7);
            
            float wave2 = sin(pos.x * uWaveFrequency * 1.4 + uTime * uWaveSpeed * 1.3) *
                          cos(pos.y * uWaveFrequency * 1.1 + uTime * uWaveSpeed * 0.95);
            
            float wave3 = sin(pos.x * uWaveFrequency * 2.1 + uTime * uWaveSpeed * 1.6) *
                          sin(pos.y * uWaveFrequency * 1.8 + uTime * uWaveSpeed * 1.35);
            
            float wave4 = cos(pos.x * uWaveFrequency * 3.2 + uTime * uWaveSpeed * 2.0) *
                          sin(pos.y * uWaveFrequency * 2.5 + uTime * uWaveSpeed * 1.7);
            
            // Fine ripple details
            float ripple = sin(pos.x * uWaveFrequency * 6.0 + uTime * uWaveSpeed * 3.2) *
                           sin(pos.y * uWaveFrequency * 5.2 + uTime * uWaveSpeed * 2.8) * 0.15;
            
            // Organic turbulence with more octaves
            float organic = (fbm(pos.xy * 0.04 + uTime * 0.015) - 0.5) * 0.8;
            
            // Directional waves for more dynamic movement
            float diagonal1 = sin((pos.x + pos.y) * uWaveFrequency * 0.8 + uTime * uWaveSpeed * 1.1) * 0.3;
            float diagonal2 = cos((pos.x - pos.y) * uWaveFrequency * 0.9 + uTime * uWaveSpeed * 1.2) * 0.25;
            
            // Combine all wave layers with varying weights
            float elevation = (wave1 * 1.0 + wave2 * 0.75 + wave3 * 0.5 + wave4 * 0.3) * uWaveAmplitude + 
                              ripple + organic + diagonal1 + diagonal2;
            
            // Enhanced mouse interaction with radial influence
            vec2 mousePos = vec2(uMouseX, uMouseY) * 30.0;
            float mouseDist = length(pos.xy - mousePos);
            float mouseInfluence = sin(mouseDist * 0.15 - uTime * 2.0) * 
                                   exp(-mouseDist * 0.05) * 1.2;
            elevation += mouseInfluence;

            // Enhanced depth calculation
            vDepth = (pos.y + ${gridParams.height / 2}.0) / ${gridParams.height}.0;
            
            // Improved depth-based attenuation for stronger perspective
            float depthAtten = smoothstep(0.0, 0.95, 1.0 - vDepth);
            depthAtten = pow(depthAtten, 1.8);
            elevation *= depthAtten;

            pos.z += elevation;
            vElevation = elevation;
            vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
            
            // Calculate surface normal for advanced lighting
            float delta = 0.08;
            float elevX = (sin((pos.x + delta) * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.9) *
                          cos(pos.y * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.7) * uWaveAmplitude * depthAtten);
            float elevY = (sin(pos.x * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.9) *
                          cos((pos.y + delta) * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.7) * uWaveAmplitude * depthAtten);
            
            vec3 tangentX = vec3(delta, 0.0, elevX - elevation);
            vec3 tangentY = vec3(0.0, delta, elevY - elevation);
            
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
        uniform float uGlobalFade; // added
       
        varying vec2 vUv;
        varying float vDepth;
        varying float vElevation;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        
        void main() {
            // Enhanced exponential depth fade but more aggressive to push grid back
            float depthFade = smoothstep(0.0, uDepthFade, 1.0 - vDepth);
            depthFade = pow(depthFade, 2.2);

            // Reduce glow strengths so peaks don't become too prominent
            float elevationGlow = smoothstep(1.0, 3.5, abs(vElevation)) * 0.9;
            float peakGlow = smoothstep(3.5, 5.5, abs(vElevation)) * 1.0;
            
            // Softer shimmer (lower amplitude)
            float shimmer1 = sin(uTime * 2.2 + vUv.x * 8.0 + vUv.y * 6.0) * 0.08 + 0.92;
            float shimmer2 = cos(uTime * 2.6 + vUv.y * 10.0 + vWorldPos.z * 1.2) * 0.06 + 0.94;
            float shimmer = shimmer1 * shimmer2;
            
            // Fresnel-based edge highlight (kept subtle)
            vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
            float edgeGlow = fresnel * 0.9;
            
            float rimLight = smoothstep(2.0, 4.5, vElevation) * fresnel * 0.6;
            
            float depthColor = vDepth * 0.2;
            
            // Combine lighting factors with reduced weights
            float totalGlow = clamp(
                elevationGlow * 0.5 + 
                peakGlow * 0.35 +
                edgeGlow * 0.5 + 
                rimLight * 0.4, 
                0.0, 1.0
            );
            totalGlow *= shimmer;
            
            // Subtle color mixing
            vec3 baseColor = mix(uWireColor, uWireColor * 1.08, depthColor);
            vec3 finalColor = mix(baseColor, uAccent * 0.6, totalGlow * 0.6);
            
            // Peak highlight softened
            if (vElevation > 2.5) {
                float peakFactor = smoothstep(2.5, 4.5, vElevation);
                finalColor = mix(finalColor, uAccent * 1.1, peakFactor * 0.35);
            }
            
            // Make alpha more muted for background use:
            // apply global fade and reduce multiplier so grid is less prominent
            float alpha = uWireOpacity * uGlobalFade * depthFade * (0.60 + totalGlow * 0.25); // reduced base

            // Moderate extra boost for extreme peaks (reduced)
            if (vElevation > 3.5) {
                alpha += 0.35; // reduced from 0.6
                finalColor += uAccent * 0.25;
            }
            
            // Lower minimum visibility for near grid to keep it unobtrusive
            if (vDepth < 0.3) {
                alpha = max(alpha, uWireOpacity * 0.6); // reduced minimum
            }
            
            // Discard very faint fragments
            if (alpha <= 0.01) discard;
            gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.9));
        }
    `;

	return (
		<group
			ref={meshRef}
			position={[0, -14, -20]}
			rotation={[THREE.MathUtils.degToRad(-22), 0, 0]}
		>
			<mesh renderOrder={0}>
				<planeGeometry
					args={[
						gridParams.width,
						gridParams.height,
						gridParams.segs,
						gridParams.segs * 0.75,
					]}
				/>
				<shaderMaterial
					ref={wireMatRef}
					uniforms={uniforms}
					transparent={true}
					depthWrite={false}
					// ensure not tone-mapped and blending stays subtle
					toneMapped={false}
					side={THREE.DoubleSide}
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
				/>
			</mesh>
		</group>
	);
};

// Floating Logo Component
const FloatingLogo = ({ breakpoint, logoOpacity = 0.32 }) => {
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
				{/* lowered opacity so logo is unobtrusive */}
				<meshBasicMaterial
					map={texture}
					transparent
					depthWrite={false}
					opacity={logoOpacity}
				/>
			</mesh>
		</group>
	);
};

// Main Background Component
const Background3D = () => {
	const theme = useTheme();
	const { breakpoint } = useResponsive();

	// reduce overall background prominence (tweak values to taste)
	const backgroundOpacity = useMemo(() => (theme === 'light' ? 0.55 : 0.6), [theme]);
	// logo-specific opacity (much lower so logo doesn't draw attention)
	const logoOpacity = useMemo(() => (theme === 'light' ? 0.28 : 0.32), [theme]);

	const [webglOk, setWebglOk] = useState(true);
	useEffect(() => {
		setWebglOk(isWebGLAvailable());
	}, []);

	const cameraConfig = useMemo(() => {
		const configs = {
			mobile: { position: [0, 0, 12], fov: 80 },
			'tablet-sm': { position: [0, 0, 10], fov: 75 },
			tablet: { position: [0, 0, 8], fov: 70 },
			desktop: { position: [0, 0, 7], fov: 65 },
			'desktop-lg': { position: [0, 0, 6], fov: 62 },
		};
		return configs[breakpoint] || { position: [0, 0, 7], fov: 65 };
	}, [breakpoint]);

	if (!webglOk) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 -z-10 overflow-hidden"
			aria-hidden="true"
			// apply a wrapper opacity so entire background (grid + logo) is visually muted
			style={{ opacity: backgroundOpacity }}
		>
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
				{/* pass opacity to Grid via theme/uniforms (uGlobalFade is set in Grid's uniforms) */}
				<Grid theme={theme} breakpoint={breakpoint} />
				<Suspense fallback={null}>
					{/* pass logoOpacity down by leveraging the existing FloatingLogo component's mesh material below */}
					<FloatingLogo breakpoint={breakpoint} logoOpacity={logoOpacity} />
				</Suspense>
			</Canvas>
		</div>
	);
};

export default Background3D;
