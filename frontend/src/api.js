/**
 * API Client for aeroForge-G3 Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface MissionRequest {
  prompt: string;
  max_iterations?: number;
}

export interface MissionResponse {
  mission_id: string;
  status: string;
  message: string;
}

export interface StatusResponse {
  mission_id: string;
  status: string;
  iteration: number;
  current_agent: string;
  logs: string[];
  errors: string[];
  simulation_metrics: Record<string, any>;
}

export interface ResultsResponse {
  mission_id: string;
  status: string;
  files: string[];
  metrics: Record<string, any>;
}

/**
 * Submit a new mission
 */
export async function submitMission(request: MissionRequest): Promise<MissionResponse> {
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
export async function getMissionStatus(missionId: string): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/status/${missionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get mission results
 */
export async function getMissionResults(missionId: string): Promise<ResultsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/results/${missionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get results: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get simulation metrics
 */
export async function getMissionMetrics(missionId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/metrics/${missionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get metrics: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get generated code
 */
export async function getMissionCode(missionId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/code/${missionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get code: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get file URL
 */
export function getFileUrl(filePath: string): string {
  return `${API_BASE_URL}/api/files/${filePath}`;
}

/**
 * Poll mission status at interval
 */
export async function pollMissionStatus(
  missionId: string,
  onUpdate: (status: StatusResponse) => void,
  intervalMs: number = 1000,
  maxPolls: number = 300
): Promise<void> {
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
