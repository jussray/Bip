/**
 * app/(main)/circle.tsx
 *
 * Community Circle — anonymous peer support feed.
 * Posts use reactions (felt it, comfort, proud, stay).
 *
 * Cloud sync: writeCirclePost writes to Supabase; loadCircleFeed reads back.
 * Optimistic: post appears instantly in local state, cloud write fires async.
 * Pull-to-refresh: re-fetches the public feed from the cloud.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { writeCirclePost, loadCircleFeed, syncCircleReaction } from '@/utils/sync';
import type { CirclePost } from '@/context/AppContext';

const REACTION_LABELS: { key: keyof CirclePost['reactions']; emoji: string }[] = [
  { key: 'felt',    emoji: '\uD83E\uDED6 felt it' },
  { key: 'comfort', emoji: '\uD83D\uDC99 comfort' },
  { key: 'proud',   emoji: '\u2728 proud' },
  { key: 'stay',    emoji: '\uD83C\uDF19 stay' },
];

export default function CircleScreen() {
  const { circlePosts, setCirclePosts } = useAppContext();
  const [draft, setDraft] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);

  // Load feed from cloud on mount
  useEffect(() => { void fetchFeed(); }, []);

  async function fetchFeed() {
    const cloudPosts = await loadCircleFeed('public', 40);
    if (!cloudPosts) return; // no Supabase config — keep local state
    // Merge cloud posts with any optimistic-only local posts (id not in cloud yet)
    setCirclePosts(prev => {
      const cloudIds = new Set((cloudPosts as any[]).map((p: any) => String(p.id)));
      const localOnly = prev.filter(p => !cloudIds.has(String(p.id)));
      const mapped: CirclePost[] = (cloudPosts as any[]).map((p: any) => ({
        id:        p.id,
        text:      p.text ?? p.body ?? '',
        date:      p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
        time:      p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        reactions: p.reactions ?? { felt: 0, comfort: 0, proud: 0, stay: 0 },
      }));
      return [...localOnly, ...mapped];
    });
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  }, []);

  async function submitPost() {
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);

    // Optimistic insert
    const optimisticPost: CirclePost = {
      id:   Date.now(),
      text,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: { felt: 0, comfort: 0, proud: 0, stay: 0 },
    };
    setCirclePosts(prev => [optimisticPost, ...prev]);
    setDraft('');

    // Cloud write (fire-and-forget — never throws)
    await writeCirclePost('public', text);
    setPosting(false);
  }

  function react(postId: number, key: keyof CirclePost['reactions']) {
    setCirclePosts(posts =>
      posts.map(p =>
        p.id === postId
          ? { ...p, reactions: { ...p.reactions, [key]: (p.reactions[key] ?? 0) + 1 } }
          : p
      )
    );
    // Best-effort cloud reaction sync
    void syncCircleReaction(postId, key);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Circle \uD83C\uDF10</Text>
      <Text style={styles.sub}>Anonymous. Kind. Yours.</Text>

      {/* Compose */}
      <View style={styles.compose}>
        <TextInput
          style={styles.input}
          placeholder="Share something with the circle..."
          placeholderTextColor="#555"
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={280}
        />
        <TouchableOpacity
          style={[styles.postBtn, (!draft.trim() || posting) && styles.postBtnDisabled]}
          onPress={submitPost}
          disabled={!draft.trim() || posting}
        >
          <Text style={styles.postBtnText}>{posting ? 'Sharing\u2026' : 'Share'}</Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.feed}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D946EF"
            colors={['#D946EF']}
          />
        }
      >
        {circlePosts.length === 0 && !refreshing && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>\uD83C\uDF19</Text>
            <Text style={styles.emptyText}>Be the first to share something.</Text>
          </View>
        )}
        {circlePosts.map(post => (
          <View key={post.id} style={styles.card}>
            <Text style={styles.cardText}>{post.text}</Text>
            <Text style={styles.cardMeta}>{post.date} \u00b7 {post.time}</Text>
            <View style={styles.reactions}>
              {REACTION_LABELS.map(({ key, emoji }) => (
                <TouchableOpacity
                  key={key}
                  style={styles.reactionBtn}
                  onPress={() => react(post.id, key)}
                >
                  <Text style={styles.reactionText}>
                    {emoji}{(post.reactions[key] ?? 0) > 0 ? ` ${post.reactions[key] ?? 0}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0d0d0d', padding: 20, paddingTop: 56 },
  heading:         { color: '#fff', fontSize: 24, fontWeight: '800' },
  sub:             { color: '#666', fontSize: 13, marginBottom: 20, marginTop: 4 },
  compose:         { backgroundColor: '#111827', borderRadius: 16, padding: 14, marginBottom: 20 },
  input:           { color: '#fff', fontSize: 15, minHeight: 60, lineHeight: 22 },
  postBtn:         { alignSelf: 'flex-end', backgroundColor: '#D946EF', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, marginTop: 8 },
  postBtnDisabled: { opacity: 0.35 },
  postBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  feed:            { flex: 1 },
  emptyState:      { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:      { fontSize: 36, marginBottom: 10 },
  emptyText:       { color: '#555', fontSize: 14 },
  card:            { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardText:        { color: '#E2E8F0', fontSize: 15, lineHeight: 22, marginBottom: 8 },
  cardMeta:        { color: '#555', fontSize: 11, marginBottom: 10 },
  reactions:       { flexDirection: 'row', flexWrap: 'wrap', marginTop: 0 },
  reactionBtn:     { backgroundColor: '#1E293B', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  reactionText:    { color: '#94A3B8', fontSize: 12 },
});
