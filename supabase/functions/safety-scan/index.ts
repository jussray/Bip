// supabase/functions/safety-scan/index.ts
// Se'kret Bip — Content Safety Scan Edge Function
//
// Called by Postgres trigger (pg_net net.http_post AFTER INSERT) on:
//   journal_entries, circle_posts, public_circle_posts
//   (s2tell_entries added when Phase 5 S2Tell ships)
//
// Two-layer scan:
//   1. Keyword pattern pass  — instant, no API cost, always runs
//   2. OpenAI Moderation API — free tier, ~100-200ms, non-blocking on failure
//
// Privacy guarantees:
//   • Content text is NEVER logged or stored
//   • Only reduced scan_metadata is written:
//       { flagged, top_category, top_score, provider }
//   • Parent push notification contains zero content — severity label only
//   • Parent is notified only if parent_links.status = 'active'
//
// Security:
//   • --no-verify-jwt: caller is Postgres trigger, no user JWT available
//   • Shared secret guard: x-scan-secret header must match SAFETY_SCAN_SECRET env
//   • SAFETY_SCAN_SECRET set via: supabase secrets set SAFETY_SCAN_SECRET=...
//   • SUPABASE_SERVICE_ROLE_KEY is Deno env only — never in client code

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Environment ───────────────────────────────────────────────────────────────
const SCAN_SECRET  = Deno.env.get('SAFETY_SCAN_SECRET')        ?? '';
const OPENAI_KEY   = Deno.env.get('OPENAI_API_KEY')            ?? '';
const SUPA_URL     = Deno.env.get('SUPABASE_URL')              ?? '';
const SUPA_SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ── Types ─────────────────────────────────────────────────────────────────────
type SourceTable =
  | 'journal_entries'
  | 'circle_posts'
  | 'public_circle_posts'
  | 'posts'
  | 's2tell_entries';

type Severity = 'high' | 'medium' | 'low';

interface ScanPayload {
  record_id:    string; // bigint or uuid — trigger casts NEW.id::text
  user_id:      string;
  source_table: SourceTable;
  content:      string;
}

interface ScanMetadata {
  flagged:      boolean;
  top_category: string | null;
  top_score:    number;
  provider:     'openai' | 'keyword-only' | 'none';
}

// ── Keyword patterns ──────────────────────────────────────────────────────────
// Ordered — first match wins.
// No content is stored; only tag + severity leave this function.
const PATTERNS: { re: RegExp; severity: Severity; tag: string }[] = [
  // high — self-harm / crisis
  {
    re: /\b(kill myself|end my life|want to die|suicidal|cut myself|self.harm)\b/i,
    severity: 'high',
    tag: 'self_harm',
  },
  {
    re: /\b(not safe|someone hurt me|being abused|he hits|she hits)\b/i,
    severity: 'high',
    tag: 'abuse',
  },
  // medium — distress signals
  {
    re: /\b(can't take it|i hate myself|nobody cares|give up|disappear forever)\b/i,
    severity: 'medium',
    tag: 'distress',
  },
  {
    re: /\b(running away|leaving forever|goodbye forever)\b/i,
    severity: 'medium',
    tag: 'runaway',
  },
  // low — general negativity
  {
    re: /\b(hate everything|worst day|nothing matters)\b/i,
    severity: 'low',
    tag: 'negativity',
  },
];

function patternScan(text: string): { severity: Severity | null; tag: string | null } {
  for (const p of PATTERNS) {
    if (p.re.test(text)) return { severity: p.severity, tag: p.tag };
  }
  return { severity: null, tag: null };
}

// ── OpenAI Moderation ─────────────────────────────────────────────────────────
interface ModerationResult {
  flagged:    boolean;
  categories: Record<string, boolean>;
  scores:     Record<string, number>;
}

async function moderationScan(text: string): Promise<ModerationResult | null> {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const r    = json?.results?.[0];
    if (!r) return null;
    return {
      flagged:    r.flagged    as boolean,
      categories: r.categories as Record<string, boolean>,
      scores:     r.category_scores as Record<string, number>,
    };
  } catch {
    // Non-blocking: OpenAI failure must never block the user's write
    return null;
  }
}

const HIGH_MOD_CATS = new Set([
  'self-harm',
  'self-harm/intent',
  'self-harm/instructions',
  'violence',
]);
const MEDIUM_MOD_CATS = new Set(['harassment', 'harassment/threatening']);

function severityFromMod(mod: ModerationResult): Severity | null {
  if (!mod.flagged) return null;
  for (const c of HIGH_MOD_CATS)   if (mod.categories[c]) return 'high';
  for (const c of MEDIUM_MOD_CATS) if (mod.categories[c]) return 'medium';
  return 'low';
}

// Reduced metadata — never store full OpenAI score array
function buildScanMetadata(
  mod:   ModerationResult | null,
  kwTag: string | null,
): ScanMetadata {
  if (!mod) {
    return {
      flagged:      kwTag !== null,
      top_category: kwTag,
      top_score:    0,
      provider:     kwTag !== null ? 'keyword-only' : 'none',
    };
  }
  const topEntry = Object.entries(mod.scores).reduce<[string, number]>(
    (best, [cat, score]) => (score > best[1] ? [cat, score] : best),
    ['', 0],
  );
  return {
    flagged:      mod.flagged,
    top_category: mod.flagged ? topEntry[0] : null,
    top_score:    Number(topEntry[1].toFixed(4)),
    provider:     'openai',
  };
}

