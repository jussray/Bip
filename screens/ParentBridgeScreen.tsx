import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, Image, StyleSheet, Platform,
} from 'react-native';

const PARENT_DASH_BG = require('../assets/images/parent-dashboard-bg.png');

interface ParentBridgeScreenProps {
  t: Record<string, any>;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function ParentBridgeScreen({ t, setScreen, BottomNav }: ParentBridgeScreenProps) {
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn  = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Parent Bridge 🌿</Text>
      <Text style={styles.subtitle}>Support without spying. Guidance without control.</Text>

      <Image source={PARENT_DASH_BG} style={styles.artworkLarge} resizeMode="contain" />

      <View style={card()}>
        <Text style={styles.cardEmoji}>🌉</Text>
        <Text style={styles.cardText}>Connection over control.</Text>
        <Text style={styles.entryText}>Parent Side gives gentle insight without exposing private teen pages.</Text>
      </View>

      <Text style={styles.sectionTitle}>Today's Support Signal</Text>
      <View style={card()}>
        <Text style={styles.cardEmoji}>☁️</Text>
        <Text style={styles.cardText}>Gentle check-in suggested</Text>
        <Text style={styles.entryText}>Try comfort first, questions second, advice last.</Text>
      </View>

      <Text style={styles.sectionTitle}>Try Saying This</Text>
      <View style={card()}>
        {[
          '"Thank you for trusting me with this."',
          '"Do you want advice, comfort, or listening?"',
          '"You don\'t have to explain it perfectly."',
          '"I\'m here when you\'re ready."',
        ].map(line => (
          <View key={line} style={styles.choiceButton}>
            <Text style={styles.entryText}>{line}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Privacy Promise</Text>
      <View style={card()}>
        <Text style={styles.cardEmoji}>🔒</Text>
        <Text style={styles.cardText}>Private stays private.</Text>
        <Text style={styles.entryText}>Pages, voice bips, and personal posts stay hidden unless the teen chooses to share.</Text>
      </View>

      <TouchableOpacity style={btn()} onPress={() => setScreen('bridge')}>
        <Text style={styles.buttonText}>View Teen Bridge Side 🌉</Text>
      </TouchableOpacity>

      {BottomNav}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:         { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },
  card:         { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:    { fontSize: 32, marginBottom: 8 },
  cardText:     { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:    { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  button:       { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:   { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  choiceButton: { backgroundColor: '#1E293B', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  artworkLarge: { width: '100%', height: 280, marginBottom: 16, borderRadius: 20 },
});
