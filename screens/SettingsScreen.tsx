import React from 'react';
import {
  Text, TouchableOpacity, ScrollView, View, Image, ImageBackground,
  StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGES, THEME_PACKS, normalizeVibeKey, type VibeKey } from '../constants/theme';

const VIBE_ORDER: VibeKey[] = ['raylene', 'rylane', 'cloud', 'night', 'rain', 'sunset'];

const COMPANIONS = {
  soft: { name: 'Raylene', role: 'warm big-sis energy', image: IMAGES.rayleneNeutral },
  rylane: { name: 'Rylane', role: 'real-talk older cousin', image: IMAGES.rylaneProfile },
  cloud: { name: 'Cloud', role: 'quiet comfort, no pressure', image: IMAGES.cloudHappy },
} as const;

const SEKRET_MODES: Record<string, { emoji: string; label: string; description: string }> = {
  soft: { emoji: '🫶🏽', label: 'Sit With Me', description: 'gentle comfort, no rushing' },
  realTalk: { emoji: '👀', label: 'Keep It Real', description: 'honest, caring, notices the pattern' },
  distract: { emoji: '😭', label: 'Get My Mind Off It', description: 'a little funny, still human' },
  listen: { emoji: '☁️', label: 'Just Listen', description: 'no fixing. just presence.' },
  push: { emoji: '⚡', label: 'Lock Me In', description: 'loving accountability' },
};

interface SettingsScreenProps {
  t: Record<string, any>;
  theme: string;
  setTheme: (theme: string) => void;
  selectedSekret: string;
  setSelectedSekret: (key: string) => void;
  sekretMode: string;
  setSekretMode: (mode: string) => void;
  userSide: string;
  setUserSide: (side: string) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
  mood?: string;
}

