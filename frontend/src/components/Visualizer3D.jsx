import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera, Center, Box, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';

// --- DRONE ASSEMBLY ---
// Supports: "Standard" vs "Rescue" configs, and "Stress" visualization
function PreviewAssembly({ config = 'standard', isStressed = false }) {
  const group = useRef();

  // Animation for "Hover" idle
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.1) * 0.1;
      group.current.position.y = Math.sin(t * 0.5) * 0.1;
    }
  });

  // Material Props
  const materialProps = {
    color: "#222222",
    metalness: 0.8,
    roughness: 0.2,
  };

  // Rotor Props (Dynamic for Morphing)
  const rotorScale = config === 'rescue' ? [1.5, 1, 1.5] : [1, 1, 1];
  const armLengthMultiplier = config === 'rescue' ? 1.2 : 1;

  // Stress Props (Dynamic for Red Glow)
  const rotorMaterial = isStressed ? (
    <meshStandardMaterial
      color="#ff0000"
      emissive="#ff0000"
      emissiveIntensity={2}
      toneMapped={false}
    />
  ) : (
    <meshStandardMaterial
      color="#333"
      metalness={0.5}
    />
  );

  return (
    <group ref={group}>
      <Center>
        {/* Fuselage */}
        <Box args={[1.2, 0.4, 0.6]} castShadow receiveShadow>
          <meshStandardMaterial {...materialProps} />
        </Box>
        <Box args={[0.3, 0.2, 0.1]} position={[0.65, 0, 0]} castShadow>
          <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.2} />
        </Box>

        {/* Arms & Rotors */}
        {[[-1, 1], [-1, -1], [1, 1], [1, -1]].map(([x, z], i) => (
          <group key={i} position={[x * 0.8 * armLengthMultiplier, 0, z * 0.8 * armLengthMultiplier]}>
            {/* Arm */}
            <Box
              args={[1 * armLengthMultiplier, 0.1, 0.1]}
              position={[-x * 0.5 * armLengthMultiplier, 0, -z * 0.5 * armLengthMultiplier]}
              rotation={[0, Math.atan2(z, x), 0]}
            >
              <meshStandardMaterial {...materialProps} />
            </Box>

            {/* Motor Housing */}
            <Cylinder args={[0.25, 0.2, 0.3, 32]} position={[0, 0.1, 0]} castShadow>
              <meshStandardMaterial {...materialProps} />
            </Cylinder>

            {/* Propeller / Rotor */}
            <group scale={rotorScale}>
              <Box args={[1.2, 0.02, 0.1]} position={[0, 0.3, 0]}>
                {rotorMaterial}
              </Box>
              <Box args={[1.2, 0.02, 0.1]} position={[0, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
                {rotorMaterial}
              </Box>
              {/* Rotor Disk Effect (Blur) */}
              <Cylinder args={[0.6, 0.6, 0.01, 32]} position={[0, 0.3, 0]}>
                <meshBasicMaterial color={isStressed ? "#ff0000" : "#ffffff"} transparent opacity={0.1} />
              </Cylinder>
            </group>
          </group>
        ))}
      </Center>
    </group>
  );
}

// --- ENVIRONMENT ---
function ProgressiveEnvironment({ stage = 'complete' }) { // 'grid', 'wireframe', 'complete'

  return (
    <group>
      {/* Base Grid - Always Visible */}
      <Grid
        cellSize={1}
        cellThickness={0.02}
        cellColor="#333333"
        sectionSize={5}
        sectionThickness={0.05}
        sectionColor="#555555"
        fadeDistance={50}
        infiniteGrid
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#050505" transparent opacity={0.9} />
      </mesh>

      {/* Stage 2: Topography Wireframes */}
      {(stage === 'wireframe' || stage === 'complete') && (
        <group position={[0, -2, -10]}>
          {/* Fake Mountain Low Poly */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0, -10]}>
            <planeGeometry args={[20, 20, 10, 10]} />
            <meshBasicMaterial wireframe color="#00ff88" transparent opacity={0.1} />
          </mesh>
        </group>
      )}

      {/* Stage 3: Fog & Atmosphere */}
      {stage === 'complete' && (
        <>
          <fog attach="fog" args={['#050505', 5, 40]} />
          <Environment preset="city" />
        </>
      )}
    </group>
  );
}


// --- MAIN VISUALIZER ---
function Visualizer3D({ missionId, missionStatus, telemetryData }) {
  // Config State for Demo
  const [droneConfig, setDroneConfig] = useState('standard');
  const [isStressed, setIsStressed] = useState(false);
  const [envStage, setEnvStage] = useState('complete'); // 'grid' -> 'wireframe' -> 'complete'

  // Ref for exposing controls to window for "Scripting"
  useEffect(() => {
    window.aeroForge = {
      setStressed: setIsStressed,
      setConfig: setDroneConfig,
      setEnvStage: setEnvStage
    };
  }, []);

  return (
    <div className="flex-1 bg-black relative overflow-hidden h-full">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={45} />
        <color attach="background" args={['#000000']} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />

        {/* Environment */}
        <ProgressiveEnvironment stage={envStage} />

        {/* Drone Model */}
        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            <PreviewAssembly config={droneConfig} isStressed={isStressed} />
          </group>
        </Suspense>

        <OrbitControls enableDamping minDistance={3} maxDistance={20} maxPolarAngle={Math.PI / 2} />
      </Canvas>

      {/* Overlay: Stress Warning */}
      {isStressed && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-full h-full border-[20px] border-error/20 animate-pulse"></div>
          <div className="absolute top-1/4 bg-error/10 border border-error text-error px-4 py-2 font-mono font-bold uppercase tracking-widest text-lg backdrop-blur-md animate-bounce">
            ⚠️ CRITICAL FAILURE DETECTED: ROTOR STALL
          </div>
        </div>
      )}

      {/* Overlay: Loading */}
      {missionStatus?.status === 'generating' && (
        <div className="absolute bottom-8 left-8">
          <div className="text-spacex-text-dim font-mono text-xs uppercase tracking-wider animate-pulse">
            {'>'} GENERATING GEOMETRY...
          </div>
        </div>
      )}
    </div>
  );
}

export default Visualizer3D;
