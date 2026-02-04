#!/usr/bin/env python3
"""
Isolated Simulation Runner
Executes Genesis simulation in a separate process to avoid threading issues.
"""

import sys
import json
import argparse
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from core.physics import SimRunner

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--urdf", required=True, help="Path to URDF file")
    parser.add_argument("--output", required=True, help="Path to output JSON file")
    parser.add_argument("--steps", type=int, default=500, help="Simulation steps")
    parser.add_argument("--backend", default="cpu", help="Physics backend")
    args = parser.parse_args()

    print(f"Starting isolated simulation: {args.urdf}")
    
    try:
        # Initialize runner
        runner = SimRunner(backend=args.backend)
        
        # Load environment
        if not runner.load_environment(args.urdf, terrain="plane"):
            print("Failed to load environment")
            sys.exit(1)
            
        # Run simulation
        telemetry = runner.run_episode(steps=args.steps)
        
        # Analyze stability
        metrics = runner.analyze_stability(telemetry)
        
        # Combine results
        results = {
            "telemetry": telemetry,
            "metrics": metrics,
            "status": "success"
        }
        
        # Save to file
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)
            
        print(f"Simulation saved to {args.output}")
        sys.exit(0)
        
    except Exception as e:
        print(f"Simulation failed: {e}")
        # Save error to file
        with open(args.output, "w") as f:
            json.dump({"status": "error", "error": str(e)}, f)
        sys.exit(1)

if __name__ == "__main__":
    main()
