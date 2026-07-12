import type { Principal } from './auth';
import { getModels } from './config/models';

interface BridgeSummaryEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENAI_CHAT_MODEL?: string;
}

interface BridgeSummaryRequestBody {
  requestId?: unknown;
}

interface BridgeShareRequestRow {
  id: string;
  teen_user_id: string;
  status: string;
  revoked_at: string | null;
  expires_at: string | null;
}

interface BridgeShareSourceRow {
  source_kind: 'journal' | 'mood' | 'goal' | 'scrapbook';
  source_id: string;
}

interface GeneratedSummary {
  themes: string[];
  conversationStarters: string[];
  limitations: string;
}

const BRIDGE_SYSTEM_PROMPT = `
You turn a teen's private reflections into a short, protective summary for their parent. The parent must NEVER see the teen's exact words — only your generated themes and conversation starters.

RULES:
- Never quote or closely paraphrase the source text. Speak only in generalized themes.
- No clinical or diagnostic language: no "anxiety," "depression," "trauma," "disorder," "symptom." Describe feelings in plain, human terms instead.
- Stay protective of the teen: give the parent enough to open a caring conversation, never enough to feel like surveillance.
- themes: 1-3 short, general phrases (never specific events, names, or exact quotes).
- conversationStarters: 1-2 short questions or openers a parent could actually say out loud.
- limitations: one sentence reminding the parent this is a generated summary, not the teen's full private content, a diagnosis, or proof of what happened.
- Return only valid JSON with keys: themes (string[]), conversationStarters (string[]), limitations (string). No markdown, no code fences.
`.trim();

