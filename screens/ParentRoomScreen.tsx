// screens/ParentRoomScreen.tsx
//
// The room IS the interface. No cards. No grids. No dashboard.
//
// Room art fills the screen. Se'kret presence floats inside it.
// Tappable objects live where the objects are in the room.
// A soft mood check-in sits at the bottom — 4 options only.
// Nothing demands. The room waits.

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Text, View, TouchableOpacity, Image,
  ImageBackground, Animated, StyleSheet,
  Platform, Dimensions, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGES, getParentRoomBg } from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');
const NAV_H = Platform.OS === 'ios' ? 84 : 64;
const TOP   = Platform.OS === 'ios' ? 56 : 36;

// ─── Types ───────────────────────────────────────────────────────────────────
export type ParentRoomStyle = 'mom' | 'dad';

// ─── Overlay: dark vignette top + bottom, clear in the middle ─────────────────
const OVERLAY: Record<ParentRoomStyle, [string, string, string, string]> = {
  mom: ['rgba(30,8,58,0.68)', 'rgba(20,4,40,0.06)', 'rgba(20,4,40,0.04)', 'rgba(12,2,30,0.82)'],
  dad: ['rgba(4,7,22,0.70)',  'rgba(2,5,14,0.06)',  'rgba(2,5,14,0.04)', 'rgba(2,4,12,0.84)'],
};

// ─── Color tokens per room style ──────────────────────────────────────────────
const T: Record<ParentRoomStyle, { accent: string; soft: string; sub: string }> = {
  mom: { accent: '#c088d4', soft: '#f5eeff', sub: '#c8a8e8' },
  dad: { accent: '#5a9ad8', soft: '#d8eeff', sub: '#88b4d8' },
};

// ─── 4 moods only — no homework ──────────────────────────────────────────────
const MOODS = [
  { id: 'heavy',   emoji: '😩', label: 'Heavy' },
  { id: 'hopeful', emoji: '💜', label: 'Hopeful' },
  { id: 'worried', emoji: '😔', label: 'Worried' },
  { id: 'okay',    emoji: '😌', label: 'Okay' },
];

// ─── Ambient presence — not notifications, just voice in the room ─────────────
const PRESENCE = [
  "take a breath. we're solving a Tuesday problem.",
  "that kid still loves you. y'all just speaking different languages today.",
  "you don't gotta have every answer tonight.",
  "you showed up today. that counts.",
  "being present IS the plan.",
  "one rough conversation doesn't erase years of showing up.",
  "you can't pour from an empty cup. that's not selfish. that's math.",
  "small steps. big impact.",
  "the relationship matters more than being right tonight.",
  "progress over perfection. always.",
];

