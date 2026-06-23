// app/(teen)/companion-chat.tsx
// Se'kret Bip — Persistent Companion Chat Route
//
// Registered under the (teen) route group so the root layout's userSide
// guard protects it automatically — no extra auth logic needed here.
//
// Navigation:
//   router.push({
//     pathname: '/(teen)/companion-chat',
//     params: { companion: selectedSekret, surface: 'journal' },
//   });
//
// History is keyed per companion + surface so conversations never bleed:
//   sekret:chat:history:{companionKey}:{surface}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CompanionChatHeader } from '../../components/chat/CompanionChatHeader';
import { CompanionTypingIndicator } from '../../components/chat/CompanionTypingIndicator';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import {
  fetchSekretReply,
  type SekretSurface,
} from '../../src/utils/api';
import {
  AVATARS,
  getRoomBg,
  getRoomPhase,
  normalizeCharacterKey,
  SEKRET_PROFILES,
  type Character,
} from '../../constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────────────────
export type ChatMsg = {
  id: string;
  from: 'companion' | 'user';
  text: string;
  time: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────────────────
function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildHistoryKey(companionKey: string, surface: string): string {
  return `sekret:chat:history:${companionKey}:${surface}`;
}

async function loadHistory(key: string): Promise<ChatMsg[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ChatMsg[]) : [];
  } catch {
    return [];
  }
}

async function persistHistory(key: string, msgs: ChatMsg[]): Promise<void> {
  try {
    // Keep last 100 messages to cap storage usage
    const trimmed = msgs.slice(-100);
    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // Non-fatal — history will reload from last saved checkpoint
  }
}

// ── Route ────────────────────────────────────────────────────────────────────────────────
export default function CompanionChatScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    companion?: string;
    surface?: string;
  }>();

  const companionKey = params.companion ?? 'raylene';
  const surface = (params.surface ?? 'journal') as SekretSurface;

  // Resolve profile — fall back to 'soft' (Raylene) for legacy 'soft' key
  const profileKey = companionKey in SEKRET_PROFILES ? companionKey : 'soft';
  const profile = SEKRET_PROFILES[profileKey];
  const charKey: Character = normalizeCharacterKey(profileKey);

  // Room background, time-of-day aware
  const roomPhase = useMemo(() => getRoomPhase(), []);
  const bgSource = useMemo(() => getRoomBg(charKey, roomPhase), [charKey, roomPhase]);

  // Companion portrait for header
  const portrait = AVATARS[charKey]?.neutral ?? AVATARS[charKey]?.fullbody ?? null;

  // Per-companion + per-surface history key
  const storageKey = useMemo(
    () => buildHistoryKey(profileKey, surface),
    [profileKey, surface],
  );

  // ── State ────────────────────────────────────────────────────────────────
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMsg>>(null);

  // Load history on mount; show companion greeting if empty
  useEffect(() => {
    loadHistory(storageKey).then((saved) => {
      if (saved.length === 0) {
        const welcome: ChatMsg = {
          id: 'welcome',
          from: 'companion',
          text: profile.greeting,
          time: nowTime(),
        };
        setMsgs([welcome]);
        persistHistory(storageKey, [welcome]);
      } else {
        setMsgs(saved);
      }
    });
  }, [storageKey]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    setSendError(null);

    const userMsg: ChatMsg = {
      id: String(Date.now()),
      from: 'user',
      text: text.trim(),
      time: nowTime(),
    };

    // 1. Append user message + set loading
    const withUser = [...msgs, userMsg];
    setMsgs(withUser);
    setLoading(true);

    // 2. Persist user message IMMEDIATELY — never lost on network failure
    await persistHistory(storageKey, withUser);

    try {
      const replyText = await fetchSekretReply(
        userMsg.text,
        surface,
        undefined,    // mood — wire from global state later if needed
        profileKey,   // avatarKey → raylene | rylane | cloud | night
      );

      if (!replyText.trim()) throw new Error('Empty reply');

      const companionMsg: ChatMsg = {
        id: String(Date.now() + 1),
        from: 'companion',
        text: replyText,
        time: nowTime(),
      };
      const final = [...withUser, companionMsg];
      setMsgs(final);
      await persistHistory(storageKey, final);
    } catch (error) {
      console.error('[companion-chat] reply failed', { error, companionKey, surface });
      setSendError('Something went wrong — your message was saved. Tap to try again.');
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...msgs].reverse().find((m) => m.from === 'user');
    if (lastUserMsg) {
      setSendError(null);
      handleSend(lastUserMsg.text);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────────────────
  return (
    <ImageBackground source={bgSource} style={s.root} resizeMode="cover">
      <LinearGradient
        colors={['rgba(20,10,40,0.42)', 'rgba(12,6,28,0.90)']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>

        <CompanionChatHeader
          name={profile.name}
          title={profile.title}
          emoji={profile.emoji}
          portrait={portrait}
          onBack={() => router.back()}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.flex}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={msgs}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <ChatBubble from={item.from} text={item.text} time={item.time} />
            )}
            contentContainerStyle={s.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />

          {loading && (
            <CompanionTypingIndicator name={profile.name} emoji={profile.emoji} />
          )}

          {sendError && (
            <TouchableOpacity style={s.errorBanner} onPress={retryLastMessage} activeOpacity={0.8}>
              <Text style={s.errorText}>{sendError}</Text>
            </TouchableOpacity>
          )}

          <ChatInput
            onSend={handleSend}
            disabled={loading}
            placeholder={`talk to ${profile.name}…`}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#110a28' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  msgList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: '#ff8fa3',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
