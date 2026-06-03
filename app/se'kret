import React from 'react';
import {
  View, Text, ScrollView, Image, ImageBackground,
  TouchableOpacity, TextInput, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSekret } from './_layout';
import BottomNav from '../components/BottomNav';
import { C, IMAGES, SEKRET_PROFILES } from '../constants/theme';

export default function SekretScreen() {
  const {
    userSide, voiceKey, charName,
    selectedSekret, setSelectedSekret,
    currentSekret,
    sekretMessage, setSekretMessage,
    sekretReply, isSekretTyping,
    sendSekretMessage,
  } = useSekret();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.heroWrap}>
        <ImageBackground source={IMAGES.roomBgDark} style={styles.heroBg} resizeMode="cover">
          <LinearGradient colors={['rgba(13,9,20,0.1)', 'rgba(13,9,20,0.88)']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroContent}>
            <Image source={IMAGES[voiceKey].neutral} style={styles.heroChar} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroSub}>your safe space</Text>
              <Text style={styles.heroTitle}>Chat with Se'kret 💜</Text>
              <Text style={styles.heroMini}>{currentSekret.vibe}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Greeting card */}
      <View style={[styles.card, { overflow: 'hidden', borderColor: 'rgba(168,85,247,0.25)' }]}>
        <LinearGradient colors={['rgba(76,29,149,0.4)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
        <Image source={IMAGES.cloudHeadphones} style={{ width: 52, height: 52, marginRight: 12 }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingLabel}>{currentSekret.name} · {currentSekret.title}</Text>
          <Text style={styles.greetingText}>"{currentSekret.greeting}"</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* User bubble */}
        <View style={styles.userBubbleWrap}>
          <View style={styles.userBubble}>
            <Text style={styles.bubbleText}>today was a lot. i tried to stay strong but i just felt alone. nobody even noticed.</Text>
            <Text style={styles.bubbleTime}>11:42 PM ✓✓</Text>
          </View>
        </View>

        {/* Se'kret bubble */}
        <View style={styles.sekretBubbleWrap}>
          <Image source={IMAGES.cloud} style={styles.cloudAvatar} resizeMode="contain" />
          <View style={{ maxWidth: '80%' }}>
            <View style={styles.sekretBubble}>
              <Text style={styles.sekretBubbleText}>
                {isSekretTyping ? `${currentSekret.name} is typing... ☁️` : sekretReply}
              </Text>
              {!isSekretTyping && <Text style={styles.bubbleTime}>11:45 PM</Text>}
            </View>
            {!isSekretTyping && (
              <View style={styles.quickReplies}>
                {['💜 What should I do?', '👂 Just listen', '☁️ Cheer me up'].map(q => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => { setSekretMessage(q); sendSekretMessage(); }}
                    style={styles.quickReply}
                  >
                    <Text style={styles.quickReplyText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Profile selector */}
        <View style={[styles.card, { flexDirection: 'column' }]}>
          <Text style={[styles.cardMini, { marginBottom: 12 }]}>Choose Your Se'kret</Text>
          {Object.keys(SEKRET_PROFILES).map(key => (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedSekret(key)}
              style={[styles.profileItem, selectedSekret === key && styles.profileItemActive]}
            >
              <Text style={{ fontSize: 24 }}>{SEKRET_PROFILES[key].emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{SEKRET_PROFILES[key].name}</Text>
                <Text style={styles.profileTitle}>{SEKRET_PROFILES[key].title}</Text>
              </View>
              {selectedSekret === key && (
                <View style={styles.checkmark}><Text style={{ fontSize: 11, color: '#fff' }}>✓</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Input */}
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="Type to Se'kret..."
          placeholderTextColor="#4a3d6b"
          multiline
          value={sekretMessage}
          onChangeText={setSekretMessage}
        />
        <TouchableOpacity onPress={sendSekretMessage} style={styles.sendBtn}>
          <LinearGradient colors={['#7c3aed', '#ec4899']} style={styles.sendBtnInner}>
            <Text style={{ fontSize: 18, color: '#fff' }}>›</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <BottomNav userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  heroWrap: { marginTop: Platform.OS === 'ios' ? 52 : 36, marginHorizontal: 16, marginBottom: 12, borderRadius: 24, overflow: 'hidden' },
  heroBg: { width: '100%', minHeight: 180 },
  heroContent: { padding: 18, minHeight: 180, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  heroChar: { width: 90, height: 90, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(168,85,247,0.4)' },
  heroSub: { fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 },
  heroTitle: { fontSize: 22, color: C.pinkHot, fontStyle: 'italic', fontWeight: '800' },
  heroMini: { fontSize: 12, color: C.mutedLt, marginTop: 4 },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'center' },
  cardMini: { fontSize: 12, color: C.mutedLt },
  greetingLabel: { fontSize: 11, color: '#a855f7', marginBottom: 6 },
  greetingText: { fontSize: 14, color: C.white, lineHeight: 22, fontStyle: 'italic' },
  userBubbleWrap: { alignItems: 'flex-end', marginBottom: 12 },
  userBubble: { maxWidth: '80%', backgroundColor: 'rgba(124,58,237,0.3)', borderRadius: 18, borderBottomRightRadius: 4, padding: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  sekretBubbleWrap: { alignItems: 'flex-start', marginBottom: 12, flexDirection: 'row', gap: 10 },
  cloudAvatar: { width: 32, height: 32, marginTop: 4 },
  sekretBubble: { backgroundColor: C.card2, borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, borderWidth: 1, borderColor: 'rgba(167,114,192,0.2)' },
  bubbleText: { fontSize: 13, color: C.white, lineHeight: 20 },
  sekretBubbleText: { fontSize: 13, color: C.lavender, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: C.muted, marginTop: 6, textAlign: 'right' },
  quickReplies: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  quickReply: { backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' },
  quickReplyText: { fontSize: 11, color: C.lavender, fontWeight: '600' },
  profileItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: C.border },
  profileItemActive: { backgroundColor: 'rgba(124,58,237,0.3)', borderColor: '#a855f7' },
  profileName: { fontSize: 13, color: C.white, fontWeight: '600' },
  profileTitle: { fontSize: 11, color: C.muted },
  checkmark: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  inputWrap: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.1)', backgroundColor: C.bg, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', color: C.white, fontSize: 13, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
