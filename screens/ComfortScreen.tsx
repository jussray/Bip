// screens/ComfortScreen.tsx
// Se'kret Bip — Comfort Mode 🚨
//
// Fixes applied (2026-06-03):
//   A1 — setScreen + onComplete added to interface
//         (index.tsx passes both; they were silently dropped before)
//   A2 — onComplete?.() called on mount so comfortSessions tracks in roomMemory
//   B1 — Grounding steps are now a tappable checklist (useState)
//   B2 — "I'm feeling better" exit button added → setScreen('home')
//         Step 4 "Tap Calm" now actually navigates to setScreen('calm')
//   B3 — Cycling comfort message card restored
//   D1 — BottomNav moved outside ScrollView so it stays pinned

import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants/theme';
import {
  Text, ScrollView, View, Image, StyleSheet,
  Platform, TouchableOpacity,
} from 'react-native';

const CLOUD_STORMY = IMAGES.cloudStormy;

// ── Comfort messages ───────────────────────────────────────────────────────
const COMFORT_MESSAGES = [
  { emoji: '🌙', text: "You've survived every hard day so far. That matters." },
  { emoji: '☁️', text: 'Rest is productive too. You are allowed to pause.' },
  { emoji: '💙', text: "Someone is glad you're still here tonight." },
  { emoji: '🌧️', text: 'Bad moments are real. So is your strength.' },
  { emoji: '✨', text: "You don't need to be perfect to be loved." },
  { emoji: '🫶', text: 'Your feelings are allowed here.' },
  { emoji: '🕯️', text: 'Soft moment. Slow breath. Stay with me.' },
];

// ── Grounding steps ────────────────────────────────────────────────────────
const GROUNDING_STEPS = [
  { id: 1, text: 'Put both feet on the floor.' },
  { id: 2, text: 'Name 3 things you can see.' },
  { id: 3, text: 'Take one slow breath.' },
  { id: 4, text: 'Tap Calm if you need to breathe.', action: 'calm' },
];

// ── Props ──────────────────────────────────────────────────────────────────
// Fix A1: setScreen + onComplete added
interface ComfortScreenProps {
  t:           Record<string, any>;
  setScreen:   (screen: string) => void;
  onComplete?: () => void;
  BottomNav:   React.ReactNode;
}

