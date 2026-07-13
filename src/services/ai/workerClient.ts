/**
 * src/services/ai/workerClient.ts
 *
 * Typed fetch client for the Se'kret Cloudflare Worker.
 * All companion AI traffic (reply, TTS, STT) routes through here.
 *
 * Endpoints mirrored from worker/index.ts:
 *   POST /reply       → CompanionReply
 *   POST /voice       → { audioBase64: string }
 *   POST /transcribe  → { text: string }
 *   GET  /health      → { ok: boolean; version?: string }
 *
 * Usage:
 *   import { workerClient } from '@/services/ai/workerClient';
 *   const reply = await workerClient.sendReply({ characterId: 'raylene', ... });
 */

import Constants from 'expo-constants';

// ─── Types (mirror worker/sekret-reply.ts) ──────────────────────────────────

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
  memory?: string;
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

// ─── Config ──────────────────────────────────────────────────────────────────

const WORKER_BASE_URL: string =
  (Constants.expoConfig?.extra?.workerBaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_WORKER_BASE_URL ??
  'https://sekret-backend.sekretbip.workers.dev';

const DEFAULT_TIMEOUT_MS = 12_000;

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function workerFetch<T>(
  path: string,
  options: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${WORKER_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        detail = JSON.stringify(body);
      } catch {
        detail = await res.text().catch(() => '');
      }
      throw new WorkerError(res.status, `Worker ${path} → ${res.status}: ${detail}`);
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

// ─── Error class ─────────────────────────────────────────────────────────────

export class WorkerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}

// ─── Client ──────────────────────────────────────────────────────────────────

const workerClient = {
  /**
   * POST /reply
   * Main companion reply. Returns structured CompanionReply.
   * Throws WorkerError on network failure, timeout, or non-2xx.
   */
  async sendReply(params: SendReplyParams): Promise<CompanionReply> {
    return workerFetch<CompanionReply>('/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  },

  /**
   * POST /voice
   * Text-to-speech for a companion reply.
   * Returns { audioBase64: string }.
   */
  async synthesizeVoice(
    params: SendVoiceParams,
  ): Promise<{ audioBase64: string }> {
    return workerFetch<{ audioBase64: string }>('/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  },

  /**
   * POST /transcribe
   * Speech-to-text for voice input.
   * Returns { text: string }.
   */
  async transcribeAudio(
    params: TranscribeParams,
  ): Promise<{ text: string }> {
    return workerFetch<{ text: string }>('/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  },

  /**
   * GET /health
   * Founder / Control Room: live Worker reachability + latency.
   */
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
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        url: WORKER_BASE_URL,
      };
    }
  },
};

export { workerClient, WORKER_BASE_URL };
