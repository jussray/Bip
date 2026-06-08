// screens/ManhoodScreen.tsx
// Se'kret Bip — Bippin 2: Manhood content layer (Rylane-led)
//
// Phase 2 build. Loyal-bro energy. Topics:
//   • Puberty guide
//   • Body changes
//   • Confidence boost
//   • Hygiene + self-care
//   • Emotions (yes, them too)
//   • Respect + how you treat people
//
// Each topic expands into a mini-lesson with 3 micro-actions and a Rylane hook.
// Voice: short, real, no fluff, no shame. Never talks down.

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
  return '#4DA3FF';
}
function timeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

type TopicKey =
  | 'puberty' | 'body' | 'confidence' | 'hygiene' | 'emotions' | 'respect';

interface Topic {
  key: TopicKey; emoji: string; title: string; sub: string;
  lesson: string; hook: string; micro: string[]; route?: string;
}

const TOPICS: Topic[] = [
  {
    key: 'puberty',
    emoji: '⚡',
    title: 'Puberty Guide',
    sub: 'what’s going on with the body',
    lesson: 'puberty is the body upgrading. voice changes, growth spurts, new hair, more sweat. all normal. not a contest with your friends.',
    hook: 'no rush. your body knows what it’s doing.',
    micro: [
      'Drink water. Like, more than you think.',
      'Sleep is the cheat code. Aim for 8+ when you can.',
      'Eat real food before the snacks.',
    ],
  },
  {
    key: 'body',
    emoji: '🧠',
    title: 'Body Changes',
    sub: 'don’t compare, just grow',
    lesson: 'everyone’s on a different schedule. comparing yourself to dudes on the internet is rigged. your only competition is yesterday-you.',
    hook: 'your body, your timeline. respect.',
    micro: [
      'Move your body for 15 min today. Walk counts.',
      'Stretch before bed — 30 sec, that’s it.',
      'Notice one thing your body did for you today.',
    ],
  },
  {
    key: 'confidence',
    emoji: '🕊️',
    title: 'Confidence Boost',
    sub: 'real, not loud',
    lesson: 'confidence isn’t flexing. it’s being okay with who you are when no one’s watching. quiet confidence > loud insecurity.',
    hook: 'walk in like you belong. you do.',
    micro: [
      'Pick one small thing you handled this week. Own it.',
      'Stand tall. Shoulders back. It actually works.',
      'Compliment someone else without expecting anything.',
    ],
  },
  {
    key: 'hygiene',
    emoji: '🌻',
    title: 'Hygiene + Self-Care',
    sub: 'basic but powerful',
    lesson: 'showering, brushing teeth, deodorant, fresh clothes — not optional. self-care isn’t soft, it’s self-respect.',
    hook: 'taking care of you is the move.',
    micro: [
      'Shower daily, especially after sports.',
      'Brush teeth morning + night. Floss when you can.',
      'Deodorant after the shower, not before.',
    ],
  },
  {
    key: 'emotions',
    emoji: '🌊',
    title: 'Emotions (Yes, Them Too)',
    sub: 'feeling stuff is human',
    lesson: 'bottling it up doesn’t make you tough. it makes you tired. real strength is naming what you feel and dealing with it.',
    hook: 'feeling things doesn’t make you weak. ignoring them makes you stuck.',
    micro: [
      'Name one feeling today. Out loud or in your head.',
      'Walk it out for 5 min if it’s big.',
      'Talk to one trusted person this week. Or drop it here.',
    ],
    route: 'sekret',
  },
  {
    key: 'respect',
    emoji: '🤝',
    title: 'Respect + How You Treat People',
    sub: 'consent is the standard',
    lesson: 'real ones don’t pressure. real ones ask. respecting people’s no — about anything, anytime — is the baseline, not a bonus.',
    hook: 'how you treat people is your reputation.',
    micro: [
      'Hear no the first time.',
      'Hype people up instead of putting them down.',
      'Apologize when you mess up. Then change it.',
    ],
  },
];

