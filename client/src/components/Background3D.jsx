import { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Plane, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import logo from '../assets/logo.png';

// Interactive 3D Logo with glow effect
const Logo3D = () => {
	const ref = useRef();
	const glowRef = useRef();
	const texture = useTexture(logo);
	const aspect = texture.image ? texture.image.width / texture.image.height : 1;
	const scale = 3.5;

	useFrame((state) => {
		const pointer = state.pointer ?? { x: 0, y: 0 };
		const time = state.clock.elapsedTime;

		if (ref.current) {
			ref.current.rotation.y = THREE.MathUtils.lerp(
				ref.current.rotation.y,
				(pointer.x * Math.PI) / 12,
				0.05
			);
			ref.current.rotation.x = THREE.MathUtils.lerp(
				ref.current.rotation.x,
				(-pointer.y * Math.PI) / 12,
				0.05
			);
		}

		// Animated glow intensity
		if (glowRef.current) {
			glowRef.current.material.opacity = 0.3 + Math.sin(time * 0.5) * 0.15;
		}
	});

	return (
		<Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
			<group ref={ref} position={[0, 0.5, 0]}>
				{/* Main logo */}
				<mesh scale={[scale * aspect, scale, 1]}>
					<planeGeometry />
					<meshStandardMaterial
						map={texture}
						transparent={true}
						metalness={0.8}
						roughness={0.2}
						emissive="#0ea5e9"
						emissiveIntensity={0.3}
					/>
				</mesh>

				{/* Glow halo effect */}
				<mesh
					ref={glowRef}
					scale={[scale * aspect * 1.15, scale * 1.15, 1]}
					position={[0, 0, -0.1]}
				>
					<planeGeometry />
					<meshBasicMaterial color="#0ea5e9" transparent={true} opacity={0.3} />
				</mesh>
			</group>
		</Float>
	);
};

// Dynamic wave mesh that deforms based on mouse position
const WaveMesh = () => {
	const meshRef = useRef();
	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uMouse: { value: new THREE.Vector2(0, 0) },
		}),
		[]
	);

	useFrame((state) => {
		const pointer = state.pointer ?? { x: 0, y: 0 };
		uniforms.uTime.value = state.clock.elapsedTime;
		uniforms.uMouse.value.lerp(new THREE.Vector2(pointer.x, pointer.y), 0.05);
	});

	return (
		<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
			<planeGeometry args={[80, 80, 128, 128]} />
			<shaderMaterial
				transparent
				uniforms={uniforms}
				vertexShader={`
                    uniform float uTime;
                    uniform vec2 uMouse;
                    varying vec2 vUv;
                    varying float vElevation;

                    void main() {
                        vUv = uv;
                        vec3 pos = position;

                        // Create waves
                        float wave1 = sin(pos.x * 0.3 + uTime * 0.5) * 0.5;
                        float wave2 = sin(pos.y * 0.2 + uTime * 0.3) * 0.5;
                        float wave3 = sin((pos.x + pos.y) * 0.15 + uTime * 0.4) * 0.3;

                        // Mouse interaction
                        vec2 mouseInfluence = uMouse * 10.0;
                        float mouseDist = distance(pos.xy, mouseInfluence);
                        float mouseWave = sin(mouseDist * 0.5 - uTime * 2.0) * exp(-mouseDist * 0.1) * 2.0;

                        vElevation = wave1 + wave2 + wave3 + mouseWave;
                        pos.z += vElevation;

                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
				fragmentShader={`
                    uniform float uTime;
                    varying vec2 vUv;
                    varying float vElevation;

                    void main() {
                        // Grid lines
                        vec2 grid = abs(fract(vUv * 20.0 - 0.5) - 0.5) / fwidth(vUv * 20.0);
                        float line = min(grid.x, grid.y);
                        float gridPattern = 1.0 - min(line, 1.0);

                        // Color based on elevation
                        vec3 color1 = vec3(0.05, 0.4, 0.8); // Blue
                        vec3 color2 = vec3(0.1, 0.6, 1.0);  // Light blue
                        vec3 color = mix(color1, color2, vElevation * 0.5 + 0.5);

                        // Fade at edges
                        float edgeFade = 1.0 - smoothstep(0.3, 0.5, distance(vUv, vec2(0.5)));
                        
                        float alpha = gridPattern * edgeFade * 0.4;
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `}
			/>
		</mesh>
	);
};

// Multi-layered particle system
const ParticleNebula = ({
	count = 3000,
	size = 0.04,
	color = '#5881b3',
	speed = 1,
	radius = 50,
}) => {
	const ref = useRef();
	const positions = useMemo(() => {
		const pos = new Float32Array(count * 3);
		for (let i = 0; i < count * 3; i += 3) {
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const r = radius * Math.cbrt(Math.random());

			pos[i] = r * Math.sin(phi) * Math.cos(theta);
			pos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
			pos[i + 2] = r * Math.cos(phi);
		}
		return pos;
	}, [count, radius]);

	useFrame((state, delta) => {
		if (ref.current) {
			ref.current.rotation.y += delta * 0.02 * speed;
			ref.current.rotation.x += delta * 0.01 * speed;
		}
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
			</bufferGeometry>
			<pointsMaterial size={size} color={color} transparent opacity={0.6} sizeAttenuation />
		</points>
	);
};

// Floating orbs for depth
const FloatingOrbs = () => {
	const orbsData = useMemo(
		() =>
			Array.from({ length: 8 }, () => ({
				position: [
					(Math.random() - 0.5) * 20,
					Math.random() * 10 - 2,
					(Math.random() - 0.5) * 20,
				],
				scale: Math.random() * 0.3 + 0.1,
				speed: Math.random() * 0.5 + 0.3,
			})),
		[]
	);

	return (
		<>
			{orbsData.map((orb, i) => (
				<Float key={i} speed={orb.speed} rotationIntensity={0.2} floatIntensity={1}>
					<mesh position={orb.position} scale={orb.scale}>
						<sphereGeometry args={[1, 16, 16]} />
						<meshStandardMaterial
							color="#0ea5e9"
							emissive="#0ea5e9"
							emissiveIntensity={0.5}
							transparent
							opacity={0.3}
							roughness={0.2}
							metalness={0.8}
						/>
					</mesh>
				</Float>
			))}
		</>
	);
};

const Background3D = () => {
	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{/* Base gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-bg-base via-bg-soft to-bg-base" />

			{/* Radial gradient overlay */}
			<div
				className="absolute inset-0 opacity-30"
				style={{
					background:
						'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(14, 165, 233, 0.15), transparent)',
				}}
			/>

			{/* 3D Scene */}
			<Suspense fallback={null}>
				<Canvas
					camera={{ position: [0, 2, 10], fov: 50 }}
					style={{ pointerEvents: 'auto' }}
					gl={{ antialias: true, alpha: true }}
				>
					{/* Atmospheric fog */}
					<fog attach="fog" args={['#030712', 5, 50]} />

					{/* Lighting */}
					<ambientLight intensity={0.3} />
					<hemisphereLight skyColor="#0ea5e9" groundColor="#030712" intensity={0.5} />
					<spotLight
						position={[10, 15, 10]}
						angle={0.3}
						penumbra={1}
						intensity={1.5}
						castShadow
					/>
					<pointLight position={[-10, 5, -10]} intensity={0.5} color="#2563eb" />

					{/* 3D Elements */}
					<Logo3D />
					<WaveMesh />
					<FloatingOrbs />

					{/* Multiple particle layers for depth */}
					<ParticleNebula
						count={2000}
						size={0.02}
						color="#3b82f6"
						speed={0.3}
						radius={40}
					/>
					<ParticleNebula
						count={1500}
						size={0.03}
						color="#0ea5e9"
						speed={0.5}
						radius={30}
					/>
					<ParticleNebula
						count={1000}
						size={0.04}
						color="#5881b3"
						speed={0.7}
						radius={25}
					/>
				</Canvas>
			</Suspense>

			{/* Bottom gradient fade */}
			<div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-bg-base via-bg-base/80 to-transparent pointer-events-none" />
		</div>
	);
};

export default Background3D;
