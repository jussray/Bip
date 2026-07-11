/**
 * worker/audit/persist-event.ts
 *
 * Closes the gap the L99 audit called the single biggest architectural
 * problem: Cloudflare telemetry logs and the Supabase Control Room were two
 * disconnected systems, joined only by a manual, file-based ingest script
 * (scripts/control-room-ingest-worker-logs.mjs).
 *
 * This writes each completed AI event directly from the Worker into
 * public.audit_events (and, for non-trivial severities, upserts a grouped
 * control_room_issue) over the Supabase REST API — no intermediate log file.
 * It is called via `ctx.waitUntil(...)` from observed-index.ts so it never
 * adds latency to the response, and it never throws: a Supabase outage must
 * not take down the OpenAI gateway.
 *
 * Only operational metadata is written (see ALLOWED_METADATA_KEYS below) —
 * mirrors the privacy posture already enforced by telemetry.ts and the
 * existing log_control_room_runtime_event RPC, which strips conversation
 * content before it ever reaches this table.
 */
import type { WorkerTelemetryEvent } from '../telemetry';

export interface AuditPersistEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

function severityFor(status: number): 'info' | 'warning' | 'error' | 'critical' {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warning';
  return 'info';
}

/** Same operational-metadata contract as the log-file ingest path, plus the
 * new L99 fields. Never includes route params, user text, or auth headers. */
function metadataFor(event: WorkerTelemetryEvent): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    source: 'cloudflare_worker',
    schema_version: 3,
    route: event.route,
    method: event.method,
    status: event.status,
    duration_ms: event.duration_ms,
    provider: event.provider,
    operation: event.operation,
    character_id: event.character_id,
    error_name: event.error_name,
    request_id: event.request_id,
    model: event.model,
    fallback_used: event.fallback_used === true,
    retry_count: event.retry_count ?? 0,
    voice_source: event.voice_source,
    trace_id: event.trace_id,
    input_tokens: event.input_tokens,
    output_tokens: event.output_tokens,
    total_tokens: event.total_tokens,
    estimated_cost_usd: event.estimated_cost_usd,
    prompt_version: event.prompt_version,
    policy_version: event.policy_version,
    schema_valid: event.schema_valid,
    decision: event.decision,
    violation_codes: event.violation_codes,
  };
  for (const key of Object.keys(metadata)) {
    if (metadata[key] === undefined) delete metadata[key];
  }
  return metadata;
}

async function post(baseUrl: string, serviceKey: string, pathname: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${pathname}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

/**
 * Persist one completed AI event to Supabase. Never throws — logs and
 * returns instead, so a Supabase or network failure never affects the
 * Worker's response to the caller.
 */
export async function persistAuditEvent(event: WorkerTelemetryEvent, env: AuditPersistEnv): Promise<void> {
  const baseUrl = env.SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!baseUrl || !serviceKey) return; // not configured yet — fail silently, don't block the gateway

  const metadata = metadataFor(event);
  const severity = severityFor(event.status);

  try {
    const inserted = await post(baseUrl, serviceKey, '/rest/v1/audit_events', {
      user_id: null, // request principal is never stored raw here; principal_id lives in metadata via preflight, not this table's user_id column
      event_type: event.fingerprint,
      screen: event.route || null,
      severity,
      message: `${event.fingerprint} on ${event.route || 'unknown route'}`,
      metadata,
      resolved: false,
    });
    const eventId = Array.isArray(inserted) ? (inserted[0] as { id?: string })?.id : (inserted as { id?: string })?.id;
    if (!eventId) return;

    if (severity === 'warning' || severity === 'error' || severity === 'critical' || (event.violation_codes && event.violation_codes.length)) {
      await post(baseUrl, serviceKey, '/rest/v1/rpc/upsert_control_room_issue', {
        p_fingerprint: String(event.fingerprint),
        p_source: 'cloudflare_worker',
        p_category: event.operation === 'tts' || event.operation === 'stt' ? 'voice' : 'infra',
        p_severity: severity,
        p_status: 'open',
        p_title: String(event.fingerprint).replaceAll('_', ' '),
        p_summary: `Cloudflare Worker reported ${event.fingerprint} on ${event.route || 'an unknown route'}.`,
        p_suggested_fix: 'Review the structured Worker event, decision, violation codes, and recent deployment changes.',
        p_affected_surface: event.route || null,
        p_affected_user_id: null,
        p_event_id: eventId,
        p_metadata: metadata,
      });
    }
  } catch (error) {
    console.error('[audit/persist-event]', error instanceof Error ? error.message : error);
  }
}
