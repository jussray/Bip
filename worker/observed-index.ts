import worker from './index';
import { emitWorkerTelemetry } from './telemetry';

function operationForPath(path: string): string {
  if (path.endsWith('/api/sekret/reply')) return 'reply';
  if (path.endsWith('/api/sekret/voice')) return 'tts';
  if (path.endsWith('/api/sekret/transcribe')) return 'stt';
  return 'unknown';
}

function modelForOperation(operation: string): string | undefined {
  if (operation === 'reply') return 'gpt-4o-mini';
  if (operation === 'tts') return 'gpt-4o-mini-tts';
  if (operation === 'stt') return 'whisper-1';
  return undefined;
}

function fingerprintFor(status: number, operation: string, fallbackUsed: boolean): string {
  if (fallbackUsed && operation === 'reply') return 'openai_reply_fallback';
  if (status === 401 || status === 403) return 'worker_auth_failure';
  if (status === 429) return 'worker_rate_limit';
  if (status >= 500) return operation === 'tts' ? 'openai_tts_failure' : operation === 'stt' ? 'openai_stt_failure' : 'openai_reply_failure';
  if (status >= 400) return 'worker_invalid_request';
  return operation === 'reply' ? 'openai_reply_success' : operation === 'tts' ? 'openai_tts_success' : operation === 'stt' ? 'openai_stt_success' : 'worker_request_success';
}

async function readSafeResponseMetadata(response: Response, operation: string): Promise<{ characterId?: string; fallbackUsed: boolean; voiceSource?: string }> {
  if (operation === 'unknown') return { fallbackUsed: false };
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return { fallbackUsed: false };
  try {
    const data = await response.clone().json() as Record<string, unknown>;
    return {
      characterId: typeof data.characterId === 'string' ? data.characterId : undefined,
      fallbackUsed: data.replySource === 'fallback',
      voiceSource: typeof data.voiceSource === 'string' ? data.voiceSource : undefined,
    };
  } catch {
    return { fallbackUsed: false };
  }
}

export default {
  async fetch(request: Request, env: unknown): Promise<Response> {
    const started = Date.now();
    const url = new URL(request.url);
    const operation = operationForPath(url.pathname);
    const requestId = request.headers.get('CF-Ray') || undefined;

    try {
      const response = await worker.fetch(request, env as never);
      const metadata = await readSafeResponseMetadata(response, operation);
      emitWorkerTelemetry({
        fingerprint: fingerprintFor(response.status, operation, metadata.fallbackUsed),
        route: url.pathname,
        method: request.method,
        status: response.status,
        duration_ms: Date.now() - started,
        provider: operation === 'unknown' ? 'cloudflare' : 'openai',
        operation,
        character_id: metadata.characterId,
        request_id: requestId,
        model: modelForOperation(operation),
        fallback_used: metadata.fallbackUsed,
        retry_count: 0,
        voice_source: metadata.voiceSource,
      });
      return response;
    } catch (error) {
      emitWorkerTelemetry({
        fingerprint: operation === 'unknown' ? 'worker_unhandled_exception' : `openai_${operation}_exception`,
        route: url.pathname,
        method: request.method,
        status: 500,
        duration_ms: Date.now() - started,
        provider: operation === 'unknown' ? 'cloudflare' : 'openai',
        operation,
        error_name: error instanceof Error ? error.name : 'UnknownError',
        request_id: requestId,
        model: modelForOperation(operation),
        fallback_used: false,
        retry_count: 0,
      });
      throw error;
    }
  },
};
