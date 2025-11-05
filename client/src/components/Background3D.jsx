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

// Enhanced professional grid with better color harmony
const Grid = ({ theme, breakpoint }) => {
	const meshRef = useRef();
	const materialRef = useRef();

	const prefersReduced = useMemo(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}, []);

	const uniforms = useMemo(() => {
		const isLight = theme === 'light';

		// Improved color scheme - better contrast and harmony
		const minorHex = isLight ? '#cbd5e1' : '#475569'; // slate-300 / slate-600
		const majorHex = isLight ? '#94a3b8' : '#64748b'; // slate-400 / slate-500
		const accentHex = readCssVar('--accent-1');

		// Responsive grid sizing
		const gridSize = breakpoint === 'mobile' ? 22.0 : breakpoint === 'tablet' ? 25.0 : 28.0;

		return {
			uTime: { value: 0 },
			uMinorColor: { value: new THREE.Color(minorHex) },
			uMajorColor: { value: new THREE.Color(majorHex) },
			uAccentColor: { value: new THREE.Color(accentHex) },
			uMinorSize: { value: gridSize },
			uMajorEvery: { value: 6.0 },
			uMinorWidth: { value: 0.012 },
			uMajorWidth: { value: 0.024 },
			uFadeNear: { value: 0.12 },
			uFadeFar: { value: 0.88 },
			uMinorAlpha: { value: isLight ? 0.18 : 0.28 },
			uMajorAlpha: { value: isLight ? 0.35 : 0.48 },
			uAccentAlpha: { value: isLight ? 0.08 : 0.12 },
			uSpeed: { value: prefersReduced ? 0.0 : 0.015 },
			// Enhanced cloth texture
			uClothFreq: { value: 1.5 },
			uClothAmp: { value: 0.06 },
			// Smooth wave motion
			uWaveAmp: { value: breakpoint === 'mobile' ? 0.2 : 0.35 },
			uWaveFreq: { value: 0.15 },
			uWaveSpeed: { value: prefersReduced ? 0.0 : 0.35 },
		};
	}, [theme, prefersReduced, breakpoint]);

	useFrame((state) => {
		if (materialRef.current) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<mesh ref={meshRef} position={[0, -1.5, -12]} renderOrder={-2}>
			<planeGeometry args={[120, 120, 320, 320]} />
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
                    
                    void main() {
                        vUv = uv;
                        
                        // Cloth-like texture displacement
                        vec3 pos = position;
                        float cloth = sin(pos.x * uClothFreq + uTime * uSpeed) * 
                                     cos(pos.y * uClothFreq * 1.2 + uTime * uSpeed * 0.8) * uClothAmp;
                        
                        // Smooth wavy motion
                        float wave1 = sin(pos.x * uWaveFreq + uTime * uWaveSpeed) * uWaveAmp;
                        float wave2 = cos(pos.y * uWaveFreq * 0.7 + uTime * uWaveSpeed * 1.1) * uWaveAmp * 0.6;
                        
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
                    
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    varying float vElevation;
                    
                    void main() {
                        vec2 coord = vPosition.xy;
                        
                        // Calculate grid lines with improved AA
                        vec2 grid = abs(fract(coord / uMinorSize - 0.5) - 0.5) * 2.0;
                        float minor = min(grid.x, grid.y) / uMinorWidth;
                        minor = smoothstep(0.0, 1.0, 1.0 - minor);
                        
                        // Major grid lines
                        vec2 majorCoord = coord / (uMinorSize * uMajorEvery);
                        vec2 majorGrid = abs(fract(majorCoord - 0.5) - 0.5) * 2.0;
                        float major = min(majorGrid.x, majorGrid.y) / uMajorWidth;
                        major = smoothstep(0.0, 1.0, 1.0 - major);
                        
                        // Center radial fade with improved falloff
                        float distFromCenter = length(vUv - 0.5) * 1.4;
                        float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, distFromCenter);
                        
                        // Elevation-based accent glow
                        float accentGlow = smoothstep(-0.3, 0.3, vElevation) * uAccentAlpha;
                        
                        // Compose colors with better blending
                        vec3 minorTint = mix(uMinorColor, uAccentColor, accentGlow * 0.5);
                        vec3 majorTint = mix(uMajorColor, uAccentColor, accentGlow * 0.7);
                        
                        vec3 color = minorTint * minor * uMinorAlpha + majorTint * major * uMajorAlpha;
                        float alpha = (minor * uMinorAlpha + major * uMajorAlpha + accentGlow * 0.3) * fade;
                        
                        // Subtle depth enhancement
                        alpha *= 0.95 + vElevation * 0.05;
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `}
			/>
		</mesh>
	);
};

// Enhanced radial glows with better color distribution
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
                        
                        // Smoother falloff with intensity control
                        float a = pow(1.0 - smoothstep(0.0, 1.0, d), 1.8) * uIntensity;
                        
                        gl_FragColor = vec4(uColor, a * uOpacity);
                    }
                `}
			/>
		</mesh>
	);
};

