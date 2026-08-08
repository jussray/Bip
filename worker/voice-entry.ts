import observedWorker from './observed-index';
import emailRouter from './email-router';
import { authenticate, type AuthEnv } from './auth';
import { normalizeReplyActor, resolveRuntimeStyle } from './runtime-style';
import { selectVoiceRoute, type CharacterId } from './voice-routing';
import { synthesizeRoutedVoice, type VoiceProviderEnv } from './voice-providers';

interface MinimalExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface WorkerVersionMetadata {
  id: string;
  tag?: string;
  timestamp: string;
}

interface Env extends AuthEnv, VoiceProviderEnv {
  ALLOWED_ORIGINS?: string;
  VOICE_PROVIDER_MODE?: 'legacy' | 'cloudflare-only' | 'hybrid';
  SEKRET_RATE_LIMITER?: RateLimit;
  CF_VERSION_METADATA?: WorkerVersionMetadata;
}

function allowedOrigins(env: Env): string[] | null {
  const configured = env.ALLOWED_ORIGINS?.trim();
  if (!configured || configured === '*') return null;
  return configured.split(',').map((value) => value.trim()).filter(Boolean);
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const allowed = allowedOrigins(env);
  const origin = request.headers.get('Origin');
  const allowOrigin = !allowed ? '*' : origin && allowed.includes(origin) ? origin : (allowed[0] ?? 'null');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

function json(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function originRejected(request: Request, env: Env, cors: Record<string, string>): Response | null {
  const allowed = allowedOrigins(env);
  if (!allowed) return null;
  const origin = request.headers.get('Origin');
  if (!origin || allowed.includes(origin)) return null;
  return json({ error: 'origin not allowed' }, 403, cors);
}

function hasJsonContentType(request: Request): boolean {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  return contentType === 'application/json' || contentType.endsWith('+json');
}

function requiresPreciseLipSync(body: Record<string, unknown>): boolean {
  return body.requiresPreciseLipSync === true
    || body.includeTiming === true
    || body.lipSync === 'precise';
}

async function enforceRateLimit(
  request: Request,
  env: Env,
  principal: { kind: string; userId?: string },
  cors: Record<string, string>,
): Promise<Response | null> {
  if (!env.SEKRET_RATE_LIMITER) return null;
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const key = principal.kind === 'user' && principal.userId ? `user:${principal.userId}` : `ip:${ip}`;
  try {
    const { success } = await env.SEKRET_RATE_LIMITER.limit({ key });
    return success ? null : json({ error: 'rate limit exceeded' }, 429, cors);
  } catch (error) {
    console.error('[voice-entry:rate-limit]', error);
    return null;
  }
}

function workerVersionEvidence(env: Env) {
  const version = env.CF_VERSION_METADATA;
  if (!version) return null;
  return {
    id: version.id,
    tag: version.tag ?? null,
    timestamp: version.timestamp,
  };
}

async function handleVoice(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  if (!hasJsonContentType(request)) return json({ error: 'content-type must be application/json' }, 415, cors);

  const auth = await authenticate(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status, cors);
  const limited = await enforceRateLimit(request, env, auth.principal, cors);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON' }, 400, cors);
  }

  const text = (
    typeof body.reply === 'string' ? body.reply
      : typeof body.text === 'string' ? body.text
        : ''
  ).trim();
  if (!text) return json({ error: 'reply is required' }, 400, cors);

  const actorId = normalizeReplyActor(body.characterId ?? body.personality);
  if (!actorId) {
    return json({ error: 'characterId must be suhana, sy, cloud, night, sekret, or parentCoach' }, 400, cors);
  }

  const mode = env.VOICE_PROVIDER_MODE ?? 'legacy';
  if (mode === 'legacy') {
    return observedWorker.fetch(request, env as never, { waitUntil() {} });
  }

  const requestedCharacter = typeof body.characterId === 'string'
    ? body.characterId.trim().toLowerCase() as CharacterId
    : actorId as CharacterId;
  const route = selectVoiceRoute({
    characterId: requestedCharacter,
    requiresPreciseLipSync: mode === 'hybrid' && requiresPreciseLipSync(body),
  });

  try {
    const result = await synthesizeRoutedVoice(route, text, env);
    const style = resolveRuntimeStyle(actorId);
    return json({
      audioBase64: result.audioBase64,
      contentType: result.contentType,
      characterId: route.canonicalCharacterId,
      actorRole: style.role,
      voiceProvider: result.provider,
      primaryVoiceProvider: result.primaryProvider,
      voiceSource: result.provider,
      voiceId: result.voiceId,
      model: result.model,
      usedFallback: result.usedFallback,
      timing: result.timing,
      aiGenerated: true,
      textStyleVersion: style.textStyleVersion,
      speechStyleVersion: style.speechStyleVersion,
      questionBudget: style.maxQuestions,
      styleDecision: 'allow',
    }, 200, cors);
  } catch (error) {
    console.error('[voice-entry:synthesis]', {
      actorId,
      provider: route.provider,
      fallbackProvider: route.fallbackProvider,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return json({
      error: 'voice synthesis unavailable',
      characterId: route.canonicalCharacterId,
      voiceProvider: route.provider,
      fallbackProvider: route.fallbackProvider,
      usedFallback: Boolean(route.fallbackProvider),
    }, 502, cors);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: MinimalExecutionContext): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const blocked = originRejected(request, env, cors);
    if (blocked) return blocked;

    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/health') {
      const response = await observedWorker.fetch(request, env as never, ctx);
      if (!response.ok) return response;
      try {
        const data = await response.clone().json() as Record<string, unknown>;
        return json({
          ...data,
          version: workerVersionEvidence(env),
        }, response.status, cors);
      } catch (error) {
        console.error('[voice-entry:health]', {
          error: error instanceof Error ? error.message : 'invalid delegated health response',
        });
        return json({
          ok: false,
          worker: 'sekret-backend',
          router: 'voice-entry',
          error: 'invalid delegated health response',
          version: workerVersionEvidence(env),
        }, 502, cors);
      }
    }

    if (request.method === 'POST' && path.endsWith('/api/sekret/voice')) {
      return handleVoice(request, env, cors);
    }

    return observedWorker.fetch(request, env as never, ctx);
  },

  async email(message: Parameters<typeof emailRouter.email>[0]): Promise<void> {
    await emailRouter.email(message);
  },
};
