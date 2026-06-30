import worker from './sekret-reply';
import { synthesizeWithPiper, type PiperTtsEnv, type PiperCharacterId } from './piper-tts';
import { authenticate, type AuthEnv, type Principal } from './auth';

type CharacterId = 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret';

/** Cloudflare Workers Rate Limiting binding (GA). See wrangler.toml [[ratelimits]]. */
interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface Env extends PiperTtsEnv, AuthEnv {
  OPENAI_API_KEY?: string;
  /** Per-key request limiter; when unbound, rate limiting is skipped. */
  SEKRET_RATE_LIMITER?: RateLimit;
  /**
   * Comma-separated browser origins allowed via CORS. When unset (or '*'),
   * the permissive wildcard is preserved. Native mobile sends no Origin and
   * is unaffected either way; this gates cross-origin browser callers.
   */
  ALLOWED_ORIGINS?: string;
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const configured = env.ALLOWED_ORIGINS?.trim();
  let allowOrigin = '*';
  if (configured && configured !== '*') {
    const allowed = configured.split(',').map((o) => o.trim()).filter(Boolean);
    const origin = request.headers.get('Origin');
    allowOrigin = origin && allowed.includes(origin) ? origin : (allowed[0] ?? 'null');
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

const CHARACTER_FALLBACKS: Record<CharacterId, string[]> = {
  raylene: [
    "Hey! Random or did something actually happen?",
    "That's valid. We can be random, nosy, calm, or chaotic.",
    "See, now I need to know what was funny 😭",
    "Okay what happened, break it down.",
    "Girl, okay. What really happened?",
  ],
  rylane: [
    "Aight, I'm here. Talk.",
    "Bet. Nothing days count too. You tryna chill or find something to get into?",
    "Right lol. But for real though.",
    "What's going on? All of it.",
    "Say the real version. What's going on?",
  ],
  cloud: [
    "Hey. No pressure — what's on your mind or nothing at all?",
    "That's okay. We can just vibe.",
    "Yeah. What's the kind of vibe today?",
    "No rush. Start wherever feels okay.",
    "We don't have to fix anything. Just talk.",
  ],
  night: [
    "Hey. You trying to talk, plan, or just sit in it?",
    "Nothing-nothing or something on your mind?",
    "Right. But for real — what's actually going on?",
    "Okay, I'm here. What you bringing?",
    "Say more. What's the actual thing?",
  ],
  sekret: [
    "Something brought you here — what is it?",
    "Sometimes you show up before the words do. We can start anywhere.",
    "I'm here. No agenda. Where do you want to start?",
    "You showed up. That means something. What's the thing?",
    "There's something circling. What is it?",
  ],
};

function normalizeCharacter(value: unknown): CharacterId {
  const raw = typeof value === 'string' ? value.toLowerCase().replace(/[’']/g, '') : '';
  if (raw.includes('rylane')) return 'rylane';
  if (raw.includes('cloud')) return 'cloud';
  if (raw.includes('night')) return 'night';
  if (raw.includes('sekret') || raw === 'secret' || raw === 'oracle') return 'sekret';
  return 'raylene';
}

function normalizePiperCharacter(value: unknown): PiperCharacterId {
  const raw = typeof value === 'string' ? value.toLowerCase().replace(/[’']/g, '') : '';
  if (raw.includes('parentcoach') || raw.includes('parent_coach') || raw.includes('parent-coach')) return 'parentCoach';
  return normalizeCharacter(value);
}

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function json(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/**
 * Enforce the per-key rate limit. Keys by authenticated user when available,
 * otherwise by client IP. Returns a 429 Response when over the limit, or null
 * to proceed. Fails open (logs, proceeds) if the limiter errors, and is a
 * no-op when the binding is not configured.
 */
async function enforceRateLimit(
  request: Request,
  env: Env,
  principal: Principal,
  cors: Record<string, string>,
): Promise<Response | null> {
  const limiter = env.SEKRET_RATE_LIMITER;
  if (!limiter) return null;

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const key = principal.kind === 'user' ? `user:${principal.userId}` : `ip:${ip}`;
  try {
    const { success } = await limiter.limit({ key });
    if (!success) return json({ error: 'rate limit exceeded' }, 429, cors);
  } catch (error) {
    console.error('[rate-limit]', error);
  }
  return null;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const path = new URL(request.url).pathname;

    // Gate every authenticated API route behind shared-token auth + rate
    // limiting. Non-/api routes (e.g. GET /health reachability checks) pass
    // through untouched.
    if (request.method === 'POST' && path.includes('/api/')) {
      const auth = await authenticate(request, env);
      if (!auth.ok) return json({ error: auth.error }, auth.status, cors);

      const limited = await enforceRateLimit(request, env, auth.principal, cors);
      if (limited) return limited;
    }

    if (request.method === 'POST' && path.endsWith('/api/sekret/voice') && env.PIPER_TTS_URL?.trim()) {
      let body: Record<string, unknown>;
      try {
        body = await request.clone().json() as Record<string, unknown>;
      } catch {
        return json({ error: 'Invalid JSON' }, 400, cors);
      }

      const text = (
        typeof body.reply === 'string' ? body.reply
          : typeof body.text === 'string' ? body.text
            : ''
      ).trim();
      if (!text) return json({ error: 'reply is required' }, 400, cors);

      const characterId = normalizePiperCharacter(body.characterId);
      try {
        const audio = await synthesizeWithPiper({ text, characterId, env });
        if (audio) {
          return json({
            audioBase64: toBase64(audio.bytes),
            contentType: audio.contentType,
            characterId,
            voiceSource: 'piper',
            voiceId: audio.voice,
            aiGenerated: true,
          }, 200, cors);
        }
      } catch (error) {
        console.error('[sekret/voice:piper]', error);
        if (!env.OPENAI_API_KEY) return json({ error: 'piper tts failed' }, 502, cors);
      }
    }

    if (request.method === 'POST' && path.endsWith('/api/sekret/reply') && !env.OPENAI_API_KEY) {
      let body: Record<string, unknown>;
      try {
        body = await request.clone().json() as Record<string, unknown>;
      } catch {
        return json({ error: 'Invalid JSON' }, 400, cors);
      }

      const userText = (
        typeof body.userText === 'string' ? body.userText
          : typeof body.text === 'string' ? body.text
            : ''
      ).trim();

      if (!userText) return json({ error: 'userText is required' }, 400, cors);

      const characterId = normalizeCharacter(body.characterId ?? body.personality);
      const options = CHARACTER_FALLBACKS[characterId];
      const start = stableHash(`${characterId}:${userText.toLowerCase()}`) % options.length;

      console.error('[sekret/reply] OPENAI_API_KEY is not configured — serving fallback');

      return json({
        reply: options[start],
        tone: 'casual',
        safetyFlag: false,
        parentShareSummary: null,
        suggestedComfortTool: null,
        replySource: 'fallback',
        detectedIntent: 'greeting',
        usedGreetingVariant: false,
      }, 200, cors);
    }

    return worker.fetch(request, env as { OPENAI_API_KEY: string });
  },
};
