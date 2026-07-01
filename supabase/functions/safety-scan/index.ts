// supabase/functions/safety-scan/index.ts
// Se'kret Bip — Content Safety Scan Edge Function
//
// Called by Postgres trigger (pg_net net.http_post AFTER INSERT) on:
//   journal_entries, circle_posts, public_circle_posts, posts
//   (s2tell_entries added when Phase 5 S2Tell ships)
//
// Privacy guarantees:
//   • Content text is NEVER logged or stored.
//   • Only reduced scan_metadata is written.
//   • Parent alert rows contain no source content.
//   • Parent notification is only attempted when parent_links.status='active'.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SCAN_SECRET  = Deno.env.get('SAFETY_SCAN_SECRET')        ?? '';
const OPENAI_KEY   = Deno.env.get('OPENAI_API_KEY')            ?? '';
const SUPA_URL     = Deno.env.get('SUPABASE_URL')              ?? '';
const SUPA_SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

type SourceTable =
  | 'journal_entries'
  | 'circle_posts'
  | 'public_circle_posts'
  | 'posts'
  | 's2tell_entries';

type ScanSeverity = 'high' | 'medium' | 'low';
type AlertSeverity = 'critical' | 'high' | 'medium';
type AlertType = 'critical_mood' | 'self_harm_keyword' | 'panic_pattern' | 'manual_sos';

interface ScanPayload {
  record_id:    string;
  user_id:      string;
  source_table: SourceTable;
  content:      string;
}

interface ScanMetadata {
  flagged:      boolean;
  top_category: string | null;
  top_score:    number;
  provider:     'openai' | 'keyword-only' | 'none';
  source_table?: SourceTable;
}

const PATTERNS: { re: RegExp; severity: ScanSeverity; tag: string }[] = [
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
  {
    re: /\b(hate everything|worst day|nothing matters)\b/i,
    severity: 'low',
    tag: 'negativity',
  },
];

function patternScan(text: string): { severity: ScanSeverity | null; tag: string | null } {
  for (const p of PATTERNS) {
    if (p.re.test(text)) return { severity: p.severity, tag: p.tag };
  }
  return { severity: null, tag: null };
}

interface ModerationResult {
  flagged:    boolean;
  categories: Record<string, boolean>;
  scores:     Record<string, number>;
}

