export interface WorkerTelemetryEvent {
  fingerprint: string;
  route: string;
  method: string;
  status: number;
  duration_ms: number;
  provider?: string;
  operation?: string;
  character_id?: string;
  error_name?: string;
  request_id?: string;
  model?: string;
  fallback_used?: boolean;
  retry_count?: number;
  voice_source?: string;
}

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 80) : undefined;
}

export function emitWorkerTelemetry(event: WorkerTelemetryEvent): void {
  console.log(JSON.stringify({
    source: 'cloudflare_worker',
    schema_version: 2,
    timestamp: new Date().toISOString(),
    fingerprint: clean(event.fingerprint) || 'worker_unknown',
    route: clean(event.route) || '/',
    method: clean(event.method) || 'UNKNOWN',
    status: event.status,
    duration_ms: Math.max(0, Math.round(event.duration_ms)),
    provider: clean(event.provider),
    operation: clean(event.operation),
    character_id: clean(event.character_id),
    error_name: clean(event.error_name),
    request_id: clean(event.request_id),
    model: clean(event.model),
    fallback_used: event.fallback_used === true,
    retry_count: Number.isFinite(event.retry_count) ? Math.max(0, Math.round(event.retry_count || 0)) : 0,
    voice_source: clean(event.voice_source),
  }));
}
