import { useRef, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Plane, Float } from '@react-three/drei';
import * as THREE from 'three';

// Component for the 3D Logo Geometry
const Logo3D = () => {
	const ref = useRef();
	const chevronRight = new THREE.Shape();
	chevronRight.moveTo(0, 0.75);
	chevronRight.lineTo(0.5, 0);
	chevronRight.lineTo(0, -0.75);
	chevronRight.lineTo(0.25, -0.75);
	chevronRight.lineTo(0.75, 0);
	chevronRight.lineTo(0.25, 0.75);
	chevronRight.closePath();

	const chevronLeft = new THREE.Shape();
	chevronLeft.moveTo(0, 0.75);
	chevronLeft.lineTo(-0.5, 0);
	chevronLeft.lineTo(0, -0.75);
	chevronLeft.lineTo(-0.25, -0.75);
	chevronLeft.lineTo(-0.75, 0);
	chevronLeft.lineTo(-0.25, 0.75);
	chevronLeft.closePath();

	const extrudeSettings = {
		depth: 0.2,
		bevelEnabled: true,
		bevelThickness: 0.02,
		bevelSize: 0.02,
		bevelSegments: 2,
	};

	useFrame((state) => {
		// Use state.pointer for mouse tracking
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
		<Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
			<group ref={ref} position={[0, 0.2, 0]} scale={1.5}>
				<mesh position={[-0.5, 0, 0]}>
					<extrudeGeometry args={[chevronLeft, extrudeSettings]} />
					<meshStandardMaterial
						color="var(--accent-1)"
						emissive="var(--accent-1)"
						emissiveIntensity={0.4}
						metalness={0.9}
						roughness={0.3}
					/>
				</mesh>
				<mesh position={[0.5, 0, 0]}>
					<extrudeGeometry args={[chevronRight, extrudeSettings]} />
					<meshStandardMaterial
						color="var(--accent-2)"
						emissive="var(--accent-2)"
						emissiveIntensity={0.2}
						metalness={0.9}
						roughness={0.3}
					/>
				</mesh>
			</group>
		</Float>
	);
};

const InfiniteGrid = () => {
	const gridRef = useRef();
	useFrame(() => {
		if (gridRef.current) {
			// Slow continuous scroll
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
            
            // Fade out at the edges
            float dist = distance(vUv, vec2(0.5));
            opacity *= 1.0 - smoothstep(0.4, 0.5, dist);

            gl_FragColor = vec4(vec3(0.2, 0.4, 0.8), opacity * 0.15);
          }
        `}
			/>
		</Plane>
	);
};

// Component for the starfield
const Starfield = () => {
	const ref = useRef();
	const [positions] = useState(() => {
		const count = 5000;
		const pos = new Float32Array(count * 3);
		for (let i = 0; i < count * 3; i++) {
			pos[i] = (Math.random() - 0.5) * 100;
		}
		return pos;
	});
	useFrame((_, delta) => {
		if (ref.current) {
			ref.current.rotation.y += delta / 50;
		}
	});

	return (
		<points ref={ref}>
			<bufferGeometry attach="geometry">
				<bufferAttribute
					attach="attributes-position"
					count={positions.length / 3}
					array={positions}
					itemSize={3}
				/>
			</bufferGeometry>
			<pointsMaterial
				attach="material"
				size={0.03}
				color="#5881b3"
				transparent
				opacity={0.6}
			/>
		</points>
	);
};

const Background3D = () => {
	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{/* Base gradient layers */}
			<div className="absolute inset-0 bg-bg-base" />
			<div
				className="absolute inset-0 opacity-20"
				style={{
					background:
						'radial-gradient(ellipse 80% 50% at 50% 35%, var(--accent-1), transparent)',
				}}
			/>

			{/* 3D Scene */}
			<Suspense fallback={null}>
				<Canvas
					camera={{ position: [0, 0, 8], fov: 45 }}
					style={{ pointerEvents: 'auto' }}
					className="opacity-70"
				>
					<ambientLight intensity={0.5} />
					<directionalLight position={[5, 5, 5]} intensity={1.5} />
					<Logo3D />
					<InfiniteGrid />
					<Starfield />
				</Canvas>
			</Suspense>

			{/* Bottom fade to blend with content */}
			<div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg-base to-transparent" />
		</div>
	);
};

export default Background3D;
