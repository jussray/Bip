// app/(teen)/circle/[id].tsx
// SE'KRET CIRCLE — Post Detail + Se'kret-Guided Reply Flow
// Design targets (from mockup):
//   ✓ Reply filter tabs: All Replies · Comfort Only · Voice Replies · Stay With Them
//   ✓ Se'kret guiding reply — "Breathe first, then respond" banner
//   ✓ Reply mode grid: Write comfort / Voice reply / Send support / Just stay
//   ✓ Send Support sheet: Hug / Encourage / Stay with them / Say nothing
//   ✓ Voice reply composer (waveform stub + Se'kret whisper preview)
//   ✓ Named circle identity on post header
//   ✓ Safe energy controls
//   ✓ Se'kret noticed — heavy post nudge

import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import { syncCircleReaction } from '@/utils/sync';
import type { CirclePost } from '@/context/AppContext';
import { loadTeenCircleIdentity } from '@/features/identity/profileIdentity';

const REACTION_LABELS: { key: keyof CirclePost['reactions']; emoji: string; label: string }[] = [
  { key: 'felt',    emoji: '💜', label: 'felt this too'   },
  { key: 'comfort', emoji: '☁️', label: 'sending comfort' },
  { key: 'proud',   emoji: '⭐', label: 'proud of you'    },
  { key: 'stay',    emoji: '🌙', label: 'stayed with you' },
];

type ReplyTab = 'all' | 'comfort' | 'voice' | 'stay';
const REPLY_TABS: { key: ReplyTab; label: string }[] = [
  { key: 'all',     label: 'All Replies'    },
  { key: 'comfort', label: 'Comfort Only'   },
  { key: 'voice',   label: 'Voice Replies'  },
  { key: 'stay',    label: 'Stay With Them' },
];

const REPLY_MODES = [
  { key: 'comfort',  emoji: '✏️', label: 'Write comfort',  desc: 'Leave a soft anonymous word'    },
  { key: 'voice',    emoji: '🎙️', label: 'Voice reply',   desc: 'A 30-sec voice bip'              },
  { key: 'support',  emoji: '⭐', label: 'Send support',   desc: 'Send a silent energy boost'      },
  { key: 'stay',     emoji: '🌙', label: 'Just stay',      desc: 'Stay with this post quietly'    },
] as const;

type ReplyModeKey = (typeof REPLY_MODES)[number]['key'];

const SEND_SUPPORT_OPTIONS = [
  { key: 'hug',      emoji: '🤗', label: 'Hug'            },
  { key: 'encourage',emoji: '⭐', label: 'Encourage'       },
  { key: 'stay',     emoji: '🌙', label: 'Stay with them'  },
  { key: 'nothing',  emoji: '☁️', label: 'Say nothing'    },
] as const;

type SupportKey = (typeof SEND_SUPPORT_OPTIONS)[number]['key'];

const PURPLE  = '#a855f7';
const DPURPLE = '#7c3aed';

const HEAVY_WORDS = ['alone', 'hurt', 'numb', 'scared', 'crying', 'hopeless', 'dark', 'can\'t', 'empty', 'sad', 'pain'];

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

function isHeavy(text: string): boolean {
  const l = text.toLowerCase();
  return HEAVY_WORDS.some(w => l.includes(w));
}

const STAY_COLORS = ['#7c3aed','#a855f7','#6366f1','#ec4899','#8b5cf6','#3b82f6'];

