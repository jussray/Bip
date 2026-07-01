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

// ── Parent notification guard ─────────────────────────────────────────────────
// Queries parent_links for status='active' only.
// Notification payload contains zero content — alert_id + severity only.
async function notifyParentIfLinked(
  supabase:     ReturnType<typeof createClient>,
  teen_user_id: string,
  severity:     Severity,
  alert_id:     number,
): Promise<void> {
  const { data: link } = await supabase
    .from('parent_links')
    .select('parent_user_id')
    .eq('teen_user_id', teen_user_id)
    .eq('status', 'active')  // pending and revoked links are excluded
    .maybeSingle();

  if (!link?.parent_user_id) return;

  // Stamp parent_notified_at on the alert row
  await supabase
    .from('safety_alerts')
    .update({ parent_notified_at: new Date().toISOString() })
    .eq('id', alert_id);

  // TODO: wire to Expo push token lookup + expo-server-sdk when push ships.
  // Payload shape when ready:
  //   { to: <parent_expo_token>, title: 'Wellness Check',
  //     body: 'Someone you care about may need support',
  //     data: { alert_id, severity } }   ← NO content, NO source text
  console.log(
    `[safety-scan] parent notify queued alert_id=${String(alert_id)} severity=${severity}`,
  );
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

  // Insert safety_alert — no content stored anywhere in this row
  const { data: alert, error: alertErr } = await supabase
    .from('safety_alerts')
    .insert({
      user_id,
      alert_type:   mod?.flagged ? 'moderation' : 'keyword',
      source_table,
      source_id:    record_id,   // string — bigint-safe (trigger cast NEW.id::text)
      severity,
      scan_metadata,             // reduced shape only
    })
    .select('id')
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

  // Parent notification — high severity only, active link only, no content
  if (severity === 'high') {
    await notifyParentIfLinked(supabase, user_id, severity, alert.id);
  }

  return new Response(
    JSON.stringify({ flagged: true, severity, alert_id: alert.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
