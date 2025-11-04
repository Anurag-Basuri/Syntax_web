import React, { useRef, Suspense, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, useTexture, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import logo from '../assets/logo.png';

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

// Clean 3D Logo - No background effects, just the logo
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

	// Adjusted position - lowered to account for navbar
	const { scale, yPosition } = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { scale: 3.5, yPosition: 0.5 };
			case 'tablet':
				return { scale: 4.5, yPosition: 0.8 };
			default:
				return { scale: 6.0, yPosition: 1.0 };
		}
	}, [breakpoint]);

	useFrame((state) => {
		const pointer = state.pointer ?? { x: 0, y: 0 };
		const time = state.clock.elapsedTime;

		if (meshRef.current) {
			const targetRotationY = (pointer.x * Math.PI) / 12;
			const targetRotationX = (-pointer.y * Math.PI) / 16;
			meshRef.current.rotation.y = THREE.MathUtils.lerp(
				meshRef.current.rotation.y,
				targetRotationY,
				0.06
			);
			meshRef.current.rotation.x = THREE.MathUtils.lerp(
				meshRef.current.rotation.x,
				targetRotationX,
				0.06
			);
			meshRef.current.rotation.z = Math.sin(time * 0.2) * 0.01;
		}

		if (groupRef.current) {
			groupRef.current.position.y = yPosition + Math.sin(time * 0.4) * 0.08;
		}
	});

	return (
		<Float
			speed={1.5}
			rotationIntensity={0.15}
			floatIntensity={0.2}
			floatingRange={[-0.05, 0.05]}
		>
			<group ref={groupRef} position={[0, yPosition, 0]}>
				<group ref={meshRef}>
					{/* Clean logo - no glow layers */}
					<mesh scale={[scale * aspect, scale, 1]} renderOrder={10}>
						<planeGeometry />
						<meshBasicMaterial
							map={texture}
							transparent={true}
							alphaTest={0.1}
							side={THREE.DoubleSide}
							depthTest={false}
							depthWrite={false}
							opacity={1.0}
						/>
					</mesh>
				</group>
			</group>
		</Float>
	);
};

