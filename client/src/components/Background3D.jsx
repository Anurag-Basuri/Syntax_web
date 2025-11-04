import React, { useRef, Suspense, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, useTexture } from '@react-three/drei';
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

// Enhanced 3D Logo with theme-aware materials
const Logo3D = () => {
	const ref = useRef();
	const texture = useTexture(logo);
	const { gl } = useThree();
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

	// Responsive scale
	const scale = useMemo(() => {
		const width = window.innerWidth;
		if (width < 640) return 2.8; // Mobile
		if (width < 1024) return 3.5; // Tablet
		return 4.2; // Desktop
	}, []);

	useFrame((state) => {
		const pointer = state.pointer ?? { x: 0, y: 0 };
		const time = state.clock.elapsedTime;

		if (ref.current) {
			ref.current.rotation.y = THREE.MathUtils.lerp(
				ref.current.rotation.y,
				(pointer.x * Math.PI) / 10,
				0.08
			);
			ref.current.rotation.x = THREE.MathUtils.lerp(
				ref.current.rotation.x,
				(-pointer.y * Math.PI) / 10,
				0.08
			);
			ref.current.rotation.z = Math.sin(time * 0.1) * 0.02;
		}
	});

	// Responsive positioning
	const yPosition = useMemo(() => {
		const width = window.innerWidth;
		if (width < 640) return 0.8;
		if (width < 1024) return 1.0;
		return 1.2;
	}, []);

	return (
		<Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.7}>
			<group ref={ref} position={[0, yPosition, 0]}>
				<mesh scale={[scale * aspect, scale, 1]} renderOrder={10}>
					<planeGeometry />
					<meshPhysicalMaterial
						map={texture}
						transparent={true}
						metalness={theme === 'light' ? 0.7 : 0.9}
						roughness={theme === 'light' ? 0.3 : 0.2}
						clearcoat={1.0}
						clearcoatRoughness={0.2}
						reflectivity={theme === 'light' ? 0.6 : 0.8}
						ior={1.5}
						transmission={theme === 'light' ? 0.05 : 0.1}
						thickness={0.5}
						depthTest={false}
					/>
				</mesh>
			</group>
		</Float>
	);
};

// Theme-aware cloth mesh
const WaveMesh = () => {
	const meshRef = useRef();
	const theme = useTheme();

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uAmplitude: { value: 1.5 },
			uFrequency: { value: 0.5 },
		}),
		[]
	);

	useFrame((state) => {
		uniforms.uTime.value = state.clock.elapsedTime;
	});

	// Theme-aware colors
	const colors = useMemo(() => {
		if (theme === 'light') {
			return {
				base: 'vec3(0.39, 0.40, 0.95)', // Lavender
				highlight: 'vec3(0.22, 0.74, 0.97)', // Light Blue
				deep: 'vec3(0.55, 0.52, 0.98)', // Lighter Lavender
			};
		}
		return {
			base: 'vec3(0.08, 0.20, 0.50)', // Dark Cyan
			highlight: 'vec3(0.22, 0.74, 0.97)', // Light Blue
			deep: 'vec3(0.51, 0.55, 0.97)', // Lavender
		};
	}, [theme]);

	return (
		<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
			<planeGeometry args={[100, 100, 150, 150]} />
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
                    varying vec3 vNormal;

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
                        m = m*m;
                        m = m*m;
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
                        
                        float noise1 = snoise(pos.xy * 0.08 + uTime * 0.15) * 1.2;
                        float noise2 = snoise(pos.xy * 0.15 - uTime * 0.1) * 0.8;
                        float noise3 = snoise(pos.xy * 0.25 + uTime * 0.2) * 0.5;
                        
                        float wave1 = sin(pos.x * uFrequency * 0.1 + uTime * 0.3) * uAmplitude * 0.6;
                        float wave2 = cos(pos.y * uFrequency * 0.08 + uTime * 0.25) * uAmplitude * 0.8;
                        float ripple = sin(length(pos.xy) * 0.15 - uTime * 0.4) * 0.6;
                        
                        vElevation = (noise1 + noise2 + noise3 + wave1 + wave2 + ripple) * 0.7;
                        pos.z += vElevation;
                        
                        vNormal = normalize(normalMatrix * normal);
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
				fragmentShader={`
                    varying vec2 vUv;
                    varying float vElevation;
                    varying vec3 vNormal;
                    
                    void main() {
                        vec2 grid = abs(fract(vUv * 25.0 - 0.5) - 0.5) / fwidth(vUv * 25.0);
                        float line = min(grid.x, grid.y);
                        float gridPattern = 1.0 - min(line, 1.0);
                        
                        vec3 baseColor = ${colors.base};
                        vec3 highlightColor = ${colors.highlight};
                        vec3 deepColor = ${colors.deep};
                        
                        vec3 color = mix(baseColor, deepColor, clamp(vElevation * 0.5 + 0.5, 0.0, 1.0));
                        color = mix(color, highlightColor, clamp(vElevation * 0.8, 0.0, 1.0));
                        
                        float edgeFade = 1.0 - smoothstep(0.25, 0.55, distance(vUv, vec2(0.5)));
                        float gradient = smoothstep(0.0, 1.0, vUv.y) * 0.3;
                        
                        float alpha = gridPattern * edgeFade * (0.3 + gradient);
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `}
			/>
		</mesh>
	);
};

