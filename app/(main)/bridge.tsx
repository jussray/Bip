/**
 * app/(main)/bridge.tsx
 *
 * Teen-side Bridge screen.
 *
 * Privacy design:
 *   - Teen's message text is NEVER sent to Supabase (local-first privacy rule).
 *   - When the teen taps Send, a bridge_signal row is inserted (metadata only:
 *     share_type, char_key, sent_at). This lets the parent see "your teen
 *     reached out" without seeing the actual text.
 *   - Parent warm notes (parent_notes table) ARE fetched and displayed here
 *     because the parent is the author of that content — it's not the teen's
 *     private diary.
 *   - Realtime subscription keeps parent notes live across sessions.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  type TextInput as TextInputType,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import {
  sendBridgeSignal,
  fetchParentNotes,
  markParentNoteSeen,
  subscribeToParentNotes,
  type ParentNote,
} from '@/utils/sync';

const BRIDGE_PROMPTS = [
  'I had a hard day.',
  "I need some space right now.",
  "I want to talk but don't know how.",
  "I'm proud of something today.",
  'I need help with something.',
];

export default function BridgeScreen() {
  const { userSide } = useAppContext();
  const { compose } = useLocalSearchParams<{ compose?: string }>();
  const autoFocus = compose === 'true';

  const [message, setMessage]           = useState('');
  const [sent, setSent]                 = useState<string[]>([]);
  const [parentNotes, setParentNotes]   = useState<ParentNote[]>([]);
  const inputRef                        = useRef<TextInputType>(null);
  const scrollRef                       = useRef<ScrollView>(null);

  // Load parent notes + subscribe to Realtime on mount.
  useEffect(() => {
    let unsub = () => {};
    if (userSide !== 'parent') {
      (async () => {
        const existing = await fetchParentNotes();
        setParentNotes(existing);
        // Mark all unseen notes as seen now that the teen has opened Bridge.
        existing.filter(n => !n.seen_by_teen).forEach(n => markParentNoteSeen(n.id));
        unsub = await subscribeToParentNotes((note) => {
          setParentNotes(prev => [note, ...prev]);
          markParentNoteSeen(note.id);
        });
      })();
    }
    return () => { unsub(); };
  }, [userSide]);

  // Auto-focus when arriving via S2Tell.
  useEffect(() => {
    if (autoFocus && userSide !== 'parent') {
      const t = setTimeout(() => {
        inputRef.current?.focus();
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
      return () => clearTimeout(t);
    }
  }, [autoFocus, userSide]);

  const sendNote = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    // Show locally — privacy rule: text never goes to Supabase.
    setSent(s => [t, ...s]);
    setMessage('');
    // Fire metadata signal so parent sees "your teen reached out".
    void sendBridgeSignal({ shareType: 'thought', convMode: null, charKey: 'rylane' });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.heading}>
          {userSide === 'parent' ? 'Bridge 🌉' : 'Bridge to Your Parent 🌉'}
        </Text>
        <Text style={styles.sub}>
          {userSide === 'parent'
            ? 'Notes your teen has shared with you this session.'
            : autoFocus
              ? 'Something you want them to know — write it here.'
              : "Leave a note. They'll see it when they're ready."}
        </Text>

        {userSide !== 'parent' && (
          <>
            {/* Quick prompts */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prompts}
              keyboardShouldPersistTaps="handled"
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
                ref={inputRef}
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

            {/* Parent notes section */}
            {parentNotes.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>From your parent 💜</Text>
                {parentNotes.map((note) => (
                  <View key={note.id} style={styles.parentNoteCard}>
                    <Text style={styles.noteText}>{note.content}</Text>
                    <Text style={styles.noteTime}>
                      {new Date(note.sent_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* Teen's sent notes (local only) */}
        {sent.length === 0 && parentNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌉</Text>
            <Text style={styles.emptyText}>
              {userSide === 'parent'
                ? 'No notes from your teen yet this session.'
                : 'Notes you send will appear here.'}
            </Text>
          </View>
        ) : sent.length > 0 ? (
          <>
            {userSide !== 'parent' && <Text style={styles.sectionLabel}>Sent this session</Text>}
            {sent.map((note, i) => (
              <View key={i} style={styles.noteCard}>
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0d0d0d' },
  content:         { padding: 20, paddingTop: 56, paddingBottom: 40 },
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
  sectionLabel:    { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  parentNoteCard:  { backgroundColor: '#1a1130', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#7c3aed40' },
  noteCard:        { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 10 },
  noteText:        { color: '#E2E8F0', fontSize: 15, lineHeight: 22 },
  noteTime:        { color: '#6b7280', fontSize: 11, marginTop: 6 },
  emptyState:      { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:      { fontSize: 36, marginBottom: 10 },
  emptyText:       { color: '#555', fontSize: 14 },
});