function json(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
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

const PROMPT_VERSION = 'bridge-summary-v2';
const FALLBACK_SUMMARY = {
  themes: ['A teen chose to share emotional context with you.'],
  conversationStarters: [
    'I saw you wanted me to understand something. Do you want to talk about what support would feel helpful?',
  ],
  limitations: 'This is context, not the teen’s full private content, a diagnosis, or proof of what happened.',
};

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

function serviceHeaders(key: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

async function fetchOwnedRequest(env: BridgeSummaryEnv, requestId: string, userId: string): Promise<BridgeShareRequestRow | null> {
  const { url, key } = requireSupabase(env);
  const response = await fetch(
    `${url}/rest/v1/bridge_share_requests?id=eq.${encodeURIComponent(requestId)}&teen_user_id=eq.${encodeURIComponent(userId)}&select=id,teen_user_id,status,revoked_at,expires_at`,
    { headers: serviceHeaders(key) },
  );
  if (!response.ok) throw new Error('request_lookup_failed');
  const rows = await response.json() as BridgeShareRequestRow[];
  return rows[0] ?? null;
}

function requestIsUsable(row: BridgeShareRequestRow): boolean {
  if (row.revoked_at) return false;
  if (['revoked', 'expired', 'deleted'].includes(row.status)) return false;
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return false;
  return true;
}

async function patchRequestStatus(env: BridgeSummaryEnv, requestId: string, userId: string, status: 'ready' | 'failed', failureCode?: string): Promise<void> {
  const { url, key } = requireSupabase(env);
  const response = await fetch(
    `${url}/rest/v1/bridge_share_requests?id=eq.${encodeURIComponent(requestId)}&teen_user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: { ...serviceHeaders(key), Prefer: 'return=minimal' },
      body: JSON.stringify({ status, failure_code: failureCode ?? null, updated_at: new Date().toISOString() }),
    },
  );
  if (!response.ok) throw new Error('request_status_update_failed');
}

async function upsertFallbackSummary(env: BridgeSummaryEnv, requestId: string): Promise<void> {
  const { url, key } = requireSupabase(env);
  const response = await fetch(`${url}/rest/v1/bridge_summaries?on_conflict=request_id`, {
    method: 'POST',
    headers: { ...serviceHeaders(key), Prefer: 'resolution=merge-duplicates,return=minimal' },
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
  if (!response.ok) throw new Error('summary_write_failed');
}

async function upsertGeneratedSummary(env: BridgeSummaryEnv, requestId: string, summary: GeneratedSummary, model: string): Promise<void> {
  const { url, key } = requireSupabase(env);
  const response = await fetch(`${url}/rest/v1/bridge_summaries?on_conflict=request_id`, {
    method: 'POST',
    headers: { ...serviceHeaders(key), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      request_id: requestId,
      themes: summary.themes,
      conversation_starters: summary.conversationStarters,
      limitations: summary.limitations,
      prompt_version: PROMPT_VERSION,
      model,
      used_fallback: false,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error('summary_write_failed');
}

async function fetchShareSources(env: BridgeSummaryEnv, requestId: string): Promise<BridgeShareSourceRow[]> {
  const { url, key } = requireSupabase(env);
  const response = await fetch(
    `${url}/rest/v1/bridge_share_sources?request_id=eq.${encodeURIComponent(requestId)}&select=source_kind,source_id`,
    { headers: serviceHeaders(key) },
  );
  if (!response.ok) throw new Error('sources_lookup_failed');
  return await response.json() as BridgeShareSourceRow[];
}

/**
 * Fetches only the minimized text needed to summarize — never returns rows to
 * the caller, only the raw content used as ephemeral LLM input.
 */
async function fetchSourceContent(env: BridgeSummaryEnv, teenUserId: string, sources: BridgeShareSourceRow[]): Promise<string[]> {
  const { url, key } = requireSupabase(env);
  const snippets: string[] = [];

  const journalIds = sources.filter((s) => s.source_kind === 'journal').map((s) => s.source_id);
  if (journalIds.length > 0) {
    const idList = journalIds.map((id) => encodeURIComponent(id)).join(',');
    const response = await fetch(
      `${url}/rest/v1/journal_entries?user_id=eq.${encodeURIComponent(teenUserId)}&id=in.(${idList})&select=text,mood`,
      { headers: serviceHeaders(key) },
    );
    if (response.ok) {
      const rows = await response.json() as Array<{ text: string; mood: string }>;
      for (const row of rows) snippets.push(`[journal entry, mood: ${row.mood}] ${row.text}`.slice(0, 2000));
    }
  }

  const moodIds = sources.filter((s) => s.source_kind === 'mood').map((s) => s.source_id);
  if (moodIds.length > 0) {
    const idList = moodIds.map((id) => encodeURIComponent(id)).join(',');
    const response = await fetch(
      `${url}/rest/v1/mood_history?user_id=eq.${encodeURIComponent(teenUserId)}&id=in.(${idList})&select=mood,date`,
      { headers: serviceHeaders(key) },
    );
    if (response.ok) {
      const rows = await response.json() as Array<{ mood: string; date: string }>;
      for (const row of rows) snippets.push(`[mood check-in on ${row.date}] felt ${row.mood}`);
    }
  }

  return snippets;
}

function isGeneratedSummary(value: unknown): value is GeneratedSummary {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GeneratedSummary>;
  return (
    Array.isArray(candidate.themes) && candidate.themes.every((t) => typeof t === 'string') && candidate.themes.length > 0 &&
    Array.isArray(candidate.conversationStarters) && candidate.conversationStarters.every((t) => typeof t === 'string') && candidate.conversationStarters.length > 0 &&
    typeof candidate.limitations === 'string' && candidate.limitations.length > 0
  );
}

/**
 * Calls the model with only the minimized source snippets as ephemeral input
 * (never persisted). Returns null on any failure so the caller falls back to
 * the static FALLBACK_SUMMARY rather than surfacing a raw error to the parent.
 */
async function generateSummary(env: BridgeSummaryEnv, snippets: string[]): Promise<{ summary: GeneratedSummary; model: string } | null> {
  if (!env.OPENAI_API_KEY || snippets.length === 0) return null;
  const apiKey = env.OPENAI_API_KEY;
  const models = getModels({ OPENAI_API_KEY: apiKey, OPENAI_CHAT_MODEL: env.OPENAI_CHAT_MODEL });

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: models.chat,
        temperature: 0.4,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: BRIDGE_SYSTEM_PROMPT },
          { role: 'user', content: `Teen-selected private content to summarize for a parent:\n\n${snippets.join('\n\n')}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    if (!isGeneratedSummary(parsed)) return null;
    return { summary: parsed, model: models.chat };
  } catch {
    return null;
  }
}

export async function handleBridgeSummaryGenerate(request: Request, env: BridgeSummaryEnv, principal: Principal, cors: Record<string, string>): Promise<Response> {
  let body: BridgeSummaryRequestBody;
  try {
    body = await request.json() as BridgeSummaryRequestBody;
  } catch {
    return json({ error: 'Invalid JSON' }, 400, cors);
  }

  const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
  if (!requestId) return json({ error: 'requestId is required' }, 400, cors);

  let userId = '';
  try {
    userId = requireUser(principal);
    const shareRequest = await fetchOwnedRequest(env, requestId, userId);
    if (!shareRequest) return json({ error: 'request not found' }, 404, cors);
    if (!requestIsUsable(shareRequest)) {
      return json({ requestId, status: 'revoked', failureCode: 'revoked' }, 409, cors);
    }
    if (shareRequest.status === 'ready' || shareRequest.status === 'viewed') {
      return json({ requestId, status: 'ready' }, 200, cors);
    }

    const sources = await fetchShareSources(env, requestId);
    const snippets = await fetchSourceContent(env, userId, sources);
    const generated = await generateSummary(env, snippets);

    if (generated) {
      await upsertGeneratedSummary(env, requestId, generated.summary, generated.model);
      await patchRequestStatus(env, requestId, userId, 'ready');
      const response: BridgeSummaryResponse = {
        requestId,
        status: 'ready',
        summary: generated.summary,
        promptVersion: PROMPT_VERSION,
        model: generated.model,
        usedFallback: false,
      };
      return json(response, 200, cors);
    }

    await upsertFallbackSummary(env, requestId);
    await patchRequestStatus(env, requestId, userId, 'ready');
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
    if (message === 'user_jwt_required') return json({ error: message }, 403, cors);
    if (userId) {
      try {
        await patchRequestStatus(env, requestId, userId, 'failed', message.slice(0, 80));
      } catch {
        // Preserve the original failure.
      }
    }
    return json({ requestId, status: 'failed', failureCode: 'server_error' }, 500, cors);
  }
}
