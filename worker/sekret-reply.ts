/**
 * Se'kret Brain + Voice Worker
 *
 * Routes:
 *   POST /api/sekret/reply  -> companion brain JSON
 *   POST /api/sekret/voice  -> OpenAI TTS audio for an existing reply
 *
 * Holds OPENAI_API_KEY and optional custom voice IDs as Worker secrets.
 * Never expose these values to Expo.
 */

import { getWorkerCompanionRole, ORACLE_HIDDEN_GUIDANCE } from './companion-curriculum';

type CharacterId = 'raylene' | 'rylane' | 'cloud' | 'night';
type Surface = 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge';
type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav';
type OpenAIVoice = string | { id: string };
type ConversationRole = 'user' | 'assistant';

interface Env {
  OPENAI_API_KEY: string;
  RAYLENE_VOICE_ID?: string;
  RYLANE_VOICE_ID?: string;
  CLOUD_VOICE_ID?: string;
  NIGHT_VOICE_ID?: string;
}

interface ReplyRequestBody {
  characterId?: unknown;
  surface?: unknown;
  mood?: unknown;
  userText?: unknown;
  memory?: unknown;
  parentSharingEnabled?: unknown;
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

interface TranscribeRequestBody {
  audioBase64?: unknown;
  contentType?: unknown;
}

interface ConversationTurn {
  role: ConversationRole;
  content: string;
}

interface CompanionReply {
  reply: string;
  tone: string;
  safetyFlag: boolean;
  parentShareSummary: string | null;
  suggestedComfortTool: string | null;
  replySource: 'openai' | 'fallback';
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CHARACTER_FALLBACKS: Record<CharacterId, string[]> = {
  raylene: [
    'Okay, I hear you. Which part of that is sitting heaviest on you right now?',
    'You do not have to make it sound neat for me. Say the messy version.',
    'Whew, yeah—that would get under my skin too. Do you need comfort, honesty, or a game plan?',
    'Let’s slow it down, love. What do you wish somebody understood about this?',
    'That sounds like a lot to carry at once. Start with the part you keep replaying.',
    'I caught that. Is this more hurt, anger, embarrassment, or all of it mixed together?',
  ],
  rylane: [
    'Yeah, that is real. What is the part you have not said out loud yet?',
    'Good, you said it. Do you want to vent or figure out your next move?',
    'You do not have to act unbothered in here. Give me the honest version.',
    'Hold up—before you blame yourself, what did the other person actually do?',
    'Let’s keep it simple. What is the one thing you need most right now?',
    'That would throw anybody off. What part can you actually control tonight?',
  ],
  cloud: [
    'We can make this smaller. Take one breath, then tell me the gentlest place to begin.',
    'No rush. You do not have to solve the whole feeling right now.',
    'We do not have to fix it. We can just name what hurts first.',
    'You can pause here. What would make the next five minutes feel a little safer?',
    'I am listening. You can say it slowly, badly, or not all at once.',
    'You are allowed to need softness right now. What kind would actually help?',
  ],
  night: [
    'Yeah… nights make everything talk louder. What thought keeps circling back?',
    'You do not have to pretend you are fine in here. Tell me the version you hide during the day.',
    'Let’s not rush past it. What did this make you believe about yourself?',
    'I hear the weight in that. Do you want truth, quiet, or a next step?',
    'Some things hit different when it gets quiet. What are you afraid this means?',
    'You can sit in the real feeling without becoming it. Name the sharpest part.',
  ],
};

const BUILT_IN_VOICES: Record<CharacterId, string> = {
  raylene: 'nova',
  rylane: 'ash',
  cloud: 'shimmer',
  night: 'onyx',
};

const VOICE_INSTRUCTIONS: Record<CharacterId, string> = {
  raylene: 'Speak like a warm, expressive 15-to-16-year-old girl. Keep the delivery youthful, natural, quick, emotionally present, and conversational. Do not sound childlike, overly polished, clinical, or like an adult narrator. Preserve natural slang and light profanity exactly when it appears in the input.',
  rylane: 'Speak like an approachable 16-to-17-year-old boy. Sound relaxed, smooth, grounded, and conversational with natural pacing. Do not sound like a radio host, therapist, or much older adult. Preserve natural slang and light profanity exactly when it appears in the input.',
  cloud: 'Speak softly and youthfully with a light, calm, airy quality. Keep the flow smooth and comforting without sounding babyish, sleepy, whispery, or overly slow. Preserve the wording exactly.',
  night: 'Speak with a slightly deeper youthful voice and confident late-night energy. Keep the pace natural and a little quicker, grounded and inviting rather than sad, sleepy, ominous, or theatrical. Preserve natural slang and light profanity exactly when it appears in the input.',
};

const CRISIS_RE = /\b(kill myself|end my life|want to die|suicid(?:e|al)|self[- ]?harm|hurt myself|cut myself|disappear forever|run away|abuse|abused|assault|unsafe|not safe|danger|emergency)\b/i;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

function normalizeCharacter(value: unknown): CharacterId | null {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (raw === 'raylene' || raw.includes('raylene')) return 'raylene';
  if (raw === 'rylane' || raw.includes('rylane')) return 'rylane';
  if (raw === 'cloud' || raw.includes('cloud')) return 'cloud';
  if (raw === 'night' || raw.includes('night')) return 'night';
  return null;
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

function normalizeHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];
  const turns: ConversationTurn[] = [];
  for (const item of value.slice(-12)) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const role: ConversationRole | null = record.role === 'assistant' || record.role === 'sekret'
      ? 'assistant'
      : record.role === 'user' || record.role === 'teen'
        ? 'user'
        : null;
    const rawContent = typeof record.content === 'string'
      ? record.content
      : typeof record.text === 'string'
        ? record.text
        : typeof record.reply === 'string'
          ? record.reply
          : '';
    const content = rawContent.trim().slice(0, 1200);
    if (role && content) turns.push({ role, content });
  }
  return turns.slice(-10);
}

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return Math.abs(hash);
}

