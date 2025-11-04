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

// Clean 3D Logo - Simplified shader for guaranteed visibility
const Logo3D = () => {
	const meshRef = useRef();
	const groupRef = useRef();
	const texture = useTexture(logo);
	const { gl } = useThree();
	const breakpoint = useResponsive();
	const theme = useTheme();

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
				return { scale: 3.8, yPosition: 0.5 };
			case 'tablet':
				return { scale: 5.0, yPosition: 0.8 };
			default:
				return { scale: 6.5, yPosition: 1.0 };
		}
	}, [breakpoint]);

	useFrame((state) => {
		const pointer = state.pointer ?? { x: 0, y: 0 };
		const t = state.clock.elapsedTime;
		const dt = state.clock.getDelta();

		if (meshRef.current) {
			const targetY = (pointer.x * Math.PI) / 12;
			const targetX = (-pointer.y * Math.PI) / 16;
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
			meshRef.current.rotation.z = Math.sin(t * 0.25) * 0.01;
		}
		if (groupRef.current) {
			groupRef.current.position.y = yPosition + Math.sin(t * 0.5) * 0.06;
			const s = 1 + Math.sin(t * 0.8) * 0.01;
			groupRef.current.scale.set(s, s, 1);
		}
	});

	// Key white in light mode, black in dark mode
	const keyColor = useMemo(
		() => (theme === 'light' ? new THREE.Color(0xffffff) : new THREE.Color(0x000000)),
		[theme]
	);

	return (
		<Float
			speed={1.4}
			rotationIntensity={0.12}
			floatIntensity={0.16}
			floatingRange={[-0.04, 0.04]}
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
								uOpacity: { value: 0.85 }, // Balanced opacity
								uAlphaTest: { value: 0.1 }, // Ensures transparent parts are cut
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
                                    
                                    // Simple, reliable alpha test. This works best with a proper transparent PNG.
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

// Enhanced wave mesh: now a clean, cloth-like texture
const WaveMesh = ({ segments }) => {
	const meshRef = useRef();
	const theme = useTheme();
	const breakpoint = useResponsive();

	const uniforms = useMemo(() => {
		const accent1 = getThemeColor('--accent-1');
		const accent2 = getThemeColor('--accent-2');
		const bgSoft = getThemeColor('--bg-soft');
		const accentMid = accent1.clone().lerp(accent2, 0.5);

		return {
			uTime: { value: 0 },
			// Gentler amplitude for a softer, cloth-like feel
			uAmplitude: { value: breakpoint === 'mobile' ? 0.4 : 0.6 },
			uFreq1: { value: 0.04 },
			uFreq2: { value: 0.025 },
			uFreq3: { value: 0.018 },
			uSpeed1: { value: 0.25 },
			uSpeed2: { value: 0.18 },
			uSpeed3: { value: 0.12 },
			uDir1: { value: new THREE.Vector2(1.0, 0.5).normalize() },
			uDir2: { value: new THREE.Vector2(-0.5, 1.0).normalize() },
			uDir3: { value: new THREE.Vector2(0.8, -0.3).normalize() },
			uColorBase: { value: bgSoft },
			uColorAccent1: { value: accent1 },
			uColorAccentMid: { value: accentMid },
			uColorAccent2: { value: accent2 },
			uMeshOpacity: { value: theme === 'light' ? 0.6 : 0.75 },
			uWeaveStrength: { value: theme === 'light' ? 0.08 : 0.12 },
		};
	}, [theme, breakpoint]);

	useFrame((state) => {
		const t = state.clock.elapsedTime;
		const dt = state.clock.getDelta();
		uniforms.uTime.value = t;

		// Softer responsiveness
		const targetAmp =
			(breakpoint === 'mobile' ? 0.4 : 0.6) +
			(Math.abs(state.pointer.x) + Math.abs(state.pointer.y)) * 0.1;
		uniforms.uAmplitude.value = THREE.MathUtils.damp(
			uniforms.uAmplitude.value,
			targetAmp,
			3.0,
			dt
		);
	});

	const geometryArgs = useMemo(() => {
		const size = breakpoint === 'mobile' ? 140 : 180;
		return [size, size, segments, segments];
	}, [breakpoint, segments]);

	return (
		// Lowered the mesh significantly
		<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -12, 0]}>
			<planeGeometry args={geometryArgs} />
			<shaderMaterial
				transparent
				side={THREE.DoubleSide}
				uniforms={uniforms}
				depthWrite={false}
				vertexShader={`
                    uniform float uTime;
                    uniform float uAmplitude;
                    uniform float uFreq1, uFreq2, uFreq3;
                    uniform float uSpeed1, uSpeed2, uSpeed3;
                    uniform vec2 uDir1, uDir2, uDir3;

                    varying vec2 vUv;
                    varying float vElevation;

                    float wave(vec2 dir, float freq, float speed, vec2 pos) {
                        return sin(dot(dir, pos) * freq + uTime * speed);
                    }

                    void main() {
                        vUv = uv;
                        vec3 pos = position;

                        // Softer, more rolling waves
                        float w1 = wave(uDir1, uFreq1, uSpeed1, pos.xy);
                        float w2 = wave(uDir2, uFreq2, uSpeed2, pos.xy + vec2(10.0, -5.0));
                        float w3 = wave(uDir3, uFreq3, uSpeed3, pos.xy + vec2(-15.0, 8.0));

                        vElevation = (w1 * 0.5 + w2 * 0.35 + w3 * 0.25) * uAmplitude;
                        pos.z += vElevation;

                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
				fragmentShader={`
                    varying vec2 vUv;
                    varying float vElevation;
                    uniform vec3 uColorBase;
                    uniform vec3 uColorAccent1;
                    uniform vec3 uColorAccentMid;
                    uniform vec3 uColorAccent2;
                    uniform float uMeshOpacity;
                    uniform float uWeaveStrength;

                    void main() {
                        // Procedural cloth weave texture
                        vec2 uv = vUv * 120.0; // Controls weave density
                        float weave = 0.5 + 0.25 * (sin(uv.x) + sin(uv.y));
                        float fabricPattern = smoothstep(0.4, 0.6, weave);
                        
                        // Subtle color variation based on folds/elevation
                        float e = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);
                        vec3 color = mix(uColorBase, uColorAccentMid, smoothstep(0.1, 0.6, e));
                        color = mix(color, uColorAccent2, smoothstep(0.55, 0.9, e));

                        // Add the fabric pattern to the color
                        color = mix(color, uColorAccent1, fabricPattern * uWeaveStrength);

                        // Fade out at the edges
                        float vfade = smoothstep(0.0, 0.85, vUv.y);
                        float hfade = 1.0 - step(0.98, abs(vUv.x - 0.5) * 2.0);

                        float alpha = vfade * hfade;

                        gl_FragColor = vec4(color, alpha * uMeshOpacity);
                    }
                `}
			/>
		</mesh>
	);
};

// Particle system with theme-coordinated colors
const ParticleNebula = ({ count, radius }) => {
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

			siz[i] = 0.02 * (0.5 + Math.random() * 1.5);
		}
		return { positions: pos, sizes: siz };
	}, [count, radius]);

	useFrame((state, delta) => {
		if (!ref.current) return;
		ref.current.rotation.y += delta * 0.02;
		ref.current.rotation.x += delta * 0.008;
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
				size={0.02}
				transparent
				color={color}
				opacity={theme === 'light' ? 0.35 : 0.5}
				sizeAttenuation
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
};

// Dynamic lights with theme sync
const DynamicLights = () => {
	const spot1 = useRef();
	const theme = useTheme();

	const lightColors = useMemo(() => {
		return {
			ambient: theme === 'light' ? 0.95 : 0.65,
			hemisphere: {
				sky: getThemeColor('--accent-1'),
				ground: getThemeColor('--accent-2'),
			},
			spot1: getThemeColor('--accent-1'),
		};
	}, [theme]);

	useFrame((state) => {
		const time = state.clock.elapsedTime;
		if (spot1.current) {
			spot1.current.intensity =
				(theme === 'light' ? 1.35 : 1.75) + Math.sin(time * 0.4) * 0.22;
			spot1.current.position.x = Math.sin(time * 0.25) * 2.4;
		}
	});

	return (
		<>
			<ambientLight intensity={lightColors.ambient} />
			<hemisphereLight
				skyColor={lightColors.hemisphere.sky}
				groundColor={lightColors.hemisphere.ground}
				intensity={theme === 'light' ? 1.0 : 0.75}
			/>
			<spotLight
				ref={spot1}
				position={[0, 15, 10]}
				angle={0.35}
				penumbra={1}
				intensity={theme === 'light' ? 1.35 : 1.75}
				color={lightColors.spot1}
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
				segments: isMobile ? 44 : 56,
				particleCount: isMobile ? 220 : 380,
				particleRadius: 28,
			};
		}
		if (perfLevel === 'medium') {
			return {
				segments: isMobile ? 64 : 86,
				particleCount: isMobile ? 480 : 780,
				particleRadius: 32,
			};
		}
		return {
			segments: isMobile ? 80 : 120,
			particleCount: isMobile ? 760 : 1300,
			particleRadius: 38,
		};
	}, [perfLevel, breakpoint]);

	return (
		<>
			<DynamicLights />
			{/* CursorGlow is removed, ensuring no central circle */}
			<Logo3D />
			<WaveMesh segments={segments} />
			<ParticleNebula count={particleCount} radius={particleRadius} />
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
				baseGradient: `linear-gradient(to bottom, ${bgBase} 0%, ${bgSoft} 42%, ${bgSofter} 100%)`,
				// Shift radials off-center to avoid central hotspot
				radial1: `radial-gradient(ellipse 90% 70% at 65% 18%, rgba(${c1},.12), transparent)`,
				radial2: `radial-gradient(circle at 12% 86%, rgba(${c2},.08), transparent 65%)`,
				fog: bgSofter,
				bottomFade: `linear-gradient(to top, ${bgBase} 0%, transparent 60%)`,
				topFade: `linear-gradient(to bottom, ${bgBase} 0%, transparent 40%)`,
			};
		}
		return {
			baseGradient: `linear-gradient(to bottom, ${bgBase} 0%, ${bgSoft} 45%, ${bgSofter} 100%)`,
			radial1: `radial-gradient(ellipse 90% 70% at 62% 16%, rgba(${c1},.16), transparent)`,
			radial2: `radial-gradient(circle at 10% 84%, rgba(${c2},.12), transparent 65%)`,
			fog: bgBase,
			bottomFade: `linear-gradient(to top, ${bgBase} 0%, transparent 55%)`,
			topFade: `linear-gradient(to bottom, ${bgBase} 0%, transparent 35%)`,
		};
	}, [theme]);

	const cameraConfig = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { position: [0, 1.5, 16], fov: 60 };
			case 'tablet':
				return { position: [0, 2, 14], fov: 56 };
			default:
				return { position: [0, 2.5, 13], fov: 52 };
		}
	}, [breakpoint]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{/* Base gradient */}
			<div
				className="absolute inset-0 transition-all duration-700 ease-in-out"
				style={{ background: styles.baseGradient }}
			/>

			{/* Radial overlays */}
			<div
				className="absolute inset-0 opacity-100 transition-opacity duration-700"
				style={{ background: styles.radial1 }}
			/>
			<div
				className="absolute inset-0 opacity-100 transition-opacity duration-700"
				style={{ background: styles.radial2 }}
			/>

			<Suspense fallback={null}>
				<Canvas
					camera={{
						position: cameraConfig.position,
						fov: cameraConfig.fov,
						near: 0.1,
						far: 120,
					}}
					style={{ pointerEvents: 'auto' }}
					gl={{
						antialias: true,
						alpha: true,
						powerPreference: 'high-performance',
						toneMapping: THREE.ACESFilmicToneMapping,
						toneMappingExposure: theme === 'light' ? 1.08 : 1.28,
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

			{/* Bottom fade */}
			<div
				className="absolute inset-x-0 bottom-0 h-[26rem] pointer-events-none transition-all duration-700"
				style={{ background: styles.bottomFade }}
			/>

			{/* Top fade */}
			<div
				className="absolute inset-x-0 top-0 h-44 pointer-events-none transition-all duration-700"
				style={{ background: styles.topFade }}
			/>
		</div>
	);
};

export default Background3D;
