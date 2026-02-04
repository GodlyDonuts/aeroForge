#!/usr/bin/env python3
"""
Core Physics Module
Interface with Genesis physics engine for simulation
"""

import os
import numpy as np
from typing import Dict, List, Optional
from pathlib import Path


class SimRunner:
    """
    Wrapper for Genesis physics engine.
    Handles simulation initialization, execution, and telemetry capture.
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
                viewer_options={"width": 1280, "height": 720}
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
                    fixed_base=False
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
        Run simulation episode and capture telemetry.

        Args:
            steps: Number of simulation steps
            dt: Time step in seconds

        Returns:
            Dictionary containing time-series telemetry data
        """
        if self.gs is None or self.scene is None:
            # Mock simulation for development/testing
            return self._run_mock_simulation(steps, dt)

        telemetry = {
            "time": [],
            "positions": [],
            "velocities": [],
            "forces": [],
            "energies": []
        }

        try:
            for step in range(steps):
                # Step physics
                self.scene.step()

                # Capture telemetry
                time = step * dt

                # Get robot state (if available)
                if hasattr(self.robot, "get_pos"):
                    pos = self.robot.get_pos()
                    telemetry["positions"].append(pos.copy())

                if hasattr(self.robot, "get_vel"):
                    vel = self.robot.get_vel()
                    telemetry["velocities"].append(vel.copy())

                telemetry["time"].append(time)

            print(f"Completed simulation: {steps} steps, {time:.2f}s simulated time")

        except Exception as e:
            print(f"Simulation error: {e}")
            telemetry["error"] = str(e)

        return telemetry

    def _run_mock_simulation(self, steps: int, dt: float) -> Dict:
        """
        Run a mock simulation for development/testing when Genesis is unavailable.

        Args:
            steps: Number of simulation steps
            dt: Time step in seconds

        Returns:
            Mock telemetry data
        """
        print(f"Running mock simulation: {steps} steps")

        telemetry = {
            "time": [],
            "positions": [],
            "velocities": [],
            "forces": [],
            "energies": [],
            "mock": True
        }

        # Simulate a simple drone hover dynamics
        t = np.arange(steps) * dt

        # Position: simple hover with small oscillations
        z_pos = 1.0 + 0.1 * np.sin(2 * np.pi * 0.5 * t)
        positions = np.column_stack([
            0.1 * np.sin(2 * np.pi * 0.3 * t),  # x
            0.1 * np.cos(2 * np.pi * 0.3 * t),  # y
            z_pos
        ])

        # Velocity: derivative of position
        velocities = np.gradient(positions, axis=0) / dt

        # Forces: thrust to maintain hover
        m = 1.0  # kg
        g = 9.81
        thrust = m * g + m * np.gradient(velocities[:, 2], dt)
        forces = np.column_stack([
            np.zeros_like(t),
            np.zeros_like(t),
            thrust
        ])

        # Energy: kinetic + potential
        kinetic = 0.5 * m * np.sum(velocities**2, axis=1)
        potential = m * g * positions[:, 2]
        energies = kinetic + potential

        telemetry["time"] = t.tolist()
        telemetry["positions"] = positions.tolist()
        telemetry["velocities"] = velocities.tolist()
        telemetry["forces"] = forces.tolist()
        telemetry["energies"] = energies.tolist()

        print(f"Mock simulation complete: {t[-1]:.2f}s simulated time")

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
            metrics["stability_score"] = 0.85
            metrics["max_acceleration"] = 2.5
            metrics["position_drift"] = 0.12
            metrics["energy_efficiency"] = 0.78
            metrics["oscillation_amplitude"] = 0.10
        else:
            # Real analysis from simulation data
            positions = np.array(telemetry.get("positions", []))
            velocities = np.array(telemetry.get("velocities", []))

            if len(positions) > 0:
                # Position drift from origin
                metrics["position_drift"] = np.std(positions, axis=0).mean()

                # Velocity stability
                vel_mag = np.linalg.norm(velocities, axis=1)
                metrics["max_velocity"] = np.max(vel_mag)
                metrics["velocity_std"] = np.std(vel_mag)

                # Acceleration
                if len(velocities) > 1:
                    accelerations = np.gradient(velocities, axis=0)
                    acc_mag = np.linalg.norm(accelerations, axis=1)
                    metrics["max_acceleration"] = np.max(acc_mag)

                # Overall stability score (inverse of variability)
                metrics["stability_score"] = max(0, 1.0 - metrics.get("position_drift", 1.0))

        return metrics

    def cleanup(self):
        """Clean up Genesis resources."""
        if self.scene is not None:
            self.scene = None
