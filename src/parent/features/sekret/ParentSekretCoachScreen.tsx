// src/parent/features/sekret/ParentSekretCoachScreen.tsx
//
// Se'kret Coach — the parent's version of the Se'kret companion.
// Focused on: parenting communication, understanding teen behavior,
// responding with connection, and self-reflection for parents.
//
// NOT a chat. A coaching presence — ambient wisdom, prompted reflection,
// and conversation guides. Think: a wise older parent sitting with you.

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Platform, Image,
} from 'react-native';
import { IMAGES } from '@constants/theme';

const TOP = Platform.OS === 'ios' ? 56 : 36;

// ── Daily wisdom ─────────────────────────────────────────────────────────────
const WISDOM = [
  "teenagers aren't pushing you away. they're testing whether you'll stay.",
  "the more they pull away, the more they need to know you're still there.",
  "your presence is the message. the words matter less than you think.",
  "a repaired relationship teaches more than a perfect one.",
  "your teen doesn't need you to have answers. they need you to ask questions.",
  "what looks like defiance is often fear wearing a tough jacket.",
  "the goal shifts. from 'raise a good kid' to 'build a good relationship.'",
  "they will remember how you made them feel, long after they forget what you said.",
  "connection before correction. every time.",
  "you're not parenting your teen. you're parenting the adult they're becoming.",
];

// ── Coaching modules ─────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'listen',
    icon: '👂',
    label: 'Listen to Understand',
    sub: '3 techniques for real hearing',
    tips: [
      "Reflect back without fixing: \"So what you're saying is…\"",
      "Tolerate silence. Teens often need 8–10 seconds before they speak.",
      "Put your phone face-down. Not on silent. Down.",
      "Ask 'what' and 'how', not 'why'. Why puts people on defense.",
    ],
  },
  {
    id: 'regulate',
    icon: '🧘',
    label: 'Regulate Together',
    sub: 'co-regulation strategies',
    tips: [
      "A calm parent is the most powerful de-escalation tool you have.",
      "Say 'I need a minute' instead of exploding — they learn this from you.",
      "Side-by-side activities lower defenses better than face-to-face talks.",
      "Driving together is gold. No eye contact = safer conversations.",
    ],
  },
  {
    id: 'repair',
    icon: '🔧',
    label: 'Repair After Conflict',
    sub: 'reconnect after the hard moment',
    tips: [
      "Start with acknowledgment, not explanation. 'That was hard. I'm sorry.'",
      "Don't wait for them to come to you. Teens almost never do. You go first.",
      "Repair doesn't erase the rupture. It teaches that ruptures can be survived.",
      "A small gesture counts: leaving a snack, a text with just a heart.",
    ],
  },
  {
    id: 'understand',
    icon: '🧠',
    label: 'Teen Brain 101',
    sub: 'why they act this way',
    tips: [
      "The prefrontal cortex (logic, impulse control) isn't done until ~25.",
      "Emotional regulation is literally harder for them. It's biology, not attitude.",
      "Peer opinion activates the same brain region as physical pain.",
      "Sleep deprivation makes teens look dysregulated — check sleep first.",
    ],
  },
  {
    id: 'connect',
    icon: '💜',
    label: 'Connection Builders',
    sub: 'low-stakes ways to stay close',
    tips: [
      "10 minutes a day of undivided, unguided connection matters more than 2 hours of trying.",
      "Show up for the small things — they're deposits for when the big things happen.",
      "Ask about their world (music, show, game) with genuine curiosity, not strategy.",
      "Don't make connection contingent on good behavior.",
    ],
  },
];

