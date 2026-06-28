import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';

const PROFILE_KEY = 'teen_profile_data';
const CIRCLE_IDENTITY_KEY = 'teen_circle_identity';

type Gender = 'girl' | 'boy' | 'other';
type ProfileTab = 'identity' | 'circle';
type ChatMode = 'open' | 'quiet';

const GENDER_OPTIONS: { id: Gender; label: string; desc: string }[] = [
  { id: 'girl', label: '🌸 Girl', desc: 'Start with Raylene' },
  { id: 'boy', label: '⚡ Boy', desc: 'Start with Rylane' },
  { id: 'other', label: '✨ My own way', desc: 'You choose first' },
];

const COMPANION_FOR_GENDER: Record<Gender, 'raylene' | 'rylane'> = {
  girl: 'raylene',
  boy: 'rylane',
  other: 'raylene',
};

const ALL_OPTIONS = [
  { id: 'raylene', label: 'Raylene', desc: 'Warm + protective' },
  { id: 'rylane', label: 'Rylane', desc: 'Direct + loyal' },
  { id: 'cloud', label: 'Cloud', desc: 'Soft + no pressure' },
  { id: 'night', label: 'Night', desc: 'Quiet + steady' },
] as const;

type OptionId = (typeof ALL_OPTIONS)[number]['id'];

