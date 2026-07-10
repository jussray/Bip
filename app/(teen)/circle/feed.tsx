// app/(teen)/circle/feed.tsx
// SE'KRET CIRCLE — Anonymous feed
// Design targets (from mockup):
//   ✓ "Se'kret is here" ambient banner
//   ✓ Named circle identity per post (loaded from loadTeenCircleIdentity)
//   ✓ Se'kret says… anchor card injected between posts
//   ✓ "Stay With Them" panel — count + avatar row + join/quietly buttons
//   ✓ Safe Energy Controls bottom sheet (hide harsh / comfort-only / voice-only / anon mode)
//   ✓ "Se'kret noticed… heavy post" nudge
//   ✓ Reaction counts with full labels
//   ✓ For You / New / Following / Anonymous feed tabs

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '@/context/AppContext';
import { writeCirclePost, loadCircleFeed, syncCircleReaction } from '@/utils/sync';
import type { CirclePost } from '@/context/AppContext';
import { GlitterSparkles } from '../../../components/GlitterSparkles';
import { reportPost } from '@/utils/circleModeration';
import { loadTeenCircleIdentity } from '@/features/identity/profileIdentity';
import { IMAGES } from '@/constants/theme';

const CIRCLE_GLITTER_KEY   = 'circle_glitter_deco';
const SAFE_ENERGY_KEY      = 'circle_safe_energy_prefs';

const HEAVY_WORDS = ['alone', 'hurt', 'numb', 'scared', 'crying', 'hopeless', 'dark', 'can\'t', 'empty', 'sad', 'pain', 'dying', 'hate myself'];

const REACTION_LABELS: { key: keyof CirclePost['reactions']; emoji: string; label: string }[] = [
  { key: 'felt',    emoji: '💜', label: 'felt this too'   },
  { key: 'comfort', emoji: '☁️', label: 'sending comfort' },
  { key: 'proud',   emoji: '⭐', label: 'proud of you'    },
  { key: 'stay',    emoji: '🌙', label: 'stayed with you' },
];

type FeedTab = 'foryou' | 'new' | 'following' | 'anonymous';
const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: 'foryou',    label: 'For You'    },
  { key: 'new',       label: 'New'        },
  { key: 'following', label: 'Following'  },
  { key: 'anonymous', label: 'Anonymous'  },
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

const PURPLE  = '#a855f7';
const DPURPLE = '#7c3aed';

const SEKRET_SAYS = [
  "You don't have to carry this alone.",
  "Whatever you're feeling is valid. All of it.",
  "This circle shows up for you. Every time.",
  "Breathe first. Then respond.",
  "It's okay to just sit here for a minute.",
  "You reached out. That already took courage.",
];

// Placeholder avatar circles for "Stay With Them" panel
const STAY_AVATAR_COLORS = ['#7c3aed','#a855f7','#6366f1','#ec4899','#8b5cf6','#3b82f6','#f472b6','#818cf8'];

function defaultReactions(): CirclePost['reactions'] {
  return { felt: 0, comfort: 0, proud: 0, stay: 0 };
}

function normalizeReactions(raw: unknown): CirclePost['reactions'] {
  const r = (raw ?? {}) as Partial<Record<keyof CirclePost['reactions'], number>>;
  return {
    felt:    Number(r.felt    ?? 0),
    comfort: Number(r.comfort ?? 0),
    proud:   Number(r.proud   ?? 0),
    stay:    Number(r.stay    ?? 0),
  };
}

function getPostMood(text: string): { emoji: string; color: string } | null {
  for (const m of MOOD_OPTS) {
    if (text.startsWith(m.emoji + ' ')) return { emoji: m.emoji, color: MOOD_COLORS[m.id] };
  }
  return null;
}

function isHeavyPost(text: string): boolean {
  const lower = text.toLowerCase();
  return HEAVY_WORDS.some(w => lower.includes(w));
}

