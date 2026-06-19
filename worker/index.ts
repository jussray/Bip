import worker from './sekret-reply';

type CharacterId = 'raylene' | 'rylane' | 'cloud' | 'night';

interface Env {
  OPENAI_API_KEY?: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CHARACTER_FALLBACKS: Record<CharacterId, string> = {
  raylene: "Girl, hold on. What part of this is actually bothering you the most?",
  rylane: "Aight, run it back. What happened, and what part got under your skin?",
  cloud: "No rush. We can make this smaller before we talk about all of it.",
  night: "You still got time to do something with this tonight. Are we trying to understand it, plan it, or finish one small part?",
};

function normalizeCharacter(value: unknown): CharacterId {
  const raw = typeof value === 'string' ? value.toLowerCase() : '';
  if (raw.includes('rylane')) return 'rylane';
  if (raw.includes('cloud')) return 'cloud';
  if (raw.includes('night')) return 'night';
  return 'raylene';
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;

    if (request.method === 'POST' && path.endsWith('/api/sekret/reply') && !env.OPENAI_API_KEY) {
      let body: Record<string, unknown>;
      try {
        body = await request.clone().json() as Record<string, unknown>;
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }

      const userText = (
        typeof body.userText === 'string'
          ? body.userText
          : typeof body.text === 'string'
            ? body.text
            : ''
      ).trim();

      if (!userText) return json({ error: 'userText is required' }, 400);

      const characterId = normalizeCharacter(body.characterId ?? body.personality);

      console.error('[sekret/reply] AI service secret is not configured');

      return json({
        reply: CHARACTER_FALLBACKS[characterId],
        tone: `${characterId}-fallback`,
        safetyFlag: false,
        parentShareSummary: null,
        suggestedComfortTool: characterId === 'night' ? 'plan-next-step' : 'journal',
      });
    }

    return worker.fetch(request, env as { OPENAI_API_KEY: string });
  },
};
