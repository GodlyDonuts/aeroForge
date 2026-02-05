import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Stars, Float, Sparkles, Environment, PerspectiveCamera, Center, Box, Cylinder, Torus } from '@react-three/drei';
import { getMissionResults } from '../api';
import * as THREE from 'three';

// Standard Reference Assembly (High-Fidelity Preview)
function PreviewAssembly() {
  const group = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.1) * 0.1;
      group.current.position.y = Math.sin(t * 0.5) * 0.1;
    }
  });

  const materialProps = {
    color: "#1a1a25",
    metalness: 0.8,
    roughness: 0.2,
    envMapIntensity: 1
  };

  const accentProps = {
    color: "#00f0ff",
    metalness: 0.5,
    roughness: 0.2,
    emissive: "#00f0ff",
    emissiveIntensity: 0.5
  };

  return (
    <group ref={group}>
      <Center>
        {/* Main Chassis Body */}
        <Box args={[1.2, 0.4, 0.6]} castShadow receiveShadow>
          <meshStandardMaterial {...materialProps} />
        </Box>

        {/* Aerodynamic Cowling */}
        <Box args={[0.8, 0.5, 0.5]} position={[0, 0.2, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...materialProps} color="#2a2a35" />
        </Box>

        {/* Sensor Array (Front) */}
        <Box args={[0.3, 0.2, 0.1]} position={[0.65, 0, 0]} castShadow>
          <meshStandardMaterial color="#ff004c" emissive="#ff004c" emissiveIntensity={0.8} />
        </Box>

        {/* Arms */}
        {[[-1, 1], [-1, -1], [1, 1], [1, -1]].map(([x, z], i) => (
          <group key={i} position={[x * 0.8, 0, z * 0.8]}>
            {/* Arm Strut */}
            <Box args={[1, 0.1, 0.1]} position={[-x * 0.5, 0, -z * 0.5]} rotation={[0, Math.atan2(z, x), 0]}>
              <meshStandardMaterial {...materialProps} />
            </Box>

            {/* Motor Housing */}
            <Cylinder args={[0.25, 0.2, 0.3, 32]} position={[0, 0.1, 0]} castShadow>
              <meshStandardMaterial {...materialProps} />
            </Cylinder>

            {/* Propeller Guard */}
            <Torus args={[0.5, 0.02, 16, 50]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
              <meshStandardMaterial {...accentProps} opacity={0.5} transparent />
            </Torus>

            {/* Propeller Blades (animated in real-time usually, static for preview) */}
            <Box args={[1.2, 0.02, 0.1]} position={[0, 0.3, 0]}>
              <meshStandardMaterial color="#333" />
            </Box>
            <Box args={[1.2, 0.02, 0.1]} position={[0, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial color="#333" />
            </Box>
          </group>
        ))}

        {/* Landing Gear */}
        {[[-0.4, 0.3], [0.4, 0.3], [-0.4, -0.3], [0.4, -0.3]].map(([x, z], i) => (
          <Cylinder key={`leg-${i}`} args={[0.05, 0.02, 0.6]} position={[x, -0.4, z]} rotation={[0.2, 0, z > 0 ? -0.1 : 0.1]}>
            <meshStandardMaterial color="#555" metalness={1} />
          </Cylinder>
        ))}
      </Center>
    </group>
  );
}

// Lighting setup
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow
        color="#ffffff"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#00f0ff" />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#7b2cbf" />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={0.5} intensity={0.3} color="#00f0ff" />
    </>
  );
}

// Ground plane
function Ground() {
  return (
    <>
      <Grid
        cellSize={1}
        cellThickness={0.02}
        cellColor="#00f0ff"
        sectionSize={5}
        sectionThickness={0.05}
        sectionColor="#7b2cbf"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#0a0a0f"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
    </>
  );
}

// HUD Overlay
function HUD({ missionId, status }) {
  if (!missionId) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between">
        <div className="glass-panel px-4 py-2 border-neon-blue/20">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">View Mode</div>
          <div className="text-xs font-bold text-neon-blue tracking-wider">ORBITAL</div>
        </div>
        <div className="glass-panel px-4 py-2 border-white/5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Render</div>
          <div className="text-xs font-bold text-purple tracking-wider">REALTIME</div>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div className="space-y-2">
          <div className="glass-panel px-4 py-2 border-success-green/20">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Status</div>
            <div className={`text-xs font-bold uppercase tracking-wider ${status === 'complete' ? 'text-success-green' :
              status === 'failed' ? 'text-alert-red' :
                'text-warning-yellow'
              }`}>
              {status === 'complete' ? 'READY' :
                status === 'failed' ? 'ERROR' :
                  'GENERATING'}
            </div>
          </div>
        </div>

        <div className="glass-panel px-4 py-2 border-white/5">
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Controls</div>
            <div className="flex gap-2 text-[10px] text-gray-400 font-mono">
              <span className="px-2 py-1 bg-white/5 rounded">LMB</span>
              <span className="px-2 py-1 bg-white/5 rounded">RMB</span>
              <span className="px-2 py-1 bg-white/5 rounded">SCROLL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-neon-blue/30" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-neon-blue/30" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-neon-blue/30" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-neon-blue/30" />
    </div>
  );
}

// Main Visualizer Component
function Visualizer3D({ missionId, missionStatus }) {
  // Use simple timeouts to simulate "loading" phase for better UX
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (missionStatus?.status === 'complete') {
      const timer = setTimeout(() => setIsReady(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [missionStatus]);

  const showModel = missionStatus?.status === 'complete' && isReady;
  const isLoading = missionStatus?.status === 'generating' || (missionStatus?.status === 'complete' && !isReady);

  return (
    <div className="glass-panel overflow-hidden relative h-full min-h-[600px]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 glass-panel border-0 border-b border-white/5 rounded-none">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-purple flex items-center justify-center text-xl font-bold text-white box-glow">
              3D
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">3D Visualizer</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Real-time Model Rendering</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showModel && (
              <div className="glass-panel px-4 py-2 border-success-green/20 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
                <span className="text-xs font-bold text-success-green tracking-wider">
                  SYSTEM ONLINE
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button className="glass-button px-3 py-2 text-xs">
                <span className="text-sm">◐</span>
              </button>
              <button className="glass-button px-3 py-2 text-xs">
                <span className="text-sm">⟲</span>
              </button>
              <button className="glass-button px-3 py-2 text-xs">
                <span className="text-sm">⬡</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 pt-[72px]">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} />
          <color attach="background" args={['#0a0a0f']} />

          <Lighting />
          <Environment preset="city" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Ground />

          <Suspense fallback={null}>
            {showModel && <PreviewAssembly />}
          </Suspense>

          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={0.1}
            enablePan={true}
            enableZoom={true}
          />
        </Canvas>

        {/* HUD Overlay */}
        <HUD missionId={missionId} status={missionStatus?.status} />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-spacex-black/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-neon-blue/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-neon-blue rounded-full animate-spin" />
                <div className="absolute inset-2 border-4 border-transparent border-t-purple rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="text-neon-blue font-bold text-sm tracking-wider animate-pulse">
                INITIALIZING SYSTEMS...
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!missionId && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-spacex-gray to-spacex-dark border border-white/5 flex items-center justify-center">
                <div className="text-4xl animate-float text-neon-blue font-bold">3D</div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-wider">NO ACTIVE MISSION</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Submit a mission to view the generated 3D model in real-time
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Visualizer3D;
