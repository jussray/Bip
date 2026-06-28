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
//
// Safety integration (Phase 3):
//   - Pre-flight: checkTextBeforePost before every send
//   - Post-reply: if safetyFlag, surface SafetyExperienceSheet
//   - Post-reply: if suggestedComfortTool, show LoopNudge → Comfort

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
import { SafetyExperienceSheet } from '../../components/safety/SafetyExperienceSheet';
import {
  sendCompanionMessage,
  toCompanionId,
  type CompanionSurface,
} from '../../src/features/sekret/companionEngine';
import {
  checkTextBeforePost,
  checkForFlaggedItems,
  type SafetyExperience,
} from '../../src/features/safety/safetyCoordinator';
import {
  AVATARS,
  getRoomBg,
  getRoomPhase,
  normalizeCharacterKey,
  SEKRET_PROFILES,
  type Character,
} from '../../constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ChatMsg = {
  id: string;
  from: 'companion' | 'user';
  text: string;
  time: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Route ─────────────────────────────────────────────────────────────────────
export default function CompanionChatScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    companion?: string;
    surface?: string;
  }>();

  const companionKey = params.companion ?? 'raylene';
  const surface = (params.surface ?? 'journal') as CompanionSurface;

  // Resolve profile — fall back to 'soft' (Raylene) for legacy 'soft' key
  const profileKey = companionKey in SEKRET_PROFILES ? companionKey : 'soft';
  const profile    = SEKRET_PROFILES[profileKey];
  const charKey: Character = normalizeCharacterKey(profileKey);
  const companionId = toCompanionId(profileKey);

  // Room background, time-of-day aware
  const roomPhase = useMemo(() => getRoomPhase(), []);
  const bgSource  = useMemo(() => getRoomBg(charKey, roomPhase), [charKey, roomPhase]);

  // Companion portrait for header
  const portrait = AVATARS[charKey]?.neutral ?? AVATARS[charKey]?.fullbody ?? null;

  // Per-companion + per-surface history key
  const storageKey = useMemo(
    () => buildHistoryKey(profileKey, surface),
    [profileKey, surface],
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const [msgs, setMsgs]                           = useState<ChatMsg[]>([]);
  const [loading, setLoading]                     = useState(false);
  const [safetyExperience, setSafetyExperience]   = useState<SafetyExperience | null>(null);
  const [comfortNudge, setComfortNudge]           = useState<string | null>(null);
  const [teenGender, setTeenGender]               = useState<'girl' | 'boy' | 'other' | null>(null);
  const listRef = useRef<FlatList<ChatMsg>>(null);

  // Load teen gender from profile so companions can tailor their responses
  useEffect(() => {
    AsyncStorage.getItem('teen_profile_data').then(raw => {
      if (!raw) return;
      try {
        const data = JSON.parse(raw) as { gender?: string };
        if (data.gender === 'girl' || data.gender === 'boy' || data.gender === 'other') {
          setTeenGender(data.gender as 'girl' | 'boy' | 'other');
        }
      } catch { /* ignore */ }
    });
  }, []);

  // Load history on mount; show companion greeting if empty
  useEffect(() => {
    loadHistory(storageKey).then((saved) => {
      if (saved.length === 0) {
        const welcome: ChatMsg = {
          id:   'welcome',
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

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    // Pre-flight: client-side safety check before any network call
    const preflight = checkTextBeforePost(text.trim(), companionId);
    if (preflight) {
      setSafetyExperience(preflight);
      // Still proceed — the teen chose to send; backend scan runs independently
    }

    const userMsg: ChatMsg = {
      id:   String(Date.now()),
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
      const result = await sendCompanionMessage({
        companionId,
        surface,
        text: userMsg.text,
        teenGender,
      });
      const replyText = result.reply;

      if (!replyText.trim()) throw new Error('Empty reply');

      const companionMsg: ChatMsg = {
        id:   String(Date.now() + 1),
        from: 'companion',
        text: replyText,
        time: nowTime(),
      };
      const final = [...withUser, companionMsg];
      setMsgs(final);
      await persistHistory(storageKey, final);

      // Post-reply: if backend flagged this, surface the safety experience
      if (result.safetyFlag && !preflight) {
        const flagged = await checkForFlaggedItems(companionId);
        if (flagged) setSafetyExperience(flagged);
      }

      // Post-reply: comfort nudge if companion suggested it
      if (result.suggestedComfortTool && !preflight) {
        setComfortNudge(result.suggestedComfortTool);
      }
    } catch {
      const errMsg: ChatMsg = {
        id:   String(Date.now() + 1),
        from: 'companion',
        text: `${profile.name} is still here — the connection was shaky but your message was saved 💜`,
        time: nowTime(),
      };
      const final = [...withUser, errMsg];
      setMsgs(final);
      await persistHistory(storageKey, final);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
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

          {/* Loop nudge: companion suggested Comfort after heavy reply */}
          {comfortNudge && !loading && (
            <View style={s.nudgeWrap}>
              <Text style={s.nudgeText}>
                {profile.name} thinks Comfort might help right now
              </Text>
              <View style={s.nudgeRow}>
                <TouchableOpacity
                  style={s.nudgeBtn}
                  onPress={() => {
                    setComfortNudge(null);
                    router.push('/(teen)/comfort' as any);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Open Comfort"
                >
                  <Text style={s.nudgeBtnText}>open Comfort</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setComfortNudge(null)}
                  style={s.nudgeDismiss}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss"
                >
                  <Text style={s.nudgeDismissText}>I'm okay</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <ChatInput
            onSend={handleSend}
            disabled={loading}
            placeholder={`talk to ${profile.name}…`}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Safety experience sheet — rendered above everything */}
      <SafetyExperienceSheet
        experience={safetyExperience}
        onDismiss={() => setSafetyExperience(null)}
      />
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#110a28' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  msgList: {
    paddingHorizontal: 16,
    paddingTop:        12,
    paddingBottom:     16,
  },
  nudgeWrap: {
    marginHorizontal: 16,
    marginBottom:      8,
    backgroundColor:  'rgba(196,181,253,0.10)',
    borderWidth:       1,
    borderColor:      'rgba(196,181,253,0.25)',
    borderRadius:      16,
    padding:           14,
  },
  nudgeText: {
    color:        '#c4b5fd',
    fontSize:      13,
    fontWeight:   '600',
    marginBottom:  10,
  },
  nudgeRow:        { flexDirection: 'row', gap: 10 },
  nudgeBtn: {
    flex:             1,
    backgroundColor:  'rgba(196,181,253,0.18)',
    borderRadius:      12,
    paddingVertical:   9,
    alignItems:       'center',
    borderWidth:       1,
    borderColor:      'rgba(196,181,253,0.4)',
  },
  nudgeBtnText:     { color: '#f0ebff', fontSize: 13, fontWeight: '700' },
  nudgeDismiss:     { justifyContent: 'center', paddingHorizontal: 12 },
  nudgeDismissText: { color: '#64748b', fontSize: 12 },
});
