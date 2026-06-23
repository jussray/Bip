// app/(teen)/pages/history.tsx
// SE'KRET PAGES — Full Entry Library
// Searchable, filterable by companion, pinned entries float to top.

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import type { JournalEntry } from '@/types';

const COMPANION_META: Record<string, { label: string; accent: string; emoji: string }> = {
  raylene: { label: 'Raylene', accent: '#f08bc5', emoji: '💜' },
  rylane:  { label: 'Rylane',  accent: '#76a7ff', emoji: '⚡' },
  cloud:   { label: 'Cloud',   accent: '#8ed9e7', emoji: '☁️' },
  night:   { label: 'Night',   accent: '#9a8ee8', emoji: '🌙' },
  me:      { label: 'Me',      accent: '#b8a9c9', emoji: '🪞' },
  oracle:  { label: 'Oracle',  accent: '#c7b87a', emoji: '🔮' },
};

const FILTER_ALL = 'all';
const FILTERS = [FILTER_ALL, 'raylene', 'rylane', 'cloud', 'night', 'me', 'oracle'] as const;
type FilterKey = (typeof FILTERS)[number];

export default function PagesHistoryRoute() {
  const { entries } = useAppContext();
  const [filter, setFilter] = useState<FilterKey>(FILTER_ALL);
  const [query, setQuery] = useState('');

  const displayEntries = useMemo(() => {
    let list = entries as JournalEntry[];

    if (filter !== FILTER_ALL) {
      list = list.filter(e => (e.activeTab || e.source) === filter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(e =>
        e.text.toLowerCase().includes(q) ||
        (e.moodTag ?? '').toLowerCase().includes(q) ||
        (e.sekretReply ?? '').toLowerCase().includes(q),
      );
    }

    // Pinned first, then newest first within each group
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return Number(b.id) - Number(a.id);
    });
  }, [entries, filter, query]);

  function renderCard({ item }: { item: JournalEntry }) {
    const companion = COMPANION_META[(item.activeTab || item.source) ?? ''] ?? {
      label: 'Pages',
      accent: '#b8a9c9',
      emoji: '📄',
    };
    const snippet = item.text.length > 80 ? `${item.text.slice(0, 80)}…` : item.text;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/(teen)/pages/${item.id}` as any)}
        activeOpacity={0.75}
      >
        {item.pinned ? <Text style={s.pinIndicator}>📌</Text> : null}
        <View style={s.cardHeader}>
          <View style={[s.companionBadge, { backgroundColor: `${companion.accent}20`, borderColor: `${companion.accent}40` }]}>
            <Text style={s.companionEmoji}>{companion.emoji}</Text>
            <Text style={[s.companionLabel, { color: companion.accent }]}>{companion.label}</Text>
          </View>
          <Text style={s.cardDate}>{item.date}</Text>
        </View>

        {snippet ? (
          <Text style={s.cardSnippet} numberOfLines={3}>{snippet}</Text>
        ) : (
          <Text style={s.cardSnippetMuted}>{item.imageUri ? '📷 Photo attached' : '(no text)'}</Text>
        )}

        <View style={s.cardFooter}>
          {item.moodTag ? (
            <Text style={[s.cardMoodTag, { color: companion.accent }]}>#{item.moodTag}</Text>
          ) : null}
          {item.locked ? <Text style={s.cardIcon}>🔒</Text> : null}
          {item.imageUri ? <Text style={s.cardIcon}>🖼️</Text> : null}
          {item.sekretReply ? <Text style={s.cardIcon}>💬</Text> : null}
          <Text style={s.cardTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#10091b', '#171024', '#090711']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.kicker}>SE'KRET PAGES</Text>
            <Text style={s.title}>All Entries</Text>
          </View>
          <Text style={s.countBadge}>{displayEntries.length}</Text>
        </View>

        {/* Search bar */}
        <View style={s.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="search your pages…"
            placeholderTextColor="#6b607a"
            style={s.searchInput}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Companion filter chips */}
        <View style={s.filterRow}>
          {FILTERS.map(f => {
            const meta = f === FILTER_ALL ? null : COMPANION_META[f];
            const active = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  s.filterChip,
                  active && {
                    borderColor: meta?.accent ?? '#ffffff60',
                    backgroundColor: `${meta?.accent ?? '#ffffff'}18`,
                  },
                ]}
              >
                {meta ? <Text style={s.filterEmoji}>{meta.emoji}</Text> : null}
                <Text style={[s.filterLabel, active && { color: meta?.accent ?? '#fff' }]}>
                  {f === FILTER_ALL ? 'All' : meta?.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Entry list */}
        <FlatList
          data={displayEntries}
          keyExtractor={e => String(e.id)}
          renderItem={renderCard}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>📄</Text>
              <Text style={s.emptyTitle}>
                {query ? 'No entries match your search' : 'Nothing here yet'}
              </Text>
              <Text style={s.emptyBody}>
                {query ? 'Try different words or clear the filter.' : 'Start writing in Se\'kret Pages.'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  kicker: { color: '#c7b87a', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  countBadge: { marginLeft: 'auto', color: '#6b607a', fontSize: 13, fontWeight: '700' },

  searchWrap: { paddingHorizontal: 14, marginBottom: 10 },
  searchInput: { color: '#f0eaf4', fontSize: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 10 },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, marginBottom: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, borderWidth: 1, borderColor: '#ffffff16', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 5 },
  filterEmoji: { fontSize: 11 },
  filterLabel: { color: '#7a6e83', fontSize: 11, fontWeight: '700' },

  list: { paddingHorizontal: 14, paddingBottom: 40 },

  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, marginBottom: 10, position: 'relative' },
  pinIndicator: { position: 'absolute', top: 10, right: 12, fontSize: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  companionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  companionEmoji: { fontSize: 11 },
  companionLabel: { fontSize: 10, fontWeight: '800' },
  cardDate: { color: '#6b607a', fontSize: 10 },
  cardSnippet: { color: '#cfc5d5', fontSize: 13, lineHeight: 20, marginBottom: 8 },
  cardSnippetMuted: { color: '#6b607a', fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardMoodTag: { fontSize: 10, fontWeight: '800' },
  cardIcon: { fontSize: 11 },
  cardTime: { color: '#504660', fontSize: 9, marginLeft: 'auto' },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { color: '#a99fb2', fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  emptyBody: { color: '#6b607a', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
