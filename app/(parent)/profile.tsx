import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function ParentProfile() {
  const [name, setName] = useState('');
  const [focus, setFocus] = useState('support');

  async function finish() {
    await AsyncStorage.setItem('parent_profile_done', 'true');
    await AsyncStorage.setItem('parent_profile_data', JSON.stringify({ name: name.trim(), focus }));
    router.replace('/(parent)/room');
  }

  const ready = name.trim().length > 0;

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>PROFILE</Text>
      <Text style={styles.title}>Set up your side</Text>
      <Text style={styles.sub}>This keeps this side focused and separate.</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="name" placeholderTextColor="#789082" style={styles.input} />

      <Text style={styles.label}>Main focus</Text>
      <View style={styles.grid}>
        {['support', 'listen', 'repair', 'learn'].map(item => (
          <TouchableOpacity key={item} onPress={() => setFocus(item)} style={[styles.card, focus === item && styles.active]}>
            <Text style={styles.cardText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity disabled={!ready} onPress={finish} style={[styles.button, !ready && styles.disabled]}>
        <Text style={styles.buttonText}>Enter room</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08140f', padding: 22, justifyContent: 'center' },
  kicker: { color: '#a7f3d0', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 8 },
  sub: { color: '#b7c9bf', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 28 },
  label: { color: '#edfdf4', fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 16 },
  input: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff18', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', paddingHorizontal: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { minWidth: '31%', minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff14', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 12 },
  active: { borderColor: '#a7f3d0', backgroundColor: 'rgba(167,243,208,0.16)' },
  cardText: { color: '#edfdf4', fontSize: 12, fontWeight: '800' },
  button: { height: 54, borderRadius: 18, backgroundColor: '#a7f3d0', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#062015', fontSize: 15, fontWeight: '900' },
});
