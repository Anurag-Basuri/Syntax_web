import React, { useRef, Suspense, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, useTexture, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import logo from '../assets/logo.png';

// Helper to get CSS variable and convert to THREE.Color
const getThemeColor = (varName) => {
	const colorStr = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
	return new THREE.Color(colorStr || '#000');
};

// Hook to detect current theme
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

// Responsive breakpoints hook
const useResponsive = () => {
	const [breakpoint, setBreakpoint] = useState('desktop');

	useEffect(() => {
		const updateBreakpoint = () => {
			const width = window.innerWidth;
			if (width < 640) setBreakpoint('mobile');
			else if (width < 1024) setBreakpoint('tablet');
			else setBreakpoint('desktop');
		};

		updateBreakpoint();
		window.addEventListener('resize', updateBreakpoint);
		return () => window.removeEventListener('resize', updateBreakpoint);
	}, []);

	return breakpoint;
};

// Clean 3D Logo with subtle animations
const Logo3D = () => {
	const meshRef = useRef();
	const groupRef = useRef();
	const texture = useTexture(logo);
	const { gl } = useThree();
	const breakpoint = useResponsive();

	useEffect(() => {
		if (!texture) return;
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = gl.capabilities.getMaxAnisotropy?.() || 16;
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.generateMipmaps = true;
		texture.needsUpdate = true;
	}, [texture, gl]);

	const aspect = texture?.image ? texture.image.width / texture.image.height : 1;

	const { scale, yPosition } = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { scale: 4.0, yPosition: 0.6 };
			case 'tablet':
				return { scale: 5.2, yPosition: 0.9 };
			default:
				return { scale: 6.8, yPosition: 1.2 };
		}
	}, [breakpoint]);

	useFrame((state) => {
		const pointer = state.pointer ?? { x: 0, y: 0 };
		const t = state.clock.elapsedTime;
		const dt = state.clock.getDelta();

		if (meshRef.current) {
			// Smooth pointer tracking
			const targetY = (pointer.x * Math.PI) / 10;
			const targetX = (-pointer.y * Math.PI) / 14;
			meshRef.current.rotation.y = THREE.MathUtils.damp(
				meshRef.current.rotation.y,
				targetY,
				5,
				dt
			);
			meshRef.current.rotation.x = THREE.MathUtils.damp(
				meshRef.current.rotation.x,
				targetX,
				5,
				dt
			);

			// Subtle rotation animation
			meshRef.current.rotation.z = Math.sin(t * 0.3) * 0.02;
		}

		if (groupRef.current) {
			// Floating animation
			groupRef.current.position.y = yPosition + Math.sin(t * 0.6) * 0.08;

			// Breathing scale animation
			const breathe = 1 + Math.sin(t * 0.5) * 0.015;
			groupRef.current.scale.set(breathe, breathe, 1);
		}
	});

	return (
		<Float
			speed={1.2}
			rotationIntensity={0.1}
			floatIntensity={0.15}
			floatingRange={[-0.03, 0.03]}
		>
			<group ref={groupRef} position={[0, yPosition, 0]}>
				<group ref={meshRef}>
					<mesh scale={[scale * aspect, scale, 1]} renderOrder={10}>
						<planeGeometry />
						<shaderMaterial
							transparent
							depthTest={false}
							depthWrite={false}
							side={THREE.DoubleSide}
							uniforms={{
								uMap: { value: texture },
								uOpacity: { value: 0.65 }, // Reduced opacity
								uAlphaTest: { value: 0.1 },
							}}
							vertexShader={`
                                varying vec2 vUv;
                                void main() {
                                    vUv = uv;
                                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                                }
                            `}
							fragmentShader={`
                                varying vec2 vUv;
                                uniform sampler2D uMap;
                                uniform float uOpacity;
                                uniform float uAlphaTest;

                                void main() {
                                    vec4 texColor = texture2D(uMap, vUv);
                                    if (texColor.a < uAlphaTest) discard;
                                    gl_FragColor = vec4(texColor.rgb, texColor.a * uOpacity);
                                }
                            `}
						/>
					</mesh>
				</group>
			</group>
		</Float>
	);
};

