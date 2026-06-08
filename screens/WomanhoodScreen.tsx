// screens/WomanhoodScreen.tsx
// Se'kret Bip — Bippin 2: Womanhood content layer (Raylene-led)
//
// Phase 2 build. Soft, big-sister-energy content. Topics:
//   • First period support
//   • Cycle wellness
//   • Body changes
//   • Hygiene + self-care
//   • Mood + body check-in
//   • Boundaries + consent
//
// Each topic expands into a mini-lesson with 3 grounded micro-steps and a
// gentle Raylene hook. No gendered shame, no clinical voice. Cool cousin.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Text, TouchableOpacity, ScrollView, View,
  ImageBackground, Animated, Easing, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRoomBg, TimeOfDay } from '../constants/theme';

function glowFor(mood?: string): string {
  const m = (mood || '').toLowerCase();
  if (m.includes('happy'))       return '#fbbf24';
  if (m.includes('sad') || m.includes('anx'))    return '#7dd3fc';
  if (m.includes('angry') || m.includes('over') || m.includes('stress')) return '#f472b6';
  if (m.includes('tired'))       return '#6d28d9';
  if (m.includes('calm'))        return '#c4b5fd';
  return '#e879a3';
}
function timeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

type TopicKey =
  | 'period' | 'cycle' | 'body' | 'hygiene' | 'mood' | 'boundaries';

interface Topic {
  key:   TopicKey;
  emoji: string;
  title: string;
  sub:   string;
  lesson: string;
  hook:   string;
  micro:  string[];
  route?: string;        // optional deep-link to existing screen
}

const TOPICS: Topic[] = [
  {
    key: 'period',
    emoji: '🩸',
    title: 'First Period Support',
    sub: 'no shame, just info',
    lesson: 'periods are normal. they’re a sign your body is doing its thing. they’re not gross, not embarrassing, not a secret.',
    hook: 'we see you. you’re not alone in this 💜',
    micro: [
      'Keep a small period pouch in your bag (pad or liner + wipe).',
      'It’s okay to ask a trusted adult or friend.',
      'Track it in the Cycle calendar so you’re never surprised.',
    ],
    route: 'periodCalendar',
  },
  {
    key: 'cycle',
    emoji: '🫶',
    title: 'Cycle Wellness',
    sub: 'work with your body',
    lesson: 'your energy shifts across the month. that’s not weakness, that’s rhythm. some weeks you crush it, some weeks you rest.',
    hook: 'rest is part of the plan, not the failure 💜',
    micro: [
      'Notice when you feel most social vs most quiet.',
      'Schedule hard stuff for your higher-energy days when you can.',
      'On low days, water + sleep + soft food = enough.',
    ],
    route: 'periodCalendar',
  },
  {
    key: 'body',
    emoji: '🌸',
    title: 'Body Changes',
    sub: 'you’re growing into you',
    lesson: 'your body is changing on its own schedule. comparing to friends or the internet is a trap. you are not behind.',
    hook: 'your timeline is the right one 💜',
    micro: [
      'Catch one comparison thought today. Let it pass.',
      'Find one thing your body did for you (carried you, healed a cut, slept).',
      'Drink water. It really does help.',
    ],
  },
  {
    key: 'hygiene',
    emoji: '🌷',
    title: 'Hygiene + Self-Care',
    sub: 'taking care, not performing',
    lesson: 'self-care isn’t aesthetic. it’s the basics. clean body, brushed teeth, fresh underwear = you said yes to yourself today.',
    hook: 'soft routine. nothing extra needed 💜',
    micro: [
      'Shower or wash up at the same time daily — anchor it to brushing teeth.',
      'Deodorant after, not before, washing.',
      'Change pad/tampon every 4-6 hours during a period.',
    ],
  },
  {
    key: 'mood',
    emoji: '🌙',
    title: 'Mood + Body Check-in',
    sub: 'name it to soften it',
    lesson: 'big feelings around your cycle aren’t “crazy” — they’re hormones plus everything else you’re carrying. naming what’s here helps it pass.',
    hook: 'we feel a lot. that’s not too much 💜',
    micro: [
      'Pause and name one feeling out loud or in your journal.',
      'Ask: am I hungry, tired, lonely, or hurt?',
      'Pick one tiny kindness for yourself.',
    ],
    route: 'calm',
  },
  {
    key: 'boundaries',
    emoji: '🛡️',
    title: 'Boundaries + Consent',
    sub: 'no is a full sentence',
    lesson: 'your body, your space, your time. you don’t owe anyone access — not hugs, not pictures, not explanations. trusted people respect a “no.”',
    hook: 'protecting your peace is not rude 💜',
    micro: [
      'Practice saying “I don’t want to right now” out loud.',
      'If something feels off, tell someone you trust. Not later — now.',
      'You can change your mind any time. That’s allowed.',
    ],
  },
];