// Theme-aware particles
const ParticleNebula = ({
	count = 1500,
	size = 0.03,
	color = '#5881b3',
	speed = 0.5,
	radius = 40,
}) => {
	const ref = useRef();

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

			siz[i] = size * (0.5 + Math.random() * 1.5);
		}
		return { positions: pos, sizes: siz };
	}, [count, radius, size]);

	useFrame((state, delta) => {
		if (!ref.current) return;

		ref.current.rotation.y += delta * 0.04 * speed;
		ref.current.rotation.x += delta * 0.015 * speed;

		ref.current.rotation.x = THREE.MathUtils.lerp(
			ref.current.rotation.x,
			state.pointer.y * 0.08,
			0.03
		);
		ref.current.rotation.y += THREE.MathUtils.lerp(0, state.pointer.x * 0.03, 0.03);
	});

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
				size={size}
				color={color}
				transparent
				opacity={0.65}
				sizeAttenuation
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
};

// Theme-aware dynamic lights
const DynamicLights = () => {
	const spot1 = useRef();
	const spot2 = useRef();
	const theme = useTheme();

	useFrame((state) => {
		const time = state.clock.elapsedTime;

		if (spot1.current) {
			spot1.current.intensity = 1.2 + Math.sin(time * 0.5) * 0.3;
			spot1.current.position.x = Math.sin(time * 0.3) * 5 + 10;
		}

		if (spot2.current) {
			spot2.current.intensity = 0.8 + Math.cos(time * 0.4) * 0.2;
			spot2.current.position.x = Math.cos(time * 0.25) * 5 - 10;
		}
	});

	const lightColors = useMemo(() => {
		if (theme === 'light') {
			return {
				hemisphere: { sky: '#6366f1', ground: '#faf5ff' },
				spot1: '#38bdf8',
				spot2: '#818cf8',
				point: '#a78bfa',
			};
		}
		return {
			hemisphere: { sky: '#38bdf8', ground: '#083344' },
			spot1: '#38bdf8',
			spot2: '#818cf8',
			point: '#a78bfa',
		};
	}, [theme]);

	return (
		<>
			<ambientLight intensity={theme === 'light' ? 0.6 : 0.4} />
			<hemisphereLight
				skyColor={lightColors.hemisphere.sky}
				groundColor={lightColors.hemisphere.ground}
				intensity={theme === 'light' ? 0.8 : 0.6}
			/>
			<spotLight
				ref={spot1}
				position={[10, 15, 10]}
				angle={0.35}
				penumbra={1}
				intensity={theme === 'light' ? 1.0 : 1.2}
				color={lightColors.spot1}
				castShadow
			/>
			<spotLight
				ref={spot2}
				position={[-10, 12, 5]}
				angle={0.4}
				penumbra={1}
				intensity={theme === 'light' ? 0.7 : 0.8}
				color={lightColors.spot2}
			/>
			<pointLight
				position={[0, 5, -5]}
				intensity={theme === 'light' ? 0.4 : 0.5}
				color={lightColors.point}
				distance={20}
			/>
		</>
	);
};

const Background3D = () => {
	const theme = useTheme();

	// Theme-aware gradients
	const gradients = useMemo(() => {
		if (theme === 'light') {
			return {
				radial1:
					'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(99,102,241,.12), transparent)',
				radial2: 'radial-gradient(circle at 20% 80%, rgba(56,189,248,.1), transparent 50%)',
				fog: '#faf5ff',
			};
		}
		return {
			radial1:
				'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(129,140,248,.15), transparent)',
			radial2: 'radial-gradient(circle at 20% 80%, rgba(56,189,248,.1), transparent 50%)',
			fog: '#083344',
		};
	}, [theme]);

	// Responsive particle counts
	const particleCounts = useMemo(() => {
		const width = window.innerWidth;
		if (width < 640) return [800, 600, 400];
		if (width < 1024) return [1000, 750, 500];
		return [1200, 900, 600];
	}, []);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{/* Base gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-bg-base via-bg-soft to-bg-base transition-colors duration-500" />

			{/* Radial gradients */}
			<div
				className="absolute inset-0 opacity-25 transition-opacity duration-500"
				style={{ background: gradients.radial1 }}
			/>
			<div
				className="absolute inset-0 opacity-15 transition-opacity duration-500"
				style={{ background: gradients.radial2 }}
			/>

			<Suspense fallback={null}>
				<Canvas
					camera={{ position: [0, 2, 10], fov: 50, near: 0.1, far: 100 }}
					style={{ pointerEvents: 'auto' }}
					gl={{
						antialias: true,
						alpha: true,
						powerPreference: 'high-performance',
						toneMapping: THREE.ACESFilmicToneMapping,
						toneMappingExposure: theme === 'light' ? 1.0 : 1.2,
					}}
					dpr={[1, Math.min(window.devicePixelRatio, 2)]}
				>
					<fog attach="fog" args={[gradients.fog, 8, 55]} />

					<DynamicLights />
					<Logo3D />
					<WaveMesh />

					{/* Responsive particle layers */}
					<ParticleNebula
						count={particleCounts[0]}
						size={0.02}
						color="#818cf8"
						speed={0.3}
						radius={35}
					/>
					<ParticleNebula
						count={particleCounts[1]}
						size={0.028}
						color="#38bdf8"
						speed={0.5}
						radius={25}
					/>
					<ParticleNebula
						count={particleCounts[2]}
						size={0.035}
						color="#a78bfa"
						speed={0.7}
						radius={18}
					/>
				</Canvas>
			</Suspense>

			{/* Bottom fade */}
			<div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-bg-base via-bg-base/90 to-transparent pointer-events-none transition-colors duration-500" />
		</div>
	);
};

export default Background3D;
