// screens/ParentBridgeScreen.tsx
// Se'kret Bip — Parent Bridge Screen (Parent Window)
//
// Phase 1 polish: warmer parent-facing tone (less teen scrapbook),
// soft amber/warm-purple palette, staggered entrance, sent confirmation glow,
// preserves all logic + Supabase-ready fetch.

import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
  Animated,
  StyleSheet,
  Platform,
  Alert,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const BRIDGE_TIPS = [
  'Keep it short and warm. Teens shut down when they feel lectured.',
  'Ask questions instead of giving answers.',
  'Say "I love you" without conditions attached.',
  'Acknowledge their feelings before sharing yours.',
  '"I noticed you seemed stressed. I\'m here if you want to talk." goes a long way.',
  'Presence > advice. Just being there is the whole gift.',
  'Apologize when you got it wrong. That teaches more than any lecture.',
];

const STARTER_PROMPTS = [
  "I'm proud of you, even when I don't say it enough.",
  "You don't have to have it all figured out. Neither do I.",
  'I love you. No strings. No conditions.',
  "I noticed you've been quiet. I'm here whenever you're ready.",
  "You can always come to me. I promise I'll listen first.",
  "I'm rooting for you, always.",
];

interface ParentBridgeScreenProps {
  t:         Record<string, any>;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function ParentBridgeScreen({ t, setScreen, BottomNav }: ParentBridgeScreenProps) {

  const [message,  setMessage]  = useState('');
  const [sent,     setSent]     = useState(false);
  const [sending,  setSending]  = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  // Warm parent palette — amber-cream over deep purple, not teen-scrapbook
  const parentAccent = '#e9b66d';      // warm amber
  const parentSoft   = '#f5e8c8';
  const parentDeep   = '#3a2461';

  // Animations
  const fade1 = useRef(new Animated.Value(0)).current;
  const fade2 = useRef(new Animated.Value(0)).current;
  const fade3 = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stagger = (val: Animated.Value, delay: number) =>
      Animated.timing(val, {
        toValue: 1, duration: 420, delay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      });
    Animated.parallel([stagger(fade1, 0), stagger(fade2, 180), stagger(fade3, 360)]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fade1, fade2, fade3, breath]);

  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const breathOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const cardStyle = (val: Animated.Value) => ({
    opacity: val,
    transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;
    setSending(true);

    try {
      if (BASE_URL) {
        await fetch(`${BASE_URL}/api/bridge/parent`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ message: text }),
        });
      }
      setSent(true);
      setMessage('');
    } catch {
      Alert.alert('Could not send', 'Please try again in a moment.');
    } finally {
      setSending(false);
    }
  };

  const card = (extra?: object) =>
    [styles.card, { backgroundColor: 'rgba(45,28,75,0.88)', borderColor: parentAccent + '66' }, extra] as any;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#2a1850', '#3a2461', '#1f1238']}
        style={StyleSheet.absoluteFill}
      />
      {/* Warm amber wash to differentiate from teen side */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: parentAccent + '0d' }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={cardStyle(fade1)}>
          <Text style={styles.logo}>Parent Window 🌉</Text>
          <Text style={[styles.subtitle, { color: parentSoft }]}>
            Reach in with love. Your teen is on the other side.
          </Text>

          <Animated.View
            style={[
              styles.energyBadge,
              { borderColor: parentAccent, shadowColor: parentAccent, shadowOpacity: 0.5, shadowRadius: 12 },
              { transform: [{ scale: breathScale }], opacity: breathOpacity },
            ]}
          >
            <Text style={[styles.energyText, { color: parentAccent }]}>
              warm · one-way · they choose what to share back
            </Text>
          </Animated.View>

          <View style={card()}>
            <Text style={styles.cardTitle}>What is the Bridge?</Text>
            <Text style={styles.entryText}>
              The Bridge lets you send a short, private message of support to your
              teen's Se'kret space. They'll see it as a gentle note — not a lecture.
              You can't read their journal or conversations. This is one-way warmth.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={cardStyle(fade2)}>
          <View style={card()}>
            <Text style={[styles.cardLabel, { color: parentAccent }]}>Parent Tip 💜</Text>
            <Text style={styles.entryText}>
              {BRIDGE_TIPS[tipIndex % BRIDGE_TIPS.length]}
            </Text>
            <TouchableOpacity
              style={[styles.nextTipBtn, { borderColor: parentAccent }]}
              onPress={() => setTipIndex(i => i + 1)}
            >
              <Text style={[styles.nextTipText, { color: parentSoft }]}>next tip →</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Need a starting point?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
            {STARTER_PROMPTS.map(prompt => (
              <TouchableOpacity
                key={prompt}
                style={[styles.promptChip, { backgroundColor: 'rgba(45,28,75,0.85)', borderColor: parentAccent + '55' }]}
                onPress={() => setMessage(prompt)}
              >
                <Text style={[styles.promptChipText, { color: parentSoft }]}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View style={cardStyle(fade3)}>
          {!sent ? (
            <>
              <Text style={[styles.sectionTitle, { color: '#fff' }]}>Your message</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: 'rgba(45,28,75,0.85)',
                  borderColor: parentAccent + '88',
                  color: '#fff',
                }]}
                placeholder="Write something warm..."
                placeholderTextColor={parentSoft + '88'}
                multiline
                value={message}
                onChangeText={setMessage}
                maxLength={300}
              />
              <Text style={[styles.charCount, { color: parentSoft }]}>{message.length}/300</Text>

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: message.trim() ? parentAccent : 'rgba(60,40,90,0.6)',
                    shadowColor: parentAccent,
                    shadowOpacity: message.trim() ? 0.5 : 0,
                    shadowRadius: 12,
                  },
                ]}
                onPress={handleSend}
                disabled={!message.trim() || sending}
              >
                <Text style={[styles.sendBtnText, { color: message.trim() ? parentDeep : '#fff' }]}>
                  {sending ? 'sending…' : 'send with love 💌'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={card({ padding: 28, alignItems: 'center' })}>
              <Animated.Text style={{ fontSize: 56, marginBottom: 12, transform: [{ scale: breathScale }], opacity: breathOpacity }}>💜</Animated.Text>
              <Text style={styles.cardTitle}>Message sent.</Text>
              <Text style={[styles.entryText, { textAlign: 'center' }]}>
                Your teen will see it as a gentle note in their Se'kret space.
                That small act of love matters more than you know.
              </Text>
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: parentAccent, marginTop: 18, paddingHorizontal: 32 }]}
                onPress={() => setSent(false)}
              >
                <Text style={[styles.sendBtnText, { color: parentDeep }]}>send another</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.ghostBtn, { borderColor: parentAccent + '88' }]}
            onPress={() => setScreen('home')}
          >
            <Text style={[styles.ghostBtnText, { color: parentSoft }]}>← back to room</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>

      {BottomNav}
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#1f1238' },
  scroll:         { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },

  logo:           { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: 0.3 },
  subtitle:       { fontSize: 15, textAlign: 'center', marginBottom: 14, fontStyle: 'italic', lineHeight: 21 },
  energyBadge:    { alignSelf: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 18 },
  energyText:     { fontSize: 12, fontWeight: '600' },

  card:           { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1, shadowOpacity: 0.3, shadowRadius: 12 },
  cardLabel:      { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  cardTitle:      { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 8 },
  entryText:      { fontSize: 14, color: '#f5e8c8', marginBottom: 6, lineHeight: 22 },

  nextTipBtn:     { alignSelf: 'flex-start', marginTop: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  nextTipText:    { fontSize: 12, fontWeight: '600' },

  sectionTitle:   { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },

  promptsScroll:  { marginBottom: 16 },
  promptChip:     { borderWidth: 1, borderRadius: 14, padding: 12, marginRight: 10, maxWidth: 240 },
  promptChipText: { fontSize: 13, lineHeight: 19 },

  input:          { borderWidth: 1, borderRadius: 18, padding: 16, minHeight: 130, textAlignVertical: 'top', fontSize: 14, lineHeight: 22, marginBottom: 6 },
  charCount:      { fontSize: 11, textAlign: 'right', marginBottom: 12 },

  sendBtn:        { padding: 16, borderRadius: 18, alignItems: 'center', marginBottom: 12 },
  sendBtnText:    { fontSize: 16, fontWeight: 'bold' },

  ghostBtn:       { borderWidth: 1, borderRadius: 18, padding: 14, alignItems: 'center', marginBottom: 16 },
  ghostBtnText:   { fontSize: 14, fontWeight: '600' },
});
