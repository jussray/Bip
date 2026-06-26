import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { writeCirclePost, loadCircleFeed, syncCircleReaction } from '@/utils/sync';
import { uploadAudioToSupabase } from '../../services/audio/audioUpload';
import { requestMicrophonePermission } from '../../components/audio/RecordingPermissionGate';
import { getSupabase } from '@/utils/supabase';
import type { CirclePost } from '@/context/AppContext';

const REACTION_LABELS: { key: keyof CirclePost['reactions']; emoji: string; label: string }[] = [
  { key: 'felt',    emoji: '💜', label: 'felt this too'     },
  { key: 'comfort', emoji: '☁️', label: 'sending comfort'  },
  { key: 'proud',   emoji: '⭐', label: 'proud of you'     },
  { key: 'stay',    emoji: '🌙', label: 'staying with this' },
];

type FeedTab = 'foryou' | 'new' | 'following' | 'anonymous';
const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: 'foryou',    label: 'For You'   },
  { key: 'new',       label: 'New'       },
  { key: 'following', label: 'Following' },
  { key: 'anonymous', label: 'Anon only' },
];

const MOOD_OPTS = [
  { id: 'heavy',   emoji: '🌧️', label: 'heavy'   },
  { id: 'steady',  emoji: '☁️',  label: 'steady'  },
  { id: 'winning', emoji: '🌟', label: 'winning' },
  { id: 'fun',     emoji: '✨',  label: 'fun'     },
];

const MOOD_COLORS: Record<string, string> = {
  heavy:   '#7dd3fc',
  steady:  '#c4b5fd',
  winning: '#fbbf24',
  fun:     '#fb7185',
};

const PURPLE = '#a855f7';
const MAX_VOICE_SECS = 30;

function defaultReactions(): CirclePost['reactions'] {
  return { felt: 0, comfort: 0, proud: 0, stay: 0 };
}

function normalizeReactions(raw: unknown): CirclePost['reactions'] {
  const r = (raw ?? {}) as Partial<Record<keyof CirclePost['reactions'], number>>;
  return {
    felt:    Number(r.felt ?? 0),
    comfort: Number(r.comfort ?? 0),
    proud:   Number(r.proud ?? 0),
    stay:    Number(r.stay ?? 0),
  };
}

