import { emitEvent } from '@/features/activity/events';
import { reportPost } from '@/utils/circleModeration';
import { getSupabase } from '@/utils/supabase';

export type CircleReactionKey = 'felt' | 'comfort' | 'proud' | 'stay';
export type CircleReactionCounts = Record<CircleReactionKey, number>;

export interface PublicCircleFeedItem {
  id: number;
  userId: string;
  nickname: string;
  avatarEmoji: string;
  text: string;
  postMood: string | null;
  mediaKind: string | null;
  reactions: CircleReactionCounts;
  createdAt: string;
}

type PublicPostRow = {
  id: number;
  user_id: string;
  text: string;
  post_mood: string | null;
  media_kind: string | null;
  reactions: Partial<CircleReactionCounts> | null;
  created_at: string;
};

type CircleProfileRow = {
  user_id: string;
  nickname: string;
  avatar_emoji: string;
};

const EMPTY_REACTIONS: CircleReactionCounts = {
  felt: 0,
  comfort: 0,
  proud: 0,
  stay: 0,
};

function normalizeReactions(value: unknown): CircleReactionCounts {
  const source = value && typeof value === 'object'
    ? value as Partial<Record<CircleReactionKey, unknown>>
    : {};

  return {
    felt: Number(source.felt ?? 0),
    comfort: Number(source.comfort ?? 0),
    proud: Number(source.proud ?? 0),
    stay: Number(source.stay ?? 0),
  };
}

async function currentPermanentUser(): Promise<{ id: string } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const user = data.session?.user;
  if (!user || user.is_anonymous) return null;
  return { id: user.id };
}

async function loadProfileMap(userIds: string[]): Promise<Map<string, CircleProfileRow>> {
  const supabase = getSupabase();
  if (!supabase || userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('circle_profiles')
    .select('user_id,nickname,avatar_emoji')
    .in('user_id', [...new Set(userIds)]);

  if (error) throw error;

  return new Map(
    (data ?? []).map(row => {
      const profile = row as CircleProfileRow;
      return [profile.user_id, profile];
    }),
  );
}

function mapFeedItem(
  row: PublicPostRow,
  profiles: Map<string, CircleProfileRow>,
): PublicCircleFeedItem {
  const profile = profiles.get(row.user_id);
  return {
    id: Number(row.id),
    userId: row.user_id,
    nickname: profile?.nickname?.trim() || 'anonymous bip',
    avatarEmoji: profile?.avatar_emoji?.trim() || '🌙',
    text: row.text,
    postMood: row.post_mood,
    mediaKind: row.media_kind,
    reactions: normalizeReactions(row.reactions),
    createdAt: row.created_at,
  };
}

export async function loadPublicCircleFeed(limit = 40): Promise<PublicCircleFeedItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('public_circle_posts')
    .select('id,user_id,text,post_mood,media_kind,reactions,created_at')
    .eq('safety_flagged', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as PublicPostRow[];
  const profiles = await loadProfileMap(rows.map(row => row.user_id));
  return rows.map(row => mapFeedItem(row, profiles));
}

export async function createPublicCirclePost(
  text: string,
  postMood?: string | null,
): Promise<PublicCircleFeedItem> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Circle is unavailable while Supabase is disconnected.');

  const user = await currentPermanentUser();
  if (!user) throw new Error('Create a permanent Bip account before posting to Circle.');

  const { data, error } = await supabase
    .from('public_circle_posts')
    .insert({
      user_id: user.id,
      text: text.trim(),
      post_mood: postMood ?? null,
      media_kind: null,
      reactions: EMPTY_REACTIONS,
    })
    .select('id,user_id,text,post_mood,media_kind,reactions,created_at')
    .single();

  if (error || !data) throw error ?? new Error('Circle did not return the saved post.');

  emitEvent('circle_post');
  const row = data as PublicPostRow;
  const profiles = await loadProfileMap([row.user_id]);
  return mapFeedItem(row, profiles);
}

export async function reactToPublicCirclePost(
  postId: number,
  reaction: CircleReactionKey,
): Promise<CircleReactionCounts> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Circle reactions are unavailable while offline.');

  const user = await currentPermanentUser();
  if (!user) throw new Error('Create a permanent Bip account before reacting.');

  const { data, error } = await supabase.rpc('react_to_public_circle_post', {
    p_post_id: postId,
    p_emoji: reaction,
  });

  if (error) throw error;
  emitEvent('circle_reaction', { reactionKey: reaction });
  return normalizeReactions(data);
}

export async function reportPublicCirclePost(postId: number): Promise<void> {
  const reported = await reportPost(postId, 'public');
  if (!reported) throw new Error('The report could not be submitted. Try again.');
}

export function isHeavyCircleText(text: string): boolean {
  const value = text.toLowerCase();
  return [
    'alone', 'hurt', 'numb', 'scared', 'crying', 'hopeless', 'empty',
    'hate myself', 'want to die', 'dying', 'pain',
  ].some(term => value.includes(term));
}
