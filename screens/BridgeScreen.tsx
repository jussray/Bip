// app/bridge.tsx
// Se'kret Bip — Bridge Screen
// Teen chooses what to share, how it sounds, and who sees it.
// This is permission with care, not betrayal.

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
import { useSekret } from './_layout';
import BottomNav from '../components/BottomNav';
import { C } from '../constants/theme';

type BridgePayload = {
  sharedTitle?: string;
  preview?: string;
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

type BridgeScreenProps = {
  payload?: BridgePayload | null;
  onSendToParent?: (payload: BridgePayload) => void;
  onKeepPrivate?: () => void;
  onOpenParentWindow?: () => void;
};

const DEFAULT_PAYLOAD: BridgePayload = {
  sharedTitle: 'What’s on your mind?',
  preview: "I've been feeling overwhelmed lately and I miss talking comfortably again.",
  mood: 'overwhelmed',
  moodEmoji: '☁️',
  shareTypeLabel: 'Journal Entry',
  sharedAt: 'Today, 7:42 PM',
  sekretTip: 'This message took courage to send.',
  softPrompt: 'You choose what feels safe to share.',
  conversationStarter: "How's your week been for real?",
  followUp: 'Want to tell me what made it feel heavy?',
  avoid: [
    "Why didn't you tell me sooner?",
    'Give me your phone.',
    'Who were you with?',
    "You're overreacting.",
    'When I was your age...',
  ],
  guidance: 'Connection before correction. Always.',
  translation: {
    said: "I've been feeling overwhelmed.",
    means: 'I need someone to sit with me, not fix me.',
  },
};

const CONVERSATION_MODES = [
  { id: 'softStart', label: 'Soft Start', sub: 'Ease into the conversation.' },
  { id: 'honest', label: 'Honest Version', sub: 'Be real, but still respectful.' },
  { id: 'boundary', label: 'Calm Boundary', sub: 'Set a boundary with kindness.' },
  { id: 'dontKnow', label: "Don't Know How to Say It", sub: "I'll help you figure it out." },
];

const RECOMMENDED_LINE =
  "I've been feeling overwhelmed lately and I miss talking to you comfortably. Can we talk later?";

const WHO_OPTIONS = [
  { id: 'parent', label: 'Mom', sub: 'Shared with 555-123-4567' },
  { id: 'guardian', label: 'Dad / Guardian', sub: 'Shared with a trusted grown-up' },
  { id: 'someoneElse', label: 'Choose someone else', sub: 'Pick a different trusted person' },
];

const REMINDERS = [
  "You're allowed to take your time.",
  "It's okay to start small.",
  "You deserve to be heard.",
  "You don't have to explain it perfectly.",
];

async function triggerHaptic() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    void 0;
  }
}

