// app/parentBridge.tsx
// Se'kret Bip — Parent Window
// Teen controls everything. Parent receives only what teen chooses to share.
// This is a bridge, not a window. Trust first, always.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useSekret } from '../app/_layout';
import { BottomNav } from '../components/BottomNav';
import { THEME_PACKS } from '../constants/theme';

type ParentBridgePayload = {
  sharedTitle?: string;
  preview: string;
  mood?: string;
  moodEmoji?: string;
  shareTypeLabel?: string;
  sharedAt?: string;
  sekretTip?: string;
  softPrompt?: string;
  conversationStarter?: string;
  followUp?: string;
  avoid?: string[];
  guidance?: string;
  translation?: {
    said: string;
    means: string;
  };
};

type ParentBridgeScreenProps = {
  payload?: ParentBridgePayload | null;
  onReplyText?: (text: string) => void;
  onReplyVoice?: () => void;
  onReplyVideo?: () => void;
  onOpenSekret?: () => void;
};

const DEFAULT_PAYLOAD: ParentBridgePayload = {
  sharedTitle: 'What they wanted you to understand 💜',
  preview: "I've been feeling overwhelmed lately and I miss talking comfortably again.",
  mood: 'overwhelmed',
  moodEmoji: '☁️',
  shareTypeLabel: 'Journal Entry',
  sharedAt: 'Today, 7:42 PM',
  sekretTip: 'This message took courage to send.',
  softPrompt: 'Your teen may be looking for understanding more than solutions right now.',
  conversationStarter: "How's your week been for real?",
  followUp: 'Want to tell me what made it feel heavy?',
  avoid: [
    "Why didn't you tell me sooner?",
    'Give me your phone.',
    'Who were you with?',
    "You're overreacting.",
    'When I was your age...',
  ],
  guidance: 'Try listening all the way through before fixing.',
  translation: {
    said: "I've been feeling overwhelmed.",
    means: 'I need someone to sit with me, not fix me.',
  },
};

const SOFT_PROMPTS = [
  'Your teen may be looking for understanding more than solutions right now.',
  'This may be a moment for curiosity before advice.',
  "They shared this because they trust you. That's already something.",
  'Connection before correction. Always.',
  "You don't have to have the perfect response. You just have to show up.",
];

const CONVERSATION_STARTERS = [
  { emoji: '☕', text: "Want to tell me more about that?", type: 'Connection' },
  { emoji: '🌙', text: "Anything on your mind before bed?", type: 'Check-In' },
  { emoji: '💜', text: "I'm here for you, always.", type: 'Support' },
  { emoji: '💬', text: 'What part felt hardest?', type: 'Understanding' },
  { emoji: '🤝', text: "How's your week been for real?", type: 'Connection' },
];

const FOLLOW_UP_QUESTIONS = [
  'When did you start feeling that way?',
  'What would help right now?',
  'What do you wish I understood better?',
  'Is there something specific you need from me?',
  'How can I show up for you differently?',
];

const WHAT_THEY_NEED = [
  { label: 'Encouragement', pct: 45, color: '#a855f7' },
  { label: 'Listen without fixing', pct: 30, color: '#7c3aed' },
  { label: 'More quality time', pct: 15, color: '#6d28d9' },
  { label: 'Space & understanding', pct: 10, color: '#5b21b6' },
];

async function triggerHaptic() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    void 0;
  }
}

