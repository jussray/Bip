import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type Identity = 'girl' | 'boy' | 'other';
type Companion = 'suhana' | 'sy' | 'cloud' | 'night';

const IDENTITIES: { id: Identity; label: string }[] = [
  { id: 'girl', label: 'Girl' },
  { id: 'boy', label: 'Boy' },
  { id: 'other', label: 'My own way' },
];

const COMPANIONS: { id: Companion; label: string }[] = [
  { id: 'suhana', label: 'Suhana' },
  { id: 'sy', label: 'Sy' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'night', label: 'Night' },
];

export default function IdentityScreen() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [choice, setChoice] = useState<Companion>('suhana');

  function chooseIdentity(next: Identity) {
    setIdentity(next);
    setChoice(next === 'boy' ? 'sy' : 'suhana');
  }

  async function handleNext() {
    if (!identity) return;
    await AsyncStorage.multiSet([
      ['bip_onboarding_gender', identity],
      ['bip_onboarding_companion', choice],
    ]);
    router.push('/(onboarding)/reflection');
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#10091b', '#171024', '#090711']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.step}>3 OF 4</Text>
        <Text style={styles.title}>Make this space feel like you.</Text>
        <Text style={styles.sub}>Pick a starting point. You can change it later in Profile.</Text>

        <Text style={styles.label}>You are</Text>
        <View style={styles.grid}>
          {IDENTITIES.map(item => (
            <TouchableOpacity key={item.id} onPress={() => chooseIdentity(item.id)} style={[styles.card, identity === item.id && styles.active]}>
              <Text style={styles.cardText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Your first Se'kret</Text>
        <View style={styles.grid}>
          {COMPANIONS.map(item => (
            <TouchableOpacity key={item.id} onPress={() => setChoice(item.id)} style={[styles.card, choice === item.id && styles.active]}>
              <Text style={styles.cardText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity disabled={!identity} onPress={handleNext} style={[styles.button, !identity && styles.disabled]}>
          <Text style={styles.buttonText}>Keep going →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  content: { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingHorizontal: 28, paddingBottom: 140 },
  back: { marginBottom: 24 },
  backText: { color: '#7a7089', fontSize: 22 },
  step: { color: '#6d28d9', fontSize: 10, fontWeight: '900', letterSpacing: 2.5, marginBottom: 12 },
  title: { color: '#fff', fontSize: 31, fontWeight: '900', lineHeight: 39, marginBottom: 10 },
  sub: { color: '#8b7fa0', fontSize: 14, lineHeight: 22, marginBottom: 24 },
  label: { color: '#eee7f2', fontSize: 13, fontWeight: '900', marginTop: 18, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '48%', minHeight: 62, borderRadius: 18, borderWidth: 1, borderColor: '#ffffff14', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: 10 },
  active: { borderColor: '#c4b5fd', backgroundColor: 'rgba(196,181,253,0.16)' },
  cardText: { color: '#eee7f2', fontSize: 14, fontWeight: '800' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36, paddingTop: 16, backgroundColor: 'rgba(9,7,17,0.95)' },
  button: { height: 58, borderRadius: 20, backgroundColor: '#6d28d9', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});