// Optimized wave mesh with improved theme colors
const WaveMesh = ({ segments }) => {
	const meshRef = useRef();
	const theme = useTheme();
	const breakpoint = useResponsive();

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uAmplitude: { value: breakpoint === 'mobile' ? 1.0 : 1.5 },
			uFrequency: { value: 0.04 },
		}),
		[breakpoint]
	);

	useFrame((state) => {
		uniforms.uTime.value = state.clock.elapsedTime * 0.7;
	});

	// Enhanced color palette for both themes
	const colors = useMemo(() => {
		if (theme === 'light') {
			return {
				// Light theme: Soft, elegant purples and blues
				base: 'vec3(0.72, 0.67, 0.95)', // Soft lavender
				highlight: 'vec3(0.45, 0.75, 0.98)', // Sky blue
				ambient: 'vec3(0.91, 0.89, 0.99)', // Very light purple
				accent: 'vec3(0.62, 0.52, 0.93)', // Medium purple
			};
		}
		return {
			// Dark theme: Deep, rich blues with cyan accents
			base: 'vec3(0.12, 0.22, 0.45)', // Deep blue
			highlight: 'vec3(0.22, 0.68, 0.90)', // Bright cyan
			ambient: 'vec3(0.08, 0.14, 0.32)', // Very dark blue
			accent: 'vec3(0.38, 0.55, 0.95)', // Electric blue
		};
	}, [theme]);

	const geometryArgs = useMemo(() => {
		const size = breakpoint === 'mobile' ? 100 : 140;
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
                    uniform float uFrequency;
                    varying vec2 vUv;
                    varying float vElevation;

                    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
                    
                    float snoise(vec2 v) {
                        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                        vec2 i  = floor(v + dot(v, C.yy));
                        vec2 x0 = v - i + dot(i, C.xx);
                        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                        vec4 x12 = x0.xyxy + C.xxzz;
                        x12.xy -= i1;
                        i = mod289(i);
                        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                        m = m*m; m = m*m;
                        vec3 x = 2.0 * fract(p * C.www) - 1.0;
                        vec3 h = abs(x) - 0.5;
                        vec3 ox = floor(x + 0.5);
                        vec3 a0 = x - ox;
                        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                        vec3 g;
                        g.x  = a0.x  * x0.x  + h.x  * x0.y;
                        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                        return 130.0 * dot(m, g);
                    }

                    void main() {
                        vUv = uv;
                        vec3 pos = position;
                        
                        float noise = snoise(pos.xy * 0.03 + uTime * 0.1) * 1.5;
                        float wave = sin(pos.x * uFrequency + uTime * 0.2) * uAmplitude;
                        
                        vElevation = (noise + wave) * 0.8;
                        pos.z += vElevation;
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
				fragmentShader={`
                    varying vec2 vUv;
                    varying float vElevation;
                    
                    void main() {
                        vec2 grid = abs(fract(vUv * 20.0 - 0.5) - 0.5);
                        float line = min(grid.x, grid.y);
                        float gridPattern = 1.0 - min(line * 2.0, 1.0);
                        
                        vec3 baseColor = ${colors.base};
                        vec3 highlightColor = ${colors.highlight};
                        vec3 ambientColor = ${colors.ambient};
                        vec3 accentColor = ${colors.accent};
                        
                        float elevationFactor = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);
                        
                        // Smooth color transitions
                        vec3 color = mix(ambientColor, baseColor, smoothstep(0.0, 0.6, elevationFactor));
                        color = mix(color, accentColor, smoothstep(0.4, 0.7, elevationFactor) * 0.6);
                        color = mix(color, highlightColor, smoothstep(0.6, 1.0, elevationFactor) * 0.7);
                        
                        float centerDist = distance(vUv, vec2(0.5));
                        float edgeFade = 1.0 - smoothstep(0.25, 0.65, centerDist);
                        float verticalGradient = smoothstep(0.1, 0.9, vUv.y) * 0.35;
                        
                        float alpha = gridPattern * edgeFade * (0.35 + verticalGradient);
                        
                        gl_FragColor = vec4(color, alpha * 0.85);
                    }
                `}
			/>
		</mesh>
	);
};

// Optimized particle system with improved theme colors
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

			siz[i] = 0.025 * (0.5 + Math.random() * 1.5);
		}
		return { positions: pos, sizes: siz };
	}, [count, radius]);

	useFrame((state, delta) => {
		if (!ref.current) return;
		ref.current.rotation.y += delta * 0.03;
		ref.current.rotation.x += delta * 0.01;
	});

	// Improved particle colors
	const color = useMemo(() => (theme === 'light' ? '#9f7aea' : '#38bdf8'), [theme]);

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
				size={0.025}
				transparent
				color={color}
				opacity={theme === 'light' ? 0.55 : 0.7}
				sizeAttenuation
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
};

// Optimized dynamic lights with improved theme colors
const DynamicLights = () => {
	const spot1 = useRef();
	const spot2 = useRef();
	const theme = useTheme();

	useFrame((state) => {
		const time = state.clock.elapsedTime;
		if (spot1.current) {
			spot1.current.intensity = (theme === 'light' ? 1.6 : 2.0) + Math.sin(time * 0.5) * 0.3;
			spot1.current.position.x = Math.sin(time * 0.3) * 3;
		}
		if (spot2.current) {
			spot2.current.intensity = (theme === 'light' ? 1.2 : 1.5) + Math.cos(time * 0.4) * 0.2;
		}
	});

	const lightColors = useMemo(() => {
		if (theme === 'light') {
			return {
				hemisphere: { sky: '#8b5cf6', ground: '#fcd34d' }, // Purple sky, golden ground
				ambient: 0.9,
				spot1: '#7c3aed', // Rich purple
				spot2: '#3b82f6', // Bright blue
			};
		}
		return {
			hemisphere: { sky: '#0ea5e9', ground: '#0c4a6e' }, // Cyan sky, deep blue ground
			ambient: 0.6,
			spot1: '#06b6d4', // Cyan
			spot2: '#6366f1', // Indigo
		};
	}, [theme]);

	return (
		<>
			<ambientLight intensity={lightColors.ambient} />
			<hemisphereLight
				skyColor={lightColors.hemisphere.sky}
				groundColor={lightColors.hemisphere.ground}
				intensity={theme === 'light' ? 1.2 : 0.8}
			/>
			<spotLight
				ref={spot1}
				position={[0, 15, 10]}
				angle={0.4}
				penumbra={1}
				intensity={theme === 'light' ? 1.6 : 2.0}
				color={lightColors.spot1}
			/>
			<spotLight
				ref={spot2}
				position={[-8, 12, -5]}
				angle={0.35}
				penumbra={1}
				intensity={theme === 'light' ? 1.2 : 1.5}
				color={lightColors.spot2}
			/>
		</>
	);
};

