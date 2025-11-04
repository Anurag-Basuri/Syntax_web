import { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Plane, Float, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Component for the 3D Logo Geometry
const Logo3D = () => {
	const ref = useRef();
	const { chevronRight, chevronLeft } = useMemo(() => {
		const right = new THREE.Shape();
		right.moveTo(0, 0.75);
		right.lineTo(0.5, 0);
		right.lineTo(0, -0.75);
		right.lineTo(0.25, -0.75);
		right.lineTo(0.75, 0);
		right.lineTo(0.25, 0.75);
		right.closePath();

		const left = new THREE.Shape();
		left.moveTo(0, 0.75);
		left.lineTo(-0.5, 0);
		left.lineTo(0, -0.75);
		left.lineTo(-0.25, -0.75);
		left.lineTo(-0.75, 0);
		left.lineTo(-0.25, 0.75);
		left.closePath();

		return { chevronRight: right, chevronLeft: left };
	}, []);

	const extrudeSettings = useMemo(
		() => ({
			depth: 0.2,
			bevelEnabled: true,
			bevelThickness: 0.03,
			bevelSize: 0.02,
			bevelSegments: 3,
		}),
		[]
	);

	useFrame((state) => {
		const pointer = state.pointer ?? { x: 0, y: 0 };
		if (ref.current) {
			ref.current.rotation.y = THREE.MathUtils.lerp(
				ref.current.rotation.y,
				(pointer.x * Math.PI) / 15,
				0.03
			);
			ref.current.rotation.x = THREE.MathUtils.lerp(
				ref.current.rotation.x,
				(-pointer.y * Math.PI) / 15,
				0.03
			);
		}
	});

	return (
		<Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.8}>
			<group ref={ref} position={[0, 0.2, 0]} scale={1.8}>
				<mesh position={[-0.5, 0, 0]}>
					<extrudeGeometry args={[chevronLeft, extrudeSettings]} />
					<meshStandardMaterial
						color="var(--accent-1)"
						emissive="var(--accent-1)"
						emissiveIntensity={0.6}
						metalness={0.8}
						roughness={0.25}
					/>
				</mesh>
				<mesh position={[0.5, 0, 0]}>
					<extrudeGeometry args={[chevronRight, extrudeSettings]} />
					<meshStandardMaterial
						color="var(--accent-2)"
						emissive="var(--accent-2)"
						emissiveIntensity={0.4}
						metalness={0.8}
						roughness={0.25}
					/>
				</mesh>
			</group>
		</Float>
	);
};

// Component for the infinite grid background
const InfiniteGrid = () => {
	const gridRef = useRef();
	useFrame(() => {
		if (gridRef.current) {
			gridRef.current.position.z = (gridRef.current.position.z + 0.015) % 10;
		}
	});

	return (
		<Plane
			ref={gridRef}
			args={[100, 100, 100, 100]}
			rotation-x={-Math.PI / 2}
			position={[0, -4, 0]}
		>
			<shaderMaterial
				transparent
				vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
				fragmentShader={`
          varying vec2 vUv;
          void main() {
            vec2 grid = abs(fract(vUv * 15.0 - 0.5) - 0.5) / fwidth(vUv * 15.0);
            float line = min(grid.x, grid.y);
            float opacity = 1.0 - min(line, 1.0);
            
            float dist = distance(vUv, vec2(0.5));
            opacity *= 1.0 - smoothstep(0.4, 0.5, dist);

            gl_FragColor = vec4(vec3(0.2, 0.4, 0.8), opacity * 0.2);
          }
        `}
			/>
		</Plane>
	);
};

// Component for the starfield
const Starfield = () => {
	const ref = useRef();
	const positions = useMemo(() => {
		const count = 5000;
		const pos = new Float32Array(count * 3);
		for (let i = 0; i < count * 3; i++) {
			pos[i] = (Math.random() - 0.5) * 100;
		}
		return pos;
	}, []);

	useFrame((_, delta) => {
		if (ref.current) {
			ref.current.rotation.y += delta / 50;
		}
	});

	return (
		<points ref={ref}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					count={positions.length / 3}
					array={positions}
					itemSize={3}
				/>
			</bufferGeometry>
			<pointsMaterial size={0.03} color="#5881b3" transparent opacity={0.6} />
		</points>
	);
};

const Background3D = () => {
	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			<div className="absolute inset-0 bg-bg-base" />
			<Suspense fallback={null}>
				<Canvas camera={{ position: [0, 0, 8], fov: 45 }} style={{ pointerEvents: 'auto' }}>
					<ambientLight intensity={0.2} />
					<directionalLight position={[5, 5, 5]} intensity={0.5} />
					<Environment preset="city" blur={0.6} />

					<Logo3D />
					<InfiniteGrid />
					<Starfield />

					<EffectComposer>
						<Bloom
							intensity={0.8}
							luminanceThreshold={0.3}
							luminanceSmoothing={0.9}
							height={1024}
						/>
					</EffectComposer>
				</Canvas>
			</Suspense>
			<div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg-base to-transparent" />
		</div>
	);
};

export default Background3D;