const Glows = ({ theme }) => {
	const accent1 = useMemo(() => readCssVar('--accent-1'), [theme]);
	const accent2 = useMemo(() => readCssVar('--accent-2'), [theme]);
	const isLight = theme === 'light';

	return (
		<>
			{/* Primary glow - larger, more subtle */}
			<RadialGlow
				position={[0, 4, -25]}
				size={[160, 160]}
				color={accent1}
				opacity={isLight ? 0.1 : 0.14}
				intensity={1.2}
			/>
			{/* Secondary glow - offset, complementary */}
			<RadialGlow
				position={[38, 10, -32]}
				size={[200, 200]}
				color={accent2}
				opacity={isLight ? 0.06 : 0.09}
				intensity={0.9}
			/>
			{/* Tertiary glow - subtle depth */}
			<RadialGlow
				position={[-25, -8, -28]}
				size={[140, 140]}
				color={accent1}
				opacity={isLight ? 0.04 : 0.06}
				intensity={0.7}
			/>
		</>
	);
};

// Enhanced logo with better lighting and effects
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
	const targetZ = -14;
	const frac = breakpoint === 'mobile' ? 0.38 : breakpoint === 'tablet' ? 0.34 : 0.3;
	const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
	const scaleXY = useMemo(() => {
		const dist = Math.abs(targetZ - (camera?.position?.z ?? 5));
		const worldH = 2 * Math.tan(THREE.MathUtils.degToRad((camera?.fov ?? 60) / 2)) * dist;
		const h = clamp(worldH * frac, 7, 22);
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

		const px = prefersReduced ? 0 : (breakpoint === 'mobile' ? 0.15 : 0.25) * pointer.x;
		const py = prefersReduced ? 0 : (breakpoint === 'mobile' ? 0.15 : 0.25) * pointer.y;

		anim.current.position.x = THREE.MathUtils.damp(anim.current.position.x, px, 4.5, 0.016);
		anim.current.position.y = THREE.MathUtils.damp(anim.current.position.y, py, 4.5, 0.016);

		const tiltX = prefersReduced ? 0 : THREE.MathUtils.degToRad(py * 2.0);
		const tiltY = prefersReduced ? 0 : THREE.MathUtils.degToRad(px * -2.5);
		anim.current.rotation.x = THREE.MathUtils.damp(anim.current.rotation.x, tiltX, 4.5, 0.016);
		anim.current.rotation.y = THREE.MathUtils.damp(anim.current.rotation.y, tiltY, 4.5, 0.016);

		const s = 1 + (prefersReduced ? 0 : Math.sin(t * 0.3) * 0.006);
		anim.current.scale.set(s, s, 1);
	});

	const haloColor = readCssVar('--accent-1');

	const uniforms = useMemo(
		() => ({
			uMap: { value: texture ?? null },
			uTime: { value: 0 },
			uOpacity: { value: 1.0 },
			uSheen: { value: prefersReduced ? 0.0 : 0.15 },
			uVignette: { value: isLight ? 0.08 : 0.12 },
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
				{/* Enhanced halo with better color */}
				<mesh position={[0, 0, targetZ - 0.6]}>
					<planeGeometry args={[1.3, 1.3]} />
					<shaderMaterial
						transparent
						blending={THREE.AdditiveBlending}
						depthWrite={false}
						uniforms={{
							uColor: { value: new THREE.Color(haloColor) },
							uOpacity: { value: isLight ? 0.08 : 0.11 },
							uIntensity: { value: 1.4 },
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
                                float a = pow(1.0 - smoothstep(0.0, 1.0, r), 2.2) * uIntensity;
                                gl_FragColor = vec4(uColor, a * uOpacity);
                            }
                        `}
					/>
				</mesh>

				{/* Logo with enhanced effects */}
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
                                
                                // Smoother edge vignette
                                float edge = 1.0 - smoothstep(0.6, 1.1, r) * uVignette;

                                // Enhanced sheen effect
                                float sweepCenter = fract(uTime * 0.04);
                                float diag = (vUv.x * 0.6 + vUv.y * 0.4);
                                float sweep = band(diag, sweepCenter, 0.08) * uSheen;
                                
                                vec3 color = tex.rgb + vec3(sweep) * 1.2;
                                
                                // Subtle color enhancement
                                color = mix(color, color * 1.05, edge * 0.3);

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
	const breakpoint = useResponsive();

	const [webglOk, setWebglOk] = useState(true);
	const [ctxLost, setCtxLost] = useState(false);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setWebglOk(isWebGLAvailable());
		const t = setTimeout(() => setReady(true), 600);
		return () => clearTimeout(t);
	}, []);

	const cameraConfig = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { position: [0, 0, 5], fov: 72 };
			case 'tablet':
				return { position: [0, 0, 5], fov: 65 };
			default:
				return { position: [0, 0, 5], fov: 58 };
		}
	}, [breakpoint]);

	const baseGradient =
		theme === 'light'
			? 'radial-gradient(ellipse 110% 65% at 50% -12%, #f8fafc 0%, #ffffff 70%)'
			: 'radial-gradient(ellipse 115% 68% at 50% -15%, #0f172a 0%, #0b1020 65%)';

	const showFallback = !webglOk || ctxLost;
	const cssPreviewOpacity = showFallback ? 0.95 : ready ? 0.2 : 0.55;

	return (
		<div
			className="fixed inset-0 -z-10 overflow-hidden"
			aria-hidden="true"
			style={{ background: baseGradient }}
		>
			{/* Enhanced CSS preview */}
			<div
				className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out"
				style={{ opacity: cssPreviewOpacity }}
			>
				{/* Multi-layer glow system */}
				<div
					className="absolute inset-0"
					style={{
						background:
							theme === 'light'
								? 'radial-gradient(850px 550px at 50% 0%, rgba(6, 182, 212, 0.08), transparent 65%)'
								: 'radial-gradient(950px 650px at 50% 0%, rgba(6, 182, 212, 0.12), transparent 70%)',
					}}
				/>
				<div
					className="absolute inset-0"
					style={{
						background:
							theme === 'light'
								? 'radial-gradient(1100px 700px at 70% -10%, rgba(99, 102, 241, 0.05), transparent 60%)'
								: 'radial-gradient(1200px 800px at 65% -15%, rgba(99, 102, 241, 0.08), transparent 65%)',
					}}
				/>

				{/* Enhanced grid pattern */}
				<div
					className="absolute inset-0 pointer-events-none animate-grid-flow"
					style={{
						backgroundImage: `
                            linear-gradient(to right, ${
								theme === 'light'
									? 'rgba(148, 163, 184, 0.08)'
									: 'rgba(71, 85, 105, 0.10)'
							} 1px, transparent 1px),
                            linear-gradient(to bottom, ${
								theme === 'light'
									? 'rgba(148, 163, 184, 0.08)'
									: 'rgba(71, 85, 105, 0.10)'
							} 1px, transparent 1px)
                        `,
						backgroundSize: '32px 32px',
						maskImage:
							'radial-gradient(ellipse 85% 70% at 50% -12%, black 20%, transparent 90%)',
						WebkitMaskImage:
							'radial-gradient(ellipse 85% 70% at 50% -12%, black 20%, transparent 90%)',
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
					dpr={[1, Math.min(2, window.devicePixelRatio || 1.5)]}
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
					<Glows theme={theme} />
					<Grid theme={theme} breakpoint={breakpoint} />
					<Suspense fallback={null}>
						<EnhancedLogo breakpoint={breakpoint} />
					</Suspense>
				</Canvas>
			)}

			{/* Enhanced bottom fade */}
			<div
				className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
				style={{
					background:
						theme === 'light'
							? 'linear-gradient(to top, #ffffff 25%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)'
							: 'linear-gradient(to top, #0b1020 30%, rgba(11, 16, 32, 0.7) 55%, transparent 100%)',
				}}
			/>

			{/* Refined noise texture */}
			<div
				className="absolute inset-0 pointer-events-none mix-blend-overlay"
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
					opacity: theme === 'light' ? 0.003 : 0.006,
				}}
			/>
		</div>
	);
};

export default Background3D;
