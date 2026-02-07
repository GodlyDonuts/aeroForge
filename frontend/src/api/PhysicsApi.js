/**
 * Physics Engine API Interface
 * 
 * Interface for communicating with the Genesis Physics Engine (Backend).
 * Mocks network latency and validation logic for frontend development.
 */

export const updateEnvironment = async (params) => {
    // Simulate network latency (500-1200ms)
    const latency = 600 + Math.random() * 600;

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Echo back the params with status
            // Logic moved from component to "Server" (Mock)
            const response = processInternalPhysics(params);
            resolve(response);
        }, latency);
    });
};

/**
 * Internal Mock Logic (Simulates Backend Processing)
 */
function processInternalPhysics(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('storm')) {
        return {
            status: 'success',
            state: 'SEVERE_STORM',
            telemetry: [
                { text: 'weather_state: SEVERE_STORM', type: 'warning' },
                { text: 'wind_velocity: 120km/h', type: 'warning' },
                { text: 'visibility: 5%', type: 'error' }
            ]
        };
    }

    if (lowerPrompt.includes('clear') || lowerPrompt.includes('calm')) {
        return {
            status: 'success',
            state: 'CLEAR',
            telemetry: [
                { text: 'weather_state: CLEAR', type: 'success' },
                { text: 'wind_velocity: 5km/h', type: 'info' },
                { text: 'visibility: 100%', type: 'info' }
            ]
        };
    }

    // Default / Generic
    return {
        status: 'success',
        state: 'CUSTOM',
        telemetry: [
            { text: 'custom_parameters_applied', type: 'success' },
            { text: 'physics_mesh: updated', type: 'info' }
        ]
    };
}
