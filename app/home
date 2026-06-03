import React from 'react';
import {
  View, Text, ScrollView, Image, ImageBackground,
  TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSekretState } from '../hooks/useSekretState';
import BottomNav from '../components/BottomNav';
import BackgroundLayer from '../components/BackgroundLayer';
import { C, IMAGES } from '../constants/theme';
import { BIP } from '../constants/bip_voice';

export default function HomeScreen() {
  const {
    mood, voiceKey, charName,
    journalText, selectMood, userSide,
  } = useSekretState();

  const charImg =
    mood === 'Happy' || mood === 'Good' || mood === 'Amazing'
      ? IMAGES[voiceKey].happy
      : mood === 'Sad' || mood === 'Tired' || mood === 'Awful'
        ? IMAGES[voiceKey].thinking
        : IMAGES[voiceKey].neutral;

  const hour = new Date().getHours();
  const timeKey =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : hour < 24 ? 'night' : 'latenight';
  const greeting = BIP.HOME.greeting[timeKey as keyof typeof BIP.HOME.greeting];

  const weatherEmoji =
    mood === 'Happy' || mood === 'Good' || mood === 'Amazing' ? '☀️'
    : mood === 'Sad' || mood === 'Awful' ? '🌧️'
    : mood === 'Angry' ? '⛈️' : '🌩️';

  const weatherMood =
    mood === 'Happy' || mood === 'Good' || mood === 'Amazing' ? 'Feeling Good'
    : mood === 'Sad' || mood === 'Awful' ? 'Heavy Heart'
    : mood === 'Angry' ? 'Worked Up' : 'Overwhelmed';

  const weatherSub =
    mood === 'Happy' || mood === 'Good' || mood === 'Amazing' ? 'Light and warm.'
    : mood === 'Sad' || mood === 'Awful' ? 'It is okay to feel this.'
    : mood === 'Angry' ? 'Your feelings are valid.' : 'Heavy mind, tired soul.';

  const moodResponse = BIP.HOME.moodResponses[mood as keyof typeof BIP.HOME.moodResponses]
    ?? BIP.SEKRET_VOICES[voiceKey as keyof typeof BIP.SEKRET_VOICES]?.encouragement;

  return (
    <BackgroundLayer screen="home" mood={mood} voiceKey={voiceKey as any}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={styles.heroWrap}>
            <ImageBackground source={IMAGES.roomBg} style={styles.heroBg} resizeMode="cover">
              <LinearGradient colors={['rgba(13,9,20,0.1)', 'rgba(13,9,20,0.88)']} style={StyleSheet.absoluteFill} />
              <View style={styles.heroPad}>
                <View style={styles.heroRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroGreeting}>{greeting}</Text>
                    <Text style={styles.heroName}>{charName} 🌙</Text>
                    <Text style={styles.heroSub}>
                      {BIP.SEKRET_VOICES[voiceKey as keyof typeof BIP.SEKRET_VOICES]?.encouragement}
                    </Text>
                  </View>
                  <Image source={charImg} style={styles.heroChar} resizeMode="cover" />
                </View>
                <TouchableOpacity onPress={() => router.push('/sekret' as any)} style={styles.talkBtn}>
                  <Text style={{ fontSize: 15 }}>💬</Text>
                  <Text style={styles.talkBtnText}>{BIP.HOME.actions.sekret}</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>

          {/* Emotional weather */}
          <View style={styles.card}>
            <Text style={{ fontSize: 36 }}>{weatherEmoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.weatherLabel}>emotional weather ✦</Text>
              <Text style={styles.weatherMood}>{weatherMood}</Text>
              <Text style={styles.weatherSub}>{weatherSub}</Text>
            </View>
            <View style={styles.energyRing}>
              <Text style={styles.energyNum}>6/10</Text>
              <Text style={styles.energyLabel}>energy</Text>
            </View>
          </View>

          {/* Mood check-in */}
          <View style={[styles.card, styles.columnCard, { borderColor: C.borderPk }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { flex: 1 }]}>{BIP.HOME.moodPrompt}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>quick check-in</Text>
              </View>
            </View>
            <View style={[styles.rowBetween, { marginTop: 14 }]}>
              {[
                { id: 'Awful', e: '😟' },
                { id: 'Sad',   e: '😢' },
                { id: 'Tired', e: '😐' },
                { id: 'Happy', e: '🙂' },
                { id: 'Good',  e: '😊' },
                { id: 'Amazing', e: '😄' },
              ].map(m => (
                <TouchableOpacity key={m.id} onPress={() => selectMood(m.id)} style={styles.moodItem}>
                  <View style={[styles.moodCircle, mood === m.id && styles.moodCircleActive]}>
                    <Text style={{ fontSize: 22 }}>{m.e}</Text>
                  </View>
                  <Text style={[styles.moodLabel, mood === m.id && { color: C.lavender }]}>
                    {m.id.toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {mood && (
              <Text style={styles.moodResponse}>{moodResponse}</Text>
            )}
          </View>

          {/* Streak + reminder */}
          <View style={styles.duoRow}>
            <View style={[styles.cardSmall, { flex: 1 }]}>
              <Text style={styles.streakLabel}>{BIP.STREAKS.label}</Text>
              <View style={styles.streakRow}>
                <Text style={{ fontSize: 22 }}>🔥</Text>
                <Text style={styles.streakNum}>12</Text>
                <Text style={styles.streakUnit}>days</Text>
              </View>
              <Text style={styles.streakSub}>{BIP.STREAKS.consistent}</Text>
            </View>
            <View style={[styles.cardSmall, styles.reminderCard]}>
              <LinearGradient colors={['rgba(124,58,237,0.2)', 'rgba(13,9,20,0.8)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.reminderTag}>late night reminder</Text>
              <Text style={styles.reminderText}>
                {BIP.SEKRET_VOICES[voiceKey as keyof typeof BIP.SEKRET_VOICES]?.sleepReminder}
              </Text>
              <Text style={styles.star}>⭐</Text>
            </View>
          </View>

          {/* Se'kret card */}
          <View style={[styles.card, styles.columnCard, styles.sekretCard]}>
            <LinearGradient colors={['rgba(76,29,149,0.5)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={styles.sekretRow}>
              <Image source={IMAGES.cloud} style={{ width: 56, height: 56 }} resizeMode="contain" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sekretHeader}>Se'kret sees you 💜</Text>
                  <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
                </View>
                <Text style={styles.sekretBody}>{moodResponse}</Text>
              </View>
            </View>
            <View style={styles.sekretBtnRow}>
              {['💬 talk more', '✨ give advice'].map(b => (
                <TouchableOpacity key={b} onPress={() => router.push('/sekret' as any)} style={styles.sekretBtn}>
                  <Text style={styles.sekretBtnText}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Continue entry */}
          <TouchableOpacity onPress={() => router.push('/pages' as any)} style={[styles.card, { alignItems: 'center' }]}>
            <Image source={IMAGES[voiceKey as keyof typeof IMAGES].window} style={styles.continueThumb} resizeMode="cover" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.continueLabel}>continue where you left off</Text>
              <Text style={styles.continueText} numberOfLines={2}>
                {journalText.trim()
                  ? `"${journalText.slice(0, 80)}..."`
                  : BIP.EMPTY_STATES.pagesSub}
              </Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
          </TouchableOpacity>

          {/* Quick actions */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionLabel}>quick actions ✦</Text>
            <View style={styles.quickRow}>
              {[
                { icon: '✏️', label: BIP.HOME.actions.write,  to: '/pages' },
                { icon: '🎙️', label: BIP.HOME.actions.voice,  to: '/voiceBip' },
                { icon: '📹', label: 'Video\nBip',             to: '/pages' },
                { icon: '🌉', label: BIP.HOME.actions.bridge,  to: '/bridge' },
              ].map(a => (
                <TouchableOpacity key={a.label} onPress={() => router.push(a.to as any)} style={styles.qaItem}>
                  <LinearGradient colors={['rgba(124,58,237,0.2)', 'rgba(13,9,20,0.8)']} style={styles.qaGrad}>
                    <Text style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</Text>
                    <Text style={styles.qaLabel}>{a.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tiny Bip */}
          <View style={styles.tinyBip}>
            <LinearGradient
              colors={['rgba(76,29,149,0.2)', 'rgba(13,9,20,0.6)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.tinyBipGrad}
            >
              <Image source={IMAGES.cloudHeadphones} style={{ width: 44, height: 44 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.tinyLabel}>tiny Bip for your heart 💜</Text>
                <Text style={styles.tinyText}>
                  {BIP.SEKRET_VOICES[voiceKey as keyof typeof BIP.SEKRET_VOICES]?.comfort}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/calm' as any)} style={styles.playBtn}>
                <LinearGradient colors={['#7c3aed', '#ec4899']} style={styles.playBtnInner}>
                  <Text style={{ fontSize: 14, color: '#fff' }}>▶</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

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
  heroBg: { width: '100%', minHeight: 220 },
  heroPad: { padding: 18 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroGreeting: { fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 },
  heroName: { fontSize: 26, color: C.pinkHot, fontStyle: 'italic', fontWeight: '800' },
  heroSub: { fontSize: 12, color: C.mutedLt, marginTop: 6, lineHeight: 18 },
  heroChar: { width: 110, height: 110, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(168,85,247,0.35)' },
  talkBtn: { marginTop: 14, alignSelf: 'flex-start', borderRadius: 50, borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)', paddingHorizontal: 18, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(124,58,237,0.2)' },
  talkBtnText: { fontSize: 13, color: C.lavender, fontWeight: '600', marginLeft: 8 },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'center' },
  columnCard: { flexDirection: 'column', alignItems: 'stretch' },
  cardSmall: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, overflow: 'hidden' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 13, color: C.white, fontWeight: '600' },
  weatherLabel: { fontSize: 10, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  weatherMood: { fontSize: 20, color: C.white, fontWeight: '700' },
  weatherSub: { fontSize: 12, color: C.muted },
  energyRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: C.pinkHot, alignItems: 'center', justifyContent: 'center' },
  energyNum: { fontSize: 11, color: C.white, fontWeight: '700' },
  energyLabel: { fontSize: 8, color: C.muted },
  pill: { backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 10, color: C.lavender, fontWeight: '700' },
  moodItem: { alignItems: 'center' },
  moodCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.05)' },
  moodCircleActive: { backgroundColor: 'rgba(168,85,247,0.3)', borderColor: '#a855f7' },
  moodLabel: { fontSize: 9, color: C.muted, marginTop: 4 },
  moodResponse: { fontSize: 12, color: C.lavender, fontStyle: 'italic', marginTop: 12, lineHeight: 18 },
  duoRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12 },
  streakRow: { flexDirection: 'row', alignItems: 'flex-end' },
  streakLabel: { fontSize: 10, color: '#a855f7', marginBottom: 4 },
  streakNum: { fontSize: 28, color: C.white, fontWeight: '800', lineHeight: 32, marginHorizontal: 4 },
  streakUnit: { fontSize: 12, color: C.muted, marginBottom: 4 },
  streakSub: { fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 15 },
  reminderCard: { flex: 1, borderColor: 'rgba(168,85,247,0.2)', marginLeft: 10 },
  reminderTag: { fontSize: 9, color: C.pinkHot, letterSpacing: 1, marginBottom: 6 },
  reminderText: { fontSize: 12, color: C.lavender, fontStyle: 'italic', lineHeight: 17 },
  star: { position: 'absolute', top: 10, right: 12, fontSize: 16 },
  sekretCard: { borderColor: 'rgba(168,85,247,0.3)', overflow: 'hidden' },
  sekretRow: { flexDirection: 'row', alignItems: 'flex-start' },
  sekretHeader: { fontSize: 12, color: C.pinkHot, fontWeight: '700' },
  sekretBody: { fontSize: 13, color: C.lavender, lineHeight: 20, marginTop: 6 },
  newBadge: { backgroundColor: 'rgba(236,72,153,0.2)', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { fontSize: 9, color: C.pinkHot, fontWeight: '700' },
  sekretBtnRow: { flexDirection: 'row', marginTop: 14 },
  sekretBtn: { backgroundColor: 'rgba(124,58,237,0.3)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', marginRight: 8 },
  sekretBtnText: { fontSize: 12, color: C.lavender, fontWeight: '600' },
  continueThumb: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  continueLabel: { fontSize: 10, color: '#a855f7', marginBottom: 5 },
  continueText: { fontSize: 12, color: C.mutedLt, fontStyle: 'italic', lineHeight: 17 },
  sectionLabel: { fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 10, marginHorizontal: 16 },
  quickRow: { flexDirection: 'row', paddingHorizontal: 16 },
  qaItem: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginRight: 8 },
  qaGrad: { padding: 12, alignItems: 'center', minHeight: 72, justifyContent: 'center' },
  qaLabel: { fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 14 },
  tinyBip: { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' },
  tinyBipGrad: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  tinyLabel: { fontSize: 10, color: C.pinkHot, marginBottom: 3 },
  tinyText: { fontSize: 12, color: C.lavender, fontStyle: 'italic', lineHeight: 17 },
  playBtn: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', marginLeft: 12 },
  playBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
