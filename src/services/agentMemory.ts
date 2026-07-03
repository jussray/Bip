import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';
import type { SekretCharacterId } from '@/utils/api';

export type AgentMemoryKind = 'episodic' | 'semantic';

export interface AgentMemory {
  id: string;
  companion_id: SekretCharacterId;
  kind: AgentMemoryKind;
  content: string;
  created_at: string;
}

/**
 * Best-effort write of one memory row for the signed-in user. Never throws —
 * a failed write should not block a companion reply, matching the "cloud
 * sync is best-effort" pattern used across sekret/oracle services.
 */
export async function writeAgentMemory(
  companionId: SekretCharacterId,
  kind: AgentMemoryKind,
  content: string,
): Promise<void> {
  if (!isSupabaseConfigured || !content.trim()) return;
  const sb = getSupabase();
  if (!sb) return;

  try {
    const { data: authData } = await sb.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return;

    await sb.from('agent_memories').insert({
      user_id: userId,
      companion_id: companionId,
      kind,
      content: content.slice(0, 2000),
    });
  } catch {
    // Best-effort — local conversation flow already has the message.
  }
}

/**
 * Most recent memories for a companion, oldest first (so callers can fold
 * them straight into a context array in reading order). Recency-ordered,
 * not similarity-search — no embedding-generation path exists yet, so the
 * `embedding` column is unpopulated and unused here.
 */
export async function listRecentAgentMemories(
  companionId: SekretCharacterId,
  limit = 5,
): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data: authData } = await sb.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return [];

    const { data, error } = await sb
      .from('agent_memories')
      .select('content')
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as Pick<AgentMemory, 'content'>[])
      .map((row) => row.content)
      .reverse();
  } catch {
    return [];
  }
}
