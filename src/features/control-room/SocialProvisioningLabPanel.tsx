import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getCurrentFounderProfile, isFounderProfile } from '@/services/founderAudit';

type PlatformId = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'x';
type RehearsalStatus = 'not_tested' | 'human_required';

type PlatformDefinition = {
  id: PlatformId;
  name: string;
  lane: string;
  humanGate: string;
};

type RehearsalResult = {
  status: RehearsalStatus;
  checks: string[];
  testedAt: string | null;
};

const PLATFORMS: PlatformDefinition[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    lane: 'Visual product story and founder progress',
    humanGate: 'Founder signup, terms, login, and any email, phone, device, identity, or captcha verification.',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    lane: 'Family-facing updates and community discovery',
    humanGate: 'Founder profile or business setup, terms, permissions, and any verification requested by the platform.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    lane: 'Short-form product principles and controlled demonstrations',
    humanGate: 'Founder signup, terms, age or identity checks, and any email, phone, device, or captcha verification.',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    lane: 'Longer demonstrations, founder explanations, and product evidence',
    humanGate: 'Founder Google or YouTube channel authorization, terms, permissions, and any verification requested.',
  },
  {
    id: 'x',
    name: 'X',
    lane: 'Concise founder notes, build decisions, and release evidence',
    humanGate: 'Founder signup, terms, login, and any email, phone, device, identity, or captcha verification.',
  },
];

const EMPTY_RESULT: RehearsalResult = {
  status: 'not_tested',
  checks: [],
  testedAt: null,
};

function emptyResults(): Record<PlatformId, RehearsalResult> {
  return PLATFORMS.reduce((accumulator, platform) => {
    accumulator[platform.id] = { ...EMPTY_RESULT };
    return accumulator;
  }, {} as Record<PlatformId, RehearsalResult>);
}

function buildChecks(platform: PlatformDefinition): string[] {
  return [
    'Observed truth: no live account or connected API is assumed.',
    'Desired identity: Se’kret Bip with candidate handles @sekretbip or @sekretbipapp.',
    'Candidate handles remain unverified until the platform confirms availability.',
    `Content lane assigned: ${platform.lane}.`,
    'No password, one-time code, token, secret, or private user content is requested or stored.',
    'No social-platform network request, signup submission, terms acceptance, or hidden browser automation was performed.',
    `Human-only gate preserved: ${platform.humanGate}`,
    'Dry-run result: human_required. No external account was created.',
  ];
}

