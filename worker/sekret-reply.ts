/**
 * Se'kret Brain + Voice Worker
 *
 * Routes:
 *   POST /api/sekret/reply  -> companion brain JSON
 *   POST /api/sekret/voice  -> OpenAI TTS audio for an existing reply
 *
 * Holds OPENAI_API_KEY as a Worker secret. Never expose this key to Expo.
 */

import { getWorkerCompanionRole, ORACLE_HIDDEN_GUIDANCE } from './companion-curriculum';

type CharacterId = 'raylene' | 'rylane' | 'cloud' | 'night';
type Surface = 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge';

interface Env { OPENAI_API_KEY: string }

interface ReplyRequestBody {
  characterId?: unknown;
  surface?: unknown;
  mood?: unknown;
  userText?: unknown;
  memory?: unknown;
  parentSharingEnabled?: unknown;
  // legacy client fields
  text?: unknown;
  context?: unknown;
  personality?: unknown;
  history?: unknown;
}

interface VoiceRequestBody {
  reply?: unknown;
  text?: unknown;
  characterId?: unknown;
  voice?: unknown;
  format?: unknown;
}

interface CompanionReply {
  reply: string;
  tone: string;
  safetyFlag: boolean;
  parentShareSummary: string | null;
  suggestedComfortTool: string | null;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CHARACTER_FALLBACKS: Record<CharacterId, string> = {
  raylene: "I'm glad you put words to it. I'm an AI companion, not a person, but I can help you slow it down: what part feels loudest right now?",
  rylane: "Good you said it. I'm an AI companion, not a human, so don't make me your only place with this — what's the real part?",
  cloud: "No rush. I'm an AI companion, and we can make this smaller for one breath.",
  night: "Stay close. I'm an AI companion, not a person; if this is too heavy, get a real safe person near you.",
};

const CRISIS_RE = /\b(kill myself|end my life|want to die|suicid(?:e|al)|self[- ]?harm|hurt myself|cut myself|disappear forever|run away|abuse|abused|assault|unsafe|not safe|danger|emergency)\b/i;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

function normalizeCharacter(value: unknown): CharacterId {
  const raw = typeof value === 'string' ? value.toLowerCase() : '';
  if (raw.includes('rylane')) return 'rylane';
  if (raw.includes('cloud')) return 'cloud';
  if (raw.includes('night')) return 'night';
  return 'raylene';
}

function normalizeSurface(value: unknown): Surface {
  const raw = typeof value === 'string' ? value : '';
  if (raw === 'voiceBip' || raw === 'comfort' || raw === 'circle' || raw === 'parentBridge' || raw === 'journal') return raw;
  if (raw === 'pages') return 'journal';
  return 'journal';
}

function safeMemory(value: unknown): string {
  if (!value || typeof value !== 'object') return 'none';
  return JSON.stringify(value).slice(0, 1200);
}

function crisisReply(characterId: CharacterId, parentSharingEnabled: boolean): CompanionReply {
  const lead = characterId === 'rylane'
    ? "Real talk: your safety comes first."
    : characterId === 'cloud'
      ? "Pause with me for one breath. Your safety matters first."
      : characterId === 'night'
        ? "Stay here for this moment. Get a real person close."
        : "Love, this is bigger than holding it alone right now.";
  return {
    reply: `${lead} I'm an AI companion, not a human or emergency service. If you might hurt yourself, someone is hurting you, or you are in danger, tell a trusted adult now and call 911 if it is immediate. In the U.S. you can call or text 988, or text HOME to 741741.`,
    tone: 'supportive-safety',
    safetyFlag: true,
    parentShareSummary: parentSharingEnabled ? 'Safety concern: teen may need trusted adult or emergency support.' : null,
    suggestedComfortTool: 'safety-plan',
  };
}

function buildBrainPrompt(characterId: CharacterId, surface: Surface, mood?: string, memory?: unknown, parentSharingEnabled?: boolean): string {
  return [
    ORACLE_HIDDEN_GUIDANCE,
    getWorkerCompanionRole(characterId),
    `Surface: ${surface}. Mood: ${mood || 'not provided'}. Teen-safe memory summary: ${safeMemory(memory)}.`,
    `Parent sharing enabled: ${Boolean(parentSharingEnabled)}. Only create parentShareSummary for safety concerns or when sharing is enabled and the summary is teen-safe; never expose private journal text verbatim.`,
    'Never encourage dependency. Encourage real trusted people, breaks, journaling, grounding, or safety support when appropriate.',
    'If self-harm, disappearing, abuse, danger, or crisis appears, use supportive safety language and encourage trusted adult/emergency help.',
    'Replies should usually be one to four short conversational sentences and may comfort, reflect, gently challenge, motivate, plan, celebrate, teach, or redirect depending on context.',
    'Return only valid JSON with keys reply, tone, safetyFlag, parentShareSummary, suggestedComfortTool. No markdown.',
  ].join('\n');
}

async function handleReply(request: Request, env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) return json({ ...crisisReply('raylene', false), safetyFlag: false, reply: CHARACTER_FALLBACKS.raylene });
  let body: ReplyRequestBody;
  try { body = await request.json() as ReplyRequestBody; } catch { return json({ error: 'Invalid JSON' }, 400); }
  const userText = (typeof body.userText === 'string' ? body.userText : typeof body.text === 'string' ? body.text : '').trim();
  if (!userText) return json({ error: 'userText is required' }, 400);
  const characterId = normalizeCharacter(body.characterId ?? body.personality);
  const surface = normalizeSurface(body.surface ?? body.context);
  const parentSharingEnabled = body.parentSharingEnabled === true;
  if (CRISIS_RE.test(userText)) return json(crisisReply(characterId, parentSharingEnabled));

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 260, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildBrainPrompt(characterId, surface, typeof body.mood === 'string' ? body.mood : undefined, body.memory, parentSharingEnabled) },
          { role: 'user', content: userText.slice(0, 4000) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}') as Partial<CompanionReply>;
    return json({
      reply: String(parsed.reply || CHARACTER_FALLBACKS[characterId]),
      tone: String(parsed.tone || characterId),
      safetyFlag: Boolean(parsed.safetyFlag),
      parentShareSummary: typeof parsed.parentShareSummary === 'string' ? parsed.parentShareSummary : null,
      suggestedComfortTool: typeof parsed.suggestedComfortTool === 'string' ? parsed.suggestedComfortTool : null,
    });
  } catch (err) {
    console.error('[sekret/reply]', err);
    return json({ reply: CHARACTER_FALLBACKS[characterId], tone: characterId, safetyFlag: false, parentShareSummary: null, suggestedComfortTool: 'journal' });
  }
}

