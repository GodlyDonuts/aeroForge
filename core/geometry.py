#!/usr/bin/env python3
"""
Core Geometry Module
Handles CAD export and URDF generation for build123d models
"""

import os
import xml.etree.ElementTree as ET
from typing import List, Dict, Tuple
from pathlib import Path
import numpy as np


class SceneBuilder:
    """
    Bridge between build123d CAD models and simulation URDF files.
    Handles mesh export and URDF generation.
    """

    def __init__(self, output_dir: str = "output"):
        """
        Initialize SceneBuilder.

        Args:
            output_dir: Base output directory for generated files
        """
        self.output_dir = Path(output_dir)
        self.mesh_dir = self.output_dir / "meshes"
        self.urdf_dir = self.output_dir / "urdf"

        # Ensure directories exist
        self.mesh_dir.mkdir(parents=True, exist_ok=True)
        self.urdf_dir.mkdir(parents=True, exist_ok=True)

    def export_assembly(self, part, name: str = "assembly") -> List[str]:
        """
        Recursively export build123d Compound to STL files.

        Args:
            part: build123d Compound or Part object
            name: Base name for exported files

        Returns:
            List of exported STL file paths
        """
        exported_files = []

        try:
            import build123d as bd
        except ImportError:
            raise ImportError(
                "build123d is required. Install with: pip install build123d"
            )

        try:
            # Check if part is a Compound or single Part
            if hasattr(part, 'children') and part.children:
                # It's an assembly - export each child
                for i, child in enumerate(part.children):
                    child_name = f"{name}_{i:02d}"
                    stl_path = self._export_single_mesh(child, child_name)
                    if stl_path:
                        exported_files.append(stl_path)
            else:
                # Single part
                stl_path = self._export_single_mesh(part, name)
                if stl_path:
                    exported_files.append(stl_path)

        except Exception as e:
            print(f"Error exporting assembly: {e}")
            raise

        return exported_files

    def _export_single_mesh(self, part, name: str) -> str:
        """
        Export a single build123d part to STL format.

        Args:
            part: build123d Part or Solid object
            name: Name for the mesh file

        Returns:
            Path to exported STL file
        """
        import build123d as bd

        try:
            # Convert to mesh if needed
            if not isinstance(part, (bd.Part, bd.Solid)):
                try:
                    # Attempt to wrap or convert
                    part = bd.Part(part)
                except:
                    print(f"Warning: Could not convert {name} to Part")
                    return ""

            # Export to STL
            stl_path = self.mesh_dir / f"{name}.stl"

            # Use build123d's export functionality
            bd.export_stl(part, str(stl_path))

            print(f"Exported mesh: {stl_path}")
            return str(stl_path)

        except Exception as e:
            print(f"Error exporting {name}: {e}")
            return ""

    def generate_urdf(
        self,
        links: List[Dict[str, str]],
        joints: List[Dict],
        robot_name: str = "aeroforge_robot"
    ) -> str:
        """
        Generate a valid URDF XML string from links and joints.

        Args:
            links: List of link dictionaries with 'name', 'mesh', 'mass', 'density'
            joints: List of joint dictionaries with 'name', 'parent', 'child', 'type',
                    and optionally 'origin', 'axis', 'limits'
            robot_name: Name for the robot

        Returns:
            URDF XML string
        """
        # Create root element
        robot = ET.Element("robot", name=robot_name)
        robot.set("xmlns:xacro", "http://www.ros.org/wiki/xacro")

        # Add links
        for link_data in links:
            link_elem = ET.SubElement(robot, "link", name=link_data["name"])

            # Inertial properties (mass and inertia)
            inertial = ET.SubElement(link_elem, "inertial")
            mass = ET.SubElement(inertial, "mass", value=str(link_data.get("mass", "1.0")))

            # Calculate approximate inertia tensor from mass
            # For a box: Ixx = m/12 * (y^2 + z^2)
            m = float(link_data.get("mass", "1.0"))
            inertia_val = m / 12.0 * 0.01  # Simplified for small objects
            inertia = ET.SubElement(
                inertial, "inertia",
                ixx=str(inertia_val), ixy="0", ixz="0",
                iyy=str(inertia_val), iyz="0",
                izz=str(inertia_val)
            )

            # Visual (for rendering)
            visual = ET.SubElement(link_elem, "visual")
            origin = ET.SubElement(visual, "origin", xyz="0 0 0", rpy="0 0 0")
            geometry = ET.SubElement(visual, "geometry")
            mesh = ET.SubElement(geometry, "mesh", filename=link_data["mesh"])

            # Collision (for physics)
            collision = ET.SubElement(link_elem, "collision")
            origin = ET.SubElement(collision, "origin", xyz="0 0 0", rpy="0 0 0")
            geometry = ET.SubElement(collision, "geometry")
            mesh = ET.SubElement(geometry, "mesh", filename=link_data["mesh"])

        # Add joints
        for joint_data in joints:
            joint = ET.SubElement(
                robot, "joint",
                name=joint_data["name"],
                type=joint_data.get("type", "fixed")
            )

            # Parent and child links
            ET.SubElement(joint, "parent", link=joint_data["parent"])
            ET.SubElement(joint, "child", link=joint_data["child"])

            # Origin (pose)
            origin_data = joint_data.get("origin", {"xyz": "0 0 0", "rpy": "0 0 0"})
            ET.SubElement(
                joint, "origin",
                xyz=origin_data.get("xyz", "0 0 0"),
                rpy=origin_data.get("rpy", "0 0 0")
            )

            # Axis (for revolute/prismatic joints)
            if "axis" in joint_data:
                ET.SubElement(joint, "axis", xyz=joint_data["axis"])

            # Limits (for non-fixed joints)
            if "limits" in joint_data:
                limits_data = joint_data["limits"]
                ET.SubElement(
                    joint, "limits",
                    lower=str(limits_data.get("lower", "0")),
                    upper=str(limits_data.get("upper", "0")),
                    effort=str(limits_data.get("effort", "100")),
                    velocity=str(limits_data.get("velocity", "1"))
                )

        # Add gravity settings
        ET.SubElement(robot, "gravity", x="0", y="0", z="-9.81")

        # Format and return XML
        xml_str = ET.tostring(robot, encoding="unicode")
        # Pretty print
        from xml.dom import minidom
        dom = minidom.parseString(xml_str)
        return dom.toprettyxml(indent="  ")

    def save_urdf(self, urdf_content: str, filename: str) -> str:
        """
        Save URDF content to file.

        Args:
            urdf_content: URDF XML string
            filename: Name for the URDF file

        Returns:
            Path to saved URDF file
        """
        urdf_path = self.urdf_dir / filename
        with open(urdf_path, "w") as f:
            f.write(urdf_content)
        print(f"Saved URDF: {urdf_path}")
        return str(urdf_path)

    def estimate_mass_from_volume(self, volume: float, density: float = 2700.0) -> float:
        """
        Estimate mass from volume and material density.

        Args:
            volume: Volume in cubic meters
            density: Density in kg/m^3 (default: aluminum ~2700)

        Returns:
            Estimated mass in kg
        """
        return volume * density
