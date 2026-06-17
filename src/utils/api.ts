/**
 * src/utils/api.ts
 *
 * Canonical location (moved from utils/api.ts in Step 3).
 * Cloudflare Worker / backend API calls.
 *
 * Import via: import { fetchSekretReply } from '@/utils';
 *
 * NOTE: In Step 3+ this grows into src/services/ai/ per-personality.
 * For now it stays here as a single fetch helper.
 */
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export async function fetchSekretReply(
  text: string,
  context = 'journal',
  mood?: string,
  avatarKey?: string,
  _p4?: unknown,
  privateProfile?: unknown,
  profileSide?: string,
  _p7?: unknown,
): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text, context, mood }),
    });
    if (!res.ok) throw new Error(`api error ${res.status}`);
    const data = await res.json();
    return data.reply ?? "I hear you. You don't have to carry that alone 💜";
  } catch {
    return "I hear you. That makes sense. You don't have to carry that by yourself 💜";
  }
}
