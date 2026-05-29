import React from 'react';
import {
  View, Text, ScrollView, Image, ImageBackground,
  TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSekretState } from '@hooks/useSekretState';
import BottomNav from '@components/BottomNav';
import { C, IMAGES, HOME_MESSAGES, COMFORT_MESSAGES } from '@constants/theme';

export default function HomeScreen() {
  const {
    mood, selectedSekret, voiceKey, charName,
    journalText, selectMood, comfortIdx, homeMessageIndex,
    userSide,
  } = useSekretState();

  const charImg = mood === 'Happy'
    ? IMAGES[voiceKey].happy
    : mood === 'Sad' || mood === 'Tired'
      ? IMAGES[voiceKey].thinking
      : IMAGES[voiceKey].neutral;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HERO ── */}
        <View style={styles.heroWrap}>
          <ImageBackground source={IMAGES.roomBg} style={styles.heroBg} resizeMode="cover">
            <LinearGradient
              colors={['rgba(13,9,20,0.1)', 'rgba(13,9,20,0.88)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroPad}>
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroGreeting}>
                    {new Date().getHours() < 12
                      ? 'good morning,'
                      : new Date().getHours() < 17
                        ? 'good afternoon,'
                        : 'good night,'}
                  </Text>
                  <Text style={styles.heroName}>{charName} 🌙</Text>
                  <Text style={styles.heroSub}>
                    You made it through today.{'\n'}I'm proud of you. 💜
                  </Text>
                </View>
                <Image source={charImg} style={styles.heroChar} resizeMode="cover" />
              </View>
              <TouchableOpacity
                onPress={() => router.push('/sekret')}
                style={styles.talkBtn}
              >
                <Text style={{ fontSize: 15 }}>💬</Text>
                <Text style={styles.talkBtnText}>talk to Se'kret</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* ── EMOTIONAL WEATHER ── */}
        <View style={styles.card}>
          <Text style={{ fontSize: 36 }}>
            {mood === 'Happy' ? '☀️' : mood === 'Sad' ? '🌧️' : mood === 'Angry' ? '⛈️' : '🌩️'}
          </Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.weatherLabel}>emotional weather ✦</Text>
            <Text style={styles.weatherMood}>
              {mood === 'Happy' ? 'Feeling Good' : mood === 'Sad' ? 'Heavy Heart' : mood === 'Angry' ? 'Worked Up' : 'Overwhelmed'}
            </Text>
            <Text style={styles.weatherSub}>
              {mood === 'Happy' ? 'Light and warm.' : mood === 'Sad' ? 'It is okay to feel this.' : mood === 'Angry' ? 'Your feelings are valid.' : 'Heavy mind, tired soul.'}
            </Text>
          </View>
          <View style={styles.energyRing}>
            <Text style={styles.energyNum}>6/10</Text>
            <Text style={styles.energyLabel}>energy</Text>
          </View>
        </View>

        {/* ── MOOD CHECK-IN ── */}
        <View style={[styles.card, { borderColor: C.borderPk, flexDirection: 'column' }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { flex: 1 }]}>how's your heart right now? 💜</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>quick check-in</Text>
            </View>
          </View>
          <View style={[styles.rowBetween, { marginTop: 14 }]}>
            {[
              { id: 'Awful', e: '😟' }, { id: 'Sad', e: '😢' },
              { id: 'Tired', e: '😐' }, { id: 'Happy', e: '🙂' },
              { id: 'Good', e: '😊' },  { id: 'Amazing', e: '😄' },
            ].map(m => (
              <TouchableOpacity key={m.id} onPress={() => selectMood(m.id)} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[styles.moodCircle, mood === m.id && styles.moodCircleActive]}>
                  <Text style={{ fontSize: 22 }}>{m.e}</Text>
                </View>
                <Text style={[styles.moodLabel, mood === m.id && { color: C.lavender }]}>
                  {m.id.toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── STREAK + REMINDER ── */}
        <View style={styles.duoRow}>
          <View style={[styles.cardSmall, { flex: 1 }]}>
            <Text style={styles.streakLabel}>connection streak</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ fontSize: 22 }}>🔥</Text>
              <Text style={styles.streakNum}>12</Text>
              <Text style={styles.streakUnit}>days</Text>
            </View>
            <Text style={styles.streakSub}>consistent self-care.{'\n'}you got this.</Text>
          </View>
          <View style={[styles.cardSmall, { flex: 1, borderColor: 'rgba(168,85,247,0.2)', overflow: 'hidden' }]}>
            <LinearGradient
              colors={['rgba(124,58,237,0.2)', 'rgba(13,9,20,0.8)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.reminderTag}>late night reminder</Text>
            <Text style={styles.reminderText}>
              "it's okay to not have it all figured out tonight. 💜"
            </Text>
            <Text style={{ position: 'absolute', top: 10, right: 12, fontSize: 16 }}>⭐</Text>
          </View>
        </View>

        {/* ── SE'KRET MESSAGE ── */}
        <View style={[styles.card, { borderColor: 'rgba(168,85,247,0.3)', flexDirection: 'column', overflow: 'hidden' }]}>
          <LinearGradient
            colors={['rgba(76,29,149,0.5)', 'rgba(13,9,20,0.9)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Image source={IMAGES.cloud} style={{ width: 56, height: 56 }} resizeMode="contain" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.sekretHeader}>Se'kret sees you 💜</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={styles.sekretBody}>
                {mood === 'Sad'
                  ? `Heavy nights don't last forever, ${charName}. I'm right here.`
                  : mood === 'Angry'
                    ? `Your feelings make sense, ${charName}. You're safe to let it out here.`
                    : `I read your entry tonight. You carry so much, ${charName}. I'm proud of you. 💜`}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {['💬 talk more', '✨ give advice'].map(b => (
              <TouchableOpacity
                key={b}
                onPress={() => router.push('/sekret')}
                style={styles.sekretBtn}
              >
                <Text style={styles.sekretBtnText}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── CONTINUE ENTRY ── */}
        <TouchableOpacity
          onPress={() => router.push('/pages')}
          style={[styles.card, { alignItems: 'center' }]}
        >
          <Image
            source={IMAGES[voiceKey].window}
            style={styles.continueThumb}
            resizeMode="cover"
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.continueLabel}>continue where you left off</Text>
            <Text style={styles.continueText} numberOfLines={2}>
              {journalText.trim()
                ? `"${journalText.slice(0, 80)}..."`
                : '"tap to start your first entry tonight..."'}
            </Text>
          </View>
          <Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
        </TouchableOpacity>

        {/* ── QUICK ACTIONS ── */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.sectionLabel}>quick actions ✦</Text>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
            {[
              { icon: '✏️', label: 'Write\nIt Out', to: '/pages' },
              { icon: '🎙️', label: 'Voice\nBip',   to: '/voiceBip' },
              { icon: '📹', label: 'Video\nBip',   to: '/pages' },
              { icon: '🌉', label: "Se'krets\n2Tell", to: '/bridge' },
            ].map(a => (
              <TouchableOpacity
                key={a.label}
                onPress={() => router.push(a.to as any)}
                style={styles.qaItem}
              >
                <LinearGradient
                  colors={['rgba(124,58,237,0.2)', 'rgba(13,9,20,0.8)']}
                  style={styles.qaGrad}
                >
                  <Text style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</Text>
                  <Text style={styles.qaLabel}>{a.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── TINY BIP ── */}
        <View style={styles.tinyBip}>
          <LinearGradient
            colors={['rgba(76,29,149,0.2)', 'rgba(13,9,20,0.6)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tinyBipGrad}
          >
            <Image source={IMAGES.cloudHeadphones} style={{ width: 44, height: 44 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.tinyLabel}>tiny Bip for your heart 💜</Text>
              <Text style={styles.tinyText}>
                Breathe, {charName}. You're doing better than you think. ✨
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/calm')}
              style={styles.playBtn}
            >
              <LinearGradient colors={['#7c3aed', '#ec4899']} style={styles.playBtnInner}>
                <Text style={{ fontSize: 14, color: '#fff' }}>▶</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

      </ScrollView>
      <BottomNav userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 100 },

  heroWrap: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 56 : 40,
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroBg: { width: '100%', minHeight: 220 },
  heroPad: { padding: 18 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroGreeting: { fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 },
  heroName: { fontSize: 26, color: C.pinkHot, fontStyle: 'italic', fontWeight: '800' },
  heroSub: { fontSize: 12, color: C.mutedLt, marginTop: 6, lineHeight: 18 },
  heroChar: { width: 110, height: 110, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(168,85,247,0.35)' },
  talkBtn: {
    marginTop: 14, alignSelf: 'flex-start', borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)',
    paddingHorizontal: 18, paddingVertical: 9,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(124,58,237,0.2)',
  },
  talkBtnText: { fontSize: 13, color: C.lavender, fontWeight: '600' },

  card: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    padding: 16, flexDirection: 'row', alignItems: 'center',
  },
  cardSmall: {
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    padding: 14, overflow: 'hidden',
  },
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
  moodCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.05)' },
  moodCircleActive: { backgroundColor: 'rgba(168,85,247,0.3)', borderColor: '#a855f7' },
  moodLabel: { fontSize: 9, color: C.muted },

  duoRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  streakLabel: { fontSize: 10, color: '#a855f7', marginBottom: 4 },
  streakNum: { fontSize: 28, color: C.white, fontWeight: '800', lineHeight: 32 },
  streakUnit: { fontSize: 12, color: C.muted, marginBottom: 4 },
  streakSub: { fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 15 },
  reminderTag: { fontSize: 9, color: C.pinkHot, letterSpacing: 1, marginBottom: 6 },
  reminderText: { fontSize: 12, color: C.lavender, fontStyle: 'italic', lineHeight: 17 },

  sekretHeader: { fontSize: 12, color: C.pinkHot, fontWeight: '700' },
  sekretBody: { fontSize: 13, color: C.lavender, lineHeight: 20, marginTop: 6 },
  newBadge: { backgroundColor: 'rgba(236,72,153,0.2)', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { fontSize: 9, color: C.pinkHot, fontWeight: '700' },
  sekretBtn: { backgroundColor: 'rgba(124,58,237,0.3)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  sekretBtnText: { fontSize: 12, color: C.lavender, fontWeight: '600' },

  continueThumb: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  continueLabel: { fontSize: 10, color: '#a855f7', marginBottom: 5 },
  continueText: { fontSize: 12, color: C.mutedLt, fontStyle: 'italic', lineHeight: 17 },

  sectionLabel: { fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 10, marginHorizontal: 16 },
  qaItem: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  qaGrad: { padding: 12, alignItems: 'center', minHeight: 72, justifyContent: 'center' },
  qaLabel: { fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 14 },

  tinyBip: { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' },
  tinyBipGrad: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  tinyLabel: { fontSize: 10, color: C.pinkHot, marginBottom: 3 },
  tinyText: { fontSize: 12, color: C.lavender, fontStyle: 'italic', lineHeight: 17 },
  playBtn: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  playBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