export default function ParentBridgeScreen({
  payload,
  onReplyText,
  onReplyVoice,
  onReplyVideo,
  onOpenSekret,
}: ParentBridgeScreenProps) {
  const { userSide, setScreen } = useSekret();
  const [activeStarter, setActiveStarter] = useState<number | null>(null);
  const [activeFollowUp, setActiveFollowUp] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const data = payload || DEFAULT_PAYLOAD;

  const prompt = useMemo(() => {
    return data.softPrompt || SOFT_PROMPTS[0];
  }, [data.softPrompt]);

  const guidance = data.guidance || 'Try listening all the way through before fixing.';

  const translation = data.translation || DEFAULT_PAYLOAD.translation!;
  const avoidPhrases = data.avoid || DEFAULT_PAYLOAD.avoid || [];

  const handleUseStarter = async (text: string) => {
    await triggerHaptic();
    setReplyText(text);
    setActiveStarter(null);
  };

  const handleSendText = async () => {
    if (!replyText.trim()) return;
    await triggerHaptic();
    onReplyText?.(replyText.trim());
    setReplyText('');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Parent Window 💜</Text>
            <Text style={styles.headerSub}>Helping conversations happen gently.</Text>
          </View>
          <View style={styles.parentsBadge}>
            <Text style={styles.parentsBadgeText}>PARENTS SIDE</Text>
          </View>
        </View>

        <View style={styles.trustCard}>
          <Text style={styles.trustEmoji}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.trustTitle}>Trust First, Always</Text>
            <Text style={styles.trustText}>
              You're only seeing what your teen chose to share. This is a bridge, not a window. 💜
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{data.sharedTitle || 'What they wanted you to understand 💜'}</Text>

          <View style={styles.bipCard}>
            <View style={styles.bipCardHeader}>
              <Text style={styles.bipTypeTag}>
                {(data.moodEmoji || '☁️')} {data.shareTypeLabel || 'Shared Note'}
              </Text>
              <Text style={styles.bipTime}>{data.sharedAt || 'Just now'}</Text>
            </View>

            <Text style={styles.bipPreview}>“{data.preview}”</Text>

            {!!data.mood && (
              <View style={styles.moodTag}>
                <Text style={styles.moodTagText}>feeling: {data.mood}</Text>
              </View>
            )}

            {!!data.sekretTip && (
              <View style={styles.sekretTipRow}>
                <Text style={styles.sekretTipLabel}>💜 Se'kret Tip:</Text>
                <Text style={styles.sekretTipText}>{data.sekretTip}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help understand what they might mean</Text>
          <Text style={styles.sectionSub}>Se'kret translates so you can connect deeper. ☁️</Text>

          <View style={styles.translationCard}>
            <View style={styles.translationCol}>
              <Text style={styles.translationLabel}>What they said</Text>
              <Text style={styles.translationText}>{translation.said}</Text>
            </View>
            <Text style={styles.translationArrow}>→</Text>
            <View style={styles.translationCol}>
              <Text style={styles.translationLabel}>What they might mean</Text>
              <Text style={[styles.translationText, { color: '#c4b5fd' }]}>{translation.means}</Text>
            </View>
          </View>

          <View style={styles.thinkFeelingRow}>
            <Text style={styles.thinkFeelingEmoji}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.thinkFeelingTitle}>Think feeling, not just words.</Text>
              <Text style={styles.thinkFeelingText}>Focus on the emotion behind the message.</Text>
            </View>
          </View>
        </View>

        <View style={styles.promptCard}>
          <Text style={styles.promptEmoji}>☁️</Text>
          <Text style={styles.promptText}>{prompt}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What They Need From You</Text>
          <Text style={styles.sectionSub}>This is a gentle guess, not a diagnosis.</Text>
          <View style={styles.needsCard}>
            {WHAT_THEY_NEED.map(item => (
              <View key={item.label} style={styles.needRow}>
                <Text style={styles.needLabel}>{item.label}</Text>
                <View style={styles.needBarTrack}>
                  <View style={[styles.needBarFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={styles.needPct}>{item.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start a Conversation 💬</Text>
          <Text style={styles.sectionSub}>Choose a tone that helps them feel safe.</Text>

          {CONVERSATION_STARTERS.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.starterCard, activeStarter === i && styles.starterCardActive]}
              onPress={() => {
                triggerHaptic();
                setActiveStarter(activeStarter === i ? null : i);
                if (activeStarter !== i) {
                  setReplyText(s.text);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={s.text}
              accessibilityHint="Selects this conversation starter."
              accessibilityState={{ selected: activeStarter === i }}
            >
              <Text style={styles.starterEmoji}>{s.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.starterText}>“{s.text}”</Text>
                <Text style={styles.starterType}>{s.type}</Text>
              </View>
              <View style={[styles.useBtn, activeStarter === i && { backgroundColor: '#7c3aed' }]}>
                <Text style={styles.useBtnText}>{activeStarter === i ? '✓ Saved' : 'Use'}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.writeOwnBtn} onPress={() => setReplyText('')}>
            <Text style={styles.writeOwnText}>✏️  Write your own response</Text>
            <Text style={styles.writeOwnArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.replyComposer}>
            <Text style={styles.replyComposerLabel}>Your reply</Text>
            <TextInput
              style={styles.replyInput}
              placeholder="Type a calm, listening-first reply..."
              placeholderTextColor="#7c6b98"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              accessibilityLabel="Parent reply text box"
              accessibilityHint="Write a gentle response to your teen."
            />
            <TouchableOpacity
              style={styles.replySendBtn}
              onPress={handleSendText}
              accessibilityRole="button"
              accessibilityLabel="Send text reply"
              accessibilityHint="Sends your text reply."
            >
              <Text style={styles.replySendText}>Send text reply</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sekretNoteCard}>
            <Text style={styles.sekretNoteText}>
              💜 Se'kret Tip: Sometimes they need to feel heard before they're ready for advice.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow-Up Questions</Text>
          <Text style={styles.sectionSub}>When the conversation slows down.</Text>
          <View style={styles.followCard}>
            {FOLLOW_UP_QUESTIONS.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.followRow,
                  activeFollowUp === i && { backgroundColor: 'rgba(124,58,237,0.15)' },
                  i < FOLLOW_UP_QUESTIONS.length - 1 && styles.followRowBorder,
                ]}
                onPress={async () => {
                  await triggerHaptic();
                  setActiveFollowUp(activeFollowUp === i ? null : i);
                }}
                accessibilityRole="button"
                accessibilityLabel={q}
                accessibilityHint="Selects this follow-up question."
                accessibilityState={{ selected: activeFollowUp === i }}
              >
                <Text style={styles.followText}>“{q}”</Text>
                <Text style={styles.followArrow}>{activeFollowUp === i ? '✓' : '›'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for this conversation 💜</Text>
          {[
            { emoji: '👂', title: 'Listen more than you talk.', sub: 'Give them space to fully express themselves.' },
            { emoji: '💜', title: 'Validate their feelings.', sub: "Their feelings are real, even if you don't fully understand yet." },
            { emoji: '🤝', title: "Try not to fix it right away.", sub: 'Comfort first. Solutions can come later.' },
            { emoji: '☀️', title: 'Stay calm and connected.', sub: 'Your calm helps them feel safe.' },
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipEmoji}>{tip.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipSub}>{tip.sub}</Text>
              </View>
            </View>
          ))}

          <View style={styles.presentCard}>
            <Text style={styles.presentText}>
              You don't have to be perfect.{'\n'}You just have to stay present. 💜
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Try to avoid starting with...</Text>
          <View style={styles.avoidCard}>
            {avoidPhrases.map((phrase, i) => (
              <View key={i} style={[styles.avoidRow, i < avoidPhrases.length - 1 && styles.avoidRowBorder]}>
                <Text style={styles.avoidX}>✕</Text>
                <Text style={styles.avoidText}>“{phrase}”</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.guidanceCard}>
          <View style={styles.guidanceHeader}>
            <Text style={styles.guidanceCloud}>☁️</Text>
            <Text style={styles.guidanceTitle}>Se'kret Says</Text>
          </View>
          <Text style={styles.guidanceText}>“{guidance}”</Text>
          <TouchableOpacity
            style={styles.talkBtn}
            onPress={() => {
              onOpenSekret?.();
              setScreen?.('sekret');
            }}
            accessibilityRole="button"
            accessibilityLabel="Talk to Se'kret"
            accessibilityHint="Opens Se'kret for guidance."
          >
            <Text style={styles.talkBtnText}>Talk to Se'kret  →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How do you want to respond?</Text>
          <Text style={styles.sectionSub}>Choose a tone that helps them feel safe.</Text>

          <View style={styles.replyRow}>
            {[
              { emoji: '💬', label: 'Text Reply', action: onReplyText },
              { emoji: '🎙️', label: 'Voice Reply', action: onReplyVoice },
              { emoji: '📹', label: 'Video Reply', action: onReplyVideo },
            ].map(({ emoji, label, action }) => (
              <TouchableOpacity
                key={label}
                style={styles.replyBtn}
                onPress={async () => {
                  await triggerHaptic();
                  action?.();
                }}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint={`Send a ${label.toLowerCase()}.`}
              >
                <Text style={styles.replyEmoji}>{emoji}</Text>
                <Text style={styles.replyLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Messages they've shared with you</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="View all shared messages">
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {[
            { preview: "I've been feeling overwhelmed...", time: 'Today, 7:42 PM' },
            { preview: 'I need to talk about something...', time: '2 days ago, 9:15 PM' },
            { preview: 'Can you help me understand...', time: '5 days ago, 6:09 PM' },
          ].map((msg, i) => (
            <TouchableOpacity key={i} style={styles.historyRow} accessibilityRole="button" accessibilityLabel={msg.preview}>
              <View style={styles.historyDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyPreview}>{msg.preview}</Text>
                <Text style={styles.historyTime}>{msg.time}</Text>
              </View>
              <Text style={styles.historyArrow}>›</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.historyFooter}>
            They're opening up. That's a big step. 💜
          </Text>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 Private content stays private. Your teen controls every share. Se'kret protects both of you.
          </Text>
        </View>
      </ScrollView>

      <BottomNav screen="parentBridge" setScreen={setScreen} userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: C.white, marginBottom: 3 },
  headerSub: { fontSize: 13, color: C.mutedLt },
  parentsBadge: { backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1, borderColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  parentsBadgeText: { color: '#c4b5fd', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  trustCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.card2, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', borderRadius: 16, padding: 14, marginBottom: 20 },
  trustEmoji: { fontSize: 22, marginTop: 2 },
  trustTitle: { color: C.white, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  trustText: { color: C.mutedLt, fontSize: 13, lineHeight: 19 },

  section: { marginBottom: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sectionSub: { color: C.muted, fontSize: 12, marginBottom: 12 },
  seeAll: { color: '#a855f7', fontSize: 13 },

  bipCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 18 },
  bipCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  bipTypeTag: { color: '#c4b5fd', fontSize: 12, fontWeight: '700' },
  bipTime: { color: C.muted, fontSize: 11 },
  bipPreview: { color: C.white, fontSize: 17, fontWeight: '700', lineHeight: 26, marginBottom: 12, fontStyle: 'italic' },
  moodTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  moodTagText: { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
  sekretTipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 12, padding: 10 },
  sekretTipLabel: { color: '#a855f7', fontSize: 12, fontWeight: '700' },
  sekretTipText: { color: C.lavender, fontSize: 12, flex: 1, lineHeight: 18 },

  translationCard: { flexDirection: 'row', gap: 10, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  translationCol: { flex: 1 },
  translationLabel: { color: C.muted, fontSize: 11, marginBottom: 6 },
  translationText: { color: C.white, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  translationArrow: { color: '#a855f7', fontSize: 20, alignSelf: 'center' },
  thinkFeelingRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: 'rgba(245,191,0,0.06)', borderRadius: 14, padding: 12 },
  thinkFeelingEmoji: { fontSize: 20 },
  thinkFeelingTitle: { color: C.white, fontWeight: '700', fontSize: 13, marginBottom: 3 },
  thinkFeelingText: { color: C.muted, fontSize: 12 },

  promptCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: 'rgba(168,85,247,0.08)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', borderRadius: 18, padding: 16, marginBottom: 24 },
  promptEmoji: { fontSize: 24, marginTop: 2 },
  promptText: { flex: 1, color: C.lavender, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  needsCard: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 },
  needRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  needLabel: { color: C.lavender, fontSize: 13, width: 130 },
  needBarTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 },
  needBarFill: { height: 6, borderRadius: 3 },
  needPct: { color: C.muted, fontSize: 11, width: 32, textAlign: 'right' },

  starterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  starterCardActive: { borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)' },
  starterEmoji: { fontSize: 24 },
  starterText: { color: C.white, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  starterType: { color: '#a855f7', fontSize: 11 },
  useBtn: { backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  useBtnText: { color: '#c4b5fd', fontSize: 12, fontWeight: '700' },
  writeOwnBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  writeOwnText: { color: C.lavender, fontSize: 14 },
  writeOwnArrow: { color: C.muted, fontSize: 18 },

  replyComposer: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  replyComposerLabel: { color: C.mutedLt, fontSize: 11, marginBottom: 8 },
  replyInput: { minHeight: 90, color: C.white, borderColor: C.border, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10, textAlignVertical: 'top' },
  replySendBtn: { backgroundColor: '#7c3aed', borderRadius: 14, padding: 12, alignItems: 'center' },
  replySendText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  sekretNoteCard: { backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 14, padding: 12 },
  sekretNoteText: { color: C.lavender, fontSize: 13, lineHeight: 20 },

  followCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, overflow: 'hidden' },
  followRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  followRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  followText: { color: C.lavender, fontSize: 13, flex: 1, fontStyle: 'italic' },
  followArrow: { color: '#a855f7', fontSize: 18, marginLeft: 8 },

  tipRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  tipEmoji: { fontSize: 22, marginTop: 2 },
  tipTitle: { color: C.white, fontWeight: '700', fontSize: 14, marginBottom: 3 },
  tipSub: { color: C.muted, fontSize: 12, lineHeight: 18 },
  presentCard: { backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 6 },
  presentText: { color: C.lavender, fontSize: 15, fontWeight: '700', textAlign: 'center', lineHeight: 24 },

  avoidCard: { backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 18, overflow: 'hidden' },
  avoidRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avoidRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  avoidX: { color: '#f87171', fontSize: 14, fontWeight: '900', width: 16 },
  avoidText: { color: C.mutedLt, fontSize: 13, fontStyle: 'italic', flex: 1 },

  guidanceCard: { backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', borderRadius: 20, padding: 20, marginBottom: 24 },
  guidanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  guidanceCloud: { fontSize: 24 },
  guidanceTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  guidanceText: { color: C.lavender, fontSize: 15, fontStyle: 'italic', lineHeight: 24, marginBottom: 14 },
  talkBtn: { backgroundColor: 'rgba(124,58,237,0.3)', borderRadius: 14, padding: 12, alignItems: 'center' },
  talkBtnText: { color: '#c4b5fd', fontSize: 14, fontWeight: '700' },

  replyRow: { flexDirection: 'row', gap: 10 },
  replyBtn: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', borderRadius: 16, padding: 16, alignItems: 'center' },
  replyEmoji: { fontSize: 26, marginBottom: 6 },
  replyLabel: { color: C.lavender, fontSize: 12, fontWeight: '700', textAlign: 'center' },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.card, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#a855f7' },
  historyPreview: { color: C.white, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  historyTime: { color: C.muted, fontSize: 11 },
  historyArrow: { color: C.muted, fontSize: 18 },
  historyFooter: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },

  privacyNote: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 8 },
  privacyText: { color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
