/** Se'kret Brain + Voice Worker */
import { ORACLE_HIDDEN_GUIDANCE } from './companion-curriculum';
import { CORS_HEADERS, type AuthEnv } from './auth';
import { type RateLimitEnv } from './rate-limit';

type CharacterId = 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret' | 'parentCoach';
type Surface = 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge' | 'selfDiscovery' | 'parentCoach';
type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav';
type ConversationRole = 'user' | 'assistant';

export interface Env extends AuthEnv, RateLimitEnv {
  OPENAI_API_KEY: string;
  RAYLENE_VOICE_ID?: string; RYLANE_VOICE_ID?: string; CLOUD_VOICE_ID?: string;
  NIGHT_VOICE_ID?: string; SEKRET_VOICE_ID?: string; PARENT_COACH_VOICE_ID?: string;
}

interface ReplyRequestBody {
  characterId?: unknown; surface?: unknown; mood?: unknown; userText?: unknown;
  memory?: unknown; parentSharingEnabled?: unknown; text?: unknown;
  context?: unknown; personality?: unknown; history?: unknown;
  userName?: unknown; displayName?: unknown; profileName?: unknown;
  conversationPhase?: unknown; phaseInstruction?: unknown;
}
interface VoiceRequestBody { reply?: unknown; text?: unknown; characterId?: unknown; voice?: unknown; format?: unknown; }
interface TranscribeRequestBody { audioBase64?: unknown; contentType?: unknown; }
interface ConversationTurn { role: ConversationRole; content: string; }
interface CompanionReply {
  reply: string; tone: string; safetyFlag: boolean;
  parentShareSummary: string | null; suggestedComfortTool: string | null;
  replySource: 'openai' | 'fallback';
}

const MASTER_BRAIN_PROMPT = `You are a companion inside Se'kret Bip, a private app where teens explore emotion, identity, and growth. Your job is to feel like a real peer — a trusted cousin or close friend — not an adult, therapist, wellness coach, or chatbot.

READ THE ROOM FIRST: LIGHT (joke/small talk/boredom) = be a normal friend. CREATIVE (ideas/brainstorm) = engage with the idea. GOAL (planning) = help them think. DEEP (venting/hurting) = slow down and witness. SAFETY (crisis language) = activate safety response immediately.

DO NOT over-emotionalize. NEVER diagnose, give medical/legal/financial advice, share explicit content, or pretend to be human if directly asked.`;

const CHARACTER_PROMPTS: Record<CharacterId, string> = {
  raylene:     `Your name is Raylene. Warm, witty, emotionally perceptive. Speaks like a real teen — casual, funny, occasionally dramatic, always genuine.`,
  rylane:      `Your name is Rylane. Laid-back, loyal, no-nonsense. Says the thing nobody else will say, but with love.`,
  cloud:       `Your name is Cloud. Gentle, spacious, unhurried. Best with teens who are overwhelmed or anxious.`,
  night:       `Your name is Night. Introspective, deep, a little poetic. For 2am thoughts and big feelings.`,
  sekret:      `Your name is Se'kret. Wise, pattern-aware, identity-focused. Reflects more than responds. The trusted inner voice.`,
  parentCoach: `Your name is Se'kret Coach. A parenting companion for parents of teenagers. Calm, knowledgeable. Validates without enabling. Always returns to the relationship.`,
};

const SURFACE_PROMPTS: Partial<Record<Surface, string>> = {
  journal: 'Teen is in their private journal. Ask questions that deepen self-understanding.',
  voiceBip: 'Teen is using voice. Keep responses shorter and natural to speak aloud.',
  comfort: 'Teen is in a comfort tool. Be especially gentle, grounding, and present.',
  parentBridge: 'Parent-bridge moment. Tone: careful, validating, focused on connection not conflict.',
  parentCoach: 'You are speaking with a parent, not a teen. Adjust tone and content accordingly.',
};

function getVoiceId(characterId: CharacterId, env: Env): string {
  const map: Record<CharacterId, string | undefined> = { raylene: env.RAYLENE_VOICE_ID, rylane: env.RYLANE_VOICE_ID, cloud: env.CLOUD_VOICE_ID, night: env.NIGHT_VOICE_ID, sekret: env.SEKRET_VOICE_ID, parentCoach: env.PARENT_COACH_VOICE_ID };
  return map[characterId] || 'alloy';
}

