/**
 * src/features/control-room/workspace/ThreadBoard.tsx
 *
 * Replit-style Founder Thread Board.
 *
 * Columns: Draft → Planned → Running → Review → Blocked → Approved → Applied
 *
 * Each column shows ThreadCards; blocked threads use the specialised
 * BlockedThreadCard. Tapping a card opens ThreadDetailPane as an overlay.
 *
 * Data: seeded from SEED_THREADS (real repo state). In production this
 * will be replaced with a Supabase realtime subscription once the
 * event-inbox schema (PR #481/#482) is merged.
 *
 * This panel registers itself under the 'board' sub-panel key so it
 * can be added to the existing Control Room tab switcher.
 */

import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BOARD_COLUMNS, SEED_THREADS } from './types';
import type { Thread } from './types';
import BlockedThreadCard from './BlockedThreadCard';
import ThreadDetailPane from './ThreadDetailPane';
import PRDependencyRail from './PRDependencyRail';

const C = {
  bg: '#080611',
  surface: '#0d0a15',
  surface2: '#110e1c',
  border: '#272238',
  purple: '#6d28d9',
  purpleDim: '#3b1f6e',
  text: '#e2dff0',
  muted: '#8f899e',
  faint: '#4a4660',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  orange: '#f97316',
  teal: '#14b8a6',
} as const;

// Canonical PR dependency chain for the merge-order rail
const DEPENDENCY_CHAIN = [
  { prNumber: 481, title: 'Postgres event schema', status: 'draft' as const,  url: 'https://github.com/jussray/Sekret-Bip/pull/481' },
  { prNumber: 482, title: 'Event inbox controller', status: 'open' as const,  url: 'https://github.com/jussray/Sekret-Bip/pull/482' },
  { prNumber: 490, title: 'Approval gate flow',    status: 'draft' as const,  url: 'https://github.com/jussray/Sekret-Bip/pull/490' },
  { prNumber: 480, title: 'CI failure routing',    status: 'draft' as const,  url: 'https://github.com/jussray/Sekret-Bip/pull/480' },
];

export default function ThreadBoard() {
  const [threads, setThreads] = useState<Thread[]>(SEED_THREADS);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const threadsForStatus = (status: string) =>
    threads.filter(t => t.status === status);

  const handleApprove = (threadId: string) => {
    setThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, status: 'approved' as const, updatedAt: Date.now() } : t
    ));
    setSelectedThread(null);
  };

  const handleHold = (threadId: string) => {
    setThreads(prev => prev.map(t =>
      t.id === threadId
        ? { ...t, status: 'blocked' as const, blockReason: 'manual_hold' as const, updatedAt: Date.now() }
        : t
    ));
    setSelectedThread(null);
  };

  const handleReject = (threadId: string) => {
    setThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, status: 'failed' as const, updatedAt: Date.now() } : t
    ));
    setSelectedThread(null);
  };

  return (
    <View style={s.root}>
      {/* Merge-order dependency rail — always visible at top */}
      <View style={s.railContainer}>
        <PRDependencyRail chain={DEPENDENCY_CHAIN} label='PR MERGE ORDER' />
      </View>

      {/* Column filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.colTabs}
        contentContainerStyle={s.colTabsContent}
      >
        <TouchableOpacity
          style={[s.colTab, activeColumn === null && s.colTabActive]}
          onPress={() => setActiveColumn(null)}
        >
          <Text style={[s.colTabText, activeColumn === null && s.colTabTextActive]}>All</Text>
        </TouchableOpacity>
        {BOARD_COLUMNS.map(col => {
          const count = threadsForStatus(col.status).length;
          if (count === 0) return null;
          return (
            <TouchableOpacity
              key={col.status}
              style={[s.colTab, activeColumn === col.status && s.colTabActive]}
              onPress={() => setActiveColumn(col.status)}
            >
              <Text style={[s.colTabText, activeColumn === col.status && s.colTabTextActive]}>
                {col.emoji} {col.label}
              </Text>
              <View style={s.colCount}>
                <Text style={s.colCountText}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Thread list */}
      <ScrollView style={s.list} contentContainerStyle={s.listContent}>
        {BOARD_COLUMNS
          .filter(col => activeColumn === null || activeColumn === col.status)
          .map(col => {
            const colThreads = threadsForStatus(col.status);
            if (colThreads.length === 0) return null;
            return (
              <View key={col.status} style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionEmoji}>{col.emoji}</Text>
                  <Text style={s.sectionTitle}>{col.label.toUpperCase()}</Text>
                  <View style={s.sectionCount}>
                    <Text style={s.sectionCountText}>{colThreads.length}</Text>
                  </View>
                </View>
                {colThreads.map(thread =>
                  thread.status === 'blocked' || thread.status === 'failed' ? (
                    <BlockedThreadCard
                      key={thread.id}
                      thread={thread}
                      onViewDetail={setSelectedThread}
                    />
                  ) : (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onPress={() => setSelectedThread(thread)}
                    />
                  )
                )}
              </View>
            );
          })
        }
      </ScrollView>

      {/* Detail pane modal */}
      <Modal
        visible={selectedThread !== null}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setSelectedThread(null)}
      >
        {selectedThread && (
          <ThreadDetailPane
            thread={selectedThread}
            onClose={() => setSelectedThread(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onHold={handleHold}
          />
        )}
      </Modal>
    </View>
  );
}

// ─── Generic thread card ──────────────────────────────────────────────────────

function ThreadCard({ thread, onPress }: { thread: Thread; onPress: () => void }) {
  const statusColors: Record<string, string> = {
    draft: C.faint, planned: C.teal, running: C.purple,
    review: C.yellow, approved: C.green, applied: C.green,
  };
  const dotColor = statusColors[thread.status] ?? C.muted;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardHeader}>
        <View style={[s.dot, { backgroundColor: dotColor }]} />
        <Text style={s.cardTitle} numberOfLines={1}>{thread.title}</Text>
        <Text style={[s.cardDomain, { color: C.purple }]}>{thread.domain}</Text>
      </View>
      <Text style={s.cardBrief} numberOfLines={2}>{thread.brief}</Text>
      {thread.artifacts.length > 0 && (
        <Text style={s.cardArtifacts}>
          🔀 {thread.artifacts.length} artifact{thread.artifacts.length > 1 ? 's' : ''}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  railContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingBottom: 10,
  },

  colTabs: { maxHeight: 44, borderBottomWidth: 1, borderColor: C.border },
  colTabsContent: { paddingHorizontal: 12, gap: 6, alignItems: 'center', paddingVertical: 6 },
  colTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  colTabActive: { backgroundColor: C.purple, borderColor: C.purple },
  colTabText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  colTabTextActive: { color: '#fff' },
  colCount: {
    backgroundColor: C.purpleDim,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  colCountText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  list: { flex: 1 },
  listContent: { padding: 14, paddingBottom: 40, gap: 16 },

  section: { gap: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  sectionEmoji: { fontSize: 14 },
  sectionTitle: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, flex: 1 },
  sectionCount: {
    backgroundColor: C.surface,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionCountText: { color: C.muted, fontSize: 9, fontWeight: '700' },

  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 999 },
  cardTitle: { color: C.text, fontWeight: '700', fontSize: 13, flex: 1 },
  cardDomain: { fontSize: 10, fontWeight: '700' },
  cardBrief: { color: C.muted, fontSize: 12, lineHeight: 17 },
  cardArtifacts: { color: C.faint, fontSize: 11 },
});
