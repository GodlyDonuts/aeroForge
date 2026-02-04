#!/usr/bin/env python3
"""
Example build123d script for testing
"""

from build123d import *

with Builder() as builder:
    # Create a simple drone frame
    base_plate = Box(100, 100, 5)

    # Add motor mounts
    motor_mounts = []
    for x in [-40, 40]:
        for y in [-40, 40]:
            mount = Cylinder(8, 10)
            mount = mount.located(Pos(x, y, 5))
            motor_mounts.append(mount)

    # Combine everything
    for mount in motor_mounts:
        base_plate = base_plate + mount

    part = base_plate

print("✓ Test part created successfully")
