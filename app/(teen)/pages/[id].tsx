// app/(teen)/pages/[id].tsx
// SE'KRET PAGES — Entry Detail
// Full entry view: text, media, sekretReply, voice playback, pin toggle.

import React, { useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import { fetchSekretVoice, type SekretCharacterId } from '@/utils/api';

const COMPANION_META: Record<string, { label: string; accent: string; emoji: string; avatarId: SekretCharacterId }> = {
  raylene: { label: 'Raylene', accent: '#f08bc5', emoji: '💜', avatarId: 'raylene' },
  rylane:  { label: 'Rylane',  accent: '#76a7ff', emoji: '⚡',  avatarId: 'rylane'  },
  cloud:   { label: 'Cloud',   accent: '#8ed9e7', emoji: '☁️', avatarId: 'cloud'   },
  night:   { label: 'Night',   accent: '#9a8ee8', emoji: '🌙', avatarId: 'night'   },
  me:      { label: 'Me',      accent: '#b8a9c9', emoji: '🪞', avatarId: 'raylene' },
  oracle:  { label: 'Oracle',  accent: '#c7b87a', emoji: '🔮', avatarId: 'raylene' },
};

export default function EntryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, patchJournalEntry } = useAppContext();

  const entry = entries.find(e => String(e.id) === id);

  const companion = entry
    ? (COMPANION_META[(entry.activeTab || entry.source) ?? ''] ?? {
        label: 'Pages', accent: '#b8a9c9', emoji: '📄', avatarId: 'raylene' as SekretCharacterId,
      })
    : null;

  const [voiceLoading, setVoiceLoading] = useState(false);
  const audioCache = useRef<Record<string, string>>({});

  async function playReply() {
    if (!entry?.sekretReply || !companion || voiceLoading) return;
    setVoiceLoading(true);
    try {
      const key = String(entry.id);
      let uri = audioCache.current[key];
      if (!uri) {
        const audio = await fetchSekretVoice({
          reply: entry.sekretReply,
          characterId: companion.avatarId,
        });
        if (!audio) return;
        uri = `data:${audio.contentType};base64,${audio.audioBase64}`;
        audioCache.current[key] = uri;
      }
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } finally {
      setVoiceLoading(false);
    }
  }

  function togglePin() {
    if (!entry) return;
    patchJournalEntry(entry.id, { pinned: !entry.pinned });
  }

  if (!entry || !companion) {
    return (
      <View style={s.root}>
        <LinearGradient colors={['#10091b', '#090711']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={s.safe} edges={['top']}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Text style={s.backBtnText}>‹</Text>
            </TouchableOpacity>
          </View>
          <View style={s.notFound}>
            <Text style={s.notFoundText}>Entry not found.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#10091b', '#171024', '#090711']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={[s.companionBadge, { backgroundColor: `${companion.accent}20`, borderColor: `${companion.accent}40` }]}>
            <Text style={s.companionEmoji}>{companion.emoji}</Text>
            <Text style={[s.companionLabel, { color: companion.accent }]}>{companion.label}</Text>
          </View>
          <View style={s.headerActions}>
            {entry.locked ? <Text style={s.lockIndicator}>🔒</Text> : null}
            <TouchableOpacity onPress={togglePin} style={s.pinBtn}>
              <Text style={s.pinBtnText}>{entry.pinned ? '📌' : '📍'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Date / time */}
          <Text style={s.dateTime}>{entry.date} at {entry.time}</Text>

          {/* Mood tag */}
          {entry.moodTag ? (
            <View style={s.moodTagWrap}>
              <Text style={[s.moodTag, { color: companion.accent, borderColor: `${companion.accent}40` }]}>
                #{entry.moodTag}
              </Text>
            </View>
          ) : null}

          {/* Media */}
          {entry.imageUri ? (
            <Image
              source={{ uri: entry.imageUri }}
              style={s.media}
              resizeMode="cover"
            />
          ) : null}

          {/* Entry text */}
          {entry.text ? (
            <View style={s.textCard}>
              <Text style={s.entryText}>{entry.text}</Text>
            </View>
          ) : null}

          {/* Se'kret reply */}
          {entry.sekretReply ? (
            <View style={[s.replyCard, { borderColor: `${companion.accent}25` }]}>
              <Text style={[s.replyLabel, { color: companion.accent }]}>
                {companion.emoji} {companion.label} said
              </Text>
              <Text style={s.replyText}>{entry.sekretReply}</Text>
              <TouchableOpacity
                onPress={playReply}
                disabled={voiceLoading}
                style={[s.hearBtn, { borderColor: `${companion.accent}40` }]}
              >
                <Text style={[s.hearBtnText, { color: companion.accent }]}>
                  {voiceLoading ? 'loading…' : '▶ hear this'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Pin hint */}
          <TouchableOpacity onPress={togglePin} style={s.pinHint}>
            <Text style={s.pinHintText}>
              {entry.pinned ? '📌 Pinned — tap to unpin' : '📍 Tap to pin this entry'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  companionBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  companionEmoji: { fontSize: 13 },
  companionLabel: { fontSize: 11, fontWeight: '800' },
  headerActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockIndicator: { fontSize: 16 },
  pinBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  pinBtnText: { fontSize: 16 },

  scroll: { paddingHorizontal: 16, paddingBottom: 60 },

  dateTime: { color: '#6b607a', fontSize: 11, marginBottom: 10 },

  moodTagWrap: { marginBottom: 12 },
  moodTag: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '800', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },

  media: { width: '100%', height: 220, borderRadius: 18, marginBottom: 14 },

  textCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16, marginBottom: 14 },
  entryText: { color: '#f0eaf4', fontSize: 16, lineHeight: 26 },

  replyCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  replyLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6, marginBottom: 8 },
  replyText: { color: '#cfc5d5', fontSize: 15, lineHeight: 24 },
  hearBtn: { marginTop: 12, alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  hearBtnText: { fontSize: 11, fontWeight: '800' },

  pinHint: { alignSelf: 'center', paddingVertical: 8 },
  pinHintText: { color: '#504660', fontSize: 11 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: '#6b607a', fontSize: 15 },
});
