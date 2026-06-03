// app/circle.tsx
import React from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';

const CLOUD_HAPPY = require('../assets/images/cloud-happy.png');
const CLOUD_STORMY = require('../assets/images/cloud-stormy.png');

const heavyWords = [
  'alone',
  'hurt',
  'tired',
  'done',
  'empty',
  'cry',
  'sad',
  'scared',
  'anxious',
  'panic',
  'worthless',
  'nobody',
];

const shouldSekretStepIn = (text: string) =>
  heavyWords.some(word => text.toLowerCase().includes(word));

interface CirclePost {
  id: number;
  text: string;
  date: string;
  time: string;
  mood?: string;
  reactions: {
    felt: number;
    comfort: number;
    proud: number;
    stay: number;
  };
}

interface CircleScreenProps {
  t: Record<string, any>;
  circlePosts: CirclePost[];
  circlePostText: string;
  setCirclePostText: (text: string) => void;
  saveCirclePost: () => void;
  reactToPost: (id: number, type: string) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function CircleScreen({
  t,
  circlePosts,
  circlePostText,
  setCirclePostText,
  saveCirclePost,
  reactToPost,
  setScreen,
  BottomNav,
}: CircleScreenProps) {
  const card = () =>
    [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;

  const btn = () =>
    [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  const totalImpact = circlePosts.reduce(
    (total, post) =>
      total +
      (post.reactions?.felt || 0) +
      (post.reactions?.comfort || 0) +
      (post.reactions?.proud || 0) +
      (post.reactions?.stay || 0),
    0
  );

  const totalFelt = circlePosts.reduce((sum, post) => sum + (post.reactions?.felt || 0), 0);
  const totalComfort = circlePosts.reduce((sum, post) => sum + (post.reactions?.comfort || 0), 0);
  const totalProud = circlePosts.reduce((sum, post) => sum + (post.reactions?.proud || 0), 0);
  const totalStay = circlePosts.reduce((sum, post) => sum + (post.reactions?.stay || 0), 0);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Bip Circles 🌐</Text>
      <Text style={styles.subtitle}>
        Say it how you feel it — safely. No likes. Just real connection.
      </Text>

      <Image source={CLOUD_HAPPY} style={styles.artworkSmall} resizeMode="contain" />

      <View style={card()}>
        <Text style={styles.cardEmoji}>✨</Text>
        <Text style={styles.cardText}>Your Bips have real-life impact.</Text>
        <Text style={styles.entryText}>
          Your words helped create {totalImpact} moments of connection.
        </Text>

        <View style={styles.impactGrid}>
          <View style={styles.impactPill}>
            <Text style={styles.impactNumber}>{totalFelt}</Text>
            <Text style={styles.impactLabel}>felt this</Text>
          </View>
          <View style={styles.impactPill}>
            <Text style={styles.impactNumber}>{totalComfort}</Text>
            <Text style={styles.impactLabel}>comfort sent</Text>
          </View>
          <View style={styles.impactPill}>
            <Text style={styles.impactNumber}>{totalProud}</Text>
            <Text style={styles.impactLabel}>proud taps</Text>
          </View>
          <View style={styles.impactPill}>
            <Text style={styles.impactNumber}>{totalStay}</Text>
            <Text style={styles.impactLabel}>stayed</Text>
          </View>
        </View>
      </View>

      <View style={card()}>
        <Text style={styles.cardText}>Drop a Bip 💜</Text>
        <Text style={styles.entryText}>
          Anonymous. Expressive. Protected. MySpace energy, but safer.
        </Text>

        <TextInput
          style={[styles.journalInput, { backgroundColor: '#111827', borderColor: t.accent }]}
          placeholder="Say it how it feels..."
          placeholderTextColor="#94A3B8"
          multiline
          value={circlePostText}
          onChangeText={setCirclePostText}
        />

        <TouchableOpacity style={btn()} onPress={saveCirclePost}>
          <Text style={styles.buttonText}>+ Post Anonymous Bip</Text>
        </TouchableOpacity>

        <Text style={styles.safeText}>
          No bullying. No exposing people. No unsafe content. Be real, not reckless.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Circle Bips</Text>

      {circlePosts.length === 0 ? (
        <View style={card()}>
          <Text style={styles.entryText}>
            No Bips yet. Be the first soft little chaos starter. 😭💜
          </Text>
        </View>
      ) : (
        circlePosts.map(post => (
          <View key={post.id} style={card()}>
            <View style={styles.postHeader}>
              <Text style={styles.entryDate}>Anonymous Bip</Text>
              <Text style={styles.moodBadge}>soft space</Text>
            </View>

            <Text style={styles.postText}>{post.text}</Text>

            <View style={styles.reactionRow}>
              {[
                ['💜', 'felt', 'Felt'],
                ['☁️', 'comfort', 'Comfort'],
                ['⭐', 'proud', 'Proud'],
                ['🌙', 'stay', 'Stay'],
              ].map(([emoji, type, label]) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => reactToPost(post.id, type)}
                  style={styles.reactionButton}
                >
                  <Text style={styles.reactionText}>
                    {emoji} {post.reactions?.[type as keyof typeof post.reactions] || 0}
                  </Text>
                  <Text style={styles.reactionLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.impactSentence}>
              This Bip reached people who needed it.
            </Text>

            {shouldSekretStepIn(post.text) && (
              <View style={[styles.stepInCard, { borderColor: t.accent }]}>
                <Image source={CLOUD_STORMY} style={styles.artworkSmall} resizeMode="contain" />
                <Text style={styles.entryText}>☁️ Se'kret noticed this might be heavy.</Text>
                <Text style={styles.miniText}>
                  “Nah, you don’t gotta sit with that by yourself.”
                </Text>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => setScreen('comfort')}
                >
                  <Text style={styles.smallButtonText}>Open Comfort Mode 💙</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      {BottomNav}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: '700',
    marginBottom: 8,
  },
  entryText: {
    color: '#E2E8F0',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  safeText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
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
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artworkSmall: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 10,
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  impactPill: {
    width: '47%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  impactNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  impactLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  entryDate: {
    color: '#94A3B8',
    fontSize: 12,
  },
  moodBadge: {
    color: '#fff',
    fontSize: 12,
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  postText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 14,
    fontWeight: '600',
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  reactionButton: {
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: '22%',
  },
  reactionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  reactionLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  impactSentence: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  stepInCard: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  miniText: {
    color: '#CBD5E1',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
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
});