// ── Parent-safe alert copy ────────────────────────────────────────────────────
// safety_alerts has real `title`/`summary` columns that reach the parent UI —
// these must only ever describe severity/category, never source content.
function buildAlertCopy(
  alertType: 'moderation' | 'keyword',
  severity:  Severity,
): { title: string; summary: string } {
  const title = severity === 'high' ? 'Wellness check suggested' : 'Wellness note';
  const summary =
    alertType === 'moderation'
      ? 'Automated content review flagged a possible wellness concern.'
      : 'A keyword pattern flagged a possible wellness concern.';
  return { title, summary };
}

// ── Parent link lookup ────────────────────────────────────────────────────────
// safety_alerts.parent_user_id is a stored column, not resolved via join at
// read time — the parent-read RLS policy (`teen_user_id = auth.uid() or
// parent_user_id = auth.uid()`) requires it to be set at write time.
async function findActiveParent(
  supabase:     ReturnType<typeof createClient>,
  teen_user_id: string,
): Promise<string | null> {
  const { data: link } = await supabase
    .from('parent_links')
    .select('parent_user_id')
    .eq('teen_user_id', teen_user_id)
    .eq('status', 'active')  // pending and revoked links are excluded
    .maybeSingle();

  return link?.parent_user_id ?? null;
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  // Shared secret guard — protects the --no-verify-jwt endpoint
  const incoming = req.headers.get('x-scan-secret') ?? '';
  if (!SCAN_SECRET || incoming !== SCAN_SECRET) {
    return new Response('unauthorized', { status: 401 });
  }

  let payload: ScanPayload;
  try {
    payload = (await req.json()) as ScanPayload;
  } catch {
    return new Response('bad json', { status: 400 });
  }

  const { record_id, user_id, source_table, content } = payload;

  if (!record_id || !user_id || !source_table || !content?.trim()) {
    return new Response('missing fields', { status: 400 });
  }

  // Layer 1 — keyword scan (sync, free, always runs)
  const kw = patternScan(content);

  // Layer 2 — OpenAI moderation (async, non-blocking on failure)
  const mod = await moderationScan(content);

  // Moderation result takes precedence over keyword if available
  const modSeverity = mod ? severityFromMod(mod) : null;
  const severity: Severity | null = modSeverity ?? kw.severity;

  // Build reduced metadata — full score array never stored
  const scan_metadata = buildScanMetadata(mod, kw.tag);

  // Nothing flagged — return clean
  if (!severity) {
    return new Response(JSON.stringify({ flagged: false }), {
      status:  200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Service-role client — server-side only, never reaches client code
  const supabase = createClient(SUPA_URL, SUPA_SVC_KEY, {
    auth: { persistSession: false },
  });

  const alertType = mod?.flagged ? 'moderation' : 'keyword';
  const { title, summary } = buildAlertCopy(alertType, severity);
  const parent_user_id = await findActiveParent(supabase, user_id);

  // Insert safety_alert — no content stored anywhere in this row.
  //
  // Live safety_alerts columns (confirmed 2026-07-01, see
  // docs/circle-v2-migration-plan.md §10.3): id, teen_user_id,
  // parent_user_id, source_mood_id, source_post_id, alert_type, severity,
  // title, summary, is_read, created_at, updated_at, scan_metadata.
  // There is no generic source_table/source_id pair — it's a typed-per-
  // source design. Only `posts` (the V2 unified model) has a typed slot
  // today (source_post_id); the legacy per-surface tables
  // (journal_entries/circle_posts/public_circle_posts) have none yet, so
  // their origin is kept in scan_metadata instead of forcing it into a
  // column it doesn't belong to.
  const { data: alert, error: alertErr } = await supabase
    .from('safety_alerts')
    .insert({
      teen_user_id:   user_id,
      parent_user_id,
      source_post_id: source_table === 'posts' ? record_id : null,
      alert_type:     alertType,
      severity,
      title,
      summary,
      is_read:        false,
      scan_metadata:  { ...scan_metadata, source_table, source_id: record_id },
    })
    .select('id, parent_user_id')
    .single();

  if (alertErr || !alert) {
    console.error('[safety-scan] alert insert failed:', alertErr?.message);
    return new Response('db error', { status: 500 });
  }

  // Mark source row safety_flagged = true via service role (bypasses RLS)
  // Most legacy tables key the author as `user_id`; `posts` (V2 unified
  // model) uses `author_user_id` instead.
  const FLAGGABLE_USER_COL: Partial<Record<SourceTable, string>> = {
    journal_entries:     'user_id',
    circle_posts:        'user_id',
    public_circle_posts: 'user_id',
    posts:                'author_user_id',
    s2tell_entries:      'user_id',
  };
  const userCol = FLAGGABLE_USER_COL[source_table];
  if (userCol) {
    await supabase
      .from(source_table)
      .update({ safety_flagged: true })
      .eq(userCol, user_id)
      .eq('id', record_id);
  }

  // Parent notification — high severity only, active link only, no content.
  // parent_user_id was already resolved and stored on the row above.
  if (severity === 'high' && alert.parent_user_id) {
    // TODO: wire to Expo push token lookup + expo-server-sdk when push ships.
    // Payload shape when ready:
    //   { to: <parent_expo_token>, title, body: summary,
    //     data: { alert_id: alert.id, severity } }   ← NO source content
    console.log(
      `[safety-scan] parent notify queued alert_id=${String(alert.id)} severity=${severity}`,
    );
  }

  return new Response(
    JSON.stringify({ flagged: true, severity, alert_id: alert.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
