import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import {
  founderIdeasService,
  type FounderIdea,
  type IdeaStatus,
} from '@/services/founderIdeas';
import {
  controlRoomIssuesService,
  type ControlRoomIssue,
  type IssueStatus,
} from '@/services/controlRoomIssues';

// ─── Types ──────────────────────────────────────────────────────────────────

type ModuleTab =
  | 'overview'
  | 'fix-queue'
  | 'voice'
  | 'companion'
  | 'memory'
  | 'security'
  | 'user-signals'
  | 'ideas'
  | 'infra';

type FilterSeverity = 'all' | AuditSeverity;
type FilterStatus = 'all' | 'open' | 'resolved';

const MODULE_TABS: { id: ModuleTab; label: string; emoji: string }[] = [
  { id: 'overview',     label: 'Overview',   emoji: '🏠' },
  { id: 'fix-queue',    label: 'Fix Queue',  emoji: '🔧' },
  { id: 'voice',        label: 'Voice',      emoji: '🎙️' },
  { id: 'companion',    label: 'Companion',  emoji: '🤖' },
  { id: 'memory',       label: 'Memory',     emoji: '🧠' },
  { id: 'security',     label: 'Security',   emoji: '🔒' },
  { id: 'user-signals', label: 'Signals',    emoji: '📊' },
  { id: 'ideas',        label: 'Ideas',      emoji: '💡' },
  { id: 'infra',        label: 'Infra',      emoji: '⚙️' },
];

const CATEGORY_TO_MODULE: Record<FounderAuditCard['category'], ModuleTab> = {
  structure: 'fix-queue',
  runtime:   'fix-queue',
  voice:     'voice',
  memory:    'memory',
  safety:    'security',
  behavior:  'user-signals',
  rewards:   'fix-queue',
  product:   'ideas',
};

const SEVERITY_WEIGHT: Record<AuditSeverity, number> = {
  critical: 4,
  error: 3,
  warning: 2,
  info: 1,
};

const SEVERITY_COLOR: Record<AuditSeverity, string> = {
  critical: '#f87171',
  error:    '#fb923c',
  warning:  '#fbbf24',
  info:     '#60a5fa',
};

const IDEA_STATUS_COLOR: Record<IdeaStatus, string> = {
  backlog:     '#8b5cf6',
  researching: '#06b6d4',
  planned:     '#3b82f6',
  building:    '#f59e0b',
  testing:     '#a78bfa',
  shipped:     '#34d399',
  paused:      '#9ca3af',
  rejected:    '#6b7280',
};

