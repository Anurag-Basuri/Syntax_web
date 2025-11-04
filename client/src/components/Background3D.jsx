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

// Enhanced 3D Logo with improved visibility, animations and cleaner structure
const Logo3D = ({ perfLevel }) => {
	const meshRef = useRef();
	const groupRef = useRef();
	const materialRef = useRef();
	const texture = useTexture(logo);
	const { gl } = useThree();
	const breakpoint = useResponsive();
	const theme = useTheme();

	const isLowPerf = perfLevel === 'low';

	// Enhanced texture setup
	useEffect(() => {
		if (!texture) return;

		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = gl.capabilities.getMaxAnisotropy?.() || 16;
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		texture.generateMipmaps = true;
		texture.needsUpdate = true;
	}, [texture, gl]);

	const aspect = texture?.image ? texture.image.width / texture.image.height : 1;

	// Responsive configuration
	const { scale, yPosition, opacity } = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { scale: 3.2, yPosition: 0.4, opacity: 0.65 };
			case 'tablet':
				return { scale: 4.5, yPosition: 0.7, opacity: 0.7 };
			default:
				return { scale: 6.0, yPosition: 1.0, opacity: 0.75 };
		}
	}, [breakpoint]);

	// Enhanced animation frame with smoother effects
	useFrame((state) => {
		if (isLowPerf) return;

		const pointer = state.pointer ?? { x: 0, y: 0 };
		const t = state.clock.elapsedTime;
		const dt = state.clock.getDelta();

		if (meshRef.current) {
			// Smoother parallax with reduced intensity
			const targetY = (pointer.x * Math.PI) / 16;
			const targetX = (-pointer.y * Math.PI) / 20;

			meshRef.current.rotation.y = THREE.MathUtils.damp(
				meshRef.current.rotation.y,
				targetY,
				6,
				dt
			);
			meshRef.current.rotation.x = THREE.MathUtils.damp(
				meshRef.current.rotation.x,
				targetX,
				6,
				dt
			);

			// Subtle continuous rotation with multiple frequencies
			meshRef.current.rotation.z = Math.sin(t * 0.15) * 0.008 + Math.cos(t * 0.1) * 0.005;
		}

		if (groupRef.current) {
			// Enhanced floating animation with multiple sine waves
			const floatY = Math.sin(t * 0.35) * 0.04 + Math.sin(t * 0.2) * 0.02;
			groupRef.current.position.y = yPosition + floatY;

			// Subtle breathing effect
			const breathe = 1 + Math.sin(t * 0.25) * 0.008;
			groupRef.current.scale.set(breathe, breathe, 1);
		}

		// Update shader uniforms for dynamic effects
		if (materialRef.current) {
			materialRef.current.uniforms.uTime.value = t;

			// Pulsing opacity effect
			const pulse = 0.95 + Math.sin(t * 0.5) * 0.05;
			materialRef.current.uniforms.uOpacity.value = opacity * pulse;

			// Subtle color shift based on theme
			const hueShift = Math.sin(t * 0.1) * 0.02;
			materialRef.current.uniforms.uHueShift.value = hueShift;
		}
	});

	// Enhanced shader uniforms
	const uniforms = useMemo(
		() => ({
			uMap: { value: texture },
			uOpacity: { value: opacity },
			uAlphaTest: { value: 0.05 },
			uTime: { value: 0 },
			uHueShift: { value: 0 },
			uIntensity: { value: theme === 'light' ? 1.1 : 1.3 },
		}),
		[texture, opacity, theme]
	);

	if (isLowPerf) {
		return (
			<group position={[0, yPosition, 0]}>
				<mesh scale={[scale * aspect, scale, 1]}>
					<planeGeometry />
					<meshBasicMaterial
						map={texture}
						transparent
						opacity={opacity * 0.8}
						alphaTest={0.1}
						side={THREE.DoubleSide}
						depthWrite={false}
					/>
				</mesh>
			</group>
		);
	}

	return (
		<Float
			speed={isLowPerf ? 0 : 0.8}
			rotationIntensity={isLowPerf ? 0 : 0.05}
			floatIntensity={isLowPerf ? 0 : 0.08}
			floatingRange={isLowPerf ? [0, 0] : [-0.015, 0.015]}
		>
			<group ref={groupRef} position={[0, yPosition, 0]}>
				<group ref={meshRef}>
					{/* Main Logo Plane */}
					<mesh scale={[scale * aspect, scale, 1]} renderOrder={100}>
						<planeGeometry />
						<shaderMaterial
							ref={materialRef}
							transparent
							depthTest={true}
							depthWrite={false}
							side={THREE.DoubleSide}
							uniforms={uniforms}
							vertexShader={`
								uniform float uTime;
								uniform float uHueShift;
								varying vec2 vUv;
								varying vec3 vPosition;

								void main() {
									vUv = uv;
									vPosition = position;
									
									// Subtle vertex displacement
									float displacement = sin(position.x * 2.0 + uTime) * 0.002;
									vec3 newPosition = position;
									newPosition.z += displacement;
									
									gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
								}
							`}
							fragmentShader={`
								uniform sampler2D uMap;
								uniform float uOpacity;
								uniform float uAlphaTest;
								uniform float uTime;
								uniform float uHueShift;
								uniform float uIntensity;
								varying vec2 vUv;
								varying vec3 vPosition;

								// Hue rotation function
								vec3 hueShift(vec3 color, float hue) {
									vec3 k = vec3(0.57735, 0.57735, 0.57735);
									float cosAngle = cos(hue);
									return color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle);
								}

								void main() {
									vec4 texColor = texture2D(uMap, vUv);
									
									// Enhanced alpha testing with smooth edges
									if (texColor.a < uAlphaTest) discard;
									
									// Apply hue shift
									vec3 finalColor = hueShift(texColor.rgb, uHueShift);
									
									// Intensity adjustment
									finalColor *= uIntensity;
									
									// Edge glow effect
									float edge = smoothstep(0.0, 0.1, vUv.x) * 
												smoothstep(1.0, 0.9, vUv.x) *
												smoothstep(0.0, 0.1, vUv.y) * 
												smoothstep(1.0, 0.9, vUv.y);
									
									float glow = (0.3 + 0.7 * edge) * (0.8 + 0.2 * sin(uTime * 2.0));
									
									// Final color with animated opacity
									float alpha = texColor.a * uOpacity * glow;
									gl_FragColor = vec4(finalColor, alpha);
								}
							`}
						/>
					</mesh>

					{/* Subtle Outer Glow */}
					<mesh scale={[scale * aspect * 1.08, scale * 1.08, 1]} renderOrder={99}>
						<planeGeometry />
						<shaderMaterial
							transparent
							depthTest={false}
							depthWrite={false}
							side={THREE.DoubleSide}
							uniforms={uniforms}
							vertexShader={`
								varying vec2 vUv;
								void main() {
									vUv = uv;
									gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
								}
							`}
							fragmentShader={`
								uniform float uTime;
								uniform float uOpacity;
								varying vec2 vUv;
								
								void main() {
									// Circular gradient
									vec2 center = vec2(0.5, 0.5);
									float dist = distance(vUv, center);
									float gradient = 1.0 - smoothstep(0.3, 0.8, dist);
									
									// Pulsing effect
									float pulse = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * 1.5));
									
									// Very subtle glow
									float alpha = gradient * pulse * uOpacity * 0.15;
									
									gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
								}
							`}
						/>
					</mesh>
				</group>
			</group>
		</Float>
	);
}; // Clean wireframe mesh with smooth waves
const WireframeMesh = ({ segments }) => {
	const meshRef = useRef();
	const theme = useTheme();
	const breakpoint = useResponsive();

	const uniforms = useMemo(() => {
		const accent1 = getThemeColor('--accent-1');
		const accent2 = getThemeColor('--accent-2');

		return {
			uTime: { value: 0 },
			uAmplitude: { value: breakpoint === 'mobile' ? 0.5 : 0.75 },
			uFrequency: { value: 0.018 },
			uSpeed: { value: 0.08 },
			uColorStart: { value: accent1 },
			uColorEnd: { value: accent2 },
			uLineOpacity: { value: theme === 'light' ? 0.18 : 0.28 },
		};
	}, [theme, breakpoint]);

	useFrame((state) => {
		uniforms.uTime.value = state.clock.elapsedTime;

		// Responsive wave amplitude
		const pointerInfluence = (Math.abs(state.pointer.x) + Math.abs(state.pointer.y)) * 0.2;
		const targetAmp = (breakpoint === 'mobile' ? 0.5 : 0.75) + pointerInfluence;
		uniforms.uAmplitude.value = THREE.MathUtils.lerp(
			uniforms.uAmplitude.value,
			targetAmp,
			0.05
		);
	});

	const size = breakpoint === 'mobile' ? 220 : 300;

	return (
		<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
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

                    void main() {
                        vUv = uv;
                        vec3 pos = position;
                        
                        // Smooth, flowing waves
                        float wave1 = sin(pos.x * uFrequency + uTime * uSpeed);
                        float wave2 = sin(pos.y * uFrequency * 0.8 + uTime * uSpeed * 0.7);
                        float wave3 = cos((pos.x + pos.y) * uFrequency * 0.5 + uTime * uSpeed * 0.5);
                        
                        vElevation = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) * uAmplitude;
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
                        // Smooth color gradient
                        float mixFactor = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);
                        vec3 color = mix(uColorStart, uColorEnd, mixFactor);
                        
                        // Edge fade with smooth falloff
                        float edgeFadeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
                        float edgeFadeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
                        float edgeFade = edgeFadeY * edgeFadeX;
                        
                        gl_FragColor = vec4(color, uLineOpacity * edgeFade);
                    }
                `}
			/>
		</mesh>
	);
};

// Refined particle field
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

			siz[i] = 0.012 * (0.6 + Math.random() * 1.4);
		}
		return { positions: pos, sizes: siz };
	}, [count, radius]);

	useFrame((state, delta) => {
		if (!ref.current) return;
		ref.current.rotation.y += delta * 0.01;
		ref.current.rotation.x += delta * 0.005;
	});

	const color = getThemeColor('--accent-1');

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
				size={0.012}
				transparent
				color={color}
				opacity={theme === 'light' ? 0.3 : 0.45}
				sizeAttenuation
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
};

// Optimized lighting
const SceneLights = () => {
	const theme = useTheme();
	const lightRef = useRef();

	const accent1 = getThemeColor('--accent-1');
	const accent2 = getThemeColor('--accent-2');

	useFrame((state) => {
		if (lightRef.current) {
			const t = state.clock.elapsedTime;
			lightRef.current.intensity = (theme === 'light' ? 0.9 : 1.2) + Math.sin(t * 0.5) * 0.15;
		}
	});

	return (
		<>
			<ambientLight intensity={theme === 'light' ? 1.0 : 0.75} />
			<hemisphereLight
				skyColor={accent1}
				groundColor={accent2}
				intensity={theme === 'light' ? 0.7 : 0.5}
			/>
			<spotLight
				ref={lightRef}
				position={[0, 10, 10]}
				angle={0.3}
				penumbra={1}
				intensity={theme === 'light' ? 0.9 : 1.2}
				color={accent1}
			/>
		</>
	);
};

// Scene content with performance tiers
const SceneContent = ({ perfLevel }) => {
	const breakpoint = useResponsive();

	const { segments, particleCount, particleRadius } = useMemo(() => {
		const isMobile = breakpoint === 'mobile';
		if (perfLevel === 'low') {
			return {
				segments: isMobile ? 35 : 45,
				particleCount: isMobile ? 120 : 200,
				particleRadius: 22,
			};
		}
		if (perfLevel === 'medium') {
			return {
				segments: isMobile ? 55 : 75,
				particleCount: isMobile ? 250 : 450,
				particleRadius: 28,
			};
		}
		return {
			segments: isMobile ? 75 : 110,
			particleCount: isMobile ? 400 : 750,
			particleRadius: 32,
		};
	}, [perfLevel, breakpoint]);

	return (
		<>
			<SceneLights />
			<Logo3D perfLevel={perfLevel} />
			<WireframeMesh segments={segments} />
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
		const bgSofter = getComputedStyle(document.documentElement)
			.getPropertyValue('--bg-softer')
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
				baseGradient: `linear-gradient(180deg, ${bgBase} 0%, ${bgSoft} 50%, ${bgSofter} 100%)`,
				radial1: `radial-gradient(ellipse 70% 50% at 50% 15%, rgba(${c1},.1), transparent 70%)`,
				radial2: `radial-gradient(circle at 15% 85%, rgba(${c2},.08), transparent 60%)`,
				fog: bgSofter,
				bottomFade: `linear-gradient(to top, ${bgBase} 0%, transparent 45%)`,
				topFade: `linear-gradient(to bottom, ${bgBase} 0%, transparent 25%)`,
			};
		}
		return {
			baseGradient: `linear-gradient(180deg, ${bgBase} 0%, ${bgSoft} 50%, ${bgSofter} 100%)`,
			radial1: `radial-gradient(ellipse 70% 50% at 50% 15%, rgba(${c1},.15), transparent 70%)`,
			radial2: `radial-gradient(circle at 15% 85%, rgba(${c2},.12), transparent 60%)`,
			fog: bgBase,
			bottomFade: `linear-gradient(to top, ${bgBase} 0%, transparent 45%)`,
			topFade: `linear-gradient(to bottom, ${bgBase} 0%, transparent 25%)`,
		};
	}, [theme]);

	const cameraConfig = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { position: [0, 1.8, 16], fov: 65 };
			case 'tablet':
				return { position: [0, 2.2, 14], fov: 58 };
			default:
				return { position: [0, 2.8, 13], fov: 50 };
		}
	}, [breakpoint]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{/* Gradient background */}
			<div
				className="absolute inset-0 transition-all duration-700 ease-in-out"
				style={{ background: styles.baseGradient }}
			/>

			{/* Radial accent overlays */}
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
					style={{ pointerEvents: 'none' }}
					gl={{
						antialias: true,
						alpha: true,
						powerPreference: 'high-performance',
						toneMapping: THREE.ACESFilmicToneMapping,
						toneMappingExposure: theme === 'light' ? 1.05 : 1.25,
					}}
					dpr={[1, 2]}
					frameloop="always"
				>
					<PerformanceMonitor
						onIncline={() => setPerfLevel('high')}
						onDecline={() => setPerfLevel('low')}
					>
						<fog
							attach="fog"
							args={[styles.fog, 18, breakpoint === 'mobile' ? 55 : 65]}
						/>
						<SceneContent perfLevel={perfLevel} />
					</PerformanceMonitor>
				</Canvas>
			</Suspense>

			{/* Edge fades */}
			<div
				className="absolute inset-x-0 bottom-0 h-56 pointer-events-none transition-all duration-700"
				style={{ background: styles.bottomFade }}
			/>
			<div
				className="absolute inset-x-0 top-0 h-28 pointer-events-none transition-all duration-700"
				style={{ background: styles.topFade }}
			/>
		</div>
	);
};

export default Background3D;