// ─── Room hotspots — positioned over where the objects actually are ───────────
// Fractions of W × H, approximated from the room art layout:
//   journal on coffee table (center-low), mug left of table,
//   cloud neon on bookshelf (center-mid), laptop/bridge desk (right),
//   cork board (right-upper), memory shelf (left-mid)
const HOTSPOTS = [
  { icon: '📔', label: 'Pages',      route: 'pages',        xf: 0.42, yf: 0.58, delay: 0   },
  { icon: '☕', label: 'Reflection', route: 'sekret',       xf: 0.20, yf: 0.65, delay: 350 },
  { icon: '🌉', label: 'Bridge',     route: 'parentBridge', xf: 0.74, yf: 0.52, delay: 600 },
  { icon: '🌐', label: 'Circle',     route: 'circle',       xf: 0.83, yf: 0.38, delay: 900 },
  { icon: '🏆', label: 'Wins',       route: 'growth',       xf: 0.13, yf: 0.47, delay: 450 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTimeSlot(weatherMode?: string) {
  if (weatherMode === 'rain') return 'rain';
  const h = new Date().getHours();
  if (h >= 5  && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  if (h >= 21 || h < 1)  return 'night';
  return 'deepNight';
}

function getGreeting(style: ParentRoomStyle, slot: string) {
  if (slot === 'day')       return style === 'mom' ? "hey, mama. how's the day?" : "hey, dad. how's the day?";
  if (slot === 'evening')   return "you made it through. breathe.";
  if (slot === 'night')     return "still up? sit down for a sec.";
  if (slot === 'deepNight') return "put it down for tonight.";
  if (slot === 'rain')      return "it's a quiet one. take it.";
  return style === 'mom' ? "good morning, mama." : "good morning, dad.";
}

// ─── Room Hotspot ─────────────────────────────────────────────────────────────
interface HotspotProps {
  icon: string; label: string; route: string;
  xf: number; yf: number; delay: number;
  accent: string; visible: boolean; onPress: () => void;
}

function RoomHotspot({ icon, label, xf, yf, delay, accent, visible, onPress }: HotspotProps) {
  const appear = useRef(new Animated.Value(0)).current;
  const glow   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(appear, { toValue: 1, duration: 450, delay, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    }, delay + 200);
    return () => clearTimeout(timer);
  }, [visible]);

  const scale   = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.60, 1.0] });

  return (
    <Animated.View style={[s.hotspot, { left: W * xf - 22, top: H * yf - 22, opacity: appear }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Animated.View style={[
          s.hotspotRing,
          { borderColor: accent + 'cc', shadowColor: accent, transform: [{ scale }], opacity },
        ]}>
          <Text style={s.hotspotIcon}>{icon}</Text>
        </Animated.View>
        <Text style={s.hotspotLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── ParentRoomScreen ─────────────────────────────────────────────────────────
interface ParentRoomScreenProps {
  parentRoomStyle: ParentRoomStyle;
  parentMood:      string;
  setParentMood:   (m: string) => void;
  setScreen:       (s: string) => void;
  weatherMode?:    string;
  BottomNav:       React.ReactNode;
}

export function ParentRoomScreen({
  parentRoomStyle, parentMood, setParentMood,
  setScreen, weatherMode, BottomNav,
}: ParentRoomScreenProps) {

  const slot    = useMemo(() => getTimeSlot(weatherMode), [weatherMode]);
  const tokens  = T[parentRoomStyle];
  const roomBg  = getParentRoomBg(parentRoomStyle, weatherMode);
  const overlay = OVERLAY[parentRoomStyle];
  const greeting = getGreeting(parentRoomStyle, slot);

  const [presenceIdx,    setPresenceIdx]    = useState(() => Math.floor(Math.random() * PRESENCE.length));
  const [hotspotsReady,  setHotspotsReady]  = useState(false);

  const roomFade    = useRef(new Animated.Value(0)).current;
  const textFade    = useRef(new Animated.Value(0)).current;
  const cloudBreath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Room fades in first, then text, then hotspots unlock
    Animated.sequence([
      Animated.timing(roomFade, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(textFade, { toValue: 1, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => setHotspotsReady(true));

    const loop = Animated.loop(Animated.sequence([
      Animated.timing(cloudBreath, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(cloudBreath, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const cloudScale   = cloudBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const cloudOpacity = cloudBreath.interpolate({ inputRange: [0, 1], outputRange: [0.80, 1.0] });

  return (
    <View style={s.root}>

      {/* ── ROOM ART ─────────────────────────────────────────────────────── */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: roomFade }]}>
        <ImageBackground source={roomBg} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Animated.View>

      {/* ── READABILITY VIGNETTE: dark top/bottom, clear middle ──────────── */}
      <LinearGradient
        colors={overlay}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.28, 0.65, 1.0]}
      />

      {/* ── GREETING + PRESENCE — floating text, no borders, no cards ────── */}
      <Animated.View style={[s.topText, { opacity: textFade }]}>
        <Text style={s.greeting}>{greeting}</Text>
        <TouchableOpacity
          onPress={() => setPresenceIdx(i => (i + 1) % PRESENCE.length)}
          activeOpacity={0.75}
        >
          <Text style={[s.presence, { color: tokens.soft }]}>
            "{PRESENCE[presenceIdx]}"
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── SE'KRET CLOUD — living in the room, not in a card ────────────── */}
      <Animated.View style={[
        s.cloudInRoom,
        { left: W * 0.50 - 28, top: H * 0.33 },
        { transform: [{ scale: cloudScale }], opacity: cloudOpacity },
      ]}>
        <TouchableOpacity onPress={() => setScreen('parentBridge')} activeOpacity={0.75}>
          <Image source={IMAGES.cloudHeadphones} style={s.cloudImg} resizeMode="contain" />
          <Text style={[s.cloudLabel, { color: tokens.accent }]}>se'kret</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── ROOM HOTSPOTS — objects in the room, not menu items ──────────── */}
      {HOTSPOTS.map(h => (
        <RoomHotspot
          key={h.label}
          {...h}
          accent={tokens.accent}
          visible={hotspotsReady}
          onPress={() => setScreen(h.route)}
        />
      ))}

      {/* ── MOOD CHECK-IN — soft, at the bottom, 4 options only ──────────── */}
      <Animated.View style={[s.bottomStrip, { opacity: textFade }]}>
        <Text style={[s.moodAsk, { color: tokens.sub }]}>how you holding up?</Text>
        <View style={s.moodRow}>
          {MOODS.map(m => {
            const active = parentMood === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  s.moodChip,
                  {
                    backgroundColor: active ? tokens.accent + '44' : 'rgba(0,0,0,0.32)',
                    borderColor:     active ? tokens.accent : tokens.accent + '55',
                  },
                ]}
                onPress={() => setParentMood(m.id)}
                activeOpacity={0.7}
              >
                <Text style={s.moodEmoji}>{m.emoji}</Text>
                <Text style={[s.moodLabel, { color: active ? tokens.accent : tokens.sub }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {BottomNav}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#06030f' },

  // Top floating text — no borders, just shadows for readability
  topText: {
    position: 'absolute',
    top: TOP,
    left: 20,
    right: 20,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  presence: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 21,
    textShadowColor: 'rgba(0,0,0,0.90)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },

  // Cloud inside the room
  cloudInRoom: { position: 'absolute', alignItems: 'center' },
  cloudImg:    { width: 56, height: 56 },
  cloudLabel:  {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  // Hotspots
  hotspot:     { position: 'absolute', alignItems: 'center' },
  hotspotRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    shadowOpacity: 0.70,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  hotspotIcon:  { fontSize: 19 },
  hotspotLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.90)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  // Bottom mood strip
  bottomStrip: {
    position: 'absolute',
    bottom: NAV_H + 10,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  moodAsk:   {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 9,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.80)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  moodRow:   { flexDirection: 'row', gap: 8 },
  moodChip:  {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 7,
    alignItems: 'center',
  },
  moodEmoji: { fontSize: 17, marginBottom: 2 },
  moodLabel: { fontSize: 10, fontWeight: '600' },
});
