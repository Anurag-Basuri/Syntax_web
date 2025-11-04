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

// Clean 3D Logo - no background, softer opacity
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
				return { scale: 3.6, yPosition: 0.45 };
			case 'tablet':
				return { scale: 4.8, yPosition: 0.75 };
			default:
				return { scale: 6.2, yPosition: 0.95 };
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
			speed={1.35}
			rotationIntensity={0.14}
			floatIntensity={0.18}
			floatingRange={[-0.05, 0.05]}
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
								uKeyColor: { value: keyColor },
								uTolerance: { value: theme === 'light' ? 0.55 : 0.45 },
								uSmoothness: { value: 0.12 },
								uAlphaCutoff: { value: 0.02 },
								uOpacity: { value: 0.75 }, // Increased logo opacity for better presence
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
                                uniform vec3 uKeyColor;
                                uniform float uTolerance;
                                uniform float uSmoothness;
                                uniform float uAlphaCutoff;
                                uniform float uOpacity;

                                // Perceptual luma
                                float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }

                                void main() {
                                    vec4 tex = texture2D(uMap, vUv);

                                    // Distance to key color and luma-based keying help remove off-white/off-black
                                    float keyDist = distance(tex.rgb, uKeyColor);
                                    float nearKeyChrom = 1.0 - smoothstep(uTolerance - uSmoothness, uTolerance + uSmoothness, keyDist);

                                    float Y = luma(tex.rgb);
                                    float nearKeyLuma;
                                    #ifdef LIGHT_MODE
                                        nearKeyLuma = smoothstep(1.0 - (uTolerance + uSmoothness), 1.0 - (uTolerance - uSmoothness), Y);
                                    #else
                                        nearKeyLuma = smoothstep(uTolerance - uSmoothness, uTolerance + uSmoothness, Y);
                                    #endif

                                    // Combine keys, but respect existing alpha
                                    float keyMask = max(nearKeyChrom, nearKeyLuma);
                                    float alpha = tex.a * (1.0 - keyMask) * uOpacity;

                                    if(alpha < uAlphaCutoff) discard;

                                    gl_FragColor = vec4(tex.rgb, alpha);
                                }
                            `}
							defines={{
								LIGHT_MODE: theme === 'light' ? 1 : 0,
							}}
						/>
					</mesh>
				</group>
			</group>
		</Float>
	);
};

// Enhanced wave mesh: cleaner colors, smoother motion
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
			uAmplitude: { value: breakpoint === 'mobile' ? 0.75 : 1.1 },
			uFreq1: { value: 0.052 },
			uFreq2: { value: 0.032 },
			uFreq3: { value: 0.024 },
			uSpeed1: { value: 0.42 },
			uSpeed2: { value: 0.26 },
			uSpeed3: { value: 0.18 },
			uDir1: { value: new THREE.Vector2(1.0, 0.2).normalize() },
			uDir2: { value: new THREE.Vector2(-0.6, 1.0).normalize() },
			uDir3: { value: new THREE.Vector2(0.2, -1.0).normalize() },
			uColorBase: { value: bgSoft },
			uColorAccent1: { value: accent1 },
			uColorAccentMid: { value: accentMid },
			uColorAccent2: { value: accent2 },
			uMeshOpacity: { value: theme === 'light' ? 0.6 : 0.7 },
			uGridStrength: { value: theme === 'light' ? 0.18 : 0.22 },
		};
	}, [theme, breakpoint]);

	useFrame((state) => {
		const t = state.clock.elapsedTime;
		const dt = state.clock.getDelta();
		uniforms.uTime.value = t;

		// Slight responsiveness to pointer
		const targetAmp =
			(breakpoint === 'mobile' ? 0.7 : 1.05) +
			(Math.abs(state.pointer.x) + Math.abs(state.pointer.y)) * 0.15;
		uniforms.uAmplitude.value = THREE.MathUtils.damp(
			uniforms.uAmplitude.value,
			targetAmp,
			2.2,
			dt
		);
	});

	const geometryArgs = useMemo(() => {
		const size = breakpoint === 'mobile' ? 120 : 170;
		return [size, size, segments, segments];
	}, [breakpoint, segments]);

	return (
		<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -7, 0]}>
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

                        float w1 = wave(uDir1, uFreq1, uSpeed1, pos.xy);
                        float w2 = wave(uDir2, uFreq2, uSpeed2, pos.xy + vec2(8.0, -4.0));
                        float w3 = wave(uDir3, uFreq3, uSpeed3, pos.xy + vec2(-12.0, 6.0));

                        vElevation = (w1 * 0.5 + w2 * 0.3 + w3 * 0.2) * uAmplitude;
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
                    uniform float uGridStrength;

                    // Simple desaturation towards base for cleaner look in light mode
                    vec3 desat(vec3 color, float amount, vec3 towards) {
                        return mix(color, mix(vec3(dot(color, vec3(0.299,0.587,0.114))), color, 0.0), amount);
                    }

                    void main() {
                        // Softer grid
                        vec2 g = abs(fract(vUv * 14.0 - 0.5) - 0.5);
                        float line = min(g.x, g.y);
                        float grid = 1.0 - smoothstep(0.0, 0.17, line);

                        // Elevation-based color blend (base -> mid -> accent)
                        float e = clamp(vElevation * 0.42 + 0.5, 0.0, 1.0);
                        vec3 c = mix(uColorBase, uColorAccentMid, smoothstep(0.2, 0.7, e));
                        c = mix(c, uColorAccent2, smoothstep(0.65, 1.0, e));

                        // Vertical vignette ONLY (removed central focus)
                        float vfade = smoothstep(0.06, 0.95, vUv.y);

                        float alpha = (0.2 + vfade * 0.22); // Removed 'center' multiplication
                        alpha *= mix(0.65, 1.0, grid * uGridStrength);

                        gl_FragColor = vec4(c, alpha * uMeshOpacity);
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
