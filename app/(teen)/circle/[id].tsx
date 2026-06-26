// app/(teen)/circle/[id].tsx
// SE'KRET CIRCLE — Post Detail + Reply Flow
// Modes: Write comfort (persisted) / Voice reply / Send support / Just stay

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import { syncCircleReaction, writeCircleReply, loadCircleReplies } from '@/utils/sync';
import { uploadAudioToSupabase } from '../../../services/audio/audioUpload';
import { requestMicrophonePermission } from '../../../components/audio/RecordingPermissionGate';
import { getSupabase } from '@/utils/supabase';
import type { CirclePost } from '@/context/AppContext';
import type { CirclePostReply } from '@/types';

const REACTION_LABELS: { key: keyof CirclePost['reactions']; emoji: string; label: string }[] = [
  { key: 'felt',    emoji: '💜', label: 'felt this too'     },
  { key: 'comfort', emoji: '☁️', label: 'sending comfort'  },
  { key: 'proud',   emoji: '⭐', label: 'proud of you'     },
  { key: 'stay',    emoji: '🌙', label: 'staying with this' },
];

const REPLY_MODES = [
  { key: 'comfort', emoji: '☁️', label: 'Write comfort', desc: 'Leave a soft anonymous word' },
  { key: 'voice',   emoji: '🎙️', label: 'Voice reply',  desc: 'A 30-sec anonymous voice bip' },
  { key: 'support', emoji: '⭐', label: 'Send support',  desc: 'Send a silent energy boost' },
  { key: 'stay',    emoji: '🌙', label: 'Just stay',     desc: 'Stay with this post quietly' },
] as const;

type ReplyModeKey = (typeof REPLY_MODES)[number]['key'];

const SAFE_ENERGY = [
  { emoji: '💜', label: 'you\'re not alone' },
  { emoji: '🌙', label: 'it\'s okay to feel this' },
  { emoji: '☁️', label: 'rest if you need to' },
  { emoji: '⭐', label: 'this will pass' },
  { emoji: '🌿', label: 'breathe with me' },
];

const MAX_VOICE_SECS = 30;

function normalizeReactions(raw: unknown): CirclePost['reactions'] {
  const r = (raw ?? {}) as Partial<Record<keyof CirclePost['reactions'], number>>;
  return {
    felt:    Number(r.felt    ?? 0),
    comfort: Number(r.comfort ?? 0),
    proud:   Number(r.proud   ?? 0),
    stay:    Number(r.stay    ?? 0),
  };
}

function getPostMoodColor(text: string): string | null {
  if (text.startsWith('🌧️ ')) return '#7dd3fc';
  if (text.startsWith('☁️ '))  return '#c4b5fd';
  if (text.startsWith('🌟 ')) return '#fbbf24';
  if (text.startsWith('✨ '))  return '#fb7185';
  return null;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Mini voice player ─────────────────────────────────────────────────────────
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
            (status) => { if (!status.isLoaded || status.didJustFinish) setPlaying(false); },
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

  useEffect(() => () => { soundRef.current?.unloadAsync().catch(() => {}); }, []);

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
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1e0a30', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#3d1a5e' },
  icon:       { fontSize: 18, color: '#a855f7' },
  label:      { color: '#c4b5fd', fontSize: 12, fontWeight: '700', flex: 1 },
  bar:        { flexDirection: 'row', alignItems: 'center', gap: 2 },
  barSegment: { width: 3, height: 12, backgroundColor: '#7c3aed', borderRadius: 2, opacity: 0.5 },
});

// ── Voice reply compose ───────────────────────────────────────────────────────
interface VoiceComposeProps {
  onSubmit: (localUri: string, durationSecs: number) => Promise<void>;
  onDiscard: () => void;
  submitting: boolean;
}

