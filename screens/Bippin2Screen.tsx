import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, Image, StyleSheet, Platform,
} from 'react-native';
import { getMoodEngine } from '@utils/moodEngine';

interface Bippin2ScreenProps {
  t: Record<string, any>;
  mood: string;
  growthPath: string;
  setGrowthPath: (path: string) => void;
  art: Record<string, any>;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function Bippin2Screen({
  t, mood, growthPath, setGrowthPath, art, setScreen, BottomNav,
}: Bippin2ScreenProps) {
  const btn = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  // Growth path selection screen
  if (growthPath === 'preferNotToSay') return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Bippin2 ✨</Text>
      <Text style={styles.subtitle}>Choose your growth space.</Text>
      <View style={styles.choiceHero}><Text style={styles.bigEmoji}>🌱</Text></View>
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.accent }]}>
        <Text style={styles.cardEmoji}>🌱</Text>
        <Text style={styles.cardText}>This space adapts to you.</Text>
        <Text style={styles.entryText}>Pick the version that feels right. You can change it later.</Text>
      </View>
      <TouchableOpacity style={btn()} onPress={() => setGrowthPath('girl')}>
        <Text style={styles.buttonText}>🌙 Womanhood</Text>
      </TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setGrowthPath('boy')}>
        <Text style={styles.buttonText}>⚡ Manhood</Text>
      </TouchableOpacity>
      {BottomNav}
    </ScrollView>
  );

  const isGirl     = growthPath === 'girl';
  const growthHero = isGirl ? require('../assets/images/raylene-fullbody.png') : require('../assets/images/rylane-fullbody.png');
  const growthThink= isGirl ? require('../assets/images/raylene-thinking.png') : require('../assets/images/rylane-thinking.png');
  const growthHappy= isGirl ? require('../assets/images/raylene-happy.png')    : require('../assets/images/rylane-happy.png');

  // getMoodEngine — dynamic room + action based on current mood
  const moodEngine = getMoodEngine(mood);

  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;

  const featureItems: [string, string, () => void][] = isGirl ? [
    ['🩸', 'first period support', () => {}],
    ['🌙', 'cycle wellness',       () => setScreen('periodCalendar')],
    ['💗', 'mood + body check-in', () => {}],
    ['🪷', 'comfort mode',         () => setScreen('comfort')],
    ['☁️', "ask Se'kret",          () => setScreen('sekret')],
    ['🔒', 'private journal',      () => setScreen('pages')],
  ] : [
    ['🧍🏾', 'puberty guide',       () => {}],
    ['💪🏾', 'body changes',        () => {}],
    ['⭐',   'confidence boost',    () => {}],
    ['🧴',   'hygiene + self-care', () => {}],
    ['🧠',   'mind check-in',      () => {}],
    ['🔒',   'private journal',    () => setScreen('pages')],
  ];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <TouchableOpacity style={styles.smallButton} onPress={() => setGrowthPath('preferNotToSay')}>
        <Text style={styles.smallButtonText}>↩️ Change Growth Space</Text>
      </TouchableOpacity>

      <Text style={styles.logo}>{isGirl ? 'Bippin 2 Womanhood 🌙' : 'Bippin 2 Manhood ⚡'}</Text>
      <Text style={styles.subtitle}>{isGirl ? 'growing at your own pace. 💜' : 'growing into yourself. 💙'}</Text>

      <Image source={growthHero} style={styles.artworkLarge} resizeMode="contain" />

      {/* getMoodEngine — dynamic room + action */}
      <View style={[card(), { borderColor: t.accent }]}>
        <Text style={{ color: t.soft, fontSize: 12, marginBottom: 4 }}>{moodEngine.room} {moodEngine.emoji}</Text>
        <Text style={styles.cardText}>{moodEngine.title}</Text>
        <Text style={styles.entryText}>{moodEngine.message}</Text>
        <Text style={[styles.entryText, { color: t.soft, fontStyle: 'italic' }]}>→ {moodEngine.action}</Text>
      </View>

      <View style={styles.duoRow}>
        <View style={[styles.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
          <Text style={styles.cardTitle}>{isGirl ? 'Good night 💜' : 'Good night ⚡'}</Text>
          <Text style={styles.cardText}>
            {isGirl ? "Your body is changing. That's not something to fear or hide." : "Keep building the best version of you. You've got this."}
          </Text>
          <Image source={growthThink} style={styles.artworkSmall} resizeMode="contain" />
        </View>
        <View style={[styles.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
          <Text style={styles.cardTitle}>{isGirl ? 'connection streak' : 'focus streak'}</Text>
          <Text style={styles.bigNumber}>{isGirl ? '7 days' : '9 days'}</Text>
          <Text style={styles.cardText}>{isGirl ? "you're showing up for you." : 'consistency builds confidence.'}</Text>
          <Image source={growthHappy} style={styles.artworkSmall} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.featureGrid}>
        {featureItems.map(([e, l, fn]) => (
          <TouchableOpacity
            key={l}
            style={[styles.featureCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}
            onPress={fn}
          >
            <Text style={styles.featureEmoji}>{e}</Text>
            <Text style={styles.featureText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>{isGirl ? 'mood check-in' : 'mind check-in'}</Text>
        <Text style={styles.cardText}>How are you feeling right now?</Text>
        <View style={styles.moodRow}>
          {(isGirl
            ? ['😊', '🌿', '😴', '🥺', '💗', '🙂']
            : ['🙂', '🌿', '⚡', '😤', '😴', '😌']
          ).map(emoji => (
            <Text key={emoji} style={styles.moodEmoji}>{emoji}</Text>
          ))}
        </View>
      </View>

      <View style={styles.duoRow}>
        <View style={[styles.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
          <Text style={styles.cardTitle}>{isGirl ? 'cycle calendar' : 'goal tracker'}</Text>
          <Text style={styles.cardText}>{isGirl ? 'Track your cycle with ease and privacy.' : 'Small steps. Big future. Track your goals.'}</Text>
          <TouchableOpacity style={styles.smallButton} onPress={() => isGirl && setScreen('periodCalendar')}>
            <Text style={styles.smallButtonText}>{isGirl ? 'view calendar' : 'view goals'}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
          <Text style={styles.cardTitle}>Se'kret says ☁️</Text>
          <Text style={styles.cardText}>
            {isGirl ? "Your body isn't something to hate. It's becoming YOU." : "Confidence isn't loud. It's built quietly every day."}
          </Text>
          <TouchableOpacity style={styles.smallButton} onPress={() => setScreen('sekret')}>
            <Text style={styles.smallButtonText}>talk to Se'kret</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.duoRow}>
        <View style={[styles.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
          <Text style={styles.cardTitle}>{isGirl ? 'first period support' : 'body change spotlight'}</Text>
          <Text style={styles.cardText}>
            {isGirl ? "It's okay to feel scared. You're not alone." : 'Voice changes are normal. It happens at different times for everyone.'}
          </Text>
          <TouchableOpacity style={styles.smallButton}><Text style={styles.smallButtonText}>learn more</Text></TouchableOpacity>
        </View>
        <View style={[styles.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
          <Text style={styles.cardTitle}>{isGirl ? 'comfort tip' : 'quick tip'}</Text>
          <Text style={styles.cardText}>
            {isGirl ? 'Use warmth for cramps, drink water, rest, and be gentle with yourself.' : 'Take care of your body, your mind, and your energy.'}
          </Text>
          <TouchableOpacity style={styles.smallButton}><Text style={styles.smallButtonText}>more tips</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.quoteBox}>
        <Text style={styles.quoteText}>This space is private unless you choose to share it with a trusted adult.</Text>
      </View>

      {BottomNav}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:         { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  card:         { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:    { fontSize: 32, marginBottom: 8 },
  cardText:     { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  cardTitle:    { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  entryText:    { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  button:       { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:   { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  smallButton:  { backgroundColor: '#334155', padding: 11, borderRadius: 14, marginTop: 8 },
  smallButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  moodRow:      { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, gap: 8 },
  moodEmoji:    { fontSize: 28 },
  duoRow:       { flexDirection: 'row', gap: 12, marginBottom: 14 },
  largeCard:    { flex: 1, borderRadius: 20, padding: 14 },
  bigNumber:    { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  featureGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  featureCard:  { width: '47%', borderRadius: 18, padding: 14, alignItems: 'center' },
  featureEmoji: { fontSize: 28, marginBottom: 6 },
  featureText:  { color: '#fff', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  sectionCard:  { backgroundColor: '#1E293B', borderRadius: 20, padding: 18, marginBottom: 15 },
  quoteBox:     { backgroundColor: '#1E293B', padding: 16, borderRadius: 18, marginBottom: 18 },
  quoteText:    { color: '#CBD5E1', fontSize: 14, textAlign: 'center' },
  choiceHero:   { alignItems: 'center', marginBottom: 30 },
  bigEmoji:     { fontSize: 40, marginTop: 8 },
  artworkLarge: { width: '100%', height: 280, marginBottom: 16, borderRadius: 20 },
  artworkSmall: { width: 80, height: 80, alignSelf: 'center', marginTop: 8 },
});