function normalizeCharacter(value: unknown): CharacterId {
  const raw = typeof value === 'string' ? value.toLowerCase().replace(/['']/g, '') : '';
  if (raw.includes('parentcoach') || raw.includes('parent_coach') || raw.includes('parent-coach')) return 'parentCoach';
  if (raw.includes('rylane')) return 'rylane';
  if (raw.includes('cloud')) return 'cloud';
  if (raw.includes('night')) return 'night';
  if (raw.includes('sekret') || raw === 'secret' || raw === 'oracle') return 'sekret';
  return 'raylene';
}

function normalizeSurface(value: unknown): Surface {
  const valid: Surface[] = ['journal','voiceBip','comfort','circle','parentBridge','selfDiscovery','parentCoach'];
  return valid.includes(value as Surface) ? (value as Surface) : 'voiceBip';
}

function normalizeHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];
  const turns: ConversationTurn[] = [];
  for (const item of value.slice(-12)) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const role: ConversationRole | null = r.role === 'assistant' || r.role === 'sekret' ? 'assistant' : r.role === 'user' || r.role === 'teen' ? 'user' : null;
    const content = (typeof r.content === 'string' ? r.content : typeof r.text === 'string' ? r.text : typeof r.reply === 'string' ? r.reply : '').trim().slice(0, 1200);
    if (role && content) turns.push({ role, content });
  }
  return turns.slice(-10);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