function makeBipId() {
  return `BIP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default function TeenProfile() {
  const { setSelectedSekret } = useAppContext();
  const [tab, setTab] = useState<ProfileTab>('identity');
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [choice, setChoice] = useState<OptionId>('raylene');
  const [bipId, setBipId] = useState(makeBipId);
  const [circleName, setCircleName] = useState('');
  const [circleAvatar, setCircleAvatar] = useState('💜');
  const [supportPreference, setSupportPreference] = useState('just listen');
  const [chatMode, setChatMode] = useState<ChatMode>('quiet');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const [profileRaw, circleRaw] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(CIRCLE_IDENTITY_KEY),
      ]);
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        setName(profile.name ?? '');
        setPronouns(profile.pronouns ?? '');
        setGender(profile.gender ?? null);
        setChoice(profile.choice ?? 'raylene');
        setBipId(profile.bipId ?? makeBipId());
      }
      if (circleRaw) {
        const circle = JSON.parse(circleRaw);
        setCircleName(circle.circleName ?? '');
        setCircleAvatar(circle.circleAvatar ?? '💜');
        setSupportPreference(circle.supportPreference ?? 'just listen');
        setChatMode(circle.chatMode === 'open' ? 'open' : 'quiet');
      }
    })();
  }, []);

  function pickGender(g: Gender) {
    setGender(g);
    setChoice(COMPANION_FOR_GENDER[g]);
  }

  async function saveProfile() {
    if (!name.trim() || !gender) return;
    await Promise.all([
      AsyncStorage.setItem('teen_profile_done', 'true'),
      AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({
        name: name.trim(),
        pronouns: pronouns.trim(),
        choice,
        gender,
        bipId,
      })),
      AsyncStorage.setItem(CIRCLE_IDENTITY_KEY, JSON.stringify({
        circleName: circleName.trim() || name.trim(),
        circleAvatar,
        supportPreference: supportPreference.trim(),
        chatMode,
      })),
    ]);
    setSelectedSekret(choice === 'raylene' ? 'soft' : choice);
    setSaved(true);
  }

  const ready = name.trim().length > 0 && gender !== null;

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>PROFILE</Text>
      <Text style={styles.title}>Your identity across Bip</Text>
      <Text style={styles.sub}>One identity, expressed differently in each space.</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'identity' && styles.tabActive]} onPress={() => setTab('identity')}>
          <Text style={[styles.tabText, tab === 'identity' && styles.tabTextActive]}>My Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'circle' && styles.tabActive]} onPress={() => setTab('circle')}>
          <Text style={[styles.tabText, tab === 'circle' && styles.tabTextActive]}>Circle Identity</Text>
        </TouchableOpacity>
      </View>

      {tab === 'identity' ? (
        <>
          <View style={styles.identityCard}>
            <Text style={styles.identityLabel}>Your Bip ID</Text>
            <Text style={styles.bipId}>{bipId}</Text>
            <Text style={styles.identityHelp}>Use this to connect safely without exposing your real name.</Text>
          </View>

          <Text style={styles.label}>Name or nickname</Text>
          <TextInput value={name} onChangeText={setName} placeholder="nickname" placeholderTextColor="#7f7487" style={styles.input} />

          <Text style={styles.label}>Pronouns</Text>
          <TextInput value={pronouns} onChangeText={setPronouns} placeholder="optional" placeholderTextColor="#7f7487" style={styles.input} />

          <Text style={styles.label}>You are</Text>
          <View style={styles.grid}>
            {GENDER_OPTIONS.map(g => (
              <TouchableOpacity key={g.id} onPress={() => pickGender(g.id)} style={[styles.card, gender === g.id && styles.active]}>
                <Text style={styles.cardText}>{g.label}</Text>
                <Text style={styles.cardDesc}>{g.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, styles.labelSpaced]}>First Se'kret</Text>
          <View style={styles.grid}>
            {ALL_OPTIONS.map(item => (
              <TouchableOpacity key={item.id} onPress={() => setChoice(item.id)} style={[styles.card, choice === item.id && styles.active]}>
                <Text style={styles.cardText}>{item.label}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.ownerLinks}>
            <TouchableOpacity style={styles.ownerCard} onPress={() => router.push('/(teen)/bippin2' as any)}>
              <Text style={styles.ownerTitle}>🌱 Growth lives in Bippin 2</Text>
              <Text style={styles.ownerText}>Streaks, rewards, milestones, achievements, and growth history.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ownerCard} onPress={() => router.push('/(teen)/bridge' as any)}>
              <Text style={styles.ownerTitle}>🌉 Support lives in Bridge</Text>
              <Text style={styles.ownerText}>Parent connection, sharing permissions, and support history.</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.identityCard}>
            <Text style={styles.identityLabel}>How Circle sees you</Text>
            <Text style={styles.identityHelp}>This is separate from your private account identity.</Text>
          </View>

          <Text style={styles.label}>Circle name</Text>
          <TextInput value={circleName} onChangeText={setCircleName} placeholder="anonymous display name" placeholderTextColor="#7f7487" style={styles.input} />

          <Text style={styles.label}>Circle avatar</Text>
          <View style={styles.emojiRow}>
            {['💜', '🌙', '☁️', '🌟', '🍃', '🫶'].map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => setCircleAvatar(emoji)} style={[styles.emoji, circleAvatar === emoji && styles.active]}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>How should Crew support you?</Text>
          <TextInput value={supportPreference} onChangeText={setSupportPreference} placeholder="just listen, send memes, check in tomorrow..." placeholderTextColor="#7f7487" style={styles.input} />

          <Text style={styles.label}>Availability</Text>
          <View style={styles.grid}>
            {(['open', 'quiet'] as ChatMode[]).map(mode => (
              <TouchableOpacity key={mode} onPress={() => setChatMode(mode)} style={[styles.card, chatMode === mode && styles.active]}>
                <Text style={styles.cardText}>{mode === 'open' ? '💬 Open to chats' : '🌙 Quiet mode'}</Text>
                <Text style={styles.cardDesc}>{mode === 'open' ? 'Crew can check in' : 'Low-pressure presence'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.ownerCard} onPress={() => router.push('/(teen)/circle' as any)}>
            <Text style={styles.ownerTitle}>👥 View this identity in Circle</Text>
            <Text style={styles.ownerText}>Your Crew sees only what you choose to share.</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity disabled={!ready} onPress={saveProfile} style={[styles.button, !ready && styles.disabled]}>
        <Text style={styles.buttonText}>{saved ? 'Saved ✓' : 'Save my Bip identity'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, backgroundColor: '#0d0820', padding: 22, paddingTop: 60, paddingBottom: 40 },
  kicker: { color: '#c4b5fd', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 8 },
  sub: { color: '#a99fb1', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  tabActive: { backgroundColor: 'rgba(196,181,253,0.18)', borderWidth: 1, borderColor: '#c4b5fd' },
  tabText: { color: '#7f7487', fontWeight: '800' },
  tabTextActive: { color: '#eee7f2' },
  identityCard: { padding: 16, borderRadius: 18, backgroundColor: 'rgba(196,181,253,0.10)', borderWidth: 1, borderColor: '#c4b5fd44', marginBottom: 12 },
  identityLabel: { color: '#c4b5fd', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  bipId: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 6 },
  identityHelp: { color: '#a99fb1', fontSize: 12, lineHeight: 18, marginTop: 6 },
  label: { color: '#eee7f2', fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 16 },
  labelSpaced: { marginTop: 24 },
  input: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff18', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', paddingHorizontal: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', minHeight: 64, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff14', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: 10 },
  active: { borderColor: '#c4b5fd', backgroundColor: 'rgba(196,181,253,0.16)' },
  cardText: { color: '#eee7f2', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  cardDesc: { color: '#7f7487', fontSize: 10, marginTop: 3, textAlign: 'center' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoji: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff14', backgroundColor: 'rgba(255,255,255,0.04)' },
  emojiText: { fontSize: 22 },
  ownerLinks: { gap: 10, marginTop: 22 },
  ownerCard: { padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: '#ffffff18', marginTop: 12 },
  ownerTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  ownerText: { color: '#a99fb1', fontSize: 12, lineHeight: 18, marginTop: 5 },
  button: { minHeight: 54, borderRadius: 18, backgroundColor: '#c4b5fd', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#160b24', fontSize: 15, fontWeight: '900' },
});