export function ComfortScreen({ t, setScreen, onComplete, BottomNav }: ComfortScreenProps) {

  // B1: tappable grounding checklist
  const [checked, setChecked] = useState<number[]>([]);

  // B3: cycling comfort message
  const [msgIdx, setMsgIdx] = useState(0);

  // Fix A2: call onComplete on mount so comfort session is tracked in roomMemory
  useEffect(() => {
    onComplete?.();
  }, []);

  const toggleStep = (id: number, action?: string) => {
    setChecked(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
    // B2: step 4 "Tap Calm" navigates to calm screen
    if (action === 'calm') setScreen('calm');
  };

  const allDone = checked.length === GROUNDING_STEPS.length;

  const card = (extra?: object) =>
    [styles.card, { backgroundColor: t.card, borderColor: t.accent }, extra] as any;

  return (
    // Fix D1: root View so BottomNav stays pinned outside scroll
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logo}>Comfort Mode 🚨</Text>
        <Text style={styles.subtitle}>When it feels heavy, Bip stays with you.</Text>

        <Image source={CLOUD_STORMY} style={styles.artworkMedium} resizeMode="contain" />

        {/* You are not alone card */}
        <View style={card()}>
          <Text style={styles.cardEmoji}>💙</Text>
          <Text style={[styles.cardText, { color: '#fff' }]}>You are not alone in this moment.</Text>
          <Text style={[styles.entryText, { color: t.soft }]}>
            This is a safe space. Take your time. No rush.
          </Text>
        </View>

        {/* B1: Tappable grounding checklist */}
        <Text style={[styles.sectionTitle, { color: t.accent }]}>Grounding Steps</Text>
        <View style={card()}>
          {GROUNDING_STEPS.map(step => {
            const done = checked.includes(step.id);
            return (
              <TouchableOpacity
                key={step.id}
                style={styles.stepRow}
                onPress={() => toggleStep(step.id, step.action)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.stepCheck,
                  { borderColor: t.accent, backgroundColor: done ? t.accent : 'transparent' },
                ]}>
                  {done && <Text style={styles.stepCheckMark}>✓</Text>}
                </View>
                <Text style={[
                  styles.stepText,
                  {
                    color: done ? t.soft : '#fff',
                    textDecorationLine: done ? 'line-through' : 'none',
                  },
                ]}>
                  {step.id}. {step.text}
                </Text>
                {/* Step 4 gets a visible "→ Calm" nudge */}
                {step.action === 'calm' && !done && (
                  <Text style={[styles.stepAction, { color: t.accent }]}>→ Calm</Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Completion message */}
          {allDone && (
            <View style={[styles.allDoneBadge, { backgroundColor: 'rgba(13,0,20,0.6)', borderColor: t.accent }]}>
              <Text style={[styles.allDoneText, { color: t.soft }]}>
                💜 you did it. one small step at a time.
              </Text>
            </View>
          )}
        </View>

        {/* B3: Cycling comfort message */}
        <Text style={[styles.sectionTitle, { color: t.accent }]}>Se'kret says</Text>
        <View style={card()}>
          <Text style={styles.cardEmoji}>{COMFORT_MESSAGES[msgIdx].emoji}</Text>
          <Text style={[styles.cardText, { color: '#fff' }]}>{COMFORT_MESSAGES[msgIdx].text}</Text>
          <TouchableOpacity
            style={[styles.anotherBtn, { backgroundColor: '#334155' }]}
            onPress={() => setMsgIdx(i => (i + 1) % COMFORT_MESSAGES.length)}
          >
            <Text style={styles.anotherBtnText}>Another Calm Thought ✨</Text>
          </TouchableOpacity>
        </View>

        {/* B2: Exit path + Calm navigation */}
        <TouchableOpacity
          style={[styles.calmBtn, { backgroundColor: t.accent }]}
          onPress={() => setScreen('calm')}
        >
          <Text style={styles.calmBtnText}>🌙 Go to Calm Space</Text>
        </TouchableOpacity>

        {/* B2: "I'm feeling better" soft exit */}
        <TouchableOpacity
          style={[styles.betterBtn, { borderColor: t.accent }]}
          onPress={() => setScreen('home')}
        >
          <Text style={[styles.betterBtnText, { color: t.soft }]}>
            I'm feeling a little better ›
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Fix D1: pinned outside scroll */}
      {BottomNav}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1 },
  scroll:        { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  logo:          { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:      { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  artworkMedium: { width: '100%', height: 200, marginBottom: 16, borderRadius: 16 },
  card:          { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:     { fontSize: 32, marginBottom: 8 },
  cardText:      { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:     { fontSize: 14, marginBottom: 6, lineHeight: 20 },
  sectionTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 10, marginTop: 4 },

  // Grounding steps
  stepRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  stepCheck:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepCheckMark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stepText:      { flex: 1, fontSize: 14, lineHeight: 20 },
  stepAction:    { fontSize: 12, fontWeight: '700' },
  allDoneBadge:  { marginTop: 12, borderRadius: 12, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14 },
  allDoneText:   { fontSize: 13, textAlign: 'center', fontWeight: '600' },

  // Comfort message
  anotherBtn:     { padding: 11, borderRadius: 14, marginTop: 8 },
  anotherBtnText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },

  // Exit buttons
  calmBtn:       { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  calmBtnText:   { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  betterBtn:     { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 24, alignItems: 'center' },
  betterBtnText: { fontSize: 15, fontWeight: '600' },
});
