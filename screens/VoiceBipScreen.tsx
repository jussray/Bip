// screens/VoiceBipScreen.txt
// Se'kret Bip — Voice Bip Screen
//
// Fixes applied (2026-06-03):
//   A1 — onSave?: () => void added to interface; called inside stopRecording
//         (index.tsx passes () => trackActivity('voice') — was silently dropped)
//   A4 — "Raylene is listening" badge now character-aware (Raylene / Rylane)
//   B1 — roomWrap View gets pointerEvents="box-none" (Android hotspot fix)
//   B2 — hint View gets pointerEvents="none" (Android touch-block fix)
//   B3 — heroArt is now rendered as the avatar overlay on the room image
//   D1 — Archive shows total count + "see all → pages" nudge when > 6

import React, { useState, useRef, useEffect } from 'react';
import {
  Text, TouchableOpacity, ScrollView, View,
  Animated, Image, StyleSheet, Platform,
} from 'react-native';

// ── DEBUG ──────────────────────────────────────────────────────────────────
const DEBUG_HOTSPOTS = false;

// ── ROOM IMAGES ────────────────────────────────────────────────────────────
const ROOM_DAY   = require('../assets/images/raylene-voice-day.png');
const ROOM_NIGHT = require('../assets/images/raylene-voice-night.png');
const CLOUD_HP   = require('../assets/images/cloud-headphones.png');

// ── HOTSPOTS ───────────────────────────────────────────────────────────────
const HOTSPOTS = {
  microphone: { top: '18%',    left: '30%',  width: '22%', height: '28%', label: 'Mic 🎙️' },
  journal:    { bottom: '4%',  left: '16%',  width: '44%', height: '22%', label: 'Journal 📖' },
  window:     { top: '4%',     right: '2%',  width: '38%', height: '40%', label: 'Window 🌙' },
  crystalJar: { bottom: '4%',  right: '2%',  width: '18%', height: '22%', label: 'Saved 💎' },
};

// ── BIP TYPE MENU ──────────────────────────────────────────────────────────
const BIP_TYPES = [
  { id: 'voice', emoji: '🎙️', label: 'Voice Bip',  sub: 'say it out loud' },
  { id: 'video', emoji: '📹', label: 'Video Bip',  sub: '30–60 seconds' },
  { id: 'text',  emoji: '✍️', label: 'Text Bip',   sub: 'write it out' },
  { id: 'cloud', emoji: '☁️', label: 'Cloud Bip',  sub: 'send to the clouds' },
];

// ── API ────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function fetchSekretReply(text: string, context = 'journal', mood?: string): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text, context, mood }),
    });
    if (!res.ok) throw new Error('api error');
    const data = await res.json();
    return data.reply || "I hear you. You don't have to carry that alone 💜";
  } catch {
    return "I hear you. That makes sense. You don't have to carry that by yourself 💜";
  }
}

// ── TYPES ──────────────────────────────────────────────────────────────────
interface VoiceNote {
  id:        number;
  title:     string;
  date:      string;
  time:      string;
  duration:  string;
  type?:     string;
}

// Fix A1: onSave added
interface VoiceBipScreenProps {
  theme:          Record<string, any>;
  setScreen:      (screen: string) => void;
  selectedSekret: string;
  voiceNotes:     VoiceNote[];
  setVoiceNotes:  (notes: VoiceNote[] | ((prev: VoiceNote[]) => VoiceNote[])) => void;
  onSave?:        () => void;
}

