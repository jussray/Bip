import type { Principal } from './auth';

interface BridgeSummaryEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface BridgeSummaryRequestBody {
  requestId?: unknown;
}

interface BridgeSummaryResponse {
  requestId: string;
  status: 'ready' | 'failed' | 'revoked';
  summary?: {
    themes: string[];
    conversationStarters: string[];
    limitations: string;
  };
  promptVersion?: string;
  model?: string | null;
  usedFallback?: boolean;
  failureCode?: string;
}

const PROMPT_VERSION = 'bridge-summary-v1';

const FALLBACK_SUMMARY = {
  themes: ['A teen chose to share emotional context with you.'],
  conversationStarters: [
    'I saw you wanted me to understand something. Do you want to talk about what support would feel helpful?',
  ],
  limitations: 'This is context, not the teen’s full private content, a diagnosis, or proof of what happened.',
};

function json(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function requireUser(principal: Principal): string {
  if (principal.kind !== 'user') throw new Error('user_jwt_required');
  return principal.userId;
}

function requireSupabase(env: BridgeSummaryEnv): { url: string; key: string } {
  const url = env.SUPABASE_URL?.replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('supabase_not_configured');
  return { url, key };
}

async function patchRequestStatus(
  env: BridgeSummaryEnv,
  requestId: string,
  status: 'ready' | 'failed',
  failureCode?: string,
): Promise<void> {
  const { url, key } = requireSupabase(env);
  await fetch(`${url}/rest/v1/bridge_share_requests?id=eq.${encodeURIComponent(requestId)}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      status,
      failure_code: failureCode ?? null,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function upsertFallbackSummary(env: BridgeSummaryEnv, requestId: string): Promise<void> {
  const { url, key } = requireSupabase(env);
  await fetch(`${url}/rest/v1/bridge_summaries?on_conflict=request_id`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      request_id: requestId,
      themes: FALLBACK_SUMMARY.themes,
      conversation_starters: FALLBACK_SUMMARY.conversationStarters,
      limitations: FALLBACK_SUMMARY.limitations,
      prompt_version: PROMPT_VERSION,
      model: null,
      used_fallback: true,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function handleBridgeSummaryGenerate(
  request: Request,
  env: BridgeSummaryEnv,
  principal: Principal,
  cors: Record<string, string>,
): Promise<Response> {
  let body: BridgeSummaryRequestBody;
  try {
    body = await request.json() as BridgeSummaryRequestBody;
  } catch {
    return json({ error: 'Invalid JSON' }, 400, cors);
  }

  const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
  if (!requestId) return json({ error: 'requestId is required' }, 400, cors);

  try {
    requireUser(principal);
    await upsertFallbackSummary(env, requestId);
    await patchRequestStatus(env, requestId, 'ready');
    const response: BridgeSummaryResponse = {
      requestId,
      status: 'ready',
      summary: FALLBACK_SUMMARY,
      promptVersion: PROMPT_VERSION,
      model: null,
      usedFallback: true,
    };
    return json(response, 200, cors);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error';
    try {
      await patchRequestStatus(env, requestId, 'failed', message.slice(0, 80));
    } catch {
      // Preserve the original failure.
    }
    return json({ requestId, status: 'failed', failureCode: message }, 500, cors);
  }
}
