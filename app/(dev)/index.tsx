import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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

type ModuleTab =
  | 'overview'
  | 'fix-queue'
  | 'voice'
  | 'companion'
  | 'memory'
  | 'security'
  | 'user-signals'
  | 'ideas'
  | 'infra'
  | 'screens';

type FilterSeverity = 'all' | AuditSeverity;
type FilterStatus = 'all' | IssueStatus | 'raw';
type IssueSource = 'normalized-issue' | 'raw-audit-event' | 'founder-playbook';

type ScreenStatus = 'built' | 'partial' | 'stub' | 'missing';
type ScreenGroup = 'teen' | 'parent' | 'auth' | 'onboarding' | 'modals';

interface ScreenEntry {
  route: string;
  label: string;
  group: ScreenGroup;
  status: ScreenStatus;
  notes?: string;
}

interface ControlRoomCard {
  id: string;
  category: string;
  module: ModuleTab;
  severity: AuditSeverity;
  status: IssueStatus;
  title: string;
  summary: string;
  fix: string;
  source: IssueSource;
  affectedSurface?: string;
  affectedUsers?: number;
  occurrenceCount?: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
  metadata?: Record<string, unknown> | null;
}

const MODULE_TABS: { id: ModuleTab; label: string; emoji: string }[] = [
  { id: 'overview',     label: 'Overview',   emoji: '🏠' },
  { id: 'fix-queue',    label: 'Fix Queue',  emoji: '🔧' },
  { id: 'screens',      label: 'Screens',    emoji: '📱' },
  { id: 'voice',        label: 'Voice',      emoji: '🎙️' },
  { id: 'companion',    label: 'Companion',  emoji: '🤖' },
  { id: 'memory',       label: 'Memory',     emoji: '🧠' },
  { id: 'security',     label: 'Security',   emoji: '🔒' },
  { id: 'user-signals', label: 'Signals',    emoji: '📊' },
  { id: 'ideas',        label: 'Ideas',      emoji: '💡' },
  { id: 'infra',        label: 'Infra',      emoji: '⚙️' },
];

