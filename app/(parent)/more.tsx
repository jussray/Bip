import React from 'react';
import { ImageBackground, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { IMAGES } from '@/constants/theme';
import { routeForSide } from '@/shared/routes';
import { useAppContext } from '@/context/AppContext';

const LINKS = [
  { emoji: '🎙️', label: 'Parent Voice Bip', route: 'voicebip' },
  { emoji: '🌉', label: 'Parent Bridge', route: 'parent-bridge' },
  { emoji: '🌱', label: 'Bippin 2', route: 'parent-growth' },
  { emoji: '🤝', label: 'Connection Hub', route: 'parent-connection' },
  { emoji: '📝', label: 'Parent Pages', route: 'pages' },
  { emoji: '🌙', label: 'Calm Before Replying', route: 'calm' },
  { emoji: '🤝', label: 'Parent Circle', route: 'circle' },
  { emoji: '👤', label: 'Profile', route: 'profile' },
  { emoji: '⚙️', label: 'Settings', route: 'settings' },
];

export default function ParentMoreRoute() {
  const { setUserSide } = useAppContext();

  function open(route: string) {
    router.push(routeForSide('parent', route) as any);
  }

  return (
    <ImageBackground source={IMAGES.parentHomeBg} style={styles.root} resizeMode="cover">
      <LinearGradient
        colors={['rgba(36,16,56,0.68)', 'rgba(22,11,43,0.84)', 'rgba(13,9,20,0.95)']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>Parent More ✨</Text>
        <Text style={styles.subtitle}>Your support doorway: reflect, reset, connect, approve, and repair.</Text>

        <View style={styles.card}>
          <Text style={styles.futureLabel}>PARENT WINDOW</Text>
          <Text style={styles.cardText}>Support without surveillance</Text>
          <Text style={styles.futureBody}>
            These tools mirror the teen side, but use parent-owned notes, approved shares, safe summaries, and support prompts.
          </Text>
        </View>

        {LINKS.map(link => (
          <TouchableOpacity key={link.route} style={styles.button} onPress={() => open(link.route)}>
            <Text style={styles.buttonText}>{link.emoji} {link.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => { setUserSide('teen'); router.push('/(teen)/room' as any); }}
        >
          <Text style={styles.buttonText}>💜 Go to Teen Room</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0914' },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
    ...(Platform.OS === 'web' ? { maxWidth: 520, width: '100%', alignSelf: 'center' as const } : {}),
  },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20, lineHeight: 21 },
  card: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d8b9ef88',
    backgroundColor: 'rgba(30,18,55,0.88)',
  },
  futureLabel: { color: '#d8b9ef', fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  cardText: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  futureBody: { color: '#d7cfdf', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  button: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#7C3AED',
  },
  switchButton: {
    padding: 16,
    borderRadius: 18,
    marginTop: 4,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#4338CA',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
