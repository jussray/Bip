import React from 'react';
import {
  View, Text, ScrollView, Image,
  TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSekret } from './_layout';
import BottomNav from '../components/BottomNav';
import { C, IMAGES } from '../constants/theme';

export default function ComfortScreen() {
  const { userSide } = useSekret();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.top}>
          <Image source={IMAGES.cloudStormy} style={styles.cloudImg} resizeMode="contain" />
          <Text style={styles.title}>Comfort Mode 🚨</Text>
          <Text style={styles.sub}>When it feels heavy, Bip stays with you.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💙 You are not alone in this moment.</Text>
          <Text style={styles.cardSub}>Take it one step at a time.</Text>
        </View>

        <View style={[styles.card, { flexDirection: 'column' }]}>
          {[
            '1. Put both feet on the floor.',
            '2. Name 3 things you can see.',
            '3. Take one slow breath.',
            '4. Tap Calm if you need to breathe.',
          ].map(step => (
            <Text key={step} style={styles.step}>{step}</Text>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.push('/calm')} style={styles.gradBtn}>
          <LinearGradient colors={['#7c3aed', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
            <Text style={styles.gradBtnText}>🌙 Open Calm Space</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/sekret')} style={styles.talkBtn}>
          <Text style={styles.talkBtnText}>💬 Talk to Se'kret</Text>
        </TouchableOpacity>

      </ScrollView>
      <BottomNav userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 100 },
  top: { alignItems: 'center', marginTop: Platform.OS === 'ios' ? 56 : 40, marginBottom: 20, paddingHorizontal: 20 },
  cloudImg: { width: 120, height: 120, marginBottom: 12 },
  title: { fontSize: 26, color: C.pinkHot, fontStyle: 'italic', fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 12, color: C.muted, marginTop: 4 },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', padding: 18, flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, color: C.white, fontWeight: '600', flex: 1 },
  cardSub: { fontSize: 12, color: C.muted },
  step: { fontSize: 14, color: C.lavender, marginBottom: 10, lineHeight: 20 },
  gradBtn: { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden' },
  gradBtnInner: { padding: 14, alignItems: 'center' },
  gradBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  talkBtn: { marginHorizontal: 16, marginBottom: 12, padding: 14, alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  talkBtnText: { fontSize: 14, color: C.lavender, fontWeight: '600' },
});
