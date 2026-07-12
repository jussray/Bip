import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { isRelationshipFeatureAvailable } from '@/constants/relationshipFeatureFlags';
import {
  createCheckIn,
  fetchCrewFeed,
  fetchMyCheckIns,
  sendEncouragement,
  type CrewCheckInItem,
  type CrewFeedItem,
} from '@/services/crewAccountabilityService';
import { getSupabase } from '@/utils/supabase';
import type { CrewCheckinEmoji } from '@/types/relationshipLayer';

const AUDIENCE = 'public' as const;
const EMOJIS: CrewCheckinEmoji[] = ['great', 'okay', 'low', 'need_support', 'resting'];
const ENCOURAGEMENTS = [
  { key: 'with_you', label: 'with you 💜' },
  { key: 'proud_of_you', label: 'proud of you ⭐' },
  { key: 'keep_going', label: 'keep going 🌙' },
] as const;

interface AcceptedCrewMember {
  userId: string;
  nickname: string;
  avatarEmoji: string;
}

type CircleProfileRow = {
  user_id: string;
  nickname: string | null;
  avatar_emoji: string | null;
};

async function loadAcceptedCrew(): Promise<AcceptedCrewMember[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData.user;
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from('crew_members')
    .select('member_user_id')
    .eq('user_id', user.id)
    .eq('connection_status', 'accepted')
    .not('member_user_id', 'is', null);
  if (error) throw error;

  const userIds = [...new Set(
    (rows ?? [])
      .map(row => row.member_user_id as string | null)
      .filter((value): value is string => Boolean(value)),
  )];
  if (userIds.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from('circle_profiles')
    .select('user_id,nickname,avatar_emoji')
    .in('user_id', userIds);
  if (profileError) throw profileError;

  const profileMap = new Map<string, CircleProfileRow>(
    ((profiles ?? []) as CircleProfileRow[]).map(profile => [profile.user_id, profile]),
  );

  return userIds.map(userId => {
    const profile = profileMap.get(userId);
    return {
      userId,
      nickname: profile?.nickname?.trim() || 'Crew member',
      avatarEmoji: profile?.avatar_emoji?.trim() || '🌙',
    };
  });
}

export function CrewAccountabilityScreen() {
  const available = isRelationshipFeatureAvailable('crewAccountability', AUDIENCE);
  const [members, setMembers] = useState<AcceptedCrewMember[]>([]);
  const [myCheckIns, setMyCheckIns] = useState<CrewCheckInItem[]>([]);
  const [feed, setFeed] = useState<CrewFeedItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [emoji, setEmoji] = useState<CrewCheckinEmoji>('okay');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(available);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!available) return;
    setError(null);
    setLoading(true);
    try {
      const [accepted, mine, shared] = await Promise.all([
        loadAcceptedCrew(),
        fetchMyCheckIns(AUDIENCE),
        fetchCrewFeed(AUDIENCE),
      ]);
      setMembers(accepted);
      if (mine.ok) setMyCheckIns(mine.value);
      else setError(mine.message);
      if (shared.ok) setFeed(shared.value);
      else setError(current => current ?? shared.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Crew could not load.');
    } finally {
      setLoading(false);
    }
  }, [available]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedMembers = useMemo(
    () => members.filter(member => selectedIds.has(member.userId)),
    [members, selectedIds],
  );

  function toggleMember(userId: string) {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function submitCheckIn() {
    if (selectedIds.size === 0 || saving) return;
    setSaving(true);
    setError(null);
    const result = await createCheckIn({
      localDate: new Date().toISOString().slice(0, 10),
      emoji,
      note,
      shareWithUserIds: [...selectedIds],
    }, AUDIENCE);
    if (!result.ok) {
      setError(result.message);
      setSaving(false);
      return;
    }
    setNote('');
    setSelectedIds(new Set());
    await refresh();
    setSaving(false);
  }

  async function encourage(item: CrewFeedItem, presetKey: string) {
    setError(null);
    const result = await sendEncouragement({
      checkInId: item.checkInId,
      recipientUserId: item.ownerUserId,
      presetKey,
      localDate: new Date().toISOString().slice(0, 10),
    }, AUDIENCE);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await refresh();
  }

  if (!available) {
    return (
      <View style={styles.center}>
        <Text style={styles.previewEmoji}>🤝</Text>
        <Text style={styles.previewTitle}>Private Crew is being prepared.</Text>
        <Text style={styles.previewBody}>
          Crew will open only after real Bip-ID connections, acceptance, revocation, and shared check-ins are enabled together. Placeholder invite codes are no longer treated as real connections.
        </Text>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#a855f7" /></View>;
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>PRIVATE ACCOUNTABILITY</Text>
      <Text style={styles.title}>Bip Crew</Text>
      <Text style={styles.subtitle}>Only accepted Crew members can receive a check-in.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How are you showing up today?</Text>
        <View style={styles.rowWrap}>
          {EMOJIS.map(value => (
            <TouchableOpacity
              key={value}
              onPress={() => setEmoji(value)}
              style={[styles.chip, emoji === value && styles.chipActive]}
            >
              <Text style={styles.chipText}>{value.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          maxLength={280}
          multiline
          placeholder="a short note for your crew…"
          placeholderTextColor="#6b5a78"
          style={styles.input}
        />
        <Text style={styles.sectionLabel}>Share with accepted Crew</Text>
        {members.length === 0 ? (
          <Text style={styles.empty}>No accepted Crew connections yet.</Text>
        ) : members.map(member => {
          const selected = selectedIds.has(member.userId);
          return (
            <TouchableOpacity
              key={member.userId}
              onPress={() => toggleMember(member.userId)}
              style={[styles.member, selected && styles.memberSelected]}
            >
              <Text style={styles.memberEmoji}>{member.avatarEmoji}</Text>
              <Text style={styles.memberName}>{member.nickname}</Text>
              <Text style={styles.check}>{selected ? '✓' : '○'}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          disabled={selectedMembers.length === 0 || saving}
          onPress={() => void submitCheckIn()}
          style={[styles.primary, (selectedMembers.length === 0 || saving) && styles.disabled]}
        >
          <Text style={styles.primaryText}>{saving ? 'sharing…' : `Share with ${selectedMembers.length || 0}`}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shared with you</Text>
        {feed.length === 0 ? <Text style={styles.empty}>Nothing shared with you yet.</Text> : feed.map(item => (
          <View key={item.shareId} style={styles.feedItem}>
            <Text style={styles.feedEmoji}>{item.emoji}</Text>
            <Text style={styles.feedNote}>{item.note || 'A quiet check-in.'}</Text>
            <Text style={styles.feedMeta}>{item.localDate} · {item.encouragementCount} encouragements</Text>
            <View style={styles.rowWrap}>
              {ENCOURAGEMENTS.map(preset => (
                <TouchableOpacity
                  key={preset.key}
                  onPress={() => void encourage(item, preset.key)}
                  style={styles.encouragement}
                >
                  <Text style={styles.encouragementText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your recent check-ins</Text>
        {myCheckIns.length === 0 ? <Text style={styles.empty}>No check-ins yet.</Text> : myCheckIns.map(item => (
          <View key={item.id} style={styles.historyItem}>
            <Text style={styles.feedEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedNote}>{item.note || 'Quiet check-in'}</Text>
              <Text style={styles.feedMeta}>{item.localDate} · shared with {item.shares.filter(share => share.status === 'active').length}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0518' },
  content: { padding: 18, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#0d0518' },
  previewEmoji: { fontSize: 42, marginBottom: 14 },
  previewTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  previewBody: { color: '#9b8aaa', fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 420 },
  kicker: { color: '#8b5cf6', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900' },
  subtitle: { color: '#9b8aaa', fontSize: 13, marginTop: 5, marginBottom: 18 },
  error: { color: '#fecdd3', backgroundColor: '#3b1025', borderRadius: 12, padding: 11, marginBottom: 12 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: '#3d1a5e', backgroundColor: '#16082a', padding: 16, marginBottom: 14 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: '#3d1a5e', paddingHorizontal: 11, paddingVertical: 7 },
  chipActive: { backgroundColor: '#6d28d9', borderColor: '#a78bfa' },
  chipText: { color: '#e9ddf8', fontSize: 11, fontWeight: '700' },
  input: { minHeight: 80, borderRadius: 14, backgroundColor: '#100520', color: '#fff', padding: 12, marginTop: 12, textAlignVertical: 'top' },
  sectionLabel: { color: '#9b8aaa', fontSize: 11, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  member: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#2e1250', padding: 11, marginBottom: 8 },
  memberSelected: { borderColor: '#a855f7', backgroundColor: '#2d1450' },
  memberEmoji: { fontSize: 20, marginRight: 10 },
  memberName: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '800' },
  check: { color: '#c4b5fd', fontSize: 17 },
  primary: { minHeight: 48, borderRadius: 16, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  disabled: { opacity: 0.4 },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  empty: { color: '#806f90', fontSize: 12, lineHeight: 18 },
  feedItem: { borderTopWidth: 1, borderTopColor: '#2e1250', paddingTop: 12, marginTop: 10 },
  historyItem: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#2e1250', paddingTop: 11, marginTop: 9 },
  feedEmoji: { color: '#c4b5fd', fontSize: 18, marginBottom: 4 },
  feedNote: { color: '#f1e9fa', fontSize: 13, lineHeight: 19 },
  feedMeta: { color: '#806f90', fontSize: 10, marginTop: 4, marginBottom: 8 },
  encouragement: { borderRadius: 12, backgroundColor: '#2d1450', paddingHorizontal: 9, paddingVertical: 6 },
  encouragementText: { color: '#d8c7ea', fontSize: 10, fontWeight: '700' },
});