// ─── Repo-wide screen registry ───────────────────────────────────────────────
// Update `status` as screens are built out:
//   'built'   → screen is production-ready
//   'partial' → screen exists but some sections are stubs
//   'stub'    → file exists, renders placeholder only
//   'missing' → not yet created
const SCREEN_REGISTRY: ScreenEntry[] = [
  // ── (teen) ──────────────────────────────────────────────────────────────
  { route: '(teen)/companion-chat', label: 'Companion Chat',    group: 'teen',       status: 'built' },
  { route: '(teen)/discover',       label: 'Discover',          group: 'teen',       status: 'built' },
  { route: '(teen)/profile',        label: 'Profile',           group: 'teen',       status: 'built' },
  { route: '(teen)/period-calendar',label: 'Period Calendar',   group: 'teen',       status: 'built' },
  { route: '(teen)/bridge',         label: 'Bridge',            group: 'teen',       status: 'built' },
  { route: '(teen)/cloud',          label: 'Cloud',             group: 'teen',       status: 'built' },
  { route: '(teen)/cloudThoughts',  label: 'Cloud Thoughts',    group: 'teen',       status: 'stub'  },
  { route: '(teen)/comfort',        label: 'Comfort',           group: 'teen',       status: 'stub'  },
  { route: '(teen)/crew',           label: 'Crew',              group: 'teen',       status: 'stub'  },
  { route: '(teen)/growth',         label: 'Growth',            group: 'teen',       status: 'stub'  },
  { route: '(teen)/history',        label: 'History',           group: 'teen',       status: 'stub'  },
  { route: '(teen)/mind-body-reset',label: 'Mind Body Reset',   group: 'teen',       status: 'stub'  },
  { route: '(teen)/more',           label: 'More',              group: 'teen',       status: 'partial'},
  { route: '(teen)/points',         label: 'Points',            group: 'teen',       status: 'stub'  },
  { route: '(teen)/room',           label: 'Room',              group: 'teen',       status: 'partial'},
  { route: '(teen)/calm',           label: 'Calm',              group: 'teen',       status: 'built' },
  { route: '(teen)/circle',         label: 'Circle',            group: 'teen',       status: 'built' },
  { route: '(teen)/chat',           label: 'Chat',              group: 'teen',       status: 'built' },
  { route: '(teen)/bippin2',        label: 'Bippin 2',          group: 'teen',       status: 'partial'},
  // ── (parent) ────────────────────────────────────────────────────────────
  { route: '(parent)/dashboard',    label: 'Dashboard',         group: 'parent',     status: 'stub'  },
  { route: '(parent)/profile',      label: 'Profile',           group: 'parent',     status: 'built' },
  { route: '(parent)/settings',     label: 'Settings',          group: 'parent',     status: 'built' },
  { route: '(parent)/voicebip',     label: 'Voice Bip',         group: 'parent',     status: 'built' },
  { route: '(parent)/voicereflect', label: 'Voice Reflect',     group: 'parent',     status: 'stub'  },
  { route: '(parent)/bridge',       label: 'Bridge',            group: 'parent',     status: 'stub'  },
  { route: '(parent)/calm',         label: 'Calm',              group: 'parent',     status: 'stub'  },
  { route: '(parent)/circle',       label: 'Circle',            group: 'parent',     status: 'partial'},
  { route: '(parent)/growth',       label: 'Growth',            group: 'parent',     status: 'stub'  },
  { route: '(parent)/more',         label: 'More',              group: 'parent',     status: 'partial'},
  { route: '(parent)/pages',        label: 'Pages',             group: 'parent',     status: 'stub'  },
  { route: '(parent)/period-calendar', label: 'Period Calendar',group: 'parent',     status: 'stub'  },
  { route: '(parent)/repair',       label: 'Repair',            group: 'parent',     status: 'stub'  },
  { route: '(parent)/room',         label: 'Room',              group: 'parent',     status: 'stub'  },
  { route: '(parent)/s2tell',       label: 'S2Tell',            group: 'parent',     status: 'stub'  },
  { route: '(parent)/sekret',       label: 'Sekret',            group: 'parent',     status: 'stub'  },
  // ── (auth) ──────────────────────────────────────────────────────────────
  { route: '(auth)/login',              label: 'Login',              group: 'auth',   status: 'built' },
  { route: '(auth)/signup',             label: 'Signup',             group: 'auth',   status: 'built' },
  { route: '(auth)/parent-link-verify', label: 'Parent Link Verify', group: 'auth',   status: 'built' },
  { route: '(auth)/limited-mode',       label: 'Limited Mode',       group: 'auth',   status: 'built' },
  // ── (onboarding) ────────────────────────────────────────────────────────
  { route: '(onboarding)/welcome',        label: 'Welcome',         group: 'onboarding', status: 'built' },
  { route: '(onboarding)/teen-splash',    label: 'Teen Splash',     group: 'onboarding', status: 'stub'  },
  { route: '(onboarding)/parent-splash',  label: 'Parent Splash',   group: 'onboarding', status: 'stub'  },
  { route: '(onboarding)/age',            label: 'Age',             group: 'onboarding', status: 'built' },
  { route: '(onboarding)/identity',       label: 'Identity',        group: 'onboarding', status: 'built' },
  { route: '(onboarding)/name',           label: 'Name',            group: 'onboarding', status: 'built' },
  { route: '(onboarding)/reflection',     label: 'Reflection',      group: 'onboarding', status: 'built' },
  { route: '(onboarding)/parent-link',    label: 'Parent Link',     group: 'onboarding', status: 'built' },
  { route: '(onboarding)/parent-setup',   label: 'Parent Setup',    group: 'onboarding', status: 'built' },
  { route: '(onboarding)/parent-welcome', label: 'Parent Welcome',  group: 'onboarding', status: 'built' },
  // ── (modals) ────────────────────────────────────────────────────────────
  { route: '(modals)/*', label: 'Modals (unmapped)', group: 'modals', status: 'missing', notes: 'Scan (modals) dir and add entries here.' },
];

const SCREEN_STATUS_COLOR: Record<ScreenStatus, string> = {
  built:   '#34d399',
  partial: '#fbbf24',
  stub:    '#fb923c',
  missing: '#f87171',
};

const GROUP_EMOJI: Record<ScreenGroup, string> = {
  teen:       '🧑',
  parent:     '👨‍👧',
  auth:       '🔑',
  onboarding: '🚀',
  modals:     '🪟',
};

// ─────────────────────────────────────────────────────────────────────────────

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

function normalizeSeverity(severity?: string): AuditSeverity {
  if (severity === 'critical' || severity === 'error' || severity === 'warning' || severity === 'info') {
    return severity;
  }
  return 'info';
}

