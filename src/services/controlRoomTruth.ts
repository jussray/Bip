import {
  getLocalControlRoomAgentHealth,
  type LocalAgentHealth,
} from '@/services/controlRoomLocalAgent';

export type ControlRoomTruthState = 'aligned' | 'drifted' | 'partial';
export type ControlRoomObserverState = 'observed' | 'unknown';

export type ControlRoomTruthSnapshot = {
  schemaVersion: 1;
  observedAt: string;
  state: ControlRoomTruthState;
  continuityFingerprint: string;
  source: {
    state: ControlRoomObserverState;
    mainSha: string | null;
  };
  pages: {
    state: ControlRoomObserverState;
    releaseSha: string | null;
  };
  worker: {
    state: ControlRoomObserverState;
    releaseSha: string | null;
    ok: boolean | null;
  };
  localAgent: {
    state: 'online' | 'offline';
    activeMission: string | null;
    latestMissionId: string | null;
    latestMissionStatus: string | null;
  };
  authority: {
    executionAuthorized: false;
    mergeAuthorized: false;
    deploymentAuthorized: false;
    reason: string;
  };
  nextGate: string;
};

const GITHUB_MAIN_URL = 'https://api.github.com/repos/jussray/Sekret-Bip/commits/main';
const FRONTEND_RELEASE_URL = process.env.EXPO_PUBLIC_CONTROL_ROOM_RELEASE_URL || 'https://sekretbip.net/release.json';
const WORKER_HEALTH_URL = process.env.EXPO_PUBLIC_CONTROL_ROOM_WORKER_HEALTH_URL || 'https://api.sekretbip.net/health';

function normalizeSha(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{7,40}$/.test(normalized) ? normalized : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function fetchJson(url: string, timeoutMs = 7_000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`truth_observer_http_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export function fingerprintTruthSnapshot(input: {
  mainSha: string | null;
  pagesSha: string | null;
  workerSha: string | null;
  workerOk: boolean | null;
}): string {
  const canonical = [
    'bip-control-room-truth-v1',
    input.mainSha ?? 'unknown',
    input.pagesSha ?? 'unknown',
    input.workerSha ?? 'unknown',
    input.workerOk === null ? 'unknown' : input.workerOk ? 'ok' : 'not-ok',
  ].join('|');

  // FNV-1a is sufficient here because this fingerprint is only a continuity
  // receipt. It is never authentication, authorization, tracking, or identity.
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `bip-cr-v1:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function localAgentView(value: LocalAgentHealth | null): ControlRoomTruthSnapshot['localAgent'] {
  if (!value) {
    return {
      state: 'offline',
      activeMission: null,
      latestMissionId: null,
      latestMissionStatus: null,
    };
  }
  return {
    state: 'online',
    activeMission: value.activeMission,
    latestMissionId: value.latestRun?.missionId ?? null,
    latestMissionStatus: value.latestRun?.status ?? null,
  };
}

export async function loadControlRoomTruth(): Promise<ControlRoomTruthSnapshot> {
  const [mainResult, pagesResult, workerResult, localAgentResult] = await Promise.allSettled([
    fetchJson(GITHUB_MAIN_URL),
    fetchJson(FRONTEND_RELEASE_URL),
    fetchJson(WORKER_HEALTH_URL),
    getLocalControlRoomAgentHealth(),
  ]);

  const mainBody = mainResult.status === 'fulfilled' ? record(mainResult.value) : null;
  const pagesBody = pagesResult.status === 'fulfilled' ? record(pagesResult.value) : null;
  const workerBody = workerResult.status === 'fulfilled' ? record(workerResult.value) : null;
  const localAgent = localAgentResult.status === 'fulfilled' ? localAgentResult.value : null;

  const mainSha = normalizeSha(mainBody?.sha);
  const pagesSha = normalizeSha(pagesBody?.commitSha);
  const workerSha = normalizeSha(workerBody?.releaseSha);
  const workerOk = typeof workerBody?.ok === 'boolean' ? workerBody.ok : null;
  const allObserved = Boolean(mainSha && pagesSha && workerSha && workerOk !== null);
  const aligned = Boolean(allObserved && workerOk && mainSha === pagesSha && mainSha === workerSha);
  const state: ControlRoomTruthState = !allObserved ? 'partial' : aligned ? 'aligned' : 'drifted';

  const continuityFingerprint = fingerprintTruthSnapshot({
    mainSha,
    pagesSha,
    workerSha,
    workerOk,
  });

  const nextGate = state === 'aligned'
    ? 'Runtime identity aligns with current main. Run exact-head GitHub checks and Playwright before any merge or deployment decision.'
    : state === 'drifted'
      ? 'Stop promotion. Reconcile GitHub main, Pages release identity, and Worker runtime to one exact SHA.'
      : 'Restore the missing observer(s), then read truth again. Partial evidence is not success.';

  return {
    schemaVersion: 1,
    observedAt: new Date().toISOString(),
    state,
    continuityFingerprint,
    source: {
      state: mainSha ? 'observed' : 'unknown',
      mainSha,
    },
    pages: {
      state: pagesSha ? 'observed' : 'unknown',
      releaseSha: pagesSha,
    },
    worker: {
      state: workerSha && workerOk !== null ? 'observed' : 'unknown',
      releaseSha: workerSha,
      ok: workerOk,
    },
    localAgent: localAgentView(localAgent),
    authority: {
      executionAuthorized: false,
      mergeAuthorized: false,
      deploymentAuthorized: false,
      reason: 'Observation and continuity fingerprints are evidence only. Human-only gates remain separate authority.',
    },
    nextGate,
  };
}
