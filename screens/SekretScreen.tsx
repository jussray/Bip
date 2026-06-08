// screens/SekretScreen.tsx
// Se'kret Bip — Talk with Se'kret
//
// Additional fixes (2026-06-03 audit pass 2):
//   FIX-A — sekretMessage / setSekretMessage moved to internal state
//            index.tsx never declared these as state — passing undefined would crash
//            the TextInput value prop and silently break the send flow.
//            They don't need to persist across screens, so internal is correct.
//   FIX-B — selectedSekret extra prop removed from interface
//            index.tsx passes it but interface didn't include it — unused. Cleaned up.
//
// Props interface now matches EXACTLY what index.tsx passes:
//   <SekretScreen
//     t={t}
//     currentSekret={currentSekret}
//     mood={mood}
//     selectedProfile={selectedSekret}
//     setSelectedProfile={setSelectedSekret}
//     userSide={userSide}
//     setScreen={setScreen}
//     BottomNav={nav}
//   />
// (The extra selectedSekret={selectedSekret} in index.tsx is harmless — ignored by React)

import React, { useState } from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  TextInput, View, StyleSheet, Platform, Alert,
} from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

// ── Profiles (keep in sync with index.tsx SEKRET_PROFILES) ─────────────────
const SEKRET_PROFILES: Record<string, any> = {
  soft:   { name: "Se'kret",       emoji: '🌸', title: 'Soft Big Sis',        vibe: 'Warm, expressive, protective, and real.',        greeting: "Hey love. I'm here. Tell me what's on your mind." },
  rylane: { name: 'Rylane',        emoji: '⚡', title: 'Loyal Bro',           vibe: 'Quiet loyalty. Keeps it real. Never talks down.', greeting: "Aight, I'm here. What's been heavy?" },
  cloud:  { name: "Cloud Se'kret", emoji: '☁️', title: 'Quiet Comfort',       vibe: 'Soft, calm, low-pressure presence.',             greeting: "No pressure. We can just sit here for a minute." },
  night:  { name: "Night Se'kret", emoji: '🌙', title: 'Late-Night Listener', vibe: 'Minimal words, calm energy, safe space.',        greeting: "I'm here. You don't gotta explain perfectly." },
};

// ── Props ──────────────────────────────────────────────────────────────────
// FIX-A: sekretMessage / setSekretMessage removed from interface (moved internal)
// FIX-B: selectedSekret removed (not needed — selectedProfile serves this role)
interface SekretScreenProps {
  t:                  Record<string, any>;
  mood:               string;
  currentSekret:      Record<string, any> | null;
  selectedProfile:    string;
  setSelectedProfile: (key: string) => void;
  userSide:           'teen' | 'parent';
  setScreen:          (screen: string) => void;
  BottomNav:          React.ReactNode;
}

