/**
 * worker/index.ts — Entry-point router for the Bip Cloudflare Worker.
 *
 * Auth:        BIP_CLIENT_TOKEN bearer token (timing-safe). Replace with
 *              Supabase JWT in Phase 2 without touching route handlers.
 * Rate limits: Native CF binding — 60 rpm reply, 20 rpm voice/transcribe.
 * CORS:        Authorization added to Allow-Headers. OPTIONS never blocked.
 */
import worker from './sekret-reply';
import { synthesizeWithPiper, type PiperTtsEnv, type PiperCharacterId } from './piper-tts';
import { verifyRequest, CORS_HEADERS, type AuthEnv } from './auth';
import { checkRateLimit, type RateLimitEnv } from './rate-limit';

type CharacterId = 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret';

interface Env extends PiperTtsEnv, AuthEnv, RateLimitEnv {
  OPENAI_API_KEY?: string;
}

const CHARACTER_FALLBACKS: Record<CharacterId, string[]> = {
  raylene: ["Hey! Random or did something actually happen?","That's valid. We can be random, nosy, calm, or chaotic.","See, now I need to know what was funny","Okay what happened, break it down.","Girl, okay. What really happened?"],
  rylane:  ["Aight, I'm here. Talk.","Bet. Nothing days count too. You tryna chill or find something to get into?","Right lol. But for real though.","What's going on? All of it.","Say the real version. What's going on?"],
  cloud:   ["Hey. No pressure — what's on your mind or nothing at all?","That's okay. We can just vibe.","Yeah. What's the kind of vibe today?","No rush. Start wherever feels okay.","We don't have to fix anything. Just talk."],
  night:   ["Hey. You trying to talk, plan, or just sit in it?","Nothing-nothing or something on your mind?","Right. But for real — what's actually going on?","Okay, I'm here. What you bringing?","Say more. What's the actual thing?"],
  sekret:  ["Something brought you here — what is it?","Sometimes you show up before the words do. We can start anywhere.","I'm here. No agenda. Where do you want to start?","You showed up. That means something. What's the thing?","There's something circling. What is it?"],
};

function normalizeCharacter(value: unknown): CharacterId {
  const raw = typeof value === 'string' ? value.toLowerCase().replace(/['']/g, '') : '';
  if (raw.includes('rylane')) return 'rylane';
  if (raw.includes('cloud')) return 'cloud';
  if (raw.includes('night')) return 'night';
  if (raw.includes('sekret') || raw === 'secret' || raw === 'oracle') return 'sekret';
  return 'raylene';
}

function normalizePiperCharacter(value: unknown): PiperCharacterId {
  const raw = typeof value === 'string' ? value.toLowerCase().replace(/['']/g, '') : '';
  if (raw.includes('parentcoach') || raw.includes('parent_coach') || raw.includes('parent-coach')) return 'parentCoach';
  return normalizeCharacter(value);
}

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

    const path = new URL(request.url).pathname;

    if (request.method === 'GET' && path.endsWith('/health')) return jsonResponse({ status: 'ok' });

    const auth = await verifyRequest(request, env);
    if (!auth.ok) return auth.response;

    if (request.method === 'POST' && path.endsWith('/api/sekret/voice') && env.PIPER_TTS_URL?.trim()) {
      const limited = await checkRateLimit(request, env, 'voice');
      if (limited) return limited;
      let body: Record<string, unknown>;
      try { body = await request.clone().json() as Record<string, unknown>; }
      catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
      const text = (typeof body.reply === 'string' ? body.reply : typeof body.text === 'string' ? body.text : '').trim();
      if (!text) return jsonResponse({ error: 'reply is required' }, 400);
      const characterId = normalizePiperCharacter(body.characterId);
      try {
        const audio = await synthesizeWithPiper({ text, characterId, env });
        if (audio) return jsonResponse({ audioBase64: toBase64(audio.bytes), contentType: audio.contentType, characterId, voiceSource: 'piper', voiceId: audio.voice, aiGenerated: true });
      } catch (error) {
        console.error('[sekret/voice:piper]', error);
        if (!env.OPENAI_API_KEY) return jsonResponse({ error: 'piper tts failed' }, 502);
      }
    }

    if (request.method === 'POST' && path.endsWith('/api/sekret/reply') && !env.OPENAI_API_KEY) {
      const limited = await checkRateLimit(request, env, 'reply');
      if (limited) return limited;
      let body: Record<string, unknown>;
      try { body = await request.clone().json() as Record<string, unknown>; }
      catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
      const userText = (typeof body.userText === 'string' ? body.userText : typeof body.text === 'string' ? body.text : '').trim();
      if (!userText) return jsonResponse({ error: 'userText is required' }, 400);
      const characterId = normalizeCharacter(body.characterId ?? body.personality);
      const options = CHARACTER_FALLBACKS[characterId];
      console.error('[sekret/reply] OPENAI_API_KEY is not configured — serving fallback');
      return jsonResponse({ reply: options[stableHash(`${characterId}:${userText.toLowerCase()}`) % options.length], tone: 'casual', safetyFlag: false, parentShareSummary: null, suggestedComfortTool: null, replySource: 'fallback', detectedIntent: 'greeting', usedGreetingVariant: false });
    }

    const rateLimitRoute = path.endsWith('/api/sekret/transcribe') ? 'transcribe' : path.endsWith('/api/sekret/voice') ? 'voice' : 'reply';
    const limited = await checkRateLimit(request, env, rateLimitRoute);
    if (limited) return limited;

    return worker.fetch(request, env as { OPENAI_API_KEY: string });
  },
};
