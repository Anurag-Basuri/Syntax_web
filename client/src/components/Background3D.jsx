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

// Optimized 3D Logo
const Logo3D = () => {
	const meshRef = useRef();
	const groupRef = useRef();
	const glowRef = useRef();
	const texture = useTexture(logo);
	const { gl } = useThree();
	const theme = useTheme();
	const breakpoint = useResponsive();

	useEffect(() => {
		if (!texture) return;
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = gl.capabilities.getMaxAnisotropy?.() || 8;
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.generateMipmaps = true;
		texture.needsUpdate = true;
	}, [texture, gl]);

	const aspect = texture?.image ? texture.image.width / texture.image.height : 1;

	const { scale, yPosition } = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { scale: 3.0, yPosition: 1.5 };
			case 'tablet':
				return { scale: 4.0, yPosition: 2.0 };
			default:
				return { scale: 5.0, yPosition: 2.5 };
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
			meshRef.current.rotation.z = Math.sin(time * 0.2) * 0.02;
		}

		if (groupRef.current) {
			groupRef.current.position.y = yPosition + Math.sin(time * 0.5) * 0.1;
		}

		if (glowRef.current) {
			const glowIntensity = 0.6 + Math.sin(time * 0.8) * 0.1;
			glowRef.current.material.opacity = (theme === 'light' ? 0.15 : 0.25) * glowIntensity;
		}
	});

	return (
		<Float
			speed={1.5}
			rotationIntensity={0.2}
			floatIntensity={0.3}
			floatingRange={[-0.05, 0.05]}
		>
			<group ref={groupRef} position={[0, yPosition, 0]}>
				<group ref={meshRef}>
					{/* Glow layer */}
					<mesh
						ref={glowRef}
						scale={[scale * aspect * 1.3, scale * 1.3, 1]}
						position={[0, 0, -0.15]}
						renderOrder={9}
					>
						<planeGeometry />
						<meshBasicMaterial
							transparent
							opacity={theme === 'light' ? 0.15 : 0.25}
							color={theme === 'light' ? '#a78bfa' : '#60a5fa'}
							blending={THREE.AdditiveBlending}
							depthTest={false}
						/>
					</mesh>

					{/* Main logo mesh */}
					<mesh scale={[scale * aspect, scale, 1]} renderOrder={10}>
						<planeGeometry />
						<meshStandardMaterial
							map={texture}
							transparent={true}
							alphaTest={0.01}
							side={THREE.DoubleSide}
							metalness={theme === 'light' ? 0.3 : 0.6}
							roughness={theme === 'light' ? 0.5 : 0.4}
							envMapIntensity={theme === 'light' ? 1.0 : 1.4}
							depthTest={false}
							depthWrite={false}
						/>
					</mesh>
				</group>
			</group>
		</Float>
	);
};

