// screens/ConnectionHubScreen.tsx
// Parent-only. The parent's dedicated space to see their connection with their teen.
// Shows: linked teen status, connection strength, bridge signals received,
// notes sent, quick actions. No teen private content — only the connection itself.

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, Easing, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AmbientWeatherOverlay } from '../components/AmbientWeatherOverlay';
import {
  fetchLinkedTeenId, fetchParentEngagement, fetchBridgeSignals,
  ParentEngagement, BridgeSignal,
} from '@/utils/sync';

const P = {
  accent: '#a78bfa',
  soft:   '#ede9fe',
  green:  '#6ee7b7',
  amber:  '#fcd34d',
  bg1:    '#100826',
  bg2:    '#1a0d3a',
};

function connectionStrength(e: ParentEngagement): { label: string; score: number; color: string } {
  let score = 0;
  if (e.notesSent >= 1)   score += 20;
  if (e.notesSent >= 5)   score += 15;
  if (e.daysActive >= 7)  score += 20;
  if (e.daysActive >= 14) score += 15;
  if (e.bridgeUsed)       score += 20;
  if (e.tipsRead >= 3)    score += 10;
  score = Math.min(score, 100);
  if (score >= 70) return { label: 'Strong',   score, color: P.green };
  if (score >= 40) return { label: 'Building', score, color: P.accent };
  return                  { label: 'Starting', score, color: P.amber };
}

const SIGNAL_LABELS: Record<string, string> = {
  'overwhelmed':   'felt overwhelmed',
  'happy':         'had a great day',
  'calm':          'felt calm',
  'need-support':  'needed support',
  'stressed':      'felt stressed',
  'proud':         'felt proud',
};

