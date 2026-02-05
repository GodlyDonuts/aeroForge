import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Grid, Stats } from '@react-three/drei';
import { getMissionResults, getFileUrl, getMissionMetrics } from '../api';
import * as THREE from 'three';

// Starfield background component
function Starfield() {
  return <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />;
}

// Glowing grid floor
function GlowingGrid() {
  return (
    <Grid
      args={[40, 40]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#00f0ff"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#00f0ff"
      fadeDistance={50}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid
    />
  );
}

// Drone representation (placeholder - will be replaced with actual STL)
function DroneModel({ position, rotation, isLoaded }) {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(position);
      groupRef.current.quaternion.copy(rotation);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Fuselage */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.15]} />
        <meshStandardMaterial
          color="#00f0ff"
          metalness={0.9}
          roughness={0.1}
          emissive="#00f0ff"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Four Arms */}
      {[
        [0.2, 0, 0], [-0.2, 0, 0],
        [0, 0, 0.2], [0, 0, -0.2]
      ].map((armPos, i) => (
        <mesh key={`arm-${i}`} position={armPos}>
          <cylinderGeometry args={[0.01, 0.01, 0.2]} />
          <meshStandardMaterial
            color="#333333"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Motor Mounts */}
      {[
        [0.3, 0, 0], [-0.3, 0, 0],
        [0, 0, 0.3], [0, 0, -0.3]
      ].map((mountPos, i) => (
        <mesh key={`mount-${i}`} position={mountPos}>
          <cylinderGeometry args={[0.04, 0.04, 0.02]} />
          <meshStandardMaterial
            color="#ff4d4d"
            metalness={0.8}
            roughness={0.2}
            emissive="#ff4d4d"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

      {/* Rotors */}
      {[
        [0.3, 0.01, 0], [-0.3, 0.01, 0],
        [0, 0.01, 0.3], [0, 0.01, -0.3]
      ].map((rotorPos, i) => (
        <group key={`rotor-${i}`} position={rotorPos}>
          <mesh rotation={[0, Date.now() * 0.01, 0]}>
            <ringGeometry args={[0.03, 0.08, 32]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.9}
              roughness={0.1}
              emissive="#ffffff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Camera controller
function CameraController() {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(3, 2, 3));
  const currentPosition = useRef(new THREE.Vector3(3, 2, 3));

  useFrame(() => {
    currentPosition.current.lerp(targetPosition.current, 0.02);
    camera.position.copy(currentPosition.current);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Scene component
function Scene({ dronePosition, droneRotation, showDrone }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#00f0ff" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ff4d4d" />
      <pointLight position={[0, 2, 0]} intensity={0.5} color="#ffffff" />

      <Starfield />
      <GlowingGrid />

      {showDrone && (
        <DroneModel
          position={dronePosition}
          rotation={droneRotation}
          isLoaded={showDrone}
        />
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2}
      />

      <CameraController />
    </>
  );
}

function Visualizer3D({ missionId, missionStatus, telemetryData }) {
  const [stlFiles, setStlFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showDrone, setShowDrone] = useState(false);

  const dronePosition = useRef(new THREE.Vector3(0, 0, 0));
  const droneRotation = useRef(new THREE.Quaternion());
  const animationRef = useRef(null);
  const lastFrameTime = useRef(0);

  // Load results when mission completes
  useEffect(() => {
    if (!missionId || missionStatus?.status !== 'complete') {
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const results = await getMissionResults(missionId);
        setStlFiles(results.files || []);
      } catch (err) {
        console.error('Failed to fetch results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [missionId, missionStatus]);

  // Show drone when simulation is complete
  useEffect(() => {
    if (telemetryData && telemetryData.position?.length > 0) {
      setShowDrone(true);
    }
  }, [telemetryData]);

  // Animation loop for replay
  const animate = (timestamp) => {
    if (!isPlaying || !telemetryData) return;

    const deltaTime = timestamp - lastFrameTime.current;
    const frameTime = 33; // ~30 FPS

    if (deltaTime >= frameTime) {
      lastFrameTime.current = timestamp;
      const nextFrame = Math.min(currentFrame + 1, telemetryData.position.length - 1);
      setCurrentFrame(nextFrame);

      // Update drone position and rotation
      if (telemetryData.position[nextFrame]) {
        const pos = telemetryData.position[nextFrame];
        dronePosition.current.set(pos[0], pos[1], pos[2]);
      }

      if (telemetryData.rotation_quaternion?.[nextFrame]) {
        const quat = telemetryData.rotation_quaternion[nextFrame];
        droneRotation.current.set(quat[0], quat[1], quat[2], quat[3]);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle play/pause
  useEffect(() => {
    if (isPlaying && telemetryData) {
      lastFrameTime.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, telemetryData]);

  // Update drone position when frame changes manually
  useEffect(() => {
    if (!telemetryData || !telemetryData.position?.[currentFrame]) return;

    const pos = telemetryData.position[currentFrame];
    dronePosition.current.set(pos[0], pos[1], pos[2]);

    if (telemetryData.rotation_quaternion?.[currentFrame]) {
      const quat = telemetryData.rotation_quaternion[currentFrame];
      droneRotation.current.set(quat[0], quat[1], quat[2], quat[3]);
    }
  }, [currentFrame, telemetryData]);

  const totalFrames = telemetryData?.position?.length || 0;
  const progress = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  return (
    <div className="glass-panel h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎨</div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Flight Visualization</h2>
              <p className="text-xs text-gray-500">Real-time 6-DOF trajectory replay</p>
            </div>
          </div>

          {stlFiles.length > 0 && (
            <div className="glass-panel px-4 py-2 border border-neon-blue/30">
              <span className="text-xs text-neon-blue font-mono">
                {stlFiles.length} FILE{stlFiles.length !== 1 ? 'S' : ''} LOADED
              </span>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        {showDrone && telemetryData && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider transition-all duration-300
                  bg-spacex-gray border border-white/10 text-white hover:border-neon-blue hover:text-neon-blue"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrame(0);
                  dronePosition.current.set(0, 0, 0);
                  droneRotation.current.set(0, 0, 0, 1);
                }}
                className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider transition-all duration-300
                  bg-spacex-gray border border-white/10 text-white hover:border-neon-blue hover:text-neon-blue"
              >
                ↺ Reset
              </button>

              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-2 flex justify-between">
                  <span>Frame: {currentFrame} / {totalFrames}</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={totalFrames - 1}
                  value={currentFrame}
                  onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
                  className="w-full h-2 bg-spacex-gray rounded-lg appearance-none cursor-pointer accent-neon-blue"
                />
              </div>
            </div>

            {/* Live Telemetry */}
            <div className="grid grid-cols-4 gap-4">
              <div className="metric-card">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Position X</div>
                <div className="text-lg font-bold text-neon-blue">
                  {telemetryData.position?.[currentFrame]?.[0]?.toFixed(3) || '0.000'} m
                </div>
              </div>
              <div className="metric-card">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Position Y</div>
                <div className="text-lg font-bold text-neon-blue">
                  {telemetryData.position?.[currentFrame]?.[1]?.toFixed(3) || '0.000'} m
                </div>
              </div>
              <div className="metric-card">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Position Z</div>
                <div className="text-lg font-bold text-neon-blue">
                  {telemetryData.position?.[currentFrame]?.[2]?.toFixed(3) || '0.000'} m
                </div>
              </div>
              <div className="metric-card">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</div>
                <div className="text-lg font-bold text-neon-blue">
                  {telemetryData.time?.[currentFrame]?.toFixed(2) || '0.00'} s
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 relative bg-spacex-black">
        <Canvas camera={{ position: [3, 2, 3], fov: 60 }}>
          <color attach="background" args={['#000000']} />
          <Scene
            dronePosition={dronePosition.current}
            droneRotation={droneRotation.current}
            showDrone={showDrone}
          />
        </Canvas>

        {!missionId && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <div className="text-xl text-gray-400 mb-2">Mission Control</div>
              <div className="text-sm text-gray-600">Submit a mission to begin</div>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-neon-blue font-bold">LOADING TRAJECTORY DATA...</div>
            </div>
          </div>
        )}

        {missionStatus?.status === 'complete' && !showDrone && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">✓</div>
              <div className="text-xl text-neon-blue font-bold">Mission Complete</div>
              <div className="text-sm text-gray-500">No trajectory data available</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Visualizer3D;
