/**
 * app/(main)/bridge.tsx
 *
 * Parent Bridge — safe channel between teen and parent.
 * Teen side: leave a note for your parent.
 * Parent side: view notes + respond with supportive prompts.
 *
 * NOTE: `sent` is local component state — notes are only visible
 * this session. Supabase sync (cross-device persistence) is wired
 * in a later sprint.
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

const BRIDGE_PROMPTS = [
  'I had a hard day.',
  "I need some space right now.",
  'I want to talk but don\'t know how.',
  'I\'m proud of something today.',
  'I need help with something.',
];

export default function BridgeScreen() {
  const { userSide } = useAppContext();
  const [message, setMessage] = useState('');
  const [sent, setSent]       = useState<string[]>([]);

  function sendNote(text: string) {
    const t = text.trim();
    if (!t) return;
    setSent((s) => [t, ...s]);
    setMessage('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>
        {userSide === 'parent' ? 'Bridge 🌉' : 'Bridge to Your Parent 🌉'}
      </Text>
      <Text style={styles.sub}>
        {userSide === 'parent'
          ? 'Notes your teen has shared with you this session.'
          : 'Leave a note. They\'ll see it when they\'re ready.'}
      </Text>

      {userSide === 'teen' && (
        <>
          {/* Quick prompts */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.prompts}
          >
            {BRIDGE_PROMPTS.map((p) => (
              <TouchableOpacity
                key={p}
                style={styles.promptChip}
                onPress={() => setMessage(p)}
              >
                <Text style={styles.promptText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Compose */}
          <View style={styles.compose}>
            <TextInput
              style={styles.input}
              placeholder="Write something to your parent..."
              placeholderTextColor="#555"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
              onPress={() => sendNote(message)}
              disabled={!message.trim()}
            >
              <Text style={styles.sendBtnText}>Send Note</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Sent notes */}
      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {sent.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌉</Text>
            <Text style={styles.emptyText}>
              {userSide === 'parent'
                ? 'No notes from your teen yet this session.'
                : 'Notes you send will appear here.'}
            </Text>
          </View>
        )}
        {sent.map((note, i) => (
          <View key={i} style={styles.noteCard}>
            <Text style={styles.noteText}>{note}</Text>
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
  prompts:         { paddingBottom: 16 },
  promptChip:      { backgroundColor: '#1E293B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  promptText:      { color: '#94A3B8', fontSize: 13 },
  compose:         { backgroundColor: '#111827', borderRadius: 16, padding: 14, marginBottom: 20 },
  input:           { color: '#fff', fontSize: 15, minHeight: 60, lineHeight: 22 },
  sendBtn:         { alignSelf: 'flex-end', backgroundColor: '#4DA3FF', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, marginTop: 8 },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  feed:            { flex: 1 },
  emptyState:      { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:      { fontSize: 36, marginBottom: 10 },
  emptyText:       { color: '#555', fontSize: 14 },
  noteCard:        { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 10 },
  noteText:        { color: '#E2E8F0', fontSize: 15, lineHeight: 22 },
});
