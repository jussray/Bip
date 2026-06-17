/**
 * app/(main)/circle.tsx
 *
 * Community Circle — anonymous peer support feed.
 * Posts use reactions (felt it, comfort, proud, stay).
 * Full implementation in a later sprint; real UI shell here.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import type { CirclePost } from '@/context/AppContext';

const REACTION_LABELS: { key: keyof CirclePost['reactions']; emoji: string }[] = [
  { key: 'felt',    emoji: '🫖 felt it' },
  { key: 'comfort', emoji: '💙 comfort' },
  { key: 'proud',   emoji: '✨ proud' },
  { key: 'stay',    emoji: '🌙 stay' },
];

export default function CircleScreen() {
  // circlePosts + setCirclePosts are now properly typed on AppContextValue
  const { circlePosts, setCirclePosts } = useAppContext();
  const [draft, setDraft] = useState('');

  function submitPost() {
    const text = draft.trim();
    if (!text) return;
    const post: CirclePost = {
      id:   Date.now(),
      text,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: { felt: 0, comfort: 0, proud: 0, stay: 0 },
    };
    setCirclePosts((prev) => [post, ...prev]);
    setDraft('');
  }

  function react(postId: number, key: keyof CirclePost['reactions']) {
    setCirclePosts((posts) =>
      posts.map((p) =>
        p.id === postId
          ? { ...p, reactions: { ...p.reactions, [key]: p.reactions[key] + 1 } }
          : p
      )
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Circle 🌐</Text>
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
          style={[styles.postBtn, !draft.trim() && styles.postBtnDisabled]}
          onPress={submitPost}
          disabled={!draft.trim()}
        >
          <Text style={styles.postBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.feed}>
        {circlePosts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌙</Text>
            <Text style={styles.emptyText}>Be the first to share something.</Text>
          </View>
        )}
        {circlePosts.map((post) => (
          <View key={post.id} style={styles.card}>
            <Text style={styles.cardText}>{post.text}</Text>
            <Text style={styles.cardMeta}>{post.date} · {post.time}</Text>
            <View style={styles.reactions}>
              {REACTION_LABELS.map(({ key, emoji }) => (
                <TouchableOpacity
                  key={key}
                  style={styles.reactionBtn}
                  onPress={() => react(post.id, key)}
                >
                  <Text style={styles.reactionText}>
                    {emoji}{post.reactions[key] > 0 ? ` ${post.reactions[key]}` : ''}
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
