import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AmbientWeatherOverlay } from '@/components/AmbientWeatherOverlay';
import { useAppContext } from '@/context/AppContext';
import { IMAGES } from '@/constants/theme';
import { fetchSekretBrainReply, fetchSekretVoice, type SekretAvatarState, type SekretCharacterId } from '@/utils/api';
import type { JournalEntry } from '@/types';

const AVATARS: Array<{
  id: SekretCharacterId;
  name: string;
  label: string;
  accent: string;
  greeting: string;
}> = [
  { id: 'raylene', name: 'Raylene', label: 'warm + protective', accent: '#f08bc5', greeting: 'Tell me what happened for real.' },
  { id: 'rylane', name: 'Rylane', label: 'direct + loyal', accent: '#76a7ff', greeting: 'Say the part you keep editing.' },
  { id: 'cloud', name: 'Cloud', label: 'soft + no pressure', accent: '#8ed9e7', greeting: 'One word is enough. We can start there.' },
  { id: 'night', name: 'Night', label: 'quiet + steady', accent: '#9a8ee8', greeting: 'You do not have to say much. Just stay.' },
];

const STATE_COPY: Record<SekretAvatarState, string> = {
  neutral: 'right here',
  listening: 'listening',
  thinking: 'thinking with you',
  comforting: 'staying close',
  happy: 'feeling this with you',
  concerned: 'taking this seriously',
  responding: 'talking it through',
};

function normalizeAvatar(value?: string): SekretCharacterId {
  if (value === 'rylane' || value === 'cloud' || value === 'night') return value;
  return 'raylene';
}

function avatarImage(character: SekretCharacterId, state: SekretAvatarState) {
  const map: Record<SekretCharacterId, Record<SekretAvatarState, any>> = {
    raylene: {
      neutral: IMAGES.rayleneNeutral,
      listening: IMAGES.rayleneThinking,
      thinking: IMAGES.rayleneThinking,
      comforting: IMAGES.rayleneWindow,
      happy: IMAGES.rayleneHappy,
      concerned: IMAGES.rayleeneSad,
      responding: IMAGES.rayleneConfident,
    },
    rylane: {
      neutral: IMAGES.rylaneNeutral,
      listening: IMAGES.rylaneThinking,
      thinking: IMAGES.rylaneThinking,
      comforting: IMAGES.rylaneWindow,
      happy: IMAGES.rylaneHappy,
      concerned: IMAGES.rylaneWindow,
      responding: IMAGES.rylaneFullbody,
    },
    cloud: {
      neutral: IMAGES.cloudAvatarNeutral,
      listening: IMAGES.cloudAvatarThinking,
      thinking: IMAGES.cloudAvatarThinking,
      comforting: IMAGES.cloudAvatarWindow,
      happy: IMAGES.cloudAvatarHappy,
      concerned: IMAGES.cloudAvatarWindow,
      responding: IMAGES.cloudAvatarWriting,
    },
    night: {
      neutral: IMAGES.nightNeutral,
      listening: IMAGES.nightListening,
      thinking: IMAGES.nightThinking,
      comforting: IMAGES.nightRelaxed,
      happy: IMAGES.nightHappy,
      concerned: IMAGES.nightProtective,
      responding: IMAGES.nightSoftsmile,
    },
  };
  return map[character][state] ?? map[character].neutral;
}

function inferState(state: SekretAvatarState, mood?: string, tone?: string): SekretAvatarState {
  if (state !== 'neutral') return state;
  const signal = `${mood ?? ''} ${tone ?? ''}`.toLowerCase();
  if (/hope|happy|good|proud|okay/.test(signal)) return 'happy';
  if (/heavy|hurt|sad|numb|worried|safety|concern/.test(signal)) return 'concerned';
  if (/soft|comfort|calm|gentle|quiet/.test(signal)) return 'comforting';
  return 'responding';
}

