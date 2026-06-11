// screens/SettingsScreen.tsx
// Se'kret Bip — Vibe Lab
// Choosing the emotional atmosphere of your room.

import React from 'react';
import {
  Text, TouchableOpacity, ScrollView, ImageBackground,
  View, Image, StyleSheet, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGES } from '../constants/theme';

const { width: W } = Dimensions.get('window');

// ── Vibe config — ties each theme key to room assets + color identity ────────

const VIBE_CONFIG: Record<string, {
  name: string; tagline: string; emoji: string;
  previewBg: any; glow: string; gtop: string; gbot: string;
}> = {
  raylene: {
    name: "Raylene's Room",  tagline: 'lavender · fairy lights · cozy bedroom',
    emoji: '💜', previewBg: IMAGES.bgRayleneRoomEvening,
    glow: '#e879f9', gtop: 'rgba(80,0,80,0.55)',  gbot: 'rgba(20,0,45,0.90)',
  },
  rylane: {
    name: "Rylane's Space",  tagline: 'midnight blue · city lights · chill night',
    emoji: '⚡', previewBg: IMAGES.bgRylaneRoomNight,
    glow: '#4DA3FF', gtop: 'rgba(0,20,70,0.55)',  gbot: 'rgba(0,8,30,0.90)',
  },
  cloud: {
    name: "Cloud's World",   tagline: 'dreamy · lavender mist · floating calm',
    emoji: '☁️', previewBg: IMAGES.bgRayleneRoomDay,
    glow: '#a78bfa', gtop: 'rgba(40,20,80,0.45)', gbot: 'rgba(10,5,30,0.88)',
  },
  night: {
    name: 'Late Night',      tagline: 'deep violet · moonlight · just you and the stars',
    emoji: '🌙', previewBg: IMAGES.bgRayleneRoomDeepNight,
    glow: '#c4b5fd', gtop: 'rgba(20,10,50,0.45)', gbot: 'rgba(5,3,16,0.92)',
  },
  rain: {
    name: 'Rain Room',       tagline: 'window rain · muted blue · reflective mood',
    emoji: '🌧️', previewBg: IMAGES.bgRayleneRoomRain,
    glow: '#60a5fa', gtop: 'rgba(10,30,60,0.50)', gbot: 'rgba(5,14,28,0.90)',
  },
  sunset: {
    name: 'Sunset Vibe',     tagline: 'purple-orange sky · warm evening room',
    emoji: '🌅', previewBg: IMAGES.bgRylaneRoomEvening,
    glow: '#fb7185', gtop: 'rgba(80,20,40,0.50)', gbot: 'rgba(25,8,18,0.90)',
  },
};

// ── Companion profiles ───────────────────────────────────────────────────────

const SEKRET_PROFILES: Record<string, {
  name: string; emoji: string; title: string; tagline: string; avatar: any; accent: string;
}> = {
  soft:   {
    name: 'Raylene', emoji: '💜', title: 'Big Sis',
    tagline: 'warm, protective, emotionally real',
    avatar: IMAGES.rayleneNeutral, accent: '#e879f9',
  },
  rylane: {
    name: 'Rylane',  emoji: '⚡', title: 'Loyal Bro',
    tagline: 'street smart, down to earth, no cap',
    avatar: IMAGES.rylaneNeutral, accent: '#4DA3FF',
  },
};

// ── Mode buttons ─────────────────────────────────────────────────────────────

const SEKRET_MODES: Record<string, { emoji: string; label: string }> = {
  soft:     { emoji: '🌙', label: 'Soft' },
  realTalk: { emoji: '🧠', label: 'Real Talk' },
  distract: { emoji: '😂', label: 'Distract' },
  listen:   { emoji: '☁️', label: 'Just Listen' },
  push:     { emoji: '🔥', label: 'Push Me' },
};

// ── Props ────────────────────────────────────────────────────────────────────

