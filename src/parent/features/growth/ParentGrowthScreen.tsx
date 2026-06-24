// src/parent/features/growth/ParentGrowthScreen.tsx
//
// Parent's OWN growth & engagement inside Bip.
// Shows: parent milestones, notes they've sent, tips they've engaged with,
// and a place to send a warm one-way note to their teen.
//
// Privacy rule: ZERO teen data here -- no journal, no growth areas,
// no mood, no private content. This screen is entirely about the
// parent's journey within the app.

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, Easing, StyleSheet, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AmbientWeatherOverlay } from '../../../../components/AmbientWeatherOverlay';
import { sendParentNote, fetchLinkedTeenId, fetchParentEngagement, ParentEngagement } from '@/utils/sync';

const P = {
  accent: '#a78bfa',
  soft:   '#ede9fe',
  deep:   '#1e0f3a',
  card:   'rgba(40,20,70,0.85)',
  bg1:    '#100826',
  bg2:    '#1a0d3a',
  green:  '#6ee7b7',
  amber:  '#fcd34d',
};

interface Milestone {
  id:       string;
  emoji:    string;
  label:    string;
  sub:      string;
  check:    (e: ParentEngagement) => boolean;
}

const MILESTONES: Milestone[] = [
  {
    id:    'first_note',
    emoji: '💜',
    label: 'First Warm Note',
    sub:   'You reached out. That already matters.',
    check: (e) => e.notesSent >= 1,
  },
  {
    id:    'tip_explorer',
    emoji: '📖',
    label: 'Tip Explorer',
    sub:   'Read 3 or more parent tips.',
    check: (e) => e.tipsRead >= 3,
  },
  {
    id:    'notes_five',
    emoji: '✉️',
    label: 'Regular Voice',
    sub:   'Sent 5 warm notes to your teen.',
    check: (e) => e.notesSent >= 5,
  },
  {
    id:    'bridge_builder',
    emoji: '🌉',
    label: 'Bridge Builder',
    sub:   'Connected through the Bridge.',
    check: (e) => e.bridgeUsed,
  },
  {
    id:    'week_presence',
    emoji: '🌿',
    label: '7-Day Presence',
    sub:   'Showed up for your teen 7 days running.',
    check: (e) => e.daysActive >= 7,
  },
  {
    id:    'month_connected',
    emoji: '🤝',
    label: '30-Day Connected',
    sub:   'A full month of staying close.',
    check: (e) => e.daysActive >= 30,
  },
];

const PARENT_TIPS = [
  {
    title: "Let them lead",
    body: "Growth questions come when they feel safe -- not when pushed. Being available is enough.",
  },
  {
    title: "Normalise the conversation",
    body: "One casual mention of puberty or emotions makes the next conversation easier. Lower the stakes.",
  },
  {
    title: "Don't project",
    body: "Your experience of adolescence isn't theirs. Ask more than you assume.",
  },
  {
    title: "Celebrate consistency",
    body: "Showing up to their growth journey, even imperfectly, matters more than perfect advice.",
  },
];

const STARTERS = [
  "I'm proud of who you're becoming.",
  "You don't have to figure it all out today.",
  "I'm here -- no pressure, no lecture.",
  "Growing up is hard. You're doing it anyway.",
  "I see you working on yourself. That matters.",
];

interface ParentGrowthScreenProps {
  setScreen: (s: string) => void;
  BottomNav: React.ReactNode;
}

