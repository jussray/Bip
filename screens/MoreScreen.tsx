// screens/MoreScreen.tsx
// Se'kret Bip — More (utility hub)
// Light polish: backdrop + gradient overlay + mood-tinted accents.
// Functionality preserved — only adds optional mood/selectedSekret props.

import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, StyleSheet, Platform, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRoomBg } from '../constants/theme';

interface MoreScreenProps {
  t: Record<string, any>;
  userSide: string;
  setUserSide: (side: string) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
  mood?: string;
  selectedSekret?: string;
}

function glowFor(mood?: string): string {
  const m = (mood || '').toLowerCase();
  if (m.includes('happy'))       return '#fbbf24';
  if (m.includes('sad') || m.includes('anx'))    return '#7dd3fc';
  if (m.includes('angry') || m.includes('over') || m.includes('stress')) return '#f472b6';
  if (m.includes('tired'))       return '#6d28d9';
  if (m.includes('calm'))        return '#c4b5fd';
  return '#c4b5fd';
}

function timeOfDay(): 'morning' | 'day' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export function MoreScreen({
  t, userSide, setUserSide, setScreen, BottomNav,
  mood, selectedSekret,
}: MoreScreenProps) {
  const glow = glowFor(mood);
  const charKey = selectedSekret === 'rylane' ? 'rylane' : 'raylene';
  const bgSource = getRoomBg(charKey, timeOfDay());

  const card = () => [styles.card, { backgroundColor: 'rgba(30,18,55,0.82)', borderColor: glow + '88', shadowColor: glow }] as any;
  const btn  = () => [styles.button, { backgroundColor: glow, shadowColor: glow }] as any;

  return (
    <ImageBackground source={bgSource} style={styles.root} resizeMode="cover">
      <LinearGradient
        colors={['rgba(20,10,40,0.55)', 'rgba(40,20,70,0.72)', 'rgba(15,8,30,0.92)']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>More ✨</Text>
        <Text style={styles.subtitle}>Settings, growth tools, and extra Bip spaces.</Text>

        <View style={card()}>
          <Text style={styles.cardEmoji}>{userSide === 'parent' ? '🌿' : '💜'}</Text>
          <Text style={styles.cardText}>Current Side: {userSide === 'parent' ? 'Parent Side' : 'Teen Side'}</Text>
          <TouchableOpacity
            style={btn()}
            onPress={() => setUserSide(userSide === 'parent' ? 'teen' : 'parent')}
          >
            <Text style={styles.buttonText}>
              Switch to {userSide === 'parent' ? 'Teen Side' : 'Parent Side'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={btn()} onPress={() => setScreen('settings')}>
          <Text style={styles.buttonText}>⚙️ Vibe Lab</Text>
        </TouchableOpacity>
        <TouchableOpacity style={btn()} onPress={() => setScreen('bippin2')}>
          <Text style={styles.buttonText}>✨ Bippin2 / Insights</Text>
        </TouchableOpacity>
        <TouchableOpacity style={btn()} onPress={() => setScreen('growth')}>
          <Text style={styles.buttonText}>🌱 Growth / Life Skills</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={btn()}
          onPress={() => setScreen(userSide === 'parent' ? 'parentBridge' : 'bridge')}
        >
          <Text style={styles.buttonText}>
            {userSide === 'parent' ? '🌉 Parent Bridge' : '🌉 Bridge'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
      {BottomNav}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  container:  { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 100 },
  logo:       { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:   { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  card:       { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  cardEmoji:  { fontSize: 32, marginBottom: 8, textAlign: 'center' },
  cardText:   { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  button:     { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
