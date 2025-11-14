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
		if (typeof document === 'undefined') return;
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
	const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

	useEffect(() => {
		const update = () => {
			const w = window.innerWidth;
			const h = window.innerHeight;
			setDimensions({ width: w, height: h });

			if (w < 480) setBreakpoint('mobile');
			else if (w < 768) setBreakpoint('tablet-sm');
			else if (w < 1024) setBreakpoint('tablet');
			else if (w < 1440) setBreakpoint('desktop');
			else setBreakpoint('desktop-lg');
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);

	return { breakpoint, dimensions };
};

const readCssVar = (name) =>
	typeof document !== 'undefined'
		? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#6366f1'
		: '#6366f1';

const isWebGLAvailable = () => {
	if (typeof document === 'undefined') return false;
	try {
		const canvas = document.createElement('canvas');
		return (
			!!(window.WebGL2RenderingContext && canvas.getContext('webgl2')) ||
			!!(canvas.getContext('webgl') || canvas.getContext('experimental-web-gl'))
		);
	} catch {
		return false;
	}
};

// --- R3F Scene Components ---

/**
 * Enhanced Grid Component with Improved Cloth Texture
 * - Stable shader strings (memoized)
 * - Uniforms are maintained in a ref and updated in-place to avoid recompilation on theme toggles
 */
const Grid = ({ theme, breakpoint }) => {
	const meshRef = useRef();
	const wireMatRef = useRef();

	const prefersReduced = useMemo(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}, []);

	// Responsive grid dimensions
	const gridParams = useMemo(() => {
		const configs = {
			mobile: { width: 100, height: 60, segs: 80 },
			'tablet-sm': { width: 120, height: 70, segs: 90 },
			tablet: { width: 140, height: 80, segs: 100 },
			desktop: { width: 160, height: 90, segs: 110 },
			'desktop-lg': { width: 180, height: 100, segs: 120 },
		};
		return configs[breakpoint] || configs.desktop;
	}, [breakpoint]);

	// Keep uniforms stable in a ref so material always references same object
	const uniformsRef = useRef({
		uTime: { value: 0 },
		uWaveAmplitude: { value: breakpoint === 'mobile' ? 3.5 : 5.0 },
		uWaveFrequency: { value: 0.055 },
		uWaveSpeed: { value: prefersReduced ? 0.0 : 0.45 },
		uDepthFade: { value: 0.75 },
		uWireOpacity: { value: theme === 'light' ? 0.85 : 1.0 },
		uWireColor: { value: new THREE.Color(theme === 'light' ? '#94a3af' : '#64748b') },
		uAccent: { value: new THREE.Color(readCssVar('--accent-1')) },
		uClothScale: { value: 6.0 },
		uClothDetail: { value: 6.0 },
		uClothStrength: { value: 0.6 },
		uWeaveDensity: { value: 2.5 },
		uFabricSoftness: { value: 0.8 },
		uMouseX: { value: 0 },
		uMouseY: { value: 0 },
		// grid sizes as uniforms so shader doesn't need to be recompiled when they change
		uGridHeight: { value: gridParams.height },
		uGridHalfHeight: { value: gridParams.height / 2.0 },
	});

	// Ensure uniformsRef updates when breakpoint / theme / prefersReduced / accent changes.
	useEffect(() => {
		const u = uniformsRef.current;
		u.uWaveAmplitude.value = breakpoint === 'mobile' ? 3.5 : 5.0;
		u.uWaveSpeed.value = prefersReduced ? 0.0 : 0.45;
		u.uWireOpacity.value = theme === 'light' ? 0.85 : 1.0;

		// update color without replacing object to keep references stable
		u.uWireColor.value.set(theme === 'light' ? '#94a3af' : '#64748b');
		u.uAccent.value.set(readCssVar('--accent-1') || '#6366f1');

		u.uGridHeight.value = gridParams.height;
		u.uGridHalfHeight.value = gridParams.height / 2.0;

		// push updates to material if already created
		if (wireMatRef.current && wireMatRef.current.uniforms) {
			Object.keys(u).forEach((key) => {
				if (wireMatRef.current.uniforms[key]) {
					wireMatRef.current.uniforms[key].value = u[key].value;
				} else {
					// in case a new uniform is missing, set it
					wireMatRef.current.uniforms[key] = { value: u[key].value };
				}
			});
			// flag update
			wireMatRef.current.needsUpdate = true;
		}
	}, [theme, breakpoint, prefersReduced, gridParams.height]);

	// Stable shader source (memoized)
	const vertexShader = useMemo(
		() => `
        uniform float uTime;
        uniform float uWaveAmplitude;
        uniform float uWaveFrequency;
        uniform float uWaveSpeed;
        uniform float uMouseX;
        uniform float uMouseY;
        uniform float uClothScale;
        uniform float uClothDetail;
        uniform float uClothStrength;
        uniform float uWeaveDensity;
        uniform float uFabricSoftness;
        uniform float uGridHeight;
        uniform float uGridHalfHeight;

        varying vec2 vUv;
        varying float vElevation;
        varying float vDepth;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vClothPattern;
        
        // Cross-browser compatible noise functions
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for(int i = 0; i < 4; i++) {
                value += amplitude * noise(p * frequency);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        // Enhanced cloth pattern with realistic weave
        float clothPattern(vec2 uv) {
            float pattern = 0.0;
            
            // Base woven texture - cross-hatch pattern
            float warp = sin(uv.x * uClothScale * uWeaveDensity) * 
                         sin(uv.y * uClothScale * uWeaveDensity * 0.8);
            
            float weft = sin(uv.x * uClothScale * uWeaveDensity * 0.7 + 1.57) * 
                         sin(uv.y * uClothScale * uWeaveDensity * 1.2);
            
            // Twill-like pattern for more realistic fabric
            float twill = sin((uv.x + uv.y) * uClothScale * uWeaveDensity * 0.5) * 
                          sin((uv.x - uv.y) * uClothScale * uWeaveDensity * 0.3);
            
            // Fine fabric micro-details
            float microDetail = fbm(uv * uClothDetail) * 0.4;
            float macroDetail = fbm(uv * uClothDetail * 0.3) * 0.3;
            
            // Combine patterns with realistic fabric weighting
            pattern = (warp * 0.35 + weft * 0.35 + twill * 0.2 + microDetail + macroDetail) * uClothStrength;
            
            // Add softness to the fabric pattern
            pattern *= uFabricSoftness;
            
            return pattern;
        }

        void main() {
            vUv = uv;
            vec3 pos = position;

            // Multi-layered wave system
            float wave1 = sin(pos.x * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.9) *
                          cos(pos.y * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.7);
            
            float wave2 = sin(pos.x * uWaveFrequency * 1.4 + uTime * uWaveSpeed * 1.3) *
                          cos(pos.y * uWaveFrequency * 1.1 + uTime * uWaveSpeed * 0.95);
            
            float wave3 = sin(pos.x * uWaveFrequency * 2.1 + uTime * uWaveSpeed * 1.6) *
                          sin(pos.y * uWaveFrequency * 1.8 + uTime * uWaveSpeed * 1.35);
            
            // Combine wave layers
            float baseElevation = (wave1 * 1.0 + wave2 * 0.75 + wave3 * 0.5) * uWaveAmplitude;
            
            // Add cloth texture to the base elevation
            float clothEffect = clothPattern(vUv * 2.0 + uTime * 0.05) * 1.2;
            float combinedElevation = baseElevation + clothEffect;

            // Mouse interaction
            vec2 mousePos = vec2(uMouseX, uMouseY) * 25.0;
            float mouseDist = length(pos.xy - mousePos);
            float mouseInfluence = sin(mouseDist * 0.2 - uTime * 1.5) * 
                                   exp(-mouseDist * 0.08) * 1.5;
            combinedElevation += mouseInfluence;

            // Depth calculation and attenuation using uniforms for grid height
            vDepth = (pos.y + uGridHalfHeight) / uGridHeight;
            float depthAtten = smoothstep(0.0, 0.8, 1.0 - vDepth);
            depthAtten = pow(depthAtten, 1.3);
            combinedElevation *= depthAtten;

            pos.z += combinedElevation;
            vElevation = combinedElevation;
            vClothPattern = clothEffect;
            vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
            
            // Calculate normal for lighting
            float delta = 0.1;
            float elevX = (sin((pos.x + delta) * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.9) *
                          cos(pos.y * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.7) * uWaveAmplitude * depthAtten);
            float elevY = (sin(pos.x * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.9) *
                          cos((pos.y + delta) * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.7) * uWaveAmplitude * depthAtten);
            
            vec3 tangentX = vec3(delta, 0.0, elevX - combinedElevation);
            vec3 tangentY = vec3(0.0, delta, elevY - combinedElevation);
            
            vNormal = normalize(cross(tangentX, tangentY));

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
		[]
	);

	const fragmentShader = useMemo(
		() => `
        uniform vec3 uWireColor;
        uniform float uWireOpacity;
        uniform float uDepthFade;
        uniform vec3 uAccent;
        uniform float uTime;
        
        varying vec2 vUv;
        varying float vDepth;
        varying float vElevation;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vClothPattern;
        
        void main() {
            // Depth-based fade
            float depthFade = smoothstep(0.0, uDepthFade, 1.0 - vDepth);
            depthFade = pow(depthFade, 1.5);

            // Glow effects based on elevation
            float elevationGlow = smoothstep(1.0, 3.0, abs(vElevation)) * 0.8;
            float peakGlow = smoothstep(3.0, 5.0, abs(vElevation)) * 1.2;
            
            // Subtle shimmer
            float shimmer = sin(uTime * 2.5 + vUv.x * 10.0 + vUv.y * 8.0) * 0.1 + 0.9;
            
            // Fresnel effect for edges
            vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
            float edgeGlow = fresnel * 0.6;
            
            // Cloth texture influence
            float clothIntensity = abs(vClothPattern) * 0.4;
            float weavePattern = sin(vUv.x * 25.0 + uTime * 2.0) * 0.08 + 0.92;
            
            // Combine lighting factors
            float totalGlow = clamp(
                elevationGlow * 0.7 + 
                peakGlow * 0.5 +
                edgeGlow * 0.6, 
                0.0, 1.0
            );
            totalGlow *= shimmer;
            
            // Color with cloth texture influence
            vec3 baseColor = mix(uWireColor, uWireColor * 1.1, vDepth * 0.2);
            baseColor = mix(baseColor, baseColor * weavePattern, clothIntensity * 0.3);
            
            vec3 finalColor = mix(baseColor, uAccent, totalGlow * 0.7);
            
            // Highlight extreme peaks
            if (vElevation > 2.5) {
                float peakFactor = smoothstep(2.5, 4.0, vElevation);
                finalColor = mix(finalColor, uAccent * 1.3, peakFactor * 0.4);
            }
            
            // Alpha calculation with cloth texture influence
            float clothAlpha = (0.7 + clothIntensity * 0.3);
            float alpha = uWireOpacity * depthFade * (0.8 + totalGlow * 0.3) * clothAlpha;

            // Boost alpha for peaks
            if (vElevation > 3.0) {
                alpha += 0.3;
                finalColor += uAccent * 0.25;
            }
            
            // Ensure minimum visibility for near grid
            if (vDepth < 0.3) {
                alpha = max(alpha, uWireOpacity * 0.7);
            }
            
            // Add cloth pattern variation to alpha
            alpha *= (0.9 + clothIntensity * 0.15);
            
            if (alpha <= 0.01) discard;
            gl_FragColor = vec4(finalColor, alpha);
        }
    `,
		[]
	);

	// update uTime and mouse/tilt each frame
	useFrame((state) => {
		const t = state.clock.elapsedTime;
		const mat = wireMatRef.current;
		if (mat && mat.uniforms) {
			mat.uniforms.uTime.value = t;
			if (!prefersReduced && meshRef.current) {
				const { pointer } = state;
				mat.uniforms.uMouseX.value = THREE.MathUtils.lerp(
					mat.uniforms.uMouseX.value,
					pointer.x * 0.6,
					0.05
				);
				mat.uniforms.uMouseY.value = THREE.MathUtils.lerp(
					mat.uniforms.uMouseY.value,
					pointer.y * 0.5,
					0.05
				);

				const targetRotX = THREE.MathUtils.degToRad(-22 + pointer.y * 8);
				const targetRotY = THREE.MathUtils.degToRad(pointer.x * 9);

				meshRef.current.rotation.x = THREE.MathUtils.lerp(
					meshRef.current.rotation.x,
					targetRotX,
					0.05
				);
				meshRef.current.rotation.y = THREE.MathUtils.lerp(
					meshRef.current.rotation.y,
					targetRotY,
					0.05
				);
			}
		}
	});

	return (
		<group
			ref={meshRef}
			position={[0, -14, -20]}
			rotation={[THREE.MathUtils.degToRad(-22), 0, 0]}
		>
			<mesh renderOrder={0}>
				<planeGeometry
					args={[
						gridParams.width,
						gridParams.height,
						gridParams.segs,
						Math.floor(gridParams.segs * 0.75),
					]}
				/>
				{/* Pass the stable uniforms object */}
				<shaderMaterial
					ref={wireMatRef}
					uniforms={uniformsRef.current}
					transparent={true}
					depthWrite={false}
					wireframe={true}
					side={THREE.DoubleSide}
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
					extensions={{ derivatives: true }}
				/>
			</mesh>
		</group>
	);
};

// Centered Blurry Floating Logo Component
const FloatingLogo = ({ breakpoint, logoOpacity = 0.34 }) => {
	const base = useRef();
	const texture = useTexture(logo);

	// Increased blur amounts for more pronounced blur effect
	const blurAmount = useMemo(() => {
		switch (breakpoint) {
			case 'mobile':
				return 5.5;
			case 'tablet-sm':
				return 5.8;
			case 'tablet':
				return 5.2;
			case 'desktop':
				return 5.5;
			case 'desktop-lg':
				return 5.0;
			default:
				return 2.0;
		}
	}, [breakpoint]);

	useEffect(() => {
		if (!texture) return;
		// newer three.js versions use colorSpace; fallback to encoding if needed
		if (texture.colorSpace !== undefined) {
			texture.colorSpace = THREE.SRGBColorSpace;
		} else {
			texture.encoding = THREE.sRGBEncoding;
		}
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.generateMipmaps = false;
		texture.needsUpdate = true;
	}, [texture]);

	const [aspect, setAspect] = useState(1);
	useEffect(() => {
		if (texture?.image?.width && texture?.image?.height) {
			setAspect(texture.image.width / texture.image.height);
		}
	}, [texture]);

	const { camera } = useThree();

	// Responsive logo scales - slightly smaller to account for center positioning
	const logoScales = {
		mobile: 0.22,
		'tablet-sm': 0.26,
		tablet: 0.3,
		desktop: 0.36,
		'desktop-lg': 0.42,
	};

	const frac = logoScales[breakpoint] || 0.3;

	const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
	const scaleXY = useMemo(() => {
		const dist = Math.abs(-8 - (camera?.position?.z ?? 5));
		const worldH = 2 * Math.tan(THREE.MathUtils.degToRad((camera?.fov ?? 60) / 2)) * dist;
		const h = clamp(worldH * frac, 5, 22);
		return [h * aspect, h];
	}, [camera?.fov, camera?.position?.z, aspect, frac]);

	useEffect(() => {
		if (base.current) {
			base.current.scale.set(scaleXY[0], scaleXY[1], 1);
			base.current.renderOrder = 999;
		}
	}, [scaleXY]);

	// Enhanced blur shader with more samples for better blur quality
	const blurVertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

	const blurFragmentShader = `
        uniform sampler2D map;
        uniform float opacity;
        uniform float blurAmount;
        varying vec2 vUv;

        // Enhanced 13-sample blur for better quality
        void main() {
            vec2 texel = vec2(1.0) / vec2(textureSize(map, 0));
            vec4 c = vec4(0.0);
            float w = blurAmount * 0.8;

            // Sample more points for better blur quality
            for(int i = -2; i <= 2; i++) {
                for(int j = -2; j <= 2; j++) {
                    c += texture2D(map, vUv + texel * vec2(float(i), float(j)) * w);
                }
            }
            
            c /= 25.0;
            c.a *= opacity;
            gl_FragColor = c;
        }
    `;

	const blurUniforms = useMemo(
		() => ({
			map: { value: texture },
			opacity: { value: logoOpacity },
			blurAmount: { value: blurAmount },
		}),
		[texture, logoOpacity, blurAmount]
	);

	return (
		<group ref={base} position={[0, 0, -8]} renderOrder={999}>
			<mesh>
				<planeGeometry args={[1, 1]} />
				<shaderMaterial
					uniforms={blurUniforms}
					vertexShader={blurVertexShader}
					fragmentShader={blurFragmentShader}
					transparent={true}
					depthWrite={false}
					depthTest={false}
				/>
			</mesh>
		</group>
	);
};

// Main Background Component
const Background3D = () => {
	const theme = useTheme();
	const { breakpoint } = useResponsive();

	const [webglOk, setWebglOk] = useState(true);
	useEffect(() => {
		setWebglOk(isWebGLAvailable());
	}, []);

	const cameraConfig = useMemo(() => {
		const configs = {
			mobile: { position: [0, 0, 12], fov: 80 },
			'tablet-sm': { position: [0, 0, 10], fov: 75 },
			tablet: { position: [0, 0, 8], fov: 70 },
			desktop: { position: [0, 0, 7], fov: 65 },
			'desktop-lg': { position: [0, 0, 6], fov: 62 },
		};
		return configs[breakpoint] || { position: [0, 0, 7], fov: 65 };
	}, [breakpoint]);

	if (!webglOk) {
		return (
			<div
				className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800"
				aria-hidden="true"
			/>
		);
	}

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
			<Canvas
				camera={cameraConfig}
				gl={{
					antialias: true,
					alpha: true,
					powerPreference: 'default',
				}}
				dpr={Math.min(1.5, window.devicePixelRatio || 1)}
				onCreated={({ gl }) => {
					gl.setClearColor(0x000000, 0);
					// newer three uses outputColorSpace
					if (gl.outputColorSpace !== undefined) {
						gl.outputColorSpace = THREE.SRGBColorSpace;
					} else {
						gl.gammaFactor = 2.2;
					}
					try {
						gl.getContext().getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
					} catch (e) {
						console.warn(
							'High precision shaders not supported, using medium precision'
						);
					}
				}}
			>
				<Grid theme={theme} breakpoint={breakpoint} />
				<Suspense fallback={null}>
					<FloatingLogo breakpoint={breakpoint} />
				</Suspense>
			</Canvas>
		</div>
	);
};

export default Background3D;
