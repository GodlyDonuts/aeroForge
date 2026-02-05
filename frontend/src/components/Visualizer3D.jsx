import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stars, Float, Sparkles, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { getMissionResults, getFileUrl } from '../api';
import * as THREE from 'three';

// 3D Model Components
function DroneModel({ isLoaded, status }) {
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current && !isLoaded) {
      groupRef.current.rotation.y += 0.005;
    }
  }, [isLoaded]);

  if (isLoaded) {
    return (
      <>
        {/* Central Fuselage */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial
              color="#0a0a0f"
              metalness={0.9}
              roughness={0.1}
              emissive="#00f0ff"
              emissiveIntensity={0.2}
            />
          </mesh>

          {/* Arms */}
          {[
            [0, Math.PI / 2],
            [Math.PI / 2, Math.PI],
            [Math.PI, Math.PI * 1.5],
            [Math.PI * 1.5, Math.PI * 2],
          ].map(([startAngle, endAngle], i) => (
            <group key={i} rotation={[0, startAngle, 0]}>
              {/* Arm */}
              <mesh position={[0.4, 0.3, 0]} castShadow>
                <boxGeometry args={[0.6, 0.05, 0.05]} />
                <meshStandardMaterial
                  color="#1a1a25"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Motor */}
              <mesh position={[0.7, 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.1, 32]} />
                <meshStandardMaterial
                  color="#0a0a0f"
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>

              {/* Propeller */}
              <mesh position={[0.7, 0.45, 0]} rotation={[0, Date.now() * 0.01, 0]}>
                <cylinderGeometry args={[0.25, 0.25, 0.005, 16]} />
                <meshStandardMaterial
                  color="#00f0ff"
                  metalness={0.7}
                  roughness={0.3}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </group>
          ))}

          {/* Payload */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.2, 0.1, 0.2]} />
            <meshStandardMaterial
              color="#7b2cbf"
              metalness={0.6}
              roughness={0.4}
              emissive="#7b2cbf"
              emissiveIntensity={0.1}
            />
          </mesh>
        </Float>

        {/* Glow Effects */}
        <Sparkles
          count={100}
          scale={3}
          size={3}
          speed={0.4}
          opacity={0.5}
          color="#00f0ff"
        />
      </>
    );
  }

  return (
    <>
      {/* Placeholder Model */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh position={[0, 0.5, 0]} rotation={[0, Date.now() * 0.0005, 0]}>
          <octahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial
            color="#7b2cbf"
            metalness={0.8}
            roughness={0.2}
            wireframe
          />
        </mesh>

        <mesh position={[0, 0.5, 0]}>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial
            color="#00f0ff"
            metalness={0.9}
            roughness={0.1}
            emissive="#00f0ff"
            emissiveIntensity={0.3}
            transparent
            opacity={0.7}
          />
        </mesh>
      </Float>

      <Sparkles
        count={50}
        scale={3}
        size={4}
        speed={0.3}
        opacity={0.3}
        color="#7b2cbf"
      />
    </>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow
        color="#ffffff"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#00f0ff" />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#7b2cbf" />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={0.5} intensity={0.3} color="#00f0ff" />
    </>
  );
}

function Ground() {
  return (
    <>
      <Grid
        args={[20, 20]}
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

function HUD({ missionId, status, isLoaded }) {
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
              {status === 'complete' ? '✓ READY' :
                status === 'failed' ? '✗ ERROR' :
                  '● GENERATING'}
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

function Visualizer3D({ missionId, missionStatus }) {
  const [stlFiles, setStlFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!missionId || missionStatus?.status !== 'complete') {
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await getMissionResults(missionId);
        setStlFiles(results.files || []);
      } catch (err) {
        console.error('Failed to fetch results:', err);
        setError('Failed to load 3D files');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [missionId, missionStatus]);

  const isLoaded = stlFiles.length > 0 && missionStatus?.status === 'complete';

  return (
    <div className="glass-panel overflow-hidden relative h-full min-h-[600px]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 glass-panel border-0 border-b border-white/5 rounded-none">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-purple flex items-center justify-center text-xl box-glow">
              🎨
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">3D Visualizer</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Real-time Model Rendering</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoaded && (
              <div className="glass-panel px-4 py-2 border-success-green/20 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
                <span className="text-xs font-bold text-success-green tracking-wider">
                  {stlFiles.length} FILE{stlFiles.length !== 1 ? 'S' : ''} LOADED
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
          <DroneModel isLoaded={isLoaded} status={missionStatus?.status} />

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

          <ContactShadows
            position={[0, -0.01, 0]}
            width={20}
            height={20}
            far={10}
            opacity={0.3}
            color="#00f0ff"
            blur={2}
          />
        </Canvas>

        {/* HUD Overlay */}
        <HUD missionId={missionId} status={missionStatus?.status} isLoaded={isLoaded} />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-spacex-black/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-neon-blue/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-neon-blue rounded-full animate-spin" />
                <div className="absolute inset-2 border-4 border-transparent border-t-purple rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="text-neon-blue font-bold text-sm tracking-wider animate-pulse">
                LOADING MODEL...
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!missionId && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-spacex-gray to-spacex-dark border border-white/5 flex items-center justify-center">
                <div className="text-4xl animate-float">🎨</div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-wider">NO ACTIVE MISSION</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Submit a mission to view the generated 3D model in real-time
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-alert-red/5">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-alert-red/10 border border-alert-red/30 flex items-center justify-center">
                <div className="text-4xl">⚠️</div>
              </div>
              <h3 className="text-lg font-bold text-alert-red mb-2 tracking-wider">LOADING ERROR</h3>
              <p className="text-sm text-gray-500 max-w-xs">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Visualizer3D;
