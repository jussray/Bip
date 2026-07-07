import { CONTROL_ROOM_OPERATIONS } from '@/config/controlRoomOperations';

export type AgentMissionStatus = 'idle' | 'starting' | 'running' | 'stopped' | 'failed' | 'unreachable';

export type AgentSnapshot = {
  ok: boolean;
  agent: {
    name: string;
    version: string;
    host: string;
    port: number;
  };
  launchBip: {
    status: AgentMissionStatus;
    pid: number | null;
    startedAt: string | null;
    stoppedAt: string | null;
    exitCode: number | null;
    logs: string[];
  };
};

function headers(): Record<string, string> {
  const result: Record<string, string> = { 'content-type': 'application/json' };
  if (CONTROL_ROOM_OPERATIONS.agentToken) {
    result.authorization = `Bearer ${CONTROL_ROOM_OPERATIONS.agentToken}`;
  }
  return result;
}

async function request(pathname: string, init?: RequestInit): Promise<AgentSnapshot> {
  const base = CONTROL_ROOM_OPERATIONS.defaultAgentUrl.replace(/\/$/, '');
  const response = await fetch(`${base}${pathname}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers || {}) },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Control Room agent returned ${response.status}`);
  }

  return response.json() as Promise<AgentSnapshot>;
}

export async function getControlRoomAgentSnapshot(): Promise<AgentSnapshot> {
  try {
    return await request('/health');
  } catch {
    return {
      ok: false,
      agent: { name: 'control-room-agent', version: 'unknown', host: '', port: 0 },
      launchBip: {
        status: 'unreachable',
        pid: null,
        startedAt: null,
        stoppedAt: null,
        exitCode: null,
        logs: [],
      },
    };
  }
}

export function launchBip(): Promise<AgentSnapshot> {
  return request('/missions/launch-bip', { method: 'POST', body: '{}' });
}

export function stopBip(): Promise<AgentSnapshot> {
  return request('/missions/launch-bip/stop', { method: 'POST', body: '{}' });
}