interface WomanhoodScreenProps {
  t:               Record<string, any>;
  mood:            string;
  selectedSekret:  string;
  setScreen:       (s: string) => void;
  BottomNav:       React.ReactNode;
}

export function WomanhoodScreen({
  t, mood, selectedSekret, setScreen, BottomNav,
}: WomanhoodScreenProps) {

  const charKey: 'raylene' | 'rylane' = selectedSekret === 'rylane' ? 'rylane' : 'raylene';
  const time     = useMemo(() => timeOfDay(), []);
  const bgSource = useMemo(() => getRoomBg('raylene', time), [time]);
  const glow     = useMemo(() => glowFor(mood), [mood]);
  const [open, setOpen] = useState<TopicKey | null>(null);

  // Animations
  const fadeHero = useRef(new Animated.Value(0)).current;
  const fadeGrid = useRef(new Animated.Value(0)).current;
  const fadeNote = useRef(new Animated.Value(0)).current;
  const transHero = useRef(new Animated.Value(10)).current;
  const transGrid = useRef(new Animated.Value(10)).current;
  const transNote = useRef(new Animated.Value(10)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stagger = (op: Animated.Value, tr: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(op, { toValue: 1, duration: 400, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(tr, { toValue: 0, duration: 400, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]);
    Animated.parallel([
      stagger(fadeHero, transHero, 0),
      stagger(fadeGrid, transGrid, 200),
      stagger(fadeNote, transNote, 400),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2100, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(breath, { toValue: 0, duration: 2100, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);
  const breathScale   = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const breathOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });

  return (
    <ImageBackground source={bgSource} style={styles.root} resizeMode="cover">
      <LinearGradient
        colors={['rgba(40,15,40,0.55)', 'rgba(60,20,55,0.72)', 'rgba(20,10,30,0.92)']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backChip} onPress={() => setScreen('bippin2')}>
            <Text style={styles.backChipText}>← bippin 2</Text>
          </TouchableOpacity>
          <View style={[styles.privateBadge, { borderColor: glow + '66' }]}>
            <Text style={styles.privateBadgeText}>🔒 just you</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeHero, transform: [{ translateY: transHero }] }}>
          <Text style={[styles.title, { color: glow }]}>Womanhood 🫶</Text>
          <Text style={styles.subtitle}>raylene’s corner. soft, honest, real.</Text>

          <Animated.View style={[
            styles.companion,
            { backgroundColor: 'rgba(40,15,40,0.78)', borderColor: glow + '88', shadowColor: glow,
              opacity: breathOpacity, transform: [{ scale: breathScale }] },
          ]}>
            <Text style={styles.companionText}>💜  raylene is right here</Text>
          </Animated.View>

          <View style={styles.cloudRow}>
            <Animated.Text style={[styles.cloudMascot, { transform: [{ scale: breathScale }], opacity: breathOpacity }]}>☁️</Animated.Text>
            <View style={[styles.cloudBubble, { backgroundColor: 'rgba(40,15,40,0.82)', borderColor: glow + '66' }]}>
              <Text style={styles.cloudText}>
                whatever you’re curious about, you can ask here. no shame, no rush 💜
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeGrid, transform: [{ translateY: transGrid }] }}>
          <Text style={styles.sectionTitle}>topics</Text>
          {TOPICS.map(topic => {
            const isOpen = open === topic.key;
            return (
              <TouchableOpacity
                key={topic.key}
                style={[
                  styles.topicCard,
                  { backgroundColor: isOpen ? 'rgba(40,15,40,0.92)' : 'rgba(40,15,40,0.78)',
                    borderColor: glow + (isOpen ? 'cc' : '88'),
                    shadowColor: glow },
                ]}
                onPress={() => setOpen(isOpen ? null : topic.key)}
              >
                <View style={styles.topicHeader}>
                  <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                    <Text style={styles.topicSub}>{topic.sub}</Text>
                  </View>
                  <Text style={styles.chev}>{isOpen ? '▾' : '▸'}</Text>
                </View>

                {isOpen ? (
                  <View style={styles.topicBody}>
                    <Text style={styles.lesson}>{topic.lesson}</Text>
                    <Text style={[styles.hook, { color: glow }]}>{topic.hook}</Text>
                    <View style={styles.microList}>
                      {topic.micro.map((step, i) => (
                        <View key={i} style={styles.microRow}>
                          <Text style={[styles.microBullet, { color: glow }]}>•</Text>
                          <Text style={styles.microText}>{step}</Text>
                        </View>
                      ))}
                    </View>

                    {topic.route ? (
                      <TouchableOpacity
                        style={[styles.routeBtn, { backgroundColor: glow, shadowColor: glow }]}
                        onPress={() => setScreen(topic.route!)}
                      >
                        <Text style={styles.routeBtnText}>open the tool →</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <Animated.View style={{ opacity: fadeNote, transform: [{ translateY: transNote }], alignItems: 'center' }}>
          <View style={styles.sticky}>
            <Text style={styles.stickyText}>
              your body is not a problem to solve. you’re allowed to learn at your pace 💜
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
      {BottomNav}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  container:    { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 100 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backChip:     { backgroundColor: 'rgba(20,12,40,0.7)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  backChipText: { color: '#f5b8cf', fontSize: 13, fontWeight: '600' },
  privateBadge: { backgroundColor: 'rgba(20,12,40,0.7)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  privateBadgeText: { color: '#f5b8cf', fontSize: 12, fontWeight: '600' },

  title:        { fontSize: 30, fontWeight: '900', textAlign: 'center', marginTop: 6, marginBottom: 6 },
  subtitle:     { fontSize: 14, color: '#f5b8cf', textAlign: 'center', marginBottom: 14, lineHeight: 20, fontStyle: 'italic' },

  companion:    { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginBottom: 14, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  companionText:{ color: '#F8FAFC', fontSize: 13, fontWeight: '600' },

  cloudRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  cloudMascot:  { fontSize: 28, marginTop: 4 },
  cloudBubble:  { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1 },
  cloudText:    { color: '#fce7f3', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 12, marginTop: 4 },

  topicCard:    { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  topicHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicEmoji:   { fontSize: 26 },
  topicTitle:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  topicSub:     { color: '#f5b8cf', fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  chev:         { color: '#f5b8cf', fontSize: 18 },

  topicBody:    { marginTop: 14 },
  lesson:       { color: '#fde7f1', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  hook:         { fontSize: 13, fontStyle: 'italic', marginBottom: 12 },

  microList:    { marginBottom: 14 },
  microRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  microBullet:  { fontSize: 16, lineHeight: 20 },
  microText:    { color: '#fef2f8', fontSize: 13, lineHeight: 20, flex: 1 },

  routeBtn:     { paddingVertical: 12, borderRadius: 14, alignItems: 'center', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  routeBtnText: { color: '#1a0a3a', fontSize: 14, fontWeight: '800' },

  sticky:       { backgroundColor: '#fff8e7', borderColor: '#e879a3', borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, transform: [{ rotate: '-2deg' }], maxWidth: 320 },
  stickyText:   { color: '#6b1f4f', fontStyle: 'italic', fontSize: 13, textAlign: 'center' },
});
