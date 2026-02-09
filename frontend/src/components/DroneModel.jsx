import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Drone 3D Model Component (V1 - Basic Quadcopter)
 * Supports: Standard/Rescue configs, stress visualization, and iterative design parameters
 */
export function DroneModel({ config = 'standard', isStressed = false, designParams = {}, flickering = false }) {
  const group = useRef();

  // Animation for "Hover" idle
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.1) * 0.1;
      group.current.position.y = Math.sin(t * 0.5) * 0.1;

      // Flickering effect during design updates
      if (flickering) {
        const children = group.current.children;
        if (children && children.length > 0) {
          children.forEach(child => {
            if (child.material) {
              child.material.transparent = true;
              child.material.opacity = 0.5 + Math.random() * 0.5;
              child.material.wireframe = Math.random() > 0.5;
            }
          });
        }
      }
    }
  });

  // Extract design params with defaults
  const {
    armThickness = 10,
    armLength = 200,
    mountRadius = 25,
    fuselageLength = 140,
    fuselageWidth = 100,
    fuselageHeight = 45
  } = designParams;

  // Material Props
  const materialProps = {
    color: "#222222",
    metalness: 0.8,
    roughness: 0.2,
  };

  // Rotor Props (Dynamic for Morphing)
  const rotorScale = config === 'rescue' ? [1.5, 1, 1.5] : [1, 1, 1];
  const armLengthMultiplier = config === 'rescue' ? 1.2 : 1;

  // Scale factors from mm to 3D units
  const armThickness3D = (armThickness / 10) * 0.1; // 10mm -> 0.1
  const armLength3D = (armLength / 100) * 1.6; // 200mm -> 3.2
  const mountRadius3D = (mountRadius / 25) * 0.25; // 25mm -> 0.25
  const fuselageLength3D = (fuselageLength / 120) * 1.2; // 140mm -> 1.4
  const fuselageWidth3D = (fuselageWidth / 80) * 0.8; // 100mm -> 1.0
  const fuselageHeight3D = (fuselageHeight / 45) * 0.4; // 45mm -> 0.4

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
        {/* Fuselage (Main Body) */}
        <Box args={[fuselageLength3D, fuselageHeight3D, fuselageWidth3D]} castShadow receiveShadow>
          <meshStandardMaterial {...materialProps} />
        </Box>

        {/* LED Indicator (Red light on front) */}
        <Box args={[0.3, 0.2, 0.1]} position={[0.65, 0, 0]} castShadow>
          <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.2} />
        </Box>

        {/* Four Arms in X-Configuration */}
        {[[-1, 1], [-1, -1], [1, 1], [1, -1]].map(([x, z], i) => (
          <group key={i} position={[x * 0.8 * armLengthMultiplier, 0, z * 0.8 * armLengthMultiplier]}>
            {/* Arm Beam */}
            <Box
              args={[armLength3D, armThickness3D, armThickness3D]}
              position={[-x * 0.5 * armLengthMultiplier, 0, -z * 0.5 * armLengthMultiplier]}
              rotation={[0, Math.atan2(z, x), 0]}
              castShadow
            >
              <meshStandardMaterial {...materialProps} />
            </Box>

            {/* Motor Housing */}
            <Cylinder args={[mountRadius3D * 0.8, mountRadius3D * 0.6, mountRadius3D * 1.2, 32]} position={[0, 0.1, 0]} castShadow>
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
