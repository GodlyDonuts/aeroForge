import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Stars, Float, Sparkles, Environment, PerspectiveCamera, Center, Box, Cylinder, Torus } from '@react-three/drei';
import { getMissionResults } from '../api';
import * as THREE from 'three';

// Standard Reference Assembly (High-Fidelity Preview)
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
    color: "#222222",
    metalness: 0.8,
    roughness: 0.2,
    envMapIntensity: 1
  };

  const accentProps = {
    color: "#ffffff",
    metalness: 0.9,
    roughness: 0.1,
    emissive: "#cccccc",
    emissiveIntensity: 0.1
  };

  return (
    <group ref={group}>
      <Center>
        <Box args={[1.2, 0.4, 0.6]} castShadow receiveShadow><meshStandardMaterial {...materialProps} /></Box>
        <Box args={[0.8, 0.5, 0.5]} position={[0, 0.2, 0]} castShadow receiveShadow><meshStandardMaterial {...materialProps} color="#1a1a1a" /></Box>
        <Box args={[0.3, 0.2, 0.1]} position={[0.65, 0, 0]} castShadow><meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.2} /></Box>
        {[[-1, 1], [-1, -1], [1, 1], [1, -1]].map(([x, z], i) => (
          <group key={i} position={[x * 0.8, 0, z * 0.8]}>
            <Box args={[1, 0.1, 0.1]} position={[-x * 0.5, 0, -z * 0.5]} rotation={[0, Math.atan2(z, x), 0]}><meshStandardMaterial {...materialProps} /></Box>
            <Cylinder args={[0.25, 0.2, 0.3, 32]} position={[0, 0.1, 0]} castShadow><meshStandardMaterial {...materialProps} /></Cylinder>
            <Torus args={[0.5, 0.02, 16, 50]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}><meshStandardMaterial {...accentProps} opacity={0.5} transparent /></Torus>
            <Box args={[1.2, 0.02, 0.1]} position={[0, 0.3, 0]}><meshStandardMaterial color="#444" /></Box>
            <Box args={[1.2, 0.02, 0.1]} position={[0, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}><meshStandardMaterial color="#444" /></Box>
          </group>
        ))}
        {[[-0.4, 0.3], [0.4, 0.3], [-0.4, -0.3], [0.4, -0.3]].map(([x, z], i) => (
          <Cylinder key={`leg-${i}`} args={[0.05, 0.02, 0.6]} position={[x, -0.4, z]} rotation={[0.2, 0, z > 0 ? -0.1 : 0.1]}><meshStandardMaterial color="#666" metalness={1} /></Cylinder>
        ))}
      </Center>
    </group>
  );
}

// --- FOLLOWING CAMERA ---
function ChaseCamera({ targetPosition, targetRotation }) {
  const { camera } = useThree();

  useFrame((state, delta) => {
    if (!targetPosition || !targetRotation) return;

    // Calculate ideal camera position (behind and slightly up)
    const offset = new THREE.Vector3(-8, 4, 0); // Behind the drone
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation.y);

    const idealPos = targetPosition.clone().add(offset);

    // Smoothly interpolate camera position
    camera.position.lerp(idealPos, delta * 3);
    camera.lookAt(targetPosition);
  });

  return null;
}

// --- UI COMPONENTS ---