export function ParentGrowthScreen({ setScreen, BottomNav }: ParentGrowthScreenProps) {
  const [tab,        setTab]        = useState<'journey' | 'tips' | 'note'>('journey');
  const [message,    setMessage]    = useState('');
  const [sent,       setSent]       = useState(false);
  const [sending,    setSending]    = useState(false);
  const [teenId,     setTeenId]     = useState<string | null>(null);
  const [engagement, setEngagement] = useState<ParentEngagement>({
    notesSent: 0, tipsRead: 0, daysActive: 0, bridgeUsed: false,
  });

  const fade1  = useRef(new Animated.Value(0)).current;
  const fade2  = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const s = (v: Animated.Value, d: number) =>
      Animated.timing(v, { toValue: 1, duration: 420, delay: d, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    Animated.parallel([s(fade1, 0), s(fade2, 200)]).start();

    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();

    fetchLinkedTeenId().then(id => { if (id) setTeenId(id); });
    fetchParentEngagement().then(data => { if (data) setEngagement(data); });

    return () => loop.stop();
  }, [fade1, fade2, breath]);

  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const slide = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  const achieved = MILESTONES.filter(m => m.check(engagement)).length;

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;
    if (!teenId) {
      Alert.alert('Not linked', 'Link to your teen in Settings first.');
      return;
    }
    setSending(true);
    try {
      const ok = await sendParentNote(teenId, text);
      if (ok) {
        setSent(true);
        setMessage('');
        setEngagement(prev => ({ ...prev, notesSent: prev.notesSent + 1 }));
      } else {
        Alert.alert('Could not send', 'Try again in a moment.');
      }
    } catch {
      Alert.alert('Could not send', 'Check your connection.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={st.root}>
      <AmbientWeatherOverlay />
      <LinearGradient colors={[P.bg1, P.bg2]} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={slide(fade1)}>
          <Text style={st.title}>Your Growth in Bip</Text>
          <Text style={[st.sub, { color: P.soft }]}>
            This is your space -- your journey as a connected parent.{'\n'}
            Your teen's private content stays with them.
          </Text>
        </Animated.View>

        {/* Engagement Stats Row */}
        <Animated.View style={[slide(fade1), st.statsRow]}>
          <View style={[st.statCard, { borderColor: P.accent + '55' }]}>
            <Animated.Text style={[st.statNum, { color: P.accent, transform: [{ scale: breathScale }] }]}>
              {engagement.notesSent}
            </Animated.Text>
            <Text style={[st.statLabel, { color: P.soft }]}>notes sent</Text>
          </View>
          <View style={[st.statCard, { borderColor: P.green + '55' }]}>
            <Animated.Text style={[st.statNum, { color: P.green, transform: [{ scale: breathScale }] }]}>
              {engagement.daysActive}
            </Animated.Text>
            <Text style={[st.statLabel, { color: P.soft }]}>days active</Text>
          </View>
          <View style={[st.statCard, { borderColor: P.amber + '55' }]}>
            <Animated.Text style={[st.statNum, { color: P.amber, transform: [{ scale: breathScale }] }]}>
              {achieved}/{MILESTONES.length}
            </Animated.Text>
            <Text style={[st.statLabel, { color: P.soft }]}>milestones</Text>
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View style={[slide(fade2), st.tabRow]}>
          {(['journey', 'tips', 'note'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[st.tabBtn, tab === t && { backgroundColor: P.accent + '33', borderColor: P.accent }]}
              onPress={() => setTab(t)}
            >
              <Text style={[st.tabLabel, { color: tab === t ? P.accent : P.soft + '88' }]}>
                {t === 'journey' ? 'Journey' : t === 'tips' ? 'Tips' : 'Send Note'}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Journey Tab — parent milestones */}
        {tab === 'journey' && (
          <Animated.View style={slide(fade2)}>
            <Text style={[st.sectionNote, { color: P.soft + 'aa' }]}>
              Milestones earned by being present in Bip. They're yours.
            </Text>
            {MILESTONES.map((m) => {
              const done = m.check(engagement);
              return (
                <View
                  key={m.id}
                  style={[
                    st.milestoneCard,
                    { borderColor: done ? P.accent + '88' : P.soft + '22', opacity: done ? 1 : 0.45 },
                  ]}
                >
                  <Animated.Text
                    style={[st.milestoneEmoji, done && { transform: [{ scale: breathScale }] }]}
                  >
                    {m.emoji}
                  </Animated.Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.milestoneLabel, { color: done ? '#fff' : P.soft + '88' }]}>{m.label}</Text>
                    <Text style={[st.milestoneSub, { color: P.soft + '77' }]}>{m.sub}</Text>
                  </View>
                  {done && <Text style={[st.milestoneDone, { color: P.green }]}>done</Text>}
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Tips Tab */}
        {tab === 'tips' && (
          <Animated.View style={slide(fade2)}>
            {PARENT_TIPS.map((tip) => (
              <View key={tip.title} style={[st.tipCard, { borderColor: P.accent + '44' }]}>
                <Text style={[st.tipTitle, { color: P.accent }]}>{tip.title}</Text>
                <Text style={[st.tipBody, { color: P.soft }]}>{tip.body}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Send Note Tab */}
        {tab === 'note' && (
          <Animated.View style={slide(fade2)}>
            <View style={[st.noteInfo, { borderColor: P.accent + '44' }]}>
              <Text style={[st.noteInfoText, { color: P.soft }]}>
                Send a short warm note to your teen. They see it as a gentle signal in their Bip space.
                You cannot read their journal. This is one-way warmth.
              </Text>
            </View>

            <Text style={[st.sectionTitle, { color: P.soft }]}>Need a starting point?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {STARTERS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[st.starterChip, { borderColor: P.accent + '55' }]}
                  onPress={() => setMessage(s)}
                >
                  <Text style={[st.starterText, { color: P.soft }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!sent ? (
              <>
                <Animated.View style={[st.inputWrap, { borderColor: P.accent + '88' }]}>
                  <Text
                    style={[st.inputPlaceholder, { color: message ? '#fff' : P.soft + '66' }]}
                    onPress={() => {}}
                  >
                    {message || 'Write something warm...'}
                  </Text>
                </Animated.View>
                <TouchableOpacity
                  style={[st.sendBtn, { backgroundColor: message.trim() ? P.accent : 'rgba(60,30,80,0.5)' }]}
                  onPress={handleSend}
                  disabled={!message.trim() || sending}
                >
                  <Text style={[st.sendBtnText, { color: message.trim() ? P.deep : P.soft + '66' }]}>
                    {sending ? 'sending...' : 'send with love 💜'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={[st.sentCard, { borderColor: P.accent + '55' }]}>
                <Animated.Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 10, transform: [{ scale: breathScale }] }}>
                  {'💜'}
                </Animated.Text>
                <Text style={[st.sentTitle, { color: '#fff' }]}>Sent.</Text>
                <Text style={[st.sentSub, { color: P.soft }]}>
                  Your teen will see it as a warm note in their space.
                </Text>
                <TouchableOpacity style={[st.sendBtn, { backgroundColor: P.accent, marginTop: 16 }]} onPress={() => setSent(false)}>
                  <Text style={[st.sendBtnText, { color: P.deep }]}>send another</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        <TouchableOpacity style={[st.ghostBtn, { borderColor: P.accent + '55' }]} onPress={() => setScreen('home')}>
          <Text style={[st.ghostBtnText, { color: P.soft + 'aa' }]}>{'<- back to room'}</Text>
        </TouchableOpacity>

      </ScrollView>

      {BottomNav}
    </View>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#100826' },
  scroll:       { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40, ...(Platform.OS === 'web' ? { maxWidth: 520, width: '100%', alignSelf: 'center' as const } : {}) },
  title:        { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  sub:          { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  sectionNote:  { fontSize: 12, marginBottom: 14, fontStyle: 'italic' },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:     { flex: 1, backgroundColor: 'rgba(40,20,70,0.82)', borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statNum:      { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statLabel:    { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tabRow:       { flexDirection: 'row', gap: 8, marginBottom: 18 },
  tabBtn:       { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
  tabLabel:     { fontSize: 12, fontWeight: '700' },
  milestoneCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(40,20,70,0.75)', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  milestoneEmoji: { fontSize: 26 },
  milestoneLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  milestoneSub:   { fontSize: 12, lineHeight: 17 },
  milestoneDone:  { fontSize: 11, fontWeight: '700' },
  tipCard:      { backgroundColor: 'rgba(40,20,70,0.75)', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  tipTitle:     { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tipBody:      { fontSize: 13, lineHeight: 21 },
  noteInfo:     { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  noteInfoText: { fontSize: 13, lineHeight: 20 },
  starterChip:  { backgroundColor: 'rgba(40,20,70,0.8)', borderWidth: 1, borderRadius: 14, padding: 10, marginRight: 8, maxWidth: 220 },
  starterText:  { fontSize: 12, lineHeight: 18 },
  inputWrap:    { backgroundColor: 'rgba(40,20,70,0.8)', borderWidth: 1, borderRadius: 18, padding: 16, minHeight: 110, marginBottom: 10 },
  inputPlaceholder: { fontSize: 14, lineHeight: 22 },
  sendBtn:      { padding: 16, borderRadius: 18, alignItems: 'center', marginBottom: 12 },
  sendBtnText:  { fontSize: 15, fontWeight: 'bold' },
  sentCard:     { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 12 },
  sentTitle:    { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  sentSub:      { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  ghostBtn:     { borderWidth: 1, borderRadius: 18, padding: 14, alignItems: 'center', marginTop: 8 },
  ghostBtnText: { fontSize: 14, fontWeight: '600' },
});
