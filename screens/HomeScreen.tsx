import React, { useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BottomNav } from '@components/BottomNav';
import { MOODS, HOME_MESSAGES, THEME_PACKS, SEKRET_PROFILES } from '@constants/theme';

interface HomeScreenProps {
  theme: string;
  mood: string;
  setMood: (mood: string) => void;
  setScreen: (screen: string) => void;
  userSide: 'teen' | 'parent';
  selectedSekret: string;
  homeMessageIndex: number;
  breatheAnim: Animated.Value;
}

export function HomeScreen({
  theme,
  mood,
  setMood,
  setScreen,
  userSide,
  selectedSekret,
  homeMessageIndex,
  breatheAnim,
}: HomeScreenProps) {
  const t = THEME_PACKS[theme] || THEME_PACKS.neon;
  const currentSekret = SEKRET_PROFILES[selectedSekret];
  const styles = createStyles(t);

  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }];
  const btn = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <StatusBar style="light" />
      {userSide === 'parent' && (
        <View style={styles.parentBadge}>
          <Text style={{ color: '#6EE7B7', fontSize: 12 }}>🌿 PARENT SIDE</Text>
        </View>
      )}
      <Text style={styles.logo}>Se'kret Bip {currentSekret.emoji}</Text>
      <Text style={styles.subtitle}>your space. your voice. always you.</Text>

      <Animated.View style={[styles.cloudWrap, { transform: [{ scale: breatheAnim }] }]}>
        <Text style={{ fontSize: 64 }}>☁️</Text>
      </Animated.View>

      <View style={card()}>
        <Text style={{ color: t.soft, fontSize: 13, marginBottom: 4 }}>
          {currentSekret.name} says...
        </Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 8 }}>
          {HOME_MESSAGES[homeMessageIndex]}
        </Text>
        <Text style={{ color: '#CBD5E1', fontSize: 14 }}>I'm here. Always.</Text>
      </View>

      <Text style={styles.sectionTitle}>How's your heart right now? 💜</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.moodBubble,
              mood === m.id && {
                backgroundColor: t.accent,
                shadowColor: t.accent,
                shadowOpacity: 0.8,
                shadowRadius: 12,
                elevation: 8,
              },
            ]}
            onPress={() => setMood(m.id)}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={card()}>
        <Text style={styles.cardText}>Se'kret sees you 💜</Text>
        <Text style={styles.entryText}>
          {mood === 'Sad'
            ? "Heavy nights don't last forever. I'm right here with you."
            : mood === 'Angry'
            ? "Your feelings make sense. You're safe to let it out here."
            : mood === 'Tired'
            ? "Rest is an act of self-love. You've done enough today."
            : "I read your energy tonight. You're doing better than you think."}
        </Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.smallButton} onPress={() => setScreen('sekret')}>
            <Text style={styles.smallButtonText}>💬 Talk more</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={() => setScreen('calm')}>
            <Text style={styles.smallButtonText}>🌙 Calm me</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions ⚡</Text>
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        {[
          ['✍️', 'Write It Out', 'pages'],
          ['🎙️', 'Voice Bip', 'voiceBip'],
          ['🌙', 'Calm', 'calm'],
          ['🌐', 'Circle', 'circle'],
          ['🌉', 'Bridge', userSide === 'parent' ? 'parentBridge' : 'bridge'],
        ].map(([e, l, to]) => (
          <TouchableOpacity
            key={l}
            style={[styles.smallAction, { backgroundColor: t.card, borderColor: t.accent }]}
            onPress={() => setScreen(to as string)}
          >
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{e}</Text>
            <Text style={styles.smallButtonText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <BottomNav screen="home" setScreen={setScreen} userSide={userSide} />
    </ScrollView>
  );
}

const createStyles = (theme: any) => {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    logo: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: '#CBD5E1',
      textAlign: 'center',
      marginBottom: 20,
    },
    sectionTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      marginTop: 18,
    },
    card: {
      padding: 18,
      borderRadius: 20,
      marginBottom: 16,
      borderWidth: 1,
    },
    cardText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '600',
      marginBottom: 8,
    },
    entryText: {
      color: '#E2E8F0',
      fontSize: 14,
      marginBottom: 6,
      lineHeight: 20,
    },
    button: {
      padding: 16,
      borderRadius: 18,
      marginBottom: 12,
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 14,
    },
    smallButton: {
      backgroundColor: '#334155',
      padding: 11,
      borderRadius: 14,
      marginTop: 8,
    },
    smallButtonText: {
      color: '#fff',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: 13,
    },
    smallAction: {
      flex: 1,
      padding: 12,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
    },
    moodRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 18,
      gap: 8,
    },
    moodBubble: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    moodEmoji: {
      fontSize: 28,
    },
    cloudWrap: {
      alignItems: 'center',
      marginVertical: 16,
    },
    parentBadge: {
      backgroundColor: '#065F46',
      borderRadius: 10,
      padding: 6,
      alignSelf: 'center',
      marginBottom: 10,
    },
  });
};