function moduleFromCategory(category?: string): ModuleTab {
  const normalized = String(category ?? '').toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  if (normalized.includes('voice')) return 'voice';
  if (normalized.includes('companion') || normalized.includes('ai') || normalized.includes('persona')) return 'companion';
  if (normalized.includes('memory')) return 'memory';
  if (normalized.includes('security') || normalized.includes('safety') || normalized.includes('rls')) return 'security';
  if (normalized.includes('signal') || normalized.includes('behavior') || normalized.includes('analytics')) return 'user-signals';
  if (normalized.includes('idea') || normalized.includes('product')) return 'ideas';
  if (normalized.includes('infra') || normalized.includes('worker') || normalized.includes('supabase') || normalized.includes('cloudflare') || normalized.includes('cost')) return 'infra';
  return 'fix-queue';
}

function playbookCardToControlRoomCard(item: FounderAuditCard): ControlRoomCard {
  return {
    id: item.id,
    category: item.category,
    module: moduleFromCategory(item.category),
    severity: item.severity,
    status: 'open',
    title: item.title,
    summary: item.summary,
    fix: item.fix,
    source: 'founder-playbook',
  };
}

function auditEventToControlRoomCard(event: AuditEvent): ControlRoomCard {
  const card = auditEventToCard(event);
  return {
    id: event.id,
    category: card.category,
    module: moduleFromCategory(card.category),
    severity: card.severity,
    status: event.resolved ? 'resolved' : 'open',
    title: card.title,
    summary: card.summary,
    fix: card.fix,
    source: 'raw-audit-event',
    firstSeenAt: event.created_at,
    lastSeenAt: event.created_at,
    metadata: event.metadata,
  };
}

function normalizedIssueToControlRoomCard(issue: ControlRoomIssue): ControlRoomCard {
  return {
    id: issue.id,
    category: issue.category,
    module: moduleFromCategory(issue.category),
    severity: normalizeSeverity(issue.severity),
    status: issue.status,
    title: issue.title,
    summary: issue.summary || 'No summary has been recorded for this normalized Control Room issue yet.',
    fix: issue.suggested_fix || 'Review the linked raw events, reproduce the issue, patch the affected surface, then move this issue through the Control Room workflow.',
    source: 'normalized-issue',
    affectedSurface: issue.affected_surface,
    affectedUsers: issue.affected_users,
    occurrenceCount: issue.occurrence_count,
    firstSeenAt: issue.first_seen_at,
    lastSeenAt: issue.last_seen_at,
    metadata: issue.metadata,
  };
}

function sourceLabel(source: IssueSource) {
  switch (source) {
    case 'normalized-issue': return 'Grouped issue';
    case 'raw-audit-event': return 'Raw audit event';
    case 'founder-playbook': return 'Founder playbook';
    default: return 'Control Room';
  }
}

function severityEmoji(s: AuditSeverity) {
  return s === 'critical' ? '🔴' : s === 'error' ? '🟠' : s === 'warning' ? '🟡' : '🔵';
}

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

function IssueCard({ item, onPress }: { item: ControlRoomCard; onPress: () => void }) {
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
        <Text style={styles.cardSource}>{sourceLabel(item.source)}</Text>
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
    researching: 'planned',
    planned:     'building',
    building:    'testing',
    testing:     'shipped',
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
          <Text style={[styles.ideaStatusText, { color: IDEA_STATUS_COLOR[idea.status] }]}> {idea.status} </Text>
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

function IssueDetailSheet({
  item,
  visible,
  onClose,
  onResolve,
}: {
  item: ControlRoomCard | null;
  visible: boolean;
  onClose: () => void;
  onResolve?: (card: ControlRoomCard) => void;
}) {
  if (!item) return null;

  const canResolve = item.status !== 'resolved' && item.source !== 'founder-playbook';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[item.severity], width: 12, height: 12 }]} />
          <Text style={[styles.sheetSeverity, { color: SEVERITY_COLOR[item.severity] }]}> {severityEmoji(item.severity)} {item.severity.toUpperCase()} </Text>
        </View>

        <Text style={styles.sheetTitle}>{item.title}</Text>
        <Text style={styles.sheetMeta}>Status: <Text style={styles.sheetMetaValue}>{item.status}</Text></Text>
        <Text style={styles.sheetMeta}>Category: <Text style={styles.sheetMetaValue}>{item.category}</Text></Text>
        <Text style={styles.sheetMeta}>Source: <Text style={styles.sheetMetaValue}>{sourceLabel(item.source)}</Text></Text>
        {item.affectedSurface ? <Text style={styles.sheetMeta}>Surface: <Text style={styles.sheetMetaValue}>{item.affectedSurface}</Text></Text> : null}
        {typeof item.occurrenceCount === 'number' ? <Text style={styles.sheetMeta}>Occurrences: <Text style={styles.sheetMetaValue}>{item.occurrenceCount}</Text></Text> : null}
        {typeof item.affectedUsers === 'number' ? <Text style={styles.sheetMeta}>Affected users: <Text style={styles.sheetMetaValue}>{item.affectedUsers}</Text></Text> : null}

        <SectionHeader title="Summary" />
        <Text style={styles.sheetBody}>{item.summary}</Text>

        <SectionHeader title="Fix path" />
        <View style={styles.fixBox}>
          <Text style={styles.fixText}>{item.fix}</Text>
        </View>

        <SectionHeader title="Control Room note" subtitle="Notes persist in PR 3+; this sheet now shows normalized issue metadata first." />
        <TextInput
          style={styles.noteInput}
          placeholderTextColor="#6b7280"
          placeholder="Temporary investigation note…"
          multiline
          editable={false}
          value={item.source === 'normalized-issue' ? 'This card is backed by control_room_issues.' : 'This card is fallback/playbook context.'}
        />

        <View style={styles.sheetActions}>
          {canResolve && onResolve ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.resolveBtn]}
              onPress={() => { onResolve(item); onClose(); }}
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