export default function BridgeScreen({
  payload,
  onSendToParent,
  onKeepPrivate,
  onOpenParentWindow,
}: BridgeScreenProps) {
  const { userSide, setScreen, bridgeText, setBridgeText, selectedTone, setSelectedTone } = useSekret();

  const data = payload || DEFAULT_PAYLOAD;
  const [selectedMode, setSelectedMode] = useState('softStart');
  const [selectedAudience, setSelectedAudience] = useState('parent');
  const [showPractice, setShowPractice] = useState(true);
  const [practiceText, setPracticeText] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const selectedQuote = useMemo(() => {
    switch (selectedMode) {
      case 'honest':
        return "Be real, but still respectful.";
      case 'boundary':
        return 'Set a boundary with kindness.';
      case 'dontKnow':
        return "I don't know how to say it yet. Help me shape it.";
      default:
        return 'Ease into the conversation.';
    }
  }, [selectedMode]);

  const safetyText = useMemo(() => {
    if (selectedMode === 'boundary') {
      return "This message sounds good. It's calm and clear.";
    }
    if (selectedMode === 'honest') {
      return "This keeps it honest without turning harsh.";
    }
    if (selectedMode === 'dontKnow') {
      return "No pressure. We can shape it together before sending.";
    }
    return "This feels soft and opens the door gently.";
  }, [selectedMode]);

  const sharedText = bridgeText?.trim() || data.preview || RECOMMENDED_LINE;

  const handleMode = async (modeId: string) => {
    await triggerHaptic();
    setSelectedMode(modeId);
    setSelectedTone?.(modeId);
  };

  const handleAudience = async (id: string) => {
    await triggerHaptic();
    setSelectedAudience(id);
  };

  const handleSend = async () => {
    await triggerHaptic();

    const outgoing: BridgePayload = {
      ...data,
      preview: sharedText,
      softPrompt:
        selectedAudience === 'someoneElse'
          ? 'You are choosing a different trusted person. That still counts as care.'
          : data.softPrompt,
      guidance:
        selectedAudience === 'someoneElse'
          ? 'Share what feels safe, and keep the rest with you for now.'
          : data.guidance,
    };

    if (selectedAudience === 'someoneElse') {
      onSendToParent?.(outgoing);
      onOpenParentWindow?.();
      setScreen?.('parentBridge');
      return;
    }

    onSendToParent?.(outgoing);
    onOpenParentWindow?.();
    setScreen?.('parentBridge');
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
          <TouchableOpacity
            onPress={() => setScreen?.('circle')}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back to Circle"
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Bridge</Text>
            <Text style={styles.sub}>Real conversations. Real connections.</Text>
          </View>

          <View style={styles.infoBtn}>
            <Text style={styles.infoBtnText}>i</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroQuote}>“You don’t gotta explain it perfectly. ♡”</Text>
          <Text style={styles.heroLabel}>Se'kret</Text>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>1. What’s on your mind?</Text>
          <Text style={styles.stepSub}>Write it how it feels. We’ll help you say it.</Text>

          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="I feel weird around my mom lately."
              placeholderTextColor="#6d5a87"
              multiline
              value={bridgeText}
              onChangeText={setBridgeText}
              accessibilityLabel="Bridge message text box"
              accessibilityHint="Write what you want to share."
            />
            <Text style={styles.inputIcon}>✎</Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.stepTitle}>2. Se'kret can help you say it.</Text>
              <Text style={styles.stepSub}>Pick a tone or style that feels right.</Text>
            </View>
            <TouchableOpacity
              style={styles.whyBtn}
              accessibilityRole="button"
              accessibilityLabel="Why these modes?"
            >
              <Text style={styles.whyBtnText}>Why these?</Text>
              <Text style={styles.whyBtnIcon}>?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modeRow}>
            {CONVERSATION_MODES.map(mode => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => handleMode(mode.id)}
                style={[styles.modeChip, selectedMode === mode.id && styles.modeChipActive]}
                accessibilityRole="button"
                accessibilityLabel={mode.label}
                accessibilityHint={mode.sub}
                accessibilityState={{ selected: selectedMode === mode.id }}
              >
                <Text style={styles.modeLabel}>{mode.label}</Text>
                <Text style={styles.modeSub}>{mode.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.recoCard}>
            <Text style={styles.recoBadge}>★ Recommended</Text>
            <Text style={styles.recoLead}>Maybe try:</Text>
            <Text style={styles.recoText}>“{RECOMMENDED_LINE}”</Text>

            <View style={styles.recoButtons}>
              <TouchableOpacity
                style={styles.useBtn}
                onPress={async () => {
                  await triggerHaptic();
                  setBridgeText(RECOMMENDED_LINE);
                }}
                accessibilityRole="button"
                accessibilityLabel="Use this suggested message"
              >
                <Text style={styles.useBtnText}>Use This</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setSelectedMode('dontKnow')}
                accessibilityRole="button"
                accessibilityLabel="Edit the message"
              >
                <Text style={styles.editBtnText}>Edit It</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sekretNote}>
              <Text style={styles.sekretNoteText}>
                This keeps it gentle, honest, and opens the door for a real conversation. 💜
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.stepTitle}>3. Want to practice it first?</Text>
              <Text style={styles.stepSub}>Rehearse out loud. I’ll listen.</Text>
            </View>
            <TouchableOpacity
              style={styles.smallAction}
              onPress={() => setShowPractice(p => !p)}
              accessibilityRole="button"
              accessibilityLabel="Toggle practice section"
            >
              <Text style={styles.smallActionText}>{showPractice ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {showPractice && (
            <View style={styles.practiceCard}>
              <View style={styles.practiceAudio}>
                <Text style={styles.practicePlay}>▶</Text>
                <View style={styles.practiceWave} />
                <Text style={styles.practiceTime}>0:32</Text>
              </View>

              <Text style={styles.practiceFeedback}>
                Se'kret feedback: You were clear and calm. Try slowing down a little when you start.
              </Text>

              <TextInput
                style={styles.practiceInput}
                placeholder="Practice out loud or type your rehearsal..."
                placeholderTextColor="#6d5a87"
                value={practiceText}
                onChangeText={setPracticeText}
                multiline
                accessibilityLabel="Practice text box"
              />

              <TouchableOpacity style={styles.practiceAgainBtn} accessibilityRole="button">
                <Text style={styles.practiceAgainText}>Practice Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sideSection}>
          <View style={styles.sideCard}>
            <Text style={styles.sideTitle}>Conversation Modes</Text>
            <Text style={styles.sideSub}>Different ways to say it.</Text>

            {CONVERSATION_MODES.map(mode => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => handleMode(mode.id)}
                style={[styles.sideMode, selectedMode === mode.id && styles.sideModeActive]}
                accessibilityRole="button"
                accessibilityLabel={mode.label}
                accessibilityState={{ selected: selectedMode === mode.id }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.sideModeLabel}>{mode.label}</Text>
                  <Text style={styles.sideModeSub}>{mode.sub}</Text>
                </View>
                <Text style={styles.sideModeCheck}>{selectedMode === mode.id ? '✓' : '›'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sideCard}>
            <Text style={styles.sideTitle}>Emotional Safety Check</Text>
            <Text style={styles.sideSub}>{safetyText}</Text>

            <View style={styles.safetyBars}>
              <View style={styles.safetyBarOn} />
              <View style={styles.safetyBarOn} />
              <View style={styles.safetyBarOn} />
              <View style={styles.safetyBarOff} />
            </View>

            <Text style={styles.safetyPrompt}>Want to soften anything before sending?</Text>

            <TouchableOpacity style={styles.reviewBtn} accessibilityRole="button">
              <Text style={styles.reviewBtnText}>Review Message</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sideCard}>
            <Text style={styles.sideTitle}>Who’s this for?</Text>
            <Text style={styles.sideSub}>You’re in control. Only send what you choose.</Text>

            {WHO_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleAudience(opt.id)}
                style={[styles.personRow, selectedAudience === opt.id && styles.personRowActive]}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                accessibilityHint={opt.sub}
                accessibilityState={{ selected: selectedAudience === opt.id }}
              >
                <View style={styles.personAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{opt.label}</Text>
                  <Text style={styles.personSub}>{opt.sub}</Text>
                </View>
                <Text style={styles.personArrow}>{selectedAudience === opt.id ? '✓' : '›'}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.chooseElseBtn} accessibilityRole="button">
              <Text style={styles.chooseElseText}>Choose Someone Else</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sideCard}>
            <Text style={styles.sideTitle}>Helpful Reminders</Text>

            {REMINDERS.map((r, idx) => (
              <View key={r} style={[styles.reminderRow, idx < REMINDERS.length - 1 && styles.reminderBorder]}>
                <Text style={styles.reminderDot}>◦</Text>
                <Text style={styles.reminderText}>{r}</Text>
                <Text style={styles.reminderArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.outputCard}>
          <Text style={styles.outputLabel}>Maybe try:</Text>
          <Text style={styles.outputText}>
            “{sharedText || RECOMMENDED_LINE}”
          </Text>
          <Text style={styles.outputHint}>This keeps it calm, honest, and real.</Text>
        </View>

        <TouchableOpacity
          style={styles.sendBigBtn}
          onPress={handleSend}
          accessibilityRole="button"
          accessibilityLabel="I'm ready to send"
          accessibilityHint="Sends the message through Bridge."
        >
          <Text style={styles.sendBigText}>I’m Ready to Send</Text>
          <Text style={styles.sendBigIcon}>✈</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notNowBtn}
          onPress={async () => {
            await triggerHaptic();
            onKeepPrivate?.();
            setScreen?.('circle');
          }}
          accessibilityRole="button"
          accessibilityLabel="Not now"
        >
          <Text style={styles.notNowText}>Not now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.previewToggle}
          onPress={async () => {
            await triggerHaptic();
            setPreviewMode(p => !p);
          }}
          accessibilityRole="button"
          accessibilityLabel="Toggle preview"
          accessibilityState={{ expanded: previewMode }}
        >
          <Text style={styles.previewToggleText}>{previewMode ? 'Hide full preview' : 'Preview message'}</Text>
        </TouchableOpacity>

        {previewMode && (
          <View style={styles.fullPreviewCard}>
            <Text style={styles.fullPreviewLabel}>Full preview</Text>
            <Text style={styles.fullPreviewText}>What they’ll see: “{sharedText || RECOMMENDED_LINE}”</Text>
            <Text style={styles.fullPreviewText}>Tone: {selectedMode}</Text>
            <Text style={styles.fullPreviewText}>
              Share level: {selectedAudience === 'parent' ? 'Mom' : selectedAudience === 'guardian' ? 'Dad / Guardian' : 'Choose someone else'}
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNav screen="bridge" setScreen={setScreen} userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 120 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backText: { color: C.white, fontSize: 18, fontWeight: '700' },
  title: { fontSize: 28, color: C.white, fontWeight: '800' },
  sub: { color: C.mutedLt, marginTop: 2, fontSize: 14 },
  infoBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  infoBtnText: { color: C.mutedLt, fontWeight: '700' },

  heroCard: { borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 18, backgroundColor: C.card, marginBottom: 14 },
  heroQuote: { color: C.white, fontSize: 16, fontStyle: 'italic', lineHeight: 24, marginBottom: 10 },
  heroLabel: { color: '#c4b5fd', fontSize: 13, fontWeight: '700' },

  stepCard: { borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16, backgroundColor: C.card, marginBottom: 14 },
  stepTitle: { color: C.white, fontSize: 15, fontWeight: '800', marginBottom: 3 },
  stepSub: { color: C.muted, fontSize: 12, marginBottom: 12, lineHeight: 18 },

  inputCard: { borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, backgroundColor: 'rgba(0,0,0,0.18)', minHeight: 140, position: 'relative' },
  input: { color: C.white, fontSize: 15, lineHeight: 24, minHeight: 110, textAlignVertical: 'top', paddingRight: 28 },
  inputIcon: { position: 'absolute', right: 14, bottom: 14, color: '#c4b5fd', fontSize: 16 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  whyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  whyBtnText: { color: C.mutedLt, fontSize: 12 },
  whyBtnIcon: { color: C.mutedLt, fontSize: 12, fontWeight: '700' },

  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  modeChip: { width: '48%', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(0,0,0,0.12)' },
  modeChipActive: { borderColor: '#a855f7', backgroundColor: 'rgba(124,58,237,0.16)' },
  modeLabel: { color: C.white, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  modeSub: { color: C.mutedLt, fontSize: 11, lineHeight: 16 },

  recoCard: { borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', borderRadius: 18, padding: 14, backgroundColor: 'rgba(76,29,149,0.14)' },
  recoBadge: { color: '#c4b5fd', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  recoLead: { color: C.white, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  recoText: { color: C.lavender, fontSize: 15, lineHeight: 24, fontStyle: 'italic', marginBottom: 12 },
  recoButtons: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  useBtn: { flex: 1, backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  useBtnText: { color: '#fff', fontWeight: '800' },
  editBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  editBtnText: { color: C.lavender, fontWeight: '700' },
  sekretNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 14, padding: 12 },
  sekretNoteText: { color: C.lavender, fontSize: 13, lineHeight: 19 },

  smallAction: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  smallActionText: { color: C.mutedLt, fontSize: 12, fontWeight: '700' },

  practiceCard: { marginTop: 10, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, backgroundColor: 'rgba(0,0,0,0.12)' },
  practiceAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  practicePlay: { color: C.white, fontSize: 18, width: 26 },
  practiceWave: { flex: 1, height: 18, borderRadius: 9, backgroundColor: 'rgba(168,85,247,0.35)' },
  practiceTime: { color: C.mutedLt, fontSize: 12 },
  practiceFeedback: { color: C.mutedLt, fontSize: 12, fontStyle: 'italic', lineHeight: 18, marginBottom: 10 },
  practiceInput: { minHeight: 68, color: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, backgroundColor: 'rgba(0,0,0,0.18)', marginBottom: 10 },
  practiceAgainBtn: { alignSelf: 'center', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  practiceAgainText: { color: C.lavender, fontWeight: '700' },

  sideSection: { gap: 14, marginBottom: 14 },
  sideCard: { borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16, backgroundColor: C.card },
  sideTitle: { color: C.white, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  sideSub: { color: C.muted, fontSize: 12, marginBottom: 12, lineHeight: 18 },

  sideMode: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, marginBottom: 8 },
  sideModeActive: { borderColor: '#a855f7', backgroundColor: 'rgba(124,58,237,0.14)' },
  sideModeLabel: { color: C.white, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  sideModeSub: { color: C.mutedLt, fontSize: 11, lineHeight: 16 },
  sideModeCheck: { color: '#c4b5fd', fontSize: 16, fontWeight: '800' },

  safetyBars: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 10 },
  safetyBarOn: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#a855f7' },
  safetyBarOff: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  safetyPrompt: { color: C.lavender, fontSize: 13, marginBottom: 10 },

  reviewBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  reviewBtnText: { color: C.lavender, fontWeight: '700' },

  personRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, marginBottom: 8 },
  personRowActive: { borderColor: '#a855f7', backgroundColor: 'rgba(124,58,237,0.14)' },
  personAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(168,85,247,0.25)' },
  personName: { color: C.white, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  personSub: { color: C.mutedLt, fontSize: 11, lineHeight: 16 },
  personArrow: { color: '#c4b5fd', fontSize: 16, fontWeight: '800' },
  chooseElseBtn: { marginTop: 6, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  chooseElseText: { color: C.lavender, fontWeight: '700' },

  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  reminderBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  reminderDot: { color: '#c4b5fd', fontSize: 14 },
  reminderText: { flex: 1, color: C.lavender, fontSize: 12, lineHeight: 18 },
  reminderArrow: { color: C.mutedLt, fontSize: 16 },

  outputCard: { borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', borderRadius: 18, padding: 14, backgroundColor: 'rgba(76,29,149,0.14)', marginBottom: 14 },
  outputLabel: { color: '#c4b5fd', fontSize: 11, fontWeight: '800', marginBottom: 4 },
  outputText: { color: C.lavender, fontSize: 15, lineHeight: 24, fontStyle: 'italic', marginBottom: 6 },
  outputHint: { color: C.mutedLt, fontSize: 12 },

  sendBigBtn: { backgroundColor: '#7c3aed', borderRadius: 24, paddingVertical: 18, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10, flexDirection: 'row', gap: 10 },
  sendBigText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sendBigIcon: { color: '#fff', fontSize: 18 },
  notNowBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  notNowText: { color: C.mutedLt, fontWeight: '700' },

  previewToggle: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 4 },
  previewToggleText: { color: '#c4b5fd', fontSize: 13, fontWeight: '700' },

  fullPreviewCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, marginTop: 8 },
  fullPreviewLabel: { color: C.mutedLt, fontSize: 11, marginBottom: 6 },
  fullPreviewText: { color: C.white, fontSize: 13, lineHeight: 20, marginBottom: 4 },
});
