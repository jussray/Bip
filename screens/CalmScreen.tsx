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
import { BottomNav } from '@components/BottomNav';
import { THEME_PACKS, COMFORT_MESSAGES } from '@constants/theme';

interface CalmScreenProps {
  theme: string;
  comfortIdx: number;
  setComfortIdx: (idx: number) => void;
  setScreen: (screen: string) => void;
  userSide: 'teen' | 'parent';
  breatheAnim: Animated.Value;
}

export function CalmScreen({
  theme,
  comfortIdx,
  setComfortIdx,
  setScreen,
  userSide,
  breatheAnim,
}: CalmScreenProps) {
  const t = THEME_PACKS[theme] || THEME_PACKS.neon;
  const styles = createStyles(t);

  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }];
  const btn = () => [styles.button, { backgroundColor: t.accent }];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Se'kret Calm 🌙</Text>
      <Text style={styles.subtitle}>Breathe. Reset. Come back to yourself.</Text>

      <View style={card()}>
        <Text style={styles.cardEmoji}>🌙</Text>
        <Text style={styles.cardText}>Your nervous system deserves softness too.</Text>
        <Text style={styles.entryText}>No pressure. Just one small calm moment at a time.</Text>
      </View>

      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: breatheAnim }],
            backgroundColor: t.accent,
            shadowColor: t.accent,
            shadowOpacity: 0.6,
            shadowRadius: 25,
            elevation: 12,
          },
        ]}
      >
        <Text style={styles.circleText}>☁️</Text>
        <Text style={styles.circleTextSmall}>Breathe</Text>
      </Animated.View>

      <View style={card()}>
        <Text style={styles.cardEmoji}>{COMFORT_MESSAGES[comfortIdx].emoji}</Text>
        <Text style={styles.cardText}>{COMFORT_MESSAGES[comfortIdx].text}</Text>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => setComfortIdx((i) => (i + 1) % COMFORT_MESSAGES.length)}
        >
          <Text style={styles.smallButtonText}>Another Calm Thought ✨</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Calm Tools</Text>
      <TouchableOpacity style={btn()} onPress={() => setScreen('mindReset')}>
        <Text style={styles.buttonText}>🌙 7-Min Mind Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setScreen('bodyReset')}>
        <Text style={styles.buttonText}>🫧 7-Min Body Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setScreen('comfort')}>
        <Text style={styles.buttonText}>🚨 Comfort Mode</Text>
      </TouchableOpacity>
      <BottomNav screen="calm" setScreen={setScreen} userSide={userSide} />
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
    cardEmoji: {
      fontSize: 32,
      marginBottom: 8,
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
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
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
    circle: {
      width: 170,
      height: 170,
      borderRadius: 85,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 24,
    },
    circleText: {
      color: '#fff',
      fontSize: 42,
      fontWeight: 'bold',
    },
    circleTextSmall: {
      color: '#fff',
      fontSize: 16,
      marginTop: 6,
      fontWeight: 'bold',
    },
  });
};
