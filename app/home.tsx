import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Se’kret Bip 💜</Text>
      <Text style={styles.subtitle}>your space. your voice. always you.</Text>

      <View style={styles.card}>
        <Text style={styles.greeting}>Good evening, Raylene 🌙</Text>
        <Text style={styles.message}>You made it through today. I’m proud of you.</Text>
      </View>

      <Text style={styles.question}>How’s your heart right now?</Text>

      <View style={styles.moods}>
        {['awful', 'sad', 'meh', 'okay', 'good', 'amazing'].map((mood) => (
          <TouchableOpacity key={mood} style={styles.mood}>
            <Text style={styles.moodEmoji}>☁️</Text>
            <Text style={styles.moodText}>{mood}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.question}>What would you like to do?</Text>

      <View style={styles.actions}>
        {['Write It Out', 'Voice Bip', 'Calm Me', 'Circle'].map((item) => (
          <TouchableOpacity key={item} style={styles.action}>
            <Text style={styles.actionText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090014',
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    color: '#ff4df3',
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: '#ff00dd',
    textShadowRadius: 18,
  },
  subtitle: {
    color: '#f5b3ff',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  card: {
    borderWidth: 1,
    borderColor: '#9b2cff',
    backgroundColor: 'rgba(80, 0, 120, 0.35)',
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
  },
  greeting: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#f2c8ff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  question: {
    color: '#ff8df7',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 14,
  },
  moods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  mood: {
    width: 95,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#8f2cff',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 0, 40, 0.8)',
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodText: {
    color: '#fff',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  action: {
    width: 140,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff38df',
    backgroundColor: 'rgba(255, 0, 200, 0.13)',
  },
  actionText: {
    color: '#ffd6ff',
    fontWeight: '700',
    textAlign: 'center',
  },
});