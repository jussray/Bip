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
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AmbientWeatherOverlay } from '../../components/AmbientWeatherOverlay';
import { useAppContext } from '@/context/AppContext';
import { IMAGES } from '@/constants/theme';
import { TEEN_ROUTES } from '@/teen/routes';
import {
  fetchSekretBrainReply,
  fetchSekretVoice,
  type SekretAvatarState,
  type SekretCharacterId,
} from '@/utils/api';
import type { JournalEntry } from '@/types';

const AVATARS = [
  { id: 'raylene', name: 'Raylene', accent: '#f08bc5', vibe: 'warm + protective' },
  { id: 'rylane', name: 'Rylane', accent: '#76a7ff', vibe: 'direct + loyal' },
  { id: 'cloud', name: 'Cloud', accent: '#8ed9e7', vibe: 'soft + no pressure' },
  { id: 'night', name: 'Night', accent: '#9a8ee8', vibe: 'quiet + steady' },
] as const;

function normalizeAvatar(value?: string): SekretCharacterId {
  return value === 'rylane' || value === 'cloud' || value === 'night' ? value : 'raylene';
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
  const [reply, setReply] = useState('');
  const [audioUri, setAudioUri] = useState('');
  const [saving, setSaving] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | undefined>();
  const [mediaType, setMediaType] = useState<'photo' | 'video' | undefined>();
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
  }

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType('photo');
    }
  }

  async function recordVideo() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType('video');
    }
  }

  async function saveAndReply() {
    const text = journalText.trim();
    if ((!text && !mediaUri) || saving) return;

    const id = Date.now();
    const entry: JournalEntry = {
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
      imageUri: mediaUri,
      mediaType,
    };

    setEntries(previous => [entry, ...previous]);
    setJournalText('');
    setReply('');
    setAudioUri('');
    setMediaUri(undefined);
    setMediaType(undefined);
    setSaving(true);
    setAvatarState('thinking');

    try {
      const result = await fetchSekretBrainReply({
        characterId: activeAvatar,
        surface: 'journal',
        userText: text,
        mood,
        parentSharingEnabled: false,
      });
      setReply(result.reply);
      setAvatarState(inferState(result.avatarState, mood, result.tone));
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
      <LinearGradient colors={['#10091b', '#171024', '#090711']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: avatar.accent }]}>SE’KRET PAGES</Text>
            <Text style={styles.title}>your space with them</Text>
          </View>
          <Text style={styles.private}>private by default</Text>
        </View>

        <View style={[styles.hero, { borderColor: `${avatar.accent}55` }]}>
          <LinearGradient colors={[`${avatar.accent}22`, 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroName, { color: avatar.accent }]}>{avatar.name}</Text>
            <Text style={styles.heroVibe}>{avatar.vibe}</Text>
            <Text style={styles.heroLine}>{avatarState === 'thinking' ? 'Give me a second…' : 'I’m right here with you.'}</Text>
          </View>
          <Animated.View style={[styles.avatarWrap, { transform: [{ scale: breathe }] }]}>
            <Image source={avatarImage(activeAvatar, avatarState)} style={styles.avatarImage} resizeMode="contain" />
          </Animated.View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRail}>
          {AVATARS.map(item => {
            const active = item.id === activeAvatar;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => chooseAvatar(item.id)}
                style={[styles.avatarChip, active && { borderColor: item.accent, backgroundColor: `${item.accent}20` }]}
              >
                <Image source={avatarImage(item.id, active ? avatarState : 'neutral')} style={styles.chipImage} />
                <Text style={[styles.chipName, active && { color: item.accent }]}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quick} onPress={() => router.push(TEEN_ROUTES.voiceBip as any)}><Text>🎙️</Text><Text style={styles.quickText}>Voice Bip</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quick} onPress={() => router.push(TEEN_ROUTES.cloud as any)}><Text>☁️</Text><Text style={styles.quickText}>Cloud</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quick} onPress={() => router.push(TEEN_ROUTES.s2tell as any)}><Text>🤫</Text><Text style={styles.quickText}>S2Tell</Text></TouchableOpacity>
        </View>

        <View style={[styles.journal, { borderColor: `${avatar.accent}55` }]}>
          <View style={styles.journalTop}>
            <View>
              <Text style={[styles.journalEyebrow, { color: avatar.accent }]}>WRITE WITH {avatar.name.toUpperCase()}</Text>
              <Text style={styles.journalTitle}>What’s sitting on you?</Text>
            </View>
            <Text>🔒</Text>
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

          {(saving || reply) ? (
            <View style={[styles.inlineReply, { borderColor: `${avatar.accent}45` }]}>
              <View style={styles.inlineReplyTop}>
                <View style={styles.inlineReplyIdentity}>
                  <Image source={avatarImage(activeAvatar, avatarState)} style={styles.inlineAvatar} />
                  <Text style={[styles.inlineName, { color: avatar.accent }]}>{avatar.name}</Text>
                </View>
                {reply ? (
                  <TouchableOpacity onPress={hearReply} disabled={voiceLoading} style={styles.hearButton}>
                    <Text style={styles.hearText}>{voiceLoading ? 'loading…' : '▶ hear them'}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.inlineReplyText}>{saving ? `${avatar.name} is thinking…` : reply}</Text>
            </View>
          ) : null}

          {/* Media row — Video Bip + Photo Scrap */}
          <View style={styles.mediaRow}>
            <TouchableOpacity
              onPress={recordVideo}
              style={[styles.mediaBtn, mediaType === 'video' && { borderColor: avatar.accent, backgroundColor: `${avatar.accent}22` }]}
            >
              <Text style={styles.mediaBtnEmoji}>📹</Text>
              <Text style={styles.mediaBtnLabel}>{mediaType === 'video' ? 'recorded ✓' : 'Video Bip'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={choosePhoto}
              style={[styles.mediaBtn, mediaType === 'photo' && { borderColor: avatar.accent, backgroundColor: `${avatar.accent}22` }]}
            >
              <Text style={styles.mediaBtnEmoji}>🖼️</Text>
              <Text style={styles.mediaBtnLabel}>{mediaType === 'photo' ? 'added ✓' : 'Photo Scrap'}</Text>
            </TouchableOpacity>
          </View>

          {mediaUri ? (
            <TouchableOpacity onPress={() => { setMediaUri(undefined); setMediaType(undefined); }} style={styles.mediaPreviewWrap}>
              {mediaType === 'video' ? (
                <Video
                  source={{ uri: mediaUri }}
                  style={styles.mediaPreview}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isMuted
                />
              ) : (
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              )}
              <Text style={styles.mediaRemove}>✕</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.journalFooter}>
            <Text style={styles.privacyNote}>only you can see this unless you choose to share</Text>
            <TouchableOpacity
              disabled={(!journalText.trim() && !mediaUri) || saving}
              onPress={saveAndReply}
              style={[styles.save, { backgroundColor: avatar.accent }, ((!journalText.trim() && !mediaUri) || saving) && styles.disabled]}
            >
              <Text style={styles.saveText}>{saving ? 'thinking…' : 'Bip 💜'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>your pages with {avatar.name}</Text>
          <Text style={styles.historyCount}>{avatarEntries.length}</Text>
        </View>

        {avatarEntries.slice(0, 12).map(entry => (
          <View key={String(entry.id)} style={styles.entryCard}>
            <Text style={styles.entryMeta}>{entry.date} · {entry.time}</Text>
            {entry.imageUri ? (
              entry.mediaType === 'video' ? (
                <View style={styles.entryVideoThumb}>
                  <Text style={styles.entryVideoIcon}>📹</Text>
                  <Text style={styles.entryVideoLabel}>Video Bip</Text>
                </View>
              ) : (
                <Image source={{ uri: entry.imageUri }} style={styles.entryMedia} />
              )
            ) : null}
            {entry.text ? <Text style={styles.entryText}>{entry.text}</Text> : null}
            {entry.sekretReply ? (
              <View style={[styles.savedReply, { borderLeftColor: avatar.accent }]}>
                <Text style={[styles.savedReplyName, { color: avatar.accent }]}>{avatar.name}</Text>
                <Text style={styles.savedReplyText}>{entry.sekretReply}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  scroll: { paddingTop: Platform.OS === 'ios' ? 58 : 34, paddingHorizontal: 16, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 25, fontWeight: '800', marginTop: 3 },
  private: { color: '#b8afc1', fontSize: 9, borderWidth: 1, borderColor: '#ffffff20', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  hero: { minHeight: 220, borderRadius: 28, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', backgroundColor: 'rgba(20,13,31,0.96)' },
  heroCopy: { flex: 1, padding: 20, justifyContent: 'center' },
  heroName: { fontSize: 30, fontWeight: '900' },
  heroVibe: { color: '#b7adbe', fontSize: 11, fontWeight: '800', marginTop: 4 },
  heroLine: { color: '#f1ebf4', fontSize: 15, lineHeight: 22, marginTop: 18 },
  avatarWrap: { width: '48%', justifyContent: 'flex-end', alignItems: 'center' },
  avatarImage: { width: '118%', height: 215 },
  avatarRail: { gap: 8, paddingVertical: 14 },
  avatarChip: { width: 88, minHeight: 76, borderRadius: 18, borderWidth: 1, borderColor: '#ffffff12', backgroundColor: 'rgba(255,255,255,0.035)', alignItems: 'center', justifyContent: 'center', padding: 7 },
  chipImage: { width: 44, height: 45, resizeMode: 'contain' },
  chipName: { color: '#a99fb2', fontSize: 10, fontWeight: '800' },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  quick: { flex: 1, minHeight: 54, borderRadius: 15, borderWidth: 1, borderColor: '#ffffff12', backgroundColor: 'rgba(255,255,255,0.035)', alignItems: 'center', justifyContent: 'center' },
  quickText: { color: '#c9bfce', fontSize: 9, fontWeight: '800', marginTop: 3 },
  journal: { borderRadius: 24, borderWidth: 1, backgroundColor: 'rgba(24,16,35,0.95)', padding: 17 },
  journalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  journalEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  journalTitle: { color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 4 },
  input: { minHeight: 175, color: '#f6eff8', fontSize: 17, lineHeight: 27, paddingTop: 20, paddingBottom: 14, paddingHorizontal: 0 },
  inlineReply: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14, marginBottom: 14 },
  inlineReplyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inlineReplyIdentity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineAvatar: { width: 34, height: 34, resizeMode: 'contain' },
  inlineName: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  inlineReplyText: { color: '#eee7f2', fontSize: 15, lineHeight: 23 },
  hearButton: { borderRadius: 999, borderWidth: 1, borderColor: '#ffffff1c', paddingHorizontal: 10, paddingVertical: 6 },
  hearText: { color: '#d8cfdf', fontSize: 9, fontWeight: '800' },
  journalFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  privacyNote: { flex: 1, color: '#827889', fontSize: 9, lineHeight: 13 },
  mediaRow:         { flexDirection: 'row', gap: 8, marginBottom: 10 },
  mediaBtn:         { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff14', backgroundColor: 'rgba(255,255,255,0.04)', paddingVertical: 10, alignItems: 'center', gap: 4 },
  mediaBtnEmoji:    { fontSize: 18 },
  mediaBtnLabel:    { color: '#a99fb2', fontSize: 10, fontWeight: '700' },
  mediaPreviewWrap: { marginBottom: 10, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  mediaPreview:     { width: '100%', height: 140, borderRadius: 12, resizeMode: 'cover' },
  mediaRemove:      { position: 'absolute', top: 6, right: 8, color: '#fff', fontSize: 14, fontWeight: '900', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 },
  save: { minWidth: 98, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  saveText: { color: '#171018', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.35 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 10 },
  historyTitle: { color: '#efe8f3', fontSize: 14, fontWeight: '900' },
  historyCount: { color: '#867b8d', fontSize: 11 },
  entryCard: { borderRadius: 18, borderWidth: 1, borderColor: '#ffffff10', backgroundColor: 'rgba(255,255,255,0.04)', padding: 15, marginBottom: 10 },
  entryMeta: { color: '#8e8495', fontSize: 9, marginBottom: 7 },
  entryMedia: { width: '100%', height: 130, borderRadius: 10, resizeMode: 'cover', marginBottom: 8 },
  entryVideoThumb: { width: '100%', height: 80, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 8, flexDirection: 'row', gap: 8 },
  entryVideoIcon: { fontSize: 20 },
  entryVideoLabel: { color: '#a99fb2', fontSize: 12, fontWeight: '700' },
  entryText: { color: '#eee7f1', fontSize: 14, lineHeight: 22 },
  savedReply: { borderLeftWidth: 2, paddingLeft: 11, marginTop: 12 },
  savedReplyName: { fontSize: 9, fontWeight: '900', marginBottom: 4 },
  savedReplyText: { color: '#cfc5d5', fontSize: 12, lineHeight: 19 },
});