interface SettingsScreenProps {
  t:                  Record<string, any>;
  theme:              string;
  setTheme:           (theme: string) => void;
  selectedSekret:     string;
  setSelectedSekret:  (key: string) => void;
  sekretMode:         string;
  setSekretMode:      (mode: string) => void;
  userSide:           string;
  setUserSide:        (side: string) => void;
  parentRoomStyle?:   string;
  setParentRoomStyle?:(style: string) => void;
  setScreen:          (screen: string) => void;
  BottomNav:          React.ReactNode;
  mood?:              string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function SettingsScreen({
  t, theme, setTheme,
  selectedSekret, setSelectedSekret,
  sekretMode, setSekretMode,
  userSide, setUserSide,
  parentRoomStyle, setParentRoomStyle,
  setScreen, BottomNav,
}: SettingsScreenProps) {

  const vibe   = VIBE_CONFIG[theme] || VIBE_CONFIG.raylene;
  const glow   = vibe.glow;
  const cardBg = 'rgba(10,6,24,0.72)';

  const glass = (extra?: object) => [
    styles.glassCard,
    { backgroundColor: cardBg, borderColor: glow + '44' },
    extra,
  ] as any;

  return (
    <View style={styles.root}>
      {/* Atmospheric room background */}
      <ImageBackground
        source={vibe.previewBg}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(5,3,14,0.68)", "rgba(8,4,20,0.84)", "rgba(3,2,10,0.96)"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Vibe Lab ✨</Text>
          <Text style={styles.subtitle}>Choose the feeling of your room.</Text>
        </View>

        {/* ── ACTIVE VIBE HERO ── */}
        <View style={[styles.heroWrap, { borderColor: glow + '70' }]}>
          <ImageBackground
            source={vibe.previewBg}
            style={styles.heroBg}
            resizeMode="cover"
            borderRadius={22}
          >
            <LinearGradient
              colors={[vibe.gtop, vibe.gbot] as any}
              style={styles.heroOverlay}
            >
              <Text style={styles.heroEmoji}>{vibe.emoji}</Text>
              <Text style={[styles.heroName, { color: glow }]}>{vibe.name}</Text>
              <Text style={styles.heroTagline}>{vibe.tagline}</Text>
              <View style={[styles.activePill, { borderColor: glow + '99', backgroundColor: glow + '22' }]}>
                <Text style={[styles.activePillText, { color: glow }]}>active vibe</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* ── VIBE PICKER ── */}
        <Text style={styles.sectionLabel}>Pick Your Vibe</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vibeRow}
          style={{ marginBottom: 20 }}
        >
          {Object.entries(VIBE_CONFIG).map(([key, cfg]) => {
            const active = theme === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setTheme(key)}
                activeOpacity={0.8}
                style={[
                  styles.vibeCard,
                  { borderColor: active ? cfg.glow : 'rgba(120,80,160,0.25)', borderWidth: active ? 2.5 : 1 },
                ]}
              >
                <ImageBackground
                  source={cfg.previewBg}
                  style={styles.vibeCardBg}
                  resizeMode="cover"
                  borderRadius={16}
                >
                  <LinearGradient
                    colors={[cfg.gtop, cfg.gbot] as any}
                    style={styles.vibeCardGradient}
                  >
                    <Text style={styles.vibeEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.vibeName, { color: active ? cfg.glow : '#e2d8ff' }]}>
                      {cfg.name}
                    </Text>
                    {active && (
                      <View style={[styles.vibeActiveDot, { backgroundColor: cfg.glow }]} />
                    )}
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── YOUR SE'KRET ── */}
        <Text style={styles.sectionLabel}>Your Se'kret</Text>
        {Object.entries(SEKRET_PROFILES).map(([key, profile]) => {
          const active = selectedSekret === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedSekret(key)}
              activeOpacity={0.8}
              style={[
                styles.companionCard,
                {
                  backgroundColor: active ? profile.accent + '18' : cardBg,
                  borderColor: active ? profile.accent + '99' : 'rgba(120,80,160,0.28)',
                },
              ]}
            >
              <Image source={profile.avatar} style={styles.companionAvatar} resizeMode="contain" />
              <View style={styles.companionInfo}>
                <Text style={[styles.companionName, { color: active ? profile.accent : '#fff' }]}>
                  {profile.emoji} {profile.name}
                </Text>
                <Text style={styles.companionTitle}>{profile.title}</Text>
                <Text style={styles.companionTagline}>{profile.tagline}</Text>
              </View>
              {active && (
                <View style={[styles.checkBadge, { backgroundColor: profile.accent }]}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* ── SE'KRET MODE ── */}
        <Text style={styles.sectionLabel}>Se'kret Mode</Text>
        <View style={glass({ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 18 })}>
          {Object.entries(SEKRET_MODES).map(([key, mode]) => {
            const active = sekretMode === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setSekretMode(key)}
                style={[
                  styles.modePill,
                  {
                    borderColor: active ? glow : 'rgba(150,110,210,0.3)',
                    backgroundColor: active ? glow + '22' : 'rgba(20,10,40,0.5)',
                  },
                ]}
              >
                <Text style={styles.modePillEmoji}>{mode.emoji}</Text>
                <Text style={[styles.modePillLabel, { color: active ? glow : '#c4b5fd' }]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── ACCOUNT SIDE ── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={glass({ flexDirection: 'row', gap: 10 })}>
          {([['teen', '🧑', 'Teen Side'], ['parent', '👨‍👩‍👧', 'Parent']] as const).map(([side, ico, label]) => {
            const active = userSide === side;
            return (
              <TouchableOpacity
                key={side}
                onPress={() => setUserSide(side)}
                style={[
                  styles.sideBtn,
                  {
                    borderColor: active ? glow : 'rgba(150,110,210,0.3)',
                    backgroundColor: active ? glow + '22' : 'rgba(20,10,40,0.5)',
                    flex: 1,
                  },
                ]}
              >
                <Text style={styles.sideBtnIcon}>{ico}</Text>
                <Text style={[styles.sideBtnLabel, { color: active ? glow : '#c4b5fd' }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── PARENT ROOM STYLE ── */}
        {userSide === 'parent' && setParentRoomStyle && (
          <>
            <Text style={styles.sectionLabel}>Parent Room</Text>
            <View style={glass({ flexDirection: 'row', gap: 10 })}>
              {([['mom', '💜', 'Mom Room'], ['dad', '👑', 'Dad Room']] as const).map(([style, ico, label]) => {
                const active = parentRoomStyle === style;
                return (
                  <TouchableOpacity
                    key={style}
                    onPress={() => setParentRoomStyle(style)}
                    style={[
                      styles.sideBtn,
                      {
                        borderColor: active ? glow : 'rgba(150,110,210,0.3)',
                        backgroundColor: active ? glow + '22' : 'rgba(20,10,40,0.5)',
                        flex: 1,
                      },
                    ]}
                  >
                    <Text style={styles.sideBtnIcon}>{ico}</Text>
                    <Text style={[styles.sideBtnLabel, { color: active ? glow : '#c4b5fd' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── DONE ── */}
        <TouchableOpacity
          style={[
            styles.doneBtn,
            { borderColor: glow + '88', backgroundColor: glow + '20', shadowColor: glow },
          ]}
          onPress={() => setScreen('home')}
        >
          <Text style={[styles.doneBtnText, { color: glow }]}>Done ✓</Text>
        </TouchableOpacity>
        <View style={{ height: 110 }} />
      </ScrollView>

      {BottomNav}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#060210' },
  container: { flexGrow: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16, paddingBottom: 120 },

  header:    { alignItems: 'center', marginBottom: 22 },
  title:     { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginBottom: 6 },
  subtitle:  { fontSize: 14, color: '#b0a8d4', fontStyle: 'italic' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#9b8ec4', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },

  // Hero active vibe
  heroWrap:    { borderRadius: 22, borderWidth: 1.5, overflow: 'hidden', marginBottom: 24, height: 210 },
  heroBg:      { flex: 1 },
  heroOverlay: { flex: 1, padding: 22, justifyContent: 'flex-end' },
  heroEmoji:   { fontSize: 32, marginBottom: 4 },
  heroName:    { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  heroTagline: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 12, lineHeight: 18 },
  activePill:  { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  activePillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  // Vibe picker
  vibeRow:     { paddingLeft: 2, paddingRight: 16, gap: 10, flexDirection: 'row' },
  vibeCard:    { width: W * 0.38, height: 170, borderRadius: 16, overflow: 'hidden' },
  vibeCardBg:  { flex: 1 },
  vibeCardGradient: { flex: 1, padding: 12, justifyContent: 'flex-end' },
  vibeEmoji:   { fontSize: 22, marginBottom: 4 },
  vibeName:    { fontSize: 12, fontWeight: '800', lineHeight: 16 },
  vibeActiveDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  // Glass card
  glassCard:   { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 },

  // Companion cards
  companionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1.5, padding: 14, marginBottom: 12 },
  companionAvatar: { width: 64, height: 80, borderRadius: 12, marginRight: 14 },
  companionInfo: { flex: 1 },
  companionName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  companionTitle:{ fontSize: 12, color: '#9b8ec4', marginBottom: 4 },
  companionTagline: { fontSize: 12, color: '#c4b5fd', lineHeight: 17 },
  checkBadge:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  checkBadgeText: { color: '#fff', fontSize: 13, fontWeight: '900' },

  // Mode pills
  modePill:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 30, borderWidth: 1, gap: 6 },
  modePillEmoji: { fontSize: 15 },
  modePillLabel: { fontSize: 12, fontWeight: '700' },

  // Side buttons
  sideBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 18, borderWidth: 1 },
  sideBtnIcon: { fontSize: 18 },
  sideBtnLabel:{ fontSize: 13, fontWeight: '700' },

  // Done
  doneBtn:     { marginTop: 8, marginBottom: 4, paddingVertical: 16, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  doneBtnText: { fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#d8caed', fontSize: 10, letterSpacing: 2.1, fontWeight: '800' },
  sparkle: { color: '#fff', fontSize: 20 },
  logo: { color: '#fff', fontSize: 38, lineHeight: 44, fontWeight: '900', letterSpacing: -1.4, marginTop: 5 },
  heroCard: { borderRadius: 30, borderWidth: 1, overflow: 'hidden', shadowOpacity: 0.4, shadowRadius: 24, elevation: 8, marginBottom: 26 },
  heroImage: { height: 260 }, heroImageRadius: { borderRadius: 29 },
  heroShade: { flex: 1, padding: 18, justifyContent: 'flex-end' },
  livePill: { position: 'absolute', top: 16, left: 16, borderWidth: 1, borderRadius: 20, backgroundColor: 'rgba(10,6,22,0.64)', paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 }, liveText: { color: '#fff', fontSize: 9, letterSpacing: 1.1, fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 27, fontWeight: '900' },
  heroFeeling: { fontSize: 14, fontWeight: '800', marginTop: 2 }, heroDetail: { color: '#e7ddf1', fontSize: 12, marginTop: 5 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' }, sectionSub: { color: '#c9badc', fontSize: 12, marginTop: 3 }, sectionIcon: { fontSize: 24 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  vibeImage: { flex: 1 }, vibeImageRadius: { borderRadius: 22 }, vibeShade: { flex: 1, justifyContent: 'flex-end', padding: 13 },
  vibeTopRow: { position: 'absolute', top: 11, left: 11, right: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chosen: { color: '#160d25', fontSize: 8, fontWeight: '900', letterSpacing: 1, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 12 },
  vibeFeeling: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  companionHeader: { minHeight: 88, flexDirection: 'row', justifyContent: 'space-between' },
  cardKicker: { color: '#c9badc', fontSize: 9, letterSpacing: 1.6, fontWeight: '900', marginBottom: 5 }, cardTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  companionHero: { width: 86, height: 92, marginTop: -10 }, companionRow: { flexDirection: 'row', gap: 8 },
  companionChoice: { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.045)', padding: 8, alignItems: 'center' },
  companionRole: { color: '#bdb0d0', fontSize: 9, lineHeight: 12, textAlign: 'center', marginTop: 3 },
  modeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  modeChip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  modeLabel: { color: '#fff', fontSize: 12, fontWeight: '700' }, modeDescription: { fontSize: 10, marginTop: 3, maxWidth: 170 },
  quietRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, marginBottom: 13 }, quietLabel: { color: '#aa9abb', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginRight: 3 },
  spaceChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.06)' }, spaceChipActive: { backgroundColor: 'rgba(255,255,255,0.17)' }, spaceText: { color: '#eee7f8', fontSize: 11, fontWeight: '700' },
  returnRoom: { borderWidth: 1, borderRadius: 24, backgroundColor: 'rgba(22,10,38,0.8)', padding: 17, shadowOpacity: 0.42, shadowRadius: 18 },
  returnSmall: { color: '#bdaed1', fontSize: 8, fontWeight: '900', letterSpacing: 1.7 }, returnText: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 3 },
});
