/**
 * app/(main)/circle.tsx
 *
 * Se'kret Bip Circle — teen community board.
 * Cozy scrapbook aesthetic. Avatar/mood identity. Anonymous by default.
 * Reactions: felt · comfort · proud · stay.
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
import { writeCirclePost, loadCircleFeed, syncCircleReaction } from '@/utils/sync';
import type { CirclePost } from '@/context/AppContext';

const REACTION_LABELS: { key: keyof CirclePost['reactions']; emoji: string; label: string }[] = [
  { key: 'felt',    emoji: '💜', label: 'felt'    },
  { key: 'comfort', emoji: '🫂', label: 'comfort' },
  { key: 'proud',   emoji: '💪', label: 'proud'   },
  { key: 'stay',    emoji: '🌙', label: 'stay'    },
];

const MOOD_OPTS = [
  { id: 'heavy',   emoji: '🌧️', label: 'heavy'   },
  { id: 'steady',  emoji: '☁️',  label: 'steady'  },
  { id: 'winning', emoji: '🌟', label: 'winning' },
  { id: 'fun',     emoji: '✨',  label: 'fun'     },
];

const MOOD_COLORS: Record<string, string> = {
  heavy:   '#7dd3fc',
  steady:  '#c4b5fd',
  winning: '#fbbf24',
  fun:     '#fb7185',
};

const PURPLE = '#a855f7';

export default function CircleScreen() {
  const { circlePosts, setCirclePosts } = useAppContext();
  const [draft, setDraft]           = useState('');
  const [composeMood, setComposeMood] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting]       = useState(false);

  useEffect(() => { void fetchFeed(); }, []);

  async function fetchFeed() {
    const cloudPosts = await loadCircleFeed('public', 40);
    if (!cloudPosts) return;
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

    const moodPrefix = composeMood ? `${MOOD_OPTS.find(m => m.id === composeMood)?.emoji} ` : '';
    const fullText   = moodPrefix + text;

    const optimisticPost: CirclePost = {
      id:   Date.now(),
      text:  fullText,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: { felt: 0, comfort: 0, proud: 0, stay: 0 },
    };
    setCirclePosts(prev => [optimisticPost, ...prev]);
    setDraft('');
    setComposeMood('');

    await writeCirclePost('public', fullText);
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
    void syncCircleReaction(postId, key);
  }

  // Detect mood emoji prefix in post text for display
  function getPostMood(text: string): { emoji: string; color: string } | null {
    for (const m of MOOD_OPTS) {
      if (text.startsWith(m.emoji + ' ')) {
        return { emoji: m.emoji, color: MOOD_COLORS[m.id] };
      }
    }
    return null;
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.kicker}>SE'KRET BIP CIRCLE</Text>
          <Text style={s.title}>Circle 💜</Text>
        </View>
        <View style={s.anonPill}>
          <Text style={s.anonPillText}>🌑 anonymous</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={s.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PURPLE}
            colors={[PURPLE]}
          />
        }
      >
        {/* Compose card */}
        <View style={s.composeCard}>
          <Text style={s.composeLabel}>put something into the circle</Text>

          {/* Mood picker */}
          <View style={s.moodRow}>
            {MOOD_OPTS.map(m => {
              const active = composeMood === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[s.moodPill, active && { backgroundColor: MOOD_COLORS[m.id] + '30', borderColor: MOOD_COLORS[m.id] }]}
                  onPress={() => setComposeMood(active ? '' : m.id)}
                >
                  <Text style={s.moodPillEmoji}>{m.emoji}</Text>
                  <Text style={[s.moodPillLabel, active && { color: MOOD_COLORS[m.id] }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={s.input}
            placeholder="say it here. no names. no judgment."
            placeholderTextColor="#5a4870"
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={280}
          />
          <View style={s.composeFooter}>
            <Text style={s.charCount}>{280 - draft.length}</Text>
            <TouchableOpacity
              style={[s.postBtn, (!draft.trim() || posting) && s.postBtnDisabled]}
              onPress={submitPost}
              disabled={!draft.trim() || posting}
            >
              <Text style={s.postBtnText}>{posting ? 'dropping…' : 'Bip it 💜'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feed */}
        {circlePosts.length === 0 && !refreshing && (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🌙</Text>
            <Text style={s.emptyText}>the circle is quiet. be the first to bip.</Text>
          </View>
        )}

        {circlePosts.map(post => {
          const postMood = getPostMood(post.text);
          const displayText = postMood ? post.text.slice(post.text.indexOf(' ') + 1) : post.text;
          return (
            <View key={post.id} style={[s.card, postMood && { borderLeftColor: postMood.color, borderLeftWidth: 3 }]}>
              {/* Card header */}
              <View style={s.cardHeader}>
                <View style={s.anonBadge}>
                  {postMood ? (
                    <Text style={[s.anonMoodEmoji, { color: postMood.color }]}>{postMood.emoji}</Text>
                  ) : (
                    <Text style={s.anonDot}>🌑</Text>
                  )}
                  <Text style={s.anonLabel}>anonymous bip</Text>
                </View>
                <Text style={s.cardTime}>{post.time || ''}</Text>
              </View>

              <Text style={s.cardText}>{displayText}</Text>

              {/* Reactions */}
              <View style={s.reactions}>
                {REACTION_LABELS.map(({ key, emoji, label }) => {
                  const count = post.reactions[key] ?? 0;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[s.reactionBtn, count > 0 && s.reactionBtnActive]}
                      onPress={() => react(post.id, key)}
                    >
                      <Text style={s.reactionEmoji}>{emoji}</Text>
                      <Text style={[s.reactionLabel, count > 0 && s.reactionLabelActive]}>{label}</Text>
                      {count > 0 && <Text style={s.reactionCount}>{count}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#0d0518' },
  scroll:  { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  kicker: { color: '#5a3a78', fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title:  { color: '#f0e6ff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  anonPill: {
    backgroundColor: '#1e0b30',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#3d1a5e',
  },
  anonPillText: { color: '#7c5a9e', fontSize: 11, fontWeight: '600' },

  // Compose card
  composeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#180a28',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3d1a5e',
    shadowColor: '#a855f7',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  composeLabel: { color: '#6b4888', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  moodRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  moodPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#2d1450',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  moodPillEmoji: { fontSize: 13 },
  moodPillLabel: { color: '#6b4888', fontSize: 10, fontWeight: '600' },
  input: {
    color: '#e8dff5',
    fontSize: 15,
    minHeight: 64,
    lineHeight: 22,
    backgroundColor: '#100520',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  composeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount:     { color: '#5a3a78', fontSize: 12 },
  postBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  postBtnDisabled: { opacity: 0.35 },
  postBtnText:     { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Feed cards
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#16082a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2e1250',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  anonBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  anonDot:       { fontSize: 12, opacity: 0.7 },
  anonMoodEmoji: { fontSize: 14 },
  anonLabel: { color: '#5a3a78', fontSize: 11, fontWeight: '600' },
  cardTime:  { color: '#3d2258', fontSize: 10 },
  cardText:  { color: '#e8dff5', fontSize: 15, lineHeight: 23, marginBottom: 12 },

  // Reactions
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e0a30',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2e1250',
  },
  reactionBtnActive: {
    backgroundColor: '#3d1a5e',
    borderColor: '#7c3aed',
  },
  reactionEmoji: { fontSize: 14 },
  reactionLabel: { color: '#5a3a78', fontSize: 11, fontWeight: '600' },
  reactionLabelActive: { color: '#c4b5fd' },
  reactionCount: { color: '#a855f7', fontSize: 11, fontWeight: '800', marginLeft: 2 },

  // Empty state
  empty:      { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyText:  { color: '#4a2e60', fontSize: 14, textAlign: 'center' },
});