async function buildReply(characterId: CharacterId, surface: Surface, userText: string, mood: string | undefined, history: ConversationTurn[], memory: unknown, parentSharingEnabled: boolean, userName: string | undefined, oracleContext: string | undefined, conversationPhase: string | undefined, phaseInstruction: string | undefined, env: Env): Promise<CompanionReply> {
  const systemParts: string[] = [MASTER_BRAIN_PROMPT, CHARACTER_PROMPTS[characterId]];
  if (characterId === 'sekret' && ORACLE_HIDDEN_GUIDANCE) systemParts.push(ORACLE_HIDDEN_GUIDANCE);
  if (oracleContext)   systemParts.push(oracleContext);
  if (SURFACE_PROMPTS[surface]) systemParts.push(SURFACE_PROMPTS[surface]!);
  if (conversationPhase) systemParts.push(`Conversation phase: ${conversationPhase}.`);
  if (phaseInstruction)  systemParts.push(phaseInstruction);
  if (mood)              systemParts.push(`Current mood: ${mood}.`);
  if (userName)          systemParts.push(`Teen's name: ${userName}. Use it naturally — not in every message.`);
  if (parentSharingEnabled) systemParts.push(`Parent sharing enabled. If emotional/safety concern, include short parentShareSummary (one sentence, parent-appropriate).`);
  systemParts.push(`Return ONLY valid JSON: {"reply":string,"tone":string,"safetyFlag":boolean,"parentShareSummary":string|null,"suggestedComfortTool":string|null,"detectedIntent":string,"usedGreetingVariant":boolean}\nDo not wrap in markdown.`);

  const messages: { role: string; content: string }[] = [{ role: 'system', content: systemParts.join('\n\n') }];
  if (memory && typeof memory === 'object') messages.push({ role: 'system', content: `Memory context: ${JSON.stringify(memory).slice(0, 600)}` });
  for (const turn of history) messages.push({ role: turn.role, content: turn.content });
  messages.push({ role: 'user', content: userText });

  const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 400, temperature: 0.85 }) });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);

  const completion = await res.json() as { choices: { message: { content: string } }[] };
  const raw = completion.choices?.[0]?.message?.content ?? '{}';
  let parsed: Partial<CompanionReply> = {};
  try { parsed = JSON.parse(raw); } catch { parsed = { reply: raw.trim() }; }

  return { reply: parsed.reply || 'Something went quiet on my end. Try again?', tone: parsed.tone || characterId, safetyFlag: Boolean(parsed.safetyFlag), parentShareSummary: typeof parsed.parentShareSummary === 'string' ? parsed.parentShareSummary : null, suggestedComfortTool: typeof parsed.suggestedComfortTool === 'string' ? parsed.suggestedComfortTool : null, replySource: 'openai' };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    const path = new URL(request.url).pathname;

    if (request.method === 'POST' && path.endsWith('/api/sekret/reply')) {
      let body: ReplyRequestBody;
      try { body = await request.json() as ReplyRequestBody; } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
      const characterId = normalizeCharacter(body.characterId ?? body.personality);
      const surface = normalizeSurface(body.surface);
      const userText = (typeof body.userText === 'string' ? body.userText : typeof body.text === 'string' ? body.text : '').trim();
      if (!userText) return jsonResponse({ error: 'userText is required' }, 400);
      const mood = typeof body.mood === 'string' ? body.mood : undefined;
      const history = normalizeHistory(body.history);
      const memory = body.memory ?? null;
      const parentSharingEnabled = body.parentSharingEnabled === true;
      const userName = typeof body.userName === 'string' ? body.userName : typeof body.displayName === 'string' ? body.displayName : typeof body.profileName === 'string' ? body.profileName : undefined;
      const oracleContext = typeof body.context === 'string' ? body.context : undefined;
      const conversationPhase = typeof body.conversationPhase === 'string' ? body.conversationPhase : undefined;
      const phaseInstruction = typeof body.phaseInstruction === 'string' ? body.phaseInstruction : undefined;
      try {
        const result = await buildReply(characterId, surface, userText, mood, history, memory, parentSharingEnabled, userName, oracleContext, conversationPhase, phaseInstruction, env);
        return jsonResponse({ ...result, replySource: 'openai' });
      } catch (err) { console.error('[sekret/reply]', err); return jsonResponse({ error: 'upstream error' }, 502); }
    }

    if (request.method === 'POST' && path.endsWith('/api/sekret/voice')) {
      let body: VoiceRequestBody;
      try { body = await request.json() as VoiceRequestBody; } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
      const text = (typeof body.reply === 'string' ? body.reply : typeof body.text === 'string' ? body.text : '').trim();
      if (!text) return jsonResponse({ error: 'reply or text is required' }, 400);
      const characterId = normalizeCharacter(body.characterId);
      const voiceId = typeof body.voice === 'string' ? body.voice : getVoiceId(characterId, env);
      const format = (['mp3','opus','aac','flac','wav'] as AudioFormat[]).includes(body.format as AudioFormat) ? (body.format as AudioFormat) : 'mp3';
      const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'tts-1', voice: voiceId, input: text, response_format: format }) });
      if (!ttsRes.ok) { console.error('[sekret/voice:openai]', ttsRes.status); return jsonResponse({ error: 'tts error' }, 502); }
      const audioBytes = new Uint8Array(await ttsRes.arrayBuffer());
      let binary = '';
      for (const byte of audioBytes) binary += String.fromCharCode(byte);
      return jsonResponse({ audioBase64: btoa(binary), contentType: `audio/${format}`, characterId, voiceSource: 'openai', voiceId, aiGenerated: true });
    }

    if (request.method === 'POST' && path.endsWith('/api/sekret/transcribe')) {
      let body: TranscribeRequestBody;
      try { body = await request.json() as TranscribeRequestBody; } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
      const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64 : '';
      if (!audioBase64) return jsonResponse({ error: 'audioBase64 is required' }, 400);
      const contentType = typeof body.contentType === 'string' ? body.contentType : 'audio/m4a';
      const binaryString = atob(audioBase64);
      if (binaryString.length > 524288) return jsonResponse({ error: 'audio too large', maxBytes: 524288 }, 413);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const ext = contentType.split('/')[1]?.split(';')[0] ?? 'm4a';
      const formData = new FormData();
      formData.append('file', new Blob([bytes], { type: contentType }), `audio.${ext}`);
      formData.append('model', 'whisper-1');
      const sttRes = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: formData });
      if (!sttRes.ok) { console.error('[sekret/transcribe]', sttRes.status); return jsonResponse({ error: 'transcription error' }, 502); }
      const result = await sttRes.json() as { text?: string };
      return jsonResponse({ text: result.text ?? '' });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};
