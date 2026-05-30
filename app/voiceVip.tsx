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

export default function VoiceBipScreen() {
  const { userSide, voiceKey, isRecording, voiceNotes, pulseAnim, startRecording, stopRecording, isSekretTyping, sekretReply } = useSekret();

  return (
    <BackgroundLayer screen="voiceBip" voiceKey={voiceKey as any}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.heroWrap}>
            <ImageBackground source={IMAGES.roomBgDark} style={styles.heroBg} resizeMode="cover">
              <LinearGradient colors={['rgba(13,9,20,0.2)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{BIP.VOICE_BIP.title}</Text>
                <Text style={styles.heroSub}>{BIP.VOICE_BIP.subtitle}</Text>
              </View>
            </ImageBackground>
          </View>

          {/* Record button */}
          <View style={[styles.card, { flexDirection: 'column', alignItems: 'center', paddingVertical: 32 }]}>
            <Animated.View style={[styles.recordBtn, isRecording && styles.recordBtnActive, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={{ fontSize: 48 }}>{isRecording ? '🔴' : '🎙️'}</Text>
            </Animated.View>
            <Text style={styles.recordLabel}>
              {isRecording ? BIP.VOICE_BIP.recording : BIP.VOICE_BIP.tapToStart}
            </Text>
            <Text style={styles.recordSub}>
              {isRecording ? 'tap again to stop' : 'say whatever you need to say'}
            </Text>
            <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.recordAction}>
              <LinearGradient
                colors={isRecording ? ['#ef4444', '#dc2626'] : ['#7c3aed', '#ec4899']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.recordActionInner}
              >
                <Text style={styles.recordActionText}>
                  {isRecording ? BIP.VOICE_BIP.stopLabel : BIP.VOICE_BIP.startLabel}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Se'kret listening */}
          {isSekretTyping && (
            <View style={[styles.card, { gap: 12 }]}>
              <Image source={IMAGES.cloudHeadphones} style={{ width: 40, height: 40 }} resizeMode="contain" />
              <Text style={styles.listeningText}>{BIP.VOICE_BIP.thinkingText}</Text>
            </View>
          )}

          {/* Se'kret replied */}
          {sekretReply && !isSekretTyping && (
            <View style={[styles.card, { flexDirection: 'column', overflow: 'hidden', borderColor: 'rgba(168,85,247,0.3)' }]}>
              <LinearGradient colors={['rgba(76,29,149,0.3)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.replyLabel}>{BIP.VOICE_BIP.replyPrefix}</Text>
              <Text style={styles.replyText}>{sekretReply}</Text>
            </View>
          )}

          {/* Tips */}
          <View style={[styles.card, { flexDirection: 'column' }]}>
            <Text style={[styles.cardTitle, { marginBottom: 10 }]}>Tips for Voice Bips 🌙</Text>
            {BIP.VOICE_BIP.tips.map(tip => (
              <Text key={tip} style={styles.tip}>• {tip}</Text>
            ))}
          </View>

          {/* Saved voice notes */}
          {voiceNotes.length > 0 && (
            <View style={[styles.card, { flexDirection: 'column' }]}>
              <Text style={[styles.cardTitle, { marginBottom: 12 }]}>{BIP.VOICE_BIP.savedLabel}</Text>
              {voiceNotes.slice(0, 5).map((n: any) => (
                <View key={n.id} style={styles.noteRow}>
                  <View style={styles.noteIcon}><Text style={{ fontSize: 16 }}>🎙️</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteTitle}>{n.title}</Text>
                    <Text style={styles.noteMeta}>{n.date} · {n.duration}</Text>
                  </View>
                  <View style={styles.playBtn}><Text style={styles.playBtnText}>{BIP.VOICE_BIP.playLabel}</Text></View>
                </View>
              ))}
            </View>
          )}

          {voiceNotes.length === 0 && (
            <View style={[styles.card, { flexDirection: 'column', alignItems: 'center', padding: 20 }]}>
              <Image source={IMAGES.cloudHeadphones} style={{ width: 48, height: 48, marginBottom: 10 }} resizeMode="contain" />
              <Text style={styles.emptyText}>{BIP.EMPTY_STATES.voiceBips}</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => router.push('/pages')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back to Se'kret Pages</Text>
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
  heroBg: { width: '100%', minHeight: 150 },
  heroContent: { padding: 18, minHeight: 150, justifyContent: 'flex-end' },
  heroTitle: { fontSize: 26, color: C.pinkHot, fontStyle: 'italic', fontWeight: '800' },
  heroSub: { fontSize: 12, color: C.mutedLt },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 13, color: C.white, fontWeight: '600' },
  recordBtn: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(124,58,237,0.3)', borderWidth: 3, borderColor: '#a855f7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  recordBtnActive: { backgroundColor: 'rgba(236,72,153,0.3)', borderColor: C.pinkHot },
  recordLabel: { color: C.white, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  recordSub: { color: C.muted, fontSize: 13, marginBottom: 20 },
  recordAction: { borderRadius: 50, overflow: 'hidden', width: 200 },
  recordActionInner: { padding: 14, alignItems: 'center' },
  recordActionText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  listeningText: { fontSize: 13, color: C.lavender, fontStyle: 'italic' },
  replyLabel: { fontSize: 10, color: '#a855f7', marginBottom: 6 },
  replyText: { fontSize: 13, color: C.lavender, lineHeight: 20 },
  tip: { fontSize: 13, color: C.lavender, marginBottom: 8, lineHeight: 20 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(167,114,192,0.1)' },
  noteIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,58,237,0.3)', alignItems: 'center', justifyContent: 'center' },
  noteTitle: { color: C.white, fontWeight: '600', fontSize: 13 },
  noteMeta: { color: C.muted, fontSize: 11 },
  playBtn: { backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 10, padding: 6 },
  playBtnText: { color: C.lavender, fontSize: 12 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', fontStyle: 'italic' },
  backBtn: { marginHorizontal: 16, marginBottom: 12, padding: 12, alignItems: 'center' },
  backBtnText: { fontSize: 13, color: C.muted },
});
