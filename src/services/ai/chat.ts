/**
 * Core chat message function.
 * Sends a message to the Cloudflare Worker with companion and Oracle context.
 */
import type { PersonalityId } from '@/types';
import { PERSONALITY_CONFIG } from './personalities';
import {
  learnTeenRelationshipStyle,
  loadTeenRelationshipProfile,
  relationshipProfileToOracleNote,
  saveTeenRelationshipProfile,
  type TeenRelationshipProfile,
} from '../../../services/oracleRelationship';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const BASE_URL = ((process.env as Record<string, string | undefined>).EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');

function mayMirrorProfanity(profile: TeenRelationshipProfile): boolean {
  return profile.profanityPreference === 'light-mirroring';
}

function localFallback(
  personalityId: PersonalityId,
  text: string,
  relationship: TeenRelationshipProfile,
): string {
  const lower = text.toLowerCase();
  const sad = /\b(sad|cry|lonely|alone|hurt|heavy|depressed|overwhelmed)\b/.test(lower);
  const angry = /\b(angry|mad|pissed|annoyed|frustrated)\b/.test(lower);
  const planning = /\b(plan|goal|idea|business|project|school|future|dream|create|music|art|write)\b/.test(lower);
  const reset = /\b(failed|fell off|gave up|stopped|missed|behind|procrastinat)\w*\b/.test(lower);
  const mirror = mayMirrorProfanity(relationship);

  if (personalityId === 'rylane') {
    if (angry) return mirror
      ? "Yeah, that shit would set anybody off. Before you move on it, what line got crossed?"
      : "Yeah, that would set anybody off. Before you move on it, what line got crossed?";
    if (sad) return "That sounds heavy for real. You do not have to dress it up—what part is hitting hardest?";
    return relationship.nicknameComfort === 'dislikes'
      ? "Say the real version. What is going on?"
      : "Aight, say the real version. What is going on?";
  }

  if (personalityId === 'cloud') {
    if (sad) return "We can make this smaller first. One breath, then one sentence—or no sentence yet.";
    return "No rush. Start with the smallest piece that feels safe to say.";
  }

  if (personalityId === 'night') {
    if (planning) return "Hold up—that idea has something. What is the goal, and what is one step you can set up tonight?";
    if (reset) return "One off day is not your identity. What made the plan fall apart, and what changes this time?";
    if (sad) return "We can sit with it for a minute. Then we decide whether tonight needs rest, reflection, or one small move forward.";
    return "Are we trying to understand this, plan it, create something, or finish one small part?";
  }

  if (personalityId === 'oracle') {
    return "What does this keep revealing about who you are, what you value, or what you are trying to become?";
  }

  if (angry) return mirror
    ? "Okay, that shit really got under your skin. What happened right before it shifted?"
    : "Okay, that really got under your skin. What happened right before it shifted?";
  if (sad) return "Tell me the part you keep trying to make sound smaller.";
  return relationship.nicknameComfort === 'dislikes'
    ? "Okay. What really happened?"
    : "Girl, okay. What really happened?";
}

export async function sendMessage(
  personalityId: PersonalityId,
  text: string,
  context: string = 'chat',
  mood?: string,
  history?: ChatMessage[],
): Promise<string> {
  const config = PERSONALITY_CONFIG[personalityId];
  const currentRelationship = await loadTeenRelationshipProfile();
  const learnedRelationship = learnTeenRelationshipStyle(text, currentRelationship);
  await saveTeenRelationshipProfile(learnedRelationship);

  if (!BASE_URL) {
    return localFallback(personalityId, text, learnedRelationship);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        context,
        mood,
        personality: personalityId,
        systemPrompt: config.systemPrompt,
        history,
        memory: {
          relationshipStyle: relationshipProfileToOracleNote(learnedRelationship),
        },
      }),
    });

    if (!res.ok) throw new Error(`Worker error ${res.status}`);
    const data = await res.json();
    return data.reply ?? config.greeting;
  } catch {
    return localFallback(personalityId, text, learnedRelationship);
  }
}

function makeMessageId(role: ChatMessage['role']): string {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeUserMessage(text: string): ChatMessage {
  return { id: makeMessageId('user'), role: 'user', text, timestamp: Date.now() };
}

export function makeAssistantMessage(text: string): ChatMessage {
  return { id: makeMessageId('assistant'), role: 'assistant', text, timestamp: Date.now() };
}
