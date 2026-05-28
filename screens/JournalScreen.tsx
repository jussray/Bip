import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomNav } from '@components/BottomNav';
import { THEME_PACKS, SEKRET_PROFILES } from '@constants/theme';
import type { JournalEntry } from '@types';

interface JournalScreenProps {
  theme: string;
  selectedSekret: string;
  journalText: string;
  setJournalText: (text: string) => void;
  entries: JournalEntry[];
  mood: string;
  setScreen: (screen: string) => void;
  userSide: 'teen' | 'parent';
  saveEntry: () => void;
}

export function JournalScreen({
  theme,
  selectedSekret,
  journalText,
  setJournalText,
  entries,
  mood,
  setScreen,
  userSide,
  saveEntry,
}: JournalScreenProps) {
  const t = THEME_PACKS[theme] || THEME_PACKS.neon;
  const currentSekret = SEKRET_PROFILES[selectedSekret];
  const styles = createStyles(t);

  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }];
  const btn = () => [styles.button, { backgroundColor: t.accent }];

  const getDynamicTags = () => {
    if (selectedSekret === 'rylane')
      return ['focused', 'mind heavy', 'protecting my peace', 'trying harder', 'locked in', 'building myself'];
    if (selectedSekret === 'soft')
      return ['soft but strong', 'healing', 'trying my best', 'late night thoughts', 'emotional', 'peaceful'];
    if (selectedSekret === 'cloud')
      return ['resting', 'breathing', 'quiet', 'healing', 'calm', 'soft day'];
    return ['good vibes', 'overthinking', 'protecting my peace', 'growing', 'learning myself', 'late night thoughts'];
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Se'kret Pages 💜</Text>
      <Text style={styles.subtitle}>Your thoughts deserve somewhere safe.</Text>

      <View style={card()}>
        <Text style={styles.cardEmoji}>{currentSekret.emoji}</Text>
        <Text style={styles.cardText}>Write freely.</Text>
        <Text style={styles.entryText}>No pressure. No perfect wording. Just honesty.</Text>
      </View>

      <TextInput
        style={[styles.journalInput, { backgroundColor: t.card, borderColor: t.accent }]}
        placeholder="Bip it out softly..."
        placeholderTextColor="#94A3B8"
        multiline
        value={journalText}
        onChangeText={setJournalText}
      />

      <View style={styles.row}>
        <TouchableOpacity style={[styles.smallAction, { backgroundColor: t.card, borderColor: t.accent }]} onPress={() => setScreen('voiceBip')}>
          <Text style={styles.smallButtonText}>🎙️ Voice Bip</Text>
          <Text style={styles.miniText}>30–60 sec</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.smallAction, { backgroundColor: t.card, borderColor: t.accent }]}>
          <Text style={styles.smallButtonText}>📹 Video Bip</Text>
          <Text style={styles.miniText}>30–60 sec</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.smallAction, { backgroundColor: t.card, borderColor: t.accent }]}>
          <Text style={styles.smallButtonText}>🖼️ Photo</Text>
          <Text style={styles.miniText}>optional</Text>
        </TouchableOpacity>
      </View>

      {journalText.trim() ? (
        <View style={card()}>
          <Text style={{ color: t.soft, fontSize: 13, marginBottom: 6 }}>Se'kret is listening... 💜</Text>
          <Text style={styles.entryText}>That sounds heavy. You carry so much and still try to hold it together. You're not alone here.</Text>
          <View style={styles.row}>
            {['💜 that means a lot', '🥺 thank you', '💬 talk more'].map((l) => (
              <TouchableOpacity key={l} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Mood Tags</Text>
      <View style={[styles.moodRow, { flexWrap: 'wrap' }]}>
        {getDynamicTags().map((tag) => (
          <TouchableOpacity key={tag} style={[styles.tagBubble, { backgroundColor: t.card, borderColor: t.accent }]}>
            <Text style={{ color: '#fff', fontSize: 13 }}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={btn()} onPress={saveEntry}>
        <Text style={styles.buttonText}>Save Page 💜</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Saved Pages</Text>
      {entries.length === 0 ? (
        <View style={card()}>
          <Text style={styles.entryText}>No pages yet. Your truth has a place here.</Text>
        </View>
      ) : (
        entries.map((e) => (
          <View key={e.id} style={card()}>
            <Text style={styles.entryDate}>
              {e.date} • {e.time} • {e.mood}
            </Text>
            <Text style={styles.journalSavedText}>"{e.text}"</Text>
          </View>
        ))
      )}
      <BottomNav screen="pages" setScreen={setScreen} userSide={userSide} />
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
    entryDate: {
      color: '#94A3B8',
      fontSize: 12,
      marginBottom: 8,
    },
    journalSavedText: {
      color: '#fff',
      fontSize: 15,
      lineHeight: 24,
      fontStyle: 'italic',
    },
    journalInput: {
      color: '#fff',
      padding: 16,
      borderRadius: 18,
      minHeight: 130,
      textAlignVertical: 'top',
      marginBottom: 16,
      borderWidth: 1,
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
    miniText: {
      color: '#CBD5E1',
      fontSize: 12,
      textAlign: 'center',
    },
    tagBubble: {
      padding: 9,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 8,
      marginRight: 8,
    },
  });
};