interface ConnectionHubScreenProps {
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function ConnectionHubScreen({ setScreen, BottomNav }: ConnectionHubScreenProps) {
  const [teenId,     setTeenId]     = useState<string | null>(null);
  const [engagement, setEngagement] = useState<ParentEngagement>({
    notesSent: 0, tipsRead: 0, daysActive: 0, bridgeUsed: false,
  });
  const [signals,    setSignals]    = useState<BridgeSignal[]>([]);
  const [loading,    setLoading]    = useState(true);

  const fade1  = useRef(new Animated.Value(0)).current;
  const fade2  = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const bar    = useRef(new Animated.Value(0)).current;
  const pulse  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const s = (v: Animated.Value, d: number) =>
      Animated.timing(v, { toValue: 1, duration: 420, delay: d, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    Animated.parallel([s(fade1, 0), s(fade2, 220)]).start();

    const breathLoop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    breathLoop.start();

    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    pulseLoop.start();

    async function load() {
      const id   = await fetchLinkedTeenId();
      const eng  = await fetchParentEngagement();
      if (id)  setTeenId(id);
      if (eng) {
        setEngagement(eng);
        const strength = connectionStrength(eng);
        Animated.timing(bar, {
          toValue: strength.score / 100,
          duration: 900, delay: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
        const sigs = await fetchBridgeSignals(id ?? '');
        setSignals(sigs.slice(0, 6));
      }
      setLoading(false);
    }
    load();

    return () => { breathLoop.stop(); pulseLoop.stop(); };
  }, [fade1, fade2, breath, bar, pulse]);

  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const slide = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  const strength = connectionStrength(engagement);
  const linked   = !!teenId;

  return (
    <View style={st.root}>
      <AmbientWeatherOverlay />
      <LinearGradient colors={[P.bg1, P.bg2]} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        <Animated.View style={slide(fade1)}>
          <Text style={[st.title, { color: P.accent }]}>Connection Hub 🤝</Text>
          <Text style={[st.sub, { color: P.soft }]}>
            your connection with your teen. built one small moment at a time.
          </Text>
        </Animated.View>

        {/* Link status */}
        <Animated.View style={[slide(fade1), st.linkCard, { borderColor: linked ? P.green + '88' : P.amber + '88' }]}>
          <Animated.Text style={[st.linkDot, { transform: [{ scale: pulse }] }]}>
            {linked ? '🟢' : '🟡'}
          </Animated.Text>
          <View style={{ flex: 1 }}>
            <Text style={[st.linkStatus, { color: linked ? P.green : P.amber }]}>
              {linked ? 'Linked & Connected' : 'Not Linked Yet'}
            </Text>
            <Text style={[st.linkSub, { color: P.soft + 'aa' }]}>
              {linked
                ? 'Your teen is in Bip. You are with them.'
                : 'Go to Settings to link your teen account.'}
            </Text>
          </View>
          {!linked && (
            <TouchableOpacity
              style={[st.linkBtn, { backgroundColor: P.amber }]}
              onPress={() => setScreen('settings')}
            >
              <Text style={st.linkBtnText}>Link</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Connection strength */}
        <Animated.View style={[slide(fade1), st.card, { borderColor: P.accent + '44' }]}>
          <Text style={[st.cardTitle, { color: P.accent }]}>connection strength</Text>
          <View style={st.barOuter}>
            <Animated.View style={[st.barInner, {
              width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: strength.color,
            }]} />
          </View>
          <View style={st.strengthRow}>
            <Text style={[st.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            <Text style={[st.strengthScore, { color: P.soft + '88' }]}>{strength.score}%</Text>
          </View>
          <Text style={[st.cardSub, { color: P.soft + '88' }]}>
            grows with notes, Bridge, and staying present
          </Text>
        </Animated.View>

        {/* Engagement summary */}
        <Animated.View style={[slide(fade1), st.statsRow]}>
          {[
            { emoji: '✉️', num: engagement.notesSent,  label: 'notes sent',  color: P.accent },
            { emoji: '🌿', num: engagement.daysActive,  label: 'days active', color: P.green  },
            { emoji: '🌉', num: engagement.bridgeUsed ? 1 : 0, label: 'bridge used', color: P.amber },
          ].map(s => (
            <View key={s.label} style={[st.statCard, { borderColor: s.color + '55' }]}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</Text>
              <Animated.Text style={[st.statNum, { color: s.color, transform: [{ scale: breathScale }] }]}>
                {s.num}
              </Animated.Text>
              <Text style={[st.statLabel, { color: P.soft + 'aa' }]}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Bridge signals */}
        <Animated.View style={[slide(fade2), st.card, { borderColor: P.accent + '44' }]}>
          <Text style={[st.cardTitle, { color: P.accent }]}>signals from your teen 🌉</Text>
          <Text style={[st.cardSub, { color: P.soft + '88' }]}>
            anonymous feelings your teen shared via Bridge. no details, just signals.
          </Text>
          {loading ? (
            <Text style={[st.emptyText, { color: P.soft + '66' }]}>loading...</Text>
          ) : signals.length === 0 ? (
            <Text style={[st.emptyText, { color: P.soft + '66' }]}>
              no signals yet. when your teen uses Bridge, you'll see them here.
            </Text>
          ) : (
            signals.map((sig, i) => (
              <View key={i} style={[st.signalRow, { borderColor: P.accent + '33' }]}>
                <Text style={{ fontSize: 18 }}>
                  {sig.share_type === 'happy' ? '😊' :
                   sig.share_type === 'overwhelmed' ? '🌊' :
                   sig.share_type === 'stressed' ? '🤯' :
                   sig.share_type === 'calm' ? '😌' :
                   sig.share_type === 'proud' ? '💪' : '💜'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[st.signalLabel, { color: P.soft }]}>
                    {SIGNAL_LABELS[sig.share_type] ?? 'sent a signal'}
                  </Text>
                  <Text style={[st.signalTime, { color: P.soft + '66' }]}>
                    {new Date(sig.sent_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>

        {/* Quick actions */}
        <Animated.View style={[slide(fade2), st.actionsRow]}>
          <TouchableOpacity
            style={[st.actionBtn, { backgroundColor: P.accent }]}
            onPress={() => setScreen('parent-growth')}
          >
            <Text style={st.actionBtnText}>💜 send a note</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.actionBtn, { backgroundColor: 'rgba(40,20,70,0.85)', borderWidth: 1, borderColor: P.accent + '66' }]}
            onPress={() => setScreen('parent-bridge')}
          >
            <Text style={[st.actionBtnText, { color: P.accent }]}>🌉 open bridge</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={[st.ghostBtn, { borderColor: P.accent + '44' }]} onPress={() => setScreen('home')}>
          <Text style={[st.ghostBtnText, { color: P.soft + 'aa' }]}>{'<- back'}</Text>
        </TouchableOpacity>

      </ScrollView>

      {BottomNav}
    </View>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#100826' },
  scroll:       { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40, ...(Platform.OS === 'web' ? { maxWidth: 520, width: '100%', alignSelf: 'center' as const } : {}) },
  title:        { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  sub:          { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  card:         { backgroundColor: 'rgba(40,20,70,0.78)', borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  cardTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  cardSub:      { fontSize: 12, lineHeight: 18, fontStyle: 'italic', marginBottom: 10 },
  linkCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(40,20,70,0.78)', borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  linkDot:      { fontSize: 24 },
  linkStatus:   { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  linkSub:      { fontSize: 12, lineHeight: 17 },
  linkBtn:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  linkBtnText:  { fontSize: 13, fontWeight: '700', color: '#1e0f3a' },
  barOuter:     { height: 12, backgroundColor: 'rgba(20,10,40,0.8)', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  barInner:     { height: '100%', borderRadius: 6 },
  strengthRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  strengthLabel:{ fontSize: 14, fontWeight: '700' },
  strengthScore:{ fontSize: 13 },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard:     { flex: 1, backgroundColor: 'rgba(40,20,70,0.82)', borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statNum:      { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLabel:    { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  signalRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingVertical: 10 },
  signalLabel:  { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  signalTime:   { fontSize: 11 },
  emptyText:    { fontSize: 13, lineHeight: 20, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
  actionsRow:   { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionBtn:    { flex: 1, padding: 14, borderRadius: 18, alignItems: 'center' },
  actionBtnText:{ fontSize: 14, fontWeight: '700', color: '#1e0f3a' },
  ghostBtn:     { borderWidth: 1, borderRadius: 18, padding: 14, alignItems: 'center', marginTop: 8 },
  ghostBtnText: { fontSize: 14, fontWeight: '600' },
});
