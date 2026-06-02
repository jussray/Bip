import React from 'react';
import {
  Text, ScrollView, View, Image, StyleSheet, Platform,
} from 'react-native';

const CLOUD_STORMY = require('../assets/images/cloud-stormy.png');

interface ComfortScreenProps {
  t: Record<string, any>;
  BottomNav: React.ReactNode;
}

export function ComfortScreen({ t, BottomNav }: ComfortScreenProps) {
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Comfort Mode 🚨</Text>
      <Text style={styles.subtitle}>When it feels heavy, Bip stays with you.</Text>

      <Image source={CLOUD_STORMY} style={styles.artworkMedium} resizeMode="contain" />

      <View style={card()}>
        <Text style={styles.cardEmoji}>💙</Text>
        <Text style={styles.cardText}>You are not alone in this moment.</Text>
      </View>

      <View style={card()}>
        {[
          '1. Put both feet on the floor.',
          '2. Name 3 things you can see.',
          '3. Take one slow breath.',
          '4. Tap Calm if you need to breathe.',
        ].map(step => (
          <Text key={step} style={styles.entryText}>{step}</Text>
        ))}
      </View>

      {BottomNav}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:         { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  card:         { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:    { fontSize: 32, marginBottom: 8 },
  cardText:     { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:    { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  artworkMedium:{ width: '100%', height: 200, marginBottom: 16, borderRadius: 16 },
});