// Simple line-based mesh - clean and minimal
const LineMesh = ({ segments }) => {
	const meshRef = useRef();
	const theme = useTheme();
	const breakpoint = useResponsive();

	const uniforms = useMemo(() => {
		const accent1 = getThemeColor('--accent-1');
		const accent2 = getThemeColor('--accent-2');

		return {
			uTime: { value: 0 },
			uAmplitude: { value: breakpoint === 'mobile' ? 0.8 : 1.2 }, // Reduced height
			uFrequency: { value: 0.02 }, // Lower frequency for larger, squarer waves
			uSpeed: { value: 0.12 }, // Slower motion
			uColorStart: { value: accent1 },
			uColorEnd: { value: accent2 },
			uLineOpacity: { value: theme === 'light' ? 0.25 : 0.35 },
		};
	}, [theme, breakpoint]);

	useFrame((state) => {
		uniforms.uTime.value = state.clock.elapsedTime;

		// More responsive to pointer movement
		const pointerInfluence = (Math.abs(state.pointer.x) + Math.abs(state.pointer.y)) * 0.25;
		const targetAmp = (breakpoint === 'mobile' ? 0.8 : 1.2) + pointerInfluence;
		uniforms.uAmplitude.value = THREE.MathUtils.lerp(
			uniforms.uAmplitude.value,
			targetAmp,
			0.08 // Faster response
		);
	});

	const size = breakpoint === 'mobile' ? 240 : 320; // Larger mesh

	return (
		<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -9, 0]}>
			<planeGeometry args={[size, size, segments, segments]} />
			<shaderMaterial
				transparent
				side={THREE.DoubleSide}
				uniforms={uniforms}
				depthWrite={false}
				wireframe={true}
				vertexShader={`
                    uniform float uTime;
                    uniform float uAmplitude;
                    uniform float uFrequency;
                    uniform float uSpeed;
                    
                    varying vec2 vUv;
                    varying float vElevation;

                    // Square wave function
                    float squareWave(float x) {
                        return sign(sin(x));
                    }

                    void main() {
                        vUv = uv;
                        vec3 pos = position;
                        
                        // Create square waves in both directions
                        float waveX = squareWave(pos.x * uFrequency + uTime * uSpeed);
                        float waveY = squareWave(pos.y * uFrequency + uTime * uSpeed * 0.8);
                        
                        // Combine waves for checkerboard-like pattern
                        float combined = waveX * waveY;
                        
                        // Add subtle smoothing to avoid harsh edges
                        float smoothWave = smoothstep(-0.8, -0.6, combined) - smoothstep(0.6, 0.8, combined);
                        
                        vElevation = smoothWave * uAmplitude;
                        pos.z += vElevation;
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
				fragmentShader={`
                    varying vec2 vUv;
                    varying float vElevation;
                    uniform vec3 uColorStart;
                    uniform vec3 uColorEnd;
                    uniform float uLineOpacity;

                    void main() {
                        // Color gradient based on elevation
                        float mixFactor = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);
                        vec3 color = mix(uColorStart, uColorEnd, mixFactor);
                        
                        // Softer edge fade for larger mesh
                        float edgeFadeY = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
                        float edgeFadeX = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
                        float edgeFade = edgeFadeY * edgeFadeX;
                        
                        gl_FragColor = vec4(color, uLineOpacity * edgeFade);
                    }
                `}
			/>
		</mesh>
	);
};

// Minimal particle field
const ParticleField = ({ count, radius }) => {
	const ref = useRef();
	const theme = useTheme();

	const { positions, sizes } = useMemo(() => {
		const pos = new Float32Array(count * 3);
		const siz = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const r = radius * Math.cbrt(Math.random());

			pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
			pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
			pos[i * 3 + 2] = r * Math.cos(phi);

			siz[i] = 0.015 * (0.5 + Math.random() * 1.5);
		}
		return { positions: pos, sizes: siz };
	}, [count, radius]);

	useFrame((state, delta) => {
		if (!ref.current) return;
		ref.current.rotation.y += delta * 0.015;
	});

	const color = useMemo(() => getThemeColor('--accent-1'), [theme]);

	return (
		<points ref={ref}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					count={count}
					array={positions}
					itemSize={3}
				/>
				<bufferAttribute
					attach="attributes-size"
					count={count}
					array={sizes}
					itemSize={1}
				/>
			</bufferGeometry>
			<pointsMaterial
				size={0.015}
				transparent
				color={color}
				opacity={theme === 'light' ? 0.25 : 0.4}
				sizeAttenuation
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
};

// Simplified lighting
const SceneLights = () => {
	const theme = useTheme();
	const accent1 = useMemo(() => getThemeColor('--accent-1'), [theme]);
	const accent2 = useMemo(() => getThemeColor('--accent-2'), [theme]);

	return (
		<>
			<ambientLight intensity={theme === 'light' ? 1.0 : 0.7} />
			<hemisphereLight
				skyColor={accent1}
				groundColor={accent2}
				intensity={theme === 'light' ? 0.8 : 0.6}
			/>
		</>
	);
};

// Scene content
const SceneContent = ({ perfLevel }) => {
	const breakpoint = useResponsive();

	const { segments, particleCount, particleRadius } = useMemo(() => {
		const isMobile = breakpoint === 'mobile';
		if (perfLevel === 'low') {
			return {
				segments: isMobile ? 40 : 50, // Increased for better square waves
				particleCount: isMobile ? 150 : 250,
				particleRadius: 25,
			};
		}
		if (perfLevel === 'medium') {
			return {
				segments: isMobile ? 60 : 80,
				particleCount: isMobile ? 300 : 500,
				particleRadius: 30,
			};
		}
		return {
			segments: isMobile ? 80 : 120, // Higher segments for smoother square waves
			particleCount: isMobile ? 500 : 900,
			particleRadius: 35,
		};
	}, [perfLevel, breakpoint]);

	return (
		<>
			<SceneLights />
			<Logo3D />
			<LineMesh segments={segments} />
			<ParticleField count={particleCount} radius={particleRadius} />
		</>
	);
};

const Background3D = () => {
	const theme = useTheme();
	const breakpoint = useResponsive();
	const [perfLevel, setPerfLevel] = useState('high');

	const styles = useMemo(() => {
		const accent1 = getComputedStyle(document.documentElement)
			.getPropertyValue('--accent-1')
			.trim();
		const accent2 = getComputedStyle(document.documentElement)
			.getPropertyValue('--accent-2')
			.trim();
		const bgBase = getComputedStyle(document.documentElement)
			.getPropertyValue('--bg-base')
			.trim();
		const bgSoft = getComputedStyle(document.documentElement)
			.getPropertyValue('--bg-soft')
			.trim();

		const c1 = new THREE.Color(accent1)
			.toArray()
			.map((c) => Math.round(c * 255))
			.join(',');
		const c2 = new THREE.Color(accent2)
			.toArray()
			.map((c) => Math.round(c * 255))
			.join(',');

		if (theme === 'light') {
			return {
				baseGradient: `linear-gradient(to bottom, ${bgBase} 0%, ${bgSoft} 100%)`,
				radial1: `radial-gradient(ellipse 80% 60% at 50% 20%, rgba(${c1},.08), transparent)`,
				radial2: `radial-gradient(circle at 20% 80%, rgba(${c2},.06), transparent 70%)`,
				fog: bgSoft,
				bottomFade: `linear-gradient(to top, ${bgBase} 0%, transparent 50%)`,
				topFade: `linear-gradient(to bottom, ${bgBase} 0%, transparent 30%)`,
			};
		}
		return {
			baseGradient: `linear-gradient(to bottom, ${bgBase} 0%, ${bgSoft} 100%)`,
			radial1: `radial-gradient(ellipse 80% 60% at 50% 20%, rgba(${c1},.12), transparent)`,
			radial2: `radial-gradient(circle at 20% 80%, rgba(${c2},.08), transparent 70%)`,
			fog: bgBase,
			bottomFade: `linear-gradient(to top, ${bgBase} 0%, transparent 50%)`,
			topFade: `linear-gradient(to bottom, ${bgBase} 0%, transparent 30%)`,
		};
	}, [theme]);

	const cameraConfig = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { position: [0, 2, 18], fov: 60 };
			case 'tablet':
				return { position: [0, 2.5, 16], fov: 56 };
			default:
				return { position: [0, 3, 14], fov: 52 };
		}
	}, [breakpoint]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{/* Simple gradient background */}
			<div
				className="absolute inset-0 transition-all duration-700"
				style={{ background: styles.baseGradient }}
			/>

			{/* Subtle radial accents */}
			<div
				className="absolute inset-0 transition-opacity duration-700"
				style={{ background: styles.radial1 }}
			/>
			<div
				className="absolute inset-0 transition-opacity duration-700"
				style={{ background: styles.radial2 }}
			/>

			<Suspense fallback={null}>
				<Canvas
					camera={{
						position: cameraConfig.position,
						fov: cameraConfig.fov,
						near: 0.1,
						far: 100,
					}}
					style={{ pointerEvents: 'auto' }}
					gl={{
						antialias: true,
						alpha: true,
						powerPreference: 'high-performance',
						toneMapping: THREE.ACESFilmicToneMapping,
						toneMappingExposure: theme === 'light' ? 1.0 : 1.2,
					}}
					dpr={[1, 2]}
				>
					<PerformanceMonitor
						onIncline={() => setPerfLevel('high')}
						onDecline={() => setPerfLevel('low')}
					>
						<fog
							attach="fog"
							args={[styles.fog, 20, breakpoint === 'mobile' ? 60 : 70]}
						/>
						<SceneContent perfLevel={perfLevel} />
					</PerformanceMonitor>
				</Canvas>
			</Suspense>

			{/* Clean fades */}
			<div
				className="absolute inset-x-0 bottom-0 h-64 pointer-events-none transition-all duration-700"
				style={{ background: styles.bottomFade }}
			/>
			<div
				className="absolute inset-x-0 top-0 h-32 pointer-events-none transition-all duration-700"
				style={{ background: styles.topFade }}
			/>
		</div>
	);
};

export default Background3D;