export function SettingsScreen({
  theme, setTheme, selectedSekret, setSelectedSekret, sekretMode, setSekretMode,
  userSide, setUserSide, setScreen, BottomNav,
}: SettingsScreenProps) {
  const activeKey = normalizeVibeKey(theme);
  const activeVibe = THEME_PACKS[activeKey];
  const companionKey = selectedSekret in COMPANIONS ? selectedSekret as keyof typeof COMPANIONS : 'soft';
  const companion = COMPANIONS[companionKey];

  return (
    <View style={[styles.root, { backgroundColor: activeVibe.background }]}>
      <ImageBackground source={activeVibe.room} style={StyleSheet.absoluteFill} resizeMode="cover">
        <LinearGradient colors={activeVibe.overlay as [string, string, string]} style={StyleSheet.absoluteFill} />
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>YOUR ROOM · YOUR WEATHER</Text>
          <Text style={styles.sparkle}>✦</Text>
        </View>
        <Text style={styles.logo}>Vibe Lab</Text>
        <Text style={styles.subtitle}>What should your room feel like right now?</Text>

        <View style={[styles.heroCard, { borderColor: activeVibe.accent + '99', shadowColor: activeVibe.accent }]}>
          <ImageBackground source={activeVibe.room} style={styles.heroImage as any} imageStyle={styles.heroImageRadius as any}>
            <LinearGradient colors={['rgba(12,7,25,0.04)', 'rgba(14,8,28,0.82)']} style={styles.heroShade}>
              <View style={[styles.livePill, { borderColor: activeVibe.accent + 'aa' }]}>
                <View style={[styles.liveDot, { backgroundColor: activeVibe.accent }]} />
                <Text style={styles.liveText}>IN THE ROOM NOW</Text>
              </View>
              <Text style={styles.heroEmoji}>{activeVibe.emoji}</Text>
              <Text style={styles.heroTitle}>{activeVibe.name}</Text>
              <Text style={[styles.heroFeeling, { color: activeVibe.soft }]}>{activeVibe.feeling}</Text>
              <Text style={styles.heroDetail}>{activeVibe.detail}</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Choose the atmosphere</Text>
            <Text style={styles.sectionSub}>not a color theme — a whole room feeling</Text>
          </View>
          <Text style={styles.sectionIcon}>🪩</Text>
        </View>

        <View style={styles.vibeGrid}>
          {VIBE_ORDER.map(key => {
            const vibe = THEME_PACKS[key];
            const active = key === activeKey;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.vibeCard, active && { borderColor: vibe.accent, shadowColor: vibe.accent, shadowOpacity: 0.55 }]}
                onPress={() => setTheme(key)}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${vibe.name}, ${vibe.feeling}`}
              >
                <ImageBackground source={vibe.room} style={styles.vibeImage as any} imageStyle={styles.vibeImageRadius as any}>
                  <LinearGradient colors={['rgba(12,7,25,0.05)', 'rgba(10,6,22,0.88)']} style={styles.vibeShade}>
                    <View style={styles.vibeTopRow}>
                      <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                      {active && <Text style={[styles.chosen, { backgroundColor: vibe.accent }]}>HERE</Text>}
                    </View>
                    <Text style={styles.vibeName}>{vibe.name}</Text>
                    <Text style={[styles.vibeFeeling, { color: vibe.soft }]}>{vibe.feeling}</Text>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.glassCard}>
          <View style={styles.companionHeader}>
            <View>
              <Text style={styles.cardKicker}>WHO'S POSTED UP?</Text>
              <Text style={styles.cardTitle}>Choose your company</Text>
            </View>
            <Image source={companion.image} style={styles.companionHero as any} resizeMode="contain" />
          </View>
          <View style={styles.companionRow}>
            {(Object.keys(COMPANIONS) as Array<keyof typeof COMPANIONS>).map(key => {
              const item = COMPANIONS[key];
              const active = key === companionKey;
              return (
                <TouchableOpacity key={key} style={[styles.companionChoice, active && { borderColor: activeVibe.accent, backgroundColor: activeVibe.accent + '22' }]} onPress={() => setSelectedSekret(key)}>
                  <Image source={item.image} style={styles.companionAvatar as any} resizeMode="contain" />
                  <Text style={styles.companionName}>{item.name}</Text>
                  <Text style={styles.companionRole}>{item.role}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.cardKicker}>HOW SHOULD WE SHOW UP?</Text>
          <Text style={styles.cardTitle}>{companion.name} can read the room.</Text>
          <View style={styles.modeWrap}>
            {Object.entries(SEKRET_MODES).map(([key, mode]) => {
              const active = sekretMode === key;
              return (
                <TouchableOpacity key={key} style={[styles.modeChip, active && { borderColor: activeVibe.accent, backgroundColor: activeVibe.accent + '28' }]} onPress={() => setSekretMode(key)}>
                  <Text style={styles.modeLabel}>{mode.emoji} {mode.label}</Text>
                  {active && <Text style={[styles.modeDescription, { color: activeVibe.soft }]}>{mode.description}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.quietRow}>
          <Text style={styles.quietLabel}>space</Text>
          <TouchableOpacity style={[styles.spaceChip, userSide === 'teen' && styles.spaceChipActive]} onPress={() => setUserSide('teen')}>
            <Text style={styles.spaceText}>my room</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.spaceChip, userSide === 'parent' && styles.spaceChipActive]} onPress={() => setUserSide('parent')}>
            <Text style={styles.spaceText}>parent window</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.returnRoom, { borderColor: activeVibe.accent, shadowColor: activeVibe.accent }]} onPress={() => setScreen('home')}>
          <Text style={styles.returnSmall}>ATMOSPHERE SET</Text>
          <Text style={styles.returnText}>go feel the room  →</Text>
        </TouchableOpacity>
        <View style={{ height: 110 }} />
      </ScrollView>
      {BottomNav}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { padding: 20, paddingTop: Platform.OS === 'ios' ? 58 : 38 },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#d8caed', fontSize: 10, letterSpacing: 2.1, fontWeight: '800' },
  sparkle: { color: '#fff', fontSize: 20 },
  logo: { color: '#fff', fontSize: 38, lineHeight: 44, fontWeight: '900', letterSpacing: -1.4, marginTop: 5 },
  subtitle: { color: '#eee7f8', fontSize: 16, lineHeight: 23, marginBottom: 20 },
  heroCard: { borderRadius: 30, borderWidth: 1, overflow: 'hidden', shadowOpacity: 0.4, shadowRadius: 24, elevation: 8, marginBottom: 26 },
  heroImage: { height: 260 }, heroImageRadius: { borderRadius: 29 },
  heroShade: { flex: 1, padding: 18, justifyContent: 'flex-end' },
  livePill: { position: 'absolute', top: 16, left: 16, borderWidth: 1, borderRadius: 20, backgroundColor: 'rgba(10,6,22,0.64)', paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 }, liveText: { color: '#fff', fontSize: 9, letterSpacing: 1.1, fontWeight: '800' },
  heroEmoji: { fontSize: 30, marginBottom: 4 }, heroTitle: { color: '#fff', fontSize: 27, fontWeight: '900' },
  heroFeeling: { fontSize: 14, fontWeight: '800', marginTop: 2 }, heroDetail: { color: '#e7ddf1', fontSize: 12, marginTop: 5 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' }, sectionSub: { color: '#c9badc', fontSize: 12, marginTop: 3 }, sectionIcon: { fontSize: 24 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  vibeCard: { width: '48%', height: 174, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', shadowRadius: 16 },
  vibeImage: { flex: 1 }, vibeImageRadius: { borderRadius: 22 }, vibeShade: { flex: 1, justifyContent: 'flex-end', padding: 13 },
  vibeTopRow: { position: 'absolute', top: 11, left: 11, right: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vibeEmoji: { fontSize: 23 }, chosen: { color: '#160d25', fontSize: 8, fontWeight: '900', letterSpacing: 1, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 12 },
  vibeName: { color: '#fff', fontSize: 16, fontWeight: '800' }, vibeFeeling: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  glassCard: { backgroundColor: 'rgba(25,13,43,0.72)', borderColor: 'rgba(255,255,255,0.17)', borderWidth: 1, borderRadius: 27, padding: 17, marginBottom: 15, shadowColor: '#a779df', shadowOpacity: 0.16, shadowRadius: 20 },
  companionHeader: { minHeight: 88, flexDirection: 'row', justifyContent: 'space-between' },
  cardKicker: { color: '#c9badc', fontSize: 9, letterSpacing: 1.6, fontWeight: '900', marginBottom: 5 }, cardTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  companionHero: { width: 86, height: 92, marginTop: -10 }, companionRow: { flexDirection: 'row', gap: 8 },
  companionChoice: { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.045)', padding: 8, alignItems: 'center' },
  companionAvatar: { width: 54, height: 54 }, companionName: { color: '#fff', fontSize: 12, fontWeight: '800' }, companionRole: { color: '#bdb0d0', fontSize: 9, lineHeight: 12, textAlign: 'center', marginTop: 3 },
  modeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  modeChip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  modeLabel: { color: '#fff', fontSize: 12, fontWeight: '700' }, modeDescription: { fontSize: 10, marginTop: 3, maxWidth: 170 },
  quietRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, marginBottom: 13 }, quietLabel: { color: '#aa9abb', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginRight: 3 },
  spaceChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.06)' }, spaceChipActive: { backgroundColor: 'rgba(255,255,255,0.17)' }, spaceText: { color: '#eee7f8', fontSize: 11, fontWeight: '700' },
  returnRoom: { borderWidth: 1, borderRadius: 24, backgroundColor: 'rgba(22,10,38,0.8)', padding: 17, shadowOpacity: 0.42, shadowRadius: 18 },
  returnSmall: { color: '#bdaed1', fontSize: 8, fontWeight: '900', letterSpacing: 1.7 }, returnText: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 3 },
});
