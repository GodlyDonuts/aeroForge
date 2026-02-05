#!/usr/bin/env python3
"""
Core Physics Module - Cinematic Physics
Captures full 6-DOF telemetry for every frame
"""

import os
import numpy as np
from typing import Dict, List, Optional, Tuple
from pathlib import Path


class SimRunner:
    """
    Physics engine wrapper with cinematic 6-DOF telemetry capture.

    Captures Position (X,Y,Z) + Rotation Quaternion (Qx,Qy,Qz,Qw) for every frame.
    """

    def __init__(self, backend: str = "gpu"):
        """
        Initialize Genesis physics engine.

        Args:
            backend: 'gpu' or 'cpu' for simulation backend
        """
        self.backend = backend
        self.scene = None
        self._initialize_genesis()

    def _initialize_genesis(self):
        """Initialize the Genesis engine with appropriate backend."""
        try:
            import genesis as gs

            # Initialize Genesis with specified backend
            if self.backend == "gpu":
                gs.init(backend=gs.gpu)
            else:
                gs.init(backend=gs.cpu)

            print(f"Genesis physics engine initialized (backend: {self.backend})")
            self.gs = gs

        except ImportError:
            raise ImportError(
                "Genesis is required. Install with: pip install genesis-world"
            )
        except Exception as e:
            print(f"Warning: Genesis initialization failed: {e}")
            print("Falling back to mock simulation for development")
            self.gs = None

    def load_environment(
        self,
        urdf_path: str,
        terrain: str = "plane",
        gravity: List[float] = [0, 0, -9.81]
    ) -> bool:
        """
        Load a URDF model into a Genesis scene.

        Args:
            urdf_path: Path to URDF file
            terrain: Type of terrain ('plane', 'rough', 'custom')
            gravity: Gravity vector [x, y, z]

        Returns:
            True if successful, False otherwise
        """
        if self.gs is None:
            print("Warning: Genesis not available, using mock mode")
            self.urdf_path = urdf_path
            return True

        try:
            # Create scene
            self.scene = self.gs.Scene(
                show_viewer=False,
            )

            # Add terrain
            if terrain == "plane":
                plane = self.scene.add_entity(
                    morph=self.gs.morphs.Plane()
                )
            elif terrain == "rough":
                plane = self.scene.add_entity(
                    morph=self.gs.morphs.Terrain(
                        horizontal_scale=0.1,
                        vertical_scale=0.05
                    )
                )

            # Load robot from URDF
            robot = self.scene.add_entity(
                morph=self.gs.morphs.URDF(
                    file=urdf_path,
                ),
            )

            self.robot = robot
            self.urdf_path = urdf_path

            print(f"Loaded environment: {urdf_path}")
            return True

        except Exception as e:
            print(f"Error loading environment: {e}")
            # Fallback to mock mode
            self.urdf_path = urdf_path
            return False

    def run_episode(self, steps: int = 1000, dt: float = 0.01) -> Dict:
        """
        Run simulation episode and capture full 6-DOF telemetry.

        Args:
            steps: Number of simulation steps
            dt: Time step in seconds

        Returns:
            Dictionary containing full 6-DOF time-series telemetry data:
            - position: [x, y, z] for each frame
            - rotation_quaternion: [qx, qy, qz, qw] for each frame
            - velocity: [vx, vy, vz] for each frame
            - angular_velocity: [wx, wy, wz] for each frame
            - forces: [fx, fy, fz] for each frame
            - time: simulation time for each frame
        """
        if self.gs is None or self.scene is None:
            # Mock simulation for development/testing with cinematic data
            return self._run_mock_simulation(steps, dt)

        telemetry = {
            "time": [],
            "position": [],           # [x, y, z]
            "rotation_quaternion": [],  # [qx, qy, qz, qw]
            "velocity": [],            # [vx, vy, vz]
            "angular_velocity": [],    # [wx, wy, wz]
            "forces": [],              # [fx, fy, fz]
            "torques": [],             # [tx, ty, tz]
            "energies": []
        }

        try:
            for step in range(steps):
                # Step physics
                self.scene.step()

                # Capture full 6-DOF telemetry
                time = step * dt

                # Position
                if hasattr(self.robot, "get_pos"):
                    pos = self.robot.get_pos()
                    telemetry["position"].append(pos.copy())

                # Rotation (Quaternion)
                if hasattr(self.robot, "get_quat"):
                    quat = self.robot.get_quat()  # Returns [qx, qy, qz, qw]
                    telemetry["rotation_quaternion"].append(quat.copy())

                # Linear Velocity
                if hasattr(self.robot, "get_vel"):
                    vel = self.robot.get_vel()
                    telemetry["velocity"].append(vel.copy())

                # Angular Velocity
                if hasattr(self.robot, "get_ang_vel"):
                    ang_vel = self.robot.get_ang_vel()
                    telemetry["angular_velocity"].append(ang_vel.copy())

                # Forces
                if hasattr(self.robot, "get_force"):
                    force = self.robot.get_force()
                    telemetry["forces"].append(force.copy())

                telemetry["time"].append(time)

            print(f"Completed simulation: {steps} steps, {time:.2f}s simulated time")
            print(f"Captured {len(telemetry['time'])} frames of 6-DOF telemetry")

        except Exception as e:
            print(f"Simulation error: {e}")
            telemetry["error"] = str(e)

        return telemetry

    def _run_mock_simulation(self, steps: int, dt: float) -> Dict:
        """
        Run a cinematic mock simulation with full 6-DOF telemetry.

        Simulates realistic drone flight dynamics with hovering and gentle maneuvers.

        Args:
            steps: Number of simulation steps
            dt: Time step in seconds

        Returns:
            Mock telemetry data with full 6-DOF
        """
        print(f"Running mock cinematic simulation: {steps} steps")

        telemetry = {
            "time": [],
            "position": [],           # [x, y, z]
            "rotation_quaternion": [],  # [qx, qy, qz, qw]
            "velocity": [],            # [vx, vy, vz]
            "angular_velocity": [],    # [wx, wy, wz]
            "forces": [],              # [fx, fy, fz]
            "torques": [],             # [tx, ty, tz]
            "energies": [],
            "mock": True
        }

        # Simulate drone hover with gentle circular motion
        t = np.arange(steps) * dt

        # Circular path in X-Y plane
        radius = 1.0
        omega = 0.3  # Angular velocity for circular motion

        # Position: hover at 1m with circular motion
        x = radius * np.sin(omega * t)
        y = radius * np.cos(omega * t)
        z = 1.0 + 0.05 * np.sin(2 * np.pi * 0.5 * t)  # Gentle hover bobbing
        positions = np.column_stack([x, y, z])

        # Velocity: derivative of position
        vx = radius * omega * np.cos(omega * t)
        vy = -radius * omega * np.sin(omega * t)
        vz = 0.05 * 2 * np.pi * 0.5 * np.cos(2 * np.pi * 0.5 * t)
        velocities = np.column_stack([vx, vy, vz])

        # Rotation Quaternions: [qx, qy, qz, qw]
        # Simulate gentle banking during circular motion
        bank_angle = 0.1 * np.sin(omega * t)  # +/- 5.7 degrees bank
        qx = 0.5 * np.sin(bank_angle)
        qy = 0
        qz = 0
        qw = 0.5 * np.cos(bank_angle)

        # Normalize quaternions
        quat_norm = np.sqrt(qx**2 + qy**2 + qz**2 + qw**2)
        qx /= quat_norm
        qy /= quat_norm
        qz /= quat_norm
        qw /= quat_norm

        quaternions = np.column_stack([qx, qy, qz, qw])

        # Angular Velocity: [wx, wy, wz]
        wx = 0.1 * omega * np.cos(omega * t)  # Roll rate from banking
        wy = 0.1 * omega * np.sin(omega * t)  # Pitch rate from path
        wz = 2.0  # Constant yaw rate for quadcopter
        angular_velocities = np.column_stack([wx, wy, wz])

        # Forces: Lift to counteract gravity + centripetal force
        m = 1.0  # kg
        g = 9.81
        centripetal_force = m * radius * omega**2
        lift = m * g + centripetal_force
        forces = np.column_stack([
            np.sin(omega * t) * centripetal_force,  # X component
            -np.cos(omega * t) * centripetal_force,  # Y component
            np.full_like(t, lift)  # Z component
        ])

        # Torques: Minimal for stable hover
        torques = np.column_stack([
            np.zeros_like(t),  # Roll torque
            np.zeros_like(t),  # Pitch torque
            np.zeros_like(t),  # Yaw torque
        ])

        # Energy: Kinetic + Potential
        kinetic = 0.5 * m * np.sum(velocities**2, axis=1)
        potential = m * g * positions[:, 2]
        energies = kinetic + potential

        # Store all telemetry
        telemetry["time"] = t.tolist()
        telemetry["position"] = positions.tolist()
        telemetry["rotation_quaternion"] = quaternions.tolist()
        telemetry["velocity"] = velocities.tolist()
        telemetry["angular_velocity"] = angular_velocities.tolist()
        telemetry["forces"] = forces.tolist()
        telemetry["torques"] = torques.tolist()
        telemetry["energies"] = energies.tolist()

        print(f"Mock cinematic simulation complete: {t[-1]:.2f}s simulated time")
        print(f"Captured {len(telemetry['time'])} frames of 6-DOF telemetry")

        return telemetry

    def analyze_stability(self, telemetry: Dict) -> Dict:
        """
        Analyze simulation telemetry for stability metrics.

        Args:
            telemetry: Telemetry data from simulation

        Returns:
            Dictionary of stability metrics
        """
        metrics = {}

        if telemetry.get("mock", False):
            # Mock analysis
            metrics["stability_score"] = 0.92
            metrics["max_acceleration"] = 3.2
            metrics["position_drift"] = 1.0
            metrics["energy_efficiency"] = 0.85
            metrics["oscillation_amplitude"] = 0.05
            metrics["max_angular_velocity"] = 2.5
            metrics["trajectory_smoothness"] = 0.88
        else:
            # Real analysis from simulation data
            positions = np.array(telemetry.get("position", []))
            velocities = np.array(telemetry.get("velocity", []))
            angular_vels = np.array(telemetry.get("angular_velocity", []))

            if len(positions) > 0:
                # Position drift from origin
                metrics["position_drift"] = np.std(positions, axis=0).mean()

                # Velocity stability
                vel_mag = np.linalg.norm(velocities, axis=1)
                metrics["max_velocity"] = np.max(vel_mag)
                metrics["velocity_std"] = np.std(vel_mag)

                # Angular velocity stability
                ang_vel_mag = np.linalg.norm(angular_vels, axis=1)
                metrics["max_angular_velocity"] = np.max(ang_vel_mag)
                metrics["angular_velocity_std"] = np.std(ang_vel_mag)

                # Acceleration
                if len(velocities) > 1:
                    accelerations = np.gradient(velocities, axis=0) / dt
                    acc_mag = np.linalg.norm(accelerations, axis=1)
                    metrics["max_acceleration"] = np.max(acc_mag)

                # Overall stability score (inverse of variability)
                metrics["stability_score"] = max(0, 1.0 - metrics.get("position_drift", 1.0))

        return metrics

    def cleanup(self):
        """Clean up Genesis resources."""
        if self.scene is not None:
            self.scene = None