// Scene content with adaptive performance
const SceneContent = ({ perfLevel }) => {
	const breakpoint = useResponsive();

	const { segments, particleCount, particleRadius } = useMemo(() => {
		const isMobile = breakpoint === 'mobile';
		if (perfLevel === 'low') {
			return {
				segments: isMobile ? 40 : 50,
				particleCount: isMobile ? 300 : 500,
				particleRadius: 30,
			};
		}
		if (perfLevel === 'medium') {
			return {
				segments: isMobile ? 60 : 80,
				particleCount: isMobile ? 600 : 1000,
				particleRadius: 35,
			};
		}
		return {
			segments: isMobile ? 80 : 120,
			particleCount: isMobile ? 1000 : 1800,
			particleRadius: 40,
		};
	}, [perfLevel, breakpoint]);

	return (
		<>
			<DynamicLights />
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

	// Enhanced gradient colors for both themes
	const gradients = useMemo(() => {
		if (theme === 'light') {
			return {
				radial1:
					'radial-gradient(ellipse 85% 75% at 50% 35%, rgba(139,92,246,.18), transparent)', // Purple glow
				radial2:
					'radial-gradient(circle at 20% 80%, rgba(59,130,246,.12), transparent 60%)', // Blue accent
				radial3:
					'radial-gradient(circle at 80% 20%, rgba(236,72,153,.08), transparent 55%)', // Pink accent
				fog: '#f5f3ff', // Very light purple
				bottomFade:
					'linear-gradient(to top, rgba(255,255,255,0.95), rgba(249,245,255,0.85), transparent)',
				topFade: 'linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)',
			};
		}
		return {
			radial1:
				'radial-gradient(ellipse 85% 75% at 50% 35%, rgba(14,165,233,.22), transparent)', // Cyan glow
			radial2: 'radial-gradient(circle at 20% 80%, rgba(99,102,241,.15), transparent 60%)', // Indigo accent
			radial3: 'radial-gradient(circle at 80% 20%, rgba(6,182,212,.12), transparent 55%)', // Cyan accent
			fog: '#0a1929', // Deep navy
			bottomFade:
				'linear-gradient(to top, rgba(3,7,18,0.98), rgba(10,25,41,0.92), transparent)',
			topFade: 'linear-gradient(to bottom, rgba(3,7,18,0.85), transparent)',
		};
	}, [theme]);

	// Adjusted camera position to account for lowered logo
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
			{/* Enhanced base gradient */}
			<div
				className="absolute inset-0 transition-all duration-700 ease-in-out"
				style={{
					background:
						theme === 'light'
							? 'linear-gradient(to bottom, #ffffff 0%, #faf5ff 35%, #f3e8ff 70%, #ede9fe 100%)'
							: 'linear-gradient(to bottom, #030712 0%, #0a1929 35%, #0f1f3d 70%, #1e293b 100%)',
				}}
			/>

			{/* Multiple radial gradient overlays for depth */}
			<div
				className="absolute inset-0 opacity-100 transition-opacity duration-700"
				style={{ background: gradients.radial1 }}
			/>
			<div
				className="absolute inset-0 opacity-100 transition-opacity duration-700"
				style={{ background: gradients.radial2 }}
			/>
			<div
				className="absolute inset-0 opacity-100 transition-opacity duration-700"
				style={{ background: gradients.radial3 }}
			/>

			{/* Subtle noise texture for depth */}
			<div
				className="absolute inset-0 opacity-[0.02] mix-blend-soft-light pointer-events-none"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
					backgroundSize: '180px 180px',
				}}
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
						toneMappingExposure: theme === 'light' ? 1.15 : 1.35,
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
							args={[gradients.fog, 15, breakpoint === 'mobile' ? 50 : 60]}
						/>
						<SceneContent perfLevel={perfLevel} />
					</PerformanceMonitor>
				</Canvas>
			</Suspense>

			{/* Enhanced bottom fade */}
			<div
				className="absolute inset-x-0 bottom-0 h-[28rem] pointer-events-none transition-all duration-700"
				style={{ background: gradients.bottomFade }}
			/>

			{/* Enhanced top fade */}
			<div
				className="absolute inset-x-0 top-0 h-48 pointer-events-none transition-all duration-700"
				style={{ background: gradients.topFade }}
			/>
		</div>
	);
};

export default Background3D;
