import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';

const PARENT_PROFILE_KEY = 'parent_profile_data';
const PARENT_CIRCLE_IDENTITY_KEY = 'parent_circle_identity';

type ParentTab = 'identity' | 'circle' | 'memories';
type ParentMemory = { id: string; emoji: string; title: string; body: string; route: string };

function makeParentBipId() {
  return `PBIP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default function ParentProfile() {
  const { parentPagesEntries, parentCirclePosts, parentVoiceNotes, parentMood, parentRoomStyle } = useAppContext();
  const [tab, setTab] = useState<ParentTab>('identity');
  const [name, setName] = useState('');
  const [focus, setFocus] = useState('support');
  const [parentBipId, setParentBipId] = useState(makeParentBipId);
  const [circleName, setCircleName] = useState('');
  const [circleAvatar, setCircleAvatar] = useState('🌿');
  const [supportStyle, setSupportStyle] = useState('listen first');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const [profileRaw, circleRaw] = await Promise.all([
        AsyncStorage.getItem(PARENT_PROFILE_KEY),
        AsyncStorage.getItem(PARENT_CIRCLE_IDENTITY_KEY),
      ]);
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        setName(profile.name ?? '');
        setFocus(profile.focus ?? 'support');
        setParentBipId(profile.parentBipId ?? makeParentBipId());
      }
      if (circleRaw) {
        const circle = JSON.parse(circleRaw);
        setCircleName(circle.circleName ?? '');
        setCircleAvatar(circle.circleAvatar ?? '🌿');
        setSupportStyle(circle.supportStyle ?? 'listen first');
      }
    })();
  }, []);

  const memories = useMemo<ParentMemory[]>(() => {
    const cards: ParentMemory[] = [];

    if (parentPagesEntries.length > 0) {
      cards.push({
        id: 'parent-pages',
        emoji: '📝',
        title: `${parentPagesEntries.length} parent reflection${parentPagesEntries.length === 1 ? '' : 's'}`,
        body: 'Parent Pages owns the full reflection. Profile remembers your showing-up practice.',
        route: '/(parent)/pages',
      });
    }

    if (parentCirclePosts.length > 0) {
      cards.push({
        id: 'parent-circle',
        emoji: '🤝',
        title: `${parentCirclePosts.length} parent Circle moment${parentCirclePosts.length === 1 ? '' : 's'}`,
        body: 'Parent Circle owns the community. Profile remembers your support network.',
        route: '/(parent)/circle',
      });
    }

    if (parentVoiceNotes.length > 0) {
      cards.push({
        id: 'parent-voice',
        emoji: '🎙️',
        title: `${parentVoiceNotes.length} voice reflection${parentVoiceNotes.length === 1 ? '' : 's'}`,
        body: 'Parent Voice Bip owns the spoken reflection. Profile remembers the effort to process before reacting.',
        route: '/(parent)/voicebip',
      });
    }

    if (parentMood) {
      cards.push({
        id: 'parent-mood',
        emoji: '🌙',
        title: `Current support mood: ${parentMood}`,
        body: 'Calm owns the regulation tools. Profile remembers the emotional state you are bringing into support.',
        route: '/(parent)/calm',
      });
    }

    cards.push({
      id: 'parent-room',
      emoji: '🏡',
      title: `${parentRoomStyle} parent room style`,
      body: 'Room is where your support presence starts. Profile remembers the tone of your parent side.',
      route: '/(parent)/room',
    });

    return cards;
  }, [parentPagesEntries.length, parentCirclePosts.length, parentVoiceNotes.length, parentMood, parentRoomStyle]);

  async function save() {
    if (!name.trim()) return;
    await Promise.all([
      AsyncStorage.setItem('parent_profile_done', 'true'),
      AsyncStorage.setItem(PARENT_PROFILE_KEY, JSON.stringify({ name: name.trim(), focus, parentBipId })),
      AsyncStorage.setItem(PARENT_CIRCLE_IDENTITY_KEY, JSON.stringify({
        circleName: circleName.trim() || name.trim(),
        circleAvatar,
        supportStyle: supportStyle.trim(),
      })),
    ]);
    setSaved(true);
  }

  const ready = name.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>PROFILE</Text>
      <Text style={styles.title}>Your parent identity in Bip</Text>
      <Text style={styles.sub}>One parent presence, expressed through support, reflection, community, and repair.</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'identity' && styles.tabActive]} onPress={() => setTab('identity')}>
          <Text style={[styles.tabText, tab === 'identity' && styles.tabTextActive]}>My Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'circle' && styles.tabActive]} onPress={() => setTab('circle')}>
          <Text style={[styles.tabText, tab === 'circle' && styles.tabTextActive]}>Circle Identity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'memories' && styles.tabActive]} onPress={() => setTab('memories')}>
          <Text style={[styles.tabText, tab === 'memories' && styles.tabTextActive]}>Memories</Text>
        </TouchableOpacity>
      </View>

      {tab === 'identity' ? (
        <>
          <View style={styles.identityCard}>
            <Text style={styles.identityLabel}>Parent Bip ID</Text>
            <Text style={styles.bipId}>{parentBipId}</Text>
            <Text style={styles.identityHelp}>This identifies your parent side without opening teen private data.</Text>
          </View>

          <Text style={styles.label}>Your name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="name" placeholderTextColor="#789082" style={styles.input} />

          <Text style={styles.label}>Main focus</Text>
          <View style={styles.grid}>
            {['support', 'listen', 'repair', 'learn'].map(item => (
              <TouchableOpacity key={item} onPress={() => setFocus(item)} style={[styles.card, focus === item && styles.active]}>
                <Text style={styles.cardText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.ownerCard} onPress={() => router.push('/(parent)/bridge' as any)}>
            <Text style={styles.ownerTitle}>🌉 Support lives in Bridge</Text>
            <Text style={styles.ownerText}>Connected teen status, shared moments, and support permissions belong there.</Text>
          </TouchableOpacity>
        </>
      ) : tab === 'circle' ? (
        <>
          <View style={styles.identityCard}>
            <Text style={styles.identityLabel}>How Parent Circle sees you</Text>
            <Text style={styles.identityHelp}>This is your parent community identity, separate from your private support notes.</Text>
          </View>

          <Text style={styles.label}>Parent Circle name</Text>
          <TextInput value={circleName} onChangeText={setCircleName} placeholder="display name" placeholderTextColor="#789082" style={styles.input} />

          <Text style={styles.label}>Circle avatar</Text>
          <View style={styles.emojiRow}>
            {['🌿', '💜', '🌙', '☕', '🫶', '✨'].map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => setCircleAvatar(emoji)} style={[styles.emoji, circleAvatar === emoji && styles.active]}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Support style</Text>
          <TextInput value={supportStyle} onChangeText={setSupportStyle} placeholder="listen first, repair gently..." placeholderTextColor="#789082" style={styles.input} />

          <TouchableOpacity style={styles.ownerCard} onPress={() => router.push('/(parent)/circle' as any)}>
            <Text style={styles.ownerTitle}>🤝 View this identity in Parent Circle</Text>
            <Text style={styles.ownerText}>Parent Circle sees your community identity, not your teen’s private world.</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.identityCard}>
            <Text style={styles.identityLabel}>Support Memories</Text>
            <Text style={styles.identityHelp}>Every parent space creates memories. Profile collects safe markers of how you showed up.</Text>
          </View>
          {memories.map(memory => (
            <TouchableOpacity key={memory.id} style={styles.memoryCard} onPress={() => router.push(memory.route as any)}>
              <Text style={styles.memoryEmoji}>{memory.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerTitle}>{memory.title}</Text>
                <Text style={styles.ownerText}>{memory.body}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      <TouchableOpacity disabled={!ready} onPress={save} style={[styles.button, !ready && styles.disabled]}>
        <Text style={styles.buttonText}>{saved ? 'Saved ✓' : 'Save parent identity'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, backgroundColor: '#08140f', padding: 22, paddingTop: 60, paddingBottom: 40 },
  kicker: { color: '#a7f3d0', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 8 },
  sub: { color: '#b7c9bf', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  tabActive: { backgroundColor: 'rgba(167,243,208,0.16)', borderWidth: 1, borderColor: '#a7f3d0' },
  tabText: { color: '#789082', fontWeight: '800', fontSize: 12 },
  tabTextActive: { color: '#edfdf4' },
  identityCard: { padding: 16, borderRadius: 18, backgroundColor: 'rgba(167,243,208,0.10)', borderWidth: 1, borderColor: '#a7f3d044', marginBottom: 12 },
  identityLabel: { color: '#a7f3d0', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  bipId: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 6 },
  identityHelp: { color: '#b7c9bf', fontSize: 12, lineHeight: 18, marginTop: 6 },
  label: { color: '#edfdf4', fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 16 },
  input: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff18', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', paddingHorizontal: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { minWidth: '31%', minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff14', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 12 },
  active: { borderColor: '#a7f3d0', backgroundColor: 'rgba(167,243,208,0.16)' },
  cardText: { color: '#edfdf4', fontSize: 12, fontWeight: '800' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoji: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff14', backgroundColor: 'rgba(255,255,255,0.04)' },
  emojiText: { fontSize: 22 },
  ownerCard: { padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: '#ffffff18', marginTop: 16 },
  ownerTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  ownerText: { color: '#b7c9bf', fontSize: 12, lineHeight: 18, marginTop: 5 },
  memoryCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: '#ffffff18', marginBottom: 10 },
  memoryEmoji: { fontSize: 24, width: 34, textAlign: 'center' },
  button: { minHeight: 54, borderRadius: 18, backgroundColor: '#a7f3d0', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#062015', fontSize: 15, fontWeight: '900' },
});