// Optimized wave mesh
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

	const colors = useMemo(() => {
		if (theme === 'light') {
			return {
				base: 'vec3(0.65, 0.70, 0.99)',
				highlight: 'vec3(0.40, 0.85, 0.99)',
				ambient: 'vec3(0.88, 0.90, 0.99)',
			};
		}
		return {
			base: 'vec3(0.14, 0.26, 0.56)',
			highlight: 'vec3(0.30, 0.78, 0.98)',
			ambient: 'vec3(0.10, 0.19, 0.46)',
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
                        
                        float elevationFactor = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);
                        vec3 color = mix(ambientColor, baseColor, elevationFactor);
                        color = mix(color, highlightColor, smoothstep(0.6, 1.0, elevationFactor) * 0.5);
                        
                        float centerDist = distance(vUv, vec2(0.5));
                        float edgeFade = 1.0 - smoothstep(0.25, 0.65, centerDist);
                        float verticalGradient = smoothstep(0.1, 0.9, vUv.y) * 0.3;
                        
                        float alpha = gridPattern * edgeFade * (0.3 + verticalGradient);
                        
                        gl_FragColor = vec4(color, alpha * 0.8);
                    }
                `}
			/>
		</mesh>
	);
};

// Optimized particle system
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

	const color = useMemo(() => (theme === 'light' ? '#a78bfa' : '#60a5fa'), [theme]);

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
				opacity={theme === 'light' ? 0.5 : 0.65}
				sizeAttenuation
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
};

// Optimized dynamic lights
const DynamicLights = () => {
	const spot1 = useRef();
	const theme = useTheme();

	useFrame((state) => {
		const time = state.clock.elapsedTime;
		if (spot1.current) {
			spot1.current.intensity = (theme === 'light' ? 1.5 : 1.8) + Math.sin(time * 0.5) * 0.3;
		}
	});

	const lightColors = useMemo(() => {
		if (theme === 'light') {
			return {
				hemisphere: { sky: '#8b5cf6', ground: '#fde68a' },
				ambient: 0.8,
				spot1: '#818cf8',
			};
		}
		return {
			hemisphere: { sky: '#38bdf8', ground: '#0c4a6e' },
			ambient: 0.5,
			spot1: '#818cf8',
		};
	}, [theme]);

	return (
		<>
			<ambientLight intensity={lightColors.ambient} />
			<hemisphereLight
				skyColor={lightColors.hemisphere.sky}
				groundColor={lightColors.hemisphere.ground}
				intensity={theme === 'light' ? 1.0 : 0.7}
			/>
			<spotLight
				ref={spot1}
				position={[0, 15, 10]}
				angle={0.4}
				penumbra={1}
				intensity={theme === 'light' ? 1.5 : 1.8}
				color={lightColors.spot1}
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

	const gradients = useMemo(() => {
		if (theme === 'light') {
			return {
				radial1:
					'radial-gradient(ellipse 80% 70% at 50% 30%, rgba(139,92,246,.15), transparent)',
				fog: '#f3e8ff',
				bottomFade:
					'linear-gradient(to top, rgba(255,255,255,0.98), rgba(255,255,255,0.8), transparent)',
			};
		}
		return {
			radial1:
				'radial-gradient(ellipse 80% 70% at 50% 30%, rgba(129,140,248,.2), transparent)',
			fog: '#0f172a',
			bottomFade: 'linear-gradient(to top, rgba(3,7,18,0.98), rgba(3,7,18,0.9), transparent)',
		};
	}, [theme]);

	const cameraConfig = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { position: [0, 3, 16], fov: 60 };
			case 'tablet':
				return { position: [0, 3.5, 14], fov: 56 };
			default:
				return { position: [0, 4, 13], fov: 52 };
		}
	}, [breakpoint]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{/* Base gradient */}
			<div
				className="absolute inset-0 transition-all duration-700 ease-in-out"
				style={{
					background:
						theme === 'light'
							? 'linear-gradient(to bottom, #ffffff, #f3e8ff)'
							: 'linear-gradient(to bottom, #030712, #0f172a)',
				}}
			/>

			{/* Radial gradient overlay */}
			<div
				className="absolute inset-0 opacity-100 transition-opacity duration-700"
				style={{ background: gradients.radial1 }}
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
						antialias: false,
						alpha: true,
						powerPreference: 'low-power',
						toneMapping: THREE.NoToneMapping,
					}}
					dpr={[1, 1.5]}
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

			{/* Bottom fade */}
			<div
				className="absolute inset-x-0 bottom-0 h-[25rem] pointer-events-none transition-all duration-700"
				style={{ background: gradients.bottomFade }}
			/>

			{/* Top fade */}
			<div
				className="absolute inset-x-0 top-0 h-40 pointer-events-none transition-all duration-700"
				style={{
					background:
						theme === 'light'
							? 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)'
							: 'linear-gradient(to bottom, rgba(3,7,18,0.7), transparent)',
				}}
			/>
		</div>
	);
};

export default Background3D;
