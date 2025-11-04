import React, { Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import logo from '../assets/logo.png';

useTexture.preload?.(logo);

// --- Hooks & Helpers ---
const useTheme = () => {
	const [theme, setTheme] = React.useState(
		typeof document !== 'undefined'
			? document.documentElement.getAttribute('data-theme') || 'dark'
			: 'dark'
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

const useResponsive = () => {
	const [breakpoint, setBreakpoint] = useState('desktop');
	useEffect(() => {
		const update = () => {
			const w = window.innerWidth;
			if (w < 640) setBreakpoint('mobile');
			else if (w < 1024) setBreakpoint('tablet');
			else setBreakpoint('desktop');
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);
	return breakpoint;
};

const readCssVar = (name) =>
	typeof document !== 'undefined'
		? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000'
		: '#000';

const isWebGLAvailable = () => {
	try {
		const canvas = document.createElement('canvas');
		return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
	} catch {
		return false;
	}
};

// --- R3F Scene Components ---

// Faint, anti-aliased animated grid (Next.js vibe)
const Grid = ({ theme }) => {
	const prefersReduced = useMemo(
		() => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		[]
	);
	const uniforms = useMemo(() => {
		const isLight = theme === 'light';
		const gridHex = isLight ? '#0f172a' : '#cbd5e1';
		return {
			uTime: { value: 0 },
			uGridColor: { value: new THREE.Color(gridHex) },
			uGridSize: { value: 36.0 },
			uFadeDistance: { value: 0.65 },
			uFadeSharpness: { value: 0.8 },
			uAlpha: { value: isLight ? 0.22 : 0.2 }, // slightly increased for visibility
			uSpeed: { value: prefersReduced ? 0.0 : 0.01 },
		};
	}, [theme, prefersReduced]);

	useFrame((state) => {
		uniforms.uTime.value = state.clock.elapsedTime;
	});

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} renderOrder={-2}>
			<planeGeometry args={[500, 500, 1, 1]} />
			<shaderMaterial
				transparent
				extensions={{ derivatives: true }}
				uniforms={uniforms}
				vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
				fragmentShader={`
          #ifdef GL_OES_standard_derivatives
          #extension GL_OES_standard_derivatives : enable
          #endif

          uniform float uTime;
          uniform vec3  uGridColor;
          uniform float uGridSize;
          uniform float uFadeDistance;
          uniform float uFadeSharpness;
          uniform float uAlpha;
          uniform float uSpeed;
          varying vec3 vWorldPosition;

          float aafLine(float v, float width){
            float dv = fwidth(v);
            return 1.0 - smoothstep(0.5 - width - dv, 0.5 + width + dv, abs(fract(v) - 0.5));
          }

          void main() {
            vec2 uv = vWorldPosition.xz / uGridSize;
            uv.y += uTime * uSpeed;

            float gx = aafLine(uv.x, 0.015);
            float gy = aafLine(uv.y, 0.015);
            float grid = max(gx, gy);

            float dist = length(vWorldPosition.xz);
            float fade = 1.0 - smoothstep(uFadeDistance, uFadeDistance + uFadeSharpness, dist / 100.0);

            vec3 color = uGridColor;
            float alpha = grid * fade * uAlpha;
            if (alpha <= 0.001) discard;
            gl_FragColor = vec4(color, alpha);
          }
        `}
			/>
		</mesh>
	);
};

// Radial glow shaders (cleaner than flat planes)
const RadialGlow = ({
	position = [0, 0, -30],
	size = [120, 120],
	color = '#fff',
	opacity = 0.1,
}) => {
	const uniforms = useMemo(
		() => ({
			uColor: { value: new THREE.Color(color) },
			uOpacity: { value: opacity },
		}),
		[color, opacity]
	);

	return (
		<mesh position={position} renderOrder={-3}>
			<planeGeometry args={size} />
			<shaderMaterial
				transparent
				blending={THREE.AdditiveBlending}
				depthWrite={false}
				uniforms={uniforms}
				vertexShader={`
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
				fragmentShader={`
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          void main(){
            vec2 p = vUv - 0.5;
            float d = length(p) * 2.0;
            float a = smoothstep(1.0, 0.0, d); // center bright, soft edge
            gl_FragColor = vec4(uColor, a * uOpacity);
          }
        `}
			/>
		</mesh>
	);
};

const Glows = ({ theme }) => {
	const accent1 = useMemo(() => readCssVar('--accent-1'), [theme]);
	const accent2 = useMemo(() => readCssVar('--accent-2'), [theme]);
	const isLight = theme === 'light';
	return (
		<>
			<RadialGlow
				position={[0, 5, -28]}
				size={[140, 140]}
				color={accent1}
				opacity={isLight ? 0.14 : 0.16}
			/>
			<RadialGlow
				position={[42, 12, -36]}
				size={[180, 180]}
				color={accent2}
				opacity={isLight ? 0.08 : 0.1}
			/>
		</>
	);
};

// Subtle, enhanced logo with halo + sheen (replaces SubtleLogo)
const EnhancedLogo = ({ breakpoint }) => {
	const group = useRef();
	const mesh = useRef();
	const texture = useTexture(logo);
	const theme = useTheme();
	const isLight = theme === 'light';

	// Texture quality
	useEffect(() => {
		if (!texture) return;
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = 8;
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.generateMipmaps = true;
		texture.needsUpdate = true;
	}, [texture]);

	// Get aspect from image when ready
	const [aspect, setAspect] = useState(1);
	useEffect(() => {
		if (texture?.image?.width && texture?.image?.height) {
			setAspect(texture.image.width / texture.image.height);
		}
	}, [texture]);

	// Responsive screen-based sizing (world units from camera fov)
	const { camera } = useThree();
	const targetZ = -15; // same depth as before
	const frac = breakpoint === 'mobile' ? 0.34 : breakpoint === 'tablet' ? 0.3 : 0.26; // screen height fraction
	const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
	const scaleXY = useMemo(() => {
		const dist = Math.abs(targetZ - (camera?.position?.z ?? 5));
		const worldH = 2 * Math.tan(THREE.MathUtils.degToRad((camera?.fov ?? 60) / 2)) * dist;
		const h = clamp(worldH * frac, 8, 22); // safe bounds
		return [h * aspect, h];
	}, [camera?.fov, camera?.position?.z, aspect, frac]);

	// Subtle parallax + gentle float/tilt
	const prefersReduced =
		typeof window !== 'undefined' &&
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	useFrame((state) => {
		if (!group.current) return;
		const { pointer, clock } = state;
		const t = clock.elapsedTime;

		// Parallax & tilt
		const px = prefersReduced ? 0 : (breakpoint === 'mobile' ? 0.2 : 0.35) * pointer.x;
		const py = prefersReduced ? 0 : (breakpoint === 'mobile' ? 0.2 : 0.35) * pointer.y;

		group.current.position.x = THREE.MathUtils.damp(group.current.position.x, px, 4, 0.12);
		group.current.position.y = THREE.MathUtils.damp(group.current.position.y, py, 4, 0.12);

		const tiltX = prefersReduced ? 0 : THREE.MathUtils.degToRad(py * 2.5);
		const tiltY = prefersReduced ? 0 : THREE.MathUtils.degToRad(px * -3.0);
		group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, tiltX, 4, 0.12);
		group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, tiltY, 4, 0.12);

		// Gentle breathing scale
		const s = 1 + (prefersReduced ? 0 : Math.sin(t * 0.35) * 0.008);
		group.current.scale.setScalar(s);
	});

	// Halo size (slightly larger than logo)
	const haloColor = readCssVar('--accent-1');
	const haloSize = useMemo(() => [scaleXY[0] * 1.25, scaleXY[1] * 1.25], [scaleXY]);

	// Animated sheen shader
	const uniforms = useMemo(
		() => ({
			uMap: { value: texture ?? null },
			uTime: { value: 0 },
			uOpacity: { value: isLight ? 0.1 : 0.12 }, // a bit more visible than before, still subtle
			uSheen: { value: prefersReduced ? 0.0 : 0.12 },
		}),
		[texture, isLight, prefersReduced]
	);

	useFrame((state) => {
		uniforms.uTime.value = state.clock.elapsedTime;
	});

	return (
		<group ref={group} position={[0, 0, 0]} renderOrder={-1}>
			{/* Soft halo behind the logo */}
			<mesh position={[0, 0, targetZ - 0.8]}>
				<planeGeometry args={haloSize} />
				<shaderMaterial
					transparent
					blending={THREE.AdditiveBlending}
					depthWrite={false}
					uniforms={{
						uColor: { value: new THREE.Color(haloColor) },
						uOpacity: { value: isLight ? 0.1 : 0.12 },
					}}
					vertexShader={`
            varying vec2 vUv;
            void main(){
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
					fragmentShader={`
            uniform vec3 uColor;
            uniform float uOpacity;
            varying vec2 vUv;
            void main(){
              vec2 p = vUv - 0.5;
              float r = length(p) * 2.0;
              float a = smoothstep(1.0, 0.0, r);
              gl_FragColor = vec4(uColor, a * uOpacity);
            }
          `}
				/>
			</mesh>

			{/* Logo with subtle sheen and edge softening */}
			<mesh ref={mesh} position={[0, 0, targetZ]}>
				<planeGeometry args={[1, 1]} />
				<shaderMaterial
					transparent
					depthWrite={false}
					uniforms={uniforms}
					vertexShader={`
            varying vec2 vUv;
            void main(){
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
					fragmentShader={`
            precision mediump float;
            uniform sampler2D uMap;
            uniform float uTime;
            uniform float uOpacity;
            uniform float uSheen;
            varying vec2 vUv;

            // narrow moving band along a diagonal for a soft sheen
            float band(float x, float c, float w){
              return smoothstep(c - w, c, x) * (1.0 - smoothstep(c, c + w, x));
            }

            void main(){
              vec4 tex = texture2D(uMap, vUv);
              if (tex.a < 0.01) discard;

              // edge softening (vignette-like alpha falloff)
              vec2 p = vUv - 0.5;
              float r = length(p) * 2.0;
              float edge = smoothstep(1.05, 0.7, r); // 1 at center, fades near edges

              // animated sheen
              float sweepCenter = fract(uTime * 0.045);
              float diag = (vUv.x + vUv.y) * 0.5;
              float sweep = band(diag, sweepCenter, 0.05);
              vec3 color = tex.rgb + uSheen * sweep;

              gl_FragColor = vec4(color, tex.a * edge * uOpacity);
            }
          `}
				/>
			</mesh>
		</group>
	);
};

// Main component orchestrator with fallback + ready fade
const Background3D = () => {
	const theme = useTheme();
	const breakpoint = useResponsive();

	const [webglOk, setWebglOk] = useState(true);
	const [ctxLost, setCtxLost] = useState(false);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		// Check WebGL support
		setWebglOk(isWebGLAvailable());
		// Safety timeout so we never hang invisible
		const t = setTimeout(() => setReady(true), 700);
		return () => clearTimeout(t);
	}, []);

	const cameraConfig = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return { position: [0, 0, 5], fov: 75 };
			default:
				return { position: [0, 0, 5], fov: 60 };
		}
	}, [breakpoint]);

	// Base gradient always visible (prevents “blank”)
	const baseGradient =
		'radial-gradient(ellipse 120% 70% at 50% -15%, var(--bg-soft) 0%, var(--bg-base) 60%)';

	const showFallback = !webglOk || ctxLost;

	// Opacity for CSS preview (always under Canvas). Fades once first frame is ready.
	const cssPreviewOpacity = showFallback ? 0.9 : ready ? 0.25 : 0.6;

	return (
		<div
			className="fixed inset-0 -z-10 overflow-hidden"
			aria-hidden="true"
			style={{ background: baseGradient }}
		>
			{/* Always-on CSS preview under Canvas: instant paint, then soft fade */}
			<div
				className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out"
				style={{ opacity: cssPreviewOpacity }}
			>
				<div
					className="absolute inset-0"
					style={{
						background:
							'radial-gradient(900px 600px at 50% 0%, color-mix(in srgb, var(--accent-1) 10%, transparent), transparent 65%)',
					}}
				/>
				<div
					className="absolute inset-0 pointer-events-none animate-grid-flow"
					style={{
						backgroundImage: `
                            linear-gradient(to right, ${
								theme === 'light'
									? 'rgba(15, 23, 42, 0.06)'
									: 'rgba(241, 245, 249, 0.06)'
							} 1px, transparent 1px),
                            linear-gradient(to bottom, ${
								theme === 'light'
									? 'rgba(15, 23, 42, 0.06)'
									: 'rgba(241, 245, 249, 0.06)'
							} 1px, transparent 1px)
                        `,
						backgroundSize: '36px 36px',
						maskImage:
							'radial-gradient(ellipse 80% 65% at 50% -10%, black 25%, transparent 85%)',
						WebkitMaskImage:
							'radial-gradient(ellipse 80% 65% at 50% -10%, black 25%, transparent 85%)',
					}}
				/>
			</div>

			{/* WebGL scene (on top of CSS preview). If WebGL unavailable, CSS preview remains. */}
			{!showFallback && (
				<Canvas
					camera={cameraConfig}
					style={{ position: 'absolute', inset: 0 }}
					gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
					dpr={[1, Math.min(1.5, window.devicePixelRatio || 1)]}
					// Allow pointer parallax without intercepting page interactions
					eventSource={typeof window !== 'undefined' ? document.body : undefined}
					eventPrefix="client"
					onCreated={({ gl }) => {
						gl.setClearColor(0x000000, 0); // transparent
						gl.outputColorSpace = THREE.SRGBColorSpace;
						requestAnimationFrame(() => setReady(true));
						const el = gl.domElement;
						const onLost = (e) => {
							e.preventDefault();
							setCtxLost(true);
						};
						const onRestored = () => setCtxLost(false);
						el.addEventListener('webglcontextlost', onLost, { passive: false });
						el.addEventListener('webglcontextrestored', onRestored, { passive: true });
					}}
				>
					<Glows theme={theme} />
					<Grid theme={theme} />
					<Suspense fallback={null}>
						<EnhancedLogo breakpoint={breakpoint} />
					</Suspense>
				</Canvas>
			)}

			{/* Bottom fade and noise overlay */}
			<div
				className="absolute inset-x-0 bottom-0 h-56 pointer-events-none"
				style={{
					background: 'linear-gradient(to top, var(--bg-base) 35%, transparent 100%)',
				}}
			/>
			<div
				className="absolute inset-0 pointer-events-none mix-blend-overlay"
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
					opacity: theme === 'light' ? 0.005 : 0.007,
				}}
			/>
		</div>
	);
};

export default Background3D;
