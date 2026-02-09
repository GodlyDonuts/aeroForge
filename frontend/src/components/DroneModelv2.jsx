import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Box, Cylinder, Sphere, Extrude } from '@react-three/drei';
import * as THREE from 'three';

/**
 * "Sherpa-Med" Mk.IV - Extended Range
 * Updates: Lengthened carbon fiber arms for rotor clearance and better torque authority.
 */

const CarbonFiberMaterial = ({ color = "#1a1a1a" }) => (
    <meshStandardMaterial
        color={color}
        roughness={0.7}
        metalness={0.2}
    />
);

const HighVisMaterial = () => (
    <meshStandardMaterial
        color="#ff4400"
        roughness={0.2}
        metalness={0.1}
        emissive="#ff2200"
        emissiveIntensity={0.2}
    />
);

const Propeller = ({ clockwise, speed }) => {
    const ref = useRef();
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += speed * (clockwise ? -1 : 1);
        }
    });

    return (
        <group ref={ref}>
            <Cylinder args={[0.08, 0.08, 0.1, 16]} position={[0, 0.05, 0]}>
                <meshStandardMaterial color="#888" metalness={0.8} />
            </Cylinder>
            <Box args={[3.2, 0.02, 0.25]} position={[0, 0.05, 0]}>
                <meshStandardMaterial color="#111" />
            </Box>
            <Cylinder args={[1.6, 1.6, 0.01, 32]} position={[0, 0.05, 0]}>
                <meshBasicMaterial color="#ffffff" transparent opacity={0.05} />
            </Cylinder>
        </group>
    );
};

const PayloadContainer = () => (
    <group position={[0, -0.6, 0]}>
        <Box args={[1.2, 0.8, 1.0]} castShadow>
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.1} />
        </Box>
        <group position={[0, 0, 0.51]}>
            <Box args={[0.4, 0.1, 0.01]}>
                <meshBasicMaterial color="#cc0000" />
            </Box>
            <Box args={[0.1, 0.4, 0.01]}>
                <meshBasicMaterial color="#cc0000" />
            </Box>
        </group>
        <Box args={[1.25, 0.05, 0.8]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#333" />
        </Box>
    </group>
);

export function DroneModel({ isStressed = false, hovering = true, flickering = false }) {
    const group = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (group.current && hovering) {
            group.current.position.y = Math.sin(t * 1.5) * 0.1;
            group.current.rotation.z = Math.sin(t * 0.5) * 0.02;
            group.current.rotation.x = Math.cos(t * 0.3) * 0.02;

            // Flickering effect during updates
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

    // --- MODIFICATION: INCREASED ARM LENGTH ---
    const armAngles = [0, 60, 120, 180, 240, 300];
    const armLength = 3.8; // Increased from 2.2 to 3.8

    return (
        <group ref={group}>
            <Center>
                {/* Fuselage */}
                <group scale={[1, 0.6, 1]}>
                    <Sphere args={[1.2, 32, 32]} scale={[1, 0.6, 1.4]} castShadow>
                        <CarbonFiberMaterial />
                    </Sphere>
                </group>

                {/* Cockpit */}
                <Sphere args={[0.5, 32, 16]} position={[0, 0.2, 0.6]} scale={[1, 0.5, 1.2]}>
                    <meshStandardMaterial color="#222" roughness={0.0} metalness={0.9} envMapIntensity={1} />
                </Sphere>

                {/* Navigation LED */}
                <Box args={[0.8, 0.1, 0.1]} position={[0, 0, 1.4]}>
                    <meshBasicMaterial color="#00ff00" />
                </Box>

                {/* Extended Arms */}
                {armAngles.map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    return (
                        <group key={i} rotation={[0, -rad, 0]}>
                            {/* Main Arm Spar */}
                            <Box args={[armLength, 0.15, 0.2]} position={[armLength / 2, 0, 0]} castShadow>
                                <CarbonFiberMaterial />
                            </Box>

                            {/* Wiring/Detail */}
                            <Box args={[armLength * 0.8, 0.02, 0.05]} position={[armLength / 2, 0.08, 0]}>
                                <HighVisMaterial />
                            </Box>

                            {/* Motor Mount */}
                            <group position={[armLength, 0.1, 0]}>
                                <Cylinder args={[0.25, 0.2, 0.3, 16]} castShadow>
                                    <meshStandardMaterial color="#444" metalness={0.6} />
                                </Cylinder>

                                <Cylinder args={[0.26, 0.26, 0.05, 16]} position={[0, 0.1, 0]}>
                                    <HighVisMaterial />
                                </Cylinder>

                                <group position={[0, 0.2, 0]}>
                                    <Propeller clockwise={i % 2 === 0} speed={0.4} />
                                </group>

                                {/* Landing Legs (Side Only) */}
                                {(i === 1 || i === 4) && (
                                    <group position={[0, -0.8, 0]} rotation={[0, 0, 0.2]}>
                                        <Cylinder args={[0.05, 0.03, 1.5, 8]} castShadow>
                                            <CarbonFiberMaterial />
                                        </Cylinder>
                                        <Sphere args={[0.15]} position={[0, -0.75, 0]}>
                                            <meshStandardMaterial color="#111" roughness={1} />
                                        </Sphere>
                                    </group>
                                )}
                            </group>
                        </group>
                    );
                })}

                {/* Landing Skids */}
                <group position={[0, -1.2, 0]}>
                    {[-0.8, 0.8].map((xPos, i) => (
                        <group key={i} position={[xPos, 0, 0]}>
                            <Box args={[0.15, 0.1, 3.5]} position={[0, 0, 0]} castShadow>
                                <meshStandardMaterial color="#333" roughness={0.9} />
                            </Box>
                            <Cylinder args={[0.08, 0.08, 1.0]} position={[0, 0.5, 0.8]} rotation={[0.2, 0, 0]}>
                                <CarbonFiberMaterial />
                            </Cylinder>
                            <Cylinder args={[0.08, 0.08, 1.0]} position={[0, 0.5, -0.8]} rotation={[-0.2, 0, 0]}>
                                <CarbonFiberMaterial />
                            </Cylinder>
                        </group>
                    ))}
                </group>

                <PayloadContainer />
            </Center>
        </group>
    );
}