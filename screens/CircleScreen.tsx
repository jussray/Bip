import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  TextInput, View, Image, StyleSheet, Platform,
} from 'react-native';

const CLOUD_HAPPY   = require('../assets/images/cloud-happy.png');
const CLOUD_STORMY  = require('../assets/images/cloud-stormy.png');

const shouldSekretStepIn = (text: string) =>
  ['alone', 'hurt', 'tired', 'done', 'empty', 'cry', 'sad', 'scared', 'anxious', 'panic']
    .some(w => text.toLowerCase().includes(w));

interface CirclePost {
  id: number;
  text: string;
  date: string;
  time: string;
  reactions: { felt: number; comfort: number; proud: number; stay: number };
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
  t, circlePosts, circlePostText, setCirclePostText,
  saveCirclePost, reactToPost, setScreen, BottomNav,
}: CircleScreenProps) {
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn  = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  const totalConnections = circlePosts.reduce(
    (total, post) =>
      total +
      (post.reactions?.felt    || 0) +
      (post.reactions?.comfort || 0) +
      (post.reactions?.proud   || 0) +
      (post.reactions?.stay    || 0),
    0
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Se'kret Circle 🌐</Text>
      <Text style={styles.subtitle}>Community first. Se'kret only steps in when it feels heavy.</Text>

      <Image source={CLOUD_HAPPY} style={styles.artworkSmall} resizeMode="contain" />

      <View style={card()}>
        <Text style={styles.cardEmoji}>🌐</Text>
        <Text style={styles.cardText}>You're not alone here.</Text>
        <Text style={styles.entryText}>Connection Energy: {totalConnections}</Text>
      </View>

      <TextInput
        style={[styles.journalInput, { backgroundColor: t.card, borderColor: t.accent }]}
        placeholder="Post a soft anonymous Bip..."
        placeholderTextColor="#94A3B8"
        multiline
        value={circlePostText}
        onChangeText={setCirclePostText}
      />
      <TouchableOpacity style={btn()} onPress={saveCirclePost}>
        <Text style={styles.buttonText}>+ Post to Circle</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Circle Bips</Text>
      {circlePosts.length === 0 ? (
        <View style={card()}>
          <Text style={styles.entryText}>No Circle Bips yet. Start the vibe softly.</Text>
        </View>
      ) : (
        circlePosts.map(post => (
          <View key={post.id} style={card()}>
            <Text style={styles.entryDate}>Anonymous Bip • {post.date} • {post.time}</Text>
            <Text style={styles.cardText}>{post.text}</Text>

            <View style={styles.reactionRow}>
              {[['💜', 'felt'], ['☁️', 'comfort'], ['⭐', 'proud'], ['🌙', 'stay']].map(([e, type]) => (
                <TouchableOpacity key={type} onPress={() => reactToPost(post.id, type)} style={styles.reactionButton}>
                  <Text style={styles.reactionText}>{e} {post.reactions?.[type as keyof typeof post.reactions] || 0}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {shouldSekretStepIn(post.text) && (
              <View style={[styles.card, { marginTop: 14, backgroundColor: '#111827', borderColor: t.accent }]}>
                <Image source={CLOUD_STORMY} style={styles.artworkSmall} resizeMode="contain" />
                <Text style={styles.entryText}>☁️ Se'kret noticed this might be heavy.</Text>
                <Text style={styles.miniText}>"You don't have to hold everything by yourself tonight."</Text>
                <TouchableOpacity style={[styles.smallButton, { marginTop: 10 }]} onPress={() => setScreen('comfort')}>
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
  container:      { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:           { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  sectionTitle:   { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },
  card:           { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:      { fontSize: 32, marginBottom: 8 },
  cardText:       { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:      { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  entryDate:      { color: '#94A3B8', fontSize: 12, marginBottom: 8 },
  miniText:       { color: '#CBD5E1', fontSize: 12, textAlign: 'center' },
  button:         { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  journalInput:   { color: '#fff', padding: 16, borderRadius: 18, minHeight: 130, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1 },
  smallButton:    { backgroundColor: '#334155', padding: 11, borderRadius: 14, marginTop: 8 },
  smallButtonText:{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  reactionRow:    { flexDirection: 'row', marginTop: 12, justifyContent: 'space-around', flexWrap: 'wrap', gap: 6 },
  reactionButton: { backgroundColor: '#1E293B', padding: 9, borderRadius: 12 },
  reactionText:   { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  artworkSmall:   { width: 80, height: 80, alignSelf: 'center', marginTop: 8 },
});
