/**
 * Simple Demo Orchestrator - Error-free version
 * Uses a simpler approach without complex event systems
 */

export const simpleDemoOrchestrator = {
  isRunning: false,
  callbacks: {},
  timers: [],
  droneVersion: 1, // Track current drone version

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  },

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  },

  clearTimers() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  },

  stop() {
    this.isRunning = false;
    this.clearTimers();
  },

  isDemoPrompt(prompt) {
    const keywords = ["medical delivery drone", "Himalayan", "3kg payload", "crosswinds"];
    return keywords.some(kw => prompt.toLowerCase().includes(kw.toLowerCase()));
  },

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("🎬 Simple Demo Orchestrator: Starting (Gemini 3 Pro Pacing)");

    let t = 0;

    // --- PHASE 1: INITIAL LOAD (Delayed) ---
    this.schedule(t, () => {
      this.emit('loading', { active: true, message: 'GENERATING GEOMETRY...' });
    });

    t += 11250; // 11.25s (2.25x original)

    // Stage 1: Initial terrain loading (wireframe)
    this.schedule(t, () => {
      this.emit('loading', { active: false });
      this.emit('log', { source: 'SYSTEM', message: '📋 Mission initialized: Himalayan Medical Delivery Drone', type: 'info' });
      this.emit('log', { source: 'SYSTEM', message: '🏔️ Loading Himalayan terrain environment...', type: 'info' });
      this.emit('terrain-update', { progress: 0.2, wireframe: true, detailLevel: 1 });
      this.emit('status', { status: 'running', iteration: 0, agent: 'none' });
    });

    t += 675;
    this.schedule(t, () => {
      this.emit('log', { source: 'SYSTEM', message: '  Environment: High-altitude mountain range', type: 'info' });
      this.emit('terrain-update', { progress: 0.3, wireframe: true, detailLevel: 1 });
    });

    t += 675;
    this.schedule(t, () => {
      this.emit('log', { source: 'SYSTEM', message: '  Altitude: 5000m | Temp: -30°C | Wind: 50km/h', type: 'info' });
      this.emit('terrain-update', { progress: 0.4, wireframe: true, detailLevel: 1 });
    });

    // Stage 1.5: Terrain refinement with glitches
    t += 675;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '🌍 Calibrating terrain mesh...', type: 'working' });
      this.emit('terrain-update', { progress: 0.5, wireframe: true, detailLevel: 1, flicker: true });
    });

    t += 450;
    this.schedule(t, () => {
      this.emit('terrain-update', { progress: 0.6, wireframe: true, detailLevel: 2 });
    });

    t += 450;
    this.schedule(t, () => {
      this.emit('terrain-update', { progress: 0.7, wireframe: true, detailLevel: 2, flicker: true });
    });

    t += 450;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✓ Terrain mesh generated (847,392 vertices)', type: 'success' });
      this.emit('terrain-update', { progress: 0.8, wireframe: false, detailLevel: 2 });
    });

    t += 450;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✓ Applying atmospheric physics model', type: 'success' });
      this.emit('terrain-update', { progress: 0.9, wireframe: false, detailLevel: 2, flicker: true });
    });

    t += 450;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✓ Environment ready: physics-enabled terrain', type: 'success' });
      this.emit('terrain-update', { progress: 1.0, wireframe: false, detailLevel: 2 });
    });

    // Stage 2: Designer starts
    t += 1125;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '🔨 Analyzing mission requirements...', type: 'working' });
    });

    t += 2250; // longer thinking
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '📊 Computing thrust-to-weight ratio at 5000m altitude', type: 'working' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '✓ Generating component-based assembly', type: 'success' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '  Fuselage: 140mm × 100mm × 45mm (carbon-fiber)', type: 'info' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '  Arms: X-configuration, 200mm span, 10mm thick', type: 'info' });
      this.emit('design-update', { iteration: 1, armThickness: 10, armLength: 200, mountRadius: 25 });
      this.emit('status', { status: 'designing', iteration: 1, agent: 'designer' });
    });

    // Stage 3: Simulator finds FLAWS (DRAMA!)
    t += 3375;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '🧪 Executing Genesis physics simulation...', type: 'working' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '  Testing crosswind stability at 50km/h...', type: 'working' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '⚠️ FLAW DETECTED: Center-of-mass is 12mm above optimal', type: 'warning' });
      this.emit('terrain-update', { progress: 1.0, wireframe: false, detailLevel: 2, flicker: true }); // Visual feedback
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '⚠️ FLAW DETECTED: Arm deflection under 50km/h crosswind exceeds threshold', type: 'warning' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '📊 Stability Score: 0.72 | Max Acceleration: 18.5 m/s² | Drift: 0.8m', type: 'error' });
    });

    t += 1125;
    this.schedule(t, () => {
      this.emit('terrain-update', { progress: 1.0, wireframe: false, detailLevel: 2 }); // Clear flicker
    });

    // Stage 4: PHYSICS TEST FAILURE - Critical
    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '⚠️ RUNNING PHYSICS TEST...', type: 'working' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '  Testing aerodynamics at 5000m altitude (0.6 atm)...', type: 'working' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '💥 CRITICAL FAILURE: Rotor lift insufficient at high altitude', type: 'error' });
    });

    t += 2250;
    this.schedule(t, () => {
      this.emit('status', { status: 'analyzing', iteration: 1, agent: 'supervisor' });
      this.emit('show-negotiation-modal', {
        reason: 'physics_test_failure',
        details: 'Current quadcopter geometry produces insufficient lift at 5000m altitude. Deployment will result in catastrophic stall.'
      });
    });

  },

  schedule(delay, fn) {
    const timer = setTimeout(() => {
      if (this.isRunning) fn();
    }, delay);
    this.timers.push(timer);
  },

  continueAfterFix() {
    console.log("🎬 Simple Demo: Phase 2 (After Fix) - Gemini 3 Pro Pacing");
    let t = 0; // Reset time for Phase 2

    // Stage 4: Supervisor intervention (Resumed)
    t += 450; // Gap for modal appearance

    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '👥 DEEP THINK ANALYSIS (Iter 1):', type: 'working' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '  ⚠️ Center-of-mass too high → instability on steep slopes (15-30°)', type: 'warning' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '  ⚠️ Arm deflection 23% over safety threshold', type: 'warning' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '  ✓ Verifying fix: Arm thickness +30%, CoM reduction 8mm', type: 'info' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '3. 🔄 ITERATING: Apply structural reinforcements', type: 'info' });
      this.emit('status', { status: 'iterating', iteration: 1, agent: 'supervisor' });
    });

    // --- PHASE 2: REDESIGN / V2 (DELAYED) ---
    t += 2250;
    this.schedule(t, () => {
      this.emit('loading', { active: true, message: 'OPTIMIZING GEOMETRY...' });
    });

    t += 11250; // 11.25s Artificial Delay

    // Stage 5: After modal acceptance - switch to V2
    this.schedule(t, () => {
      this.emit('loading', { active: false });
      this.droneVersion = 2; // FIX: Update internal state
      this.emit('drone-version-change', { version: 2 });
      this.emit('log', { source: 'DESIGNER', message: '🔨 REDESIGN: Upgrading to extended-range hexacopter...', type: 'working' });
      this.emit('design-update', { iteration: 1.5, armThickness: 12, armLength: 380, mountRadius: 25, flicker: true });
      this.emit('terrain-update', { progress: 0.6, detailLevel: 3, flicker: true });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '✓ Extended arm length: 200mm → 380mm', type: 'success' });
    });

    t += 1125;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '✓ Hexacopter configuration for improved lift', type: 'success' });
      this.emit('status', { status: 'designing', iteration: 1.5, agent: 'designer' });
    });

    t += 1125;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '🧪 Re-running physics test with V2 geometry...', type: 'working' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✓ Physics test PASSED: Lift sufficient at 5000m', type: 'success' });
    });

    // Stage 6: Iteration 2 simulation
    t += 2250;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '🧪 Running Genesis simulation (Iter 2)...', type: 'working' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '  Crosswind test: 50km/h - Simulating turbulence', type: 'working' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✓ Crosswind test PASSED: Deflection within limits', type: 'success' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✓ Stability Score: 0.86 | Max Acceleration: 16.2 m/s² | Drift: 0.3m', type: 'success' });
    });

    // Stage 7: Minor optimization needed
    t += 3375;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '👥 DEEP THINK ANALYSIS (Iter 2):', type: 'working' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '  ✓ Crosswind stability: ACCEPTABLE', type: 'success' });
    });

    t += 1125;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '  ⚠️ Motor mount margin: 15% below optimal for -30°C', type: 'warning' });
    });

    t += 1125;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '3. 🔄 ITERATING: Reinforce motor mounts for sub-zero durability', type: 'info' });
    });

    // Stage 8: Iteration 3 - Motor mount fix
    t += 2250;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '🔨 Fine-tuning motor mount geometry...', type: 'working' });
      this.emit('design-update', { iteration: 2.5, armThickness: 13, armLength: 380, mountRadius: 27, flicker: true });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '✓ Motor mount radius: 25mm → 27mm (carbon-fiber reinforced)', type: 'success' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '✓ Optimizing taper for drag reduction at 5000m', type: 'success' });
      this.emit('design-update', { iteration: 3, armThickness: 13, armLength: 380, mountRadius: 27 });
      this.emit('status', { status: 'designing', iteration: 3, agent: 'designer' });
    });

    // Stage 9: Iteration 3 simulation
    t += 3375;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '🧪 Running Genesis simulation (Iter 3)...', type: 'working' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '  Testing: 0-60km/h wind range, 25° slope landings', type: 'working' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✓ All crosswind tests PASSED', type: 'success' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✓ Steep-slope landing: 25° incline - Stable', type: 'success' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✓ Stability Score: 0.94 | Max Acceleration: 15.4 m/s² | Drift: 0.1m', type: 'success' });
    });

    // Stage 10: Final optimization
    t += 3375;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '👥 DEEP THINK ANALYSIS (Iter 3):', type: 'success' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '  ✓ All metrics EXCEED requirements', type: 'success' });
    });

    t += 1125;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '  ✓ Safety factor: 1.9 (military grade)', type: 'success' });
    });

    t += 1125;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '3. 🔄 FINAL OPTIMIZATION PASS for 98%+ stability', type: 'info' });
    });

    // Stage 11: Final refinement
    t += 2250;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '🔨 Final design refinement...', type: 'working' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('design-update', { iteration: 4, armThickness: 13, armLength: 380, mountRadius: 27 });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '🧪 Final validation simulation...', type: 'working' });
    });

    t += 2250;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✅ ALL TESTS PASSED', type: 'success' });
      this.emit('log', { source: 'SIMULATOR', message: '📊 FINAL METRICS:', type: 'success' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '   • Stability Score: 0.98 (98%)', type: 'success' });
    });

    t += 900;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '   • Energy Efficiency: 0.78 (78%)', type: 'success' });
    });

    t += 900;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '   • Safety Factor: 1.9', type: 'success' });
    });

    t += 900;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '   • Position Drift: <0.1m', type: 'success' });
    });

    // Stage 12: Completion
    t += 2250;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '👥 DEEP THINK ANALYSIS (Iter 4):', type: 'success' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '1. ✓✓✓ DESIGN APPROVED FOR MANUFACTURING', type: 'success' });
    });

    t += 1125;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '2. ✓ Exporting STL files for 3D printing', type: 'success' });
    });

    t += 1125;
    this.schedule(t, () => {
      this.emit('log', { source: 'SUPERVISOR', message: '3. ✓ Exporting URDF for flight simulation', type: 'success' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('complete', {
        iteration: 4,
        metrics: {
          stability_score: 0.98,
          energy_efficiency: 0.78,
          safety_factor: 1.9,
          position_drift: 0.1
        },
        files: [
          { name: 'design.stl', size: '50KB', type: 'STL' },
          { name: 'design.urdf', size: '2KB', type: 'URDF' }
        ]
      });
      this.emit('status', { status: 'complete', iteration: 4, agent: 'supervisor' });
    });
  },

  // Method to upgrade to V3
  upgradeToV3() {
    if (this.droneVersion === 3) return; // Already at V3

    this.droneVersion = 3;
    let t = 0;

    // DELAY START
    this.emit('loading', { active: true, message: 'UPGRADING TO V3...' });
    t += 11250; // 11.25s Artificial Delay

    this.schedule(t, () => {
      this.emit('loading', { active: false });
      this.emit('log', { source: 'DESIGNER', message: '🔨 Upgrading to advanced hexacopter configuration...', type: 'working' });
      this.emit('drone-version-change', { version: 3 });
      this.emit('design-update', { iteration: 2.5, flicker: true });
    });

    t += 2250;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '✓ Toroidal propellers deployed', type: 'success' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '✓ Adaptive spider legs installed', type: 'success' });
    });

    t += 1800;
    this.schedule(t, () => {
      this.emit('log', { source: 'DESIGNER', message: '✓ Winch delivery system integrated', type: 'success' });
    });

    // Final Validation for V3
    t += 2250;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '✅ ALL TESTS PASSED', type: 'success' });
      this.emit('log', { source: 'SIMULATOR', message: '📊 FINAL METRICS (V3):', type: 'success' });
    });

    t += 1350;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '   • Stability Score: 0.99 (99%)', type: 'success' });
    });

    t += 900;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '   • Energy Efficiency: 0.85 (85%)', type: 'success' });
    });

    t += 900;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '   • Safety Factor: 2.1', type: 'success' });
    });

    t += 900;
    this.schedule(t, () => {
      this.emit('log', { source: 'SIMULATOR', message: '   • Position Drift: <0.05m', type: 'success' });
    });

    // Completion
    t += 1800;
    this.schedule(t, () => {
      this.emit('complete', {
        iteration: 5,
        metrics: {
          stability_score: 0.99,
          energy_efficiency: 0.85,
          safety_factor: 2.1,
          position_drift: 0.05
        },
        files: [
          { name: 'design_v3.stl', size: '55KB', type: 'STL' },
          { name: 'design_v3.urdf', size: '2KB', type: 'URDF' }
        ]
      });
      this.emit('status', { status: 'complete', iteration: 5, agent: 'supervisor' });
    });
  }
};
