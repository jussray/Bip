import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { auditEventToCard, getCurrentFounderProfile, isFounderProfile, listFounderAuditEvents, type AuditEvent, type AuditSeverity, type FounderProfile } from '@/services/founderAudit';
import { controlRoomIssuesService, type ControlRoomIssue, type IssueStatus } from '@/services/controlRoomIssues';
import { founderIdeasService, type FounderIdea, type IdeaStatus } from '@/services/founderIdeas';

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

type Tab = 'overview' | 'projects' | 'fix-queue' | 'ideas';
type Source = 'all' | 'runtime' | 'voice' | 'navigation' | 'worker' | 'asset' | 'auth' | 'supabase' | 'scanner';
type Quick = 'all' | 'critical' | 'new-today' | 'safety' | 'assets' | 'supabase';
type Card = { id:string; origin:'normalized'|'raw'; title:string; summary:string; fix:string; category:string; severity:AuditSeverity; status:IssueStatus; source:Source; fingerprint?:string; fingerprintKey?:string; surface?:string; users?:number; occurrences?:number; first?:string; last?:string; metadata?:Record<string,unknown>|null };

const COLORS:Record<AuditSeverity,string>={critical:'#f87171',error:'#fb923c',warning:'#fbbf24',info:'#60a5fa'};
const WEIGHT:Record<AuditSeverity,number>={critical:4,error:3,warning:2,info:1};
const SOURCES:Source[]=['all','runtime','voice','navigation','worker','asset','auth','supabase','scanner'];
const QUICKS:Quick[]=['all','critical','new-today','safety','assets','supabase'];
const SEVERITIES:('all'|AuditSeverity)[]=['all','critical','error','warning','info'];

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'overview',  label: 'Overview',  emoji: '🏠' },
  { id: 'projects',  label: 'Projects',  emoji: '🗂️' },
  { id: 'fix-queue', label: 'Fix Queue', emoji: '🔧' },
  { id: 'ideas',     label: 'Ideas',     emoji: '💡' },
];

function text(meta:Record<string,unknown>|null|undefined,key:string){const value=meta?.[key];return typeof value==='string'&&value.trim()?value:undefined;}
function severity(value?:string):AuditSeverity{return value==='critical'||value==='error'||value==='warning'||value==='info'?value:'info';}
function sourceOf(input:string):Source{const v=input.toLowerCase();if(v.includes('voice'))return'voice';if(v.includes('navigation')||v.includes('route'))return'navigation';if(v.includes('worker')||v.includes('cloudflare'))return'worker';if(v.includes('asset')||v.includes('image')||v.includes('room_scene'))return'asset';if(v.includes('auth')||v.includes('login')||v.includes('signup')||v.includes('session'))return'auth';if(v.includes('supabase')||v.includes('database')||v.includes('storage')||v.includes('sync'))return'supabase';if(v.includes('scan')||v.includes('structural')||v.includes('rls'))return'scanner';return'runtime';}
function today(value?:string){if(!value)return false;const d=new Date(value);const n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();}

function normalizeCard(issue: ControlRoomIssue): Card {
  return {
    id: issue.id,
    origin: 'normalized',
    title: issue.title,
    summary: issue.summary ?? '',
    fix: issue.suggested_fix ?? '',
    category: issue.category,
    severity: severity(issue.severity),
    status: issue.status,
    source: sourceOf(issue.category),
    surface: issue.affected_surface ?? undefined,
    users: issue.affected_users ?? undefined,
    occurrences: issue.occurrence_count ?? undefined,
    first: issue.first_seen_at ?? undefined,
    last: issue.last_seen_at ?? undefined,
    metadata: issue.metadata,
  };
}