// ─── Screens Tab ─────────────────────────────────────────────────────────────

function ScreensTab() {
  const [filterGroup, setFilterGroup] = useState<ScreenGroup | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ScreenStatus | 'all'>('all');

  const groups: ScreenGroup[] = ['teen', 'parent', 'auth', 'onboarding', 'modals'];
  const statuses: ScreenStatus[] = ['built', 'partial', 'stub', 'missing'];

  const filtered = useMemo(() => {
    return SCREEN_REGISTRY.filter((s) => {
      if (filterGroup !== 'all' && s.group !== filterGroup) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      return true;
    });
  }, [filterGroup, filterStatus]);

  const grouped = useMemo(() => {
    const map: Partial<Record<ScreenGroup, ScreenEntry[]>> = {};
    for (const entry of filtered) {
      if (!map[entry.group]) map[entry.group] = [];
      map[entry.group]!.push(entry);
    }
    return map;
  }, [filtered]);

  const totalBuilt   = SCREEN_REGISTRY.filter((s) => s.status === 'built').length;
  const totalPartial = SCREEN_REGISTRY.filter((s) => s.status === 'partial').length;
  const totalStub    = SCREEN_REGISTRY.filter((s) => s.status === 'stub').length;
  const totalMissing = SCREEN_REGISTRY.filter((s) => s.status === 'missing').length;
  const total        = SCREEN_REGISTRY.length;
  const pct          = Math.round((totalBuilt / total) * 100);

  return (
    <View>
      <SectionHeader
        title="📱 Screens"
        subtitle={`${totalBuilt}/${total} built (${pct}%) · ${totalPartial} partial · ${totalStub} stubs · ${totalMissing} missing`}
      />

      {/* Coverage bar */}
      <View style={styles.coverageBarBg}>
        <View style={[styles.coverageBarFill, { width: `${pct}%` as any }]} />
      </View>

      {/* Status legend */}
      <View style={styles.screenLegend}>
        {statuses.map((s) => (
          <View key={s} style={styles.screenLegendItem}>
            <View style={[styles.screenLegendDot, { backgroundColor: SCREEN_STATUS_COLOR[s] }]} />
            <Text style={styles.screenLegendText}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Group filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <Pill label="All groups" active={filterGroup === 'all'} onPress={() => setFilterGroup('all')} />
        {groups.map((g) => (
          <Pill key={g} label={`${GROUP_EMOJI[g]} ${g}`} active={filterGroup === g} color="#7c3aed" onPress={() => setFilterGroup(g)} />
        ))}
      </ScrollView>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <Pill label="All statuses" active={filterStatus === 'all'} onPress={() => setFilterStatus('all')} />
        {statuses.map((s) => (
          <Pill key={s} label={s} active={filterStatus === s} color={SCREEN_STATUS_COLOR[s]} onPress={() => setFilterStatus(s)} />
        ))}
      </ScrollView>

      {/* Grouped list */}
      {(filterGroup === 'all' ? groups : [filterGroup]).map((g) => {
        const entries = grouped[g];
        if (!entries || entries.length === 0) return null;
        const builtCount = entries.filter((e) => e.status === 'built').length;
        return (
          <View key={g} style={styles.screenGroup}>
            <View style={styles.screenGroupHeader}>
              <Text style={styles.screenGroupEmoji}>{GROUP_EMOJI[g]}</Text>
              <Text style={styles.screenGroupLabel}>({g})</Text>
              <Text style={styles.screenGroupCount}>{builtCount}/{entries.length} built</Text>
            </View>
            {entries.map((entry) => (
              <View key={entry.route} style={styles.screenRow}>
                <View style={[styles.screenStatusDot, { backgroundColor: SCREEN_STATUS_COLOR[entry.status] }]} />
                <View style={styles.screenRowText}>
                  <Text style={styles.screenLabel}>{entry.label}</Text>
                  <Text style={styles.screenRoute}>{entry.route}</Text>
                  {entry.notes ? <Text style={styles.screenNotes}>{entry.notes}</Text> : null}
                </View>
                <View style={[styles.screenStatusBadge, { borderColor: SCREEN_STATUS_COLOR[entry.status] }]}>
                  <Text style={[styles.screenStatusText, { color: SCREEN_STATUS_COLOR[entry.status] }]}>
                    {entry.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  profile,
  cards,
  ideas,
  normalizedCount,
  rawOpenCount,
  criticalCount,
  openIdeas,
}: {
  profile: FounderProfile;
  cards: ControlRoomCard[];
  ideas: FounderIdea[];
  normalizedCount: number;
  rawOpenCount: number;
  criticalCount: number;
  openIdeas: number;
}) {
  const moduleCounts = useMemo(() => {
    const counts: Partial<Record<ModuleTab, number>> = {};
    for (const card of cards.filter((c) => c.status !== 'resolved')) {
      counts[card.module] = (counts[card.module] ?? 0) + 1;
    }
    return counts;
  }, [cards]);

  const screensBuilt   = SCREEN_REGISTRY.filter((s) => s.status === 'built').length;
  const screensTotal   = SCREEN_REGISTRY.length;
  const screensPct     = Math.round((screensBuilt / screensTotal) * 100);
  const screensStubs   = SCREEN_REGISTRY.filter((s) => s.status === 'stub' || s.status === 'missing').length;

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>🛠 Se'kret Bip</Text>
        <Text style={styles.heroTitle}>Founder Control Room</Text>
        <Text style={styles.heroText}>
          Normalized issues are now the primary operating layer. Raw audit events stay available as fallback/live backlog context.
        </Text>
        <View style={styles.profilePill}>
          <Text style={styles.profileText}>Role: {profile.role}</Text>
          <Text style={[styles.profileText, { color: '#86efac' }]}>Analytics excluded: {profile.exclude_from_analytics ? 'yes' : 'no'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard num={criticalCount} label="critical" color="#f87171" />
        <StatCard num={normalizedCount} label="normalized" color="#a78bfa" />
        <StatCard num={rawOpenCount} label="raw backlog" color="#fb923c" />
      </View>
      <View style={styles.statsRow}>
        <StatCard num={openIdeas} label="open ideas" color="#a78bfa" />
        <StatCard num={`${screensBuilt}/${screensTotal}`} label="screens built" color="#34d399" />
        <StatCard num={`${screensPct}%`} label="coverage" color={screensPct >= 70 ? '#34d399' : '#fbbf24'} />
      </View>

      {screensStubs > 0 && (
        <View style={styles.screenAlert}>
          <Text style={styles.screenAlertText}>⚠️  {screensStubs} screens are stubs or missing — check the 📱 Screens tab.</Text>
        </View>
      )}

      <SectionHeader title="Module health" subtitle="Counts come from normalized issues first, then raw-event fallback only when no normalized issues exist yet." />
      {MODULE_TABS.filter((t) => t.id !== 'overview').map((tab) => {
        if (tab.id === 'screens') {
          return (
            <View key={tab.id} style={styles.moduleHealthRow}>
              <Text style={styles.moduleHealthEmoji}>{tab.emoji}</Text>
              <Text style={styles.moduleHealthLabel}>{tab.label}</Text>
              <View style={[styles.moduleHealthBadge, screensStubs > 0 ? styles.moduleHealthBadgeActive : styles.moduleHealthBadgeClear]}>
                <Text style={[styles.moduleHealthBadgeText, screensStubs > 0 ? { color: '#fef3c7' } : { color: '#86efac' }]}>
                  {screensStubs > 0 ? `${screensStubs} need work` : `${screensPct}% built`}
                </Text>
              </View>
            </View>
          );
        }
        const count = moduleCounts[tab.id] ?? 0;
        return (
          <View key={tab.id} style={styles.moduleHealthRow}>
            <Text style={styles.moduleHealthEmoji}>{tab.emoji}</Text>
            <Text style={styles.moduleHealthLabel}>{tab.label}</Text>
            <View style={[styles.moduleHealthBadge, count > 0 ? styles.moduleHealthBadgeActive : styles.moduleHealthBadgeClear]}>
              <Text style={[styles.moduleHealthBadgeText, count > 0 ? { color: '#fef3c7' } : { color: '#86efac' }]}>{count} issues</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function FixQueueTab({ cards, onCardPress }: { cards: ControlRoomCard[]; onCardPress: (card: ControlRoomCard) => void }) {
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filtered = useMemo(() => {
    return cards
      .filter((card) => card.source !== 'founder-playbook')
      .filter((card) => filterSeverity === 'all' || card.severity === filterSeverity)
      .filter((card) => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'raw') return card.source === 'raw-audit-event';
        return card.status === filterStatus;
      })
      .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]);
  }, [cards, filterSeverity, filterStatus]);

  return (
    <View>
      <SectionHeader title="Fix Queue" subtitle="Grouped control_room_issues first. Raw events only appear when normalization has not produced issue rows yet." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(['all', 'critical', 'error', 'warning', 'info'] as FilterSeverity[]).map((severity) => (
          <Pill key={severity} label={severity === 'all' ? 'All severities' : severity} active={filterSeverity === severity} color={severity !== 'all' ? SEVERITY_COLOR[severity] : undefined} onPress={() => setFilterSeverity(severity)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(['all', 'open', 'investigating', 'planned', 'building', 'testing', 'resolved', 'raw'] as FilterStatus[]).map((status) => (
          <Pill key={status} label={status === 'all' ? 'All statuses' : status} active={filterStatus === status} onPress={() => setFilterStatus(status)} />
        ))}
      </ScrollView>
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>✅</Text>
          <Text style={styles.emptyStateText}>No normalized issues match these filters.</Text>
        </View>
      ) : (
        filtered.map((card) => <IssueCard key={`${card.source}-${card.id}`} item={card} onPress={() => onCardPress(card)} />)
      )}
    </View>
  );
}

function ModulePanel({ moduleId, cards, onCardPress }: { moduleId: ModuleTab; cards: ControlRoomCard[]; onCardPress: (card: ControlRoomCard) => void }) {
  const relevant = useMemo(() => {
    return cards
      .filter((card) => card.module === moduleId)
      .filter((card) => card.status !== 'resolved')
      .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]);
  }, [cards, moduleId]);

  const tab = MODULE_TABS.find((t) => t.id === moduleId)!;
  return (
    <View>
      <SectionHeader title={`${tab.emoji} ${tab.label}`} subtitle={`${relevant.length} active cards in this module`} />
      {relevant.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>✅</Text>
          <Text style={styles.emptyStateText}>No active cards for {tab.label}.</Text>
        </View>
      ) : (
        relevant.map((card) => <IssueCard key={`${card.source}-${card.id}`} item={card} onPress={() => onCardPress(card)} />)
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
  const filtered = useMemo(() => ideas.filter((idea) => filterStatus === 'all' || idea.status === filterStatus), [ideas, filterStatus]);
  const statusOptions: (IdeaStatus | 'all')[] = ['all', 'backlog', 'planned', 'building', 'testing', 'shipped'];

  return (
    <View>
      <SectionHeader title="💡 Founder Ideas" subtitle="Your product vision tracked through production." />
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
        {statusOptions.map((status) => (
          <Pill key={status} label={status === 'all' ? 'All' : status} active={filterStatus === status} color={status !== 'all' ? IDEA_STATUS_COLOR[status] : undefined} onPress={() => setFilterStatus(status)} />
        ))}
      </ScrollView>
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>💡</Text>
          <Text style={styles.emptyStateText}>No ideas yet. Add your first one above.</Text>
        </View>
      ) : (
        filtered.map((idea) => <IdeaCard key={idea.id} idea={idea} onStatusChange={onStatusChange} />)
      )}
    </View>
  );
}

export default function FounderControlRoom() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [issues, setIssues] = useState<ControlRoomIssue[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [ideas, setIdeas] = useState<FounderIdea[]>([]);
  const [activeTab, setActiveTab] = useState<ModuleTab>('overview');
  const [selectedCard, setSelectedCard] = useState<ControlRoomCard | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  async function load() {
    const founderProfile = await getCurrentFounderProfile();
    setProfile(founderProfile);
    if (isFounderProfile(founderProfile)) {
      const [issueRows, eventRows, ideaRows] = await Promise.all([
        controlRoomIssuesService.list(),
        listFounderAuditEvents(60),
        founderIdeasService.list(),
      ]);
      setIssues(issueRows);
      setEvents(eventRows);
      setIdeas(ideaRows);
    } else {
      setIssues([]);
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

  const normalizedCards = useMemo(() => issues.map(normalizedIssueToControlRoomCard), [issues]);
  const rawCards = useMemo(() => events.filter((event) => !event.resolved).map(auditEventToControlRoomCard), [events]);
  const playbookCards = useMemo(() => founderAuditPlaybook.map(playbookCardToControlRoomCard), []);
  const issueCards = useMemo(() => (normalizedCards.length > 0 ? normalizedCards : rawCards), [normalizedCards, rawCards]);
  const cards = useMemo(() => [...issueCards, ...playbookCards].sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]), [issueCards, playbookCards]);

  const criticalCount = issueCards.filter((card) => card.severity === 'critical' && card.status !== 'resolved').length;
  const rawOpenCount = events.filter((event) => !event.resolved).length;
  const openIdeas = ideas.filter((idea) => !['shipped', 'rejected'].includes(idea.status)).length;
  const allowed = isFounderProfile(profile);

  const handleResolve = useCallback(async (card: ControlRoomCard) => {
    if (card.source === 'normalized-issue') {
      const ok = await controlRoomIssuesService.updateStatus(card.id, 'resolved');
      if (ok) setIssues((prev) => prev.map((issue) => (issue.id === card.id ? { ...issue, status: 'resolved' } : issue)));
      return;
    }
    if (card.source === 'raw-audit-event') {
      const ok = await controlRoomIssuesService.resolveAuditEvent(card.id);
      if (ok) setEvents((prev) => prev.map((event) => (event.id === card.id ? { ...event, resolved: true } : event)));
    }
  }, []);

  const handleIdeaStatus = useCallback(async (id: string, status: IdeaStatus) => {
    const ok = await founderIdeasService.updateStatus(id, status);
    if (ok) setIdeas((prev) => prev.map((idea) => (idea.id === id ? { ...idea, status } : idea)));
  }, []);

  const handleAddIdea = useCallback(async (title: string) => {
    const idea = await founderIdeasService.create({ title, status: 'backlog' });
    if (idea) setIdeas((prev) => [idea, ...prev]);
  }, []);

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
        <Text style={styles.centerText}>This screen is only available to app_profiles rows with developer, admin, or founder access.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>Back to Bip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function openCard(card: ControlRoomCard) {
    setSelectedCard(card);
    setSheetVisible(true);
  }

  function renderTab() {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            profile={profile!}
            cards={cards}
            ideas={ideas}
            normalizedCount={normalizedCards.length}
            rawOpenCount={rawOpenCount}
            criticalCount={criticalCount}
            openIdeas={openIdeas}
          />
        );
      case 'fix-queue':
        return <FixQueueTab cards={cards} onCardPress={openCard} />;
      case 'screens':
        return <ScreensTab />;
      case 'ideas':
        return <IdeasTab ideas={ideas} onStatusChange={handleIdeaStatus} onAddIdea={handleAddIdea} />;
      default:
        return <ModulePanel moduleId={activeTab} cards={cards} onCardPress={openCard} />;
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {MODULE_TABS.map((tab) => (
          <TouchableOpacity key={tab.id} style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]} onPress={() => setActiveTab(tab.id)} activeOpacity={0.75}>
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a78bfa" />}>
        {renderTab()}
      </ScrollView>
      <IssueDetailSheet item={selectedCard} visible={sheetVisible} onClose={() => setSheetVisible(false)} onResolve={handleResolve} />
    </View>
  );
}

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
  tabBar:           { flexGrow: 0, backgroundColor: '#0f0c1f', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tabBarContent:    { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tabItem:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  tabItemActive:    { backgroundColor: '#3b0764', borderColor: '#a78bfa' },
  tabEmoji:         { fontSize: 14 },
  tabLabel:         { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  tabLabelActive:   { color: '#e9d5ff' },
  hero:             { borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: '#151029', borderRadius: 24, padding: 20, marginBottom: 14 },
  kicker:           { color: '#a78bfa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 11, marginBottom: 6 },
  heroTitle:        { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '900', marginBottom: 8 },
  heroText:         { color: '#d8b4fe', lineHeight: 21, fontSize: 14 },
  profilePill:      { marginTop: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)', borderRadius: 16, padding: 10, gap: 3 },
  profileText:      { color: '#f5d0fe', fontWeight: '700', fontSize: 13 },
  statsRow:         { flexDirection: 'row', gap: 10, marginBottom: 18 },
  stat:             { flex: 1, backgroundColor: '#111827', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statNum:          { color: '#fff', fontSize: 26, fontWeight: '900' },
  statLabel:        { color: '#9ca3af', fontWeight: '700', marginTop: 2, fontSize: 12 },
  sectionHeader:    { marginBottom: 10, marginTop: 16 },
  sectionTitle:     { color: '#fff', fontSize: 20, fontWeight: '900' },
  sectionSubtitle:  { color: '#9ca3af', fontSize: 13, marginTop: 3, lineHeight: 18 },
  filterRow:        { marginBottom: 10 },
  pill:             { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginRight: 6, backgroundColor: 'transparent' },
  pillText:         { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  pillTextActive:   { color: '#fff' },
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
  moduleHealthRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  moduleHealthEmoji:      { fontSize: 18, width: 28 },
  moduleHealthLabel:      { color: '#e5e7eb', fontWeight: '700', flex: 1 },
  moduleHealthBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  moduleHealthBadgeActive:{ backgroundColor: 'rgba(251,191,36,0.12)' },
  moduleHealthBadgeClear: { backgroundColor: 'rgba(52,211,153,0.10)' },
  moduleHealthBadgeText:  { fontWeight: '800', fontSize: 12 },
  emptyState:       { alignItems: 'center', paddingVertical: 40 },
  emptyStateEmoji:  { fontSize: 36, marginBottom: 10 },
  emptyStateText:   { color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  ideaCard:             { backgroundColor: '#13102a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 10 },
  ideaCardTop:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ideaStatusBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  ideaStatusText:       { fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  ideaCategory:         { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  ideaTitle:            { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  ideaNotes:            { color: '#c4b5fd', fontSize: 13, lineHeight: 19 },
  ideaAdvanceBtn:       { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)' },
  ideaAdvanceBtnText:   { color: '#a78bfa', fontWeight: '800', fontSize: 12 },
  addIdeaRow:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addIdeaInput:     { flex: 1, backgroundColor: '#1a1535', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', fontSize: 14 },
  addIdeaBtn:       { backgroundColor: '#6d28d9', borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center' },
  addIdeaBtnText:   { color: '#fff', fontWeight: '800', fontSize: 13 },
  fixBox:           { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginBottom: 4 },
  fixText:          { color: '#fff', lineHeight: 20, fontSize: 14 },
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
  // ── Screens tab styles ──────────────────────────────────────────────────
  coverageBarBg:        { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, marginBottom: 12, overflow: 'hidden' },
  coverageBarFill:      { height: 8, backgroundColor: '#34d399', borderRadius: 999 },
  screenLegend:         { flexDirection: 'row', gap: 14, marginBottom: 12 },
  screenLegendItem:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  screenLegendDot:      { width: 8, height: 8, borderRadius: 4 },
  screenLegendText:     { color: '#9ca3af', fontSize: 11, fontWeight: '700' },
  screenGroup:          { marginBottom: 18 },
  screenGroupHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 6 },
  screenGroupEmoji:     { fontSize: 16 },
  screenGroupLabel:     { color: '#a78bfa', fontWeight: '900', fontSize: 13, flex: 1 },
  screenGroupCount:     { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  screenRow:            { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  screenStatusDot:      { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  screenRowText:        { flex: 1 },
  screenLabel:          { color: '#e5e7eb', fontWeight: '700', fontSize: 13 },
  screenRoute:          { color: '#6b7280', fontSize: 11, marginTop: 1 },
  screenNotes:          { color: '#fbbf24', fontSize: 11, marginTop: 2 },
  screenStatusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  screenStatusText:     { fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  screenAlert:          { backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
  screenAlertText:      { color: '#fbbf24', fontWeight: '700', fontSize: 13 },
});