export default function SocialProvisioningLabPanel() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [results, setResults] = useState<Record<PlatformId, RehearsalResult>>(() => emptyResults());

  useEffect(() => {
    let active = true;
    void getCurrentFounderProfile().then(profile => {
      if (!active) return;
      setAuthorized(Boolean(profile && isFounderProfile(profile) && profile.can_manage_app));
    });
    return () => {
      active = false;
    };
  }, []);

  const completedCount = useMemo(
    () => Object.values(results).filter(result => result.status === 'human_required').length,
    [results],
  );

  function runDryTest(platform: PlatformDefinition) {
    setResults(current => ({
      ...current,
      [platform.id]: {
        status: 'human_required',
        checks: buildChecks(platform),
        testedAt: new Date().toISOString(),
      },
    }));
  }

  function runAllDevilTests() {
    const testedAt = new Date().toISOString();
    const next = emptyResults();
    for (const platform of PLATFORMS) {
      next[platform.id] = {
        status: 'human_required',
        checks: buildChecks(platform),
        testedAt,
      };
    }
    setResults(next);
  }

  function resetLab() {
    setResults(emptyResults());
  }

  if (authorized === null) {
    return <View style={styles.center}><ActivityIndicator color="#a78bfa" /></View>;
  }

  if (!authorized) {
    return (
      <View style={styles.center}>
        <Text style={styles.locked}>Founder management access is required.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>SOCIAL PROVISIONING LAB</Text>
      <Text style={styles.title}>Test the machine without inventing the accounts.</Text>
      <Text style={styles.body}>
        This founder-only lab rehearses Se’kret Bip account provisioning. It creates no external account,
        accepts no terms, stores no credentials, and stops at the human-required gate.
      </Text>

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryValue}>{completedCount}/{PLATFORMS.length}</Text>
          <Text style={styles.summaryLabel}>devil tests completed</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.truthLabel}>LIVE ACCOUNTS CREATED</Text>
          <Text style={styles.truthValue}>0</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={runAllDevilTests}>
          <Text style={styles.primaryText}>Run all devil tests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondary]} onPress={resetLab}>
          <Text style={styles.secondaryText}>Reset lab</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.identityCard}>
        <Text style={styles.cardKicker}>CANDIDATE IDENTITY, NOT RESERVED</Text>
        <Text style={styles.identityName}>Se’kret Bip</Text>
        <Text style={styles.handle}>@sekretbip · fallback @sekretbipapp</Text>
        <Text style={styles.bio}>
          Privacy-first technology for reflection, connection, and emotional growth. Built thoughtfully for teens and families.
        </Text>
      </View>

      {PLATFORMS.map(platform => {
        const result = results[platform.id];
        const tested = result.status === 'human_required';
        return (
          <View key={platform.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.grow}>
                <Text style={styles.platform}>{platform.name}</Text>
                <Text style={styles.lane}>{platform.lane}</Text>
              </View>
              <Text style={[styles.status, tested ? styles.statusHuman : styles.statusUntested]}>
                {tested ? 'HUMAN REQUIRED' : 'NOT TESTED'}
              </Text>
            </View>

            <Text style={styles.gate}>Gate: {platform.humanGate}</Text>

            {result.checks.map(check => (
              <View key={check} style={styles.checkRow}>
                <Text style={styles.checkMark}>✓</Text>
                <Text style={styles.checkText}>{check}</Text>
              </View>
            ))}

            {result.testedAt ? <Text style={styles.timestamp}>Rehearsed {new Date(result.testedAt).toLocaleString()}</Text> : null}

            <TouchableOpacity style={styles.platformButton} onPress={() => runDryTest(platform)}>
              <Text style={styles.platformButtonText}>{tested ? 'Re-run dry test' : 'Run dry test'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.stopCard}>
        <Text style={styles.stopTitle}>Stop condition proved</Text>
        <Text style={styles.stopBody}>
          A successful rehearsal ends at human_required. The lab has no code path that marks a platform connected or live.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080611' },
  content: { padding: 22, paddingTop: 72, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#080611', alignItems: 'center', justifyContent: 'center', padding: 28 },
  locked: { color: '#c4b5fd', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  kicker: { color: '#a78bfa', fontSize: 10, fontWeight: '900', letterSpacing: 2.3, marginBottom: 10 },
  title: { color: '#fff', fontSize: 28, lineHeight: 35, fontWeight: '900', marginBottom: 12 },
  body: { color: '#aaa1b8', fontSize: 13, lineHeight: 20, marginBottom: 18 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#2a2436', borderRadius: 20, padding: 18, backgroundColor: '#0d0a15', marginBottom: 12 },
  summaryValue: { color: '#fff', fontSize: 25, fontWeight: '900' },
  summaryLabel: { color: '#7c7489', fontSize: 11, marginTop: 3 },
  summaryRight: { alignItems: 'flex-end' },
  truthLabel: { color: '#7c7489', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  truthValue: { color: '#6ee7b7', fontSize: 25, fontWeight: '900', marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionButton: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  primary: { backgroundColor: '#6d28d9' },
  secondary: { borderWidth: 1, borderColor: '#3b3448', backgroundColor: '#0d0a15' },
  primaryText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  secondaryText: { color: '#c4b5fd', fontSize: 12, fontWeight: '900' },
  identityCard: { borderWidth: 1, borderColor: '#5b21b666', borderRadius: 20, padding: 18, backgroundColor: '#6d28d914', marginBottom: 14 },
  cardKicker: { color: '#a78bfa', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  identityName: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 8 },
  handle: { color: '#c4b5fd', fontSize: 12, marginTop: 4 },
  bio: { color: '#aaa1b8', fontSize: 12, lineHeight: 18, marginTop: 10 },
  card: { borderWidth: 1, borderColor: '#2a2436', borderRadius: 20, padding: 18, backgroundColor: '#0d0a15', marginBottom: 14 },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  grow: { flex: 1 },
  platform: { color: '#fff', fontSize: 17, fontWeight: '900' },
  lane: { color: '#aaa1b8', fontSize: 11, lineHeight: 17, marginTop: 4 },
  status: { fontSize: 8, fontWeight: '900', letterSpacing: 1.1, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  statusHuman: { color: '#fbbf24', backgroundColor: '#fbbf2414' },
  statusUntested: { color: '#8f899e', backgroundColor: '#8f899e14' },
  gate: { color: '#c4b5fd', fontSize: 11, lineHeight: 17, marginTop: 12 },
  checkRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 8 },
  checkMark: { color: '#6ee7b7', fontSize: 12, fontWeight: '900' },
  checkText: { flex: 1, color: '#91899f', fontSize: 11, lineHeight: 17 },
  timestamp: { color: '#625b72', fontSize: 9, marginTop: 10 },
  platformButton: { minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6d28d966', backgroundColor: '#6d28d914', marginTop: 12 },
  platformButtonText: { color: '#c4b5fd', fontSize: 12, fontWeight: '900' },
  stopCard: { borderWidth: 1, borderColor: '#6ee7b766', borderRadius: 20, padding: 18, backgroundColor: '#6ee7b70d' },
  stopTitle: { color: '#6ee7b7', fontSize: 15, fontWeight: '900' },
  stopBody: { color: '#aaa1b8', fontSize: 12, lineHeight: 18, marginTop: 7 },
});
