// app/(teen)/sekret.tsx
// Entry point for the teen's safe space.
//
// Background: uses the same getRoomBg() + getRoomPhase() system as companion-chat.tsx
// and room.tsx so the teen always feels like they are inside their companion's world,
// not looking at a generic splash screen.
//
// The companion picker overlay is a full-screen dark sheet layered on top.

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { PERSONALITY_CONFIG } from '@/services/ai';
import { TEEN_ROUTES } from '@/teen/routes';
import { useAppContext } from '@/context/AppContext';
import {
  getRoomBg,
  getRoomPhase,
  normalizeCharacterKey,
} from '@/constants/theme';
import type { PersonalityId } from '@/types';

const PERSONALITY_ORDER: PersonalityId[] = ['raylene', 'rylane', 'cloud', 'night', 'oracle'];

const TEEN_SHORTCUTS = [
  { label: 'Write It Out', emoji: '✏️', route: TEEN_ROUTES.pages    },
  { label: 'Voice Bip',   emoji: '🎙️', route: TEEN_ROUTES.voiceBip },
  { label: 'Calm Me',     emoji: '☁️', route: TEEN_ROUTES.calm      },
  { label: 'Circle',      emoji: '👥', route: TEEN_ROUTES.circle     },
] as const;

export default function TeenSekretRoute() {
  const { selectedSekret } = useAppContext();

  // ── Room background — same resolution logic as companion-chat.tsx & room.tsx ──
  const charKey = useMemo(
    () => normalizeCharacterKey(selectedSekret ?? 'raylene'),
    [selectedSekret],
  );
  const roomPhase = useMemo(() => getRoomPhase(), []);
  const bgSource  = useMemo(() => getRoomBg(charKey, roomPhase), [charKey, roomPhase]);

  // ── Picker overlay state ───────────────────────────────────────────────────────
  const [pickerVisible, setPickerVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  function openPicker() {
    setPickerVisible(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }

  function closePicker() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
      setPickerVisible(false),
    );
  }

  function handleCompanionSelect(id: PersonalityId) {
    closePicker();
    // Always route to the canonical companion-chat screen.
    // 'oracle' maps to 'sekret' inside companionEngine's CompanionId union.
    router.push({
      pathname: '/(teen)/companion-chat',
      params: { companion: id === 'oracle' ? 'sekret' : id },
    } as any);
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Room background — same world as companion-chat.tsx ── */}
      <ImageBackground source={bgSource} style={StyleSheet.absoluteFill} resizeMode="cover">
        <LinearGradient
          colors={['rgba(20,10,40,0.30)', 'rgba(10,5,25,0.82)']}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      {/* ── Main HUD ── */}
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={s.flex}>

          {/* Spacer pushes CTA toward bottom */}
          <View style={s.spacer} />

          {/* CTA block */}
          <View style={s.ctaBlock}>
            <Text style={s.ctaLabel}>Press Se'kret Bip</Text>
            <Text style={s.ctaSub}>to enter your safe space</Text>
            <TouchableOpacity style={s.ctaButton} onPress={openPicker} activeOpacity={0.85}>
              <Text style={s.ctaButtonText}>Se'kret Bip 🩷</Text>
            </TouchableOpacity>
          </View>

          {/* Shortcut bar — glassmorphic over the room bg */}
          <View style={s.shortcutBar}>
            {TEEN_SHORTCUTS.map(item => (
              <TouchableOpacity
                key={item.label}
                style={s.shortcutItem}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                <Text style={s.shortcutEmoji}>{item.emoji}</Text>
                <Text style={s.shortcutLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.tagline}>your space. your voice. always you. 🩷</Text>
        </View>
      </SafeAreaView>

      {/* ── Companion picker overlay ── */}
      {pickerVisible && (
        <Animated.View style={[s.pickerOverlay, { opacity: fadeAnim }]}>
          <SafeAreaView style={s.pickerSafe} edges={['top', 'left', 'right', 'bottom']}>
            <ScrollView
              contentContainerStyle={s.pickerContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={s.pickerHeader}>
                <Text style={s.pickerHeading}>Se'kret 💜</Text>
                <TouchableOpacity onPress={closePicker} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={s.pickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.pickerSub}>Choose who you want to talk to.</Text>

              {PERSONALITY_ORDER.map(id => {
                const p = PERSONALITY_CONFIG[id];
                return (
                  <TouchableOpacity
                    key={id}
                    style={[s.card, { borderColor: p.accentColor + '40' }]}
                    onPress={() => handleCompanionSelect(id)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.emoji}>{p.emoji}</Text>
                    <View style={s.cardBody}>
                      <Text style={[s.name, { color: p.accentColor }]}>{p.name}</Text>
                      <Text style={s.title}>{p.title}</Text>
                      <Text style={s.vibe}>{p.vibe}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0015' },

  safe:    { flex: 1 },
  flex:    { flex: 1, justifyContent: 'flex-end' },
  spacer:  { flex: 1 },

  // ── CTA ──────────────────────────────────────────────────────────────────────
  ctaBlock: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  ctaLabel: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  ctaSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginBottom: 18,
    textAlign: 'center',
  },
  ctaButton: {
    borderWidth: 2,
    borderColor: '#f040b0',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 48,
    backgroundColor: 'rgba(240,64,176,0.15)',
    shadowColor: '#f040b0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  ctaButtonText: {
    color: '#f9a8d4',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Shortcut bar — glass layer over room bg ───────────────────────────────────
  shortcutBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(10,0,20,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shortcutItem:  { alignItems: 'center', flex: 1 },
  shortcutEmoji: { fontSize: 22, marginBottom: 5 },
  shortcutLabel: {
    color: '#f9a8d4',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  tagline: {
    color: '#c084fc',
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 10,
  },

  // ── Picker overlay ─────────────────────────────────────────────────────────────
  pickerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0d0015',
    zIndex: 10,
  },
  pickerSafe:    { flex: 1 },
  pickerContent: { padding: 24, paddingTop: 16, paddingBottom: 48 },
  pickerHeader:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickerHeading: { color: '#fff', fontSize: 24, fontWeight: '800' },
  pickerClose:   { color: '#888', fontSize: 20, padding: 4 },
  pickerSub:     { color: '#666', fontSize: 14, marginBottom: 28 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  emoji:    { fontSize: 32, marginTop: 2, marginRight: 14 },
  cardBody: { flex: 1 },
  name:     { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  title:    { color: '#888', fontSize: 12, marginBottom: 6 },
  vibe:     { color: '#555', fontSize: 13, lineHeight: 18 },
});
