// screens/VoiceBipScreen.tsx
// Se'kret Bip — Voice Bip (Headphone Cloud)
// Vision: Speak it out loud. Cloud floats here. Listening without judgment.
// Cousin energy, soft purple night. The mic is a release valve, not a stage.
//
// Polish pass (2026-06-07):
//   - Time-of-day backdrop via getRoomBg(character, time) — 4 phases
//   - Real LinearGradient scrim (top + bottom fade)
//   - Cloud companion drifts above the room with breath loop
//   - Character-aware copy: Raylene soft / Rylane direct / Cloud quiet
//   - Tips list adapts per companion
//   - Listening pill mirrors JournalScreen pattern (breath loop)
//   - Sticky-note hint ("tap the mic") with -2deg tilt
//   - Reply card credits the active avatar registry identity
//   - VoiceNote type properly imported
//   - Curly quotes throughout
//
// Previous fixes preserved: A1 (onSave), A4 (char-aware badge), B1 (box-none),
// B2 (none on hint), B3 (heroArt overlay), D1 (archive count + link)
//
// 2026-07-11 patch:
//   - Replaced FileReader (Web-only) with uriToBase64 from utils/audioBase64
//     FileReader is undefined in Hermes/JSC — transcription was silently
//     failing on every device, falling through to the vibe-fallback reply.
//   - recordingTimeRef added: stopRecording now reads from a ref instead of
//     the render-cycle closure so duration is never stale / "0:00".

import React, { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGES, getRoomPhase, getRoomScene, type TimeOfDay } from '../constants/theme';
import { AmbientWeatherOverlay } from '../components/AmbientWeatherOverlay';
import {
  VOICE_BIP_AVATARS,
  VOICE_BIP_AVATAR_KEYS,
  normalizeVoiceBipAvatar,
  type VoiceBipAvatarKey,
} from '../constants/voiceBip';
import { useVoiceCompanion } from '../hooks/useVoiceCompanion';
import { SyncBadge, type SyncStatus } from '../components/SyncBadge';
import type { VoiceNote } from '../types/bridge';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { fetchSekretReply, fetchSekretVoice, fetchSekretTranscribe } from '../utils/api';
import { uriToBase64, recordingContentType } from '../utils/audioBase64';
import { useVoiceBipIntelligence } from '../hooks/useVoiceBipIntelligence';
import type { OracleJournalEntry } from '../types/voiceIntelligence';
import type { OracleProfile, OracleSide } from '../services/oracleDiscovery';
import {
  Text, TouchableOpacity, ScrollView, View,
  Animated, Image, StyleSheet, Easing,
  type DimensionValue, Platform,
} from 'react-native';
import { PresenceAvatar } from '../components/PresenceAvatar';
import { usePresence } from '../hooks/usePresence';
import {
  getPresenceTime,
  PRESENCE_TIME_BADGE,
} from '../constants/presence/timeOfDay';
import { toPresenceCharacter } from '../constants/presence/avatarStates';

// ── DEBUG ──────────────────────────────────────────────────────────────────
const DEBUG_HOTSPOTS = false;

// ── ASSETS ─────────────────────────────────────────────────────────────────
const CLOUD_HP = IMAGES.cloudHeadphones;

