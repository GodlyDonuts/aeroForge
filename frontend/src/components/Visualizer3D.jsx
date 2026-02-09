import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { HimalayanTerrain } from './HimalayanTerrain';
import { DroneModel } from './DroneModel';
import * as THREE from 'three';

// --- WRAPPER FOR DRONE MODEL ---
// Maintains backward compatibility with existing component structure
function PreviewAssembly({ config = 'standard', isStressed = false, designParams = {}, flickering = false, droneVersion = 1 }) {
  // Import different drone versions dynamically
  const [DroneModelV1, setDroneModelV1] = React.useState(null);
  const [DroneModelV2, setDroneModelV2] = React.useState(null);
  const [DroneModelV3, setDroneModelV3] = React.useState(null);

  React.useEffect(() => {
    import('./DroneModel').then(m => setDroneModelV1(() => m.DroneModel));
    import('./DroneModelv2').then(m => setDroneModelV2(() => m.DroneModel));
    import('./DroneModelv3').then(m => setDroneModelV3(() => m.DroneModel));
  }, []);

  if (droneVersion === 3 && DroneModelV3) {
    return <DroneModelV3 hovering={true} />;
  } else if (droneVersion === 2 && DroneModelV2) {
    return (
      <group position={[0, -10, 0]}>
        <DroneModelV2 hovering={true} />
      </group>
    );
  } else {
    return DroneModelV1 ? <DroneModelV1 config={config} isStressed={isStressed} designParams={designParams} flickering={flickering} /> : null;
  }
}


function Visualizer3D({ missionId, missionStatus, telemetryData }) {
  // Config State for Demo
  const [droneConfig, setDroneConfig] = useState('standard');
  const [isStressed, setIsStressed] = useState(false);
  const [envStage, setEnvStage] = useState('complete'); // 'grid' -> 'wireframe' -> 'complete' (always 'complete' for Himalayan demo)
  const [designParams, setDesignParams] = useState({});
  const [terrainProgress, setTerrainProgress] = useState(1.0);
  const [terrainDetail, setTerrainDetail] = useState(2);
  const [flickering, setFlickering] = useState(false);
  const [droneVersion, setDroneVersion] = useState(1); // Track drone version

  // Artificial Delay State
  const [isLoading, setIsLoading] = useState(false);
  const pendingTerrainData = useRef(null);
  const loadingTimeout = useRef(null);
  const [loadingMessage, setLoadingMessage] = useState('GENERATING GEOMETRY...');

  // Ref for exposing controls to window for "Scripting"
  useEffect(() => {
    window.aeroForge = {
      setStressed: setIsStressed,
      setConfig: setDroneConfig,
      setEnvStage: setEnvStage,
      setDesignParams: setDesignParams
    };
  }, []);

  // Sync loading state with mission status to prevent flash of content
  useEffect(() => {
    if (missionStatus?.status === 'generating') {
      setIsLoading(true);
      setLoadingMessage('GENERATING GEOMETRY...');
    } else if (missionStatus?.status === 'complete' || missionStatus?.status === 'running') {
      // Optional: Ensure it clears if not handled by event, but events usually handle it
      // We'll leave it to events for 'running', but 'complete' might be a safe fallback
    }
  }, [missionStatus]);

  // Listen for demo orchestrator updates
  useEffect(() => {
    // Listen for demo orchestrator updates
    const handleDesignUpdate = (data) => {
      console.log('Visualizer: Design update received', data);
      setDesignParams(data);
    };

    const handleTerrainUpdate = (data) => {
      console.log('Visualizer: Terrain update received', data);
      if (data.wireframe !== undefined) {
        setEnvStage(data.wireframe ? 'wireframe' : 'complete');
      }
      setTerrainProgress(data.progress || 1.0);
      setTerrainDetail(data.detailLevel || 2);
      if (data.flicker) {
        setFlickering(true);
        setTimeout(() => setFlickering(false), 300);
      }
    };

    const handleLoading = (data) => {
      console.log('Visualizer: Loading event received', data);
      if (data.active) {
        setIsLoading(true);
        if (data.message) setLoadingMessage(data.message);
      } else {
        setIsLoading(false);
        setLoadingMessage('GENERATING GEOMETRY...'); // Reset default
      }
    };

    const handleEnvironmentUpdate = (data) => {
      console.log('Visualizer: Environment update received', data);
      if (data.stage) {
        setEnvStage(data.stage);
      }
    };

    const handleDroneVersionChange = (data) => {
      console.log('Visualizer: Drone version change received', data);
      if (data.version) {
        setDroneVersion(data.version);
        setFlickering(true);
        setTimeout(() => setFlickering(false), 500);
      }
    };

    // Import simple demo orchestrator
    import('../engine/SimpleDemo').then((module) => {
      const orchestrator = module.simpleDemoOrchestrator;
      if (orchestrator) {
        orchestrator.on('design-update', handleDesignUpdate);
        orchestrator.on('terrain-update', handleTerrainUpdate);
        orchestrator.on('environment-update', handleEnvironmentUpdate);
        orchestrator.on('drone-version-change', handleDroneVersionChange);
        orchestrator.on('loading', handleLoading);
      }
    });

    return () => {
      // Cleanup
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    };
  }, [isLoading, terrainProgress]); // Dependencies for the effect closure

  return (
    <div className="flex-1 bg-black relative overflow-hidden h-full">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[21.30, 82.71, 2.39]} fov={60} />
        <color attach="background" args={['#0f172a']} />

        {/* Lights for Drone Visibility */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />

        {/* Environment - placed first so lighting is available */}
        {!isLoading && (
          <HimalayanTerrain
            generationProgress={terrainProgress}
            isWireframe={envStage === 'wireframe'}
            detailLevel={terrainDetail}
          />
        )}

        {/* Drone Model - positioned higher and offset to avoid being inside peaks */}
        {!isLoading && (
          <Suspense fallback={null}>
            <group position={[0, 65, 0]}>
              <PreviewAssembly config={droneConfig} isStressed={isStressed} designParams={designParams} flickering={flickering} droneVersion={droneVersion} />
            </group>
          </Suspense>
        )}

        <OrbitControls
          enableDamping
          minDistance={8}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 45, 0]} // Look at the drone
        />
      </Canvas>

      {/* Overlay: Stress Warning */}
      {isStressed && !isLoading && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-full h-full border-[20px] border-error/20 animate-pulse"></div>
          <div className="absolute top-1/4 bg-error/10 border border-error text-error px-4 py-2 font-mono font-bold uppercase tracking-widest text-lg backdrop-blur-md animate-bounce">
            ⚠️ CRITICAL FAILURE DETECTED: ROTOR STALL
          </div>
        </div>
      )}

      {/* Overlay: Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-spacex-blue border-t-transparent rounded-full animate-spin"></div>
            <div className="text-spacex-blue font-mono text-sm uppercase tracking-[0.2em] animate-pulse">
              {loadingMessage}
            </div>
          </div>
        </div>
      )}

      {/* Overlay: Status Message (Small bottom left) */}
      {missionStatus?.status === 'generating' && !isLoading && (
        <div className="absolute bottom-8 left-8">
          <div className="text-spacex-text-dim font-mono text-xs uppercase tracking-wider animate-pulse">
            {'>'} OPTIMIZING MESH...
          </div>
        </div>
      )}
    </div>
  );
}

export default Visualizer3D;
