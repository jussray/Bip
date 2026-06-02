import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSekret } from './_layout';
import BottomNav from '../components/BottomNav';
import { C } from '@constants/theme';

export default function MoreScreen() {
  const { userSide, setUserSide } = useSekret();

  const links = [
    { label: '⚙️ Vibe Lab', to: '/settings' },
    { label: '✨ Bippin2 / Insights', to: '/bippin2' },
    { label: '🌉 Bridge', to: userSide === 'parent' ? '/parentBridge' : '/bridge' },
    { label: '🚨 Comfort Mode', to: '/comfort' },
    { label: '🎙️ Voice Bip', to: '/voiceBip' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>More ✨</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setUserSide(userSide === 'parent' ? 'teen' : 'parent')}
        >
          <Text style={styles.cardText}>
            Switch to {userSide === 'parent' ? 'Teen Side 💜' : 'Parent Side 🌿'}
          </Text>
        </TouchableOpacity>

        {links.map(item => (
          <TouchableOpacity key={item.label} style={styles.card} onPress={() => router.push(item.to as any)}>
            <Text style={styles.cardText}>{item.label}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomNav userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 28, color: C.pinkHot, fontWeight: '800', marginBottom: 18 },
  card: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: { color: C.white, fontSize: 15, fontWeight: '600' },
  arrow: { color: C.muted, fontSize: 22 },
});