interface ManhoodScreenProps {
  t:               Record<string, any>;
  mood:            string;
  selectedSekret:  string;
  setScreen:       (s: string) => void;
  BottomNav:       React.ReactNode;
}

export function ManhoodScreen({
  t, mood, selectedSekret, setScreen, BottomNav,
}: ManhoodScreenProps) {

  const time     = useMemo(() => timeOfDay(), []);
  const bgSource = useMemo(() => getRoomBg('rylane', time), [time]);
  const glow     = useMemo(() => glowFor(mood), [mood]);
  const [open, setOpen] = useState<TopicKey | null>(null);

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
        colors={['rgba(10,20,40,0.55)', 'rgba(20,30,60,0.72)', 'rgba(8,12,25,0.92)']}
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
          <Text style={[styles.title, { color: glow }]}>Manhood 🪱</Text>
          <Text style={styles.subtitle}>rylane’s corner. real talk, no fluff.</Text>

          <Animated.View style={[
            styles.companion,
            { backgroundColor: 'rgba(10,20,40,0.78)', borderColor: glow + '88', shadowColor: glow,
              opacity: breathOpacity, transform: [{ scale: breathScale }] },
          ]}>
            <Text style={styles.companionText}>⚡  rylane got you</Text>
          </Animated.View>

          <View style={styles.cloudRow}>
            <Animated.Text style={[styles.cloudMascot, { transform: [{ scale: breathScale }], opacity: breathOpacity }]}>☁️</Animated.Text>
            <View style={[styles.cloudBubble, { backgroundColor: 'rgba(10,20,40,0.82)', borderColor: glow + '66' }]}>
              <Text style={styles.cloudText}>
                ask whatever. no judgement. stays here.
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
                  { backgroundColor: isOpen ? 'rgba(10,20,40,0.92)' : 'rgba(10,20,40,0.78)',
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
              real strength is being honest with yourself first. lock in. respect.
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
  backChipText: { color: '#b6dcff', fontSize: 13, fontWeight: '600' },
  privateBadge: { backgroundColor: 'rgba(20,12,40,0.7)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  privateBadgeText: { color: '#b6dcff', fontSize: 12, fontWeight: '600' },

  title:        { fontSize: 30, fontWeight: '900', textAlign: 'center', marginTop: 6, marginBottom: 6 },
  subtitle:     { fontSize: 14, color: '#b6dcff', textAlign: 'center', marginBottom: 14, lineHeight: 20, fontStyle: 'italic' },

  companion:    { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginBottom: 14, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  companionText:{ color: '#F8FAFC', fontSize: 13, fontWeight: '600' },

  cloudRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  cloudMascot:  { fontSize: 28, marginTop: 4 },
  cloudBubble:  { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1 },
  cloudText:    { color: '#e2eeff', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 12, marginTop: 4 },

  topicCard:    { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  topicHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicEmoji:   { fontSize: 26 },
  topicTitle:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  topicSub:     { color: '#b6dcff', fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  chev:         { color: '#b6dcff', fontSize: 18 },

  topicBody:    { marginTop: 14 },
  lesson:       { color: '#dcecff', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  hook:         { fontSize: 13, fontStyle: 'italic', marginBottom: 12 },

  microList:    { marginBottom: 14 },
  microRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  microBullet:  { fontSize: 16, lineHeight: 20 },
  microText:    { color: '#eef6ff', fontSize: 13, lineHeight: 20, flex: 1 },

  routeBtn:     { paddingVertical: 12, borderRadius: 14, alignItems: 'center', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  routeBtnText: { color: '#0a1428', fontSize: 14, fontWeight: '800' },

  sticky:       { backgroundColor: '#fff8e7', borderColor: '#4DA3FF', borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, transform: [{ rotate: '-2deg' }], maxWidth: 320 },
  stickyText:   { color: '#0a2050', fontStyle: 'italic', fontSize: 13, textAlign: 'center' },
});