export default function TeenPagesRoute() {
  const {
    mood,
    journalText,
    setJournalText,
    entries,
    setEntries,
    selectedSekret,
    setSelectedSekret,
    patchJournalEntry,
  } = useAppContext();

  const [activeAvatar, setActiveAvatar] = useState<SekretCharacterId>(() => normalizeAvatar(selectedSekret));
  const [avatarState, setAvatarState] = useState<SekretAvatarState>('neutral');
  const [section, setSection] = useState<'write' | 'memories'>('write');
  const [reply, setReply] = useState('');
  const [audioUri, setAudioUri] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const breathe = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.035, duration: 2300, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 2300, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const avatar = AVATARS.find(item => item.id === activeAvatar) ?? AVATARS[0];
  const avatarEntries = useMemo(
    () => entries.filter(entry => (entry.activeTab || entry.source) === activeAvatar),
    [activeAvatar, entries],
  );

  function chooseAvatar(id: SekretCharacterId) {
    setActiveAvatar(id);
    setSelectedSekret(id);
    setAvatarState('listening');
    setReply('');
    setAudioUri('');
    setSection('write');
  }

  async function saveAndReply() {
    const text = journalText.trim();
    if (!text || saving) return;

    const id = Date.now();
    const newEntry: JournalEntry = {
      id,
      text,
      mood,
      moodTag: mood,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: activeAvatar,
      activeTab: activeAvatar,
      entryMode: 'typed',
      locked: false,
    };

    setEntries(previous => [newEntry, ...previous]);
    setJournalText('');
    setSaving(true);
    setReply('');
    setAudioUri('');
    setAvatarState('thinking');

    try {
      const result = await fetchSekretBrainReply({
        characterId: activeAvatar,
        surface: 'journal',
        userText: text,
        mood,
        parentSharingEnabled: false,
      });
      const nextState = inferState(result.avatarState, mood, result.tone);
      setReply(result.reply);
      setAvatarState(nextState);
      patchJournalEntry(id, { sekretReply: result.reply });
    } finally {
      setSaving(false);
    }
  }

  async function hearReply() {
    if (!reply || voiceLoading) return;
    setVoiceLoading(true);
    try {
      let uri = audioUri;
      if (!uri) {
        const audio = await fetchSekretVoice({ reply, characterId: activeAvatar });
        if (!audio) return;
        uri = `data:${audio.contentType};base64,${audio.audioBase64}`;
        setAudioUri(uri);
      }
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } finally {
      setVoiceLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <AmbientWeatherOverlay />
      <LinearGradient
        colors={['#10091b', '#171024', '#090711']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.kicker, { color: avatar.accent }]}>SE’KRET PAGES</Text>
            <Text style={styles.title}>your space with them</Text>
          </View>
          <View style={styles.privatePill}>
            <Text style={styles.privateText}>private by default</Text>
          </View>
        </View>

        <View style={[styles.hero, { borderColor: `${avatar.accent}55` }]}>
          <LinearGradient
            colors={[`${avatar.accent}24`, 'rgba(255,255,255,0.025)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroName, { color: avatar.accent }]}>{avatar.name}</Text>
            <Text style={styles.heroRole}>{avatar.label}</Text>
            <Text style={styles.heroGreeting}>“{avatar.greeting}”</Text>
            <View style={[styles.statePill, { backgroundColor: `${avatar.accent}22` }]}>
              <View style={[styles.stateDot, { backgroundColor: avatar.accent }]} />
              <Text style={styles.stateText}>{STATE_COPY[avatarState]}</Text>
            </View>
          </View>
          <Animated.View style={[styles.avatarWrap, { transform: [{ scale: breathe }] }]}>
            <Image
              source={avatarImage(activeAvatar, avatarState)}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarRail}
        >
          {AVATARS.map(item => {
            const active = item.id === activeAvatar;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => chooseAvatar(item.id)}
                style={[
                  styles.avatarChip,
                  active && { borderColor: item.accent, backgroundColor: `${item.accent}20` },
                ]}
              >
                <Image source={avatarImage(item.id, active ? avatarState : 'neutral')} style={styles.chipImage} />
                <Text style={[styles.chipName, active && { color: item.accent }]}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.actionRail}>
          <TouchableOpacity
            style={[styles.actionChip, section === 'write' && styles.actionChipActive]}
            onPress={() => setSection('write')}
          >
            <Text style={styles.actionEmoji}>✍️</Text>
            <Text style={styles.actionText}>Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, section === 'memories' && styles.actionChipActive]}
            onPress={() => setSection('memories')}
          >
            <Text style={styles.actionEmoji}>🌸</Text>
            <Text style={styles.actionText}>Memories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/(teen)/voicebip' as any)}>
            <Text style={styles.actionEmoji}>🎙️</Text>
            <Text style={styles.actionText}>Voice Bip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/(teen)/cloudThoughts' as any)}>
            <Text style={styles.actionEmoji}>☁️</Text>
            <Text style={styles.actionText}>Cloud</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/(teen)/s2tell' as any)}>
            <Text style={styles.actionEmoji}>🤫</Text>
            <Text style={styles.actionText}>S2Tell</Text>
          </TouchableOpacity>
        </View>

        {section === 'write' ? (
          <>
            <View style={[styles.journalCard, { borderColor: `${avatar.accent}44` }]}>
              <View style={styles.journalHeader}>
                <View>
                  <Text style={[styles.journalEyebrow, { color: avatar.accent }]}>WRITE WITH {avatar.name.toUpperCase()}</Text>
                  <Text style={styles.journalTitle}>What’s sitting on you?</Text>
                </View>
                <Text style={styles.lockMark}>🔒</Text>
              </View>

              <TextInput
                multiline
                value={journalText}
                onChangeText={setJournalText}
                onFocus={() => setAvatarState('listening')}
                placeholder="Say it exactly how it feels…"
                placeholderTextColor="#83798f"
                style={styles.input}
                textAlignVertical="top"
              />

              <View style={styles.journalFooter}>
                <Text style={styles.privacyNote}>only you can see this unless you choose to share</Text>
                <TouchableOpacity
                  disabled={!journalText.trim() || saving}
                  onPress={saveAndReply}
                  style={[
                    styles.saveButton,
                    { backgroundColor: avatar.accent },
                    (!journalText.trim() || saving) && styles.disabled,
                  ]}
                >
                  <Text style={styles.saveText}>{saving ? 'thinking…' : 'Bip it'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {reply ? (
              <View style={[styles.replyCard, { borderColor: `${avatar.accent}55` }]}>
                <View style={styles.replyTop}>
                  <Text style={[styles.replyName, { color: avatar.accent }]}>{avatar.name}</Text>
                  <TouchableOpacity onPress={hearReply} disabled={voiceLoading} style={styles.hearButton}>
                    <Text style={styles.hearText}>{voiceLoading ? 'loading…' : '▶ hear them'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.replyText}>{reply}</Text>
              </View>
            ) : null}

            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>your pages with {avatar.name}</Text>
              <Text style={styles.historyCount}>{avatarEntries.length}</Text>
            </View>

            {avatarEntries.slice(0, 12).map(entry => (
              <View key={String(entry.id)} style={styles.entryCard}>
                <Text style={styles.entryMeta}>{entry.date} · {entry.time} · {entry.moodTag || entry.mood || 'no mood tag'}</Text>
                <Text style={styles.entryText}>{entry.text}</Text>
                {entry.sekretReply ? (
                  <View style={[styles.miniReply, { borderLeftColor: avatar.accent }]}>
                    <Text style={[styles.miniReplyName, { color: avatar.accent }]}>{avatar.name}</Text>
                    <Text style={styles.miniReplyText}>{entry.sekretReply}</Text>
                  </View>
                ) : null}
              </View>
            ))}

            {avatarEntries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>💜</Text>
                <Text style={styles.emptyText}>Your first page with {avatar.name} will live right here.</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.memoriesWrap}>
            <Text style={styles.memoriesTitle}>your saved moments</Text>
            <Text style={styles.memoriesSub}>Everything meaningful stays together—no separate notebook feeling.</Text>
            {entries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🌸</Text>
                <Text style={styles.emptyText}>Nothing saved yet. Your moments will collect here.</Text>
              </View>
            ) : entries.slice(0, 20).map(entry => (
              <View key={String(entry.id)} style={styles.entryCard}>
                <Text style={styles.entryMeta}>{entry.date} · {entry.time}</Text>
                <Text style={styles.entryText}>{entry.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  scroll: {
    paddingTop: Platform.OS === 'ios' ? 58 : 34,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 25, fontWeight: '800', marginTop: 3 },
  privatePill: { borderWidth: 1, borderColor: '#ffffff20', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  privateText: { color: '#b8afc1', fontSize: 9, fontWeight: '700' },
  hero: {
    minHeight: 235,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 14,
    backgroundColor: 'rgba(20,13,31,0.96)',
  },
  heroCopy: { flex: 1, padding: 20, paddingRight: 0, justifyContent: 'center', zIndex: 2 },
  heroName: { fontSize: 30, fontWeight: '900' },
  heroRole: { color: '#b5aabd', fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginTop: 3 },
  heroGreeting: { color: '#f5eff8', fontSize: 16, lineHeight: 23, marginTop: 16, maxWidth: 180 },
  statePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginTop: 15 },
  stateDot: { width: 7, height: 7, borderRadius: 99 },
  stateText: { color: '#ded5e4', fontSize: 10, fontWeight: '800' },
  avatarWrap: { width: '48%', justifyContent: 'flex-end', alignItems: 'center' },
  avatarImage: { width: '118%', height: 225 },
  avatarRail: { gap: 8, paddingBottom: 14 },
  avatarChip: {
    width: 88,
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff12',
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
  },
  chipImage: { width: 44, height: 45, resizeMode: 'contain' },
  chipName: { color: '#a99fb2', fontSize: 10, fontWeight: '800', marginTop: 2 },
  actionRail: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  actionChip: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffffff12',
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionChipActive: { backgroundColor: 'rgba(255,255,255,0.11)', borderColor: '#ffffff2b' },
  actionEmoji: { fontSize: 17 },
  actionText: { color: '#c9bfce', fontSize: 8, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  journalCard: {
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(24,16,35,0.92)',
    padding: 17,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  },
  journalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  journalEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  journalTitle: { color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 4 },
  lockMark: { fontSize: 14, opacity: 0.75 },
  input: {
    minHeight: 190,
    color: '#f6eff8',
    fontSize: 17,
    lineHeight: 27,
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 14,
    fontFamily: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'sans-serif' }),
  },
  journalFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  privacyNote: { flex: 1, color: '#827889', fontSize: 9, lineHeight: 13 },
  saveButton: { minWidth: 92, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  saveText: { color: '#171018', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.35 },
  replyCard: { borderRadius: 21, borderWidth: 1, backgroundColor: 'rgba(18,12,28,0.96)', padding: 17, marginTop: 12 },
  replyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  replyName: { fontSize: 13, fontWeight: '900', letterSpacing: 0.7 },
  hearButton: { borderRadius: 999, borderWidth: 1, borderColor: '#ffffff1c', paddingHorizontal: 10, paddingVertical: 6 },
  hearText: { color: '#d8cfdf', fontSize: 9, fontWeight: '800' },
  replyText: { color: '#eee7f2', fontSize: 15, lineHeight: 23 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 10 },
  historyTitle: { color: '#efe8f3', fontSize: 14, fontWeight: '900' },
  historyCount: { color: '#867b8d', fontSize: 11 },
  entryCard: { borderRadius: 18, borderWidth: 1, borderColor: '#ffffff10', backgroundColor: 'rgba(255,255,255,0.04)', padding: 15, marginBottom: 10 },
  entryMeta: { color: '#8e8495', fontSize: 9, marginBottom: 7 },
  entryText: { color: '#eee7f1', fontSize: 14, lineHeight: 22 },
  miniReply: { borderLeftWidth: 2, paddingLeft: 11, marginTop: 12 },
  miniReplyName: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginBottom: 4 },
  miniReplyText: { color: '#cfc5d5', fontSize: 12, lineHeight: 19 },
  emptyCard: { borderRadius: 18, borderWidth: 1, borderColor: '#ffffff10', backgroundColor: 'rgba(255,255,255,0.035)', alignItems: 'center', padding: 24 },
  emptyEmoji: { fontSize: 24, marginBottom: 8 },
  emptyText: { color: '#a99fae', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  memoriesWrap: { paddingTop: 3 },
  memoriesTitle: { color: '#fff', fontSize: 21, fontWeight: '900' },
  memoriesSub: { color: '#948a9b', fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 16 },
});
