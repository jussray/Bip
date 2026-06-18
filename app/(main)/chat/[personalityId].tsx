/**
 * app/(main)/chat/[personalityId].tsx
 *
 * Full personality chat screen.
 * Routes:
 *   /chat/raylene  →  Raylene (Soft Big Sis)
 *   /chat/rylane   →  Rylane  (Loyal Bro)
 *   /chat/cloud    →  Cloud   (Quiet Comfort)
 *   /chat/night    →  Night   (Late-Night Listener)
 *   /chat/oracle   →  Oracle  (Wisdom Voice)
 *
 * Sync behaviour:
 * - On mount: loadOracleSession(id) pulls the last 10 messages from cloud
 *   and injects them as system context so the AI remembers prior sessions.
 * - On unmount (if user sent ≥1 message): syncOracleSession(id, memory, count)
 *   persists the session snapshot for ALL personalities, not just Oracle.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  sendMessage,
  makeUserMessage,
  makeAssistantMessage,
  PERSONALITY_CONFIG,
} from '@/services/ai';
import type { ChatMessage } from '@/services/ai';
import type { PersonalityId } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { syncOracleSession, loadOracleSession } from '@/utils/sync';

const VALID_IDS: PersonalityId[] = ['raylene', 'rylane', 'cloud', 'night', 'oracle'];

const TAB_BAR_HEIGHT = 68;
const KB_OFFSET = Platform.OS === 'ios' ? TAB_BAR_HEIGHT : 0;

export default function PersonalityChatScreen() {
  const { personalityId } = useLocalSearchParams<{ personalityId: string }>();
  const { mood } = useAppContext();

  const id = VALID_IDS.includes(personalityId as PersonalityId)
    ? (personalityId as PersonalityId)
    : 'raylene';

  const config = PERSONALITY_CONFIG[id];

  const [messages, setMessages] = useState<ChatMessage[]>([
    makeAssistantMessage(config.greeting),
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef             = useRef<ScrollView>(null);

  // Track whether this session had any user messages (worth syncing)
  const hadActivity   = useRef(false);
  // Local session count — incremented each time this screen unmounts with activity
  const sessionCount  = useRef(0);

  // ── Load cloud memory on mount ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const saved = await loadOracleSession(id);
      if (!saved) return;
      sessionCount.current = saved.sessionCount;
      // Restore the last messages snapshot as extra context in the chat.
      // We prepend them so the AI sees prior conversation without cluttering
      // the visible UI (they appear before the greeting bubble).
      const prior = (saved.memory?.lastMessages as Array<{ role: string; text: string }> | undefined) ?? [];
      if (prior.length > 0) {
        const restored: ChatMessage[] = prior.map((m, i) =>
          m.role === 'user'
            ? makeUserMessage(m.text)
            : makeAssistantMessage(m.text),
        );
        // Insert prior messages before the greeting so they act as context
        setMessages(current => [...restored, ...current]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Sync session to cloud on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (!hadActivity.current) return;
      const memory = {
        lastMessages: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
        lastMood:     mood,
        lastSession:  new Date().toISOString(),
      };
      const newCount = sessionCount.current + 1;
      sessionCount.current = newCount;
      // Sync ALL personalities — not just oracle
      void syncOracleSession(id, memory, newCount);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    hadActivity.current = true;
    const userMsg = makeUserMessage(text);
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    scrollRef.current?.scrollToEnd({ animated: true });

    // Pass full history so AI has conversation context
    const reply     = await sendMessage(id, text, 'chat', mood, nextMessages);
    const assistMsg = makeAssistantMessage(reply);

    setMessages(m => [...m, assistMsg]);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [id, input, loading, mood, messages]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: config.cardColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>{config.emoji}</Text>
        <View>
          <Text style={[styles.headerName, { color: config.accentColor }]}>
            {config.name}
          </Text>
          <Text style={styles.headerTitle}>{config.title}</Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={KB_OFFSET}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.role === 'user'
                  ? styles.userBubble
                  : [styles.assistBubble, { borderColor: config.accentColor + '40' }],
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'user' && styles.userBubbleText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.bubble, styles.assistBubble]}>
              <ActivityIndicator size="small" color={config.accentColor} />
            </View>
          )}
        </ScrollView>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Say something..."
            placeholderTextColor="#666"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: config.accentColor },
              (!input.trim() || loading) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1 },
  flex:            { flex: 1 },
  header:          {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff12',
  },
  backBtn:         { marginRight: 16 },
  backText:        { color: '#999', fontSize: 20 },
  headerEmoji:     { fontSize: 28, marginRight: 12 },
  headerName:      { fontSize: 17, fontWeight: '700' },
  headerTitle:     { color: '#888', fontSize: 12, marginTop: 2 },
  messages:        { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  bubble:          {
    maxWidth:          '80%',
    paddingVertical:   10,
    paddingHorizontal: 14,
    borderRadius:      18,
    marginBottom:      4,
  },
  userBubble:      { alignSelf: 'flex-end', backgroundColor: '#1E293B' },
  assistBubble:    { alignSelf: 'flex-start', backgroundColor: '#111827', borderWidth: 1 },
  bubbleText:      { color: '#D1D5DB', fontSize: 15, lineHeight: 22 },
  userBubbleText:  { color: '#fff' },
  inputRow:        {
    flexDirection:   'row',
    alignItems:      'flex-end',
    padding:         16,
    paddingBottom:   Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth:  1,
    borderTopColor:  '#ffffff10',
    backgroundColor: '#0d0d0d',
  },
  input:           {
    flex:              1,
    backgroundColor:   '#1E293B',
    color:             '#fff',
    borderRadius:      20,
    paddingHorizontal: 16,
    paddingVertical:   10,
    fontSize:          15,
    maxHeight:         120,
    marginRight:       10,
  },
  sendBtn:         { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText:     { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
