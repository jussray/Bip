import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';

type Gender = 'girl' | 'boy' | 'other';

const GENDER_OPTIONS: { id: Gender; label: string; desc: string }[] = [
  { id: 'girl', label: '🌸 Girl',      desc: 'Start with Raylene' },
  { id: 'boy',  label: '⚡ Boy',       desc: 'Start with Rylane'  },
  { id: 'other', label: '✨ My own way', desc: 'You choose first'  },
];

const COMPANION_FOR_GENDER: Record<Gender, 'raylene' | 'rylane'> = {
  girl:  'raylene',
  boy:   'rylane',
  other: 'raylene',
};

const ALL_OPTIONS = [
  { id: 'raylene', label: 'Raylene', desc: 'Warm + protective' },
  { id: 'rylane',  label: 'Rylane',  desc: 'Direct + loyal'    },
  { id: 'cloud',   label: 'Cloud',   desc: 'Soft + no pressure' },
  { id: 'night',   label: 'Night',   desc: 'Quiet + steady'    },
] as const;

type OptionId = (typeof ALL_OPTIONS)[number]['id'];

export default function TeenProfile() {
  const { setSelectedSekret } = useAppContext();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [choice, setChoice] = useState<OptionId>('raylene');

  function pickGender(g: Gender) {
    setGender(g);
    setChoice(COMPANION_FOR_GENDER[g]);
  }

  async function finish() {
    await AsyncStorage.setItem('teen_profile_done', 'true');
    await AsyncStorage.setItem('teen_profile_data', JSON.stringify({ name: name.trim(), choice, gender }));
    setSelectedSekret(choice === 'raylene' ? 'soft' : choice);
    router.replace('/(teen)/room');
  }

  const ready = name.trim().length > 0 && gender !== null;

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>PROFILE</Text>
      <Text style={styles.title}>Make this side yours</Text>
      <Text style={styles.sub}>Pick what this space should remember for you.</Text>

      <Text style={styles.label}>Name or nickname</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="nickname"
        placeholderTextColor="#7f7487"
        style={styles.input}
      />

      <Text style={styles.label}>You are</Text>
      <View style={styles.grid}>
        {GENDER_OPTIONS.map(g => (
          <TouchableOpacity
            key={g.id}
            onPress={() => pickGender(g.id)}
            style={[styles.card, gender === g.id && styles.active]}
          >
            <Text style={styles.cardText}>{g.label}</Text>
            <Text style={styles.cardDesc}>{g.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, styles.labelSpaced]}>First Se'kret</Text>
      <View style={styles.grid}>
        {ALL_OPTIONS.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setChoice(item.id)}
            style={[styles.card, choice === item.id && styles.active]}
          >
            <Text style={styles.cardText}>{item.label}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        disabled={!ready}
        onPress={finish}
        style={[styles.button, !ready && styles.disabled]}
      >
        <Text style={styles.buttonText}>Enter my room</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { flexGrow: 1, backgroundColor: '#0d0820', padding: 22, paddingTop: 60, paddingBottom: 40 },
  kicker:       { color: '#c4b5fd', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title:        { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 8 },
  sub:          { color: '#a99fb1', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 28 },
  label:        { color: '#eee7f2', fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 16 },
  labelSpaced:  { marginTop: 24 },
  input:        { height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff18', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', paddingHorizontal: 14 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card:         { width: '48%', minHeight: 64, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff14', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: 10 },
  active:       { borderColor: '#c4b5fd', backgroundColor: 'rgba(196,181,253,0.16)' },
  cardText:     { color: '#eee7f2', fontSize: 13, fontWeight: '800' },
  cardDesc:     { color: '#7f7487', fontSize: 10, marginTop: 3 },
  button:       { height: 54, borderRadius: 18, backgroundColor: '#c4b5fd', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  disabled:     { opacity: 0.4 },
  buttonText:   { color: '#160b24', fontSize: 15, fontWeight: '900' },
});
