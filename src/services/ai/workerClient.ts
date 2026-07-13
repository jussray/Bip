/**
 * Founder-facing client for the canonical Se'kret backend Worker.
 * The route and authorization contracts mirror src/utils/api.ts.
 */

import { backendAuthHeaders } from '@/utils/backendAuth';
import { BACKEND_URL } from '@/utils/env';

export type CharacterId =
  | 'raylene'
  | 'rylane'
  | 'cloud'
  | 'night'
  | 'sekret'
  | 'parentCoach';

export type Surface =
  | 'journal'
  | 'voiceBip'
  | 'comfort'
  | 'circle'
  | 'parentBridge'
  | 'selfDiscovery'
  | 'parentCoach';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendReplyParams {
  characterId: CharacterId;
  surface: Surface;
  userText: string;
  history?: ConversationTurn[];
  mood?: string;
  memory?: Record<string, unknown> | string;
  parentSharingEnabled?: boolean;
  userName?: string;
  displayName?: string;
  conversationPhase?: string;
  phaseInstruction?: string;
}

export interface CompanionReply {
  reply: string;
  tone: string;
  safetyFlag: boolean;
  parentShareSummary: string | null;
  suggestedComfortTool: string | null;
  replySource: 'openai' | 'fallback';
}

export interface SendVoiceParams {
  reply: string;
  characterId: CharacterId;
  format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav';
}

export interface TranscribeParams {
  audioBase64: string;
  contentType?: string;
}

export interface WorkerHealthResult {
  ok: boolean;
  latencyMs: number;
  version?: string;
  url: string;
}

const WORKER_BASE_URL = BACKEND_URL.replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 12_000;

async function workerFetch<T>(
  path: string,
  options: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  if (!WORKER_BASE_URL) throw new WorkerError(0, 'EXPO_PUBLIC_BACKEND_URL is not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${WORKER_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new WorkerError(res.status, `Worker ${path} returned ${res.status}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof WorkerError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new WorkerError(408, `Worker ${path} timed out after ${timeoutMs}ms`);
    }
    throw new WorkerError(0, `Worker ${path} network error: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

export class WorkerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}

const workerClient = {
  async sendReply(params: SendReplyParams): Promise<CompanionReply> {
    return workerFetch<CompanionReply>('/api/sekret/reply', {
      method: 'POST',
      headers: await backendAuthHeaders(),
      body: JSON.stringify(params),
    });
  },

  async synthesizeVoice(
    params: SendVoiceParams,
  ): Promise<{ audioBase64: string }> {
    return workerFetch<{ audioBase64: string }>('/api/sekret/voice', {
      method: 'POST',
      headers: await backendAuthHeaders(),
      body: JSON.stringify(params),
    });
  },

  async transcribeAudio(
    params: TranscribeParams,
  ): Promise<{ text: string }> {
    const result = await workerFetch<{ transcript?: string; text?: string }>('/api/sekret/transcribe', {
      method: 'POST',
      headers: await backendAuthHeaders(),
      body: JSON.stringify(params),
    });
    return { text: result.transcript ?? result.text ?? '' };
  },

  async ping(): Promise<WorkerHealthResult> {
    const start = Date.now();
    try {
      const result = await workerFetch<{ ok: boolean; version?: string }>(
        '/health',
        { method: 'GET' },
        6_000,
      );
      return {
        ok: result.ok ?? true,
        latencyMs: Date.now() - start,
        version: result.version,
        url: WORKER_BASE_URL,
      };
    } catch {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        url: WORKER_BASE_URL,
      };
    }
  },
};

export { workerClient, WORKER_BASE_URL };