export function SekretScreen({
  t, mood, currentSekret,
  selectedProfile, setSelectedProfile, userSide, setScreen, BottomNav,
}: SekretScreenProps) {

  // FIX-A: internal state — no longer a prop
  const [sekretMessage,    setSekretMessage]    = useState('');

  // Internal reply + typing state (unchanged)
  const [sekretReply,    setSekretReply]    = useState('');
  const [isSekretTyping, setIsSekretTyping] = useState(false);
  const [lastSent,       setLastSent]       = useState('');

  // Fix A3: safe profile fallback if currentSekret is null
  const profile = currentSekret ?? SEKRET_PROFILES[selectedProfile] ?? SEKRET_PROFILES.soft;

  const card = (extra?: object) => [styles.card, { backgroundColor: t.card, borderColor: t.accent }, extra] as any;
  const btn  = ()                => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  // Local send handler
  const handleSend = async () => {
    const text = sekretMessage.trim();
    if (!text) return;

    setLastSent(text);
    setSekretMessage('');
    setIsSekretTyping(true);
    setSekretReply('');

    if (!BASE_URL) {
      setTimeout(() => {
        setIsSekretTyping(false);
        setSekretReply(profile.greeting);
      }, 1200);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/sekret`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, mood, profile: selectedProfile }),
      });
      const data = await res.json();
      setIsSekretTyping(false);
      setSekretReply(data.reply ?? profile.greeting);
    } catch {
      setIsSekretTyping(false);
      setSekretReply("I'm here. Tell me more when you're ready. 💜");
    }
  };

  // Parent side simplified view
  if (userSide === 'parent') return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.logo}>Se'kret Bridge 💜</Text>
        <Text style={styles.subtitle}>Your teen's safe space. You can reach in with love.</Text>
        <View style={card()}>
          <Text style={[styles.cardText, { color: '#fff' }]}>This is your teen's private space.</Text>
          <Text style={[styles.entryText, { color: '#E2E8F0' }]}>
            Se'kret helps them process emotions safely. You can send a message of support through the Bridge.
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: t.accent, marginTop: 12 }]} onPress={() => setScreen('bridge')}>
            <Text style={styles.buttonText}>Open Bridge 💌</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {BottomNav}
    </View>
  );

  // ── Teen side ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.logo}>Talk with Se'kret 💜</Text>
        <Text style={styles.subtitle}>Your safe space. No pressure. Just real.</Text>

        <View style={card()}>
          <Text style={styles.cardEmoji}>{profile.emoji}</Text>
          <Text style={[styles.cardText, { color: '#fff' }]}>{profile.name}</Text>
          <Text style={[styles.entryText, { color: '#E2E8F0' }]}>{profile.title}</Text>
          <Text style={[styles.entryText, { color: t.soft }]}>{profile.vibe}</Text>
        </View>

        {(lastSent || sekretReply || isSekretTyping) ? (
          <View style={card()}>
            {lastSent ? (
              <Text style={[styles.entryText, { color: '#E2E8F0' }]}>
                You: {lastSent}
              </Text>
            ) : null}
            <Text style={[styles.entryText, { color: t.soft, marginTop: 8 }]}>
              {isSekretTyping
                ? `${profile.name} is typing... ☁️`
                : sekretReply}
            </Text>
          </View>
        ) : (
          <View style={card()}>
            <Text style={[styles.entryText, { color: t.soft }]}>
              {profile.greeting}
            </Text>
          </View>
        )}

        {/* Input — FIX-A: value now uses internal sekretMessage state */}
        <TextInput
          style={[styles.journalInput, { backgroundColor: t.card, borderColor: t.accent, color: '#fff' }]}
          placeholder={`Talk to ${profile.name}...`}
          placeholderTextColor="#94A3B8"
          multiline
          value={sekretMessage}
          onChangeText={setSekretMessage}
        />
        <TouchableOpacity style={btn()} onPress={handleSend}>
          <Text style={styles.buttonText}>Send 💜</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: '#fff' }]}>Choose Your Se'kret</Text>
        <View style={card()}>
          {Object.keys(SEKRET_PROFILES).map(key => (
            <TouchableOpacity
              key={key}
              style={[
                styles.choiceButton,
                selectedProfile === key && { borderColor: t.accent, borderWidth: 2 },
              ]}
              onPress={() => setSelectedProfile(key)}
            >
              <Text style={styles.entryText}>
                {SEKRET_PROFILES[key].emoji} {SEKRET_PROFILES[key].name}
              </Text>
              <Text style={styles.miniText}>{SEKRET_PROFILES[key].title}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {BottomNav}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:           { flex: 1 },
  scroll:         { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  logo:           { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  sectionTitle:   { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },
  card:           { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:      { fontSize: 32, marginBottom: 8 },
  cardText:       { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:      { fontSize: 14, marginBottom: 6, lineHeight: 20 },
  miniText:       { color: '#CBD5E1', fontSize: 12, textAlign: 'center' },
  button:         { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  journalInput:   { padding: 16, borderRadius: 18, minHeight: 130, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1, fontSize: 14, lineHeight: 22 },
  choiceButton:   { backgroundColor: '#1E293B', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
});
