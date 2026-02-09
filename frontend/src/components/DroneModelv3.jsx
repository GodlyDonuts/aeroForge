import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Box, Cylinder, Sphere, Torus, Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Sherpa-Med Mk.V "Apex"
 * - Toroidal Propellers (High efficiency in thin air)
 * - Adaptive Hydraulic Legs (All-terrain landing)
 * - Winch Delivery System (Non-contact delivery)
 * - Topology-Optimized Frame (Weight reduction)
 */

// --- MATERIALS ---
const ForgedCarbon = ({ color = "#151515" }) => (
    <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.5}
        normalScale={[1, 1]}
    />
);

const AnodizedAluminum = ({ color = "#cc3300" }) => (
    <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.1}
    />
);

const SensorGlass = () => (
    <meshPhysicalMaterial
        color="#111"
        metalness={0.9}
        roughness={0.05}
        transmission={0.2}
        thickness={1}
    />
);

// --- COMPONENTS ---

// 1. TOROIDAL PROPELLER (The Loop Blade)
const ToroidalProp = ({ clockwise, speed }) => {
    const ref = useRef();
    useFrame(() => {
        if (ref.current) ref.current.rotation.y += speed * (clockwise ? -1 : 1);
    });

    return (
        <group ref={ref}>
            {/* Central Hub */}
            <Cylinder args={[0.15, 0.2, 0.15, 16]}>
                <meshStandardMaterial color="#444" />
            </Cylinder>

            {/* The Loop Blades (Toroidal shape for efficiency) */}
            <group rotation={[Math.PI / 2, 0, 0]}>
                {[0, Math.PI].map((rot, i) => (
                    <group key={i} rotation={[0, 0, rot]}>
                        <mesh position={[0.8, 0, 0]} rotation={[0, 1.2, 0]}>
                            <torusGeometry args={[0.8, 0.08, 8, 32, Math.PI * 1.2]} />
                            <meshStandardMaterial color="#111" roughness={0.2} />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* Visual Blur for speed */}
            <Torus args={[1.6, 0.1, 8, 32]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.1]}>
                <meshBasicMaterial color="#fff" transparent opacity={0.03} />
            </Torus>
        </group>
    );
};

// 2. ADAPTIVE SPIDER LEG
const SpiderLeg = ({ position, rotation, extension = 1 }) => {
    return (
        <group position={position} rotation={rotation}>
            {/* Hip Joint */}
            <Sphere args={[0.15]} castShadow>
                <AnodizedAluminum color="#444" />
            </Sphere>

            {/* Upper Leg (Femur) */}
            <group rotation={[0.5, 0, 0]}>
                <Box args={[0.1, 0.8, 0.1]} position={[0, -0.4, 0]} castShadow>
                    <ForgedCarbon />
                </Box>

                {/* Hydraulic Piston Detail */}
                <Cylinder args={[0.04, 0.04, 0.6]} position={[0.12, -0.4, 0]}>
                    <meshStandardMaterial color="#888" metalness={1} />
                </Cylinder>

                {/* Knee Joint */}
                <group position={[0, -0.8, 0]} rotation={[-1.2 * extension, 0, 0]}>
                    <Sphere args={[0.12]} castShadow>
                        <AnodizedAluminum color="#ff4400" />
                    </Sphere>

                    {/* Lower Leg (Tibia) */}
                    <Cylinder args={[0.06, 0.04, 1.0]} position={[0, -0.5, 0]} castShadow>
                        <ForgedCarbon />
                    </Cylinder>

                    {/* Foot Pad (Sensor equipped) */}
                    <group position={[0, -1.0, 0]} rotation={[0.7, 0, 0]}>
                        <Cylinder args={[0.12, 0.15, 0.1, 16]}>
                            <meshStandardMaterial color="#222" roughness={1} />
                        </Cylinder>
                    </group>
                </group>
            </group>
        </group>
    );
};

// 3. WINCH PAYLOAD SYSTEM
const WinchSystem = () => {
    return (
        <group position={[0, -0.4, 0]}>
            {/* Winch Housing */}
            <Box args={[0.8, 0.3, 0.6]} castShadow>
                <ForgedCarbon color="#222" />
            </Box>

            {/* Cable (Simulated) */}
            <Cylinder args={[0.01, 0.01, 0.8]} position={[0, -0.5, 0]}>
                <meshBasicMaterial color="#333" />
            </Cylinder>

            {/* The Package (Aerodynamic Pod) */}
            <group position={[0, -0.9, 0]}>
                <Sphere args={[0.5, 32, 32]} scale={[1, 0.8, 0.8]} castShadow>
                    <meshStandardMaterial color="#fff" roughness={0.3} />
                </Sphere>
                {/* Medical Cross */}
                <Box args={[0.4, 0.15, 0.05]} position={[0, 0, 0.4]} rotation={[0, 0, 0]}>
                    <meshBasicMaterial color="#e60000" />
                </Box>
                <Box args={[0.15, 0.4, 0.05]} position={[0, 0, 0.4]} rotation={[0, 0, 0]}>
                    <meshBasicMaterial color="#e60000" />
                </Box>
            </group>
        </group>
    );
};

export function DroneModel({ hovering = true, flickering = false }) {
    const group = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (group.current && hovering) {
            // Sophisticated flight controller hover (micro-adjustments)
            group.current.position.y = Math.sin(t * 1.2) * 0.15;
            group.current.rotation.x = Math.sin(t * 0.4) * 0.03;
            group.current.rotation.z = Math.cos(t * 0.3) * 0.03;

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

    const armAngles = [0, 60, 120, 180, 240, 300];
    const armLength = 3.5;

    return (
        <group ref={group}>
            <Center>

                {/* --- CENTRAL CORE (Topology Optimized) --- */}
                {/* Main Body is minimal, mostly battery and brain */}
                <group scale={[1, 0.8, 1.2]}>
                    <Box args={[1.4, 0.6, 2.0]} castShadow>
                        <ForgedCarbon />
                    </Box>
                </group>

                {/* Front Sensor Array (LIDAR/Optical) */}
                <group position={[0, 0, 1.2]}>
                    <Box args={[0.6, 0.4, 0.4]} castShadow>
                        <SensorGlass />
                    </Box>
                    {/* LIDAR Spinner */}
                    <Cylinder args={[0.15, 0.15, 0.1]} position={[0, 0.25, 0]}>
                        <meshStandardMaterial color="#000" />
                    </Cylinder>
                </group>

                {/* Rear Battery Module (Swappable) */}
                <Box args={[1.0, 0.5, 0.4]} position={[0, 0.1, -1.1]}>
                    <meshStandardMaterial color="#333" />
                    <Box args={[0.1, 0.4, 0.05]} position={[0, 0, 0.21]}>
                        <meshBasicMaterial color="#00ff00" /> {/* Charge Indicator */}
                    </Box>
                </Box>

                {/* --- PROPULSION ARMS --- */}
                {armAngles.map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    return (
                        <group key={i} rotation={[0, -rad, 0]}>
                            {/* Truss Arm Structure (Generative Design Look) */}
                            <group position={[armLength / 2, 0.1, 0]}>
                                {/* Top Spar */}
                                <Box args={[armLength, 0.05, 0.05]} position={[0, 0.1, 0]}>
                                    <ForgedCarbon />
                                </Box>
                                {/* Bottom Spar */}
                                <Box args={[armLength, 0.05, 0.05]} position={[0, -0.1, 0]}>
                                    <ForgedCarbon />
                                </Box>
                                {/* Cross Bracing */}
                                <Cylinder args={[0.02, 0.02, 0.3]} position={[-0.5, 0, 0]} rotation={[0, 0, 0.7]}>
                                    <AnodizedAluminum color="#222" />
                                </Cylinder>
                                <Cylinder args={[0.02, 0.02, 0.3]} position={[0.5, 0, 0]} rotation={[0, 0, -0.7]}>
                                    <AnodizedAluminum color="#222" />
                                </Cylinder>
                            </group>

                            {/* Motor & Prop */}
                            <group position={[armLength, 0.15, 0]}>
                                {/* Tilt-Rotor Servo Mechanism Visual */}
                                <Sphere args={[0.25]} castShadow>
                                    <AnodizedAluminum color="#333" />
                                </Sphere>

                                <group position={[0, 0.3, 0]}>
                                    <ToroidalProp clockwise={i % 2 === 0} speed={0.6} />
                                </group>
                            </group>
                        </group>
                    );
                })}

                {/* --- ADAPTIVE LANDING GEAR --- */}
                {/* 4 Legs instead of skids, angled for stability */}
                <SpiderLeg position={[0.8, -0.3, 0.8]} rotation={[0, -Math.PI / 4, 0]} />
                <SpiderLeg position={[-0.8, -0.3, 0.8]} rotation={[0, Math.PI / 4, 0]} />
                <SpiderLeg position={[0.8, -0.3, -0.8]} rotation={[0, -Math.PI * 0.75, 0]} />
                <SpiderLeg position={[-0.8, -0.3, -0.8]} rotation={[0, Math.PI * 0.75, 0]} />

                {/* --- PAYLOAD --- */}
                <WinchSystem />

            </Center>
        </group>
    );
}