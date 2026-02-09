import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// --- MATH UTILS ---

// Seeded Random Number Generator (Linear Congruential Generator)
class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  // Returns a number between 0 and 1
  next() {
    // LCG constants
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296; // 2^32

    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }
}

class FastSimplexNoise {
  constructor(seed = 12345) {
    // Use SeededRandom instead of Math.random() if a seed is provided
    // If seed is passed, we use it to initialize our PRNG.
    // Note: The original implementation took 'seed' as Math.random() value, 
    // but here we interpret 'seed' as an integer for our PRNG.

    const rng = new SeededRandom(typeof seed === 'number' ? seed : 12345);

    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 256; i++) this.p[i] = i;

    // Shuffle using seeded random
    for (let i = 255; i > 0; i--) {
      const r = rng.next();
      const n = Math.floor(r * (i + 1)) % 256;
      [this.p[i], this.p[n]] = [this.p[n], this.p[i]];
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
    this.grad3 = [
      1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
      1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
      0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
    ];
  }
  noise3D(xin, yin, zin) {
    const permMod12 = this.permMod12;
    const perm = this.perm;
    const grad3 = this.grad3;
    let n0, n1, n2, n3;
    const F3 = 1.0 / 3.0;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const G3 = 1.0 / 6.0;
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
    const t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
      const t0_sq = t0 * t0;
      n0 = t0_sq * t0_sq * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
    }
    const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
    const t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
      const t1_sq = t1 * t1;
      n1 = t1_sq * t1_sq * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
    }
    const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
    const t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
      const t2_sq = t2 * t2;
      n2 = t2_sq * t2_sq * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
    }
    const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
    const t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
      const t3_sq = t3 * t3;
      n3 = t3_sq * t3_sq * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
    }
    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

// --- FIX: UPDATED SHADER WITH WORLD SPACE CALCULATION ---
const TerrainShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    // Colors: Deep Navy Rock, Icy Teal, Pure White Snow
    uColorSnow: { value: new THREE.Color('#ffffff') },
    uColorIce: { value: new THREE.Color('#66ddff') },
    uColorRock: { value: new THREE.Color('#080810') },
    uLightPos: { value: new THREE.Vector3(50, 100, 50) },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal; // View space normal
    varying vec3 vWorldNormal; // World space normal (FIX)
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying float vElevation;

    void main() {
      vUv = uv;
      
      // Standard View Normal (for Fresnel/Lighting)
      vNormal = normalize(normalMatrix * normal);
      
      // World Normal (for Slope calculation)
      // We perform this manually to ensure 'Up' is actually 'Up'
      vWorldNormal = normalize(mat3(modelMatrix) * normal);

      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      
      // Pass the raw height (Z) to fragment
      vElevation = position.z; 
      
      vec4 mvPosition = viewMatrix * worldPos;
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorSnow;
    uniform vec3 uColorIce;
    uniform vec3 uColorRock;
    uniform vec3 uLightPos;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying float vElevation;

    // Fast noise for texture
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      // 1. Calculate Slope using World Normal
      // 1.0 = Flat ground, 0.0 = Vertical Wall
      float slope = dot(vWorldNormal, vec3(0.0, 1.0, 0.0));
      
      // 2. Lighting Setup
      vec3 viewDir = normalize(vViewPosition);
      vec3 lightDir = normalize(uLightPos - vWorldPosition);
      float diffuse = max(dot(vNormal, lightDir), 0.0);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

      // 3. Texture Mixing
      float noiseVal = snoise(vWorldPosition.xz * 0.1); 

      // Thresholds (LOWERED so snow appears more easily)
      float snowHeight = 8.0 + noiseVal * 5.0; // Snow starts at height 8
      float iceHeight = 2.0 + noiseVal * 2.0;  // Ice starts at height 2

      // Slope Masks
      float flatGround = smoothstep(0.5, 0.7, slope); // Only flat-ish areas get snow
      
      // Height Masks
      float isSnowy = smoothstep(snowHeight - 2.0, snowHeight + 2.0, vElevation);
      float isIcy = smoothstep(iceHeight - 2.0, iceHeight + 2.0, vElevation);

      // Combine Masks
      float snowMix = isSnowy * flatGround;
      float iceMix = isIcy * clamp(slope + 0.2, 0.0, 1.0); // Ice sticks to walls a bit more

      // Color Composition
      vec3 base = uColorRock;
      vec3 withIce = mix(base, uColorIce, iceMix * 0.7); // 70% opacity ice
      vec3 withSnow = mix(withIce, uColorSnow, snowMix);

      // 4. Final Lighting Assembly
      // Snow is brighter/emissive
      vec3 ambient = vec3(0.1, 0.15, 0.25) * withSnow;
      vec3 sun = withSnow * diffuse * 1.5;
      
      // Ice/Snow gets extra rim lighting (glint)
      vec3 rim = vec3(1.0) * fresnel * (snowMix + iceMix * 0.5); 

      gl_FragColor = vec4(ambient + sun + rim, 1.0);
    }
  `
};

export function HimalayanTerrain({ generationProgress = 1.0, isWireframe = false, detailLevel = 2 }) {
  const segments = 256;
  const size = 200;

  const meshRef = useRef();
  const materialRef = useRef();

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const posAttribute = geo.attributes.position;
    const vertex = new THREE.Vector3();

    // FIX: Deterministic Seeds for Consistent Terrain
    const noise = new FastSimplexNoise(123456);
    const warpNoise = new FastSimplexNoise(789012);

    for (let i = 0; i < posAttribute.count; i++) {
      vertex.fromBufferAttribute(posAttribute, i);

      // Domain Warping
      const warpFreq = 0.01;
      const warpAmp = 25;
      const warpX = warpNoise.noise3D(vertex.x * warpFreq, vertex.y * warpFreq, 0) * warpAmp;
      const warpY = warpNoise.noise3D(vertex.x * warpFreq, vertex.y * warpFreq, 50) * warpAmp;

      const px = vertex.x + warpX;
      const py = vertex.y + warpY;

      // FBM Height
      let noiseVal = 0;
      let amp = 50; // Increased Amplitude
      let freq = 0.01;

      for (let o = 0; o < 5; o++) {
        let n = noise.noise3D(px * freq, py * freq, o * 100);
        n = 1.0 - Math.abs(n); // Ridged
        n = n * n;
        noiseVal += n * amp;
        amp *= 0.5;
        freq *= 2.0;
      }

      const dist = Math.sqrt(vertex.x * vertex.x + vertex.y * vertex.y);
      const mask = Math.max(0, 1.0 - Math.pow(dist / (size * 0.48), 4));

      // Offset -10 allows water/ground to appear at 0
      vertex.z = Math.max(0, noiseVal * mask - 2);

      posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, [segments, size]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const sunY = 100 + Math.sin(state.clock.elapsedTime * 0.2) * 20;
      materialRef.current.uniforms.uLightPos.value.set(50, sunY, 50);
    }
  });

  useLayoutEffect(() => {
    if (meshRef.current) {
      // Rotate -90 degrees so Z becomes Up in World Space
      meshRef.current.rotation.x = -Math.PI / 2;
    }
  }, []);

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        scale={[generationProgress, generationProgress, generationProgress]}
      >
        <shaderMaterial
          ref={materialRef}
          vertexShader={TerrainShaderMaterial.vertexShader}
          fragmentShader={TerrainShaderMaterial.fragmentShader}
          uniforms={TerrainShaderMaterial.uniforms}
          side={THREE.DoubleSide}
          wireframe={isWireframe}
        />
      </mesh>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial color="#d1d5db" />
      </mesh>
    </group>
  );
}