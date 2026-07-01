import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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

// ─── Project Registry ─────────────────────────────────────────────────────────

type ProjectStatus = 'active' | 'building' | 'paused' | 'shipped';

interface ProjectLink {
  label: string;
  url: string;
  emoji: string;
}

interface RegisteredProject {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  status: ProjectStatus;
  tech: string[];
  links: ProjectLink[];
  color: string;
}

const PROJECT_REGISTRY: RegisteredProject[] = [
  {
    id: 'sekret-bip',
    name: "Se'kret Bip",
    tagline: 'Teen emotional wellness & self-expression app. Anonymous posting, mood tracking, AI companion, parent bridge, healing spaces.',
    emoji: '💜',
    status: 'active',
    tech: ['React Native', 'Expo', 'TypeScript', 'Supabase', 'Cloudflare Workers'],
    links: [
      { label: 'GitHub (Bip)', url: 'https://github.com/jussray/Bip', emoji: '🐙' },
      { label: 'Web Demo', url: 'https://github.com/jussray/sekret-bip-demo', emoji: '🌐' },
    ],
    color: '#a78bfa',
  },
];

const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  active:   '#34d399',
  building: '#fbbf24',
  paused:   '#9ca3af',
  shipped:  '#60a5fa',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ModuleTab =
  | 'overview'
  | 'projects'
  | 'fix-queue'
  | 'voice'
  | 'companion'
  | 'memory'
  | 'security'
  | 'user-signals'
  | 'ideas'
  | 'infra';

type FilterSeverity = 'all' | AuditSeverity;
type FilterStatus = 'all' | IssueStatus | 'raw';
type IssueSource = 'normalized-issue' | 'raw-audit-event' | 'founder-playbook';

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
  { id: 'projects',     label: 'Projects',   emoji: '🗂️' },
  { id: 'fix-queue',    label: 'Fix Queue',  emoji: '🔧' },
  { id: 'voice',        label: 'Voice',      emoji: '🎙️' },
  { id: 'companion',    label: 'Companion',  emoji: '🤖' },
  { id: 'memory',       label: 'Memory',     emoji: '🧠' },
  { id: 'security',     label: 'Security',   emoji: '🔒' },
  { id: 'user-signals', label: 'Signals',    emoji: '📊' },
  { id: 'ideas',        label: 'Ideas',      emoji: '💡' },
  { id: 'infra',        label: 'Infra',      emoji: '⚙️' },
];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Shared UI components ─────────────────────────────────────────────────────

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

// ─── Projects Tab ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: RegisteredProject }) {
  return (
    <View style={[styles.projectCard, { borderColor: project.color + '40' }]}>
      {/* Header */}
      <View style={styles.projectCardHeader}>
        <Text style={styles.projectEmoji}>{project.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.projectName}>{project.name}</Text>
          <View style={[styles.projectStatusBadge, { backgroundColor: PROJECT_STATUS_COLOR[project.status] + '20', borderColor: PROJECT_STATUS_COLOR[project.status] }]}>
            <Text style={[styles.projectStatusText, { color: PROJECT_STATUS_COLOR[project.status] }]}>
              {project.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Tagline */}
      <Text style={styles.projectTagline}>{project.tagline}</Text>

      {/* Tech stack */}
      <View style={styles.projectTechRow}>
        {project.tech.map((t) => (
          <View key={t} style={styles.projectTechChip}>
            <Text style={styles.projectTechText}>{t}</Text>
          </View>
        ))}
      </View>

      {/* Links */}
      <View style={styles.projectLinksRow}>
        {project.links.map((link) => (
          <TouchableOpacity
            key={link.url}
            style={[styles.projectLinkBtn, { borderColor: project.color + '60' }]}
            onPress={() => Linking.openURL(link.url)}
            activeOpacity={0.75}
          >
            <Text style={[styles.projectLinkText, { color: project.color }]}>
              {link.emoji} {link.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ProjectsTab() {
  const activeCount = PROJECT_REGISTRY.filter((p) => p.status === 'active').length;
  const buildingCount = PROJECT_REGISTRY.filter((p) => p.status === 'building').length;

  return (
    <View>
      <SectionHeader
        title="🗂️ Your Projects"
        subtitle="All active codebases under the Juss portfolio. Tap any link to open it on GitHub."
      />

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <StatCard num={PROJECT_REGISTRY.length} label="total projects" color="#a78bfa" />
        <StatCard num={activeCount} label="active" color="#34d399" />
        <StatCard num={buildingCount} label="building" color="#fbbf24" />
      </View>

      {/* Project cards */}
      {PROJECT_REGISTRY.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}

      {/* Footer hint */}
      <View style={styles.projectsFooterHint}>
        <Text style={styles.projectsFooterText}>
          💡 To add another project, update PROJECT_REGISTRY in app/(dev)/index.tsx
        </Text>
      </View>
    </View>
  );
}

// ─── Issue detail sheet ───────────────────────────────────────────────────────

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

// ─── Tab components ───────────────────────────────────────────────────────────

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
        <StatCard num={PROJECT_REGISTRY.length} label="projects" color="#f9a8d4" />
        <StatCard num={cards.length} label="visible cards" color="#34d399" />
      </View>

      {/* Projects quick-look */}
      <SectionHeader title="Projects" subtitle="Tap 🗂️ Projects tab for full details and GitHub links." />
      {PROJECT_REGISTRY.map((project) => (
        <View key={project.id} style={styles.moduleHealthRow}>
          <Text style={styles.moduleHealthEmoji}>{project.emoji}</Text>
          <Text style={styles.moduleHealthLabel}>{project.name}</Text>
          <View style={[styles.moduleHealthBadge, { backgroundColor: PROJECT_STATUS_COLOR[project.status] + '18' }]}>
            <Text style={[styles.moduleHealthBadgeText, { color: PROJECT_STATUS_COLOR[project.status] }]}>
              {project.status}
            </Text>
          </View>
        </View>
      ))}

      <SectionHeader title="Module health" subtitle="Counts come from normalized issues first, then raw-event fallback only when no normalized issues exist yet." />
      {MODULE_TABS.filter((t) => t.id !== 'overview' && t.id !== 'projects').map((tab) => {
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

// ─── Main screen ──────────────────────────────────────────────────────────────

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
      case 'projects':
        return <ProjectsTab />;
      case 'fix-queue':
        return <FixQueueTab cards={cards} onCardPress={openCard} />;
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // ── Projects tab styles ──
  projectCard:          { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 14, backgroundColor: '#120f24' },
  projectCardHeader:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  projectEmoji:         { fontSize: 28, marginTop: 2 },
  projectName:          { color: '#fff', fontSize: 17, fontWeight: '900', marginBottom: 6 },
  projectStatusBadge:   { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  projectStatusText:    { fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  projectTagline:       { color: '#c4b5fd', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  projectTechRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  projectTechChip:      { backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  projectTechText:      { color: '#9ca3af', fontSize: 11, fontWeight: '700' },
  projectLinksRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  projectLinkBtn:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
  projectLinkText:      { fontWeight: '800', fontSize: 12 },
  projectsFooterHint:   { marginTop: 8, padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  projectsFooterText:   { color: '#6b7280', fontSize: 12, lineHeight: 17 },
});
