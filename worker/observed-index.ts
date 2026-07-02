import worker from './index';
import { emitWorkerTelemetry } from './telemetry';

function operationForPath(path: string): string {
  if (path.endsWith('/api/sekret/reply')) return 'reply';
  if (path.endsWith('/api/sekret/voice')) return 'tts';
  if (path.endsWith('/api/sekret/transcribe')) return 'stt';
  return 'unknown';
}

function fingerprintFor(status: number, operation: string): string {
  if (status === 401 || status === 403) return 'worker_auth_failure';
  if (status === 429) return 'worker_rate_limit';
  if (status >= 500) return operation === 'tts' ? 'worker_tts_failure' : operation === 'stt' ? 'worker_stt_failure' : 'worker_upstream_failure';
  if (status >= 400) return 'worker_invalid_request';
  return 'worker_request_success';
}

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    const started = Date.now();
    const url = new URL(request.url);
    const operation = operationForPath(url.pathname);
    const requestId = request.headers.get('CF-Ray') || undefined;

    try {
      const response = await worker.fetch(request, env as never, ctx as never);
      emitWorkerTelemetry({
        fingerprint: fingerprintFor(response.status, operation),
        route: url.pathname,
        method: request.method,
        status: response.status,
        duration_ms: Date.now() - started,
        provider: 'cloudflare',
        operation,
        request_id: requestId,
      });
      return response;
    } catch (error) {
      emitWorkerTelemetry({
        fingerprint: 'worker_unhandled_exception',
        route: url.pathname,
        method: request.method,
        status: 500,
        duration_ms: Date.now() - started,
        provider: 'cloudflare',
        operation,
        error_name: error instanceof Error ? error.name : 'UnknownError',
        request_id: requestId,
      });
      throw error;
    }
  },
};
