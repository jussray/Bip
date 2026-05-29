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
import { C, IMAGES } from '@constants/theme';

export default function VoiceBipScreen() {
  const { userSide, isRecording, voiceNotes, pulseAnim, startRecording, stopRecording, isSekretTyping, sekretReply } = useSekret();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.heroWrap}>
          <ImageBackground source={IMAGES.roomBgDark} style={styles.heroBg} resizeMode="cover">
            <LinearGradient colors={['rgba(13,9,20,0.2)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Voice Bip 🎙️</Text>
              <Text style={styles.heroSub}>Say it out loud. 30–60 seconds. Let it go.</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Record button */}
        <View style={[styles.card, { flexDirection: 'column', alignItems: 'center', paddingVertical: 32 }]}>
          <Animated.View style={[styles.recordBtn, isRecording && styles.recordBtnActive, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={{ fontSize: 48 }}>{isRecording ? '🔴' : '🎙️'}</Text>
          </Animated.View>
          <Text style={styles.recordLabel}>{isRecording ? 'Recording...' : 'Tap to Start'}</Text>
          <Text style={styles.recordSub}>{isRecording ? 'Tap again to stop' : 'Say whatever you need to say'}</Text>
          <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.recordAction}>
            <LinearGradient
              colors={isRecording ? ['#ef4444', '#dc2626'] : ['#7c3aed', '#ec4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.recordActionInner}
            >
              <Text style={styles.recordActionText}>{isRecording ? '⏹ Stop Recording' : '▶ Start Voice Bip'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Se'kret listening */}
        {isSekretTyping && (
          <View style={[styles.card, { gap: 12 }]}>
            <Image source={IMAGES.cloudHeadphones} style={{ width: 40, height: 40 }} resizeMode="contain" />
            <Text style={styles.listeningText}>Se'kret is listening... ☁️</Text>
          </View>
        )}

        {/* Tips */}
        <View style={[styles.card, { flexDirection: 'column' }]}>
          <Text style={[styles.cardTitle, { marginBottom: 10 }]}>Tips for Voice Bips 🌙</Text>
          {[
            "Find a private spot — car, room, bathroom, wherever",
            "You don't need perfect words. Just talk.",
            "It's okay to cry, pause, or start over",
            "Se'kret listens without judgment, always",
          ].map(tip => (
            <Text key={tip} style={styles.tip}>• {tip}</Text>
          ))}
        </View>

        {/* Saved voice notes */}
        {voiceNotes.length > 0 && (
          <View style={[styles.card, { flexDirection: 'column' }]}>
            <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Saved Voice Bips</Text>
            {voiceNotes.slice(0, 5).map(n => (
              <View key={n.id} style={styles.noteRow}>
                <View style={styles.noteIcon}><Text style={{ fontSize: 16 }}>🎙️</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteTitle}>{n.title}</Text>
                  <Text style={styles.noteMeta}>{n.date} · {n.duration}</Text>
                </View>
                <View style={styles.playBtn}><Text style={styles.playBtnText}>▶ Play</Text></View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={() => router.push('/pages')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back to Pages</Text>
        </TouchableOpacity>

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
  tip: { fontSize: 13, color: C.lavender, marginBottom: 8, lineHeight: 20 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(167,114,192,0.1)' },
  noteIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,58,237,0.3)', alignItems: 'center', justifyContent: 'center' },
  noteTitle: { color: C.white, fontWeight: '600', fontSize: 13 },
  noteMeta: { color: C.muted, fontSize: 11 },
  playBtn: { backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 10, padding: 6 },
  playBtnText: { color: C.lavender, fontSize: 12 },
  backBtn: { marginHorizontal: 16, marginBottom: 12, padding: 12, alignItems: 'center' },
  backBtnText: { fontSize: 13, color: C.muted },
});
