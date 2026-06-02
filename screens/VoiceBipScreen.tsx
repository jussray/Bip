import React, { useState, useRef } from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, Animated, Image, ImageBackground,
  StyleSheet, Platform,
} from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGES
// ─────────────────────────────────────────────────────────────────────────────
const IMAGES = {
  // Time-aware voice art
  rayleneVoiceDay:   require('../assets/images/raylene-voice-day.png'),
  rayleneVoiceNight: require('../assets/images/raylene-voice-night.png'),
  rylaneVoiceDay:    require('../assets/images/rylane-voice-day.png'),
  rylaneVoiceNight:  require('../assets/images/rylane-voice-night.png'),
  // Room background
  roomBgDark:        require('../assets/images/room-bg-dark.png'),
  // Cloud
  cloudHeadphones:   require('../assets/images/cloud-headphones.png'),
};

// ─────────────────────────────────────────────────────────────────────────────
// SE'KRET API
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function fetchSekretReply(
  text: string,
  context = 'journal',
  mood?: string
): Promise<string> {
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

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
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
  setVoiceNotes: React.Dispatch<React.SetStateAction<VoiceNote[]>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
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

  // ── Time-aware hero art ──────────────────────────────────────────────────
  const hour    = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;

  const heroArt =
    selectedSekret === 'rylane'
      ? (isNight ? IMAGES.rylaneVoiceNight : IMAGES.rylaneVoiceDay)
      : (isNight ? IMAGES.rayleneVoiceNight : IMAGES.rayleneVoiceDay);

  // ── Recording ────────────────────────────────────────────────────────────
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

    setVoiceNotes((prev: VoiceNote[]) => [note, ...prev]);

    setIsThinking(true);
    const reply = await fetchSekretReply(
      'I just recorded a voice bip. I had some feelings I needed to get out.',
      'journal'
    );
    setSekretReply(reply);
    setIsThinking(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero header — room background + time-aware character ── */}
        <View style={styles.heroWrap}>
          <ImageBackground
            source={IMAGES.roomBgDark}
            style={styles.heroBg}
            resizeMode="cover"
          >
            {/* Dark overlay */}
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroSub}>
                  {isNight ? 'late night voice bip 🌙' : 'voice bip 🎙️'}
                </Text>
                <Text style={styles.heroTitle}>Voice Bip</Text>
                <Text style={styles.heroMini}>
                  Say it out loud. 30–60 seconds. Let it go.
                </Text>
              </View>
              <Image
                source={heroArt}
                style={styles.heroChar}
                resizeMode="cover"
              />
            </View>
          </ImageBackground>
        </View>

        {/* ── Record button ── */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, flexDirection: 'column', alignItems: 'center', paddingVertical: 32 }]}>
          <Animated.View style={[
            styles.recordCircle,
            {
              backgroundColor: isRecording
                ? 'rgba(236,72,153,0.3)'
                : 'rgba(124,58,237,0.3)',
              borderColor: isRecording ? '#f472b6' : theme.accent,
              transform: [{ scale: pulseAnim }],
              shadowColor: isRecording ? '#f472b6' : theme.accent,
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
            onPress={isRecording ? stopRecording : startRecording}
            style={styles.recordActionWrap}
          >
            <View style={[
              styles.recordActionInner,
              { backgroundColor: isRecording ? '#ef4444' : theme.accent },
            ]}>
              <Text style={styles.recordActionText}>
                {isRecording ? '⏹ Stop Recording' : '▶ Start Voice Bip'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Se'kret listening ── */}
        {isThinking && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, gap: 12 }]}>
            <Image
              source={IMAGES.cloudHeadphones}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
            <Text style={[styles.listeningText, { color: theme.soft }]}>
              Se'kret is listening... ☁️
            </Text>
          </View>
        )}

        {/* ── Se'kret replied ── */}
        {sekretReply && !isThinking && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: 'rgba(168,85,247,0.3)', flexDirection: 'column' }]}>
            <Text style={styles.replyLabel}>Se'kret replied 💜</Text>
            <Text style={[styles.replyText, { color: theme.soft }]}>{sekretReply}</Text>
          </View>
        )}

        {/* ── Tips ── */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, flexDirection: 'column' }]}>
          <Text style={styles.cardTitle}>Tips for Voice Bips 🌙</Text>
          {[
            "Find a private spot — car, room, bathroom, wherever",
            "You don't need perfect words. Just talk.",
            "It's okay to cry, pause, or start over",
            "Se'kret listens without judgment, always",
          ].map(tip => (
            <Text key={tip} style={styles.tip}>• {tip}</Text>
          ))}
        </View>

        {/* ── Saved voice bips ── */}
        {voiceNotes.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, flexDirection: 'column' }]}>
            <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Saved Voice Bips</Text>
            {voiceNotes.slice(0, 5).map(n => (
              <View key={n.id} style={styles.noteRow}>
                <View style={[styles.noteIcon, { backgroundColor: 'rgba(124,58,237,0.3)' }]}>
                  <Text style={{ fontSize: 16 }}>🎙️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteTitle}>{n.title}</Text>
                  <Text style={styles.noteMeta}>{n.date} · {n.time} · {n.duration}</Text>
                </View>
                <TouchableOpacity style={[styles.playBtn, { backgroundColor: 'rgba(124,58,237,0.25)' }]}>
                  <Text style={styles.playBtnText}>▶ Play</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Empty state ── */}
        {voiceNotes.length === 0 && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, flexDirection: 'column', alignItems: 'center', padding: 20 }]}>
            <Image
              source={IMAGES.cloudHeadphones}
              style={{ width: 48, height: 48, marginBottom: 10 }}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>
              No voice bips yet. Your first one is waiting. 🎙️
            </Text>
          </View>
        )}

        {/* ── Back button ── */}
        <TouchableOpacity
          onPress={() => setScreen('pages')}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>← Back to Se'kret Pages</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:              { flex: 1 },
  scroll:            { paddingBottom: 100 },

  // Hero
  heroWrap:          { marginHorizontal: 16, marginTop: Platform.OS === 'ios' ? 56 : 40, marginBottom: 12, borderRadius: 24, overflow: 'hidden' },
  heroBg:            { width: '100%', minHeight: 180 },
  heroOverlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,9,20,0.55)' },
  heroContent:       { padding: 18, minHeight: 180, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  heroSub:           { fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 },
  heroTitle:         { fontSize: 26, color: '#f472b6', fontStyle: 'italic', fontWeight: '800' },
  heroMini:          { fontSize: 12, color: '#a78cc0', marginTop: 4 },
  heroChar:          { width: 90, height: 90, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(168,85,247,0.4)' },

  // Card
  card:              { marginHorizontal: 16, marginBottom: 12, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center' },
  cardTitle:         { fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 10 },

  // Record
  recordCircle:      { width: 120, height: 120, borderRadius: 60, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  recordLabel:       { color: '#f5f0ff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  recordSub:         { color: '#7c6899', fontSize: 13, marginBottom: 20 },
  recordActionWrap:  { borderRadius: 50, overflow: 'hidden', width: 200 },
  recordActionInner: { padding: 14, alignItems: 'center', borderRadius: 50 },
  recordActionText:  { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Reply
  listeningText:     { fontSize: 13, fontStyle: 'italic' },
  replyLabel:        { fontSize: 10, color: '#a855f7', marginBottom: 6 },
  replyText:         { fontSize: 13, lineHeight: 20 },

  // Tips
  tip:               { fontSize: 13, color: '#c4b5fd', marginBottom: 8, lineHeight: 20 },

  // Notes list
  noteRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(167,114,192,0.1)' },
  noteIcon:          { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  noteTitle:         { color: '#f5f0ff', fontWeight: '600', fontSize: 13 },
  noteMeta:          { color: '#7c6899', fontSize: 11 },
  playBtn:           { borderRadius: 10, padding: 6 },
  playBtnText:       { color: '#c4b5fd', fontSize: 12 },

  // Empty
  emptyText:         { fontSize: 13, color: '#7c6899', textAlign: 'center', fontStyle: 'italic' },

  // Back
  backBtn:           { marginHorizontal: 16, marginBottom: 12, padding: 12, alignItems: 'center' },
  backBtnText:       { fontSize: 13, color: '#7c6899' },
});
