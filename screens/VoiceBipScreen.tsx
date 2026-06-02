import React, { useState, useRef } from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, Animated, Image, StyleSheet,
} from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function fetchSekretReply(text: string, context = 'journal', mood?: string): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context, mood }),
    });
    if (!res.ok) throw new Error('api error');
    const data = await res.json();
    return data.reply || "I hear you. You don't have to carry that alone 💜";
  } catch {
    return "I hear you. That makes sense. You don't have to carry that by yourself 💜";
  }
}

interface VoiceNote {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
}

interface VoiceBipScreenProps {
  theme: Record<string, any>;
  setScreen: (screen: string) => void;
  selectedSekret: string;
  voiceNotes: VoiceNote[];
  setVoiceNotes: (notes: VoiceNote[] | ((prev: VoiceNote[]) => VoiceNote[])) => void;
}

export function VoiceBipScreen({
  theme,
  setScreen,
  selectedSekret,
  voiceNotes,
  setVoiceNotes,
}: VoiceBipScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded]       = useState(false);
  const [sekretReply, setSekretReply] = useState('');
  const [isThinking, setIsThinking]   = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<any>(null);

  const heroArt = selectedSekret === 'rylane'
    ? require('../assets/images/rylane-fullbody.png')
    : require('../assets/images/raylene-fullbody.png');

  const startRecording = () => {
    setIsRecording(true);
    setRecorded(false);
    setSekretReply('');
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setRecorded(true);
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);

    const note: VoiceNote = {
      id: Date.now(),
      title: 'Voice Bip',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      duration: '~30s',
    };

    // Update parent state — saveState is triggered by the useEffect in index.tsx
    setVoiceNotes((prev: VoiceNote[]) => [note, ...prev]);

    setIsThinking(true);
    const reply = await fetchSekretReply(
      'I just recorded a voice bip. I had some feelings I needed to get out.',
      'journal'
    );
    setSekretReply(reply);
    setIsThinking(false);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={() => setScreen('pages')} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to Pages</Text>
      </TouchableOpacity>
      <Text style={styles.logo}>Voice Bip 🎙️</Text>
      <Text style={styles.subtitle}>Say it out loud. 30–60 seconds. Let it go.</Text>

      <Image source={heroArt} style={styles.artworkLarge} resizeMode="contain" />

      {/* Record button */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, alignItems: 'center', paddingVertical: 32 }]}>
        <Animated.View style={[
          styles.recordCircle,
          {
            backgroundColor: isRecording ? theme.accent : theme.card,
            borderColor: theme.accent,
            transform: [{ scale: pulseAnim }],
            shadowColor: theme.accent,
            shadowOpacity: isRecording ? 0.8 : 0.3,
            shadowRadius: 20,
            elevation: 10,
          },
        ]}>
          <Text style={{ fontSize: 48 }}>{isRecording ? '🔴' : '🎙️'}</Text>
        </Animated.View>

        <Text style={styles.recordLabel}>
          {isRecording ? 'Recording...' : recorded ? 'Saved 💜' : 'Tap to Start'}
        </Text>
        <Text style={styles.recordSub}>
          {isRecording ? 'Tap again to stop' : 'Say whatever you need to say'}
        </Text>

        <TouchableOpacity
          style={[
            styles.recordBtn,
            { backgroundColor: isRecording ? '#EF4444' : theme.accent },
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.recordBtnText}>
            {isRecording ? '⏹ Stop Recording' : '▶ Start Voice Bip'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Se'kret listening */}
      {isThinking && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={[styles.replyLabel, { color: theme.soft }]}>Se'kret is listening... ☁️</Text>
        </View>
      )}

      {/* Se'kret reply */}
      {sekretReply ? (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={[styles.replyLabel, { color: theme.soft }]}>Se'kret replied 💜</Text>
          <Text style={styles.replyText}>{sekretReply}</Text>
        </View>
      ) : null}

      {/* Tips */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={styles.tipsTitle}>Tips for Voice Bips 🌙</Text>
        {[
          "Find a private spot — car, room, bathroom, wherever",
          "You don't need perfect words. Just talk.",
          "It's okay to cry, pause, or start over",
          "Se'kret listens without judgment, always",
        ].map(tip => (
          <Text key={tip} style={styles.tip}>• {tip}</Text>
        ))}
      </View>

      {/* Saved voice bips */}
      {voiceNotes.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={styles.tipsTitle}>Saved Voice Bips</Text>
          {voiceNotes.slice(0, 5).map(n => (
            <View key={n.id} style={styles.noteRow}>
              <Text style={{ fontSize: 28 }}>🎙️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.noteTitle}>{n.title}</Text>
                <Text style={styles.noteMeta}>{n.date} · {n.time} · {n.duration}</Text>
              </View>
              <TouchableOpacity style={styles.playBtn}>
                <Text style={styles.playBtnText}>▶ Play</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flexGrow: 1, padding: 20, paddingTop: 60 },
  logo:         { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  card:         { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  backBtn:      { marginBottom: 12 },
  backText:     { color: '#94A3B8', fontSize: 14 },
  recordCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  recordLabel:  { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  recordSub:    { color: '#94A3B8', fontSize: 13, marginBottom: 20 },
  recordBtn:    { padding: 14, borderRadius: 18, width: 200, alignItems: 'center' },
  recordBtnText:{ color: '#fff', fontSize: 15, fontWeight: 'bold' },
  replyLabel:   { fontSize: 14, marginBottom: 6 },
  replyText:    { color: '#fff', fontSize: 15, lineHeight: 22 },
  tipsTitle:    { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  tip:          { color: '#CBD5E1', fontSize: 14, marginBottom: 6 },
  noteRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  noteTitle:    { color: '#fff', fontWeight: '600' },
  noteMeta:     { color: '#94A3B8', fontSize: 12 },
  playBtn:      { backgroundColor: '#334155', padding: 8, borderRadius: 10 },
  playBtnText:  { color: '#fff', fontSize: 12 },
  artworkLarge: { width: '100%', height: 280, marginBottom: 16, borderRadius: 20 },
});
