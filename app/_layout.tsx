import React from 'react';
import {
  View, Text, ScrollView, Image, ImageBackground,
  TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSekret } from './_layout';
import BottomNav from '@components/BottomNav';
import { C, IMAGES, COMFORT_MESSAGES } from '@constants/theme';

export default function MoreScreen() {
  const { userSide, setUserSide, voiceKey, comfortIdx } = useSekret();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.heroWrap}>
          <ImageBackground source={IMAGES.roomBgDark} style={styles.heroBg} resizeMode="cover">
            <LinearGradient colors={['rgba(13,9,20,0.2)', 'rgba(13,9,20,0.92)']} style={StyleSheet.absoluteFill} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>More ✨</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Current side card */}
        <View style={[styles.card, { flexDirection: 'column', overflow: 'hidden' }]}>
          <LinearGradient colors={['rgba(76,29,149,0.3)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
          <View style={[styles.row, { marginBottom: 14 }]}>
            <Image source={IMAGES[voiceKey].neutral} style={styles.sideAvatar} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.sideLabel}>current side</Text>
              <Text style={styles.sideTitle}>{userSide === 'parent' ? '🌿 Parent Side' : '💜 Teen Side'}</Text>
              <Text style={styles.sideSub}>{userSide === 'parent' ? 'Supporting with love.' : 'Your space. Always you.'}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setUserSide(userSide === 'parent' ? 'teen' : 'parent')}
            style={styles.switchBtn}
          >
            <LinearGradient colors={['#7c3aed', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.switchBtnInner}>
              <Text style={styles.switchBtnText}>Switch to {userSide === 'parent' ? 'Teen Side 💜' : 'Parent Side 🌿'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick links */}
        <View style={{ gap: 8, marginHorizontal: 16, marginBottom: 12 }}>
          {[
            { icon: '⚙️', label: 'Vibe Lab', sub: "themes, se'kret, and more", to: '/settings' },
            { icon: '✨', label: 'Bippin2 / Insights', sub: 'growth tools and cycle tracker', to: '/bippin2' },
            { icon: '🌉', label: userSide === 'parent' ? 'Parent Bridge' : 'Bridge', sub: "connect through se'kret", to: userSide === 'parent' ? '/parentBridge' : '/bridge' },
            { icon: '🚨', label: 'Comfort Mode', sub: 'when things feel heavy', to: '/comfort' },
            { icon: '🎙️', label: 'Voice Bip', sub: 'say it out loud', to: '/voiceBip' },
          ].map(item => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.to as any)} style={styles.linkCard}>
              <View style={styles.linkIcon}><Text style={{ fontSize: 22 }}>{item.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkLabel}>{item.label}</Text>
                <Text style={styles.linkSub}>{item.sub}</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Se'kret says */}
        <View style={[styles.card, { overflow: 'hidden', borderColor: 'rgba(168,85,247,0.2)' }]}>
          <LinearGradient colors={['rgba(76,29,149,0.3)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
          <Image source={IMAGES.cloud} style={{ width: 44, height: 44, marginRight: 12 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.sekretHeader}>Se'kret says 💜</Text>
            <Text style={styles.sekretBody}>{COMFORT_MESSAGES[comfortIdx].emoji} {COMFORT_MESSAGES[comfortIdx].text}</Text>
          </View>
        </View>

      </ScrollView>
      <BottomNav userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 100 },
  heroWrap: { marginHorizontal: 16, marginTop: Platform.OS === 'ios' ? 56 : 40, marginBottom: 12, borderRadius: 24, overflow: 'hidden' },
  heroBg: { width: '100%', minHeight: 150 },
  heroContent: { padding: 18, minHeight: 150, justifyContent: 'flex-end' },
  heroTitle: { fontSize: 26, color: C.pinkHot, fontStyle: 'italic', fontWeight: '800' },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sideAvatar: { width: 60, height: 60, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(168,85,247,0.4)' },
  sideLabel: { fontSize: 11, color: '#a855f7', marginBottom: 3 },
  sideTitle: { fontSize: 16, color: C.white, fontWeight: '700' },
  sideSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  switchBtn: { borderRadius: 14, overflow: 'hidden' },
  switchBtnInner: { padding: 12, alignItems: 'center' },
  switchBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14 },
  linkIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(124,58,237,0.2)', alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 13, color: C.white, fontWeight: '600' },
  linkSub: { fontSize: 11, color: C.muted },
  sekretHeader: { fontSize: 11, color: C.pinkHot, fontWeight: '700', marginBottom: 4 },
  sekretBody: { fontSize: 13, color: C.lavender, fontStyle: 'italic', lineHeight: 20 },
});