async function handleVoice(request: Request, env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) return json({ error: 'voice unavailable' }, 503);
  let body: VoiceRequestBody;
  try { body = await request.json() as VoiceRequestBody; } catch { return json({ error: 'Invalid JSON' }, 400); }
  const text = (typeof body.reply === 'string' ? body.reply : typeof body.text === 'string' ? body.text : '').trim();
  if (!text) return json({ error: 'reply is required' }, 400);
  const characterId = normalizeCharacter(body.characterId);
  const voiceMap: Record<CharacterId, string> = { raylene: 'nova', rylane: 'onyx', cloud: 'shimmer', night: 'alloy' };
  const format = body.format === 'opus' || body.format === 'aac' || body.format === 'flac' || body.format === 'wav' ? body.format : 'mp3';
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: voiceMap[characterId], input: text.slice(0, 4000), response_format: format }),
  });
  if (!res.ok) return json({ error: 'tts failed' }, 502);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return json({ audioBase64: btoa(binary), contentType: `audio/${format === 'mp3' ? 'mpeg' : format}`, characterId });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const path = new URL(request.url).pathname;
    if (path.endsWith('/api/sekret/voice')) return handleVoice(request, env);
    if (path.endsWith('/api/sekret/reply')) return handleReply(request, env);
    return json({ error: 'Not found' }, 404);
  },
};