function rawCard(event: AuditEvent): Card {
  const c = auditEventToCard(event);
  return {
    id: event.id,
    origin: 'raw',
    title: c.title,
    summary: c.summary,
    fix: c.fix,
    category: c.category,
    severity: c.severity,
    status: event.resolved ? 'resolved' : 'open',
    source: sourceOf(c.category),
    first: event.created_at,
    last: event.created_at,
    metadata: event.metadata,
  };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Pill({ label, active, color, onPress }: { label: string; active: boolean; color?: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && { backgroundColor: color ?? '#7c3aed', borderColor: color ?? '#7c3aed' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function IssueCard({ item, onPress }: { item: Card; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.cardTop}>
        <View style={[styles.severityDot, { backgroundColor: COLORS[item.severity] }]} />
        <Text style={styles.badge}>{item.category}</Text>
        <Text style={[styles.severityLabel, { color: COLORS[item.severity] }]}>{item.severity}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardText} numberOfLines={2}>{item.summary}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardSource}>{item.origin === 'normalized' ? 'Grouped issue' : 'Raw event'}</Text>
        <Text style={styles.cardChevron}>›</Text>
      </View>
    </TouchableOpacity>
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
      <View style={styles.projectCardHeader}>
        <Text style={styles.projectEmoji}>{project.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.projectName}>{project.name}</Text>
          <View style={[styles.projectStatusBadge, { backgroundColor: PROJECT_STATUS_COLOR[project.status] + '20', borderColor: PROJECT_STATUS_COLOR[project.status] }]}>
            <Text style={[styles.projectStatusText, { color: PROJECT_STATUS_COLOR[project.status] }]}>{project.status}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.projectTagline}>{project.tagline}</Text>
      <View style={styles.projectTechRow}>
        {project.tech.map((t) => (
          <View key={t} style={styles.projectTechChip}>
            <Text style={styles.projectTechText}>{t}</Text>
          </View>
        ))}
      </View>
      <View style={styles.projectLinksRow}>
        {project.links.map((link) => (
          <TouchableOpacity
            key={link.url}
            style={[styles.projectLinkBtn, { borderColor: project.color + '60' }]}
            onPress={() => Linking.openURL(link.url)}
            activeOpacity={0.75}
          >
            <Text style={[styles.projectLinkText, { color: project.color }]}>{link.emoji} {link.label}</Text>
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
      <SectionHeader title="🗂️ Your Projects" subtitle="All active codebases under the Juss portfolio. Tap any link to open it." />
      <View style={styles.statsRow}>
        <StatCard num={PROJECT_REGISTRY.length} label="total" color="#a78bfa" />
        <StatCard num={activeCount} label="active" color="#34d399" />
        <StatCard num={buildingCount} label="building" color="#fbbf24" />
      </View>
      {PROJECT_REGISTRY.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
      <View style={styles.projectsFooterHint}>
        <Text style={styles.projectsFooterText}>💡 Add more projects by updating PROJECT_REGISTRY in DevControlRoomScreen.tsx</Text>
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
  item: Card | null;
  visible: boolean;
  onClose: () => void;
  onResolve?: (card: Card) => void;
}) {
  if (!item) return null;
  const canResolve = item.status !== 'resolved';
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={[styles.severityDot, { backgroundColor: COLORS[item.severity], width: 12, height: 12 }]} />
          <Text style={[styles.sheetSeverity, { color: COLORS[item.severity] }]}>{item.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.sheetTitle}>{item.title}</Text>
        <Text style={styles.sheetMeta}>Status: <Text style={styles.sheetMetaValue}>{item.status}</Text></Text>
        <Text style={styles.sheetMeta}>Category: <Text style={styles.sheetMetaValue}>{item.category}</Text></Text>
        <Text style={styles.sheetMeta}>Source: <Text style={styles.sheetMetaValue}>{item.origin === 'normalized' ? 'Grouped issue' : 'Raw event'}</Text></Text>
        {item.surface ? <Text style={styles.sheetMeta}>Surface: <Text style={styles.sheetMetaValue}>{item.surface}</Text></Text> : null}
        {typeof item.occurrences === 'number' ? <Text style={styles.sheetMeta}>Occurrences: <Text style={styles.sheetMetaValue}>{item.occurrences}</Text></Text> : null}
        {typeof item.users === 'number' ? <Text style={styles.sheetMeta}>Affected users: <Text style={styles.sheetMetaValue}>{item.users}</Text></Text> : null}
        <SectionHeader title="Summary" />
        <Text style={styles.sheetBody}>{item.summary}</Text>
        <SectionHeader title="Fix path" />
        <View style={styles.fixBox}>
          <Text style={styles.fixText}>{item.fix}</Text>
        </View>
        <View style={styles.sheetActions}>
          {canResolve && onResolve ? (
            <TouchableOpacity style={[styles.actionBtn, styles.resolveBtn]} onPress={() => { onResolve(item); onClose(); }} activeOpacity={0.8}>
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DevControlRoomScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [issues, setIssues] = useState<ControlRoomIssue[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [ideas, setIdeas] = useState<FounderIdea[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
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

  const normalizedCards = useMemo(() => issues.map(normalizeCard), [issues]);
  const rawOpenCards = useMemo(() => events.filter((e) => !e.resolved).map(rawCard), [events]);
  const cards = useMemo(() => {
    const base = normalizedCards.length > 0 ? normalizedCards : rawOpenCards;
    return [...base].sort((a, b) => WEIGHT[b.severity] - WEIGHT[a.severity]);
  }, [normalizedCards, rawOpenCards]);

  const criticalCount = cards.filter((c) => c.severity === 'critical' && c.status !== 'resolved').length;
  const openIdeas = ideas.filter((i) => !['shipped', 'rejected'].includes(i.status)).length;
  const allowed = isFounderProfile(profile);

  const handleResolve = useCallback(async (card: Card) => {
    if (card.origin === 'normalized') {
      const ok = await controlRoomIssuesService.updateStatus(card.id, 'resolved');
      if (ok) setIssues((prev) => prev.map((i) => (i.id === card.id ? { ...i, status: 'resolved' } : i)));
    } else {
      const ok = await controlRoomIssuesService.resolveAuditEvent(card.id);
      if (ok) setEvents((prev) => prev.map((e) => (e.id === card.id ? { ...e, resolved: true } : e)));
    }
  }, []);

  const handleIdeaStatus = useCallback(async (id: string, status: IdeaStatus) => {
    const ok = await founderIdeasService.updateStatus(id, status);
    if (ok) setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
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
        <Text style={styles.centerText}>This screen is only available to founders and developers.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>Back to Bip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function openCard(card: Card) {
    setSelectedCard(card);
    setSheetVisible(true);
  }

  // ─── Tab rendering ───────────────────────────────────────────────────────────

  const openIssueCards = cards.filter((c) => c.status !== 'resolved');

  function renderOverview() {
    const sourceCounts = SOURCES.slice(1).map((s) => ({
      source: s,
      count: openIssueCards.filter((c) => c.source === s).length,
    })).filter((x) => x.count > 0);

    return (
      <View>
        <View style={styles.hero}>
          <Text style={styles.kicker}>🛠 Se'kret Bip</Text>
          <Text style={styles.heroTitle}>Founder Control Room</Text>
          <Text style={styles.heroText}>Normalized issues are the primary operating layer. Raw audit events are fallback context.</Text>
          {profile && (
            <View style={styles.profilePill}>
              <Text style={styles.profileText}>Role: {profile.role}</Text>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <StatCard num={criticalCount} label="critical" color="#f87171" />
          <StatCard num={openIssueCards.length} label="open" color="#a78bfa" />
          <StatCard num={openIdeas} label="open ideas" color="#fbbf24" />
        </View>
        <View style={styles.statsRow}>
          <StatCard num={PROJECT_REGISTRY.length} label="projects" color="#f9a8d4" />
          <StatCard num={normalizedCards.length} label="normalized" color="#34d399" />
          <StatCard num={rawOpenCards.length} label="raw backlog" color="#fb923c" />
        </View>
        <SectionHeader title="Projects" subtitle="Tap 🗂️ Projects tab for details and links." />
        {PROJECT_REGISTRY.map((project) => (
          <View key={project.id} style={styles.moduleHealthRow}>
            <Text style={styles.moduleHealthEmoji}>{project.emoji}</Text>
            <Text style={styles.moduleHealthLabel}>{project.name}</Text>
            <View style={[styles.moduleHealthBadge, { backgroundColor: PROJECT_STATUS_COLOR[project.status] + '18' }]}>
              <Text style={[styles.moduleHealthBadgeText, { color: PROJECT_STATUS_COLOR[project.status] }]}>{project.status}</Text>
            </View>
          </View>
        ))}
        {sourceCounts.length > 0 && (
          <>
            <SectionHeader title="Source breakdown" />
            {sourceCounts.map((x) => (
              <View key={x.source} style={styles.moduleHealthRow}>
                <Text style={styles.moduleHealthLabel}>{x.source}</Text>
                <View style={[styles.moduleHealthBadge, styles.moduleHealthBadgeActive]}>
                  <Text style={[styles.moduleHealthBadgeText, { color: '#fef3c7' }]}>{x.count} open</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    );
  }

  function renderFixQueue() {
    const [filterSev, setFilterSev] = React.useState<'all' | AuditSeverity>('all');
    const filtered = openIssueCards
      .filter((c) => filterSev === 'all' || c.severity === filterSev)
      .sort((a, b) => WEIGHT[b.severity] - WEIGHT[a.severity]);
    return (
      <View>
        <SectionHeader title="Fix Queue" subtitle="Grouped issues first; raw events when no normalized rows exist." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {SEVERITIES.map((s) => (
            <Pill key={s} label={s === 'all' ? 'All severities' : s} active={filterSev === s} color={s !== 'all' ? COLORS[s] : undefined} onPress={() => setFilterSev(s)} />
          ))}
        </ScrollView>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>✅</Text>
            <Text style={styles.emptyStateText}>No open issues match these filters.</Text>
          </View>
        ) : (
          filtered.map((card) => <IssueCard key={card.id} item={card} onPress={() => openCard(card)} />)
        )}
      </View>
    );
  }

  function renderIdeas() {
    const [newIdea, setNewIdea] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState<IdeaStatus | 'all'>('all');
    const IDEA_STATUS_COLOR: Record<IdeaStatus, string> = {
      backlog: '#8b5cf6', researching: '#06b6d4', planned: '#3b82f6',
      building: '#f59e0b', testing: '#a78bfa', shipped: '#34d399',
      paused: '#9ca3af', rejected: '#6b7280',
    };
    const filtered = ideas.filter((i) => filterStatus === 'all' || i.status === filterStatus);
    const statusOptions: (IdeaStatus | 'all')[] = ['all', 'backlog', 'planned', 'building', 'testing', 'shipped'];
    const NEXT: Partial<Record<IdeaStatus, IdeaStatus>> = {
      backlog: 'planned', researching: 'planned', planned: 'building', building: 'testing', testing: 'shipped',
    };
    return (
      <View>
        <SectionHeader title="💡 Founder Ideas" subtitle="Your product vision tracked through production." />
        <View style={styles.addIdeaRow}>
          <View style={styles.addIdeaInput}>
            <Text style={{ color: '#6b7280' }}>Use Supabase to add ideas</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {statusOptions.map((s) => (
            <Pill key={s} label={s === 'all' ? 'All' : s} active={filterStatus === s} color={s !== 'all' ? IDEA_STATUS_COLOR[s as IdeaStatus] : undefined} onPress={() => setFilterStatus(s)} />
          ))}
        </ScrollView>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>💡</Text>
            <Text style={styles.emptyStateText}>No ideas yet.</Text>
          </View>
        ) : (
          filtered.map((idea) => {
            const next = NEXT[idea.status];
            return (
              <View key={idea.id} style={styles.ideaCard}>
                <View style={styles.ideaCardTop}>
                  <View style={[styles.ideaStatusBadge, { backgroundColor: IDEA_STATUS_COLOR[idea.status] + '22', borderColor: IDEA_STATUS_COLOR[idea.status] }]}>
                    <Text style={[styles.ideaStatusText, { color: IDEA_STATUS_COLOR[idea.status] }]}>{idea.status}</Text>
                  </View>
                  {idea.category ? <Text style={styles.ideaCategory}>{idea.category}</Text> : null}
                </View>
                <Text style={styles.ideaTitle}>{idea.title}</Text>
                {idea.notes ? <Text style={styles.ideaNotes}>{idea.notes}</Text> : null}
                {next ? (
                  <TouchableOpacity style={styles.ideaAdvanceBtn} onPress={() => handleIdeaStatus(idea.id, next)} activeOpacity={0.75}>
                    <Text style={styles.ideaAdvanceBtnText}>Move to {next} →</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    );
  }

  function renderTab() {
    switch (activeTab) {
      case 'overview':  return renderOverview();
      case 'projects':  return <ProjectsTab />;
      case 'fix-queue': return renderFixQueue();
      case 'ideas':     return renderIdeas();
      default:          return renderOverview();
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((tab) => (
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
  addIdeaInput:     { flex: 1, backgroundColor: '#1a1535', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
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
  sheetActions:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn:        { flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
  resolveBtn:       { backgroundColor: '#065f46' },
  closeBtn:         { backgroundColor: '#1f2937' },
  actionBtnText:    { color: '#fff', fontWeight: '900', fontSize: 14 },
  // ── Projects ──
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
