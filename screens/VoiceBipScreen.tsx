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
import { IMAGES } from '../constants/theme';
import {
  Text, TouchableOpacity, ScrollView, View,
  Animated, Image, StyleSheet, Platform,
} from 'react-native';

// ── DEBUG ──────────────────────────────────────────────────────────────────
const DEBUG_HOTSPOTS = false;

// ── ROOM IMAGES ────────────────────────────────────────────────────────────
const ROOM_DAY   = IMAGES.rayleneVoiceDay;
const ROOM_NIGHT = IMAGES.rayleneVoiceNight;
const CLOUD_HP   = IMAGES.cloudHeadphones;

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
  if (!BASE_URL) return "I hear you. You don't have to carry that alone 💜";
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
      ? (isNight ? IMAGES.rylaneVoiceNight : IMAGES.rylaneVoiceDay)
      : (isNight ? IMAGES.rayleneVoiceNight : IMAGES.rayleneVoiceDay);

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
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.microphone.label}</Text>}
          </TouchableOpacity>

          {/* HOTSPOT — Journal */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.hotspot,
              { bottom: HOTSPOTS.journal.bottom, left: HOTSPOTS.journal.left, width: HOTSPOTS.journal.width, height: HOTSPOTS.journal.height },
              DEBUG_HOTSPOTS && styles.hotspotDebug,
            ]}
            onPress={() => setShowArchive(true)}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.journal.label}</Text>}
          </TouchableOpacity>

          {/* HOTSPOT — Window */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.hotspot,
              { top: HOTSPOTS.window.top, right: HOTSPOTS.window.right, width: HOTSPOTS.window.width, height: HOTSPOTS.window.height },
              DEBUG_HOTSPOTS && styles.hotspotDebug,
            ]}
            onPress={() => setScreen('cloudThoughts')}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.window.label}</Text>}
          </TouchableOpacity>

          {/* HOTSPOT — Crystal Jar */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.hotspot,
              { bottom: HOTSPOTS.crystalJar.bottom, right: HOTSPOTS.crystalJar.right, width: HOTSPOTS.crystalJar.width, height: HOTSPOTS.crystalJar.height },
              DEBUG_HOTSPOTS && styles.hotspotDebug,
            ]}
            onPress={() => setShowArchive(true)}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.crystalJar.label}</Text>}
          </TouchableOpacity>

          {/* Fix B2: pointerEvents="none" so hint doesn't eat touches */}
          {!DEBUG_HOTSPOTS && !isRecording && (
            <View style={[styles.hint, { top: '15%', left: '26%' }]} pointerEvents="none">
              <Text style={styles.hintText}>tap the mic 🎙️</Text>
            </View>
          )}
        </View>

        {/* ── Recording state ── */}
        {isRecording && (
          <View style={[styles.recordingCard, { borderColor: '#a855f7', backgroundColor: 'rgba(13,9,20,0.92)' }]}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], borderColor: '#a855f7' }]} />
            <Text style={styles.recordingLabel}>Recording... 🔴</Text>
            <Text style={styles.recordingTimer}>{formatTime(recordingTime)}</Text>
            <View style={styles.waveform}>
              {waveAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 36] }),
                      backgroundColor: i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#f472b6' : '#7c3aed',
                    },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
              <Text style={styles.stopBtnText}>⏹ Stop</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Saved confirmation ── */}
        {recorded && !isRecording && (
          <View style={[styles.floatCard, { borderColor: theme.accent, backgroundColor: 'rgba(13,9,20,0.88)' }]}>
            <Text style={[styles.savedLabel, { color: theme.soft }]}>Saved to your journal 💜</Text>
          </View>
        )}

        {/* ── Se'kret listening ── */}
        {isThinking && (
          <View style={[styles.floatCard, { borderColor: theme.accent, backgroundColor: 'rgba(13,9,20,0.88)', flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <Image source={CLOUD_HP} style={{ width: 36, height: 36 }} resizeMode="contain" />
            <Text style={[styles.thinkingText, { color: theme.soft }]}>Se'kret is listening... ☁️</Text>
          </View>
        )}

        {/* ── Se'kret reply ── */}
        {sekretReply && !isThinking && (
          <View style={[styles.floatCard, { borderColor: 'rgba(168,85,247,0.3)', backgroundColor: 'rgba(13,9,20,0.92)' }]}>
            <Text style={[styles.replyLabel, { color: '#a855f7' }]}>Se'kret replied 💜</Text>
            <Text style={[styles.replyText, { color: theme.soft }]}>{sekretReply}</Text>
          </View>
        )}

        {/* ── Tips ── */}
        <View style={[styles.floatCard, { borderColor: theme.accent, backgroundColor: 'rgba(13,9,20,0.85)' }]}>
          <Text style={[styles.cardTitle, { color: '#fff' }]}>Tips for Voice Bips 🌙</Text>
          {[
            "Find a private spot — car, room, bathroom, wherever",
            "You don't need perfect words. Just talk.",
            "It's okay to cry, pause, or start over",
            "Se'kret listens without judgment, always",
          ].map(tip => (
            <Text key={tip} style={[styles.tip, { color: '#c4b5fd' }]}>• {tip}</Text>
          ))}
        </View>

      </ScrollView>

      {/* ── Bip type menu ── */}
      {showBipMenu && (
        <View style={styles.overlayWrap}>
          <TouchableOpacity style={styles.overlayBackdrop} onPress={() => setShowBipMenu(false)} />
          <View style={[styles.bipMenuCard, { backgroundColor: 'rgba(13,9,20,0.97)', borderColor: theme.accent }]}>
            <Text style={[styles.bipMenuTitle, { color: theme.soft }]}>What kind of Bip? 💜</Text>
            <Text style={[styles.bipMenuSub, { color: '#7c6899' }]}>Choose how you want to express right now</Text>
            {BIP_TYPES.map(bip => (
              <TouchableOpacity
                key={bip.id}
                style={[styles.bipTypeRow, { borderColor: theme.accent }]}
                onPress={() => {
                  setSelectedBipType(bip.id);
                  if (bip.id === 'text')       { setShowBipMenu(false); setScreen('pages'); }
                  else if (bip.id === 'cloud') { setShowBipMenu(false); setScreen('cloudThoughts'); }
                  else                         { setShowBipMenu(false); startRecording(); }
                }}
              >
                <Text style={styles.bipTypeEmoji}>{bip.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bipTypeLabel, { color: '#fff' }]}>{bip.label}</Text>
                  <Text style={[styles.bipTypeSub, { color: '#7c6899' }]}>{bip.sub}</Text>
                </View>
                <Text style={{ color: theme.soft, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Archive overlay ── */}
      {showArchive && (
        <View style={styles.overlayWrap}>
          <TouchableOpacity style={styles.overlayBackdrop} onPress={() => setShowArchive(false)} />
          <View style={[styles.archiveCard, { backgroundColor: 'rgba(13,9,20,0.97)', borderColor: theme.accent }]}>
            <Text style={[styles.bipMenuTitle, { color: theme.soft }]}>
              {characterName}'s journal 📖
            </Text>

            {voiceNotes.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Image source={CLOUD_HP} style={{ width: 48, height: 48, marginBottom: 10 }} resizeMode="contain" />
                <Text style={[styles.emptyText, { color: '#7c6899' }]}>No bips yet. Your first one is waiting. 🎙️</Text>
              </View>
            ) : (
              <>
                {voiceNotes.slice(0, 6).map(n => (
                  <View key={n.id} style={[styles.noteRow, { borderBottomColor: 'rgba(167,114,192,0.15)' }]}>
                    <View style={[styles.noteIcon, { backgroundColor: 'rgba(124,58,237,0.3)' }]}>
                      <Text style={{ fontSize: 14 }}>
                        {n.type === 'video' ? '📹' : n.type === 'text' ? '✍️' : n.type === 'cloud' ? '☁️' : '🎙️'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.noteTitle, { color: '#fff' }]}>{n.title}</Text>
                      <Text style={[styles.noteMeta, { color: '#7c6899' }]}>{n.date} · {n.duration}</Text>
                    </View>
                    <TouchableOpacity style={[styles.playBtn, { backgroundColor: 'rgba(124,58,237,0.25)' }]}>
                      <Text style={[styles.playBtnText, { color: '#c4b5fd' }]}>▶</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Fix D1: show count + link to full journal if more than 6 */}
                {voiceNotes.length > 6 && (
                  <TouchableOpacity
                    style={{ alignItems: 'center', paddingTop: 10 }}
                    onPress={() => { setShowArchive(false); setScreen('pages'); }}
                  >
                    <Text style={{ color: theme.soft, fontSize: 12, fontWeight: '600' }}>
                      +{voiceNotes.length - 6} more → open journal
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity style={{ alignItems: 'center', paddingTop: 12 }} onPress={() => setShowArchive(false)}>
              <Text style={{ color: '#7c6899', fontSize: 13 }}>close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1 },
  scroll:             { paddingBottom: 100 },
  roomWrap:           { position: 'relative', width: '100%', height: 340, marginBottom: 16, overflow: 'hidden' },
  roomImage:          { width: '100%', height: '100%' },
  // Fix B3: hero avatar sits in lower-center of room image
  heroAvatar:         { position: 'absolute', bottom: 0, alignSelf: 'center', width: '70%', height: '90%' },
  recordingOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(124,58,237,0.25)' },
  timeBadge:          { position: 'absolute', top: 10, left: 12, backgroundColor: 'rgba(13,9,20,0.65)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  timeBadgeText:      { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
  listeningBadge:     { position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' },
  listeningBadgeText: { color: '#f5f0ff', fontSize: 14, fontWeight: '800', backgroundColor: 'rgba(124,58,237,0.7)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  hotspot:            { position: 'absolute' },
  hotspotDebug:       { borderWidth: 2, borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.18)' },
  debugLabel:         { color: '#f472b6', fontSize: 9, fontWeight: '900', padding: 2 },
  hint:               { position: 'absolute', backgroundColor: 'rgba(13,9,20,0.65)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  hintText:           { color: '#c4b5fd', fontSize: 10, fontWeight: '600' },

  // Recording card
  recordingCard:      { marginHorizontal: 16, marginBottom: 12, borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center' },
  pulseRing:          { width: 80, height: 80, borderRadius: 40, borderWidth: 3, position: 'absolute', top: 14 },
  recordingLabel:     { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6, marginTop: 8 },
  recordingTimer:     { color: '#a855f7', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  waveform:           { flexDirection: 'row', alignItems: 'center', gap: 3, height: 44, marginBottom: 20 },
  waveBar:            { width: 4, borderRadius: 2 },
  stopBtn:            { backgroundColor: '#ef4444', borderRadius: 18, paddingHorizontal: 24, paddingVertical: 12 },
  stopBtnText:        { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Float cards
  floatCard:          { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, borderWidth: 1, padding: 16 },
  savedLabel:         { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  thinkingText:       { fontSize: 13, fontStyle: 'italic' },
  replyLabel:         { fontSize: 10, marginBottom: 6 },
  replyText:          { fontSize: 13, lineHeight: 20 },
  cardTitle:          { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  tip:                { fontSize: 13, marginBottom: 8, lineHeight: 20 },

  // Bip menu overlay
  overlayWrap:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  overlayBackdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  bipMenuCard:        { margin: 16, borderRadius: 28, borderWidth: 1, padding: 24, zIndex: 10 },
  bipMenuTitle:       { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  bipMenuSub:         { fontSize: 12, marginBottom: 20 },
  bipTypeRow:         { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  bipTypeEmoji:       { fontSize: 26 },
  bipTypeLabel:       { fontSize: 15, fontWeight: '700' },
  bipTypeSub:         { fontSize: 11, marginTop: 2 },

  // Archive overlay
  archiveCard:        { margin: 16, borderRadius: 28, borderWidth: 1, padding: 24, zIndex: 10, maxHeight: '70%' },
  noteRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  noteIcon:           { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  noteTitle:          { fontWeight: '600', fontSize: 13 },
  noteMeta:           { fontSize: 11 },
  playBtn:            { borderRadius: 10, padding: 8 },
  playBtnText:        { fontSize: 14 },
  emptyText:          { fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
});