function getFallbackReply(characterId: CharacterId, userText: string, history: ConversationTurn[]): string {
  const options = CHARACTER_FALLBACKS[characterId];
  const recentReplies = new Set(
    history.filter((turn) => turn.role === 'assistant').slice(-4).map((turn) => turn.content.trim().toLowerCase()),
  );
  const start = stableHash(`${characterId}:${userText.toLowerCase()}`) % options.length;
  for (let offset = 0; offset < options.length; offset += 1) {
    const candidate = options[(start + offset) % options.length];
    if (!recentReplies.has(candidate.toLowerCase())) return candidate;
  }
  return options[start];
}

function getCustomVoiceId(characterId: CharacterId, env: Env): string | undefined {
  const value = characterId === 'raylene'
    ? env.RAYLENE_VOICE_ID
    : characterId === 'rylane'
      ? env.RYLANE_VOICE_ID
      : characterId === 'cloud'
        ? env.CLOUD_VOICE_ID
        : env.NIGHT_VOICE_ID;
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || undefined;
}

function getVoice(characterId: CharacterId, env: Env): { voice: OpenAIVoice; source: 'custom' | 'built-in' } {
  const customVoiceId = getCustomVoiceId(characterId, env);
  if (customVoiceId) return { voice: { id: customVoiceId }, source: 'custom' };
  return { voice: BUILT_IN_VOICES[characterId], source: 'built-in' };
}

function normalizeAudioFormat(value: unknown): AudioFormat {
  return value === 'opus' || value === 'aac' || value === 'flac' || value === 'wav' ? value : 'mp3';
}

function crisisReply(characterId: CharacterId, parentSharingEnabled: boolean): CompanionReply {
  const lead = characterId === 'rylane'
    ? 'Real talk: your safety comes first.'
    : characterId === 'cloud'
      ? 'Pause with me for one breath. Your safety matters first.'
      : characterId === 'night'
        ? 'Stay here for this moment. Get a real person close.'
        : 'Love, this is bigger than holding it alone right now.';
  return {
    reply: `${lead} I'm an AI companion, not a human or emergency service. If you might hurt yourself, someone is hurting you, or you are in danger, tell a trusted adult now and call 911 if it is immediate. In the U.S. you can call or text 988, or text HOME to 741741.`,
    tone: 'supportive-safety',
    safetyFlag: true,
    parentShareSummary: parentSharingEnabled ? 'Safety concern: teen may need trusted adult or emergency support.' : null,
    suggestedComfortTool: 'safety-plan',
    replySource: 'fallback',
  };
}

function buildBrainPrompt(characterId: CharacterId, surface: Surface, mood: string | undefined, memory: unknown, parentSharingEnabled: boolean, history: ConversationTurn[]): string {
  const recentReplies = history
    .filter((turn) => turn.role === 'assistant')
    .slice(-5)
    .map((turn) => `- ${turn.content}`)
    .join('\n') || '- none';
  return [
    ORACLE_HIDDEN_GUIDANCE,
    getWorkerCompanionRole(characterId),
    `Surface: ${surface}. Mood: ${mood || 'not provided'}. Teen-safe memory summary: ${safeMemory(memory)}.`,
    `Parent sharing enabled: ${parentSharingEnabled}. Only create parentShareSummary for safety concerns or when sharing is enabled and the summary is teen-safe; never expose private journal text verbatim.`,
    'Never encourage dependency. Encourage real trusted people, breaks, journaling, grounding, or safety support when appropriate.',
    'Reply directly to the teen’s newest words and carry forward useful details from recent conversation.',
    'Do not reuse an opening, sentence, question, catchphrase, or response structure from recent assistant replies.',
    'Vary naturally between comfort, reflection, light humor, gentle challenge, planning, celebration, teaching, and quiet presence.',
    'Do not always end with a question. Avoid generic therapy filler. Do not repeat that you are an AI unless safety or dependency boundaries require it.',
    `Recent assistant replies to avoid repeating:\n${recentReplies}`,
    'Replies should usually be one to four short conversational sentences.',
    'Return only valid JSON with keys reply, tone, safetyFlag, parentShareSummary, suggestedComfortTool. No markdown.',
  ].join('\n');
}

