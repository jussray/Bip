import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';

type RoomScreenProps = {
  t: Record<string, any>;
  selectedSekret: string;
  setSelectedSekret: (value: string) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
};

const raylene = require('../assets/images/raylene-fullbody.png');
const rylane = require('../assets/images/rylane-fullbody.png');

export function RoomScreen({
  t,
  selectedSekret,
  setSelectedSekret,
  setScreen,
  BottomNav,
}: RoomScreenProps) {
  const isRylane = selectedSekret === 'rylane';
  const person = isRylane
    ? {
        name: 'Rylane',
        emoji: '⚡',
        image: rylane,
        room: "Rylane's Room",
        line: "Aight. Come in. What we bippin about?",
        vibe: 'loyal cousin energy • headphones • chill window thoughts',
      }
    : {
        name: 'Raylene',
        emoji: '💜',
        image: raylene,
        room: "Raylene's Room",
        line: 'Come sit. Tell me the real version.',
        vibe: 'big sis energy • journal floor • soft purple safety',
      };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Who you bippin with today?</Text>
      <Text style={styles.subtitle}>Room first. Then Bip.</Text>

      <View style={styles.choiceRow}>
        <TouchableOpacity
          style={[
            styles.choiceCard,
            { borderColor: selectedSekret === 'soft' ? t.accent : '#334155' },
          ]}
          onPress={() => setSelectedSekret('soft')}
        >
          <Text style={styles.choiceEmoji}>💜</Text>
          <Text style={styles.choiceName}>Raylene</Text>
          <Text style={styles.choiceText}>protective big sis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.choiceCard,
            { borderColor: selectedSekret === 'rylane' ? t.accent : '#334155' },
          ]}
          onPress={() => setSelectedSekret('rylane')}
        >
          <Text style={styles.choiceEmoji}>⚡</Text>
          <Text style={styles.choiceName}>Rylane</Text>
          <Text style={styles.choiceText}>loyal cousin energy</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.roomCard, { backgroundColor: t.card, borderColor: t.accent }]}>
        <Text style={styles.roomTitle}>{person.emoji} {person.room}</Text>
        <Image source={person.image} style={styles.character} resizeMode="contain" />
        <Text style={styles.quote}>“{person.line}”</Text>
        <Text style={styles.vibe}>{person.vibe}</Text>

        <TouchableOpacity style={[styles.mainButton, { backgroundColor: t.accent }]} onPress={() => setScreen('sekret')}>
          <Text style={styles.mainButtonText}>Drop a Bip with {person.name}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {[
          ['📖', 'Pages', 'pages'],
          ['🎙️', 'Voice Bip', 'voiceBip'],
          ['☁️', 'Cloud Thoughts', 'cloudThoughts'],
          ['🌐', 'Circle', 'circle'],
          ['🌙', 'Comfort', 'comfort'],
          ['⭐', 'Bippin2', 'bippin2'],
        ].map(([emoji, label, target]) => (
          <TouchableOpacity
            key={target}
            style={[styles.actionCard, { backgroundColor: t.card, borderColor: '#334155' }]}
            onPress={() => setScreen(target)}
          >
            <Text style={styles.actionEmoji}>{emoji}</Text>
            <Text style={styles.actionText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>your room. your voice. always you. ♡</Text>

      {BottomNav}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  logo: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  choiceCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  choiceEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  choiceName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  choiceText: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 3,
  },
  roomCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  roomTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  character: {
    width: 190,
    height: 210,
    marginBottom: 6,
  },
  quote: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  vibe: {
    color: '#CBD5E1',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 14,
  },
  mainButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    width: '100%',
  },
  mainButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    color: '#D8B4FE',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
  },
});