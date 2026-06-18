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

const BASE_URL = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_BACKEND_URL ?? '';

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
    // Graceful offline/error fallback — personality-appropriate
    const fallbacks: Record<PersonalityId, string> = {
      raylene: "I hear you, love. I'm just having a moment — try me again? 🌸",
      rylane:  "My signal dropped. I'm still here though.",
      cloud:   "Slow breath. I'll be right back with you.",
      night:   "Still here. Just a little quiet right now.",
      oracle:  "The connection wavered. Your words still landed.",
    };
    return fallbacks[personalityId];
  }
}

/** Create a user ChatMessage object */
export function makeUserMessage(text: string): ChatMessage {
  return { id: String(Date.now()), role: 'user', text, timestamp: Date.now() };
}

/** Create an assistant ChatMessage object */
export function makeAssistantMessage(text: string): ChatMessage {
  return { id: String(Date.now() + 1), role: 'assistant', text, timestamp: Date.now() };
}
