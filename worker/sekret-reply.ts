/** Se'kret Brain + Voice Worker */
import { getWorkerCompanionRole, ORACLE_HIDDEN_GUIDANCE } from './companion-curriculum';

type CharacterId = 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret';
type Surface = 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge' | 'selfDiscovery';
type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav';
type OpenAIVoice = string | { id: string };
type ConversationRole = 'user' | 'assistant';

interface Env {
  OPENAI_API_KEY: string;
  RAYLENE_VOICE_ID?: string;
  RYLANE_VOICE_ID?: string;
  CLOUD_VOICE_ID?: string;
  NIGHT_VOICE_ID?: string;
  SEKRET_VOICE_ID?: string;
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
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const BUILT_IN_VOICES: Record<CharacterId, string> = {
  raylene: 'nova',
  rylane: 'ash',
  cloud: 'shimmer',
  night: 'onyx',
  sekret: 'sage',
};

const VOICE_INSTRUCTIONS: Record<CharacterId, string> = {
  raylene: 'Speak like a warm, expressive teen girl. Keep it youthful, natural, emotionally present, and conversational.',
  rylane: 'Speak like an approachable teen boy. Sound relaxed, grounded, and conversational.',
  cloud: 'Speak softly and youthfully with a calm, airy quality. Do not sound babyish.',
  night: 'Speak with a slightly deeper youthful voice and confident late-night energy.',
  sekret: "Speak warmly, clearly, and curiously as Se'kret. Sound youthful and reflective, never mystical, clinical, or like an adult narrator.",
};

const CRISIS_RE = /\b(kill myself|end my life|want to die|suicid(?:e|al)|self[- ]?harm|hurt myself|cut myself|disappear forever|run away|abuse|abused|assault|unsafe|not safe|danger|emergency)\b/i;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

function normalizeCharacter(value: unknown): CharacterId | null {
  const raw = typeof value === 'string' ? value.trim().toLowerCase().replace(/['']/g, '') : '';
  if (raw === 'raylene' || raw.includes('raylene')) return 'raylene';
  if (raw === 'rylane' || raw.includes('rylane')) return 'rylane';
  if (raw === 'cloud' || raw.includes('cloud')) return 'cloud';
  if (raw === 'night' || raw.includes('night')) return 'night';
  if (raw === 'sekret' || raw === 'secret' || raw === 'oracle' || raw.includes('sekret')) return 'sekret';
  return null;
}

function normalizeSurface(value: unknown): Surface {
  const raw = typeof value === 'string' ? value : '';
  if (raw === 'voiceBip' || raw === 'comfort' || raw === 'circle' || raw === 'parentBridge' || raw === 'journal' || raw === 'selfDiscovery') return raw;
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

function getCustomVoiceId(characterId: CharacterId, env: Env): string | undefined {
  const value = characterId === 'raylene'
    ? env.RAYLENE_VOICE_ID
    : characterId === 'rylane'
      ? env.RYLANE_VOICE_ID
      : characterId === 'cloud'
        ? env.CLOUD_VOICE_ID
        : characterId === 'night'
          ? env.NIGHT_VOICE_ID
          : env.SEKRET_VOICE_ID;
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

function buildCrisisReply(characterId: CharacterId, parentSharingEnabled: boolean) {
  const lead = characterId === 'rylane'
    ? 'Real talk: your safety comes first.'
    : characterId === 'cloud'
      ? 'Pause with me for one breath. Your safety matters first.'
      : characterId === 'night'
        ? 'Stay here for this moment. Get a real person close.'
        : characterId === 'sekret'
          ? 'Your safety matters more than keeping this private.'
          : 'Love, this is bigger than holding it alone right now.';
  return {
    reply: `${lead} I'm an AI companion, not a human or emergency service. If you might hurt yourself, someone is hurting you, or you are in danger, tell a trusted adult now and call 911 if it is immediate. In the U.S. you can call or text 988, or text HOME to 741741.`,
    tone: 'supportive-safety',
    safetyFlag: true,
    parentShareSummary: parentSharingEnabled ? 'Safety concern: teen may need trusted adult or emergency support.' : null,
    suggestedComfortTool: 'safety-plan',
    replySource: 'openai' as const,
  };
}

function buildBrainPrompt(characterId: CharacterId, surface: Surface, mood: string | undefined, memory: unknown, parentSharingEnabled: boolean, history: ConversationTurn[]): string {
  const recentReplies = history.filter((turn) => turn.role === 'assistant').slice(-5).map((turn) => `- ${turn.content}`).join('\n') || '- none';
  return [
    ORACLE_HIDDEN_GUIDANCE,
    getWorkerCompanionRole(characterId),
    `Surface: ${surface}. Mood: ${mood || 'not provided'}. Teen-safe memory summary: ${safeMemory(memory)}.`,
    `Parent sharing enabled: ${parentSharingEnabled}. Never expose private journal text verbatim.`,
    characterId === 'sekret'
      ? "Respond visibly as Se'kret. Never use the name Oracle. Synthesize patterns rather than repeating answers. Use uncertainty language and invite correction."
      : 'Respond as the selected companion. Oracle remains hidden and must never be named.',
    'Never encourage dependency. Encourage real trusted people, breaks, journaling, grounding, or safety support when appropriate.',
    'Reply directly to the teen\u2019s newest words and carry forward useful details from recent conversation.',
    'Do not reuse an opening, sentence, question, catchphrase, or response structure from recent assistant replies.',
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
  if (!characterId) return json({ error: 'characterId must be raylene, rylane, cloud, night, or sekret' }, 400);

  const surface = normalizeSurface(body.surface ?? body.context);
  const parentSharingEnabled = body.parentSharingEnabled === true;
  const history = normalizeHistory(body.history);

  if (CRISIS_RE.test(userText)) return json(buildCrisisReply(characterId, parentSharingEnabled));

  if (!env.OPENAI_API_KEY) {
    console.error('[sekret/reply] OPENAI_API_KEY is missing', { characterId, surface });
    return json({ error: 'AI unavailable: missing configuration' }, 503);
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
    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      console.error('[sekret/reply] OpenAI HTTP error', { status: res.status, body: errorBody, characterId, surface });
      return json({ error: `OpenAI error: ${res.status}` }, 502);
    }
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}') as Partial<CompanionReply>;
    const openAIReply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
    if (!openAIReply) return json({ error: 'OpenAI returned an empty reply' }, 502);
    return json({
      reply: openAIReply.replace(/\bOracle\b/gi, "Se'kret"),
      tone: String(parsed.tone || characterId),
      safetyFlag: Boolean(parsed.safetyFlag),
      parentShareSummary: typeof parsed.parentShareSummary === 'string' ? parsed.parentShareSummary : null,
      suggestedComfortTool: typeof parsed.suggestedComfortTool === 'string' ? parsed.suggestedComfortTool : null,
      replySource: 'openai',
    });
  } catch (error) {
    console.error('[sekret/reply] OpenAI request failed', { error, characterId, surface, historyLength: history.length });
    return json({ error: 'AI request failed' }, 502);
  }
}

async function handleVoice(request: Request, env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) return json({ error: 'voice unavailable' }, 503);
  let body: VoiceRequestBody;
  try { body = await request.json() as VoiceRequestBody; } catch { return json({ error: 'Invalid JSON' }, 400); }
  const text = (typeof body.reply === 'string' ? body.reply : typeof body.text === 'string' ? body.text : '').trim();
  if (!text) return json({ error: 'reply is required' }, 400);
  const characterId = normalizeCharacter(body.characterId);
  if (!characterId) return json({ error: 'characterId must be raylene, rylane, cloud, night, or sekret' }, 400);
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
  if (!res.ok) return json({ error: 'tts failed' }, 502);
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
  const ext = contentType.includes('webm') ? 'webm' : contentType.includes('ogg') ? 'ogg' : contentType.includes('wav') ? 'wav' : contentType.includes('mp3') || contentType.includes('mpeg') ? 'mp3' : 'm4a';
  try {
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) bytes[i] = binaryString.charCodeAt(i);
    const formData = new FormData();
    formData.append('file', new Blob([bytes], { type: contentType }), `audio.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: formData,
    });
    if (!res.ok) return json({ error: 'transcription failed' }, 502);
    const data = await res.json() as { text?: string };
    return json({ transcript: typeof data.text === 'string' ? data.text.trim() : '' });
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