// ── COMPONENT ──────────────────────────────────────────────────────────────
export function VoiceBipScreen({
  theme, setScreen, selectedSekret, voiceNotes, setVoiceNotes, onSave,
}: VoiceBipScreenProps) {

  const [showBipMenu,      setShowBipMenu]      = useState(false);
  const [showArchive,      setShowArchive]       = useState(false);
  const [isRecording,      setIsRecording]       = useState(false);
  const [recorded,         setRecorded]          = useState(false);
  const [sekretReply,      setSekretReply]       = useState('');
  const [isThinking,       setIsThinking]        = useState(false);
  const [recordingTime,    setRecordingTime]     = useState(0);
  const [selectedBipType,  setSelectedBipType]   = useState<string | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<any>(null);
  const glowLoop  = useRef<any>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Waveform — 12 bars
  const waveAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0.3))
  ).current;
  const waveLoop = useRef<any>(null);

  // Time-aware room
  const hour    = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;
  const roomArt = isNight ? ROOM_NIGHT : ROOM_DAY;

  // Fix B3: heroArt now actually rendered
  const heroArt =
    selectedSekret === 'rylane'
      ? (isNight
          ? require('../assets/images/rylane-voice-night.png')
          : require('../assets/images/rylane-voice-day.png'))
      : (isNight
          ? require('../assets/images/raylene-voice-night.png')
          : require('../assets/images/raylene-voice-day.png'));

  // Fix A4: character-aware listening label
  const characterName = selectedSekret === 'rylane' ? 'Rylane' : 'Raylene';
  const characterEmoji = selectedSekret === 'rylane' ? '⚡' : '💜';

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = () => {
    setIsRecording(true);
    setRecorded(false);
    setSekretReply('');
    setRecordingTime(0);
    setShowBipMenu(false);

    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();

    // glowAnim drives overlay opacity — useNativeDriver: false is correct here
    glowLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: false }),
      ])
    );
    glowLoop.current.start();

    waveLoop.current = Animated.loop(
      Animated.stagger(80,
        waveAnims.map(anim =>
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.8,
              duration: 200 + Math.random() * 300,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.4,
              duration: 200 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ])
        )
      )
    );
    waveLoop.current.start();

    timerRef.current = setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setRecorded(true);

    pulseLoop.current?.stop();
    glowLoop.current?.stop();
    waveLoop.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    pulseAnim.setValue(1);
    glowAnim.setValue(0);
    waveAnims.forEach(a => a.setValue(0.3));

    const note: VoiceNote = {
      id:       Date.now(),
      title:    selectedBipType ? `${selectedBipType} Bip` : 'Voice Bip',
      date:     new Date().toLocaleDateString(),
      time:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: formatTime(recordingTime),
      type:     selectedBipType || 'voice',
    };

    setVoiceNotes((prev: VoiceNote[]) => [note, ...prev]);

    // Fix A1: call onSave so trackActivity('voice') fires in index.tsx
    onSave?.();

    setIsThinking(true);
    const reply = await fetchSekretReply(
      'I just recorded a voice bip. I had some feelings I needed to get out.',
      'journal'
    );
    setSekretReply(reply);
    setIsThinking(false);
    setSelectedBipType(null);
  };

  useEffect(() => {
    return () => {
      pulseLoop.current?.stop();
      glowLoop.current?.stop();
      waveLoop.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: '#0d0914' }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Interactive Room ── */}
        {/* Fix B1: pointerEvents="box-none" so hotspots work on Android */}
        <View style={styles.roomWrap} pointerEvents="box-none">
          <Image source={roomArt} style={styles.roomImage} resizeMode="cover" />

          {/* Fix B3: hero art avatar overlaid on room */}
          <Image
            source={heroArt}
            style={styles.heroAvatar}
            resizeMode="contain"
            pointerEvents="none"
          />

          {/* Purple recording overlay */}
          {isRecording && (
            <Animated.View
              style={[styles.recordingOverlay, { opacity: glowAnim }]}
              pointerEvents="none"
            />
          )}

          {/* Time badge */}
          <View style={styles.timeBadge} pointerEvents="none">
            <Text style={styles.timeBadgeText}>{isNight ? '🌙 night' : '☀️ day'}</Text>
          </View>

          {/* Fix A4: character-aware listening badge */}
          {isRecording && (
            <View style={styles.listeningBadge} pointerEvents="none">
              <Text style={styles.listeningBadgeText}>
                {characterName} is listening... {characterEmoji}
              </Text>
            </View>
          )}

          {/* HOTSPOT — Microphone */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.hotspot,
              { top: HOTSPOTS.microphone.top, left: HOTSPOTS.microphone.left, width: HOTSPOTS.microphone.width, height: HOTSPOTS.microphone.height },
              DEBUG_HOTSPOTS && styles.hotspotDebug,
            ]}
            onPress={() => {
              if (isRecording) stopRecording();
              else setShowBipMenu(true);
            }}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.mic