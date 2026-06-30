import worker from './sekret-reply';
import { authenticateRequest, type AuthEnv } from './auth';
import { checkRateLimit, type ProtectedRoute, type RateLimitEnv } from './rate-limit';
import { synthesizeWithPiper, type PiperTtsEnv, type PiperCharacterId } from './piper-tts';

type CharacterId = 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret';

interface Env extends PiperTtsEnv, AuthEnv, RateLimitEnv {
  OPENAI_API_KEY?: string;
  CORS_ALLOWED_ORIGINS?: string;
}

const CHARACTER_FALLBACKS: Record<CharacterId, string[]> = {
  raylene: [
    'Hey! Random or did something actually happen?',
    "That's valid. We can be random, nosy, calm, or chaotic.",
    'See, now I need to know what was funny 😭',
    'Okay what happened, break it down.',
    'Girl, okay. What really happened?',
  ],
  rylane: [
    "Aight, I'm here. Talk.",
    'Bet. Nothing days count too. You tryna chill or find something to get into?',
    'Right lol. But for real though.',
    "What's going on? All of it.",
    "Say the real version. What's going on?",
  ],
  cloud: [
    "Hey. No pressure — what's on your mind or nothing at all?",
    "That's okay. We can just vibe.",
    "Yeah. What's the kind of vibe today?",
    'No rush. Start wherever feels okay.',
    "We don't have to fix anything. Just talk.",
  ],
  night: [
    'Hey. You trying to talk, plan, or just sit in it?',
    'Nothing-nothing or something on your mind?',
    "Right. But for real — what's actually going on?",
    "Okay, I'm here. What you bringing?",
    "Say more. What's the actual thing?",
  ],
  sekret: [
    'Something brought you here — what is it?',
    'Sometimes you show up before the words do. We can start anywhere.',
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

function allowedOrigins(env: Env): Set<string> {
  return new Set(
    (env.CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  if (origin && allowedOrigins(env).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function json(
  request: Request,
  env: Env,
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      ...extraHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function protectedRoute(path: string): ProtectedRoute | null {
  if (path.endsWith('/api/sekret/reply')) return 'reply';
  if (path.endsWith('/api/sekret/voice')) return 'voice';
  if (path.endsWith('/api/sekret/transcribe')) return 'transcribe';
  return null;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    const route = protectedRoute(path);

    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('Origin');
      if (origin && !allowedOrigins(env).has(origin)) {
        return json(request, env, { error: 'origin_not_allowed' }, 403);
      }
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method === 'POST' && route) {
      const auth = authenticateRequest(request, env);
      if (!auth.ok) {
        return json(request, env, { error: auth.error }, auth.status);
      }

      const rateLimit = await checkRateLimit(request, env, route);
      if (!rateLimit.allowed) {
        return json(
          request,
          env,
          {
            error: 'rate_limit_exceeded',
            route,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
          429,
          { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        );
      }
    }

    if (request.method === 'POST' && path.endsWith('/api/sekret/voice') && env.PIPER_TTS_URL?.trim()) {
      let body: Record<string, unknown>;
      try {
        body = await request.clone().json() as Record<string, unknown>;
      } catch {
        return json(request, env, { error: 'Invalid JSON' }, 400);
      }

      const text = (
        typeof body.reply === 'string' ? body.reply
          : typeof body.text === 'string' ? body.text
            : ''
      ).trim();
      if (!text) return json(request, env, { error: 'reply is required' }, 400);

      const characterId = normalizePiperCharacter(body.characterId);
      try {
        const audio = await synthesizeWithPiper({ text, characterId, env });
        if (audio) {
          return json(request, env, {
            audioBase64: toBase64(audio.bytes),
            contentType: audio.contentType,
            characterId,
            voiceSource: 'piper',
            voiceId: audio.voice,
            aiGenerated: true,
          });
        }
      } catch (error) {
        console.error('[sekret/voice:piper]', error);
        if (!env.OPENAI_API_KEY) return json(request, env, { error: 'piper tts failed' }, 502);
      }
    }

    if (request.method === 'POST' && path.endsWith('/api/sekret/reply') && !env.OPENAI_API_KEY) {
      let body: Record<string, unknown>;
      try {
        body = await request.clone().json() as Record<string, unknown>;
      } catch {
        return json(request, env, { error: 'Invalid JSON' }, 400);
      }

      const userText = (
        typeof body.userText === 'string' ? body.userText
          : typeof body.text === 'string' ? body.text
            : ''
      ).trim();

      if (!userText) return json(request, env, { error: 'userText is required' }, 400);

      const characterId = normalizeCharacter(body.characterId ?? body.personality);
      const options = CHARACTER_FALLBACKS[characterId];
      const start = stableHash(`${characterId}:${userText.toLowerCase()}`) % options.length;

      console.error('[sekret/reply] OPENAI_API_KEY is not configured — serving fallback');

      return json(request, env, {
        reply: options[start],
        tone: 'casual',
        safetyFlag: false,
        parentShareSummary: null,
        suggestedComfortTool: null,
        replySource: 'fallback',
        detectedIntent: 'greeting',
        usedGreetingVariant: false,
      });
    }

    return withCors(
      await worker.fetch(request, env as { OPENAI_API_KEY: string }),
      request,
      env,
    );
  },
};
