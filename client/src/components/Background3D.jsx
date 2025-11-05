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

// Enhanced grid positioned at the bottom with better responsiveness
const Grid = ({ theme, breakpoint, dimensions }) => {
	const meshRef = useRef();
	const materialRef = useRef();

	const prefersReduced = useMemo(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}, []);

	const uniforms = useMemo(() => {
		const isLight = theme === 'light';

		// Enhanced color scheme for better background visibility
		const minorHex = isLight ? '#e2e8f0' : '#334155'; // slate-200 / slate-700
		const majorHex = isLight ? '#cbd5e1' : '#475569'; // slate-300 / slate-600
		const accentHex = readCssVar('--accent-1');

		// Responsive grid sizing based on screen size
		const gridSizes = {
			mobile: 18.0,
			'tablet-sm': 20.0,
			tablet: 22.0,
			desktop: 24.0,
			'desktop-lg': 26.0,
		};

		// Grid positioning - always at bottom with adaptive height
		const gridHeight = {
			mobile: 0.35,
			'tablet-sm': 0.32,
			tablet: 0.3,
			desktop: 0.28,
			'desktop-lg': 0.26,
		};

		const gridSize = gridSizes[breakpoint] || 24.0;
		const heightFactor = gridHeight[breakpoint] || 0.3;

		return {
			uTime: { value: 0 },
			uMinorColor: { value: new THREE.Color(minorHex) },
			uMajorColor: { value: new THREE.Color(majorHex) },
			uAccentColor: { value: new THREE.Color(accentHex) },
			uMinorSize: { value: gridSize },
			uMajorEvery: { value: 5.0 },
			uMinorWidth: { value: 0.01 },
			uMajorWidth: { value: 0.02 },
			uFadeNear: { value: 0.1 },
			uFadeFar: { value: 0.9 },
			// Slightly clearer lines while still subtle
			uMinorAlpha: { value: isLight ? 0.16 : 0.24 },
			uMajorAlpha: { value: isLight ? 0.3 : 0.4 },
			uAccentAlpha: { value: isLight ? 0.06 : 0.09 },
			uSpeed: { value: prefersReduced ? 0.0 : 0.012 },
			uClothFreq: { value: 1.8 },
			uClothAmp: { value: 0.04 },
			uWaveAmp: { value: breakpoint === 'mobile' ? 0.15 : 0.25 },
			uWaveFreq: { value: 0.12 },
			uWaveSpeed: { value: prefersReduced ? 0.0 : 0.25 },
			uHeightFactor: { value: heightFactor },
			uAspectRatio: { value: dimensions.width / dimensions.height },
		};
	}, [theme, prefersReduced, breakpoint, dimensions]);

	useFrame((state) => {
		if (materialRef.current) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<mesh ref={meshRef} position={[0, -14, -15]} renderOrder={-2}>
			<planeGeometry args={[140, 60, 320, 160]} />
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
                    uniform float uHeightFactor;
                    uniform float uAspectRatio;
                    
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    varying float vElevation;
                    
                    void main() {
                        vUv = uv;
                        
                        // Position grid at bottom
                        vec3 pos = position;
                        pos.y += 12.0; // Adjust vertical position
                        
                        // Cloth-like texture displacement
                        float cloth = sin(pos.x * uClothFreq + uTime * uSpeed) * 
                                     cos(pos.y * uClothFreq * 1.2 + uTime * uSpeed * 0.8) * uClothAmp;
                        
                        // Subtle wavy motion
                        float wave1 = sin(pos.x * uWaveFreq + uTime * uWaveSpeed) * uWaveAmp;
                        float wave2 = cos(pos.y * uWaveFreq * 0.7 + uTime * uWaveSpeed * 1.1) * uWaveAmp * 0.4;
                        
                        float elevation = cloth + wave1 + wave2;
                        pos.z += elevation;
                        
                        vPosition = pos;
                        vElevation = elevation;
                        
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
                    uniform float uHeightFactor;

                    varying vec2 vUv;
                    varying vec3 vPosition;
                    varying float vElevation;

                    void main() {
                        vec2 coord = vPosition.xy;

                        // Grid lines
                        vec2 grid = abs(fract(coord / uMinorSize - 0.5) - 0.5) * 2.0;
                        float minor = smoothstep(0.0, 1.0, 1.0 - min(grid.x, grid.y) / uMinorWidth);

                        vec2 majorCoord = coord / (uMinorSize * uMajorEvery);
                        vec2 majorGrid = abs(fract(majorCoord - 0.5) - 0.5) * 2.0;
                        float major = smoothstep(0.0, 1.0, 1.0 - min(majorGrid.x, majorGrid.y) / uMajorWidth);

                        // Elevation-based accent - very subtle for background
                        float accentGlow = smoothstep(-0.2, 0.2, vElevation) * uAccentAlpha;

                        vec3 minorTint = mix(uMinorColor, uAccentColor, accentGlow * 0.3);
                        vec3 majorTint = mix(uMajorColor, uAccentColor, accentGlow * 0.4);

                        vec3 color = minorTint * minor * uMinorAlpha + majorTint * major * uMajorAlpha;
                        float alpha = (minor * uMinorAlpha + major * uMajorAlpha + accentGlow * 0.2);

                        // Bottom-only mask with smooth fade
                        float verticalMask = 1.0 - smoothstep(uHeightFactor - 0.1, uHeightFactor + 0.1, vUv.y);
                        alpha *= verticalMask;

                        // Very subtle depth enhancement
                        alpha *= 0.98 + vElevation * 0.02;

                        // Ensure clean edges
                        if (alpha <= 0.001) discard;
                        gl_FragColor = vec4(color, alpha);
                    }
                `}
			/>
		</mesh>
	);
};

// Subtle radial glows for background ambiance
const RadialGlow = ({
	position = [0, 0, -30],
	size = [120, 120],
	color = '#fff',
	opacity = 0.1,
	intensity = 1.0,
}) => {
	const uniforms = useMemo(
		() => ({
			uColor: { value: new THREE.Color(color) },
			uOpacity: { value: opacity },
			uIntensity: { value: intensity },
		}),
		[color, opacity, intensity]
	);

	return (
		<mesh position={position} renderOrder={-3}>
			<planeGeometry args={size} />
			<shaderMaterial
				transparent
				blending={THREE.AdditiveBlending}
				depthWrite={false}
				uniforms={uniforms}
				vertexShader={`
                    varying vec2 vUv;
                    void main(){
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
				fragmentShader={`
                    uniform vec3 uColor;
                    uniform float uOpacity;
                    uniform float uIntensity;
                    varying vec2 vUv;
                    
                    void main(){
                        vec2 p = vUv - 0.5;
                        float d = length(p) * 2.0;
                        
                        // Very smooth falloff for background
                        float a = pow(1.0 - smoothstep(0.0, 1.0, d), 2.0) * uIntensity;
                        
                        gl_FragColor = vec4(uColor, a * uOpacity);
                    }
                `}
			/>
		</mesh>
	);
};

const Glows = ({ theme }) => {
	const accent1 = useMemo(() => readCssVar('--accent-1'), []);
	const accent2 = useMemo(() => readCssVar('--accent-2'), []);
	const isLight = theme === 'light';

	return (
		<>
			{/* Primary glow - very subtle for background */}
			<RadialGlow
				position={[0, 8, -28]}
				size={[180, 180]}
				color={accent1}
				opacity={isLight ? 0.06 : 0.09}
				intensity={1.0}
			/>
			{/* Secondary glow - even more subtle */}
			<RadialGlow
				position={[35, 12, -35]}
				size={[220, 220]}
				color={accent2}
				opacity={isLight ? 0.03 : 0.05}
				intensity={0.7}
			/>
			{/* Bottom accent glow */}
			<RadialGlow
				position={[0, -15, -20]}
				size={[160, 80]}
				color={accent1}
				opacity={isLight ? 0.02 : 0.04}
				intensity={0.5}
			/>
		</>
	);
};

// Enhanced logo with better positioning and clarity
const EnhancedLogo = ({ breakpoint }) => {
	const base = useRef();
	const anim = useRef();
	const texture = useTexture(logo);
	const theme = useTheme();
	const isLight = theme === 'light';

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

	// Responsive logo sizing with more breakpoints
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
	}, [camera?.fov, camera?.position?.z, aspect, frac, targetZ]);

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

		// Responsive parallax effects
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

	const haloColor = readCssVar('--accent-1');

	const uniforms = useMemo(
		() => ({
			uMap: { value: texture ?? null },
			uTime: { value: 0 },
			uOpacity: { value: 1.0 },
			uSheen: { value: prefersReduced ? 0.0 : 0.1 },
			uVignette: { value: isLight ? 0.06 : 0.09 },
		}),
		[texture, isLight, prefersReduced]
	);

	useFrame((state) => {
		if (uniforms.uTime) {
			uniforms.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<group ref={base} position={[0, 0, 0]} renderOrder={-1}>
			<group ref={anim}>
				{/* Subtle halo for background context */}
				<mesh position={[0, 0, targetZ - 0.5]}>
					<planeGeometry args={[1.2, 1.2]} />
					<shaderMaterial
						transparent
						blending={THREE.AdditiveBlending}
						depthWrite={false}
						uniforms={{
							uColor: { value: new THREE.Color(haloColor) },
							uOpacity: { value: isLight ? 0.05 : 0.08 },
							uIntensity: { value: 1.2 },
						}}
						vertexShader={`
                            varying vec2 vUv;
                            void main(){
                                vUv = uv;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `}
						fragmentShader={`
                            uniform vec3 uColor;
                            uniform float uOpacity;
                            uniform float uIntensity;
                            varying vec2 vUv;
                            
                            void main(){
                                vec2 p = vUv - 0.5;
                                float r = length(p) * 2.0;
                                float a = pow(1.0 - smoothstep(0.0, 1.0, r), 2.0) * uIntensity;
                                gl_FragColor = vec4(uColor, a * uOpacity);
                            }
                        `}
					/>
				</mesh>

				{/* Clean logo with subtle effects */}
				<mesh position={[0, 0, targetZ]}>
					<planeGeometry args={[1, 1]} />
					<shaderMaterial
						transparent
						depthWrite={false}
						uniforms={uniforms}
						vertexShader={`
                            varying vec2 vUv;
                            void main(){
                                vUv = uv;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `}
						fragmentShader={`
                            precision highp float;
                            uniform sampler2D uMap;
                            uniform float uTime;
                            uniform float uOpacity;
                            uniform float uSheen;
                            uniform float uVignette;
                            varying vec2 vUv;

                            float band(float x, float c, float w){
                                return smoothstep(c - w, c, x) * (1.0 - smoothstep(c, c + w, x));
                            }

                            void main(){
                                vec4 tex = texture2D(uMap, vUv);
                                if (tex.a < 0.01) discard;

                                vec2 p = vUv - 0.5;
                                float r = length(p) * 2.0;
                                
                                // Subtle edge vignette
                                float edge = 1.0 - smoothstep(0.6, 1.1, r) * uVignette;

                                // Minimal sheen effect for background
                                float sweepCenter = fract(uTime * 0.03);
                                float diag = (vUv.x * 0.6 + vUv.y * 0.4);
                                float sweep = band(diag, sweepCenter, 0.06) * uSheen;
                                
                                vec3 color = tex.rgb + vec3(sweep) * 0.8;
                                
                                // Clean color presentation
                                color = mix(color, color * 1.02, edge * 0.2);

                                gl_FragColor = vec4(color, tex.a * edge * uOpacity);
                            }
                        `}
					/>
				</mesh>
			</group>
		</group>
	);
};

// Main component orchestrator
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
			mobile: { position: [0, 0, 5], fov: 70 },
			'tablet-sm': { position: [0, 0, 5], fov: 68 },
			tablet: { position: [0, 0, 5], fov: 64 },
			desktop: { position: [0, 0, 5], fov: 60 },
			'desktop-lg': { position: [0, 0, 5], fov: 58 },
		};
		return configs[breakpoint] || { position: [0, 0, 5], fov: 60 };
	}, [breakpoint]);

	const baseGradient =
		// Cleaner theme-driven background
		`radial-gradient(ellipse 120% 70% at 50% -12%, var(--bg-soft) 0%, var(--bg-base) 72%)`;

	const showFallback = !webglOk || ctxLost;
	// Lighter CSS preview so WebGL graphics are fully visible
	const cssPreviewOpacity = showFallback ? 0.9 : ready ? 0.08 : 0.35;

	return (
		<div
			className="fixed inset-0 -z-10 overflow-hidden"
			aria-hidden="true"
			style={{ background: baseGradient }}
		>
			{/* Clean CSS preview with bottom-only grid */}
			<div
				className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out"
				style={{ opacity: cssPreviewOpacity }}
			>
				{/* Removed extra glow layers for a cleaner base */}
				<div
					className="absolute bottom-0 left-0 right-0 pointer-events-none animate-grid-flow"
					style={{
						height: '42%',
						backgroundImage: `
                            linear-gradient(to right, ${
								theme === 'light'
									? 'rgba(148,163,184,0.10)'
									: 'rgba(71,85,105,0.12)'
							} 1px, transparent 1px),
                            linear-gradient(to bottom, ${
								theme === 'light'
									? 'rgba(148,163,184,0.10)'
									: 'rgba(71,85,105,0.12)'
							} 1px, transparent 1px)
                        `,
						backgroundSize: '28px 28px',
						// Gentle fade at the top of the preview grid
						maskImage: 'linear-gradient(to top, black 75%, transparent 100%)',
						WebkitMaskImage: 'linear-gradient(to top, black 75%, transparent 100%)',
					}}
				/>
			</div>

			{/* WebGL scene */}
			{!showFallback && (
				<Canvas
					camera={cameraConfig}
					style={{ position: 'absolute', inset: 0 }}
					gl={{
						antialias: true,
						alpha: true,
						powerPreference: 'high-performance',
						precision: 'highp',
						stencil: false,
					}}
					dpr={[1, Math.min(2, window.devicePixelRatio || 2)]}
					eventSource={typeof window !== 'undefined' ? document.body : undefined}
					eventPrefix="client"
					onCreated={({ gl }) => {
						gl.setClearColor(0x000000, 0);
						gl.outputColorSpace = THREE.SRGBColorSpace;
						gl.toneMapping = THREE.ACESFilmicToneMapping;
						gl.toneMappingExposure = 1.0;

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
					{/* Keep subtle ambient glows + bottom grid under the logo */}
					<Glows theme={theme} />
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
