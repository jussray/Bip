import { getSupabase } from '@/utils/supabase';
import { fetchLinkedTeenId } from '@/utils/parentLink';

export type BridgeMessageKind = 's2tell' | 'note' | 'reply' | 'shared_moment';

export interface BridgeMessage {
  id: string;
  teenUserId: string;
  parentUserId: string;
  senderUserId: string;
  kind: BridgeMessageKind;
  body: string;
  tone: string | null;
  createdAt: string;
  readAt: string | null;
}

async function currentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function fetchActiveParentForTeen(teenUserId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('parent_links')
    .select('parent_user_id')
    .eq('teen_user_id', teenUserId)
    .eq('status', 'active')
    .eq('is_active', true)
    .maybeSingle();
  if (error) return null;
  return typeof data?.parent_user_id === 'string' ? data.parent_user_id : null;
}

export async function sendTeenBridgeMessage(
  body: string,
  kind: BridgeMessageKind = 's2tell',
  tone?: string,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const teenUserId = await currentUserId();
  if (!teenUserId) return false;
  const parentUserId = await fetchActiveParentForTeen(teenUserId);
  if (!parentUserId) return false;

  const { error } = await supabase.from('bridge_messages').insert({
    teen_user_id: teenUserId,
    parent_user_id: parentUserId,
    sender_user_id: teenUserId,
    kind,
    body: body.trim(),
    tone: tone ?? null,
  });
  return !error;
}

export async function sendParentBridgeMessage(
  teenUserId: string,
  body: string,
  kind: BridgeMessageKind = 'reply',
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const parentUserId = await currentUserId();
  if (!parentUserId) return false;

  const { error } = await supabase.from('bridge_messages').insert({
    teen_user_id: teenUserId,
    parent_user_id: parentUserId,
    sender_user_id: parentUserId,
    kind,
    body: body.trim(),
  });
  return !error;
}

export async function fetchBridgeThread(limit = 100): Promise<BridgeMessage[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];

  const linkedTeenId = await fetchLinkedTeenId();
  const filterColumn = linkedTeenId ? 'parent_user_id' : 'teen_user_id';
  const { data, error } = await supabase
    .from('bridge_messages')
    .select('id,teen_user_id,parent_user_id,sender_user_id,kind,body,tone,created_at,read_at')
    .eq(filterColumn, userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];

  return (data ?? []).map(row => ({
    id: String(row.id),
    teenUserId: String(row.teen_user_id),
    parentUserId: String(row.parent_user_id),
    senderUserId: String(row.sender_user_id),
    kind: row.kind as BridgeMessageKind,
    body: String(row.body),
    tone: row.tone ? String(row.tone) : null,
    createdAt: String(row.created_at),
    readAt: row.read_at ? String(row.read_at) : null,
  }));
}
