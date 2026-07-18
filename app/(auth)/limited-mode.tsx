import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useVerificationContext } from '@/context/VerificationContext';

const AVAILABLE = [
  ['📖', 'Pages', 'Write privately and keep your thoughts yours.', '/(teen)/pages'],
  ['🎙️', 'Voice Bip', 'Talk it out without posting anywhere.', '/(teen)/voicebip'],
  ['🌙', 'Calm', 'Use breathing and comfort tools anytime.', '/(teen)/calm'],
  ['💜', 'Companion', 'Talk with your Se’kret companion.', '/(teen)/sekret'],
] as const;

const LOCKED = [
  ['🌐', 'Circle'],
  ['🤝', 'Crew'],
  ['✨', 'Discovery'],
] as const;

export default function LimitedModeScreen() {
  const { verificationState } = useVerificationContext();
  const waiting = verificationState === 'PENDING_PARENT' || verificationState === 'PENDING_TRUSTED_ADULT';

  useEffect(() => {
    if (verificationState === 'UNVERIFIED' || verificationState === 'LIMITED_MODE') {
      router.replace('/(auth)/parent-link-verify');
    }
  }, [verificationState]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#12091f', '#1c1031', '#090711']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>LIMITED MODE</Text>
        <Text style={styles.title}>{waiting ? 'You’re waiting on approval.' : 'Your space is still open.'}</Text>
        <Text style={styles.body}>
          You can keep journaling, talking, and using comfort tools while account verification is being finished.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Available now</Text>
          {AVAILABLE.map(([emoji, title, description, href]) => (
            <TouchableOpacity key={title} style={styles.row} onPress={() => router.push(href)} activeOpacity={0.82}>
              <Text style={styles.emoji}>{emoji}</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowBody}>{description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Unlocks after approval</Text>
          {LOCKED.map(([emoji, title]) => (
            <View key={title} style={styles.lockedRow}>
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={styles.lockedTitle}>{title}</Text>
              <Text style={styles.lock}>🔒</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primary}
          onPress={() => router.push('/(auth)/parent-link-verify')}
          activeOpacity={0.86}
        >
          <Text style={styles.primaryText}>{waiting ? 'View code or check approval' : 'Set up parent or trusted adult'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={() => router.replace('/(teen)/room')}>
          <Text style={styles.secondaryText}>Go to my room</Text>
        </TouchableOpacity>

        <Text style={styles.note}>Safety and support tools stay available in every verification state.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  content: { paddingTop: Platform.OS === 'ios' ? 72 : 48, paddingHorizontal: 22, paddingBottom: 48 },
  kicker: { color: '#a78bfa', fontSize: 11, fontWeight: '900', letterSpacing: 2.4, marginBottom: 14 },
  title: { color: '#fff', fontSize: 34, lineHeight: 40, fontWeight: '900', marginBottom: 14 },
  body: { color: '#c8bdd5', fontSize: 15, lineHeight: 23, marginBottom: 24 },
  card: { backgroundColor: '#ffffff0b', borderWidth: 1, borderColor: '#ffffff12', borderRadius: 22, padding: 16, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#ffffff0d', paddingVertical: 12 },
  lockedRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#ffffff0d' },
  emoji: { width: 36, fontSize: 21 },
  rowText: { flex: 1 },
  rowTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 3 },
  rowBody: { color: '#9f93ad', fontSize: 12, lineHeight: 17 },
  arrow: { color: '#8b5cf6', fontSize: 28, paddingLeft: 8 },
  lockedTitle: { flex: 1, color: '#b9afc5', fontSize: 14, fontWeight: '700' },
  lock: { fontSize: 14 },
  primary: { height: 58, borderRadius: 18, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '900', textAlign: 'center', paddingHorizontal: 12 },
  secondary: { height: 52, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#c4b5fd', fontSize: 14, fontWeight: '700' },
  note: { color: '#655b72', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
});