async function moderationScan(text: string): Promise<ModerationResult | null> {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const r = json?.results?.[0];
    if (!r) return null;
    return {
      flagged: r.flagged as boolean,
      categories: r.categories as Record<string, boolean>,
      scores: r.category_scores as Record<string, number>,
    };
  } catch {
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

function severityFromMod(mod: ModerationResult): ScanSeverity | null {
  if (!mod.flagged) return null;
  for (const c of HIGH_MOD_CATS) if (mod.categories[c]) return 'high';
  for (const c of MEDIUM_MOD_CATS) if (mod.categories[c]) return 'medium';
  return 'low';
}

function buildScanMetadata(
  mod: ModerationResult | null,
  kwTag: string | null,
  sourceTable: SourceTable,
): ScanMetadata {
  if (!mod) {
    return {
      flagged: kwTag !== null,
      top_category: kwTag,
      top_score: 0,
      provider: kwTag !== null ? 'keyword-only' : 'none',
      source_table: sourceTable,
    };
  }
  const topEntry = Object.entries(mod.scores).reduce<[string, number]>(
    (best, [cat, score]) => (score > best[1] ? [cat, score] : best),
    ['', 0],
  );
  return {
    flagged: mod.flagged,
    top_category: mod.flagged ? topEntry[0] : null,
    top_score: Number(topEntry[1].toFixed(4)),
    provider: 'openai',
    source_table: sourceTable,
  };
}

function toAlertSeverity(scanSeverity: ScanSeverity): AlertSeverity {
  if (scanSeverity === 'high') return 'critical';
  if (scanSeverity === 'medium') return 'high';
  return 'medium';
}

function toAlertType(tag: string | null, mod: ModerationResult | null): AlertType {
  if (tag === 'self_harm') return 'self_harm_keyword';
  if (tag === 'runaway' || tag === 'distress') return 'panic_pattern';
  if (mod?.flagged) return 'panic_pattern';
  return 'critical_mood';
}

function safeTitle(alertType: AlertType): string {
  switch (alertType) {
    case 'self_harm_keyword': return 'Wellness Check';
    case 'panic_pattern': return 'Support Signal';
    case 'manual_sos': return 'Manual SOS';
    case 'critical_mood':
    default: return 'Mood Support Signal';
  }
}

function safeSummary(alertType: AlertType, severity: AlertSeverity): string {
  if (severity === 'critical') return 'A high-priority safety signal was detected. No private content is included.';
  if (alertType === 'panic_pattern') return 'A support pattern was detected. No private content is included.';
  return 'A wellness signal was detected. No private content is included.';
}

async function markSourceFlagged(
  supabase: ReturnType<typeof createClient>,
  sourceTable: SourceTable,
  recordId: string,
  userId: string,
): Promise<void> {
  if (sourceTable === 'posts') {
    await supabase
      .from('posts')
      .update({ safety_flagged: true })
      .eq('author_user_id', userId)
      .eq('id', recordId);
    return;
  }

  if (sourceTable === 'journal_entries' || sourceTable === 'circle_posts' || sourceTable === 'public_circle_posts') {
    await supabase
      .from(sourceTable)
      .update({ safety_flagged: true })
      .eq('user_id', userId)
      .eq('id', recordId);
  }
}

async function findActiveParentLink(
  supabase: ReturnType<typeof createClient>,
  teenUserId: string,
): Promise<{ parent_user_id: string } | null> {
  const { data } = await supabase
    .from('parent_links')
    .select('parent_user_id')
    .eq('teen_user_id', teenUserId)
    .eq('status', 'active')
    .eq('is_active', true)
    .not('parent_user_id', 'is', null)
    .limit(1)
    .maybeSingle();

  return data?.parent_user_id ? data as { parent_user_id: string } : null;
}

async function insertSafetyAlert(
  supabase: ReturnType<typeof createClient>,
  payload: {
    teenUserId: string;
    parentUserId: string;
    sourceTable: SourceTable;
    recordId: string;
    alertType: AlertType;
    severity: AlertSeverity;
    scanMetadata: ScanMetadata;
  },
): Promise<string | null> {
  const sourcePostId = payload.sourceTable === 'posts' ? payload.recordId : null;

  const { data, error } = await supabase
    .from('safety_alerts')
    .insert({
      teen_user_id: payload.teenUserId,
      parent_user_id: payload.parentUserId,
      source_post_id: sourcePostId,
      alert_type: payload.alertType,
      severity: payload.severity,
      title: safeTitle(payload.alertType),
      summary: safeSummary(payload.alertType, payload.severity),
      scan_metadata: payload.scanMetadata,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    console.error('[safety-scan] alert insert failed:', error?.message);
    return null;
  }
  return String(data.id);
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

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

  const kw = patternScan(content);
  const mod = await moderationScan(content);
  const modSeverity = mod ? severityFromMod(mod) : null;
  const scanSeverity = modSeverity ?? kw.severity;
  const scan_metadata = buildScanMetadata(mod, kw.tag, source_table);

  if (!scanSeverity) {
    return new Response(JSON.stringify({ flagged: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPA_URL, SUPA_SVC_KEY, {
    auth: { persistSession: false },
  });

  await markSourceFlagged(supabase, source_table, record_id, user_id);

  const parentLink = await findActiveParentLink(supabase, user_id);
  if (!parentLink?.parent_user_id) {
    return new Response(
      JSON.stringify({ flagged: true, parent_notified: false, reason: 'no_active_parent_link' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const alertType = toAlertType(kw.tag, mod);
  const alertSeverity = toAlertSeverity(scanSeverity);
  const alertId = await insertSafetyAlert(supabase, {
    teenUserId: user_id,
    parentUserId: parentLink.parent_user_id,
    sourceTable: source_table,
    recordId: record_id,
    alertType,
    severity: alertSeverity,
    scanMetadata: scan_metadata,
  });

  return new Response(
    JSON.stringify({ flagged: true, severity: alertSeverity, alert_id: alertId, parent_notified: Boolean(alertId) }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
