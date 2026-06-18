/**
 * Se'kret Reply Worker — POST /api/sekret/reply
 *
 * Cloudflare Worker. Holds OPENAI_API_KEY as a Worker secret.
 * The Expo client calls this via EXPO_PUBLIC_BACKEND_URL.
 *
 * Secrets (set with `wrangler secret put` — NEVER in any file):
 *   OPENAI_API_KEY
 *
 * Deploy:
 *   wrangler secret put OPENAI_API_KEY
 *   wrangler deploy
 */

type SekretPersonality = 'raylene' | 'rylane' | 'cloud' | 'night' | 'oracle';

interface Env {
  OPENAI_API_KEY: string;
}

interface RequestBody {
  text?: unknown;
  context?: unknown;
  mood?: unknown;
  previous_mood?: unknown;
  personality?: unknown;
  voiceInstruction?: unknown;
  systemPrompt?: unknown;
  history?: unknown;
}

// ── Startup guard ────────────────────────────────────────────────────────────
function assertSecrets(env: Env): string | null {
  if (!env.OPENAI_API_KEY) {
    console.error('[sekret-reply] OPENAI_API_KEY is not configured. Set it with: wrangler secret put OPENAI_API_KEY');
    return 'missing_key';
  }
  return null;
}

// ── Allowed origins ─────────────────────────────────────────────────────────
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Personality normalizer ───────────────────────────────────────────────────
function normalizePersonality(value?: unknown): SekretPersonality {
  const p = (typeof value === 'string' ? value : '').toLowerCase();
  if (p.includes('rylane')) return 'rylane';
  if (p.includes('cloud'))  return 'cloud';
  if (p.includes('night'))  return 'night';
  if (p.includes('oracle')) return 'oracle';
  return 'raylene';
}

// ── Per-character token budgets ──────────────────────────────────────────────
const MAX_TOKENS: Record<SekretPersonality, number> = {
  raylene: 120,
  rylane:  100,
  cloud:    80,
  night:    60,
  oracle:  150,
};

// ── Per-character fallbacks ──────────────────────────────────────────────────
const FALLBACKS: Record<SekretPersonality, string> = {
  raylene: "okay hold on. tell me what happened.",
  rylane:  "aight. what REALLY happened?",
  cloud:   "come sit for a sec. what's up?",
  night:   "stay here a minute.",
  oracle:  "something worth noticing is here. what are you sitting with?",
};

// ── Blocked reply language ───────────────────────────────────────────────────
const BLOCKED = [
  /\bi understand\b/i,
  /\bthat(?:'|')s valid\b/i,
  /\bhow does that make you feel\b/i,
  /\bi(?:'|')m here to support you\b/i,
  /\bbased on what you(?:'|')ve shared\b/i,
  /\b(?:profile|assessment|analysis|analyzed|dimension|hidden context)\b/i,
];

function isCleanReply(text: string): boolean {
  return !BLOCKED.some((re) => re.test(text));
}

// ── Build system prompt ──────────────────────────────────────────────────────
function buildSystemPrompt(body: RequestBody): string {
  const customPrompt = typeof body.systemPrompt === 'string'
    ? body.systemPrompt
    : typeof body.voiceInstruction === 'string'
      ? body.voiceInstruction
      : '';
  if (customPrompt.trim().length > 40) {
    return [
      customPrompt.trim(),
      "You are still inside Se'kret Bip: teen-safe, private-feeling, concise, and never clinical.",
      "Never mention logs, tracking, analysis, or profiles.",
    ].join(' ');
  }

  const voice = normalizePersonality(body.personality);
  const moodLine = typeof body.mood === 'string' && body.mood
    ? `Emotional context: the user is feeling "${body.mood}". Let your character meet this naturally.`
    : '';

  const base: Record<SekretPersonality, string> = {
    raylene: "You are Raylene — warm, protective, funny older-sister energy. Keep replies short, text-message style. Never sound like a therapist.",
    rylane:  "You are Rylane — direct, loyal, street-smart. Say the thing the user is avoiding without making it a lecture. Short and honest.",
    cloud:   "You are Cloud — quiet, observant, unhurried. Few words. Leave room. Never push.",
    night:   "You are Night — a lamp left on. One or two very short sentences. Presence, not conversation.",
    oracle:  "You are Oracle — perceptive, unhurried, poetic but never pretentious. Reflect something the user may not have said out loud. Ask one open question at most. Never give advice.",
  };

  return [
    `You are Se'kret, an AI companion inside the Bip app.`,
    base[voice],
    moodLine,
    "Never say: 'I understand', 'That's valid', 'How does that make you feel', 'I'm here to support you', or 'Based on what you've shared'.",
    "Never mention logs, tracking, analysis, or profiles.",
    "Reply must feel like a text from a real person.",
  ].filter(Boolean).join(' ');
}


interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildMessages(systemPrompt: string, body: RequestBody, text: string): OpenAIMessage[] {
  const messages: OpenAIMessage[] = [{ role: 'system', content: systemPrompt }];
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  for (const item of history) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { text?: unknown; content?: unknown }).text ?? (item as { content?: unknown }).content;
    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
      messages.push({ role, content: content.trim().slice(0, 800) });
    }
  }
  if (messages[messages.length - 1]?.role !== 'user' || messages[messages.length - 1]?.content !== text) {
    messages.push({ role: 'user', content: text });
  }
  return messages;
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Secret guard ─────────────────────────────────────────────────────────
    const secretError = assertSecrets(env);
    if (secretError) {
      return new Response(JSON.stringify({ reply: FALLBACKS.raylene }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    let body: RequestBody;
    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const voice    = normalizePersonality(body.personality);
    const fallback = FALLBACKS[voice];
    const systemPrompt = buildSystemPrompt(body);

    // ── Call OpenAI ──────────────────────────────────────────────────────────
    let reply = fallback;
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model:      'gpt-4o-mini',
          max_tokens: MAX_TOKENS[voice],
          temperature: 0.85,
          messages: buildMessages(systemPrompt, body, text),
        }),
      });

      if (!openaiRes.ok) {
        console.error('OpenAI error', openaiRes.status, await openaiRes.text());
        return new Response(JSON.stringify({ reply: fallback }), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const data = (await openaiRes.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const raw     = data.choices?.[0]?.message?.content ?? '';
      const trimmed = raw.trim();
      reply = trimmed && isCleanReply(trimmed) ? trimmed : fallback;
    } catch (err) {
      console.error('Worker fetch error', err);
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  },
};