// ── Conversation starters ─────────────────────────────────────────────────────
const CONVERSATION_STARTERS = [
  { situation: "After a bad day", starter: "\"That looked rough. You want company or space?\"" },
  { situation: "They seem off",   starter: "\"Hey. Not fishing. Just checking. You good?\"" },
  { situation: "After a fight",   starter: "\"I handled that badly. Can we try again?\"" },
  { situation: "They shut down",  starter: "\"You don't have to talk. I'm just here.\"" },
  { situation: "They're struggling", starter: "\"What do you need from me right now — to talk, to listen, or to just be here?\"" },
  { situation: "Celebrating a win", starter: "\"I see you working hard. I'm proud of you.\"" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Component ─────────────────────────────────────────────────────────────────
interface ParentSekretCoachScreenProps {
  setScreen:    (s: string) => void;
  parentMood?:  string;
  BottomNav:    React.ReactNode;
}

export function ParentSekretCoachScreen({ setScreen, parentMood, BottomNav }: ParentSekretCoachScreenProps) {
  const [wisdomLine]   = useState(() => pick(WISDOM));
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [starterIdx, setStarterIdx]     = useState(0);

  const cloudBreath = useRef(new Animated.Value(0)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(cloudBreath, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(cloudBreath, { toValue: 0, duration: 3000, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const cloudScale = cloudBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  const currentModule = MODULES.find(m => m.id === activeModule);

  // ── Module detail view ───────────────────────────────────────────────────
  if (currentModule) {
    return (
      <View style={s.root}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setActiveModule(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={s.back}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{currentModule.icon} {currentModule.label}</Text>
              <Text style={s.sub}>{currentModule.sub}</Text>
            </View>
          </View>
          {currentModule.tips.map((tip, i) => (
            <View key={i} style={s.tipCard}>
              <Text style={s.tipNum}>{i + 1}</Text>
              <Text style={s.tipText}>{tip}</Text>
            </View>
          ))}
          <View style={s.spacer} />
        </ScrollView>
        {BottomNav}
      </View>
    );
  }

  // ── Main coach view ──────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <Animated.ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeIn }}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setScreen('home')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.back}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Se'kret Coach</Text>
            <Text style={s.sub}>your parenting presence</Text>
          </View>
        </View>

        {/* ── Se'kret cloud ── */}
        <View style={s.cloudBlock}>
          <Animated.View style={{ transform: [{ scale: cloudScale }] }}>
            <Image source={IMAGES.cloudHeadphones} style={s.cloudImg} resizeMode="contain" />
          </Animated.View>
          <View style={s.wisdomBubble}>
            <Text style={s.wisdomText}>"{wisdomLine}"</Text>
          </View>
        </View>

        {/* ── Coaching modules ── */}
        <Text style={s.sectionLabel}>Coaching Guides</Text>
        {MODULES.map(m => (
          <TouchableOpacity key={m.id} style={s.moduleCard} onPress={() => setActiveModule(m.id)} activeOpacity={0.8}>
            <Text style={s.moduleIcon}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.moduleLabel}>{m.label}</Text>
              <Text style={s.moduleSub}>{m.sub}</Text>
            </View>
            <Text style={s.moduleArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* ── Conversation starters ── */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>When you don't know what to say</Text>
        <View style={s.starterCard}>
          <Text style={s.starterSituation}>{CONVERSATION_STARTERS[starterIdx].situation}</Text>
          <Text style={s.starterText}>{CONVERSATION_STARTERS[starterIdx].starter}</Text>
          <TouchableOpacity
            style={s.nextBtn}
            onPress={() => setStarterIdx(i => (i + 1) % CONVERSATION_STARTERS.length)}
          >
            <Text style={s.nextBtnText}>Next situation →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Calm before replying shortcut ── */}
        <TouchableOpacity style={s.calmShortcut} onPress={() => setScreen('calm')} activeOpacity={0.8}>
          <Text style={s.calmShortcutEmoji}>🌬️</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.calmShortcutLabel}>Calm Before Replying</Text>
            <Text style={s.calmShortcutSub}>pause, breathe, and reconnect first</Text>
          </View>
          <Text style={s.moduleArrow}>›</Text>
        </TouchableOpacity>

        <View style={s.spacer} />
      </Animated.ScrollView>
      {BottomNav}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#06030f' },
  scroll: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: TOP, paddingHorizontal: 20, paddingBottom: 16,
  },
  back:  { color: '#c4b5fd', fontSize: 22, fontWeight: '300' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:   { color: '#94A3B8', fontSize: 12, marginTop: 2 },

  cloudBlock: {
    alignItems: 'center', paddingHorizontal: 24, marginBottom: 20,
  },
  cloudImg: { width: 72, height: 72, marginBottom: 10 },
  wisdomBubble: {
    backgroundColor: 'rgba(192,132,252,0.08)',
    borderWidth: 1, borderColor: 'rgba(192,132,252,0.25)',
    borderRadius: 14, padding: 16,
  },
  wisdomText: { color: '#e9d5ff', fontSize: 14, fontStyle: 'italic', lineHeight: 22, textAlign: 'center' },

  sectionLabel: {
    color: '#c084fc', fontSize: 12, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginHorizontal: 20, marginBottom: 10,
  },

  moduleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: '#1e293b',
    borderRadius: 16, padding: 14,
  },
  moduleIcon:  { fontSize: 24 },
  moduleLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  moduleSub:   { color: '#64748B', fontSize: 11, marginTop: 2 },
  moduleArrow: { color: '#64748B', fontSize: 18, fontWeight: '300' },

  tipCard: {
    flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: '#1e293b',
    borderRadius: 14, padding: 14,
  },
  tipNum:  { color: '#c084fc', fontSize: 13, fontWeight: '800', width: 18, lineHeight: 22 },
  tipText: { color: '#CBD5E1', fontSize: 14, lineHeight: 22, flex: 1 },

  starterCard: {
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: '#1e293b',
    borderRadius: 16, padding: 18,
  },
  starterSituation: { color: '#c084fc', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  starterText:      { color: '#fff', fontSize: 16, lineHeight: 26, fontStyle: 'italic', marginBottom: 14 },
  nextBtn:          { alignSelf: 'flex-end' },
  nextBtnText:      { color: '#64748B', fontSize: 12 },

  calmShortcut: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginTop: 4, marginBottom: 12,
    backgroundColor: 'rgba(192,132,252,0.08)',
    borderWidth: 1, borderColor: 'rgba(192,132,252,0.25)',
    borderRadius: 16, padding: 14,
  },
  calmShortcutEmoji: { fontSize: 24 },
  calmShortcutLabel: { color: '#e9d5ff', fontSize: 14, fontWeight: '700' },
  calmShortcutSub:   { color: '#94A3B8', fontSize: 11, marginTop: 2 },

  spacer: { height: 24 },
});
