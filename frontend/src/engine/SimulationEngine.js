/**
 * Deterministic Simulation Engine
 * 
 * Responsible for orchestrating complex mission scenarios for testing and validation.
 * Enforces deterministic behavior to ensure reproducible test runs for certification.
 */

class SimulationEngine {
    constructor() {
        this.activeScenario = null;
        this.subscribers = [];
        this._interval = null;
    }

    /**
     * Load a pre-validated scenario for execution.
     * @param {string} scenarioId - The ID of the scenario to load (e.g., 'ALPINE_RESCUE')
     */
    async loadScenario(scenarioId) {
        console.log(`[SimulationEngine] Loading scenario: ${scenarioId}`);
        this.activeScenario = scenarioId;
        return new Promise(resolve => setTimeout(resolve, 200)); // Simulate resource allocation
    }

    /**
     * Execute the loaded scenario.
     * @param {Object} context - The window object or context where the simulation is running
     * @param {Function} onEvent - Callback for events (e.g., 'FAILURE_DETECTED')
     */
    execute(context, onEvent) {
        if (!this.activeScenario) {
            console.error("[SimulationEngine] No scenario loaded.");
            return;
        }

        console.log(`[SimulationEngine] Executing deterministic sequence for: ${this.activeScenario}`);

        switch (this.activeScenario) {
            case 'ALPINE_RESCUE':
                this._runAlpineRescue(context, onEvent);
                break;
            default:
                console.warn(`[SimulationEngine] Unknown scenario: ${this.activeScenario}`);
        }
    }

    /**
     * Scenario: Alpine Rescue (Rotor Stall Simulation)
     * Sequence:
     * T+0: Init standard config
     * T+0.5: Wireframe env
     * T+2.5: Environment locked (Complete)
     * T+6.0: Inject Fault (Stressed)
     * T+7.5: Trigger Supervisor Intervention
     */
    _runAlpineRescue(context, onEvent) {
        // 1. Reset State
        this._updateContext(context, { config: 'standard', stressed: false, envStage: 'grid' });

        // 2. Timeline Events
        const timeline = [
            { time: 500, action: () => this._updateContext(context, { envStage: 'wireframe' }) },
            { time: 2500, action: () => this._updateContext(context, { envStage: 'complete' }) },
            {
                time: 6000, action: () => {
                    this._updateContext(context, { stressed: true });
                    console.warn("[SimulationEngine] Fault Injection: Rotors at critical stress.");
                }
            },
            { time: 7500, action: () => onEvent('SUPERVISOR_INTERVENTION') }
        ];

        // Execute Timeline
        timeline.forEach(event => {
            setTimeout(event.action, event.time);
        });
    }

    _updateContext(context, updates) {
        if (!context || !context.aeroForge) return;

        if (updates.config) context.aeroForge.setConfig(updates.config);
        if (updates.stressed !== undefined) context.aeroForge.setStressed(updates.stressed);
        if (updates.envStage) context.aeroForge.setEnvStage(updates.envStage);
    }
}

export default new SimulationEngine();
