// app/circle.tsx — Enhanced Se'kret Bip Circle Screen
// DO NOT remove existing functionality — this is additive enhancement only

import React, { useMemo, useState } from 'react';
import {
  Text, TouchableOpacity, ScrollView, TextInput,
  View, Image, StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const CLOUD_HAPPY  = require('../assets/images/cloud-happy.png');
const CLOUD_STORMY = require('../assets/images/cloud-stormy.png');

// ── Intervention system — 3 levels ────────────────────────────────────────
const LIGHT_WORDS  = ['tired', 'overwhelmed', 'stressed', 'ugh', 'annoyed', 'frustrated'];
const MEDIUM_WORDS = ['alone', 'sad', 'hurt', 'crying', 'scared', 'anxious', 'panic'];
const HEAVY_WORDS  = ['done', 'empty', 'worthless', 'nobody', 'disappear', 'cant anymore', "can't anymore"];

const getInterventionLevel = (text: string): 'light' | 'medium' | 'heavy' | null => {
  const lower = text.toLowerCase();
  if (HEAVY_WORDS.some(w => lower.includes(w))) return 'heavy';
  if (MEDIUM_WORDS.some(w => lower.includes(w))) return 'medium';
  if (LIGHT_WORDS.some(w => lower.includes(w))) return 'light';
  return null;
};

// ── Bip types ──────────────────────────────────────────────────────────────
const BIP_TYPES = [
  { id: 'thought',  emoji: '📖', label: 'Thought Bip',    sub: 'just say it' },
  { id: 'mood',     emoji: '🎨', label: 'Mood Bip',       sub: 'a vibe, not an essay' },
  { id: 'growth',   emoji: '⭐', label: 'Growth Bip',     sub: 'something small but real' },
  { id: 'cloud',    emoji: '☁️', label: 'Cloud Bip',      sub: 'soft and anonymous' },
  { id: 'latenight',emoji: '🌙', label: 'Late Night Bip', sub: '10pm–6am energy' },
];

// ── Circle energy based on time ────────────────────────────────────────────
const getCircleEnergy = () => {
  const h = new Date().getHours();
  if (h >= 22 || h < 6) return { emoji: '🌙', label: 'Late night thoughts mode' };
  if (h >= 6 && h < 10) return { emoji: '☀️', label: 'Morning check-in energy' };
  if (h >= 10 && h < 17) return { emoji: '💜', label: 'Soft space open' };
  return { emoji: '🔥', label: 'Growth Bips flying rn' };
};

// ── Scrapbook card tints ───────────────────────────────────────────────────
const CARD_TINTS = [
  'rgba(124,58,237,0.08)',
  'rgba(236,72,153,0.06)',
  'rgba(30,41,59,0.9)',
  'rgba(76,29,149,0.1)',
  'rgba(15,23,42,0.95)',
];

const getCardTint = (id: number) => CARD_TINTS[id % CARD_TINTS.length];
const getCardRotation = (id: number) => (id % 2 === 0 ? '-0.8deg' : '0.6deg');

interface CirclePost {
  id: number;
  text: string;
  date: string;
  time: string;
  mood?: string;
  bipType?: string;
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
  const [selectedBipType, setSelectedBipType] = useState('thought');
  const [showBipTypes, setShowBipTypes] = useState(false);
  const insets = useSafeAreaInsets();
  const energy = getCircleEnergy();

  const card = () =>
    [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn = () =>
    [styles.button, { backgroundColor: t.accent }] as any;

  const totalImpact = circlePosts.reduce((t, p) => t + p.reactions.felt + p.reactions.comfort + p.reactions.proud + p.reactions.stay, 0);
  const totalFelt = circlePosts.reduce((s, p) => s + (p.reactions?.felt || 0), 0);
  const totalComfort = circlePosts.reduce((s, p) => s + (p.reactions?.comfort || 0), 0);
  const totalProud = circlePosts.reduce((s, p) => s + (p.reactions?.proud || 0), 0);
  const totalStay = circlePosts.reduce((s, p) => s + (p.reactions?.stay || 0), 0);

  const totalPosts = circlePosts.length;
  const heavyPosts = circlePosts.filter(p => getInterventionLevel(p.text) === 'heavy').length;
  const mediumPosts = circlePosts.filter(p => getInterventionLevel(p.text) === 'medium').length;

  const currentBipType = useMemo(
    () => BIP_TYPES.find(b => b.id === selectedBipType) || BIP_TYPES[0],
    [selectedBipType],
  );

  const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(style);
    } catch {
      void 0;
    }
  };

  const handleSave = async () => {
    await triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    saveCirclePost();
  };

  const handleReact = async (id: number, type: string) => {
    await triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    reactToPost(id, type);
  };

  const handleToggleTypes = async () => {
    await triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setShowBipTypes(s => !s);
  };

  const handlePickType = async (btid: string) => {
    await triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBipType(btid);
    setShowBipTypes(false);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: t.background,
          paddingTop: (Platform.OS === 'ios' ? 60 : 40) + insets.top / 2,
          paddingBottom: 24 + insets.bottom,
        },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.logo} accessibilityRole="header">Bip Circle 🌐</Text>
      <Text style={styles.subtitle}>No likes. No followers. Just real.</Text>

      <View
        style={[styles.energyBadge, { borderColor: t.accent }]}
        accessibilityRole="text"
        accessibilityLabel={`Circle energy: ${energy.label}`}
      >
        <Text style={styles.energyText}>{energy.emoji} {energy.label}</Text>
      </View>

      <Image
        source={CLOUD_HAPPY}
        style={styles.artworkSmall}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessibilityLabel="Soft cloud illustration"
      />

      <View style={card()} accessibilityRole="summary">
        <Text style={styles.cardEmoji}>✨</Text>
        <Text style={styles.cardText}>Your words have real impact.</Text>
        <Text style={styles.entryText}>
          {totalImpact === 0
            ? 'Be the first to drop a Bip tonight.'
            : `Your Bips created ${totalImpact} moments of connection.`}
        </Text>
        <View style={styles.impactGrid}>
          {[
            [totalFelt, 'felt this', '💜'],
            [totalComfort, 'comfort sent', '☁️'],
            [totalProud, 'proud taps', '⭐'],
            [totalStay, 'stayed', '🌙'],
          ].map(([count, label, emoji]) => (
            <View key={String(label)} style={styles.impactPill}>
              <Text style={styles.impactEmoji}>{emoji}</Text>
              <Text style={styles.impactNumber}>{count}</Text>
              <Text style={styles.impactLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.circlePulseCard, { borderColor: t.accent, backgroundColor: t.card }]}>
        <Text style={styles.cultureTitle}>Circle Pulse 💜</Text>
        <Text style={styles.cultureText}>
          {totalPosts === 0
            ? 'Quiet room right now. Be the first voice here.'
            : `${totalPosts} Bips shared here. ${heavyPosts} heavy moments, ${mediumPosts} tender check-ins.`}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.bipTypeSelector, { borderColor: t.accent, backgroundColor: t.card }]}
        onPress={handleToggleTypes}
        accessibilityRole="button"
        accessibilityLabel={`${currentBipType.label}, choose bip type`}
        accessibilityHint="Opens a menu to select the kind of Bip you want to post."
      >
        <Text style={styles.bipTypeSelectorText}>
          {currentBipType.emoji} {currentBipType.label}
        </Text>
        <Text style={[styles.bipTypeSelectorSub, { color: t.soft }]}>
          {currentBipType.sub} {showBipTypes ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {showBipTypes && (
        <View style={[styles.bipTypeMenu, { backgroundColor: t.card, borderColor: t.accent }]}>
          {BIP_TYPES.map(bt => (
            <TouchableOpacity
              key={bt.id}
              style={[
                styles.bipTypeOption,
                selectedBipType === bt.id && { backgroundColor: 'rgba(168,85,247,0.15)' },
              ]}
              onPress={() => handlePickType(bt.id)}
              accessibilityRole="button"
              accessibilityLabel={`${bt.label}`}
              accessibilityHint={bt.sub}
            >
              <Text style={styles.bipTypeOptionEmoji}>{bt.emoji}</Text>
              <View>
                <Text style={styles.bipTypeOptionLabel}>{bt.label}</Text>
                <Text style={styles.bipTypeOptionSub}>{bt.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.composerCard, { backgroundColor: t.card, borderColor: t.accent }]}>
        <Text style={[styles.composerPrompt, { color: t.soft }]}>
          {currentBipType.emoji} Drop a {currentBipType.label}...
        </Text>
        <TextInput
          style={styles.journalInput}
          placeholder="Say it how it feels..."
          placeholderTextColor="#4a3d6b"
          multiline
          value={circlePostText}
          onChangeText={setCirclePostText}
          accessibilityLabel="Circle post composer"
          accessibilityHint="Write one honest thought, mood, or feeling."
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={btn()}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Post anonymous Bip"
          accessibilityHint="Sends your Bip to the circle anonymously."
        >
          <Text style={styles.buttonText}>+ Post Anonymous Bip</Text>
        </TouchableOpacity>
        <Text style={styles.safeText}>
          Anonymous. Protected. Real. No bullying. No exposing people.
        </Text>
      </View>

      <View style={[styles.weeklyTheme, { borderColor: t.accent, backgroundColor: 'rgba(124,58,237,0.08)' }]}>
        <Text style={styles.weeklyThemeLabel}>This week's Circle vibe 💜</Text>
        <Text style={styles.weeklyThemeText}>
          "What's something you stopped pretending was fine?"
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
        circlePosts.map((post) => {
          const level = getInterventionLevel(post.text);
          const bipMeta = BIP_TYPES.find(b => b.id === post.bipType);
          return (
            <View key={post.id}>
              {level === 'heavy' && (
                <View style={[styles.interventionHeavy, { borderColor: t.accent }]}>
                  <Image
                    source={CLOUD_STORMY}
                    style={styles.interventionCloud}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                    accessibilityLabel="Stormy cloud illustration"
                  />
                  <Text style={styles.interventionTitle}>Se'kret is here 💜</Text>
                  <Text style={styles.interventionText}>
                    Let's check in together for a second.
                  </Text>
                  <TouchableOpacity
                    style={[styles.interventionBtn, { backgroundColor: t.accent }]}
                    onPress={() => setScreen('comfort')}
                    accessibilityRole="button"
                    accessibilityLabel="Open Comfort Mode"
                    accessibilityHint="Moves you into a calmer support space."
                  >
                    <Text style={styles.interventionBtnText}>Open Comfort Mode</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={[
                styles.postCard,
                {
                  backgroundColor: getCardTint(post.id),
                  borderColor: t.accent,
                  transform: [{ rotate: getCardRotation(post.id) }],
                },
              ]}>
                <View style={styles.postHeader}>
                  <View style={styles.postHeaderLeft}>
                    <Text style={styles.entryDate}>Anonymous Bip</Text>
                    {bipMeta && (
                      <Text style={[styles.bipTypeBadge, { color: t.soft }]}>
                        {bipMeta.emoji} {bipMeta.label}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.moodBadge}>soft space</Text>
                </View>

                <Text style={styles.postText}>{post.text}</Text>

                {level === 'light' && (
                  <Text style={[styles.lightIntervention, { color: t.soft }]}>
                    ☁️ That sounds like a lot. I'm here if you need me.
                  </Text>
                )}

                <View style={styles.reactionRow}>
                  {[
                    ['💜', 'felt', 'Felt This'],
                    ['☁️', 'comfort', 'Comfort'],
                    ['⭐', 'proud', 'Proud'],
                    ['🌙', 'stay', 'Stayed'],
                  ].map(([emoji, type, label]) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => handleReact(post.id, type)}
                      style={styles.reactionButton}
                      accessibilityRole="button"
                      accessibilityLabel={`${label} reaction`}
                      accessibilityHint={`Send ${label.toLowerCase()} to this Bip.`}
                    >
                      <Text style={styles.reactionText}>
                        {emoji} {post.reactions?.[type as keyof typeof post.reactions] || 0}
                      </Text>
                      <Text style={styles.reactionLabel}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {totalImpact > 0 && (
                  <Text style={styles.impactSentence}>
                    This Bip reached people who needed it.
                  </Text>
                )}

                {level === 'medium' && (
                  <View style={[styles.interventionMedium, { borderColor: t.accent }]}>
                    <Text style={styles.interventionText}>
                      ☁️ You've been carrying a lot. Want Comfort Mode?
                    </Text>
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={() => setScreen('comfort')}
                      accessibilityRole="button"
                      accessibilityLabel="Open Comfort Mode"
                      accessibilityHint="Moves you into a softer support space."
                    >
                      <Text style={styles.smallButtonText}>Open Comfort Mode 💙</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}

      <View style={[styles.cultureCard, { borderColor: t.accent, backgroundColor: t.card }]}>
        <Text style={styles.cultureTitle}>Circle Culture 💜</Text>
        <Text style={styles.cultureText}>No bullying. No exposing people. No going viral.</Text>
        <Text style={styles.cultureText}>Just real Bips. Real connection. Real safety.</Text>
        <View style={styles.culturePhrases}>
          {['Heavy Bip', 'Ghost Bippin', 'Growth Bippin', 'Main Character Bip', 'Protecting My Peace Bip'].map(phrase => (
            <View key={phrase} style={[styles.phraseTag, { borderColor: t.accent }]}>
              <Text style={[styles.phraseText, { color: t.soft }]}>{phrase}</Text>
            </View>
          ))}
        </View>
      </View>

      {BottomNav}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:           { flexGrow: 1, padding: 20 },
  logo:                { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:            { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 12 },
  sectionTitle:        { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },

  energyBadge:         { alignSelf: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16 },
  energyText:          { color: '#c4b5fd', fontSize: 13, fontWeight: '600' },

  card:                { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:           { fontSize: 32, marginBottom: 8 },
  cardText:            { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  entryText:           { color: '#E2E8F0', fontSize: 14, marginBottom: 8, lineHeight: 20 },
  entryDate:           { color: '#94A3B8', fontSize: 12 },

  impactGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  impactPill:          { width: '47%', backgroundColor: '#111827', borderRadius: 16, padding: 12, alignItems: 'center' },
  impactEmoji:         { fontSize: 20, marginBottom: 4 },
  impactNumber:        { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  impactLabel:         { color: '#CBD5E1', fontSize: 11, marginTop: 3 },

  circlePulseCard:     { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },

  bipTypeSelector:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 8 },
  bipTypeSelectorText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bipTypeSelectorSub:  { fontSize: 12 },
  bipTypeMenu:         { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  bipTypeOption:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  bipTypeOptionEmoji:  { fontSize: 22 },
  bipTypeOptionLabel:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  bipTypeOptionSub:    { color: '#94A3B8', fontSize: 12 },

  composerCard:        { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  composerPrompt:      { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  journalInput:        { color: '#fff', padding: 14, borderRadius: 14, minHeight: 110, textAlignVertical: 'top', marginBottom: 14, backgroundColor: 'rgba(0,0,0,0.3)', fontSize: 14, lineHeight: 22 },
  button:              { padding: 16, borderRadius: 18, marginBottom: 8, alignItems: 'center' },
  buttonText:          { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  safeText:            { color: '#94A3B8', fontSize: 11, textAlign: 'center', marginTop: 4 },

  weeklyTheme:         { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },
  weeklyThemeLabel:    { color: '#a855f7', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  weeklyThemeText:     { color: '#f5f0ff', fontSize: 15, fontWeight: '600', fontStyle: 'italic', lineHeight: 22 },

  postCard:            { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 18 },
  postHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  postHeaderLeft:      { flex: 1 },
  bipTypeBadge:        { fontSize: 11, marginTop: 3 },
  moodBadge:           { color: '#fff', fontSize: 11, backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  postText:            { color: '#fff', fontSize: 16, lineHeight: 24, marginBottom: 14, fontWeight: '600' },

  lightIntervention:   { fontSize: 12, fontStyle: 'italic', marginBottom: 10 },

  reactionRow:         { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  reactionButton:      { backgroundColor: '#1E293B', padding: 10, borderRadius: 14, alignItems: 'center', minWidth: '22%' },
  reactionText:        { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  reactionLabel:       { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  impactSentence:      { color: '#CBD5E1', fontSize: 11, marginTop: 12, fontStyle: 'italic', textAlign: 'center' },

  interventionHeavy:   { borderWidth: 1, borderRadius: 20, padding: 20, marginBottom: 12, backgroundColor: 'rgba(13,9,20,0.95)', alignItems: 'center' },
  interventionCloud:   { width: 48, height: 48, marginBottom: 10 },
  interventionTitle:   { color: '#f5f0ff', fontSize: 17, fontWeight: '800', marginBottom: 6 },
  interventionText:    { color: '#c4b5fd', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginBottom: 14, lineHeight: 20 },
  interventionBtn:     { borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12 },
  interventionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  interventionMedium:  { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12, backgroundColor: '#111827' },
  smallButton:         { backgroundColor: '#334155', padding: 10, borderRadius: 12, marginTop: 8 },
  smallButtonText:     { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },

  artworkSmall:        { width: 80, height: 80, alignSelf: 'center', marginBottom: 12 },

  cultureCard:         { borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 8, marginBottom: 20 },
  cultureTitle:        { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cultureText:         { color: '#CBD5E1', fontSize: 13, marginBottom: 4, lineHeight: 19 },
  culturePhrases:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  phraseTag:           { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  phraseText:          { fontSize: 12, fontWeight: '600' },
});
