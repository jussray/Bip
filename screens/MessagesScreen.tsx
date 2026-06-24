// screens/MessagesScreen.tsx
// Side-aware messages screen.
// Parent: compose + history of warm notes sent to teen.
// Teen: read-only inbox of parent notes received.
// One-way warmth by design — teen cannot reply, parent cannot read teen journal.

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, Easing, StyleSheet, Platform, Alert, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AmbientWeatherOverlay } from '../components/AmbientWeatherOverlay';
import { sendParentNote, fetchLinkedTeenId, fetchParentNotes, fetchParentSentNotes, ParentNote } from '@/utils/sync';

const STARTERS = [
  "I'm proud of who you're becoming.",
  "You don't have to figure it all out today.",
  "I'm here -- no pressure, no lecture.",
  "Growing up is hard. You're doing it anyway.",
  "I see you working on yourself. That matters.",
];

interface MessagesScreenProps {
  side: 'teen' | 'parent';
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function MessagesScreen({ side, setScreen, BottomNav }: MessagesScreenProps) {
  const [message,  setMessage]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [teenId,   setTeenId]   = useState<string | null>(null);
  const [notes,    setNotes]    = useState<ParentNote[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'compose' | 'history'>('compose');

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

    async function load() {
      if (side === 'parent') {
        const id = await fetchLinkedTeenId();
        if (id) setTeenId(id);
        const history = await fetchParentSentNotes();
        setNotes(history);
      } else {
        const inbox = await fetchParentNotes();
        setNotes(inbox);
      }
      setLoading(false);
    }
    load();

    return () => loop.stop();
  }, [fade1, fade2, breath, side]);

  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const slide = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  const accent = side === 'parent' ? '#a78bfa' : '#c084fc';
  const soft   = side === 'parent' ? '#ede9fe' : '#f3e8ff';
  const deep   = '#1e0f3a';

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
        const updated: ParentNote = {
          id: Date.now().toString(),
          content: text,
          sent_at: new Date().toISOString(),
          seen_by_teen: false,
        };
        setNotes(prev => [updated, ...prev]);
      } else {
        Alert.alert('Could not send', 'Try again in a moment.');
      }
    } catch {
      Alert.alert('Could not send', 'Check your connection.');
    } finally {
      setSending(false);
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  };

  return (
    <View style={st.root}>
      <AmbientWeatherOverlay />
      <LinearGradient colors={['#100826', '#1a0d3a']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        <Animated.View style={slide(fade1)}>
          <Text style={[st.title, { color: accent }]}>
            {side === 'parent' ? 'Warm Notes 💜' : 'From Your Parent 💜'}
          </Text>
          <Text style={[st.sub, { color: soft }]}>
            {side === 'parent'
              ? 'one-way warmth. your teen sees it. you can\'t read their journal.'
              : 'your parent left you something. no pressure to respond.'}
          </Text>
        </Animated.View>

        {/* Parent: tabs */}
        {side === 'parent' && (
          <Animated.View style={[slide(fade1), st.tabRow]}>
            {(['compose', 'history'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[st.tabBtn, tab === t && { backgroundColor: accent + '33', borderColor: accent }]}
                onPress={() => setTab(t)}
              >
                <Text style={[st.tabLabel, { color: tab === t ? accent : soft + '88' }]}>
                  {t === 'compose' ? 'Write a Note' : `History (${notes.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Parent compose */}
        {side === 'parent' && tab === 'compose' && (
          <Animated.View style={slide(fade2)}>
            <View style={[st.infoBox, { borderColor: accent + '44' }]}>
              <Text style={[st.infoText, { color: soft }]}>
                Your teen sees this as a gentle warm note. They cannot reply. This is yours to give freely.
              </Text>
            </View>

            <Text style={[st.sectionLabel, { color: soft }]}>starting points</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {STARTERS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[st.starterChip, { borderColor: accent + '55' }]}
                  onPress={() => setMessage(s)}
                >
                  <Text style={[st.starterText, { color: soft }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!sent ? (
              <>
                <TextInput
                  style={[st.input, { borderColor: accent + '88', color: '#fff' }]}
                  placeholder="Write something warm..."
                  placeholderTextColor={soft + '55'}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={280}
                />
                <Text style={[st.charCount, { color: soft + '55' }]}>{message.length}/280</Text>
                <TouchableOpacity
                  style={[st.sendBtn, { backgroundColor: message.trim() ? accent : 'rgba(60,30,80,0.5)' }]}
                  onPress={handleSend}
                  disabled={!message.trim() || sending}
                >
                  <Text style={[st.sendBtnText, { color: message.trim() ? deep : soft + '66' }]}>
                    {sending ? 'sending...' : 'send with love 💜'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={[st.sentCard, { borderColor: accent + '55' }]}>
                <Animated.Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 10, transform: [{ scale: breathScale }] }}>
                  {'💜'}
                </Animated.Text>
                <Text style={[st.sentTitle, { color: '#fff' }]}>Sent.</Text>
                <Text style={[st.sentSub, { color: soft }]}>Your teen will see it in their space.</Text>
                <TouchableOpacity style={[st.sendBtn, { backgroundColor: accent, marginTop: 16 }]} onPress={() => setSent(false)}>
                  <Text style={[st.sendBtnText, { color: deep }]}>send another</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        {/* Parent history / Teen inbox */}
        {(side === 'teen' || tab === 'history') && (
          <Animated.View style={slide(fade2)}>
            {loading ? (
              <Text style={[st.emptyText, { color: soft + '66' }]}>loading...</Text>
            ) : notes.length === 0 ? (
              <View style={[st.emptyCard, { borderColor: accent + '33' }]}>
                <Animated.Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 10, transform: [{ scale: breathScale }] }}>
                  {'💜'}
                </Animated.Text>
                <Text style={[st.emptyText, { color: soft + '88' }]}>
                  {side === 'parent'
                    ? 'no notes sent yet. write your first.'
                    : 'no notes yet. your parent will reach out when ready.'}
                </Text>
              </View>
            ) : (
              notes.map(note => (
                <View key={note.id} style={[st.noteCard, { borderColor: accent + '44' }]}>
                  <View style={st.noteHeader}>
                    <Text style={{ fontSize: 16 }}>{'💜'}</Text>
                    <Text style={[st.noteTime, { color: soft + '77' }]}>{timeAgo(note.sent_at)}</Text>
                  </View>
                  <Text style={[st.noteContent, { color: soft }]}>{note.content}</Text>
                </View>
              ))
            )}
          </Animated.View>
        )}

        <TouchableOpacity style={[st.ghostBtn, { borderColor: accent + '44' }]} onPress={() => setScreen('home')}>
          <Text style={[st.ghostBtnText, { color: soft + 'aa' }]}>{'<- back'}</Text>
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
  tabRow:       { flexDirection: 'row', gap: 10, marginBottom: 18 },
  tabBtn:       { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
  tabLabel:     { fontSize: 13, fontWeight: '700' },
  infoBox:      { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  infoText:     { fontSize: 13, lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  starterChip:  { backgroundColor: 'rgba(40,20,70,0.8)', borderWidth: 1, borderRadius: 14, padding: 10, marginRight: 8, maxWidth: 220 },
  starterText:  { fontSize: 12, lineHeight: 18 },
  input:        { backgroundColor: 'rgba(40,20,70,0.8)', borderWidth: 1, borderRadius: 18, padding: 16, minHeight: 120, marginBottom: 6, fontSize: 14, lineHeight: 22, textAlignVertical: 'top' },
  charCount:    { fontSize: 11, textAlign: 'right', marginBottom: 12 },
  sendBtn:      { padding: 16, borderRadius: 18, alignItems: 'center', marginBottom: 12 },
  sendBtnText:  { fontSize: 15, fontWeight: 'bold' },
  sentCard:     { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 12 },
  sentTitle:    { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  sentSub:      { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  noteCard:     { backgroundColor: 'rgba(40,20,70,0.78)', borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  noteHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  noteTime:     { fontSize: 11 },
  noteContent:  { fontSize: 14, lineHeight: 22 },
  emptyCard:    { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText:    { fontSize: 13, lineHeight: 20, textAlign: 'center', fontStyle: 'italic' },
  ghostBtn:     { borderWidth: 1, borderRadius: 18, padding: 14, alignItems: 'center', marginTop: 8 },
  ghostBtnText: { fontSize: 14, fontWeight: '600' },
});