function VoiceCompose({ onSubmit, onDiscard, submitting }: VoiceComposeProps) {
  const [phase, setPhase]     = useState<'idle' | 'recording' | 'preview'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = async () => {
    const granted = await requestMicrophonePermission();
    if (!granted) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = recording;
    setElapsed(0);
    setPhase('recording');
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next >= MAX_VOICE_SECS) { void stopRecording(); }
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
    } catch { setPhase('idle'); }
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
    onDiscard();
  };

  if (phase === 'idle') {
    return (
      <TouchableOpacity style={vc.recordBtn} onPress={startRecording}>
        <Text style={vc.recordBtnIcon}>🎤</Text>
        <Text style={vc.recordBtnText}>tap to record</Text>
        <Text style={vc.recordBtnSub}>up to 30 seconds · anonymous</Text>
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

  return (
    <View style={vc.previewWrap}>
      <Text style={vc.previewLabel}>🎙 voice bip · {formatDuration(elapsed)}</Text>
      {localUri ? <VoicePostPlayer uri={localUri} /> : null}
      <View style={vc.previewActions}>
        <TouchableOpacity style={vc.discardBtn} onPress={discard}>
          <Text style={vc.discardBtnText}>discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[vc.submitBtn, (submitting || !localUri) && vc.submitBtnDisabled]}
          disabled={submitting || !localUri}
          onPress={() => localUri && onSubmit(localUri, elapsed)}
        >
          <Text style={vc.submitBtnText}>{submitting ? 'sending…' : 'send bip 💜'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const vc = StyleSheet.create({
  recordBtn:          { alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 20, borderWidth: 1, borderColor: '#3d1a5e', borderRadius: 16, borderStyle: 'dashed', marginBottom: 4 },
  recordBtnIcon:      { fontSize: 28 },
  recordBtnText:      { color: '#c4b5fd', fontSize: 14, fontWeight: '700' },
  recordBtnSub:       { color: '#5a3a78', fontSize: 11 },
  recordingWrap:      { gap: 10, marginBottom: 4 },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  recordingDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f87171' },
  recordingLabel:     { color: '#f87171', fontSize: 13, fontWeight: '800' },
  timer:              { color: '#c4b5fd', fontSize: 13 },
  stopBtn:            { alignSelf: 'center', backgroundColor: '#3d1a5e', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  stopBtnText:        { color: '#c4b5fd', fontWeight: '800', fontSize: 13 },
  previewWrap:        { gap: 8, marginBottom: 4 },
  previewLabel:       { color: '#c4b5fd', fontSize: 12, fontWeight: '700' },
  previewActions:     { flexDirection: 'row', gap: 10 },
  discardBtn:         { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#3d1a5e' },
  discardBtnText:     { color: '#7c5a9e', fontWeight: '700', fontSize: 13 },
  submitBtn:          { flex: 2, alignItems: 'center', paddingVertical: 10, borderRadius: 20, backgroundColor: '#7c3aed' },
  submitBtnDisabled:  { opacity: 0.4 },
  submitBtnText:      { color: '#fff', fontWeight: '800', fontSize: 13 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CirclePostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { circlePosts, setCirclePosts } = useAppContext();

  const post = circlePosts.find(p => String(p.id) === String(id));

  const [replyMode, setReplyMode]     = useState<ReplyModeKey | null>(null);
  const [comfortText, setComfortText] = useState('');
  const [comfortSent, setComfortSent] = useState(false);
  const [voiceSent, setVoiceSent]     = useState(false);
  const [stayModal, setStayModal]     = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [stayed, setStayed]           = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [replies, setReplies]         = useState<CirclePostReply[]>([]);

  const fetchReplies = useCallback(async () => {
    if (!post) return;
    const data = await loadCircleReplies(post.id, 'public');
    setReplies(data);
  }, [post?.id]);

  useEffect(() => { void fetchReplies(); }, [fetchReplies]);

  if (!post) {
    return (
      <View style={s.root}>
        <LinearGradient colors={['#10091b', '#0d0518']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={s.notFound}>
            <Text style={s.notFoundEmoji}>🌑</Text>
            <Text style={s.notFoundText}>this bip has floated away</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const reactions   = normalizeReactions(post.reactions);
  const moodColor   = getPostMoodColor(post.text);
  const displayText = moodColor ? post.text.slice(post.text.indexOf(' ') + 1) : post.text;
  const isVoicePost = post.mediaKind === 'voice';

  function react(key: keyof CirclePost['reactions']) {
    setCirclePosts(posts =>
      posts.map(p =>
        String(p.id) === String(id)
          ? { ...p, reactions: { ...normalizeReactions(p.reactions), [key]: (normalizeReactions(p.reactions)[key] ?? 0) + 1 } }
          : p,
      ),
    );
    void syncCircleReaction(post!.id, key);
  }

  function handleReplyMode(key: ReplyModeKey) {
    if (key === 'stay') { setStayModal(true); return; }
    if (key === 'support') { setSupportSent(true); react('comfort'); return; }
    setReplyMode(replyMode === key ? null : key);
  }

  async function submitComfort() {
    const t = comfortText.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    react('comfort');
    await writeCircleReply(post!.id, 'public', 'comfort', { text: t });
    setComfortText('');
    setReplyMode(null);
    setComfortSent(true);
    setSubmitting(false);
    void fetchReplies();
  }

  async function submitVoiceReply(localUri: string, durationSecs: number) {
    setSubmitting(true);
    try {
      const sb = getSupabase();
      const userId = (await sb?.auth.getUser())?.data?.user?.id;
      if (!userId) return;
      const { publicUrl } = await uploadAudioToSupabase(localUri, userId, 'circle');
      react('comfort');
      await writeCircleReply(post!.id, 'public', 'voice', { voiceUrl: publicUrl, durationSecs });
      setVoiceSent(true);
      setReplyMode(null);
      void fetchReplies();
    } catch {
      // silent — reaction already applied optimistically
    } finally {
      setSubmitting(false);
    }
  }

  function handleStay() {
    setStayed(true);
    react('stay');
    setStayModal(false);
  }

  const sekretPrompt = reactions.felt + reactions.stay > 3
    ? 'Se\'kret noticed — a lot of people feel this too. you\'re in good company. 💜'
    : reactions.comfort > 2
    ? 'Se\'kret noticed — this bip is getting a lot of comfort energy. someone cares. ☁️'
    : null;

  const visibleReplies = replies.filter(r => r.replyMode === 'comfort' || r.replyMode === 'voice');

  return (
    <View style={s.root}>
      <LinearGradient colors={['#10091b', '#171024', '#090711']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={s.header}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <Text style={s.backBtnText}>‹</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={s.kicker}>SE'KRET CIRCLE</Text>
                <Text style={s.title}>a bip</Text>
              </View>
              <View style={s.anonPill}>
                <Text style={s.anonPillText}>🌑 anonymous</Text>
              </View>
            </View>

            {/* Post body */}
            <View style={[s.postCard, moodColor ? { borderLeftColor: moodColor, borderLeftWidth: 3 } : null]}>
              <View style={s.postMeta}>
                <Text style={s.anonLabel}>anonymous bip</Text>
                <Text style={s.postTime}>{post.time}</Text>
              </View>
              {isVoicePost && post.voiceUrl ? (
                <VoicePostPlayer uri={post.voiceUrl} />
              ) : (
                <Text style={s.postText}>{displayText}</Text>
              )}

              {/* Reactions */}
              <View style={s.reactionsRow}>
                {REACTION_LABELS.map(({ key, emoji, label }) => {
                  const count = reactions[key] ?? 0;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[s.reactionBtn, count > 0 && s.reactionBtnActive]}
                      onPress={() => react(key)}
                    >
                      <Text style={s.reactionEmoji}>{emoji}</Text>
                      <Text style={[s.reactionLabel, count > 0 && s.reactionLabelActive]}>{label}</Text>
                      {count > 0 && <Text style={s.reactionCount}>{count}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Se'kret noticed */}
            {sekretPrompt ? (
              <View style={s.sekretNotice}>
                <Text style={s.sekretNoticeText}>{sekretPrompt}</Text>
              </View>
            ) : null}

            {/* Reply mode selector */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>how do you want to show up?</Text>
              <View style={s.replyModeGrid}>
                {REPLY_MODES.map(mode => {
                  const active = replyMode === mode.key
                    || (mode.key === 'support' && supportSent)
                    || (mode.key === 'stay' && stayed);
                  return (
                    <TouchableOpacity
                      key={mode.key}
                      style={[s.replyModeCard, active && s.replyModeCardActive]}
                      onPress={() => handleReplyMode(mode.key)}
                      activeOpacity={0.75}
                    >
                      <Text style={s.replyModeEmoji}>{mode.emoji}</Text>
                      <Text style={[s.replyModeLabel, active && s.replyModeLabelActive]}>{mode.label}</Text>
                      <Text style={s.replyModeDesc}>{mode.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Comfort text composer */}
            {replyMode === 'comfort' ? (
              <View style={s.comfortComposer}>
                <Text style={s.comfortLabel}>your soft anonymous word</Text>
                <TextInput
                  style={s.comfortInput}
                  placeholder="say something soft. they'll feel it, not see who you are."
                  placeholderTextColor="#5a3a78"
                  value={comfortText}
                  onChangeText={setComfortText}
                  multiline
                  maxLength={200}
                  autoFocus
                />
                <View style={s.comfortFooter}>
                  <TouchableOpacity onPress={() => { setReplyMode(null); setComfortText(''); }}>
                    <Text style={s.cancelText}>cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.sendBtn, (!comfortText.trim() || submitting) && s.sendBtnDisabled]}
                    onPress={submitComfort}
                    disabled={!comfortText.trim() || submitting}
                  >
                    <Text style={s.sendBtnText}>{submitting ? 'sending…' : 'send comfort ☁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Voice reply composer */}
            {replyMode === 'voice' ? (
              <View style={s.voiceComposer}>
                <Text style={s.comfortLabel}>your anonymous voice bip</Text>
                <VoiceCompose
                  onSubmit={submitVoiceReply}
                  onDiscard={() => setReplyMode(null)}
                  submitting={submitting}
                />
              </View>
            ) : null}

            {/* Sent confirmations */}
            {comfortSent ? (
              <View style={s.sentCard}>
                <Text style={s.sentText}>☁️ comfort sent. they feel it.</Text>
              </View>
            ) : null}
            {voiceSent ? (
              <View style={s.sentCard}>
                <Text style={s.sentText}>🎙 voice bip sent. they'll hear it.</Text>
              </View>
            ) : null}
            {supportSent ? (
              <View style={[s.sentCard, { borderColor: 'rgba(251,191,36,0.3)' }]}>
                <Text style={[s.sentText, { color: '#fbbf24' }]}>⭐ silent support sent. they feel it.</Text>
              </View>
            ) : null}

            {/* Replies list */}
            {visibleReplies.length > 0 ? (
              <View style={s.section}>
                <Text style={s.sectionLabel}>energy sent to this bip</Text>
                {visibleReplies.map(reply => (
                  <View key={reply.id} style={s.replyRow}>
                    <Text style={s.replyEmoji}>
                      {reply.replyMode === 'voice' ? '🎙' : '☁️'}
                    </Text>
                    <View style={s.replyBody}>
                      {reply.replyMode === 'voice' && reply.voiceUrl ? (
                        <VoicePostPlayer uri={reply.voiceUrl} />
                      ) : reply.text ? (
                        <Text style={s.replyText}>{reply.text}</Text>
                      ) : null}
                      <Text style={s.replyTime}>
                        {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Safe Energy */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>safe energy for this space</Text>
              <View style={s.safeEnergyRow}>
                {SAFE_ENERGY.map((item, i) => (
                  <View key={i} style={s.safeEnergyChip}>
                    <Text style={s.safeEnergyEmoji}>{item.emoji}</Text>
                    <Text style={s.safeEnergyLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ height: 80 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Stay modal */}
      <Modal visible={stayModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalEmoji}>🌙</Text>
            <Text style={s.modalTitle}>stay with this post</Text>
            <Text style={s.modalBody}>
              you don't have to say anything. sometimes being here — reading, feeling, staying — is the whole thing.
            </Text>
            <TouchableOpacity style={s.modalBtn} onPress={handleStay}>
              <Text style={s.modalBtnText}>I'm staying 🌙</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStayModal(false)} style={s.modalCancel}>
              <Text style={s.modalCancelText}>go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  kicker: { color: '#a855f7', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  anonPill: { backgroundColor: '#1e0b30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#3d1a5e' },
  anonPillText: { color: '#7c5a9e', fontSize: 11, fontWeight: '600' },

  postCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#16082a', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#2e1250' },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  anonLabel: { color: '#5a3a78', fontSize: 11, fontWeight: '600' },
  postTime: { color: '#3d2258', fontSize: 10 },
  postText: { color: '#e8dff5', fontSize: 16, lineHeight: 25, marginBottom: 14 },

  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e0a30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#2e1250' },
  reactionBtnActive: { backgroundColor: '#3d1a5e', borderColor: '#7c3aed' },
  reactionEmoji: { fontSize: 14 },
  reactionLabel: { color: '#5a3a78', fontSize: 11, fontWeight: '600' },
  reactionLabelActive: { color: '#c4b5fd' },
  reactionCount: { color: '#a855f7', fontSize: 11, fontWeight: '800', marginLeft: 2 },

  sekretNotice: { marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(168,85,247,0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', padding: 12 },
  sekretNoticeText: { color: '#c4b5fd', fontSize: 13, lineHeight: 20 },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel: { color: '#5a3a78', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },

  replyModeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  replyModeCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: '#2e1250', padding: 14, gap: 4 },
  replyModeCardActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: '#7c3aed' },
  replyModeEmoji: { fontSize: 20, marginBottom: 2 },
  replyModeLabel: { color: '#c4b5fd', fontSize: 13, fontWeight: '800' },
  replyModeLabelActive: { color: '#e8dff5' },
  replyModeDesc: { color: '#5a3a78', fontSize: 11, lineHeight: 16 },

  comfortComposer: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#180a28', borderRadius: 16, borderWidth: 1, borderColor: '#3d1a5e', padding: 14 },
  voiceComposer:   { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#180a28', borderRadius: 16, borderWidth: 1, borderColor: '#3d1a5e', padding: 14 },
  comfortLabel: { color: '#6b4888', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  comfortInput: { color: '#e8dff5', fontSize: 14, minHeight: 80, lineHeight: 22, backgroundColor: '#100520', borderRadius: 12, padding: 12, marginBottom: 10, textAlignVertical: 'top' },
  comfortFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelText: { color: '#5a3a78', fontSize: 13, fontWeight: '600' },
  sendBtn: { backgroundColor: '#7c3aed', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  sentCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', padding: 12 },
  sentText: { color: '#c4b5fd', fontSize: 13, fontWeight: '700' },

  replyRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  replyEmoji: { fontSize: 16, marginTop: 2 },
  replyBody: { flex: 1, gap: 4 },
  replyText: { color: '#c4b5fd', fontSize: 13, lineHeight: 20 },
  replyTime: { color: '#3d2258', fontSize: 10 },

  safeEnergyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  safeEnergyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 999, borderWidth: 1, borderColor: '#2e1250', paddingHorizontal: 10, paddingVertical: 6 },
  safeEnergyEmoji: { fontSize: 12 },
  safeEnergyLabel: { color: '#5a3a78', fontSize: 11, fontWeight: '600' },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundEmoji: { fontSize: 36, marginBottom: 12 },
  notFoundText: { color: '#5a3a78', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#180a28', borderRadius: 24, borderWidth: 1, borderColor: '#3d1a5e', padding: 24, width: '100%', alignItems: 'center' },
  modalEmoji: { fontSize: 40, marginBottom: 12 },
  modalTitle: { color: '#e8dff5', fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  modalBody: { color: '#c4b5fd', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  modalBtn: { backgroundColor: '#7c3aed', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 12, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  modalCancel: { paddingVertical: 8 },
  modalCancelText: { color: '#5a3a78', fontSize: 13, fontWeight: '600' },
});
