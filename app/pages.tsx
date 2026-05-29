import React from 'react';
import {
  View, Text, ScrollView, Image, ImageBackground,
  TouchableOpacity, TextInput, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSekret } from './_layout';
import BottomNav from '@components/BottomNav';
import { C, IMAGES } from '@constants/theme';

export default function PagesScreen() {
  const {
    journalText, setJournalText,
    entries, saveEntry,
    userSide, voiceKey,
    selectedSekret, charName,
    getDynamicTags,
  } = useSekret();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.heroWrap}>
          <ImageBackground source={IMAGES.roomBgDark} style={styles.heroBg} resizeMode="cover">
            <LinearGradient colors={['rgba(13,9,20,0.2)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={styles.heroContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroSub}>your journal. your space.</Text>
                <Text style={styles.heroTitle}>Se'kret Pages 🔒</Text>
                <Text style={styles.heroMini}>write it out. get it off your chest.</Text>
              </View>
              <Image source={IMAGES[voiceKey].writing} style={styles.heroChar} resizeMode="cover" />
            </View>
          </ImageBackground>
        </View>

        {/* New entry button */}
        <View style={styles.gradBtn}>
          <LinearGradient colors={['#7c3aed', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
            <Text style={styles.gradBtnText}>New Entry +</Text>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['journal', 'voice', 'video', 'scrap'].map((tab, i) => (
            <View key={tab} style={[styles.tab, i === 0 && styles.tabActive]}>
              <Text style={[styles.tabText, i === 0 && styles.tabTextActive]}>{tab}</Text>
            </View>
          ))}
        </View>

        {/* Write it out */}
        <View style={[styles.card, { flexDirection: 'column', overflow: 'hidden' }]}>
          <LinearGradient colors={['rgba(76,29,149,0.35)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>✏️ Write It Out</Text>
            <Text style={styles.cardMini}>private journal entry</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="today was a lot. i tried to stay strong but..."
            placeholderTextColor="#4a3d6b"
            multiline
            value={journalText}
            onChangeText={setJournalText}
          />
          <Text style={styles.charCount}>{journalText.length}/1000</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {[
              { icon: '🎙️', label: 'Voice Bip', sub: '30–60 sec', to: '/voiceBip' },
              { icon: '📹', label: 'Video Bip', sub: '30–60 sec', to: '/pages' },
              { icon: '📷', label: 'Add Photo', sub: 'optional', to: '/pages' },
            ].map(b => (
              <TouchableOpacity key={b.label} onPress={() => router.push(b.to as any)} style={styles.mediaBtn}>
                <Text style={{ fontSize: 18, marginBottom: 3 }}>{b.icon}</Text>
                <Text style={styles.mediaBtnLabel}>{b.label}</Text>
                <Text style={styles.mediaBtnSub}>{b.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Se'kret listening */}
        <View style={[styles.card, { alignItems: 'center', gap: 12 }]}>
          <Image source={IMAGES.cloudHeadphones} style={{ width: 44, height: 44 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.listeningLabel}>Se'kret is listening... ✦</Text>
            <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              {[4,8,14,10,18,12,20,8,16,10,14,8,18,12,6].map((h, i) => (
                <View key={i} style={{ width: 3, height: h, backgroundColor: i < 8 ? C.pinkHot : 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
              ))}
            </View>
          </View>
        </View>

        {/* Se'kret replied */}
        {journalText.trim().length > 0 && (
          <View style={[styles.card, { flexDirection: 'column', overflow: 'hidden', borderColor: 'rgba(168,85,247,0.3)' }]}>
            <LinearGradient colors={['rgba(76,29,149,0.3)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.replyLabel}>Se'kret replied · just now</Text>
                <Text style={styles.replyText}>That sounds really heavy, {charName}. 💜 You carry so much and still try to hold it together. You're not alone here. I see you.</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              {['💜 that means a lot', '🥺 thank you', '💬 talk more'].map(b => (
                <TouchableOpacity key={b} onPress={() => router.push('/sekret')} style={styles.replyBtn}>
                  <Text style={styles.replyBtnText}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Mood tags */}
        <View style={[styles.card, { flexDirection: 'column' }]}>
          <Text style={styles.cardMini}>Mood Tags · choose how this felt</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {getDynamicTags().map(tag => (
              <TouchableOpacity key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity onPress={saveEntry} style={styles.gradBtn}>
          <LinearGradient colors={['#7c3aed', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
            <Text style={styles.gradBtnText}>Save Page 💜</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Saved entries */}
        <View style={styles.rowBetween2}>
          <Text style={styles.cardTitle}>Saved Pages</Text>
          <Text style={styles.seeAll}>see all</Text>
        </View>

        {entries.length === 0 ? (
          <View style={[styles.card, { flexDirection: 'column', alignItems: 'center', padding: 20 }]}>
            <Image source={IMAGES.cloud} style={{ width: 48, height: 48, marginBottom: 10 }} resizeMode="contain" />
            <Text style={styles.emptyText}>No pages yet. Your truth has a place here.</Text>
          </View>
        ) : (
          entries.map(e => (
            <View key={e.id} style={[styles.card, { alignItems: 'flex-start', gap: 12 }]}>
              <Image source={IMAGES.cloud} style={{ width: 32, height: 32 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <View style={styles.rowBetween}>
                  <View style={styles.moodChip}><Text style={styles.moodChipText}>{e.mood} 💜</Text></View>
                  <Text style={styles.entryDate}>{e.date} · {e.time}</Text>
                </View>
                <Text style={styles.entryText} numberOfLines={3}>"{e.text}"</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>
      <BottomNav userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 100 },
  heroWrap: { marginHorizontal: 16, marginTop: Platform.OS === 'ios' ? 56 : 40, marginBottom: 12, borderRadius: 24, overflow: 'hidden' },
  heroBg: { width: '100%', minHeight: 160 },
  heroContent: { padding: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 160 },
  heroSub: { fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 },
  heroTitle: { fontSize: 26, color: C.pinkHot, fontStyle: 'italic', fontWeight: '800' },
  heroMini: { fontSize: 12, color: C.mutedLt, marginTop: 4 },
  heroChar: { width: 90, height: 90, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(168,85,247,0.35)' },
  gradBtn: { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden' },
  gradBtnInner: { padding: 14, alignItems: 'center' },
  gradBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 50, padding: 4, gap: 2 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 50 },
  tabActive: { backgroundColor: C.purple },
  tabText: { fontSize: 11, fontWeight: '600', color: C.muted },
  tabTextActive: { color: '#fff' },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBetween2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8 },
  cardTitle: { fontSize: 13, color: C.white, fontWeight: '600' },
  cardMini: { fontSize: 10, color: C.muted },
  seeAll: { fontSize: 11, color: '#a855f7' },
  input: { color: C.white, fontSize: 14, lineHeight: 22, minHeight: 130, textAlignVertical: 'top', fontStyle: 'italic', marginTop: 10 },
  charCount: { fontSize: 10, color: '#4a3d6b', marginTop: 6 },
  mediaBtn: { flex: 1, backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' },
  mediaBtnLabel: { fontSize: 10, color: C.lavender, fontWeight: '600' },
  mediaBtnSub: { fontSize: 9, color: C.muted },
  listeningLabel: { fontSize: 11, color: '#a855f7', marginBottom: 4 },
  replyLabel: { fontSize: 10, color: '#a855f7', marginBottom: 4 },
  replyText: { fontSize: 13, color: C.lavender, lineHeight: 20 },
  replyBtn: { backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' },
  replyBtnText: { fontSize: 11, color: C.lavender, fontWeight: '600' },
  tag: { backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' },
  tagText: { fontSize: 11, color: C.lavender, fontWeight: '600' },
  moodChip: { backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  moodChipText: { fontSize: 10, color: C.lavender, fontWeight: '600' },
  entryDate: { fontSize: 10, color: C.muted },
  entryText: { fontSize: 12, color: C.mutedLt, fontStyle: 'italic', lineHeight: 18, marginTop: 6 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', fontStyle: 'italic' },
});