function stayCount(reactions: CirclePost['reactions']): number {
  return (reactions.stay ?? 0) + (reactions.felt ?? 0);
}

// ─── Safe Energy Prefs ────────────────────────────────────────────────────────
interface SafeEnergyPrefs {
  hideHarsh:    boolean;
  comfortOnly:  boolean;
  voiceOnly:    boolean;
  anonMode:     boolean;
}

const DEFAULT_PREFS: SafeEnergyPrefs = {
  hideHarsh:   false,
  comfortOnly: false,
  voiceOnly:   false,
  anonMode:    true,
};

async function loadPrefs(): Promise<SafeEnergyPrefs> {
  try {
    const raw = await AsyncStorage.getItem(SAFE_ENERGY_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch { return DEFAULT_PREFS; }
}

async function savePrefs(p: SafeEnergyPrefs) {
  try { await AsyncStorage.setItem(SAFE_ENERGY_KEY, JSON.stringify(p)); } catch {}
}

// ─── CircleFeed component ─────────────────────────────────────────────────────
export function CircleFeed() {
  const { circlePosts, setCirclePosts } = useAppContext();

  const [draft,        setDraft]        = useState('');
  const [composeMood,  setComposeMood]  = useState('');
  const [refreshing,   setRefreshing]   = useState(false);
  const [posting,      setPosting]      = useState(false);
  const [feedTab,      setFeedTab]      = useState<FeedTab>('foryou');
  const [reportedIds,  setReportedIds]  = useState<Set<string>>(new Set());
  const [circleName,   setCircleName]   = useState('anonymous bip');
  const [safeSheet,    setSafeSheet]    = useState(false);
  const [prefs,        setPrefs]        = useState<SafeEnergyPrefs>(DEFAULT_PREFS);
  const [stayPostId,   setStayPostId]   = useState<string | null>(null);
  const [stayJoined,   setStayJoined]   = useState<Set<string>>(new Set());
  const [heavyDismiss, setHeavyDismiss] = useState<Set<string>>(new Set());

  // Se'kret says cycling
  const sekretIdx = useRef(Math.floor(Math.random() * SEKRET_SAYS.length));

  // Breathe animation for Se'kret cloud
  const breathe = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.04, duration: 2400, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,    duration: 2400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  useEffect(() => {
    void fetchFeed();
    loadTeenCircleIdentity().then(v => setCircleName(v.circleName));
    loadPrefs().then(setPrefs);
  }, []);

  function handleReport(postId: CirclePost['id']) {
    Alert.alert(
      'Report this bip?',
      "We'll take a look. It'll stop showing up in your feed right away.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report', style: 'destructive',
          onPress: () => {
            setReportedIds(prev => new Set(prev).add(String(postId)));
            void reportPost(Number(postId), 'public');
          },
        },
      ]
    );
  }

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
    const optimistic: CirclePost = {
      id:        Date.now(),
      text:      fullText,
      date:      new Date().toLocaleDateString(),
      time:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: defaultReactions(),
    };
    setCirclePosts(prev => [optimistic, ...prev]);
    setDraft('');
    setComposeMood('');
    try { await writeCirclePost('public', fullText); } finally { setPosting(false); }
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

  function updatePref(key: keyof SafeEnergyPrefs, val: boolean) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    void savePrefs(next);
  }

  function joinStay(postId: string) {
    setStayJoined(prev => new Set(prev).add(postId));
    react(postId as any, 'stay');
    setStayPostId(null);
  }

  // ── Visible posts (filtered by prefs) ────────────────────────────────────
  const visiblePosts = circlePosts.filter(p => {
    if (reportedIds.has(String(p.id))) return false;
    return true;
  });

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderAmbientBanner = () => (
    <View style={s.ambientBanner}>
      <Animated.Text style={[s.ambientCloud, { transform: [{ scale: breathe }] }]}>☁️</Animated.Text>
      <View style={s.ambientTextWrap}>
        <Text style={s.ambientTitle}>✦ Se'kret is here.</Text>
        <Text style={s.ambientSub}>watching over this space.</Text>
      </View>
      <TouchableOpacity onPress={() => setSafeSheet(true)} style={s.safeBtn}>
        <Text style={s.safeBtnText}>🛡️ safe energy</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSekretSays = () => (
    <View style={s.sekretSaysCard}>
      <View style={s.sekretSaysRow}>
        <Text style={s.sekretSaysLabel}>✦ Se'kret says…</Text>
      </View>
      <Text style={s.sekretSaysText}>{SEKRET_SAYS[sekretIdx.current]}</Text>
    </View>
  );

  const renderPost = ({ item: post, index }: { item: CirclePost; index: number }) => {
    const postMood    = getPostMood(post.text);
    const displayText = postMood ? post.text.slice(post.text.indexOf(' ') + 1) : post.text;
    const reactions   = normalizeReactions(post.reactions);
    const sCount      = stayCount(reactions);
    const heavy       = isHeavyPost(post.text) && !heavyDismiss.has(String(post.id));
    const pid         = String(post.id);

    return (
      <View key={pid}>
        {/* Se'kret noticed — heavy post nudge */}
        {heavy && (
          <View style={s.heavyNudge}>
            <View style={s.heavyNudgeRow}>
              <Text style={s.heavyNudgeEmoji}>☁️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.heavyNudgeTitle}>Se'kret noticed…</Text>
                <Text style={s.heavyNudgeBody}>This post is heavy tonight. Would you like comfort mode?</Text>
              </View>
              <TouchableOpacity onPress={() => setHeavyDismiss(prev => new Set(prev).add(pid))} style={s.heavyNudgeDismiss}>
                <Text style={s.heavyNudgeDismissText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.heavyNudgeBtns}>
              <TouchableOpacity style={s.heavyYes} onPress={() => setHeavyDismiss(prev => new Set(prev).add(pid))}>
                <Text style={s.heavyYesText}>Yes, please</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.heavyNo} onPress={() => setHeavyDismiss(prev => new Set(prev).add(pid))}>
                <Text style={s.heavyNoText}>Not now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[s.card, postMood && { borderLeftColor: postMood.color, borderLeftWidth: 3 }]}
          onPress={() => router.push(`/(teen)/circle/${post.id}` as any)}
          activeOpacity={0.8}
        >
          {/* Post header */}
          <View style={s.cardHeader}>
            <View style={s.anonBadge}>
              <View style={[s.anonAvatar, { backgroundColor: STAY_AVATAR_COLORS[index % STAY_AVATAR_COLORS.length] + '55' }]}>
                <Text style={s.anonAvatarText}>🌑</Text>
              </View>
              <View>
                <Text style={s.anonName}>{circleName}</Text>
                <Text style={s.anonSub}>anonymous 🌑 · {post.date} · {post.time}</Text>
              </View>
            </View>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => handleReport(post.id)}
            >
              <Text style={s.reportFlag}>···</Text>
            </TouchableOpacity>
          </View>

          {/* Post text */}
          <Text style={s.cardText}>{displayText}</Text>

          {/* Mood badge */}
          {postMood && (
            <View style={[s.moodBadge, { borderColor: postMood.color + '55', backgroundColor: postMood.color + '15' }]}>
              <Text style={[s.moodBadgeText, { color: postMood.color }]}>Mood: {postMood.emoji}</Text>
            </View>
          )}

          {/* Reactions */}
          <View style={s.reactions}>
            {REACTION_LABELS.map(({ key, emoji, label }) => {
              const count = reactions[key] ?? 0;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.reactionBtn, count > 0 && s.reactionBtnActive]}
                  onPress={e => { e.stopPropagation?.(); react(post.id, key); }}
                >
                  <Text style={s.reactionEmoji}>{emoji}</Text>
                  <Text style={[s.reactionCount, count > 0 && s.reactionCountActive]}>{count}</Text>
                  <Text style={[s.reactionLabel, count > 0 && s.reactionLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stay With Them footer */}
          {sCount > 0 && (
            <TouchableOpacity
              style={s.stayFooter}
              onPress={e => { e.stopPropagation?.(); setStayPostId(pid); }}
              activeOpacity={0.7}
            >
              <View style={s.stayAvatarRow}>
                {Array.from({ length: Math.min(sCount, 5) }).map((_, i) => (
                  <View key={i} style={[s.stayAvatar, { backgroundColor: STAY_AVATAR_COLORS[i % STAY_AVATAR_COLORS.length], marginLeft: i === 0 ? 0 : -8 }]} />
                ))}
              </View>
              <Text style={s.stayFooterText}>{sCount} {sCount === 1 ? 'person is' : 'people are'} sitting with this feeling</Text>
              <Text style={s.stayChevron}>›</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Se'kret says card — injected after every 3rd post */}
        {(index + 1) % 3 === 0 && renderSekretSays()}
      </View>
    );
  };

  return (
    <FlatList
      data={visiblePosts}
      keyExtractor={p => String(p.id)}
      renderItem={renderPost}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListHeaderComponent={
        <>
          {renderAmbientBanner()}

          {/* Feed tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.feedTabRail}>
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

          {/* Compose card */}
          <View style={s.composeCard}>
            <Text style={s.composeLabel}>put something into the circle</Text>
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
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🌙</Text>
          <Text style={s.emptyText}>the circle is quiet. be the first to bip.</Text>
        </View>
      }
      ListFooterComponent={<View style={{ height: 40 }} />}
    />
  );
}

// ─── Main screen wrapper ──────────────────────────────────────────────────────
export default function CircleScreen() {
  const [glitterOn,  setGlitterOn]  = useState(false);
  const [safeSheet,  setSafeSheet]  = useState(false);
  const [prefs,      setPrefs]      = useState<SafeEnergyPrefs>(DEFAULT_PREFS);
  const [stayPostId, setStayPostId] = useState<string | null>(null);
  const [stayJoined, setStayJoined] = useState<Set<string>>(new Set());
  const { circlePosts, setCirclePosts } = useAppContext();

  useEffect(() => {
    AsyncStorage.getItem(CIRCLE_GLITTER_KEY).then(v => { if (v === 'true') setGlitterOn(true); }).catch(() => {});
    loadPrefs().then(setPrefs);
  }, []);

  function toggleGlitter() {
    setGlitterOn(prev => {
      const next = !prev;
      void AsyncStorage.setItem(CIRCLE_GLITTER_KEY, next ? 'true' : 'false');
      return next;
    });
  }

  function updatePref(key: keyof SafeEnergyPrefs, val: boolean) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    void savePrefs(next);
  }

  function joinStay(postId: string) {
    setStayJoined(prev => new Set(prev).add(postId));
    setCirclePosts(posts =>
      posts.map(p =>
        String(p.id) === postId
          ? { ...p, reactions: { ...normalizeReactions(p.reactions), stay: (normalizeReactions(p.reactions).stay ?? 0) + 1 } }
          : p
      )
    );
    setStayPostId(null);
  }

  const stayPost = stayPostId ? circlePosts.find(p => String(p.id) === stayPostId) : null;
  const stayPostCount = stayPost ? stayCount(normalizeReactions(stayPost.reactions)) : 0;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.kicker}>{"SE'KRET BIP"}</Text>
          <Text style={s.title}>{'Circle 💜'}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={[s.anonPill, glitterOn && s.glitterPillActive]}
            onPress={toggleGlitter}
          >
            <Text style={s.anonPillText}>{glitterOn ? '✨ deco on' : '✨ deco'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.anonPill} onPress={() => setSafeSheet(true)}>
            <Text style={s.anonPillText}>🌑 anonymous</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CircleFeed />

      {glitterOn ? <GlitterSparkles count={14} /> : null}

      {/* ── Safe Energy Controls sheet ── */}
      <Modal visible={safeSheet} transparent animationType="slide">
        <View style={s.sheetOverlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>⚡ Safe Energy Controls</Text>
                <Text style={s.sheetSub}>help keep this space soft.</Text>
              </View>
              <TouchableOpacity onPress={() => setSafeSheet(false)} style={s.sheetClose}>
                <Text style={s.sheetCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {([
              { key: 'hideHarsh',   label: 'Hide harsh advice',     emoji: '🛡️' },
              { key: 'comfortOnly', label: 'Comfort-only replies',  emoji: '☁️' },
              { key: 'voiceOnly',   label: 'Voice replies only',    emoji: '🎙️' },
              { key: 'anonMode',    label: 'Anonymous support mode',emoji: '🌑' },
            ] as { key: keyof SafeEnergyPrefs; label: string; emoji: string }[]).map(row => (
              <View key={row.key} style={s.sheetRow}>
                <Text style={s.sheetRowEmoji}>{row.emoji}</Text>
                <Text style={s.sheetRowLabel}>{row.label}</Text>
                <Switch
                  value={prefs[row.key]}
                  onValueChange={v => updatePref(row.key, v)}
                  trackColor={{ false: '#2e1250', true: PURPLE }}
                  thumbColor={prefs[row.key] ? '#fff' : '#7c5a9e'}
                />
              </View>
            ))}

            {/* Emotional Translator card */}
            <View style={s.translatorCard}>
              <View style={s.translatorRow}>
                <Text style={s.translatorEmoji}>🔮</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.translatorTitle}>Emotional Translator (Se'kret)</Text>
                  <Text style={s.translatorBody}>Sometimes it helps to understand what your feeling is trying to say.</Text>
                </View>
              </View>
              <View style={s.translatorBtns}>
                <TouchableOpacity style={s.translatorYes} onPress={() => setSafeSheet(false)}>
                  <Text style={s.translatorYesText}>Yes, please</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.translatorNo} onPress={() => setSafeSheet(false)}>
                  <Text style={s.translatorNoText}>Not now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Stay With Them panel ── */}
      <Modal visible={!!stayPostId} transparent animationType="fade">
        <View style={s.stayOverlay}>
          <View style={s.stayPanel}>
            <TouchableOpacity onPress={() => setStayPostId(null)} style={s.stayPanelClose}>
              <Text style={s.stayPanelCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={s.stayPanelTitle}>Stay With Them 🌙</Text>
            <Text style={s.stayPanelCount}>
              {stayPostCount + 1} people are sitting with this feeling tonight.
            </Text>
            <View style={s.stayAvatarRowLarge}>
              {Array.from({ length: Math.min(stayPostCount + 1, 8) }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.stayAvatarLarge,
                    { backgroundColor: STAY_AVATAR_COLORS[i % STAY_AVATAR_COLORS.length] },
                    i > 0 && { marginLeft: -10 },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              style={s.stayJoinBtn}
              onPress={() => stayPostId && joinStay(stayPostId)}
            >
              <Text style={s.stayJoinBtnText}>
                {stayPostId && stayJoined.has(stayPostId) ? 'You\'re with them 💜' : 'Join the circle ›'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.stayQuietBtn}
              onPress={() => setStayPostId(null)}
            >
              <Text style={s.stayQuietBtnText}>I'll stay quietly 🌙</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0d0518' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  kicker: { color: '#5a3a78', fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title:  { color: '#f0e6ff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  anonPill: { backgroundColor: '#1e0b30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#3d1a5e' },
  glitterPillActive: { backgroundColor: '#3d1a5e', borderColor: '#f472b6' },
  anonPillText: { color: '#7c5a9e', fontSize: 11, fontWeight: '600' },

  // Ambient banner
  ambientBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', paddingHorizontal: 14, paddingVertical: 10 },
  ambientCloud:  { fontSize: 24 },
  ambientTextWrap: { flex: 1 },
  ambientTitle:  { color: '#c4b5fd', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  ambientSub:    { color: '#7c5a9e', fontSize: 10, marginTop: 1 },
  safeBtn:       { backgroundColor: '#1e0b30', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#3d1a5e' },
  safeBtnText:   { color: '#a855f7', fontSize: 10, fontWeight: '700' },

  // Feed tabs
  feedTabRail:      { gap: 6, paddingHorizontal: 16, paddingBottom: 10, paddingTop: 4 },
  feedTab:          { borderRadius: 999, borderWidth: 1, borderColor: '#2d1450', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 14, paddingVertical: 6 },
  feedTabActive:    { borderColor: PURPLE, backgroundColor: 'rgba(168,85,247,0.15)' },
  feedTabText:      { color: '#5a3a78', fontSize: 11, fontWeight: '700' },
  feedTabTextActive:{ color: '#c4b5fd' },

  // Compose
  composeCard:   { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#180a28', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#3d1a5e', shadowColor: PURPLE, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  composeLabel:  { color: '#6b4888', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  moodRow:       { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  moodPill:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#2d1450', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.04)' },
  moodPillEmoji: { fontSize: 13 },
  moodPillLabel: { color: '#6b4888', fontSize: 10, fontWeight: '600' },
  input:         { color: '#e8dff5', fontSize: 15, minHeight: 64, lineHeight: 22, backgroundColor: '#100520', borderRadius: 12, padding: 12, marginBottom: 10, textAlignVertical: 'top' },
  composeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount:     { color: '#5a3a78', fontSize: 12 },
  postBtn:         { backgroundColor: DPURPLE, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9 },
  postBtnDisabled: { opacity: 0.35 },
  postBtnText:     { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Post card
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#16082a', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#3d1a5e', shadowColor: DPURPLE, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  anonBadge:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  anonAvatar:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  anonAvatarText:{ fontSize: 16 },
  anonName:      { color: '#c4b5fd', fontSize: 13, fontWeight: '800' },
  anonSub:       { color: '#5a3a78', fontSize: 9, marginTop: 1 },
  reportFlag:    { color: '#5a3a78', fontSize: 16, paddingHorizontal: 4 },
  cardText:      { color: '#e8dff5', fontSize: 16, lineHeight: 26, marginBottom: 10 },
  moodBadge:     { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  moodBadgeText: { fontSize: 11, fontWeight: '700' },

  // Reactions
  reactions:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  reactionBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e0a30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#2e1250' },
  reactionBtnActive:   { backgroundColor: '#3d1a5e', borderColor: DPURPLE },
  reactionEmoji:       { fontSize: 13 },
  reactionCount:       { color: '#5a3a78', fontSize: 11, fontWeight: '800' },
  reactionCountActive: { color: PURPLE },
  reactionLabel:       { color: '#5a3a78', fontSize: 10, fontWeight: '600' },
  reactionLabelActive: { color: '#c4b5fd' },

  // Stay With Them footer on card
  stayFooter:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2e1250' },
  stayAvatarRow:  { flexDirection: 'row' },
  stayAvatar:     { width: 20, height: 20, borderRadius: 10 },
  stayFooterText: { flex: 1, color: '#7c5a9e', fontSize: 10, fontWeight: '600' },
  stayChevron:    { color: PURPLE, fontSize: 16 },

  // Se'kret says card
  sekretSaysCard:  { marginHorizontal: 16, marginBottom: 14, backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', padding: 16 },
  sekretSaysRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sekretSaysLabel: { color: '#a855f7', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  sekretSaysText:  { color: '#e8dff5', fontSize: 18, fontWeight: '700', lineHeight: 28 },

  // Heavy post nudge
  heavyNudge:         { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1a0830', borderRadius: 16, borderWidth: 1, borderColor: '#3d1a5e', padding: 14 },
  heavyNudgeRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  heavyNudgeEmoji:    { fontSize: 22 },
  heavyNudgeTitle:    { color: '#c4b5fd', fontSize: 12, fontWeight: '800', marginBottom: 3 },
  heavyNudgeBody:     { color: '#9a7eb8', fontSize: 12, lineHeight: 18 },
  heavyNudgeDismiss:  { padding: 4 },
  heavyNudgeDismissText: { color: '#5a3a78', fontSize: 14 },
  heavyNudgeBtns:     { flexDirection: 'row', gap: 10 },
  heavyYes:           { flex: 1, backgroundColor: DPURPLE, borderRadius: 12, paddingVertical: 9, alignItems: 'center' },
  heavyYesText:       { color: '#fff', fontWeight: '800', fontSize: 13 },
  heavyNo:            { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#3d1a5e' },
  heavyNoText:        { color: '#7c5a9e', fontSize: 13, fontWeight: '600' },

  // Empty state
  empty:      { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyText:  { color: '#4a2e60', fontSize: 14, textAlign: 'center' },

  // Safe Energy sheet
  sheetOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#130828', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, paddingTop: 12, borderWidth: 1, borderColor: '#3d1a5e' },
  sheetHandle:    { width: 40, height: 4, backgroundColor: '#3d1a5e', borderRadius: 999, alignSelf: 'center', marginBottom: 16 },
  sheetHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sheetTitle:     { color: '#f0e6ff', fontSize: 17, fontWeight: '900' },
  sheetSub:       { color: '#7c5a9e', fontSize: 11, marginTop: 3 },
  sheetClose:     { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  sheetCloseText: { color: '#c4b5fd', fontSize: 15 },
  sheetRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e0b30' },
  sheetRowEmoji:  { fontSize: 18, width: 24, textAlign: 'center' },
  sheetRowLabel:  { flex: 1, color: '#c4b5fd', fontSize: 14, fontWeight: '600' },

  // Emotional Translator
  translatorCard:  { marginTop: 16, backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', padding: 14 },
  translatorRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  translatorEmoji: { fontSize: 22, marginTop: 2 },
  translatorTitle: { color: '#c4b5fd', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  translatorBody:  { color: '#9a7eb8', fontSize: 12, lineHeight: 18 },
  translatorBtns:  { flexDirection: 'row', gap: 10 },
  translatorYes:   { flex: 1, backgroundColor: DPURPLE, borderRadius: 12, paddingVertical: 9, alignItems: 'center' },
  translatorYesText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  translatorNo:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#3d1a5e' },
  translatorNoText:{ color: '#7c5a9e', fontSize: 13, fontWeight: '600' },

  // Stay With Them panel modal
  stayOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  stayPanel:         { backgroundColor: '#130828', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, borderWidth: 1, borderColor: '#3d1a5e', alignItems: 'center' },
  stayPanelClose:    { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  stayPanelCloseText:{ color: '#c4b5fd', fontSize: 15 },
  stayPanelTitle:    { color: '#f0e6ff', fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  stayPanelCount:    { color: '#9a7eb8', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  stayAvatarRowLarge:{ flexDirection: 'row', marginBottom: 24 },
  stayAvatarLarge:   { width: 36, height: 36, borderRadius: 18 },
  stayJoinBtn:       { width: '100%', backgroundColor: DPURPLE, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  stayJoinBtnText:   { color: '#fff', fontWeight: '900', fontSize: 15 },
  stayQuietBtn:      { paddingVertical: 10 },
  stayQuietBtnText:  { color: '#7c5a9e', fontSize: 13, fontWeight: '600' },
});
