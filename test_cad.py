from build123d import *
import sys

print("Testing build123d Rot syntax...")

try:
    # Test 1: Simple tuple (common usage)
    r1 = Rot(0, 0, 45)
    print("✓ Rot(0, 0, 45) works")
except Exception as e:
    print(f"✗ Rot(0, 0, 45) failed: {e}")

try:
    # Test 2: Prompt syntax
    r2 = Rot(axis=Axis.Z, angle=45)
    print("✓ Rot(axis=Axis.Z, angle=45) works")
except Exception as e:
    print(f"✗ Rot(axis=Axis.Z, angle=45) failed: {e}")

try:
    # Test 3: Rotation class if it exists
    r3 = Rotation(0, 0, 45)
    print("✓ Rotation(0, 0, 45) works")
except Exception as e:
    print(f"✗ Rotation(0, 0, 45) failed: {e}")
