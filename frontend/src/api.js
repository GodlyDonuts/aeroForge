/**
 * API Client for aeroForge-G3 Backend
 */

const API_BASE_URL = ''; // Use relative path to leverage Vite proxy

/**
 * Submit a new mission
 */
export async function submitMission(request) {
  const response = await fetch(`${API_BASE_URL}/api/mission`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit mission: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get mission status
 */
export async function getMissionStatus(missionId) {
  const response = await fetch(`${API_BASE_URL}/api/status/${missionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get mission results
 */
export async function getMissionResults(missionId) {
  const response = await fetch(`${API_BASE_URL}/api/results/${missionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get results: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get simulation metrics
 */
export async function getMissionMetrics(missionId) {
  const response = await fetch(`${API_BASE_URL}/api/metrics/${missionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get metrics: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get generated code
 */
export async function getMissionCode(missionId) {
  const response = await fetch(`${API_BASE_URL}/api/code/${missionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get code: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get file URL
 */
export function getFileUrl(filePath) {
  return `${API_BASE_URL}/api/files/${filePath}`;
}

/**
 * Poll mission status at interval
 */
export async function pollMissionStatus(
  missionId,
  onUpdate,
  intervalMs = 1000,
  maxPolls = 300
) {
  let polls = 0;

  const poll = async () => {
    if (polls >= maxPolls) return;

    try {
      const status = await getMissionStatus(missionId);
      onUpdate(status);

      if (status.status === 'complete' || status.status === 'failed') {
        return;
      }

      polls++;
      setTimeout(poll, intervalMs);
    } catch (error) {
      console.error('Poll error:', error);
      polls++;
      setTimeout(poll, intervalMs);
    }
  };

  poll();
}
