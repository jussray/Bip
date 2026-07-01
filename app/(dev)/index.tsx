import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  auditEventToCard,
  founderAuditPlaybook,
  getCurrentFounderProfile,
  isFounderProfile,
  listFounderAuditEvents,
  type AuditEvent,
  type AuditSeverity,
  type FounderAuditCard,
  type FounderProfile,
} from '@/services/founderAudit';

const CATEGORY_LABEL: Record<FounderAuditCard['category'], string> = {
  structure: 'Structure',
  runtime: 'Runtime',
  memory: 'Memory',
  voice: 'Voice',
  safety: 'Safety',
  behavior: 'Behavior',
  rewards: 'Rewards',
  product: 'Product',
};

const SEVERITY_WEIGHT: Record<AuditSeverity, number> = {
  critical: 4,
  error: 3,
  warning: 2,
  info: 1,
};

function severityEmoji(severity: AuditSeverity) {
  switch (severity) {
    case 'critical': return '🔴';
    case 'error': return '🟠';
    case 'warning': return '🟡';
    default: return '🔵';
  }
}

function Card({ item }: { item: FounderAuditCard }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.badge}>{CATEGORY_LABEL[item.category]}</Text>
        <Text style={styles.severity}>{severityEmoji(item.severity)} {item.severity}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardText}>{item.summary}</Text>
      <View style={styles.fixBox}>
        <Text style={styles.fixLabel}>Fix path</Text>
        <Text style={styles.fixText}>{item.fix}</Text>
      </View>
      <Text style={styles.source}>{item.source === 'live-audit-event' ? 'Live Supabase audit event' : 'Se’kret founder playbook'}</Text>
    </View>
  );
}

export default function FounderDevDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);

  async function load() {
    const founderProfile = await getCurrentFounderProfile();
    setProfile(founderProfile);
    if (isFounderProfile(founderProfile)) {
      const rows = await listFounderAuditEvents(60);
      setEvents(rows);
    } else {
      setEvents([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const allowed = isFounderProfile(profile);
  const cards = useMemo(() => {
    const liveCards = events.filter((event) => !event.resolved).map(auditEventToCard);
    return [...liveCards, ...founderAuditPlaybook].sort(
      (a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity],
    );
  }, [events]);

  const criticalCount = cards.filter((card) => card.severity === 'critical').length;
  const liveCount = events.filter((event) => !event.resolved).length;
  const categories = new Set(cards.map((card) => card.category)).size;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#f0abfc" />
        <Text style={styles.centerText}>Opening founder dashboard…</Text>
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.center}>
        <Text style={styles.lock}>🔒</Text>
        <Text style={styles.title}>Founder tools are locked</Text>
        <Text style={styles.centerText}>This screen only opens for an app_profiles row with developer, admin, or founder audit access.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>Back to Bip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#f0abfc" />}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>Founder / Dev Profile</Text>
        <Text style={styles.heroTitle}>One dashboard for every Bip audit.</Text>
        <Text style={styles.heroText}>
          Structural audits, companion runtime checks, memory issues, voice failures, safety flags, user behavior signals,
          rewards/store problems, and product ideas all land here instead of being scattered across separate pages.
        </Text>
        <View style={styles.profilePill}>
          <Text style={styles.profileText}>Role: {profile?.role}</Text>
          <Text style={styles.profileText}>Exclude from analytics: {profile?.exclude_from_analytics ? 'yes' : 'no'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statNum}>{criticalCount}</Text><Text style={styles.statLabel}>critical</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{liveCount}</Text><Text style={styles.statLabel}>live</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{categories}</Text><Text style={styles.statLabel}>areas</Text></View>
      </View>

      <View style={styles.sectionIntro}>
        <Text style={styles.sectionTitle}>Fix queue</Text>
        <Text style={styles.sectionText}>Highest-risk cards come first. Live events come from Supabase audit_events; playbook cards are our founder ideas baked into the repo.</Text>
      </View>

      {cards.map((card) => <Card key={`${card.source}-${card.id}`} item={card} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080611' },
  content: { padding: 18, paddingBottom: 36 },
  center: { flex: 1, backgroundColor: '#080611', alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { color: '#c4b5fd', textAlign: 'center', marginTop: 10, lineHeight: 21 },
  lock: { fontSize: 48, marginBottom: 10 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  button: { marginTop: 20, backgroundColor: '#6d28d9', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 18 },
  buttonText: { color: '#fff', fontWeight: '800' },
  hero: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: '#151029', borderRadius: 28, padding: 22, marginBottom: 14 },
  kicker: { color: '#f0abfc', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 12, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 34, lineHeight: 38, fontWeight: '900', marginBottom: 10 },
  heroText: { color: '#d8b4fe', lineHeight: 22, fontSize: 15 },
  profilePill: { marginTop: 16, borderWidth: 1, borderColor: 'rgba(240,171,252,0.35)', borderRadius: 18, padding: 12, gap: 4 },
  profileText: { color: '#f5d0fe', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  stat: { flex: 1, backgroundColor: '#111827', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  statNum: { color: '#fff', fontSize: 28, fontWeight: '900' },
  statLabel: { color: '#a78bfa', fontWeight: '700', marginTop: 2 },
  sectionIntro: { marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sectionText: { color: '#c4b5fd', marginTop: 4, lineHeight: 20 },
  card: { backgroundColor: '#120f24', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 10 },
  badge: { color: '#67e8f9', fontWeight: '900', backgroundColor: 'rgba(103,232,249,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  severity: { color: '#fef3c7', fontWeight: '800', textTransform: 'capitalize' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  cardText: { color: '#ddd6fe', lineHeight: 21 },
  fixBox: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12 },
  fixLabel: { color: '#f0abfc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  fixText: { color: '#fff', lineHeight: 20 },
  source: { color: '#8b5cf6', marginTop: 10, fontWeight: '700', fontSize: 12 },
});