function getPostMood(text: string): { emoji: string; color: string } | null {
  for (const m of MOOD_OPTS) {
    if (text.startsWith(m.emoji + ' ')) return { emoji: m.emoji, color: MOOD_COLORS[m.id] };
  }
  return null;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Mini voice player for feed posts ─────────────────────────────────────────
function VoicePostPlayer({ uri }: { uri: string }) {
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const toggle = async () => {
    try {
      if (playing) {
        await soundRef.current?.pauseAsync();
        setPlaying(false);
      } else {
        if (!soundRef.current) {
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true },
            (status) => {
              if (!status.isLoaded || status.didJustFinish) setPlaying(false);
            },
          );
          soundRef.current = sound;
        } else {
          await soundRef.current.playAsync();
        }
        setPlaying(true);
      }
    } catch {
      setPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  return (
    <TouchableOpacity style={vp.wrap} onPress={toggle} activeOpacity={0.75}>
      <Text style={vp.icon}>{playing ? '⏸' : '▶'}</Text>
      <Text style={vp.label}>{playing ? 'playing…' : 'voice bip'}</Text>
      <View style={vp.bar}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={[vp.barSegment, playing && { opacity: 0.5 + (i % 3) * 0.15 }]} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const vp = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1e0a30', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, borderWidth: 1, borderColor: '#3d1a5e' },
  icon:       { fontSize: 18, color: '#a855f7' },
  label:      { color: '#c4b5fd', fontSize: 12, fontWeight: '700', flex: 1 },
  bar:        { flexDirection: 'row', alignItems: 'center', gap: 2 },
  barSegment: { width: 3, height: 12, backgroundColor: '#7c3aed', borderRadius: 2, opacity: 0.5 },
});

// ── Voice compose (record + preview) ─────────────────────────────────────────
interface VoiceComposeProps {
  onSubmit: (localUri: string, durationSecs: number) => Promise<void>;
  submitting: boolean;
}

function VoiceCompose({ onSubmit, submitting }: VoiceComposeProps) {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = async () => {
    const granted = await requestMicrophonePermission();
    if (!granted) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recordingRef.current = recording;
    setElapsed(0);
    setPhase('recording');
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next >= MAX_VOICE_SECS) stopRecording();
        return next;
      });
    }, 1000);
  };

  const stopRecording = async () => {
    stopTimer();
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (uri) { setLocalUri(uri); setPhase('preview'); }
    } catch {
      setPhase('idle');
    }
  };

  const discard = async () => {
    stopTimer();
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
    setLocalUri(null);
    setElapsed(0);
    setPhase('idle');
  };

  if (phase === 'idle') {
    return (
      <TouchableOpacity style={vc.recordBtn} onPress={startRecording}>
        <Text style={vc.recordBtnIcon}>🎤</Text>
        <Text style={vc.recordBtnText}>tap to record</Text>
        <Text style={vc.recordBtnSub}>up to 30 seconds</Text>
      </TouchableOpacity>
    );
  }

  if (phase === 'recording') {
    return (
      <View style={vc.recordingWrap}>
        <View style={vc.recordingIndicator}>
          <View style={vc.recordingDot} />
          <Text style={vc.recordingLabel}>recording</Text>
          <Text style={vc.timer}>{formatDuration(elapsed)} / {formatDuration(MAX_VOICE_SECS)}</Text>
        </View>
        <TouchableOpacity style={vc.stopBtn} onPress={stopRecording}>
          <Text style={vc.stopBtnText}>stop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // preview phase
  return (
    <View style={vc.previewWrap}>
      <Text style={vc.previewLabel}>🎙 voice bip · {formatDuration(elapsed)}</Text>
      {localUri ? <VoicePostPlayer uri={localUri} /> : null}
      <View style={vc.previewActions}>
        <TouchableOpacity style={vc.discardBtn} onPress={discard}>
          <Text style={vc.discardBtnText}>discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[vc.submitBtn, submitting && vc.submitBtnDisabled]}
          disabled={submitting || !localUri}
          onPress={() => localUri && onSubmit(localUri, elapsed)}
        >
          <Text style={vc.submitBtnText}>{submitting ? 'uploading…' : 'Bip it 💜'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const vc = StyleSheet.create({
  recordBtn:      { alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 20, borderWidth: 1, borderColor: '#3d1a5e', borderRadius: 16, borderStyle: 'dashed', marginBottom: 10 },
  recordBtnIcon:  { fontSize: 28 },
  recordBtnText:  { color: '#c4b5fd', fontSize: 14, fontWeight: '700' },
  recordBtnSub:   { color: '#5a3a78', fontSize: 11 },
  recordingWrap:  { gap: 10, marginBottom: 10 },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  recordingDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f87171' },
  recordingLabel: { color: '#f87171', fontSize: 13, fontWeight: '800' },
  timer:          { color: '#c4b5fd', fontSize: 13 },
  stopBtn:        { alignSelf: 'center', backgroundColor: '#3d1a5e', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  stopBtnText:    { color: '#c4b5fd', fontWeight: '800', fontSize: 13 },
  previewWrap:    { gap: 8, marginBottom: 8 },
  previewLabel:   { color: '#c4b5fd', fontSize: 12, fontWeight: '700' },
  previewActions: { flexDirection: 'row', gap: 10 },
  discardBtn:     { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#3d1a5e' },
  discardBtnText: { color: '#7c5a9e', fontWeight: '700', fontSize: 13 },
  submitBtn:      { flex: 2, alignItems: 'center', paddingVertical: 10, borderRadius: 20, backgroundColor: '#7c3aed' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText:  { color: '#fff', fontWeight: '800', fontSize: 13 },
});

// ── Main Circle Feed ──────────────────────────────────────────────────────────
export function CircleFeed() {
  const { circlePosts, setCirclePosts } = useAppContext();
  const [draft, setDraft]             = useState('');
  const [composeMood, setComposeMood] = useState('');
  const [refreshing, setRefreshing]   = useState(false);
  const [posting, setPosting]         = useState(false);
  const [feedTab, setFeedTab]         = useState<FeedTab>('foryou');
  const [voiceMode, setVoiceMode]     = useState(false);

  useEffect(() => { void fetchFeed(); }, []);

  async function fetchFeed() {
    const cloudPosts = await loadCircleFeed('public', 40);
    if (!cloudPosts?.length) return;
    setCirclePosts(prev => {
      const cloudIds = new Set((cloudPosts as any[]).map((p: any) => String(p.id)));
      const localOnly = prev.filter(p => !cloudIds.has(String(p.id)));
      const mapped: CirclePost[] = (cloudPosts as any[]).map((p: any) => ({
        id:        p.id,
        text:      p.text ?? p.body ?? '',
        date:      p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
        time:      p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        reactions: normalizeReactions(p.reactions),
        mediaKind: p.media_kind ?? undefined,
        voiceUrl:  p.media_url  ?? undefined,
      }));
      return [...localOnly, ...mapped];
    });
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  }, []);

  async function submitPost() {
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    const moodPrefix = composeMood ? `${MOOD_OPTS.find(m => m.id === composeMood)?.emoji} ` : '';
    const fullText   = moodPrefix + text;
    const optimisticPost: CirclePost = {
      id:        Date.now(),
      text:      fullText,
      date:      new Date().toLocaleDateString(),
      time:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: defaultReactions(),
    };
    setCirclePosts(prev => [optimisticPost, ...prev]);
    setDraft('');
    setComposeMood('');
    try { await writeCirclePost('public', fullText); } finally { setPosting(false); }
  }

  async function submitVoicePost(localUri: string, durationSecs: number) {
    setPosting(true);
    try {
      const sb = getSupabase();
      const userId = (await sb?.auth.getUser())?.data?.user?.id;
      if (!userId) {
        // No auth: add local-only placeholder
        setCirclePosts(prev => [{
          id: Date.now(),
          text: `🎙 ${formatDuration(durationSecs)}`,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: defaultReactions(),
          mediaKind: 'voice',
        }, ...prev]);
        return;
      }

      const { publicUrl } = await uploadAudioToSupabase(localUri, userId, 'circle');
      const optimistic: CirclePost = {
        id:        Date.now(),
        text:      `🎙 ${formatDuration(durationSecs)}`,
        date:      new Date().toLocaleDateString(),
        time:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: defaultReactions(),
        mediaKind: 'voice',
        voiceUrl:  publicUrl,
      };
      setCirclePosts(prev => [optimistic, ...prev]);
      await writeCirclePost('public', `🎙 ${formatDuration(durationSecs)}`, {
        mediaKind: 'voice',
        mediaUrl:  publicUrl,
      });
      setVoiceMode(false);
    } catch {
      // silent — user keeps the optimistic post
    } finally {
      setPosting(false);
    }
  }

  function react(postId: CirclePost['id'], key: keyof CirclePost['reactions']) {
    setCirclePosts(posts =>
      posts.map(p =>
        String(p.id) === String(postId)
          ? { ...p, reactions: { ...normalizeReactions(p.reactions), [key]: (normalizeReactions(p.reactions)[key] ?? 0) + 1 } }
          : p
      )
    );
    void syncCircleReaction(postId, key);
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} colors={[PURPLE]} />
      }
    >
      {/* Compose */}
      <View style={s.composeCard}>
        <View style={s.composeHeader}>
          <Text style={s.composeLabel}>put something into the circle</Text>
          <TouchableOpacity
            style={[s.modePill, voiceMode && s.modePillActive]}
            onPress={() => setVoiceMode(v => !v)}
          >
            <Text style={s.modePillText}>{voiceMode ? '✏️ text' : '🎤 voice'}</Text>
          </TouchableOpacity>
        </View>

        {voiceMode ? (
          <VoiceCompose onSubmit={submitVoicePost} submitting={posting} />
        ) : (
          <>
            <View style={s.moodRow}>
              {MOOD_OPTS.map(m => {
                const active = composeMood === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.moodPill, active && { backgroundColor: MOOD_COLORS[m.id] + '30', borderColor: MOOD_COLORS[m.id] }]}
                    onPress={() => setComposeMood(active ? '' : m.id)}
                  >
                    <Text style={s.moodPillEmoji}>{m.emoji}</Text>
                    <Text style={[s.moodPillLabel, active && { color: MOOD_COLORS[m.id] }]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={s.input}
              placeholder="say it here. no names. no judgment."
              placeholderTextColor="#5a4870"
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={280}
            />
            <View style={s.composeFooter}>
              <Text style={s.charCount}>{280 - draft.length}</Text>
              <TouchableOpacity
                style={[s.postBtn, (!draft.trim() || posting) && s.postBtnDisabled]}
                onPress={submitPost}
                disabled={!draft.trim() || posting}
              >
                <Text style={s.postBtnText}>{posting ? 'dropping…' : 'Bip it 💜'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Feed tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.feedTabRail}
      >
        {FEED_TABS.map(ft => {
          const active = feedTab === ft.key;
          return (
            <TouchableOpacity
              key={ft.key}
              onPress={() => setFeedTab(ft.key)}
              style={[s.feedTab, active && s.feedTabActive]}
            >
              <Text style={[s.feedTabText, active && s.feedTabTextActive]}>{ft.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Feed */}
      {circlePosts.length === 0 && !refreshing && (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🌙</Text>
          <Text style={s.emptyText}>the circle is quiet. be the first to bip.</Text>
        </View>
      )}

      {circlePosts.map(post => {
        const isVoice     = post.mediaKind === 'voice';
        const postMood    = !isVoice ? getPostMood(post.text) : null;
        const displayText = postMood ? post.text.slice(post.text.indexOf(' ') + 1) : post.text;
        const reactions   = normalizeReactions(post.reactions);
        return (
          <TouchableOpacity
            key={String(post.id)}
            style={[s.card, postMood && { borderLeftColor: postMood.color, borderLeftWidth: 3 }]}
            onPress={() => !isVoice && router.push(`/(teen)/circle/${post.id}` as any)}
            activeOpacity={isVoice ? 1 : 0.8}
          >
            <View style={s.cardHeader}>
              <View style={s.anonBadge}>
                {isVoice
                  ? <Text style={s.anonMoodEmoji}>🎙</Text>
                  : postMood
                    ? <Text style={[s.anonMoodEmoji, { color: postMood.color }]}>{postMood.emoji}</Text>
                    : <Text style={s.anonDot}>🌑</Text>}
                <Text style={s.anonLabel}>anonymous bip</Text>
              </View>
              <Text style={s.cardTime}>{post.time || ''}</Text>
            </View>

            {isVoice && post.voiceUrl ? (
              <VoicePostPlayer uri={post.voiceUrl} />
            ) : (
              <Text style={s.cardText}>{displayText}</Text>
            )}

            <View style={s.reactions}>
              {REACTION_LABELS.map(({ key, emoji, label }) => {
                const count = reactions[key] ?? 0;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[s.reactionBtn, count > 0 && s.reactionBtnActive]}
                    onPress={() => react(post.id, key)}
                  >
                    <Text style={s.reactionEmoji}>{emoji}</Text>
                    <Text style={[s.reactionLabel, count > 0 && s.reactionLabelActive]}>{label}</Text>
                    {count > 0 && <Text style={s.reactionCount}>{count}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

export default function CircleScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.kicker}>{"SE'KRET BIP"}</Text>
          <Text style={s.title}>{'Circle 💜'}</Text>
        </View>
        <View style={s.anonPill}>
          <Text style={s.anonPillText}>🌑 anonymous</Text>
        </View>
      </View>
      <CircleFeed />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0d0518' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  kicker: { color: '#5a3a78', fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title:  { color: '#f0e6ff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  anonPill: {
    backgroundColor: '#1e0b30',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#3d1a5e',
  },
  anonPillText: { color: '#7c5a9e', fontSize: 11, fontWeight: '600' },

  // Compose card
  composeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#180a28',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3d1a5e',
    shadowColor: '#a855f7',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  composeHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  composeLabel:   { color: '#6b4888', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  modePill:       { borderWidth: 1, borderColor: '#3d1a5e', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.04)' },
  modePillActive: { borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.15)' },
  modePillText:   { color: '#c4b5fd', fontSize: 11, fontWeight: '700' },
  moodRow:        { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  moodPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#2d1450',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  moodPillEmoji: { fontSize: 13 },
  moodPillLabel: { color: '#6b4888', fontSize: 10, fontWeight: '600' },
  input: {
    color: '#e8dff5',
    fontSize: 15,
    minHeight: 64,
    lineHeight: 22,
    backgroundColor: '#100520',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  composeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount:     { color: '#5a3a78', fontSize: 12 },
  postBtn:         { backgroundColor: '#7c3aed', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9 },
  postBtnDisabled: { opacity: 0.35 },
  postBtnText:     { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Feed cards
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#16082a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2e1250',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  anonBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  anonDot:       { fontSize: 12, opacity: 0.7 },
  anonMoodEmoji: { fontSize: 14 },
  anonLabel:     { color: '#5a3a78', fontSize: 11, fontWeight: '600' },
  cardTime:      { color: '#3d2258', fontSize: 10 },
  cardText:      { color: '#e8dff5', fontSize: 15, lineHeight: 23, marginBottom: 12 },

  // Reactions
  reactions:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reactionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e0a30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#2e1250' },
  reactionBtnActive:   { backgroundColor: '#3d1a5e', borderColor: '#7c3aed' },
  reactionEmoji:       { fontSize: 14 },
  reactionLabel:       { color: '#5a3a78', fontSize: 11, fontWeight: '600' },
  reactionLabelActive: { color: '#c4b5fd' },
  reactionCount:       { color: '#a855f7', fontSize: 11, fontWeight: '800', marginLeft: 2 },

  // Feed tabs
  feedTabRail:     { gap: 6, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 },
  feedTab:         { borderRadius: 999, borderWidth: 1, borderColor: '#2d1450', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 14, paddingVertical: 6 },
  feedTabActive:   { borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.15)' },
  feedTabText:     { color: '#5a3a78', fontSize: 11, fontWeight: '700' },
  feedTabTextActive: { color: '#c4b5fd' },

  // Empty state
  empty:      { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyText:  { color: '#4a2e60', fontSize: 14, textAlign: 'center' },
});
