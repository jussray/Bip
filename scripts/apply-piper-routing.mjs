import fs from 'node:fs';

const file = 'worker/index.ts';
let source = fs.readFileSync(file, 'utf8');

if (!source.includes("from './piper-tts'")) {
  source = source.replace(
    "import worker from './sekret-reply';",
    "import worker from './sekret-reply';\nimport { synthesizeWithPiper, type PiperTtsEnv } from './piper-tts';",
  );
}
source = source.replace('interface Env {', 'interface Env extends PiperTtsEnv {');

const marker = "    if (request.method === 'POST' && path.endsWith('/api/sekret/reply') && !env.OPENAI_API_KEY) {";
if (!source.includes("path.endsWith('/api/sekret/voice') && env.PIPER_TTS_URL")) {
  const block = `    if (request.method === 'POST' && path.endsWith('/api/sekret/voice') && env.PIPER_TTS_URL?.trim()) {
      let body: Record<string, unknown>;
      try { body = await request.clone().json() as Record<string, unknown>; } catch { return json({ error: 'Invalid JSON' }, 400); }
      const text = (typeof body.reply === 'string' ? body.reply : typeof body.text === 'string' ? body.text : '').trim();
      if (!text) return json({ error: 'reply is required' }, 400);
      const characterId = normalizeCharacter(body.characterId);
      try {
        const audio = await synthesizeWithPiper({ text, characterId, env });
        if (audio) {
          let binary = '';
          for (const byte of audio.bytes) binary += String.fromCharCode(byte);
          return json({ audioBase64: btoa(binary), contentType: audio.contentType, characterId, voiceSource: 'piper', voiceId: audio.voice, aiGenerated: true });
        }
      } catch (error) {
        console.error('[sekret/voice:piper]', error);
        if (!env.OPENAI_API_KEY) return json({ error: 'piper tts failed' }, 502);
      }
    }

`;
  if (!source.includes(marker)) throw new Error('Worker route marker not found');
  source = source.replace(marker, block + marker);
}

fs.writeFileSync(file, source);
