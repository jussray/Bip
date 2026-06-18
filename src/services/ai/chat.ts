/**
 * src/services/ai/chat.ts
 *
 * Core chat message function.
 * Sends a message to the Cloudflare Worker /api/sekret/reply endpoint
 * with a personality-scoped system prompt baked in.
 *
 * Import via: import { sendMessage } from '@/services/ai/chat';
 */
import type { PersonalityId } from '@/types';
import { PERSONALITY_CONFIG } from './personalities';

export interface ChatMessage {
  id:          string;
  role:        'user' | 'assistant';
  text:        string;
  timestamp:   number;
}

const BASE_URL = ((process.env as Record<string, string | undefined>).EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');

function localFallback(personalityId: PersonalityId, text: string): string {
  const lower = text.toLowerCase();
  const crisis = /\b(kill myself|end my life|want to die|suicidal|self[- ]?harm|not safe|being abused)\b/.test(lower);
  if (crisis) {
    return "I'm really glad you said that out loud. If you're in immediate danger, call 911; if you can, text HOME to 741741 right now and stay near someone safe.";
  }

  const sad = /\b(sad|cry|lonely|alone|hurt|heavy|depressed|overwhelmed)\b/.test(lower);
  const angry = /\b(angry|mad|pissed|annoyed|frustrated)\b/.test(lower);

  if (personalityId === 'rylane') {
    if (angry) return "Yeah, that would set anybody off. Before you move on it, take one beat and tell me what line got crossed.";
    if (sad) return "That sounds heavy for real. You don't gotta dress it up — what part is hitting hardest?";
    return "I'm with you. Say the real version — what's going on?";
  }
  if (personalityId === 'cloud') {
    if (sad) return "Come sit for a second. One slow breath first — then tell me the smallest piece.";
    return "No rush. Put one sentence here, and we can hold it gently.";
  }
  if (personalityId === 'night') {
    if (sad) return "Stay close. You don't have to solve the whole night right now.";
    return "I'm here. Say it messy if you need to.";
  }
  if (personalityId === 'oracle') {
    return "There may be a pattern asking for your attention. What do you keep returning to in this?";
  }
  if (angry) return "Oof, I get why that got under your skin. What happened right before you felt it shift?";
  if (sad) return "I'm sorry it's weighing on you, love. Tell me the part you haven't been able to say yet.";
  return "I'm here with you. Tell me what's been sitting on your chest.";
}

/**
 * Send a user message for a given personality and get a reply.
 *
 * @param personalityId  Which companion is responding
 * @param text           The user's message
 * @param context        Optional context hint (journal, calm, chat)
 * @param mood           Optional current mood tag
 */
export async function sendMessage(
  personalityId: PersonalityId,
  text:          string,
  context:       string = 'chat',
  mood?:         string,
  history?:      ChatMessage[],
): Promise<string> {
  const config = PERSONALITY_CONFIG[personalityId];

  if (!BASE_URL) {
    return localFallback(personalityId, text);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        text,
        context,
        mood,
        personality:  personalityId,
        systemPrompt: config.systemPrompt,
        history,
      }),
    });

    if (!res.ok) throw new Error(`Worker error ${res.status}`);
    const data = await res.json();
    return data.reply ?? config.greeting;
  } catch {
    return localFallback(personalityId, text);
  }
}

function makeMessageId(role: ChatMessage['role']): string {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Create a user ChatMessage object */
export function makeUserMessage(text: string): ChatMessage {
  return { id: makeMessageId('user'), role: 'user', text, timestamp: Date.now() };
}

/** Create an assistant ChatMessage object */
export function makeAssistantMessage(text: string): ChatMessage {
  return { id: makeMessageId('assistant'), role: 'assistant', text, timestamp: Date.now() };
}
