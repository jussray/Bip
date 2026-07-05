import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { BridgeSummaryListItem } from '@/types/bridgeSummary';
import {
  fetchParentBridgeSummaryInbox,
  markBridgeSummaryViewed,
} from '@/services/parentBridgeSummaryService';

interface ParentBridgeSummaryInboxProps {
  audience?: 'founder' | 'internal' | 'beta' | 'public';
}

export function ParentBridgeSummaryInbox({ audience = 'public' }: ParentBridgeSummaryInboxProps) {
  const [items, setItems] = useState<BridgeSummaryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchParentBridgeSummaryInbox(audience);
    if (result.ok) {
      setItems(result.value);
      setMessage(null);
    } else {
      setItems([]);
      setMessage(result.message);
    }
    setLoading(false);
  }, [audience]);

  useEffect(() => {
    void load();
  }, [load]);

  const markViewed = useCallback(async (item: BridgeSummaryListItem) => {
    if (item.viewedAt) return;
    const result = await markBridgeSummaryViewed(item.summaryId, audience);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setItems((current) => current.map((entry) => (
      entry.summaryId === item.summaryId
        ? { ...entry, viewedAt: new Date().toISOString() }
        : entry
    )));
  }, [audience]);

  if (loading) {
    return (
      <View style={styles.stateCard} accessibilityLabel="Loading Bridge summaries">
        <ActivityIndicator />
        <Text style={styles.stateText}>Loading Bridge summaries…</Text>
      </View>
    );
  }

  if (message) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateText}>{message}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.emptyTitle}>No Bridge Summaries yet</Text>
        <Text style={styles.stateText}>Only summaries your teen deliberately shares will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.summaryId}
          style={styles.card}
          activeOpacity={0.86}
          onPress={() => void markViewed(item)}
          accessibilityRole="button"
          accessibilityLabel={`Bridge Summary from ${new Date(item.generatedAt).toLocaleDateString()}`}
        >
          <View style={styles.headerRow}>
            <Text style={styles.cardTitle}>Bridge Summary</Text>
            {!item.viewedAt && <Text style={styles.newBadge}>New</Text>}
          </View>

          <Text style={styles.dateText}>
            {new Date(item.generatedAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </Text>

          <Text style={styles.sectionLabel}>Themes noticed</Text>
          {item.summary.themes.map((theme) => (
            <Text key={theme} style={styles.bodyText}>• {theme}</Text>
          ))}

          <Text style={styles.sectionLabel}>Conversation starters</Text>
          {item.summary.conversationStarters.map((starter) => (
            <Text key={starter} style={styles.bodyText}>• {starter}</Text>
          ))}

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{item.summary.limitations}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: {
    backgroundColor: 'rgba(46,26,16,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(233,160,74,0.35)',
    borderRadius: 18,
    padding: 16,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#f5e8c8', fontSize: 18, fontWeight: '700' },
  newBadge: {
    color: '#2e1a10',
    backgroundColor: '#e9a04a',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: { color: 'rgba(245,232,200,0.65)', marginTop: 4, marginBottom: 14 },
  sectionLabel: { color: '#e9a04a', fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 5 },
  bodyText: { color: '#f5e8c8', lineHeight: 21, marginBottom: 3 },
  noticeBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(233,160,74,0.10)',
  },
  noticeText: { color: 'rgba(245,232,200,0.78)', fontSize: 12, lineHeight: 18 },
  stateCard: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(233,160,74,0.25)',
    padding: 20,
  },
  emptyTitle: { color: '#f5e8c8', fontSize: 17, fontWeight: '700' },
  stateText: { color: 'rgba(245,232,200,0.72)', textAlign: 'center', lineHeight: 20 },
});