export default function CirclePostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { circlePosts, setCirclePosts } = useAppContext();

  const post = circlePosts.find(p => String(p.id) === String(id));

  const [replyTab,     setReplyTab]     = useState<ReplyTab>('all');
  const [replyMode,    setReplyMode]    = useState<ReplyModeKey | null>(null);
  const [comfortText,  setComfortText]  = useState('');
  const [stayModal,    setStayModal]    = useState(false);
  const [supportSheet, setSupportSheet] = useState(false);
  const [supportSent,  setSupportSent]  = useState<SupportKey | null>(null);
  const [stayed,       setStayed]       = useState(false);
  const [voiceMode,    setVoiceMode]    = useState(false);
  const [heavyDismiss, setHeavyDismiss] = useState(false);
  const [circleName,   setCircleName]   = useState('anonymous bip');

  React.useEffect(() => {
    loadTeenCircleIdentity().then(v => setCircleName(v.circleName));
  }, []);

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
  const heavy       = isHeavy(post.text) && !heavyDismiss;
  const stayTotal   = (reactions.stay ?? 0) + (reactions.felt ?? 0);

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
    if (key === 'stay')    { setStayModal(true);    return; }
    if (key === 'support') { setSupportSheet(true); return; }
    if (key === 'voice')   { setVoiceMode(v => !v); return; }
    setReplyMode(replyMode === key ? null : key);
  }

  function submitComfort() {
    const t = comfortText.trim();
    if (!t) return;
    react('comfort');
    setComfortText('');
    setReplyMode(null);
  }

  function handleStay() {
    setStayed(true);
    react('stay');
    setStayModal(false);
  }

  function sendSupport(key: SupportKey) {
    setSupportSent(key);
    if (key !== 'nothing') react('comfort');
    setSupportSheet(false);
  }

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
                <Text style={s.title}>Reply to {circleName}'s Post 💜</Text>
              </View>
              <TouchableOpacity style={s.moreBtn}>
                <Text style={s.moreBtnText}>···</Text>
              </TouchableOpacity>
            </View>

            {/* Original post */}
            <View style={[s.postCard, moodColor ? { borderLeftColor: moodColor, borderLeftWidth: 3 } : null]}>
              <View style={s.postHeader}>
                <View style={s.postAnonBadge}>
                  <View style={s.postAvatarCircle}>
                    <Text style={s.postAvatarEmoji}>🌑</Text>
                  </View>
                  <View>
                    <Text style={s.postAnonName}>{circleName} 💜</Text>
                    <Text style={s.postAnonSub}>anonymous 🌑 · {post.date} · {post.time}</Text>
                  </View>
                </View>
              </View>
              <Text style={s.postText}>{displayText}</Text>
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
                      <Text style={[s.reactionCount, count > 0 && s.reactionCountActive]}>{count}</Text>
                      <Text style={[s.reactionLabel, count > 0 && s.reactionLabelActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Se'kret is guiding reply banner */}
            <View style={s.guideBanner}>
              <Text style={s.guideBannerIcon}>☁️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.guideBannerTitle}>Se'kret is guiding this reply.</Text>
                <Text style={s.guideBannerSub}>Breathe first, then respond.</Text>
              </View>
            </View>

            {/* Se'kret noticed — heavy post nudge */}
            {heavy && (
              <View style={s.heavyNudge}>
                <View style={s.heavyNudgeRow}>
                  <Text style={s.heavyNudgeEmoji}>☁️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.heavyNudgeTitle}>Se'kret noticed…</Text>
                    <Text style={s.heavyNudgeBody}>This post is heavy tonight. Would you like comfort mode?</Text>
                  </View>
                  <TouchableOpacity onPress={() => setHeavyDismiss(true)} style={s.heavyClose}>
                    <Text style={s.heavyCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.heavyBtns}>
                  <TouchableOpacity style={s.heavyYes} onPress={() => setHeavyDismiss(true)}>
                    <Text style={s.heavyYesText}>Yes, please</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.heavyNo} onPress={() => setHeavyDismiss(true)}>
                    <Text style={s.heavyNoText}>Not now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Stay With Them panel */}
            {stayTotal > 0 && (
              <View style={s.stayPanel}>
                <View style={s.stayPanelHeader}>
                  <Text style={s.stayPanelTitle}>Stay With Them 🌙</Text>
                </View>
                <Text style={s.stayPanelCount}>
                  {stayTotal} {stayTotal === 1 ? 'person is' : 'people are'} sitting with {circleName}'s feeling tonight.
                </Text>
                <View style={s.stayAvatarRow}>
                  {Array.from({ length: Math.min(stayTotal, 8) }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.stayAvatar,
                        { backgroundColor: STAY_COLORS[i % STAY_COLORS.length] },
                        i > 0 && { marginLeft: -10 },
                      ]}
                    />
                  ))}
                </View>
                <TouchableOpacity style={s.stayJoinBtn} onPress={() => setStayModal(true)}>
                  <Text style={s.stayJoinBtnText}>{stayed ? 'You\'re with them 💜' : 'Join the circle ›'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.stayQuietBtn} onPress={() => {}}>
                  <Text style={s.stayQuietBtnText}>I'll stay quietly 🌙</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reply filter tabs */}
            <View style={s.replyTabRail}>
              {REPLY_TABS.map(rt => {
                const active = replyTab === rt.key;
                const badge = rt.key === 'stay' && stayTotal > 0 ? ` ${stayTotal}` : '';
                return (
                  <TouchableOpacity
                    key={rt.key}
                    onPress={() => setReplyTab(rt.key)}
                    style={[s.replyTab, active && s.replyTabActive]}
                  >
                    <Text style={[s.replyTabText, active && s.replyTabTextActive]}>
                      {rt.label}{badge}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Choose how to reply */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>choose how you want to reply:</Text>
              <View style={s.replyModeGrid}>
                {REPLY_MODES.map(mode => {
                  const active =
                    replyMode === mode.key ||
                    (mode.key === 'support' && !!supportSent) ||
                    (mode.key === 'stay' && stayed) ||
                    (mode.key === 'voice' && voiceMode);
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

            {/* Respond gently input */}
            <View style={s.composerWrap}>
              <TextInput
                style={s.composerInput}
                placeholder="respond gently…"
                placeholderTextColor="#5a4870"
                value={comfortText}
                onChangeText={setComfortText}
                multiline
                maxLength={200}
                onFocus={() => setReplyMode('comfort')}
              />
              <View style={s.composerActions}>
                <TouchableOpacity style={s.composerAction} onPress={() => setVoiceMode(v => !v)}>
                  <Text style={s.composerActionEmoji}>🎙️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.composerAction}>
                  <Text style={s.composerActionEmoji}>🌊</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.composerAction}>
                  <Text style={s.composerActionEmoji}>🖼️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.composerAction}>
                  <Text style={s.composerActionEmoji}>☁️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.sendBtn, !comfortText.trim() && s.sendBtnDisabled]}
                  onPress={submitComfort}
                  disabled={!comfortText.trim()}
                >
                  <Text style={s.sendBtnText}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Voice mode composer stub */}
            {voiceMode && (
              <View style={s.voiceCard}>
                <View style={s.voiceCardHeader}>
                  <Text style={s.voiceCardTitle}>Se'kret whispered…</Text>
                </View>
                <View style={s.waveformRow}>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.waveBar,
                        { height: 8 + Math.abs(Math.sin(i * 0.6)) * 20, backgroundColor: PURPLE + (i % 3 === 0 ? 'ff' : '88') },
                      ]}
                    />
                  ))}
                </View>
                <Text style={s.voiceTimer}>0:31</Text>
                <Text style={s.voiceHint}>Tap to send as voice or add Se'kret tone. ✦</Text>
                <View style={s.voiceBtns}>
                  <TouchableOpacity style={s.voiceSend} onPress={() => { react('comfort'); setVoiceMode(false); }}>
                    <Text style={s.voiceSendText}>Send voice reply 🎙️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.voiceCancel} onPress={() => setVoiceMode(false)}>
                    <Text style={s.voiceCancelText}>cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Support sent feedback */}
            {supportSent && (
              <View style={s.supportSentCard}>
                <Text style={s.supportSentText}>
                  {supportSent === 'hug'      ? '🤗 a hug sent. they feel it.' :
                   supportSent === 'encourage'? '⭐ encouragement sent. they feel it.' :
                   supportSent === 'stay'     ? '🌙 you stayed with them. they feel it.' :
                   '☁️ you were here. that counts.'}
                </Text>
              </View>
            )}

            <View style={{ height: 80 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Stay With Them modal ── */}
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

      {/* ── Send Support sheet ── */}
      <Modal visible={supportSheet} transparent animationType="slide">
        <View style={s.sheetOverlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Send Support 🌙</Text>
              <Text style={s.sheetSub}>choose how you want to support {circleName}</Text>
              <TouchableOpacity onPress={() => setSupportSheet(false)} style={s.sheetClose}>
                <Text style={s.sheetCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.supportGrid}>
              {SEND_SUPPORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={s.supportCard}
                  onPress={() => sendSupport(opt.key)}
                >
                  <Text style={s.supportCardEmoji}>{opt.emoji}</Text>
                  <Text style={s.supportCardLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  kicker: { color: PURPLE, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  moreBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  moreBtnText: { color: '#c4b5fd', fontSize: 16 },

  // Post card
  postCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#16082a', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#2e1250' },
  postHeader: { marginBottom: 10 },
  postAnonBadge: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postAvatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(168,85,247,0.2)', alignItems: 'center', justifyContent: 'center' },
  postAvatarEmoji: { fontSize: 18 },
  postAnonName: { color: '#e8dff5', fontSize: 14, fontWeight: '800' },
  postAnonSub: { color: '#5a3a78', fontSize: 9, marginTop: 2 },
  postText: { color: '#e8dff5', fontSize: 17, lineHeight: 27, marginBottom: 14 },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e0a30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#2e1250' },
  reactionBtnActive: { backgroundColor: '#3d1a5e', borderColor: DPURPLE },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { color: '#5a3a78', fontSize: 11, fontWeight: '800' },
  reactionCountActive: { color: PURPLE },
  reactionLabel: { color: '#5a3a78', fontSize: 10, fontWeight: '600' },
  reactionLabelActive: { color: '#c4b5fd' },

  // Se'kret guiding banner
  guideBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(168,85,247,0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', padding: 12 },
  guideBannerIcon: { fontSize: 22 },
  guideBannerTitle: { color: '#c4b5fd', fontSize: 12, fontWeight: '800' },
  guideBannerSub: { color: '#9a7eb8', fontSize: 11, marginTop: 2 },

  // Heavy nudge
  heavyNudge: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a0830', borderRadius: 16, borderWidth: 1, borderColor: '#3d1a5e', padding: 14 },
  heavyNudgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  heavyNudgeEmoji: { fontSize: 20 },
  heavyNudgeTitle: { color: '#c4b5fd', fontSize: 12, fontWeight: '800', marginBottom: 3 },
  heavyNudgeBody: { color: '#9a7eb8', fontSize: 12, lineHeight: 18 },
  heavyClose: { padding: 4 },
  heavyCloseText: { color: '#5a3a78', fontSize: 14 },
  heavyBtns: { flexDirection: 'row', gap: 10 },
  heavyYes: { flex: 1, backgroundColor: DPURPLE, borderRadius: 12, paddingVertical: 9, alignItems: 'center' },
  heavyYesText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  heavyNo: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#3d1a5e' },
  heavyNoText: { color: '#7c5a9e', fontSize: 13, fontWeight: '600' },

  // Stay With Them inline panel
  stayPanel: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#16082a', borderRadius: 18, borderWidth: 1, borderColor: '#3d1a5e', padding: 16, alignItems: 'center' },
  stayPanelHeader: { width: '100%', marginBottom: 6 },
  stayPanelTitle: { color: '#f0e6ff', fontSize: 16, fontWeight: '900' },
  stayPanelCount: { color: '#9a7eb8', fontSize: 12, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  stayAvatarRow: { flexDirection: 'row', marginBottom: 16 },
  stayAvatar: { width: 32, height: 32, borderRadius: 16 },
  stayJoinBtn: { width: '100%', backgroundColor: DPURPLE, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  stayJoinBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  stayQuietBtn: { paddingVertical: 8 },
  stayQuietBtnText: { color: '#7c5a9e', fontSize: 12, fontWeight: '600' },

  // Reply filter tabs
  replyTabRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, marginBottom: 16 },
  replyTab: { borderRadius: 999, borderWidth: 1, borderColor: '#2d1450', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 6 },
  replyTabActive: { borderColor: PURPLE, backgroundColor: 'rgba(168,85,247,0.15)' },
  replyTabText: { color: '#5a3a78', fontSize: 11, fontWeight: '700' },
  replyTabTextActive: { color: '#c4b5fd' },

  // Reply mode
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel: { color: '#5a3a78', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  replyModeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  replyModeCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: '#2e1250', padding: 14, gap: 4 },
  replyModeCardActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: DPURPLE },
  replyModeEmoji: { fontSize: 20, marginBottom: 2 },
  replyModeLabel: { color: '#c4b5fd', fontSize: 13, fontWeight: '800' },
  replyModeLabelActive: { color: '#e8dff5' },
  replyModeDesc: { color: '#5a3a78', fontSize: 11, lineHeight: 16 },

  // Composer
  composerWrap: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#180a28', borderRadius: 16, borderWidth: 1, borderColor: '#3d1a5e', overflow: 'hidden' },
  composerInput: { color: '#e8dff5', fontSize: 15, minHeight: 50, lineHeight: 22, padding: 14, textAlignVertical: 'top' },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingBottom: 10 },
  composerAction: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  composerActionEmoji: { fontSize: 16 },
  sendBtn: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: DPURPLE, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 24 },

  // Voice mode
  voiceCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#180a28', borderRadius: 16, borderWidth: 1, borderColor: '#3d1a5e', padding: 16 },
  voiceCardHeader: { marginBottom: 10 },
  voiceCardTitle: { color: '#c4b5fd', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  waveformRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  waveBar: { width: 3, borderRadius: 2 },
  voiceTimer: { color: '#e8dff5', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  voiceHint: { color: '#7c5a9e', fontSize: 10, marginBottom: 12 },
  voiceBtns: { flexDirection: 'row', gap: 10 },
  voiceSend: { flex: 1, backgroundColor: DPURPLE, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  voiceSendText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  voiceCancel: { paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  voiceCancelText: { color: '#5a3a78', fontSize: 13 },

  // Support sent
  supportSentCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)', padding: 12 },
  supportSentText: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundEmoji: { fontSize: 36, marginBottom: 12 },
  notFoundText: { color: '#5a3a78', fontSize: 15 },

  // Stay modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#180a28', borderRadius: 24, borderWidth: 1, borderColor: '#3d1a5e', padding: 24, width: '100%', alignItems: 'center' },
  modalEmoji: { fontSize: 40, marginBottom: 12 },
  modalTitle: { color: '#e8dff5', fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  modalBody: { color: '#c4b5fd', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  modalBtn: { backgroundColor: DPURPLE, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 12, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  modalCancel: { paddingVertical: 8 },
  modalCancelText: { color: '#5a3a78', fontSize: 13, fontWeight: '600' },

  // Support sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#130828', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, paddingTop: 12, borderWidth: 1, borderColor: '#3d1a5e' },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#3d1a5e', borderRadius: 999, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { marginBottom: 20 },
  sheetTitle: { color: '#f0e6ff', fontSize: 17, fontWeight: '900' },
  sheetSub: { color: '#7c5a9e', fontSize: 11, marginTop: 3 },
  sheetClose: { position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  sheetCloseText: { color: '#c4b5fd', fontSize: 15 },
  supportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  supportCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: '#2e1250', padding: 20, alignItems: 'center', gap: 8 },
  supportCardEmoji: { fontSize: 32 },
  supportCardLabel: { color: '#c4b5fd', fontSize: 13, fontWeight: '800', textAlign: 'center' },
});
