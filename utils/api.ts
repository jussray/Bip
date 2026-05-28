const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export async function fetchSekretReply(
  text: string,
  context = 'journal',
  mood?: string
): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context, mood }),
    });
    if (!res.ok) throw new Error('api error');
    const data = await res.json();
    return (
      data.reply || "I hear you. You don't have to carry that alone 💜"
    );
  } catch {
    return "I hear you. That makes sense. You don't have to carry that by yourself 💜";
  }
}