async function handleReply(request: Request, env: Env): Promise<Response> {
  let body: ReplyRequestBody;
  try { body = await request.json() as ReplyRequestBody; } catch { return json({ error: 'Invalid JSON' }, 400); }
  const userText = (typeof body.userText === 'string' ? body.userText : typeof body.text === 'string' ? body.text : '').trim();
  if (!userText) return json({ error: 'userText is required' }, 400);
  const characterId = normalizeCharacter(body.characterId ?? body.personality);
  if (!characterId) return json({ error: 'characterId must be raylene, rylane, cloud, or night' }, 400);
  const surface = normalizeSurface(body.surface ?? body.context);
  const parentSharingEnabled = body.parentSharingEnabled === true;
  const history = normalizeHistory(body.history);
  if (CRISIS_RE.test(userText)) return json(crisisReply(characterId, parentSharingEnabled));

  const fallbackReply = getFallbackReply(characterId, userText, history);
  if (!env.OPENAI_API_KEY) {
    return json({ reply: fallbackReply, tone: characterId, safetyFlag: false, parentShareSummary: null, suggestedComfortTool: 'journal', replySource: 'fallback' });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.9,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildBrainPrompt(characterId, surface, typeof body.mood === 'string' ? body.mood : undefined, body.memory, parentSharingEnabled, history) },
          ...history,
          { role: 'user', content: userText.slice(0, 4000) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}') as Partial<CompanionReply>;
    const openAIReply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
    if (!openAIReply) throw new Error('OpenAI returned an empty reply');
    return json({
      reply: openAIReply,
      tone: String(parsed.tone || characterId),
      safetyFlag: Boolean(parsed.safetyFlag),
      parentShareSummary: typeof parsed.parentShareSummary === 'string' ? parsed.parentShareSummary : null,
      suggestedComfortTool: typeof parsed.suggestedComfortTool === 'string' ? parsed.suggestedComfortTool : null,
      replySource: 'openai',
    });
  } catch (error) {
    console.error('[sekret/reply]', error);
    return json({ reply: fallbackReply, tone: characterId, safetyFlag: false, parentShareSummary: null, suggestedComfortTool: 'journal', replySource: 'fallback' });
  }
}

async function handleVoice(request: Request, env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) return json({ error: 'voice unavailable' }, 503);
  let body: VoiceRequestBody;
  try { body = await request.json() as VoiceRequestBody; } catch { return json({ error: 'Invalid JSON' }, 400); }
  const text = (typeof body.reply === 'string' ? body.reply : typeof body.text === 'string' ? body.text : '').trim();
  if (!text) return json({ error: 'reply is required' }, 400);

  const characterId = normalizeCharacter(body.characterId);
  if (!characterId) return json({ error: 'characterId must be raylene, rylane, cloud, or night' }, 400);
  const format = normalizeAudioFormat(body.format);
  const selectedVoice = getVoice(characterId, env);
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: selectedVoice.voice,
      input: text.slice(0, 4000),
      instructions: VOICE_INSTRUCTIONS[characterId],
      response_format: format,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[sekret/voice]', res.status, detail.slice(0, 500));
    return json({ error: 'tts failed' }, 502);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return json({
    audioBase64: btoa(binary),
    contentType: `audio/${format === 'mp3' ? 'mpeg' : format}`,
    characterId,
    voiceSource: selectedVoice.source,
    aiGenerated: true,
  });
}

async function handleTranscribe(request: Request, env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) return json({ error: 'transcription unavailable' }, 503);
  let body: TranscribeRequestBody;
  try { body = await request.json() as TranscribeRequestBody; } catch { return json({ error: 'Invalid JSON' }, 400); }
  const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64.trim() : '';
  if (!audioBase64) return json({ error: 'audioBase64 is required' }, 400);
  const contentType = typeof body.contentType === 'string' && body.contentType ? body.contentType : 'audio/m4a';
  const ext = contentType.includes('webm') ? 'webm'
    : contentType.includes('ogg') ? 'ogg'
    : contentType.includes('wav') ? 'wav'
    : contentType.includes('mp3') || contentType.includes('mpeg') ? 'mp3'
    : 'm4a';

  try {
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const formData = new FormData();
    formData.append('file', new Blob([bytes], { type: contentType }), `audio.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: formData,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[sekret/transcribe]', res.status, detail.slice(0, 500));
      return json({ error: 'transcription failed' }, 502);
    }
    const data = await res.json() as { text?: string };
    const transcript = typeof data.text === 'string' ? data.text.trim() : '';
    return json({ transcript });
  } catch (error) {
    console.error('[sekret/transcribe]', error);
    return json({ error: 'transcription error' }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const path = new URL(request.url).pathname;
    if (path.endsWith('/api/sekret/transcribe')) return handleTranscribe(request, env);
    if (path.endsWith('/api/sekret/voice')) return handleVoice(request, env);
    if (path.endsWith('/api/sekret/reply')) return handleReply(request, env);
    return json({ error: 'Not found' }, 404);
  },
};
