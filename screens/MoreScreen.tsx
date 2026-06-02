import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, StyleSheet, Platform,
} from 'react-native';

interface MoreScreenProps {
  t: Record<string, any>;
  userSide: string;
  setUserSide: (side: string) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function MoreScreen({ t, userSide, setUserSide, setScreen, BottomNav }: MoreScreenProps) {
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn  = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>More ✨</Text>
      <Text style={styles.subtitle}>Settings, growth tools, and extra Bip spaces.</Text>

      <View style={card()}>
        <Text style={styles.cardEmoji}>{userSide === 'parent' ? '🌿' : '💜'}</Text>
        <Text style={styles.cardText}>Current Side: {userSide === 'parent' ? 'Parent Side' : 'Teen Side'}</Text>
        <TouchableOpacity
          style={btn()}
          onPress={() => setUserSide(userSide === 'parent' ? 'teen' : 'parent')}
        >
          <Text style={styles.buttonText}>
            Switch to {userSide === 'parent' ? 'Teen Side' : 'Parent Side'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={btn()} onPress={() => setScreen('settings')}>
        <Text style={styles.buttonText}>⚙️ Vibe Lab</Text>
      </TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setScreen('bippin2')}>
        <Text style={styles.buttonText}>✨ Bippin2 / Insights</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={btn()}
        onPress={() => setScreen(userSide === 'parent' ? 'parentBridge' : 'bridge')}
      >
        <Text style={styles.buttonText}>
          {userSide === 'parent' ? '🌉 Parent Bridge' : '🌉 Bridge'}
        </Text>
      </TouchableOpacity>

      {BottomNav}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:       { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:   { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  card:       { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:  { fontSize: 32, marginBottom: 8 },
  cardText:   { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  button:     { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
