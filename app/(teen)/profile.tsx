import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';

const OPTIONS = [
  { id: 'raylene', label: 'Star' },
  { id: 'rylane', label: 'Rylane' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'night', label: 'Night' },
] as const;

type OptionId = (typeof OPTIONS)[number]['id'];

export default function TeenProfile() {
  const { setSelectedSekret } = useAppContext();
  const [name, setName] = useState('');
  const [choice, setChoice] = useState<OptionId>('raylene');

  async function finish() {
    await AsyncStorage.setItem('teen_profile_done', 'true');
    await AsyncStorage.setItem('teen_profile_data', JSON.stringify({ name: name.trim(), choice }));
    setSelectedSekret(choice === 'raylene' ? 'soft' : choice);
    router.replace('/(teen)/room');
  }

  const ready = name.trim().length > 0;

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>PROFILE</Text>
      <Text style={styles.title}>Make this side yours</Text>
      <Text style={styles.sub}>Pick what this space should remember for you.</Text>
      <Text style={styles.label}>Name or nickname</Text>
      <TextInput value={name} onChangeText={setName} placeholder="nickname" placeholderTextColor="#7f7487" style={styles.input} />
      <Text style={styles.label}>First Se'kret</Text>
      <View style={styles.grid}>
        {OPTIONS.map(item => (
          <TouchableOpacity key={item.id} onPress={() => setChoice(item.id)} style={[styles.card, choice === item.id && styles.active]}>
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity disabled={!ready} onPress={finish} style={[styles.button, !ready && styles.disabled]}>
        <Text style={styles.buttonText}>Enter my room</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0820', padding: 22, justifyContent: 'center' },
  kicker: { color: '#c4b5fd', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 8 },
  sub: { color: '#a99fb1', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 28 },
  label: { color: '#eee7f2', fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 16 },
  input: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff18', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', paddingHorizontal: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff14', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  active: { borderColor: '#c4b5fd', backgroundColor: 'rgba(196,181,253,0.16)' },
  cardText: { color: '#eee7f2', fontSize: 12, fontWeight: '800' },
  button: { height: 54, borderRadius: 18, backgroundColor: '#c4b5fd', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#160b24', fontSize: 15, fontWeight: '900' },
});