// ── HOTSPOTS ───────────────────────────────────────────────────────────────
type Hotspot = {
  top?: DimensionValue; bottom?: DimensionValue;
  left?: DimensionValue; right?: DimensionValue;
  width: DimensionValue; height: DimensionValue;
  label: string;
};
const HOTSPOTS: Record<'microphone' | 'journal' | 'window' | 'crystalJar', Hotspot> = {
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

// ── TIME OF DAY ────────────────────────────────────────────────────────────
function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5  && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const TIME_BADGE: Record<TimeOfDay, string> = {
  morning: '☀️ morning',
  day:     '🌤️ day',
  evening: '🌆 evening',
  night:   '🌙 night',
};

// ── Props ──────────────────────────────────────────────────────────────────
interface VoiceBipScreenProps {
  theme:          Record<string, any>;
  setScreen:      (screen: string) => void;
  selectedSekret: string;
  onSelectAvatar?: (avatarKey: VoiceBipAvatarKey) => void;
  weatherMode?: string;
  voiceNotes:     VoiceNote[];
  setVoiceNotes:  (notes: VoiceNote[] | ((prev: VoiceNote[]) => VoiceNote[])) => void;
  onSave?:        (note: VoiceNote) => void;
  mood?:          string;
  companion?:     {
    presenceMessage: string;
  };
  BottomNav: React.ReactNode;
  privateProfile?: OracleProfile;
  profileSide?: OracleSide;
  oracleJournalEntries?: readonly OracleJournalEntry[];
  onStoreOracleMemory?: (entry: OracleJournalEntry) => void;
  syncStatus?: SyncStatus;
}

// ── COMPONENT ──────────────────────────────────────────────────────────────
export function VoiceBipScreen({
  theme, setScreen, selectedSekret, onSelectAvatar, weatherMode, voiceNotes, setVoiceNotes, onSave, mood, companion, BottomNav, privateProfile, profileSide = 'teen',
  oracleJournalEntries, onStoreOracleMemory, syncStatus,
}: VoiceBipScreenProps) {

  const voiceHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const [showBipMenu,      setShowBipMenu]      = useState(false);
  const [showArchive,      setShowArchive]       = useState(false);
  const [voicePromptIdx,   setVoicePromptIdx]    = useState(0);
  const [isRecording,      setIsRecording]       = useState(false);
  const [isRecordingStarting, setIsRecordingStarting] = useState(false);
  const [recorded,         setRecorded]          = useState(false);
  const [sekretReply,      setSekretReply]       = useState('');
  const [replyAudioUri,    setReplyAudioUri]     = useState('');
  const [isVoiceLoading,   setIsVoiceLoading]    = useState(false);
  const [isThinking,       setIsThinking]        = useState(false);
  const [recordingTime,    setRecordingTime]     = useState(0);
  const [selectedBipType,  setSelectedBipType]   = useState<string | null>(null);
  const [transcriptFailed, setTranscriptFailed]  = useState(false);

  const recordingRef      = useRef<Audio.Recording | null>(null);
  // ↓ ref mirrors recordingTime so stopRecording never captures a stale closure
  const recordingTimeRef  = useRef(0);
  const stopRecordingRef  = useRef<() => Promise<void>>(async () => {});

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<any>(null);
  const glowLoop  = useRef<any>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cloud drift + breath
  const cloudFloat = useRef(new Animated.Value(0)).current;
  const cloudBreath = useRef(new Animated.Value(0)).current;
  // Listening pill breath
  const pillBreath = useRef(new Animated.Value(0)).current;

  // Waveform — 12 bars
  const waveAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0.3))
  ).current;
  const waveLoop = useRef<any>(null);

  // Avatar identity and room phase come from normalized registries. Oracle
  // context can inform replies, but no Oracle identity is exposed in this UI.
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = getTimeOfDay(hour);
  const roomPhase = getRoomPhase(now, weatherMode);
  const isNight = roomPhase === 'night' || roomPhase === 'deepNight';
  const avatarKey = normalizeVoiceBipAvatar(selectedSekret);
  const avatar = VOICE_BIP_AVATARS[avatarKey];
  const presenceCharacter = toPresenceCharacter(avatarKey);
  const presenceTime = getPresenceTime(hour, { isRaining: weatherMode === 'rain' });
  const presence = usePresence({ character: presenceCharacter, time: presenceTime });
  const roomArt = getRoomScene(avatarKey, roomPhase);
  const heroArt = isNight ? avatar.heroArt.night : avatar.heroArt.day;
  const { prepareVoiceSession } = useVoiceCompanion({
    avatarKey,
    personality: avatar.personality,
    mood: mood || 'calm',
    voiceId: avatar.voiceId,
  });
  const { prepareIntelligence } = useVoiceBipIntelligence({
    avatarKey,
    side: profileSide,
    mood,
    privateProfile,
    oracleJournalEntries,
    onStoreOracleMemory,
  });

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Cloud drift + breath ────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudFloat, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(cloudFloat, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudBreath, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(cloudBreath, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pillBreath, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pillBreath, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [cloudBreath, cloudFloat, pillBreath]);

  const cloudStyle = {
    transform: [
      { translateX: cloudFloat.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] }) },
      { translateY: cloudFloat.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }) },
      { scale:      cloudBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
    ],
    opacity: cloudBreath.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }),
  };
  const pillStyle = {
    opacity: pillBreath.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
    transform: [{ scale: pillBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
  };

  const startRecording = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;

    setIsRecordingStarting(true);
    setIsRecording(true);
    setRecorded(false);
    setSekretReply('');
    setReplyAudioUri('');
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    setTranscriptFailed(false);
    setShowBipMenu(false);
    prepareVoiceSession('voice');
    presence.beginListening();

    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();

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
      setRecordingTime(t => {
        const next = t + 1;
        recordingTimeRef.current = next;
        return next;
      });
    }, 1000);

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = recording;
    setIsRecordingStarting(false);
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

    // Stop the real recording and transcribe
    let transcript: string | null = null;
    const recording = recordingRef.current;
    recordingRef.current = null;
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // Android E_AUDIO_NODATA: Stop tapped before any audio data was captured
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      if (uri) {
        try {
          // uriToBase64 uses expo-file-system — safe in Hermes/JSC (no FileReader)
          const base64 = await uriToBase64(uri);
          const contentType = recordingContentType();
          transcript = await fetchSekretTranscribe({ audioBase64: base64, contentType });
        } catch {
          setTranscriptFailed(true);
        }
      }
    }

    const noteId = Date.now();
    const intelligence = prepareIntelligence(noteId, transcript);
    const note: VoiceNote = {
      id: noteId,
      title: selectedBipType ? `${selectedBipType} Bip` : 'Voice Bip',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      // Read from ref — never stale regardless of when this closure was created
      duration: formatTime(recordingTimeRef.current),
      type: (selectedBipType || 'voice') as VoiceNote['type'],
      avatarKey,
      transcriptId: intelligence.transcript.id,
    };

    (onSave ?? ((n: VoiceNote) => setVoiceNotes(prev => [n, ...prev])))(note);

    setIsThinking(true);
    presence.endListening();
    const replyText = transcript ?? 'I needed to get some feelings out.';
    const previousVoiceHistory = voiceHistoryRef.current.slice();
    const reply = await fetchSekretReply(
      replyText,
      'voiceBip',
      mood,
      avatarKey,
      undefined,
      privateProfile,
      profileSide,
      previousVoiceHistory,
    );
    voiceHistoryRef.current = [
      ...previousVoiceHistory,
      { role: 'user' as const, content: replyText },
      { role: 'assistant' as const, content: reply },
    ].slice(-20);
    setSekretReply(reply);
    setIsVoiceLoading(true);
    const audio = await fetchSekretVoice({ reply, characterId: avatarKey });
    if (audio) setReplyAudioUri(`data:${audio.contentType};base64,${audio.audioBase64}`);
    setIsVoiceLoading(false);
    setIsThinking(false);
    presence.markResponseReady();
    setSelectedBipType(null);
  };

  stopRecordingRef.current = stopRecording;

  useEffect(() => {
    if (!isRecording) return;
    if (recordingTime >= 300) {
      stopRecordingRef.current();
    }
  }, [recordingTime, isRecording]);

  const startVideoRecording = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setSelectedBipType(null);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) {
      setSelectedBipType(null);
      return;
    }
    const asset = result.assets[0];
    const secs = typeof asset.duration === 'number' ? Math.floor(asset.duration) : 0;
    const note: VoiceNote = {
      id: Date.now(),
      title: 'Video Bip',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`,
      type: 'video',
      avatarKey,
      videoUri: asset.uri,
    };
    (onSave ?? ((n: VoiceNote) => setVoiceNotes(prev => [n, ...prev])))(note);
    setRecorded(true);
    setSelectedBipType(null);
  };

  useEffect(() => {
    return () => {
      pulseLoop.current?.stop();
      glowLoop.current?.stop();
      waveLoop.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => null);
    };
  }, []);


  const playReplyAudio = async () => {
    if (!replyAudioUri) return;
    const { sound } = await Audio.Sound.createAsync({ uri: replyAudioUri });
    await sound.playAsync();
  };

  const prompts = avatar.prompts;
  const prompt = prompts[voicePromptIdx % prompts.length];
  const selectAvatar = (nextAvatarKey: VoiceBipAvatarKey) => {
    setVoicePromptIdx(0);
    setSekretReply('');
    setRecorded(false);
    voiceHistoryRef.current = [];
    onSelectAvatar?.(nextAvatarKey);
  };

  return (
    <View style={[styles.root, { backgroundColor: '#0d0914' }]}>
      <AmbientWeatherOverlay />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar Voice Bip — each companion keeps an independent identity. */}
        <View style={styles.avatarSelector}>
          {VOICE_BIP_AVATAR_KEYS.map(key => {
            const option = VOICE_BIP_AVATARS[key];
            const active = key === avatarKey;
            return (
              <TouchableOpacity
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => selectAvatar(key)}
                style={[
                  styles.avatarOption,
                  active && { borderColor: option.accent, backgroundColor: `${option.accent}24` },
                ]}
              >
                <Text style={styles.avatarOptionEmoji}>{option.emoji}</Text>
                <Text style={[styles.avatarOptionName, active && { color: option.accent }]}>{option.displayName}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.avatarIntro}>
          <Text style={[styles.avatarRole, { color: avatar.accent }]}>{avatar.role}</Text>
          <Text style={styles.avatarGreeting}>"{avatar.greeting}"</Text>
        </View>

        <SyncBadge status={syncStatus ?? 'idle'} />

        {/* ── Interactive Room ── */}
        <View style={styles.roomWrap} pointerEvents="box-none">
          <Image source={roomArt} style={styles.roomImage} resizeMode="cover" blurRadius={1.2} />

          {/* Hero avatar — driven by the Voice Bip Presence System.
              Listens / thinks / responds / settles instead of sitting still. */}
          <PresenceAvatar
            character={presenceCharacter}
            time={presenceTime}
            state={presence.state}
            style={styles.heroAvatar}
          />

          {/* Top scrim */}
          <LinearGradient
            colors={['rgba(13,9,20,0.55)', 'transparent']}
            style={styles.topScrim}
            pointerEvents="none"
          />
          {/* Environmental character art */}
          <View pointerEvents="none" style={styles.environmentLayer}>
            {heroArt ? (
              <Image
                source={heroArt}
                style={styles.heroAvatar}
                resizeMode="contain"
              />
            ) : null}
            <LinearGradient
              colors={['rgba(13,9,20,0.55)', 'transparent']}
              style={styles.topScrim}
            />
          </View>
          {/* Bottom scrim */}
          <LinearGradient
            colors={['transparent', 'rgba(13,9,20,0.55)', 'rgba(13,9,20,0.95)']}
            style={styles.bottomScrim}
            pointerEvents="none"
          />

          {/* Cloud companion — drifts above */}
          <Animated.View style={[styles.cloudWrap, cloudStyle]} pointerEvents="none">
            <Image source={CLOUD_HP} style={styles.cloudImg} resizeMode="contain" />
          </Animated.View>

          {/* Purple recording overlay */}
          {isRecording && (
            <Animated.View
              style={[styles.recordingOverlay, { opacity: glowAnim }]}
              pointerEvents="none"
            />
          )}

          {/* Time badge — 6-phase via PresenceTime, with legacy fallback */}
          <View style={styles.timeBadge} pointerEvents="none">
            <Text style={styles.timeBadgeText}>{TIME_BADGE[timeOfDay]}</Text>
          </View>

          {/* Companion presence pill */}
          <Animated.View style={[styles.presencePill, pillStyle]} pointerEvents="none">
            <Text style={styles.presenceText}>
              {companion?.presenceMessage || avatar.presence}
            </Text>
          </Animated.View>

          {/* Listening badge — full character name, only while recording */}
          {isRecording && (
            <View style={styles.listeningBadge} pointerEvents="none">
              <Text style={styles.listeningBadgeText}>
                {avatar.listening}
              </Text>
            </View>
          )}

          {/* HOTSPOT — Microphone */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.hotspot,
              { top: HOTSPOTS.microphone.top as any, left: HOTSPOTS.microphone.left as any, width: HOTSPOTS.microphone.width as any, height: HOTSPOTS.microphone.height as any },
              DEBUG_HOTSPOTS && styles.hotspotDebug,
            ]}
            onPress={() => {
              if (isRecording && !isRecordingStarting) stopRecording();
              else if (!isRecording) setShowBipMenu(true);
            }}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.microphone.label}</Text>}
          </TouchableOpacity>

          {/* HOTSPOT — Journal */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.hotspot,
              { bottom: HOTSPOTS.journal.bottom as any, left: HOTSPOTS.journal.left as any, width: HOTSPOTS.journal.width as any, height: HOTSPOTS.journal.height as any },
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
              { top: HOTSPOTS.window.top as any, right: HOTSPOTS.window.right as any, width: HOTSPOTS.window.width as any, height: HOTSPOTS.window.height as any },
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
              { bottom: HOTSPOTS.crystalJar.bottom as any, right: HOTSPOTS.crystalJar.right as any, width: HOTSPOTS.crystalJar.width as any, height: HOTSPOTS.crystalJar.height as any },
              DEBUG_HOTSPOTS && styles.hotspotDebug,
            ]}
            onPress={() => setShowArchive(true)}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.crystalJar.label}</Text>}
          </TouchableOpacity>

          {/* Scrapbook sticky-note hint */}
          {!DEBUG_HOTSPOTS && !isRecording && (
            <View style={[styles.stickyHint, { top: '15%', left: '26%' }]} pointerEvents="none">
              <Text style={styles.stickyHintText}>tap the mic 🎙️</Text>
            </View>
          )}
        </View>

        {/* ── Recording state ── */}
        {isRecording && (
          <View style={[styles.recordingCard, { borderColor: '#a855f7', backgroundColor: 'rgba(13,9,20,0.92)', shadowColor: '#a855f7' }]}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], borderColor: '#a855f7' }]} />
            <Text style={styles.recordingLabel}>Recording… 🔴</Text>
            <Text style={styles.recordingTimer}>{formatTime(recordingTime)}</Text>
            {recordingTime >= 270 && (
              <Text style={styles.recordingWarn}>almost at limit — wrapping up soon</Text>
            )}
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
            <TouchableOpacity style={[styles.stopBtn, isRecordingStarting && { opacity: 0.4 }]} onPress={stopRecording} disabled={isRecordingStarting}>
              <Text style={styles.stopBtnText}>⏹ Stop</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Saved confirmation ── */}
        {recorded && !isRecording && (
          <View style={[styles.floatCard, { borderColor: theme.accent, backgroundColor: 'rgba(13,9,20,0.88)' }]}>
            <Text style={[styles.savedLabel, { color: theme.soft }]}>
              Saved to your journal {avatar.emoji}
            </Text>
          </View>
        )}

        {/* ── Transcript failed badge ── */}
        {recorded && transcriptFailed && !isThinking && (
          <View style={[styles.floatCard, { borderColor: '#f59e0b88', backgroundColor: 'rgba(13,9,20,0.88)' }]}>
            <Text style={{ fontSize: 13, color: '#fcd34d', fontStyle: 'italic', textAlign: 'center', lineHeight: 19 }}>
              couldn't catch that clearly — replied from the vibe anyway 💜
            </Text>
          </View>
        )}

        {/* ── Companion thinking ── */}
        {isThinking && (
          <View style={[styles.floatCard, { borderColor: theme.accent, backgroundColor: 'rgba(13,9,20,0.88)', flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <Image source={CLOUD_HP} style={{ width: 36, height: 36 }} resizeMode="contain" />
            <Text style={[styles.thinkingText, { color: theme.soft }]}>{avatar.listening}</Text>
          </View>
        )}

        {/* ── Reply ── */}
        {Boolean(sekretReply) && !isThinking && (
          <View style={[styles.floatCard, { borderColor: 'rgba(168,85,247,0.5)', backgroundColor: 'rgba(13,9,20,0.92)', shadowColor: '#a855f7' }]}>
            <Text style={[styles.replyLabel, { color: '#a855f7' }]}>{avatar.responseLabel}</Text>
            <Text style={[styles.replyText, { color: theme.soft }]}>{sekretReply}</Text>
            {isVoiceLoading ? (
              <Text style={[styles.voiceStatus, { color: theme.soft }]}>preparing voice…</Text>
            ) : replyAudioUri ? (
              <TouchableOpacity style={styles.voiceBtn} onPress={playReplyAudio}>
                <Text style={styles.voiceBtnText}>▶ hear this reply</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* ── Companion voice prompt ── */}
        {!isRecording && !sekretReply && (() => {
          const p = prompt;
          return (
            <View style={[styles.floatCard, { borderColor: `${avatar.accent}73`, backgroundColor: 'rgba(20,12,40,0.88)', shadowColor: avatar.accent }]}>
              <Text style={{ color: avatar.accent, fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>
                {avatar.displayName.toUpperCase()} · WHAT TO SAY
              </Text>
              <Text style={{ fontSize: 26, marginBottom: 8 }}>{p.emoji}</Text>
              <Text style={{ color: '#f5f0ff', fontSize: 15, fontWeight: '600', lineHeight: 23, marginBottom: 14 }}>
                {p.text}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{ borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 }}
                  onPress={() => setVoicePromptIdx(i => i + 1)}
                >
                  <Text style={{ color: '#c084fc', fontSize: 13 }}>next prompt ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

      </ScrollView>
      {BottomNav}
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1 },
  scrollView:        { flex: 1 },
  scroll:            { paddingBottom: 120 },
  avatarSelector:    { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 56, paddingHorizontal: 16 },
  avatarOption:      { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  avatarOptionEmoji: { fontSize: 22, marginBottom: 3 },
  avatarOptionName:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3 },
  avatarIntro:       { alignItems: 'center', paddingTop: 10, paddingBottom: 4, paddingHorizontal: 24 },
  avatarRole:        { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  avatarGreeting:    { fontSize: 14, color: 'rgba(245,240,255,0.72)', fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  roomWrap:          { marginHorizontal: 16, marginTop: 12, borderRadius: 20, overflow: 'hidden', aspectRatio: 0.85, position: 'relative' },
  roomImage:         { ...StyleSheet.absoluteFillObject },
  heroAvatar:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%' },
  environmentLayer:  { ...StyleSheet.absoluteFillObject },
  topScrim:          { position: 'absolute', top: 0, left: 0, right: 0, height: 90 },
  bottomScrim:       { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  cloudWrap:         { position: 'absolute', top: '6%', alignSelf: 'center' },
  cloudImg:          { width: 90, height: 60 },
  recordingOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(168,85,247,0.18)' },
  timeBadge:         { position: 'absolute', top: 10, left: 12, backgroundColor: 'rgba(13,9,20,0.55)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  timeBadgeText:     { color: 'rgba(245,240,255,0.75)', fontSize: 11, fontWeight: '600' },
  presencePill:      { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(13,9,20,0.62)', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 5 },
  presenceText:      { color: 'rgba(245,240,255,0.8)', fontSize: 12, fontStyle: 'italic' },
  listeningBadge:    { position: 'absolute', top: 10, right: 12, backgroundColor: 'rgba(168,85,247,0.28)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  listeningBadgeText:{ color: '#c084fc', fontSize: 11, fontWeight: '700' },
  hotspot:           { position: 'absolute' },
  hotspotDebug:      { backgroundColor: 'rgba(255,0,0,0.22)', borderWidth: 1, borderColor: 'red' },
  debugLabel:        { color: 'red', fontSize: 10, fontWeight: '700' },
  stickyHint:        { position: 'absolute', backgroundColor: '#fffde7', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, transform: [{ rotate: '-2deg' }], shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 1, height: 2 } },
  stickyHintText:    { color: '#5c4a1e', fontSize: 12, fontWeight: '700' },
  floatCard:         { marginHorizontal: 16, marginTop: 14, borderRadius: 18, borderWidth: 1, padding: 18, shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  recordingCard:     { marginHorizontal: 16, marginTop: 14, borderRadius: 18, borderWidth: 1.5, padding: 20, alignItems: 'center', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  pulseRing:         { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 2, opacity: 0.5 },
  recordingLabel:    { color: '#f5f0ff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  recordingTimer:    { color: '#c084fc', fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'], marginBottom: 8 },
  recordingWarn:     { color: '#fcd34d', fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
  waveform:          { flexDirection: 'row', alignItems: 'center', gap: 3, height: 40, marginBottom: 16 },
  waveBar:           { width: 4, borderRadius: 2 },
  stopBtn:           { backgroundColor: 'rgba(168,85,247,0.22)', borderWidth: 1, borderColor: '#a855f7', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 11 },
  stopBtnText:       { color: '#c084fc', fontSize: 15, fontWeight: '700' },
  savedLabel:        { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  thinkingText:      { fontSize: 14, fontStyle: 'italic', flex: 1 },
  replyLabel:        { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  replyText:         { fontSize: 15, lineHeight: 23 },
  voiceStatus:       { fontSize: 12, fontStyle: 'italic', marginTop: 10 },
  voiceBtn:          { marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(168,85,247,0.18)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  voiceBtnText:      { color: '#c084fc', fontSize: 13, fontWeight: '600' },
});