function severityEmoji(s: AuditSeverity) {
  return s === 'critical' ? '🔴' : s === 'error' ? '🟠' : s === 'warning' ? '🟡' : '🔵';
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Pill({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        active && { backgroundColor: color ?? '#7c3aed', borderColor: color ?? '#7c3aed' },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function IssueCard({
  item,
  onPress,
}: {
  item: FounderAuditCard;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.cardTop}>
        <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[item.severity] }]} />
        <Text style={styles.badge}>{item.category}</Text>
        <Text style={[styles.severityLabel, { color: SEVERITY_COLOR[item.severity] }]}>
          {item.severity}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardText} numberOfLines={2}>{item.summary}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardSource}>
          {item.source === 'live-audit-event' ? '⚡ Live' : '📋 Playbook'}
        </Text>
        <Text style={styles.cardChevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function IdeaCard({
  idea,
  onStatusChange,
}: {
  idea: FounderIdea;
  onStatusChange: (id: string, status: IdeaStatus) => void;
}) {
  const NEXT_STATUS: Partial<Record<IdeaStatus, IdeaStatus>> = {
    backlog:     'planned',
    planned:     'building',
    building:    'testing',
    testing:     'shipped',
    researching: 'planned',
  };
  const next = NEXT_STATUS[idea.status];
  return (
    <View style={styles.ideaCard}>
      <View style={styles.ideaCardTop}>
        <View
          style={[
            styles.ideaStatusBadge,
            { backgroundColor: IDEA_STATUS_COLOR[idea.status] + '22', borderColor: IDEA_STATUS_COLOR[idea.status] },
          ]}
        >
          <Text style={[styles.ideaStatusText, { color: IDEA_STATUS_COLOR[idea.status] }]}>
            {idea.status}
          </Text>
        </View>
        {idea.category ? <Text style={styles.ideaCategory}>{idea.category}</Text> : null}
      </View>
      <Text style={styles.ideaTitle}>{idea.title}</Text>
      {idea.notes ? <Text style={styles.ideaNotes}>{idea.notes}</Text> : null}
      {next ? (
        <TouchableOpacity
          style={styles.ideaAdvanceBtn}
          onPress={() => onStatusChange(idea.id, next)}
          activeOpacity={0.75}
        >
          <Text style={styles.ideaAdvanceBtnText}>Move to {next} →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StatCard({ num, label, color }: { num: number | string; label: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statNum, color ? { color } : {}]}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Issue Detail Sheet ──────────────────────────────────────────────────────

function IssueDetailSheet({
  item,
  visible,
  onClose,
  onResolve,
}: {
  item: FounderAuditCard | null;
  visible: boolean;
  onClose: () => void;
  onResolve?: (id: string) => void;
}) {
  const [note, setNote] = useState('');

  if (!item) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[item.severity], width: 12, height: 12 }]} />
          <Text style={[styles.sheetSeverity, { color: SEVERITY_COLOR[item.severity] }]}>
            {severityEmoji(item.severity)} {item.severity.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.sheetTitle}>{item.title}</Text>
        <Text style={styles.sheetMeta}>
          Category: <Text style={styles.sheetMetaValue}>{item.category}</Text>
        </Text>
        <Text style={styles.sheetMeta}>
          Source: <Text style={styles.sheetMetaValue}>
            {item.source === 'live-audit-event' ? 'Live Supabase audit event' : 'Founder playbook'}
          </Text>
        </Text>

        <SectionHeader title="Summary" />
        <Text style={styles.sheetBody}>{item.summary}</Text>

        <SectionHeader title="Fix path" />
        <View style={styles.fixBox}>
          <Text style={styles.fixText}>{item.fix}</Text>
        </View>

        <SectionHeader title="Founder note" subtitle="Private — not visible to users" />
        <TextInput
          style={styles.noteInput}
          placeholderTextColor="#6b7280"
          placeholder="Add a note or investigation detail…"
          multiline
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.sheetActions}>
          {item.source === 'live-audit-event' && onResolve ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.resolveBtn]}
              onPress={() => { onResolve(item.id); onClose(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>✓ Mark resolved</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[styles.actionBtn, styles.closeBtn]} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function OverviewTab({
  profile,
  cards,
  ideas,
  criticalCount,
  liveCount,
  openIdeas,
}: {
  profile: FounderProfile;
  cards: FounderAuditCard[];
  ideas: FounderIdea[];
  criticalCount: number;
  liveCount: number;
  openIdeas: number;
}) {
  const moduleCounts = useMemo(() => {
    const counts: Partial<Record<ModuleTab, number>> = {};
    for (const c of cards) {
      const mod = CATEGORY_TO_MODULE[c.category];
      counts[mod] = (counts[mod] ?? 0) + 1;
    }
    return counts;
  }, [cards]);

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>🛠 Se'kret Bip</Text>
        <Text style={styles.heroTitle}>Founder Control Room</Text>
        <Text style={styles.heroText}>
          One place for every issue, idea, and health signal across the full app.
        </Text>
        <View style={styles.profilePill}>
          <Text style={styles.profileText}>Role: {profile.role}</Text>
          <Text style={[styles.profileText, { color: '#86efac' }]}>
            Analytics excluded: {profile.exclude_from_analytics ? 'yes' : 'no'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard num={criticalCount} label="critical" color="#f87171" />
        <StatCard num={liveCount} label="live events" color="#fb923c" />
        <StatCard num={openIdeas} label="ideas" color="#a78bfa" />
      </View>

      <SectionHeader title="Module health" />
      {MODULE_TABS.filter((t) => t.id !== 'overview').map((tab) => (
        <View key={tab.id} style={styles.moduleHealthRow}>
          <Text style={styles.moduleHealthEmoji}>{tab.emoji}</Text>
          <Text style={styles.moduleHealthLabel}>{tab.label}</Text>
          <View
            style={[
              styles.moduleHealthBadge,
              (moduleCounts[tab.id] ?? 0) > 0
                ? styles.moduleHealthBadgeActive
                : styles.moduleHealthBadgeClear,
            ]}
          >
            <Text
              style={[
                styles.moduleHealthBadgeText,
                (moduleCounts[tab.id] ?? 0) > 0 ? { color: '#fef3c7' } : { color: '#86efac' },
              ]}
            >
              {moduleCounts[tab.id] ?? 0} issues
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function FixQueueTab({
  cards,
  onCardPress,
}: {
  cards: FounderAuditCard[];
  onCardPress: (card: FounderAuditCard) => void;
}) {
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filtered = useMemo(() => {
    return cards
      .filter((c) => filterSeverity === 'all' || c.severity === filterSeverity)
      .filter((c) => {
        if (filterStatus === 'open') return c.source === 'live-audit-event';
        if (filterStatus === 'resolved') return c.source !== 'live-audit-event';
        return true;
      })
      .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]);
  }, [cards, filterSeverity, filterStatus]);

  return (
    <View>
      <SectionHeader
        title="Fix Queue"
        subtitle="Live Supabase events and playbook issues, sorted by severity."
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(['all', 'critical', 'error', 'warning', 'info'] as FilterSeverity[]).map((s) => (
          <Pill
            key={s}
            label={s === 'all' ? 'All severities' : s}
            active={filterSeverity === s}
            color={s !== 'all' ? SEVERITY_COLOR[s] : undefined}
            onPress={() => setFilterSeverity(s)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(['all', 'open', 'resolved'] as FilterStatus[]).map((s) => (
          <Pill
            key={s}
            label={s === 'all' ? 'All statuses' : s}
            active={filterStatus === s}
            onPress={() => setFilterStatus(s)}
          />
        ))}
      </ScrollView>
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>✅</Text>
          <Text style={styles.emptyStateText}>No issues match these filters.</Text>
        </View>
      ) : (
        filtered.map((card) => (
          <IssueCard key={`${card.source}-${card.id}`} item={card} onPress={() => onCardPress(card)} />
        ))
      )}
    </View>
  );
}

function ModuleTab({
  moduleId,
  cards,
  onCardPress,
}: {
  moduleId: ModuleTab;
  cards: FounderAuditCard[];
  onCardPress: (card: FounderAuditCard) => void;
}) {
  const relevant = useMemo(
    () =>
      cards
        .filter((c) => CATEGORY_TO_MODULE[c.category] === moduleId)
        .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]),
    [cards, moduleId],
  );

  const tab = MODULE_TABS.find((t) => t.id === moduleId)!;

  return (
    <View>
      <SectionHeader title={`${tab.emoji} ${tab.label}`} subtitle={`${relevant.length} issues in this module`} />
      {relevant.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>✅</Text>
          <Text style={styles.emptyStateText}>No issues flagged for {tab.label}.</Text>
        </View>
      ) : (
        relevant.map((card) => (
          <IssueCard key={`${card.source}-${card.id}`} item={card} onPress={() => onCardPress(card)} />
        ))
      )}
    </View>
  );
}

function IdeasTab({
  ideas,
  onStatusChange,
  onAddIdea,
}: {
  ideas: FounderIdea[];
  onStatusChange: (id: string, status: IdeaStatus) => void;
  onAddIdea: (title: string) => void;
}) {
  const [newIdea, setNewIdea] = useState('');
  const [filterStatus, setFilterStatus] = useState<IdeaStatus | 'all'>('all');

  const filtered = useMemo(
    () => ideas.filter((i) => filterStatus === 'all' || i.status === filterStatus),
    [ideas, filterStatus],
  );

  const STATUS_OPTIONS: (IdeaStatus | 'all')[] = [
    'all', 'backlog', 'planned', 'building', 'testing', 'shipped',
  ];

  return (
    <View>
      <SectionHeader
        title="💡 Founder Ideas"
        subtitle="Your product vision tracked through production."
      />

      <View style={styles.addIdeaRow}>
        <TextInput
          style={styles.addIdeaInput}
          placeholder="New idea…"
          placeholderTextColor="#6b7280"
          value={newIdea}
          onChangeText={setNewIdea}
          onSubmitEditing={() => {
            if (newIdea.trim()) { onAddIdea(newIdea.trim()); setNewIdea(''); }
          }}
        />
        <TouchableOpacity
          style={styles.addIdeaBtn}
          onPress={() => {
            if (newIdea.trim()) { onAddIdea(newIdea.trim()); setNewIdea(''); }
          }}
        >
          <Text style={styles.addIdeaBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {STATUS_OPTIONS.map((s) => (
          <Pill
            key={s}
            label={s === 'all' ? 'All' : s}
            active={filterStatus === s}
            color={s !== 'all' ? IDEA_STATUS_COLOR[s] : undefined}
            onPress={() => setFilterStatus(s)}
          />
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>💡</Text>
          <Text style={styles.emptyStateText}>No ideas yet. Add your first one above.</Text>
        </View>
      ) : (
        filtered.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} onStatusChange={onStatusChange} />
        ))
      )}
    </View>
  );
}

// ─── Root screen ─────────────────────────────────────────────────────────────

export default function FounderControlRoom() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [ideas, setIdeas] = useState<FounderIdea[]>([]);
  const [activeTab, setActiveTab] = useState<ModuleTab>('overview');
  const [selectedCard, setSelectedCard] = useState<FounderAuditCard | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  async function load() {
    const founderProfile = await getCurrentFounderProfile();
    setProfile(founderProfile);
    if (isFounderProfile(founderProfile)) {
      const [rows, ideaRows] = await Promise.all([
        listFounderAuditEvents(60),
        founderIdeasService.list(),
      ]);
      setEvents(rows);
      setIdeas(ideaRows);
    } else {
      setEvents([]);
      setIdeas([]);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function refresh() {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }

  const handleResolve = useCallback(async (id: string) => {
    await controlRoomIssuesService.resolveAuditEvent(id);
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
  }, []);

  const handleIdeaStatus = useCallback(async (id: string, status: IdeaStatus) => {
    await founderIdeasService.updateStatus(id, status);
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }, []);

  const handleAddIdea = useCallback(async (title: string) => {
    const idea = await founderIdeasService.create({ title, status: 'backlog' });
    if (idea) setIdeas((prev) => [idea, ...prev]);
  }, []);

  const cards = useMemo(() => {
    const liveCards = events.filter((e) => !e.resolved).map(auditEventToCard);
    return [...liveCards, ...founderAuditPlaybook].sort(
      (a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity],
    );
  }, [events]);

  const criticalCount = cards.filter((c) => c.severity === 'critical').length;
  const liveCount = events.filter((e) => !e.resolved).length;
  const openIdeas = ideas.filter((i) => !['shipped', 'rejected'].includes(i.status)).length;

  const allowed = isFounderProfile(profile);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a78bfa" />
        <Text style={styles.centerText}>Opening Control Room…</Text>
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.center}>
        <Text style={styles.lock}>🔒</Text>
        <Text style={styles.title}>Founder tools locked</Text>
        <Text style={styles.centerText}>
          This screen is only available to app_profiles rows with developer, admin, or founder access.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>Back to Bip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderTab() {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            profile={profile!}
            cards={cards}
            ideas={ideas}
            criticalCount={criticalCount}
            liveCount={liveCount}
            openIdeas={openIdeas}
          />
        );
      case 'fix-queue':
        return <FixQueueTab cards={cards} onCardPress={(c) => { setSelectedCard(c); setSheetVisible(true); }} />;
      case 'ideas':
        return (
          <IdeasTab
            ideas={ideas}
            onStatusChange={handleIdeaStatus}
            onAddIdea={handleAddIdea}
          />
        );
      default:
        return (
          <ModuleTab
            moduleId={activeTab}
            cards={cards}
            onCardPress={(c) => { setSelectedCard(c); setSheetVisible(true); }}
          />
        );
    }
  }

  return (
    <View style={styles.root}>
      {/* Module tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {MODULE_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a78bfa" />
        }
      >
        {renderTab()}
      </ScrollView>

      {/* Issue detail sheet */}
      <IssueDetailSheet
        item={selectedCard}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onResolve={handleResolve}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#080611' },
  scrollArea:       { flex: 1 },
  content:          { padding: 16, paddingBottom: 40 },
  center:           { flex: 1, backgroundColor: '#080611', alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText:       { color: '#c4b5fd', textAlign: 'center', marginTop: 10, lineHeight: 21 },
  lock:             { fontSize: 48, marginBottom: 10 },
  title:            { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  button:           { marginTop: 20, backgroundColor: '#6d28d9', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 18 },
  buttonText:       { color: '#fff', fontWeight: '800' },

  // Tab bar
  tabBar:           { flexGrow: 0, backgroundColor: '#0f0c1f', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tabBarContent:    { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tabItem:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  tabItemActive:    { backgroundColor: '#3b0764', borderColor: '#a78bfa' },
  tabEmoji:         { fontSize: 14 },
  tabLabel:         { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  tabLabelActive:   { color: '#e9d5ff' },

  // Hero
  hero:             { borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: '#151029', borderRadius: 24, padding: 20, marginBottom: 14 },
  kicker:           { color: '#a78bfa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 11, marginBottom: 6 },
  heroTitle:        { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '900', marginBottom: 8 },
  heroText:         { color: '#d8b4fe', lineHeight: 21, fontSize: 14 },
  profilePill:      { marginTop: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)', borderRadius: 16, padding: 10, gap: 3 },
  profileText:      { color: '#f5d0fe', fontWeight: '700', fontSize: 13 },

  // Stats
  statsRow:         { flexDirection: 'row', gap: 10, marginBottom: 18 },
  stat:             { flex: 1, backgroundColor: '#111827', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statNum:          { color: '#fff', fontSize: 26, fontWeight: '900' },
  statLabel:        { color: '#9ca3af', fontWeight: '700', marginTop: 2, fontSize: 12 },

  // Section header
  sectionHeader:    { marginBottom: 10, marginTop: 16 },
  sectionTitle:     { color: '#fff', fontSize: 20, fontWeight: '900' },
  sectionSubtitle:  { color: '#9ca3af', fontSize: 13, marginTop: 3, lineHeight: 18 },

  // Filters
  filterRow:        { marginBottom: 10 },
  pill:             { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginRight: 6, backgroundColor: 'transparent' },
  pillText:         { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  pillTextActive:   { color: '#fff' },

  // Issue card
  card:             { backgroundColor: '#120f24', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 10 },
  cardTop:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  severityDot:      { width: 8, height: 8, borderRadius: 4 },
  badge:            { color: '#67e8f9', fontWeight: '800', backgroundColor: 'rgba(103,232,249,0.10)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden', fontSize: 11, textTransform: 'uppercase' },
  severityLabel:    { fontWeight: '800', textTransform: 'capitalize', fontSize: 12, marginLeft: 'auto' },
  cardTitle:        { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  cardText:         { color: '#ddd6fe', lineHeight: 19, fontSize: 13 },
  cardFooter:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardSource:       { color: '#8b5cf6', fontWeight: '700', fontSize: 11 },
  cardChevron:      { color: '#6b7280', fontSize: 18 },

  // Module health list
  moduleHealthRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  moduleHealthEmoji:      { fontSize: 18, width: 28 },
  moduleHealthLabel:      { color: '#e5e7eb', fontWeight: '700', flex: 1 },
  moduleHealthBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  moduleHealthBadgeActive:{ backgroundColor: 'rgba(251,191,36,0.12)' },
  moduleHealthBadgeClear: { backgroundColor: 'rgba(52,211,153,0.10)' },
  moduleHealthBadgeText:  { fontWeight: '800', fontSize: 12 },

  // Empty state
  emptyState:       { alignItems: 'center', paddingVertical: 40 },
  emptyStateEmoji:  { fontSize: 36, marginBottom: 10 },
  emptyStateText:   { color: '#9ca3af', textAlign: 'center', lineHeight: 20 },

  // Idea cards
  ideaCard:             { backgroundColor: '#13102a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 10 },
  ideaCardTop:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ideaStatusBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  ideaStatusText:       { fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  ideaCategory:         { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  ideaTitle:            { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  ideaNotes:            { color: '#c4b5fd', fontSize: 13, lineHeight: 19 },
  ideaAdvanceBtn:       { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)' },
  ideaAdvanceBtnText:   { color: '#a78bfa', fontWeight: '800', fontSize: 12 },

  // Add idea
  addIdeaRow:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addIdeaInput:     { flex: 1, backgroundColor: '#1a1535', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', fontSize: 14 },
  addIdeaBtn:       { backgroundColor: '#6d28d9', borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center' },
  addIdeaBtnText:   { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Fix box
  fixBox:           { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginBottom: 4 },
  fixText:          { color: '#fff', lineHeight: 20, fontSize: 14 },

  // Sheet
  sheet:            { flex: 1, backgroundColor: '#0d0b1e' },
  sheetContent:     { padding: 20, paddingBottom: 48 },
  sheetHandle:      { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sheetSeverity:    { fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  sheetTitle:       { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 10, lineHeight: 28 },
  sheetMeta:        { color: '#9ca3af', fontSize: 13, marginBottom: 3 },
  sheetMetaValue:   { color: '#e5e7eb', fontWeight: '700' },
  sheetBody:        { color: '#ddd6fe', lineHeight: 22, fontSize: 14, marginBottom: 8 },
  noteInput:        { backgroundColor: '#1a1535', borderRadius: 14, padding: 12, color: '#fff', minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', fontSize: 14 },
  sheetActions:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn:        { flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
  resolveBtn:       { backgroundColor: '#065f46' },
  closeBtn:         { backgroundColor: '#1f2937' },
  actionBtnText:    { color: '#fff', fontWeight: '900', fontSize: 14 },
});