// Prompt Modal
function EnvironmentPrompt({ isOpen, onClose, onGenerate }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    // Simulate Gemini "thinking"
    setTimeout(() => {
      setIsGenerating(false);
      onGenerate(prompt);
      onClose();
    }, 2000);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="w-[500px] glass-panel border-spacex-border p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-2 border-b border-spacex-border pb-4">
          <div className="w-8 h-8 rounded-sm bg-spacex-surface flex items-center justify-center border border-spacex-border text-white text-xs font-bold font-mono">
            AI
          </div>
          <h3 className="text-sm font-bold text-white tracking-wider uppercase">Generate Flight Environment</h3>
        </div>

        {isGenerating ? (
          <div className="py-12 text-center space-y-4">
            <div className="text-white font-mono text-xs uppercase tracking-wider animate-pulse flex flex-col gap-2">
              <span>> Initializing Gemini API...</span>
              <span>> Parsing Topology Data...</span>
              <span>> Synthesizing Voxel Geometry...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-xs text-spacex-text-dim uppercase tracking-wider font-bold">Describe the environment you want to test your drone in.</p>
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: A rocky alien landscape with high winds and low gravity..."
              className="w-full h-32 glass-input resize-none font-mono text-xs"
            />
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-spacex-border">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-sm border border-spacex-border text-spacex-text-dim hover:text-white hover:bg-white/5 transition-colors text-[10px] font-bold uppercase tracking-wider">
                CANCEL
              </button>
              <button type="submit" className="px-6 py-2 rounded-sm bg-white text-black hover:bg-gray-200 transition-all text-[10px] font-bold uppercase tracking-wider">
                GENERATE & LAUNCH
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Flight HUD
function FlightHUD({ speed, onExit }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Speedometer */}
      <div className="absolute bottom-12 left-12 flex flex-col gap-1">
        <div className="text-[10px] text-spacex-text-dim uppercase tracking-wider font-bold">Airspeed</div>
        <div className="text-4xl font-bold text-white font-mono tracking-tighter">
          {(speed * 10).toFixed(0)} <span className="text-sm text-spacex-text-dim font-normal">MPH</span>
        </div>
      </div>

      {/* Controls Guide */}
      <div className="absolute bottom-12 right-12 text-right">
        <div className="text-[10px] text-spacex-text-dim uppercase tracking-wider font-bold mb-2">Flight Systems Override</div>
        <div className="flex gap-4 text-[10px] font-mono text-spacex-text-dim">
          <div><strong className="text-white">W/S</strong> PITCH</div>
          <div><strong className="text-white">A/D</strong> ROLL</div>
          <div><strong className="text-white">SPACE/SHIFT</strong> ALT</div>
          <div><strong className="text-white">ARROWS</strong> YAW</div>
        </div>
      </div>

      {/* Exit Button (Pointer events enabled) */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button onClick={onExit} className="px-4 py-2 border border-error bg-error/10 text-error hover:bg-error/20 text-[10px] font-bold uppercase tracking-wider transition-colors">
          ABORT TEST FLIGHT
        </button>
      </div>

      {/* Reticle */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
function Visualizer3D({ missionId, missionStatus }) {
  const [mode, setMode] = useState('orbit'); // 'orbit' or 'flight'
  const [showPrompt, setShowPrompt] = useState(false);
  const [environmentName, setEnvironmentName] = useState("");

  // Flight Telemetry State
  const [dronePos, setDronePos] = useState(new THREE.Vector3(0, 0, 0));
  const [droneRot, setDroneRot] = useState(new THREE.Euler(0, 0, 0));
  const [droneSpeed, setDroneSpeed] = useState(0);

  const startFlightSetup = () => {
    setShowPrompt(true);
  };

  const launchFlight = (prompt) => {
    setEnvironmentName(prompt);
    setMode('flight');
  };

  const exitFlight = () => {
    setMode('orbit');
    setEnvironmentName("");
    // Reset positions would happen naturally as components unmount/remount usually
  };

  // Sim Loading
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
    <div className="glass-panel overflow-hidden relative h-full min-h-[600px] bg-black">

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} />
          <color attach="background" args={['#050505']} />

          {/* Lighting & Env */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow height={2048} width={2048} />
          <Environment preset="city" />
          {/* Stars removed for industrial aesthetic */}

          {mode === 'orbit' && (
            <group>
              {/* Standard Ground */}
              <Grid cellSize={1} cellThickness={0.02} cellColor="#333333" sectionSize={5} sectionThickness={0.05} sectionColor="#555555" fadeDistance={30} infiniteGrid />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#050505" transparent opacity={0.8} /></mesh>
              <OrbitControls enableDamping minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2} minPolarAngle={0.1} />

              {/* The Model */}
              <Suspense fallback={null}>
                {showModel && <PreviewAssembly />}
              </Suspense>
            </group>
          )}

          {mode === 'flight' && (
            <group>
              {/* Gemini Terrain */}
              <Terrain />

              {/* Physics Drone */}
              <FlightAssembly
                isFlying={true}
                onUpdate={(pos, rot, speed) => {
                  setDronePos(pos);
                  setDroneRot(rot);
                  setDroneSpeed(speed);
                }}
              />

              {/* Chasing Camera */}
              <ChaseCamera targetPosition={dronePos} targetRotation={droneRot} />
            </group>
          )}
        </Canvas>
      </div>

      {/* Orbit HUD Header - Only visible in Orbit Mode */}
      {mode === 'orbit' && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 border-b border-white/5 pointer-events-none bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-xs font-bold text-white">3D</div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">3D Visualizer</h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {showModel && (
                <button
                  onClick={startFlightSetup}
                  className="px-4 py-2 bg-white text-black border border-white rounded-sm flex items-center gap-2 hover:bg-gray-200 transition-all group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">INITIATE TEST FLIGHT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
          <div className="text-center">
            <div className="text-white font-mono text-xs uppercase tracking-wider animate-pulse">> INITIALIZING VISUAL SYSTEM...</div>
          </div>
        </div>
      )}

      {/* Flight HUD - Only in Flight Mode */}
      {mode === 'flight' && <FlightHUD speed={droneSpeed} onExit={exitFlight} />}

      {/* Prompt Modal */}
      <EnvironmentPrompt
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onGenerate={launchFlight}
      />

    </div>
  );
}

export default Visualizer3D;
