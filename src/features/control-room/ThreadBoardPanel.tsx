/**
 * ThreadBoardPanel.tsx
 *
 * Replit-style founder execution board for Se'kret Bip Control Room.
 *
 * Flow:
 *   1. Founder enters a brief → plan mode expands with decomposed subtasks
 *   2. Confirm spawns isolated thread cards on the board
 *   3. Each thread moves through: Planned → Running → Review → Approved → Applied
 *   4. Board view filters by lifecycle column
 *   5. Artifacts (PRs, SQL, copy, deploy) appear per-thread for review
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThreadStatus =
  | 'planned'
  | 'running'
  | 'review'
  | 'approved'
  | 'applied'
  | 'blocked';

export type AgentType =
  | 'product'
  | 'engineer'
  | 'debugger'
  | 'analyst'
  | 'growth'
  | 'support'
  | 'deploy'
  | 'coo';

export interface ThreadArtifact {
  id: string;
  type: 'pr' | 'sql' | 'copy' | 'deploy' | 'doc' | 'email';
  label: string;
  preview: string;
}

export interface FounderThread {
  id: string;
  initiativeId: string;
  title: string;
  agent: AgentType;
  status: ThreadStatus;
  risk: 'low' | 'medium' | 'high';
  artifacts: ThreadArtifact[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

interface Initiative {
  id: string;
  brief: string;
  plan: PlanTask[];
  spawnedAt: number;
}

interface PlanTask {
  id: string;
  title: string;
  agent: AgentType;
  risk: 'low' | 'medium' | 'high';
  why: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER: ThreadStatus[] = [
  'planned', 'running', 'review', 'approved', 'applied', 'blocked',
];

const STATUS_COLOR: Record<ThreadStatus, string> = {
  planned:  '#6b7280',
  running:  '#a78bfa',
  review:   '#fbbf24',
  approved: '#4ade80',
  applied:  '#22d3ee',
  blocked:  '#fb7185',
};

const RISK_COLOR: Record<'low' | 'medium' | 'high', string> = {
  low:    '#4ade80',
  medium: '#fbbf24',
  high:   '#fb7185',
};

const AGENT_EMOJI: Record<AgentType, string> = {
  product:  '📐',
  engineer: '⚙️',
  debugger: '🔬',
  analyst:  '📊',
  growth:   '🚀',
  support:  '💬',
  deploy:   '🛳️',
  coo:      '🧭',
};

let _idCounter = 1;
function uid() { return String(_idCounter++); }

// ─── Plan decomposer (static demo — replace with Anthropic call) ─────────────
function decomposeBrief(brief: string): PlanTask[] {
  const lower = brief.toLowerCase();
  const tasks: PlanTask[] = [];

  tasks.push({
    id: uid(),
    title: 'Scope & requirements doc',
    agent: 'product',
    risk: 'low',
    why: 'Clarify acceptance criteria before building.',
  });

  if (lower.includes('bug') || lower.includes('fix') || lower.includes('crash') || lower.includes('error')) {
    tasks.push({
      id: uid(),
      title: 'Root-cause diagnosis',
      agent: 'debugger',
      risk: 'low',
      why: 'Isolate the failure before writing any fix.',
    });
  }

  if (lower.includes('data') || lower.includes('schema') || lower.includes('migration') || lower.includes('sql') || lower.includes('supabase')) {
    tasks.push({
      id: uid(),
      title: 'Schema migration + RLS review',
      agent: 'engineer',
      risk: 'high',
      why: 'Data changes need dry-run and rollback plan.',
    });
  }

  tasks.push({
    id: uid(),
    title: 'Implementation thread',
    agent: 'engineer',
    risk: lower.includes('prod') || lower.includes('deploy') ? 'high' : 'medium',
    why: 'Core build task in an isolated branch.',
  });

  if (lower.includes('growth') || lower.includes('launch') || lower.includes('email') || lower.includes('user')) {
    tasks.push({
      id: uid(),
      title: 'Growth / comms artifact',
      agent: 'growth',
      risk: 'medium',
      why: 'Outbound copy, launch notes, or onboarding update.',
    });
  }

  if (lower.includes('deploy') || lower.includes('worker') || lower.includes('cloudflare') || lower.includes('ship')) {
    tasks.push({
      id: uid(),
      title: 'Deploy & smoke-test',
      agent: 'deploy',
      risk: 'high',
      why: 'Production apply requires founder approval.',
    });
  }

  tasks.push({
    id: uid(),
    title: 'Founder briefing summary',
    agent: 'coo',
    risk: 'low',
    why: 'One-paragraph status after all threads resolve.',
  });

  return tasks;
}

function planToThreads(initiative: Initiative): FounderThread[] {
  return initiative.plan.map((task) => ({
    id: uid(),
    initiativeId: initiative.id,
    title: task.title,
    agent: task.agent,
    status: 'planned',
    risk: task.risk,
    artifacts: [],
    notes: task.why,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
}

// ─── Shared in-memory store (persists across tab switches in-session) ─────────
let _threads: FounderThread[] = [];
let _initiatives: Initiative[] = [];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ThreadBoardPanel() {
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  const [view, setView] = useState<'brief' | 'board'>('board');
  const [brief, setBrief] = useState('');
  const [planMode, setPlanMode] = useState<Initiative | null>(null);
  const [filter, setFilter] = useState<ThreadStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const threads = _threads;
  const initiatives = _initiatives;

  const visible = useMemo(
    () => filter === 'all' ? threads : threads.filter((t) => t.status === filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, threads, forceRender]
  );

  // ── Brief → Plan ──
  const buildPlan = useCallback(() => {
    const trimmed = brief.trim();
    if (!trimmed) return;
    const initiative: Initiative = {
      id: uid(),
      brief: trimmed,
      plan: decomposeBrief(trimmed),
      spawnedAt: Date.now(),
    };
    setPlanMode(initiative);
  }, [brief]);

  // ── Plan → Threads ──
  const confirmPlan = useCallback(() => {
    if (!planMode) return;
    const newThreads = planToThreads(planMode);
    _threads = [...newThreads, ..._threads];
    _initiatives = [planMode, ..._initiatives];
    setBrief('');
    setPlanMode(null);
    setView('board');
    rerender();
  }, [planMode, rerender]);

  // ── Thread lifecycle ──
  const advance = useCallback((threadId: string) => {
    _threads = _threads.map((t) => {
      if (t.id !== threadId) return t;
      const idx = STATUS_ORDER.indexOf(t.status);
      if (idx < 0 || idx >= STATUS_ORDER.length - 2) return t; // stop before 'blocked'
      const next = STATUS_ORDER[idx + 1];
      return { ...t, status: next, updatedAt: Date.now() };
    });
    rerender();
  }, [rerender]);

  const block = useCallback((threadId: string) => {
    _threads = _threads.map((t) =>
      t.id === threadId ? { ...t, status: 'blocked', updatedAt: Date.now() } : t
    );
    rerender();
  }, [rerender]);

  const addArtifact = useCallback((threadId: string, type: ThreadArtifact['type'], label: string) => {
    _threads = _threads.map((t) => {
      if (t.id !== threadId) return t;
      const artifact: ThreadArtifact = {
        id: uid(),
        type,
        label,
        preview: `[${type.toUpperCase()}] ${label} — ready for review`,
      };
      return { ...t, artifacts: [...t.artifacts, artifact], status: 'review', updatedAt: Date.now() };
    });
    rerender();
  }, [rerender]);

  const removeThread = useCallback((threadId: string) => {
    _threads = _threads.filter((t) => t.id !== threadId);
    rerender();
  }, [rerender]);

  // ── Counts ──
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of [...STATUS_ORDER, 'all']) map[s] = 0;
    for (const t of threads) map[t.status] = (map[t.status] || 0) + 1;
    map['all'] = threads.length;
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, forceRender]);

  return (
    <View style={s.root}>
      {/* ── Top bar ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.kicker}>SE'KRET BIP · CONTROL ROOM</Text>
            <Text style={s.title}>Thread Board</Text>
          </View>
          <TouchableOpacity
            style={[s.tabBtn, view === 'brief' && s.tabBtnActive]}
            onPress={() => setView(view === 'brief' ? 'board' : 'brief')}
          >
            <Text style={[s.tabBtnText, view === 'brief' && s.tabBtnTextActive]}>
              {view === 'brief' ? '← Board' : '+ Brief'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Brief / Plan mode ── */}
      {view === 'brief' && (
        <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.sectionLabel}>Founder brief</Text>
          <TextInput
            style={[s.input, s.inputTall]}
            placeholder="Describe what needs to happen. Be specific about environment, surface, and goal."
            placeholderTextColor="#6b7280"
            value={brief}
            onChangeText={setBrief}
            multiline
          />
          <TouchableOpacity
            style={[s.primary, !brief.trim() && s.primaryDisabled]}
            onPress={buildPlan}
            disabled={!brief.trim()}
          >
            <Text style={s.primaryText}>Build plan →</Text>
          </TouchableOpacity>

          {planMode && (
            <>
              <View style={s.planHeader}>
                <Text style={s.kicker}>PLAN MODE</Text>
                <Text style={s.sectionLabel}>
                  {planMode.plan.length} threads will be spawned
                </Text>
              </View>
              {planMode.plan.map((task) => (
                <View key={task.id} style={s.planCard}>
                  <View style={s.row}>
                    <Text style={s.agentBadge}>{AGENT_EMOJI[task.agent]} {task.agent}</Text>
                    <Text style={[s.riskBadge, { color: RISK_COLOR[task.risk] }]}>{task.risk} risk</Text>
                  </View>
                  <Text style={s.cardTitle}>{task.title}</Text>
                  <Text style={s.cardWhy}>{task.why}</Text>
                </View>
              ))}

              <View style={s.confirmRow}>
                <TouchableOpacity style={s.ghost} onPress={() => setPlanMode(null)}>
                  <Text style={s.ghostText}>Revise brief</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.primary, { flex: 1 }]} onPress={confirmPlan}>
                  <Text style={s.primaryText}>Spawn {planMode.plan.length} threads</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* ── Board view ── */}
      {view === 'board' && (
        <View style={{ flex: 1 }}>
          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
            {(['all', ...STATUS_ORDER] as const).map((s2) => (
              <TouchableOpacity
                key={s2}
                style={[filterChipStyle(s2, filter === s2)]}
                onPress={() => setFilter(s2)}
              >
                <Text style={[s.filterLabel, filter === s2 && s.filterLabelActive]}>
                  {s2} {counts[s2] ? `(${counts[s2]})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {visible.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No threads yet</Text>
              <Text style={s.emptyBody}>
                Tap + Brief to write a founder brief. The plan engine will decompose it into isolated execution threads.
              </Text>
              <TouchableOpacity style={s.primary} onPress={() => setView('brief')}>
                <Text style={s.primaryText}>Write first brief →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={s.scroll} contentContainerStyle={s.content}>
              {visible.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  expanded={expanded === thread.id}
                  onToggle={() => setExpanded(expanded === thread.id ? null : thread.id)}
                  onAdvance={() => advance(thread.id)}
                  onBlock={() => block(thread.id)}
                  onAddArtifact={(type, label) => addArtifact(thread.id, type, label)}
                  onRemove={() => removeThread(thread.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Thread card ──────────────────────────────────────────────────────────────

const ARTIFACT_TYPES: ThreadArtifact['type'][] = ['pr', 'sql', 'copy', 'deploy', 'doc', 'email'];

function ThreadCard({
  thread,
  expanded,
  onToggle,
  onAdvance,
  onBlock,
  onAddArtifact,
  onRemove,
}: {
  thread: FounderThread;
  expanded: boolean;
  onToggle: () => void;
  onAdvance: () => void;
  onBlock: () => void;
  onAddArtifact: (type: ThreadArtifact['type'], label: string) => void;
  onRemove: () => void;
}) {
  const [artifactType, setArtifactType] = useState<ThreadArtifact['type']>('pr');
  const [artifactLabel, setArtifactLabel] = useState('');

  const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(thread.status) + 1];
  const canAdvance = thread.status !== 'applied' && thread.status !== 'blocked';

  return (
    <TouchableOpacity style={tc.card} onPress={onToggle} activeOpacity={0.85}>
      {/* Header row */}
      <View style={tc.headerRow}>
        <Text style={tc.agent}>{AGENT_EMOJI[thread.agent]} {thread.agent}</Text>
        <View style={tc.badges}>
          <Text style={[tc.riskDot, { color: RISK_COLOR[thread.risk] }]}>● {thread.risk}</Text>
          <View style={[tc.statusPill, { backgroundColor: STATUS_COLOR[thread.status] + '22' }]}>
            <Text style={[tc.statusText, { color: STATUS_COLOR[thread.status] }]}>{thread.status}</Text>
          </View>
        </View>
      </View>

      <Text style={tc.title}>{thread.title}</Text>
      {!expanded && <Text style={tc.notes} numberOfLines={1}>{thread.notes}</Text>}

      {expanded && (
        <View style={tc.body}>
          <Text style={tc.notes}>{thread.notes}</Text>

          {/* Artifacts */}
          {thread.artifacts.length > 0 && (
            <View style={tc.section}>
              <Text style={tc.sectionLabel}>Artifacts</Text>
              {thread.artifacts.map((a) => (
                <View key={a.id} style={tc.artifactRow}>
                  <Text style={tc.artifactType}>{a.type.toUpperCase()}</Text>
                  <Text style={tc.artifactLabel} numberOfLines={2}>{a.preview}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add artifact */}
          {thread.status !== 'applied' && (
            <View style={tc.section}>
              <Text style={tc.sectionLabel}>Add artifact</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {ARTIFACT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[tc.artChip, artifactType === t && tc.artChipActive]}
                    onPress={() => setArtifactType(t)}
                  >
                    <Text style={[tc.artChipText, artifactType === t && tc.artChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={tc.input}
                placeholder="Artifact label (e.g. PR #42, migration_v3.sql)"
                placeholderTextColor="#6b7280"
                value={artifactLabel}
                onChangeText={setArtifactLabel}
              />
              <TouchableOpacity
                style={[tc.addArtBtn, !artifactLabel.trim() && tc.addArtBtnDisabled]}
                disabled={!artifactLabel.trim()}
                onPress={() => { onAddArtifact(artifactType, artifactLabel.trim()); setArtifactLabel(''); }}
              >
                <Text style={tc.addArtText}>Attach artifact → Review</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Actions */}
          <View style={tc.actions}>
            {canAdvance && nextStatus && (
              <TouchableOpacity style={tc.advanceBtn} onPress={onAdvance}>
                <Text style={tc.advanceBtnText}>→ {nextStatus}</Text>
              </TouchableOpacity>
            )}
            {thread.status !== 'blocked' && thread.status !== 'applied' && (
              <TouchableOpacity style={tc.blockBtn} onPress={onBlock}>
                <Text style={tc.blockBtnText}>Block</Text>
              </TouchableOpacity>
            )}
            {(thread.status === 'applied' || thread.status === 'blocked') && (
              <TouchableOpacity style={tc.removeBtn} onPress={onRemove}>
                <Text style={tc.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function filterChipStyle(status: string, active: boolean) {
  const base: object[] = [s.filterChip];
  if (active) {
    const col = status === 'all' ? '#6d28d9' : STATUS_COLOR[status as ThreadStatus];
    base.push({ backgroundColor: col + '33', borderColor: col });
  }
  return base;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#080611' },
  header:           { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 12 },
  headerRow:        { flexDirection: 'row', alignItems: 'flex-start' },
  kicker:           { color: '#a78bfa', fontWeight: '800', fontSize: 11, letterSpacing: 2 },
  title:            { color: '#fff', fontWeight: '900', fontSize: 28, marginTop: 3 },
  tabBtn:           { borderWidth: 1, borderColor: '#272238', backgroundColor: '#12101c', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, marginTop: 6 },
  tabBtnActive:     { backgroundColor: '#6d28d9', borderColor: '#a78bfa' },
  tabBtnText:       { color: '#8f899e', fontWeight: '800', fontSize: 12 },
  tabBtnTextActive: { color: '#fff' },
  scroll:           { flex: 1 },
  content:          { padding: 16, paddingBottom: 80 },
  sectionLabel:     { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 8 },
  input:            { backgroundColor: '#12101c', borderColor: '#332c48', borderWidth: 1, borderRadius: 12, padding: 12, color: '#fff', marginBottom: 10 },
  inputTall:        { minHeight: 100, textAlignVertical: 'top' },
  primary:          { backgroundColor: '#6d28d9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  primaryDisabled:  { opacity: 0.4 },
  primaryText:      { color: '#fff', fontWeight: '800', fontSize: 14 },
  ghost:            { borderWidth: 1, borderColor: '#332c48', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', marginRight: 8, marginBottom: 12 },
  ghostText:        { color: '#a7a1b7', fontWeight: '700', fontSize: 13 },
  planHeader:       { marginTop: 16, marginBottom: 8 },
  planCard:         { backgroundColor: '#12101c', borderColor: '#272238', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
  row:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  agentBadge:       { color: '#c4b5fd', fontWeight: '800', fontSize: 12 },
  riskBadge:        { fontWeight: '800', fontSize: 11 },
  cardTitle:        { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  cardWhy:          { color: '#8f899e', fontSize: 12, lineHeight: 18 },
  confirmRow:       { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 8 },
  filterRow:        { paddingHorizontal: 16, paddingVertical: 8, maxHeight: 52 },
  filterChip:       { borderWidth: 1, borderColor: '#272238', backgroundColor: '#12101c', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginRight: 7 },
  filterLabel:      { color: '#8f899e', fontWeight: '700', fontSize: 11 },
  filterLabelActive:{ color: '#fff' },
  empty:            { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle:       { color: '#fff', fontWeight: '900', fontSize: 18 },
  emptyBody:        { color: '#8f899e', fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 300 },
});

const tc = StyleSheet.create({
  card:             { backgroundColor: '#0d0a15', borderColor: '#272238', borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 10 },
  headerRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  agent:            { color: '#c4b5fd', fontWeight: '800', fontSize: 12 },
  badges:           { flexDirection: 'row', gap: 8, alignItems: 'center' },
  riskDot:          { fontSize: 11, fontWeight: '800' },
  statusPill:       { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:       { fontSize: 10, fontWeight: '900' },
  title:            { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  notes:            { color: '#8f899e', fontSize: 12, lineHeight: 18, marginBottom: 4 },
  body:             { marginTop: 10, gap: 6 },
  section:          { marginTop: 10 },
  sectionLabel:     { color: '#a78bfa', fontWeight: '800', fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  artifactRow:      { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  artifactType:     { color: '#22d3ee', fontWeight: '900', fontSize: 10, width: 46 },
  artifactLabel:    { color: '#c8c3d2', fontSize: 12, flex: 1, lineHeight: 17 },
  artChip:          { borderWidth: 1, borderColor: '#272238', backgroundColor: '#12101c', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginRight: 6 },
  artChipActive:    { backgroundColor: '#1e1538', borderColor: '#a78bfa' },
  artChipText:      { color: '#8f899e', fontWeight: '700', fontSize: 11 },
  artChipTextActive:{ color: '#a78bfa' },
  input:            { backgroundColor: '#080611', borderColor: '#272238', borderWidth: 1, borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, marginTop: 8 },
  addArtBtn:        { backgroundColor: '#1e1538', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 6 },
  addArtBtnDisabled:{ opacity: 0.4 },
  addArtText:       { color: '#a78bfa', fontWeight: '800', fontSize: 12 },
  actions:          { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  advanceBtn:       { flex: 1, backgroundColor: '#6d28d9', borderRadius: 10, padding: 10, alignItems: 'center' },
  advanceBtnText:   { color: '#fff', fontWeight: '800', fontSize: 13 },
  blockBtn:         { borderWidth: 1, borderColor: '#fb718566', borderRadius: 10, paddingHorizontal: 14, padding: 10, alignItems: 'center' },
  blockBtnText:     { color: '#fb7185', fontWeight: '800', fontSize: 13 },
  removeBtn:        { borderWidth: 1, borderColor: '#272238', borderRadius: 10, paddingHorizontal: 14, padding: 10, alignItems: 'center' },
  removeBtnText:    { color: '#6b7280', fontWeight: '700', fontSize: 13 },
});
