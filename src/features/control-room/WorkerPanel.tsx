/**
 * src/features/control-room/WorkerPanel.tsx
 *
 * Founder-only Control Room panel for live Worker observability.
 *
 * Sub-panels:
 *   Health  — ping /health, show latency + Worker URL
 *   Fire    — manual test shot: pick character/surface, write userText,
 *             optionally set mood; renders full CompanionReply
 *   Threads — active thread-board pool view (read from ThreadBoardPanel store)
 *   History — last 20 session shots (in-memory, no persistence)
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  workerClient,
  WORKER_BASE_URL,
  type CharacterId,
  type CompanionReply,
  type Surface,
  type WorkerHealthResult,
} from '@/services/ai/workerClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubPanel = 'health' | 'fire' | 'threads' | 'history';

interface ShotRecord {
  id: string;
  ts: number;
  characterId: CharacterId;
  surface: Surface;
  userText: string;
  mood: string;
  latencyMs: number;
  result: CompanionReply | null;
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHARACTERS: CharacterId[] = [
  'raylene',
  'rylane',
  'cloud',
  'night',
  'sekret',
  'parentCoach',
];

const SURFACES: Surface[] = [
  'journal',
  'voiceBip',
  'comfort',
  'circle',
  'parentBridge',
  'selfDiscovery',
  'parentCoach',
];

const MAX_HISTORY = 20;

const C = {
  bg:        '#080611',
  surface:   '#0d0a15',
  border:    '#272238',
  purple:    '#6d28d9',
  purpleDim: '#3b1f6e',
  text:      '#e2dff0',
  muted:     '#8f899e',
  green:     '#22c55e',
  red:       '#ef4444',
  yellow:    '#eab308',
  teal:      '#14b8a6',
} as const;

// Status colors matching ThreadBoardPanel
const STATUS_COLOR: Record<string, string> = {
  planned:  '#6b7280',
  running:  '#a78bfa',
  review:   '#fbbf24',
  approved: '#4ade80',
  applied:  '#22d3ee',
  blocked:  '#fb7185',
};

const AGENT_EMOJI: Record<string, string> = {
  product: '📐', engineer: '⚙️', debugger: '🔬',
  analyst: '📊', growth: '🚀', support: '💬',
  deploy: '🛳️', coo: '🧭',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorkerPanel() {
  const [sub, setSub] = useState<SubPanel>('health');

  return (
    <View style={s.root}>
      <View style={s.subSwitcher}>
        {(['health', 'fire', 'threads', 'history'] as SubPanel[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[s.subBtn, sub === p && s.subBtnActive]}
            onPress={() => setSub(p)}
          >
            <Text style={[s.subLabel, sub === p && s.subLabelActive]}>
              {p === 'health'  ? '⚡ Health'
               : p === 'fire' ? '🎯 Fire'
               : p === 'threads' ? '🧵 Threads'
               : '📋 History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {sub === 'health'  && <HealthPanel />}
      {sub === 'fire'    && <FirePanel />}
      {sub === 'threads' && <ThreadsPanel />}
      {sub === 'history' && <HistoryPanel />}
    </View>
  );
}

// ─── Health panel ─────────────────────────────────────────────────────────────

function HealthPanel() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [result, setResult] = useState<WorkerHealthResult | null>(null);

  const ping = useCallback(async () => {
    setState('loading');
    const r = await workerClient.ping();
    setResult(r);
    setState('done');
  }, []);

  return (
    <ScrollView style={s.panel} contentContainerStyle={s.panelContent}>
      <Text style={s.sectionTitle}>Worker Health</Text>
      <Text style={s.urlText}>{WORKER_BASE_URL}</Text>

      <TouchableOpacity style={s.primaryBtn} onPress={ping} disabled={state === 'loading'}>
        {state === 'loading' ? (
          <ActivityIndicator color={C.text} size='small' />
        ) : (
          <Text style={s.primaryBtnText}>Ping Worker</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={s.resultCard}>
          <Row label='Status'>
            <Pill ok={result.ok} label={result.ok ? 'UP' : 'DOWN'} />
          </Row>
          <Row label='Latency'>
            <Text style={[s.value, { color: latencyColor(result.latencyMs) }]}>
              {result.latencyMs} ms
            </Text>
          </Row>
          {result.version && (
            <Row label='Version'>
              <Text style={s.value}>{result.version}</Text>
            </Row>
          )}
          <Row label='URL'>
            <Text style={[s.value, s.mono]} numberOfLines={1}>
              {result.url}
            </Text>
          </Row>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Threads panel ────────────────────────────────────────────────────────────
// Reads the same in-memory store used by ThreadBoardPanel so Worker can see
// the live thread pool without requiring a separate data source.

function ThreadsPanel() {
  const [, forceRender] = useState(0);
  const refresh = useCallback(() => forceRender((n) => n + 1), []);

  // Dynamic import of the shared store ref from ThreadBoardPanel
  // Since both panels live in the same JS runtime, we access the module-level
  // variable through a re-export. If the store is empty we show a prompt.
  let threads: Array<{
    id: string; title: string; agent: string; status: string;
    risk: string; artifacts: unknown[]; notes: string;
  }> = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const boardModule = require('./ThreadBoardPanel');
    // The store is not directly exported; read via a getter if available.
    // In practice, integrate via a shared context/store (Zustand, Jotai) in
    // production. For now, this panel shows a mirror view.
    threads = boardModule._getThreads?.() ?? [];
  } catch {
    threads = [];
  }

  const active   = threads.filter((t) => !['applied', 'blocked'].includes(t.status));
  const blocked  = threads.filter((t) => t.status === 'blocked');
  const review   = threads.filter((t) => t.status === 'review');

  return (
    <ScrollView style={s.panel} contentContainerStyle={s.panelContent}>
      <View style={s.historyHeader}>
        <Text style={s.sectionTitle}>Thread Pool ({threads.length} total)</Text>
        <TouchableOpacity onPress={refresh}>
          <Text style={s.refreshBtn}>↻</Text>
        </TouchableOpacity>
      </View>

      {threads.length === 0 && (
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>No threads spawned yet</Text>
          <Text style={[s.urlText, { textAlign: 'center' }]}>
            Open the Board tab → write a founder brief → confirm the plan to spawn threads.
          </Text>
        </View>
      )}

      {review.length > 0 && (
        <>
          <Text style={[s.fieldLabel, { color: '#fbbf24' }]}>⚠ Awaiting review ({review.length})</Text>
          {review.map((t) => <ThreadRow key={t.id} thread={t} />)}
        </>
      )}

      {blocked.length > 0 && (
        <>
          <Text style={[s.fieldLabel, { color: '#fb7185' }]}>Blocked ({blocked.length})</Text>
          {blocked.map((t) => <ThreadRow key={t.id} thread={t} />)}
        </>
      )}

      {active.length > 0 && (
        <>
          <Text style={s.fieldLabel}>Active ({active.length})</Text>
          {active.filter((t) => t.status !== 'review').map((t) => <ThreadRow key={t.id} thread={t} />)}
        </>
      )}
    </ScrollView>
  );
}

function ThreadRow({ thread }: { thread: { id: string; title: string; agent: string; status: string; risk: string; artifacts: unknown[]; notes: string } }) {
  const col = STATUS_COLOR[thread.status] ?? '#6b7280';
  return (
    <View style={s.threadRow}>
      <View style={s.threadLeft}>
        <Text style={s.threadAgent}>{AGENT_EMOJI[thread.agent] ?? '•'} {thread.agent}</Text>
        <Text style={s.threadTitle} numberOfLines={1}>{thread.title}</Text>
        <Text style={s.threadNotes} numberOfLines={1}>{thread.notes}</Text>
      </View>
      <View style={[s.threadStatusPill, { backgroundColor: col + '22' }]}>
        <Text style={[s.threadStatusText, { color: col }]}>{thread.status}</Text>
      </View>
    </View>
  );
}

// ─── Fire panel ───────────────────────────────────────────────────────────────

const shotHistory: ShotRecord[] = [];
let shotCounter = 0;

function FirePanel() {
  const [characterId, setCharacterId] = useState<CharacterId>('raylene');
  const [surface, setSurface] = useState<Surface>('journal');
  const [userText, setUserText] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastShot, setLastShot] = useState<ShotRecord | null>(null);

  const fire = useCallback(async () => {
    const text = userText.trim();
    if (!text) return;
    setLoading(true);
    const start = Date.now();
    let result: CompanionReply | null = null;
    let error: string | null = null;

    try {
      result = await workerClient.sendReply({
        characterId,
        surface,
        userText: text,
        mood: mood.trim() || undefined,
      });
    } catch (err) {
      error = (err as Error).message;
    }

    const record: ShotRecord = {
      id: String(++shotCounter),
      ts: Date.now(),
      characterId,
      surface,
      userText: text,
      mood: mood.trim(),
      latencyMs: Date.now() - start,
      result,
      error,
    };

    shotHistory.unshift(record);
    if (shotHistory.length > MAX_HISTORY) shotHistory.length = MAX_HISTORY;
    setLastShot(record);
    setLoading(false);
  }, [characterId, surface, userText, mood]);

  return (
    <ScrollView style={s.panel} contentContainerStyle={s.panelContent} keyboardShouldPersistTaps='handled'>
      <Text style={s.sectionTitle}>Fire Test Shot</Text>

      <Text style={s.fieldLabel}>Character</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {CHARACTERS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[s.chip, characterId === c && s.chipActive]}
            onPress={() => setCharacterId(c)}
          >
            <Text style={[s.chipText, characterId === c && s.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.fieldLabel}>Surface</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {SURFACES.map((sv) => (
          <TouchableOpacity
            key={sv}
            style={[s.chip, surface === sv && s.chipActive]}
            onPress={() => setSurface(sv)}
          >
            <Text style={[s.chipText, surface === sv && s.chipTextActive]}>{sv}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.fieldLabel}>Mood (optional)</Text>
      <TextInput
        style={s.input}
        placeholder='e.g. anxious'
        placeholderTextColor={C.muted}
        value={mood}
        onChangeText={setMood}
      />

      <Text style={s.fieldLabel}>User message</Text>
      <TextInput
        style={[s.input, s.inputTall]}
        placeholder='What the teen sends…'
        placeholderTextColor={C.muted}
        value={userText}
        onChangeText={setUserText}
        multiline
      />

      <TouchableOpacity
        style={[s.primaryBtn, (!userText.trim() || loading) && s.primaryBtnDisabled]}
        onPress={fire}
        disabled={!userText.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color={C.text} size='small' />
        ) : (
          <Text style={s.primaryBtnText}>Fire →</Text>
        )}
      </TouchableOpacity>

      {lastShot && <ShotCard shot={lastShot} expanded />}
    </ScrollView>
  );
}

// ─── History panel ────────────────────────────────────────────────────────────

function HistoryPanel() {
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  return (
    <ScrollView style={s.panel} contentContainerStyle={s.panelContent}>
      <View style={s.historyHeader}>
        <Text style={s.sectionTitle}>Shot History ({shotHistory.length}/{MAX_HISTORY})</Text>
        <TouchableOpacity onPress={refresh}>
          <Text style={s.refreshBtn}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
      {shotHistory.length === 0 && (
        <Text style={s.emptyText}>No shots fired this session.</Text>
      )}
      {shotHistory.map((shot) => (
        <ShotCard key={shot.id} shot={shot} />
      ))}
    </ScrollView>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ShotCard({ shot, expanded = false }: { shot: ShotRecord; expanded?: boolean }) {
  const [open, setOpen] = useState(expanded);
  const ts = new Date(shot.ts).toLocaleTimeString();

  return (
    <TouchableOpacity style={s.shotCard} onPress={() => setOpen((v) => !v)} activeOpacity={0.8}>
      <View style={s.shotCardHeader}>
        <Text style={s.shotMeta}>
          {ts} · <Text style={{ color: C.purple }}>{shot.characterId}</Text> / {shot.surface}
        </Text>
        <View style={s.shotBadges}>
          {shot.error ? (
            <Pill ok={false} label='ERR' />
          ) : (
            <>
              <Pill ok={!shot.result?.safetyFlag} label={shot.result?.safetyFlag ? 'SAFETY' : 'OK'} />
              <Text style={[s.value, { color: latencyColor(shot.latencyMs), marginLeft: 6 }]}>
                {shot.latencyMs}ms
              </Text>
            </>
          )}
        </View>
      </View>

      <Text style={s.shotUserText} numberOfLines={open ? undefined : 1}>
        → {shot.userText}
      </Text>

      {open && (
        <View style={s.shotDetail}>
          {shot.error ? (
            <Text style={[s.mono, { color: C.red }]}>{shot.error}</Text>
          ) : shot.result ? (
            <>
              <Row label='reply'>
                <Text style={[s.value, s.replyText]}>{shot.result.reply}</Text>
              </Row>
              <Row label='tone'>
                <Text style={[s.value, { color: C.teal }]}>{shot.result.tone}</Text>
              </Row>
              <Row label='source'>
                <Text style={[s.value, { color: shot.result.replySource === 'openai' ? C.green : C.yellow }]}>
                  {shot.result.replySource}
                </Text>
              </Row>
              {shot.result.suggestedComfortTool && (
                <Row label='comfortTool'>
                  <Text style={s.value}>{shot.result.suggestedComfortTool}</Text>
                </Row>
              )}
              {shot.result.parentShareSummary && (
                <Row label='parentSummary'>
                  <Text style={s.value}>{shot.result.parentShareSummary}</Text>
                </Row>
              )}
            </>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowValue}>{children}</View>
    </View>
  );
}

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={[s.pill, { backgroundColor: ok ? C.green + '22' : C.red + '22' }]}>
      <Text style={[s.pillText, { color: ok ? C.green : C.red }]}>{label}</Text>
    </View>
  );
}

function latencyColor(ms: number): string {
  if (ms < 800)  return C.green;
  if (ms < 2500) return C.yellow;
  return C.red;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  subSwitcher: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  subBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  subBtnActive: { backgroundColor: C.purple, borderColor: C.purple },
  subLabel: { color: C.muted, fontWeight: '700', fontSize: 11 },
  subLabelActive: { color: '#fff' },

  panel: { flex: 1 },
  panelContent: { padding: 16, paddingBottom: 48 },

  sectionTitle: { color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 4 },
  urlText: { color: C.muted, fontSize: 11, marginBottom: 16, fontFamily: 'monospace' },

  primaryBtn: {
    backgroundColor: C.purple,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  resultCard: {
    marginTop: 16,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },

  fieldLabel: { color: C.muted, fontSize: 11, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 6,
  },
  chipActive: { backgroundColor: C.purpleDim, borderColor: C.purple },
  chipText: { color: C.muted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  input: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.text,
    fontSize: 14,
  },
  inputTall: { minHeight: 80, textAlignVertical: 'top' },

  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refreshBtn: { color: C.purple, fontWeight: '700', fontSize: 13 },
  emptyText: { color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 32 },
  emptyState: { alignItems: 'center', paddingTop: 32, gap: 8 },
  emptyTitle: { color: C.text, fontWeight: '800', fontSize: 15 },

  // Thread rows
  threadRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8, gap: 10 },
  threadLeft: { flex: 1, gap: 2 },
  threadAgent: { color: '#c4b5fd', fontWeight: '800', fontSize: 11 },
  threadTitle: { color: C.text, fontWeight: '700', fontSize: 13 },
  threadNotes: { color: C.muted, fontSize: 11 },
  threadStatusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  threadStatusText: { fontSize: 10, fontWeight: '900' },

  shotCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 10,
  },
  shotCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  shotMeta: { color: C.muted, fontSize: 11 },
  shotBadges: { flexDirection: 'row', alignItems: 'center' },
  shotUserText: { color: C.text, fontSize: 13, marginTop: 2 },
  shotDetail: { marginTop: 10, gap: 8 },

  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  rowLabel: { color: C.muted, fontSize: 11, fontWeight: '700', width: 100, paddingTop: 2 },
  rowValue: { flex: 1 },
  value: { color: C.text, fontSize: 13 },
  replyText: { lineHeight: 20 },
  mono: { fontFamily: 'monospace', fontSize: 12 },

  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '800' },
});
