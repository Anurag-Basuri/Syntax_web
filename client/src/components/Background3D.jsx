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

// ** UPDATED Grid Component **
const Grid = ({ theme, breakpoint }) => {
	const meshRef = useRef();
	const wireMatRef = useRef();

	const prefersReduced = useMemo(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}, []);

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

	// **CHANGE:** segsY adjusted to new plane height (50) to keep cells square
	// (Width 120 / segs) should equal (Height 50 / segsY)
	// 120 / (gridSize * 1.5) = 80 / gridSize
	// 50 / (gridSize * (50/80)) = 80 / gridSize
	const segs = Math.max(8, Math.floor(gridSize * 1.5));
	const segsY = Math.max(6, Math.floor(gridSize * 0.625)); // 0.625 = 50 / 80

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			// **CHANGE:** Increased amplitude for a stronger 3D effect
			uWaveAmplitude: { value: breakpoint === 'mobile' ? 0.8 : 1.2 },
			uWaveFrequency: { value: 0.09 },
			uWaveSpeed: { value: prefersReduced ? 0.0 : 0.45 },
			uDepthFade: { value: 0.95 },
			uWireOpacity: { value: theme === 'light' ? 0.4 : 0.6 },
			uWireColor: { value: new THREE.Color(theme === 'light' ? '#cbd5e1' : '#334155') },
			uAccent: { value: new THREE.Color(readCssVar('--accent-1')) },
		}),
		[theme, prefersReduced, breakpoint]
	);

	useFrame((state) => {
		const t = state.clock.elapsedTime;
		if (wireMatRef.current) wireMatRef.current.uniforms.uTime.value = t;
	});

	const vertexShader = `
        uniform float uTime;
        uniform float uWaveAmplitude;
        uniform float uWaveFrequency;
        uniform float uWaveSpeed;

        varying vec2 vUv;
        varying float vElevation;
        varying float vDepth;

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

            float wave = sin(pos.x * uWaveFrequency + uTime * uWaveSpeed) *
                         cos(pos.y * uWaveFrequency * 0.75 + uTime * uWaveSpeed * 0.9) * uWaveAmplitude;
            float small = sin(pos.x * uWaveFrequency * 3.2 + uTime * uWaveSpeed * 1.8) * 0.12;
            float n = (noise((pos.xy) * 0.08 + uTime * 0.03) - 0.5) * 0.18;

            float elevation = wave + small + n;

            // **CHANGE:** vDepth calculation updated for new plane height (50)
            // Plane height is 50, so pos.y ranges from -25 to 25
            vDepth = (pos.y + 25.0) / 50.0; // Maps -25 -> 0.0 and 25 -> 1.0

            elevation *= smoothstep(0.0, 0.9, 1.0 - vDepth); // Attenuates waves near the top edge

            pos.z += elevation;

            vElevation = elevation;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

	return (
		<group
			ref={meshRef}
			// **CHANGE:** Positioned lower so its top edge (-25 + 25*cos) is just below logo (y=0)
			position={[0, -25, -12]}
			rotation={[THREE.MathUtils.degToRad(-12), 0, 0]}
		>
			<mesh renderOrder={0}>
				{/* **CHANGE:** Height changed from 80 to 50, segsY updated */}
				<planeGeometry args={[120, 50, segs, segsY]} />
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
                        
                        void main(){
                            float depthFade = smoothstep(0.0, uDepthFade, 1.0 - vDepth);
                            
                            float glowFactor = smoothstep(0.0, 0.4, abs(vElevation)) * 0.5;
                            glowFactor += sin(uTime * 3.0 + vUv.x * 5.0) * 0.2 + 0.3;
                            glowFactor = clamp(glowFactor, 0.0, 1.0);

                            vec3 finalColor = mix(uWireColor, uAccent, glowFactor);
                            
                            float alpha = uWireOpacity * depthFade * (0.8 + glowFactor * 0.2);
                            
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
			mobile: { position: [0, 0, 8], fov: 75 },
			'tablet-sm': { position: [0, 0, 7], fov: 70 },
			tablet: { position: [0, 0, 6], fov: 65 },
			desktop: { position: [0, 0, 5], fov: 60 },
			'desktop-lg': { position: [0, 0, 5], fov: 58 },
		};
		return configs[breakpoint] || { position: [0, 0, 5], fov: 60 };
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
