import React from 'react';
import {
  View, Text, ScrollView, Image, ImageBackground,
  TouchableOpacity, StyleSheet, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSekret } from './_layout';
import BottomNav from '@components/BottomNav';
import BackgroundLayer from '@components/BackgroundLayer';
import { C, IMAGES } from '@constants/theme';
import { BIP } from '@constants/bip_voice';

export default function CalmScreen() {
  const { userSide, voiceKey, charName, breatheAnim, comfortIdx, setComfortIdx } = useSekret();

  const comfortMessages = BIP.BIPPIN_BRB.comfortMessages;
  const sounds = [
    { icon: '🌧️', label: 'night rain',  sub: 'soothing rain sounds', time: '20:00' },
    { icon: '🎵', label: 'soft lo-fi',  sub: 'focus + unwind',       time: '30:00', playing: true },
    { icon: '🌊', label: 'ocean waves', sub: 'reset your mind',       time: '25:00' },
  ];

  return (
    <BackgroundLayer screen="calm" voiceKey={voiceKey as any}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.heroWrap}>
            <ImageBackground source={IMAGES.roomBgDark} style={styles.heroBg} resizeMode="cover">
              <LinearGradient colors={['rgba(13,9,20,0.15)', 'rgba(13,9,20,0.92)']} style={StyleSheet.absoluteFill} />
              <View style={styles.heroContent}>
                <Text style={styles.heroSub}>your calm. your reset.</Text>
                <Text style={styles.heroTitle}>{BIP.BIPPIN_BRB.title}</Text>
                <Text style={styles.heroMini}>{BIP.BIPPIN_BRB.subtitle}</Text>
              </View>
            </ImageBackground>
          </View>

          {/* Check-in banner */}
          <View style={[styles.card, { overflow: 'hidden' }]}>
            <LinearGradient colors={['rgba(76,29,149,0.4)', 'rgba(13,9,20,0.8)']} style={StyleSheet.absoluteFill} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{BIP.BIPPIN_BRB.heroMessage} {charName}. 💜</Text>
              <Text style={styles.cardSub}>{BIP.BIPPIN_BRB.heroSub}</Text>
            </View>
            <TouchableOpacity style={styles.checkInBtn}>
              <Text style={styles.checkInText}>check-in ›</Text>
            </TouchableOpacity>
          </View>

          {/* Mood row */}
          <View style={[styles.card, { flexDirection: 'column' }]}>
            <Text style={[styles.cardTitle, { marginBottom: 12 }]}>{BIP.BIPPIN_BRB.moodPrompt}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[{e:'😰',l:'anxious'},{e:'😩',l:'overwhelmed'},{e:'😢',l:'sad'},{e:'😤',l:'stressed'},{e:'😴',l:'tired'},{e:'😌',l:'calm'}].map(m => (
                  <TouchableOpacity key={m.l} style={{ alignItems: 'center', gap: 6 }}>
                    <View style={styles.moodBubble}><Text style={{ fontSize: 26 }}>{m.e}</Text></View>
                    <Text style={styles.moodLabel}>{m.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Box breathing */}
          <View style={[styles.card, { flexDirection: 'column', overflow: 'hidden', borderColor: 'rgba(168,85,247,0.25)' }]}>
            <LinearGradient colors={['rgba(76,29,149,0.2)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.breathTitle}>{BIP.BIPPIN_BRB.boxBreath.title}</Text>
            <Text style={styles.breathSub}>{BIP.BIPPIN_BRB.boxBreath.sub}</Text>
            <View style={styles.breathBox}>
              <View style={styles.breathOutline} />
              <Animated.View style={{ transform: [{ scale: breatheAnim }] }}>
                <Image source={IMAGES.cloud} style={{ width: 70, height: 70 }} resizeMode="contain" />
              </Animated.View>
              <Text style={[styles.breathLabel, { top: 4 }]}>{BIP.BIPPIN_BRB.boxBreath.in}</Text>
              <Text style={[styles.breathLabel, { bottom: 4, color: C.pinkHot }]}>{BIP.BIPPIN_BRB.boxBreath.out}</Text>
              <Text style={[styles.breathLabel, { left: 0 }]}>{BIP.BIPPIN_BRB.boxBreath.hold1}</Text>
              <Text style={[styles.breathLabel, { right: 0 }]}>{BIP.BIPPIN_BRB.boxBreath.hold2}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/mindReset')} style={styles.gradBtn}>
              <LinearGradient colors={['#7c3aed', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
                <Text style={styles.gradBtnText}>{BIP.BIPPIN_BRB.boxBreath.startBtn}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Calm tools */}
          <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <Text style={[styles.cardTitle, { marginBottom: 10 }]}>{BIP.BIPPIN_BRB.toolsTitle}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[
                  { icon:'💜', label: BIP.BIPPIN_BRB.tools.breathe.label, sub: BIP.BIPPIN_BRB.tools.breathe.sub, to:'/mindReset' },
                  { icon:'🌿', label: BIP.BIPPIN_BRB.tools.ground.label,  sub: BIP.BIPPIN_BRB.tools.ground.sub,  to:'/bodyReset' },
                  { icon:'📓', label: BIP.BIPPIN_BRB.tools.release.label, sub: BIP.BIPPIN_BRB.tools.release.sub, to:'/pages' },
                  { icon:'🌙', label: BIP.BIPPIN_BRB.tools.sleep.label,   sub: BIP.BIPPIN_BRB.tools.sleep.sub,   to:'/calm' },
                  { icon:'⚡', label: BIP.BIPPIN_BRB.tools.sos.label,     sub: BIP.BIPPIN_BRB.tools.sos.sub,     to:'/comfort' },
                ].map(t => (
                  <TouchableOpacity key={t.label} onPress={() => router.push(t.to as any)} style={styles.toolCard}>
                    <Text style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</Text>
                    <Text style={styles.toolLabel}>{t.label}</Text>
                    <Text style={styles.toolSub}>{t.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Calm playlist */}
          <View style={[styles.card, { flexDirection: 'column' }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{BIP.BIPPIN_BRB.playlist}</Text>
              <Text style={styles.seeAll}>see all</Text>
            </View>
            <Text style={[styles.cardSub, { marginBottom: 12 }]}>{BIP.BIPPIN_BRB.playlistSub}</Text>
            {sounds.map((s, i) => (
              <View key={s.label} style={[styles.soundRow, i < sounds.length - 1 && styles.soundBorder]}>
                <View style={styles.soundIcon}><Text style={{ fontSize: 20 }}>{s.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.soundLabel, s.playing && { color: C.pinkHot, fontWeight: '700' }]}>{s.label}</Text>
                  <Text style={styles.soundSub}>{s.sub}</Text>
                </View>
                {s.playing && <View style={styles.playDot}><Text style={{ fontSize: 12, color: '#fff' }}>▶</Text></View>}
                <Text style={styles.soundTime}>{s.time}</Text>
              </View>
            ))}
          </View>

          {/* Se'kret says */}
          <View style={[styles.card, { overflow: 'hidden', borderColor: 'rgba(168,85,247,0.25)' }]}>
            <LinearGradient colors={['rgba(76,29,149,0.35)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <Image source={IMAGES[voiceKey].thinking} style={styles.sekretImg} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.sekretHeader}>{BIP.BIPPIN_BRB.comfortTitle}</Text>
              <Text style={styles.sekretBody}>
                {comfortMessages[comfortIdx].emoji} {comfortMessages[comfortIdx].text}
              </Text>
              <TouchableOpacity
                onPress={() => setComfortIdx((i: number) => (i + 1) % comfortMessages.length)}
                style={styles.anotherBtn}
              >
                <Text style={styles.anotherText}>{BIP.BIPPIN_BRB.anotherBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comfort mode button */}
          <TouchableOpacity onPress={() => router.push('/comfort')} style={styles.gradBtn}>
            <LinearGradient
              colors={['rgba(124,58,237,0.4)', 'rgba(236,72,153,0.4)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.gradBtnInner, { borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' }]}
            >
              <Text style={styles.gradBtnText}>{BIP.BIPPIN_BRB.comfortMode}</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
        <BottomNav userSide={userSide} />
      </View>
    </BackgroundLayer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingBottom: 100 },
  heroWrap: { marginHorizontal: 16, marginTop: Platform.OS === 'ios' ? 56 : 40, marginBottom: 12, borderRadius: 24, overflow: 'hidden' },
  heroBg: { width: '100%', minHeight: 170 },
  heroContent: { padding: 18, minHeight: 170, justifyContent: 'flex-end' },
  heroSub: { fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 },
  heroTitle: { fontSize: 26, color: C.pinkHot, fontStyle: 'italic', fontWeight: '800' },
  heroMini: { fontSize: 12, color: C.mutedLt, marginTop: 4 },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 13, color: C.white, fontWeight: '600' },
  cardSub: { fontSize: 11, color: C.muted },
  seeAll: { fontSize: 11, color: '#a855f7' },
  checkInBtn: { backgroundColor: 'rgba(124,58,237,0.3)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  checkInText: { fontSize: 11, color: C.lavender, fontWeight: '600' },
  moodBubble: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  moodLabel: { fontSize: 10, color: C.muted },
  breathTitle: { fontSize: 14, color: C.white, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  breathSub: { fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 16 },
  breathBox: { alignItems: 'center', justifyContent: 'center', height: 160, position: 'relative', width: '100%' },
  breathOutline: { width: 110, height: 110, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', borderRadius: 20, position: 'absolute' },
  breathLabel: { position: 'absolute', fontSize: 11, color: C.lavender, fontWeight: '700' },
  gradBtn: { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden' },
  gradBtnInner: { padding: 14, alignItems: 'center' },
  gradBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  toolCard: { width: 82, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center' },
  toolLabel: { fontSize: 10, color: C.lavender, textAlign: 'center', lineHeight: 14, fontWeight: '600' },
  toolSub: { fontSize: 9, color: C.muted, marginTop: 3 },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  soundBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(167,114,192,0.1)' },
  soundIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center' },
  soundLabel: { fontSize: 13, color: C.white },
  soundSub: { fontSize: 11, color: C.muted },
  soundTime: { fontSize: 11, color: C.muted },
  playDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  sekretImg: { width: 80, height: 80, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', marginRight: 12 },
  sekretHeader: { fontSize: 13, color: C.pinkHot, fontWeight: '700', marginBottom: 8 },
  sekretBody: { fontSize: 13, color: C.lavender, fontStyle: 'italic', lineHeight: 20 },
  anotherBtn: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' },
  anotherText: { fontSize: 11, color: C.lavender, fontWeight: '600' },
});
