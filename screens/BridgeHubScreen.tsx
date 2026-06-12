// screens/BridgeHubScreen.tsx
// Bridge hub — teen-side entry point for the full bridge feature set.
// Four sections: Se'krets2Tell nav card, Shared Messages, Parent Responses, Bridge History.
// Everything teen chose to share lives here. Nothing is auto-sent.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { createStyles } from '../constants/styles';
import type { S2TellEntry } from './S2TellScreen';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParentResponse {
  id:           string;
  text:         string;
  respondedAt:  string;
}

type TimelineItem =
  | { kind: 'shared';   entry:    S2TellEntry    }
  | { kind: 'response'; response: ParentResponse };

interface BridgeHubScreenProps {
  t:               Record<string, any>;
  setScreen:       (screen: string) => void;
  BottomNav:       React.ReactNode;
  selectedSekret?: string;
  mood?:           string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TONE_EMOJI: Record<string, string> = {
  soft:      '🌙',
  honest:    '💜',
  boundary:  '🛡️',
  idontknow: '☁️',
};

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BridgeHubScreen({
  t, setScreen, BottomNav,
}: BridgeHubScreenProps) {
  const styles = createStyles(t as {
    background: string; card: string; accent: string; soft: string; [key: string]: string;
  });

  const [sharedEntries,   setSharedEntries]   = useState<S2TellEntry[]>([]);
  const [parentResponses, setParentResponses] = useState<ParentResponse[]>([]);
  const [expanded, setExpanded] =
    useState<'shared' | 'responses' | 'history' | null>(null);

  // Entrance animations — individual refs (hooks must be at the top level)
  const a0 = useRef(new Animated.Value(0)).current;
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;
  const a4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    Animated.stagger(90, [a0, a1, a2, a3, a4].map((a: Animated.Value) =>
      Animated.timing(a, { toValue: 1, duration: 380, easing: ease, useNativeDriver: true })
    )).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('s2tell_history');
        const history: S2TellEntry[] = raw ? JSON.parse(raw) : [];
        setSharedEntries(history.filter((e: S2TellEntry) => e.shared));
      } catch {}

      try {
        const raw = await AsyncStorage.getItem('parent_bridge_responses');
        const responses: ParentResponse[] = raw ? JSON.parse(raw) : [];
        setParentResponses(responses);
      } catch {}
    })();
  }, []);

  const slide = (a: Animated.Value) => ({
    opacity: a,
    transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  const toggle = (section: 'shared' | 'responses' | 'history') =>
    setExpanded((prev: 'shared' | 'responses' | 'history' | null) =>
      prev === section ? null : section
    );

  // Combined chronological timeline
  const sharedItems: TimelineItem[] = sharedEntries.map(
    (e: S2TellEntry) => ({ kind: 'shared' as const, entry: e })
  );
  const responseItems: TimelineItem[] = parentResponses.map(
    (r: ParentResponse) => ({ kind: 'response' as const, response: r })
  );
  const timeline: TimelineItem[] = [...sharedItems, ...responseItems].sort(
    (a: TimelineItem, b: TimelineItem) => {
      const da = a.kind === 'shared' ? a.entry.savedAt    : a.response.respondedAt;
      const db = b.kind === 'shared' ? b.entry.savedAt    : b.response.respondedAt;
      return new Date(db).getTime() - new Date(da).getTime();
    }
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <LinearGradient
        colors={[t.background, t.card + 'cc', t.background]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 28 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <Animated.View style={slide(a0)}>
          <Text style={[styles.logo, local.title]}>Bridge 🌉</Text>
          <Text style={[styles.subtitle, local.subtitle]}>
            Your space to say the hard things. On your terms.
          </Text>
        </Animated.View>

        {/* ── 1. Se'krets2Tell ─── featured nav card ─────────────────────── */}
        <Animated.View style={slide(a1)}>
          <TouchableOpacity
            style={[local.hubCard, local.featuredCard, {
              backgroundColor: t.accent + '22',
              borderColor:     t.accent + '99',
            }]}
            onPress={() => setScreen('s2tell')}
            accessibilityRole="button"
          >
            <View style={local.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[local.cardTitle, { color: '#fff' }]}>Se'krets2Tell 💌</Text>
                <Text style={[local.cardDesc, { color: t.soft + 'cc' }]}>
                  Write it raw. Se'kret helps you say it.{'\n'}You choose what gets shared.
                </Text>
              </View>
              <Text style={[local.chevron, { color: t.accent }]}>›</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── 2. Shared Messages ─── accordion ──────────────────────────── */}
        <Animated.View style={slide(a2)}>
          <TouchableOpacity
            style={[local.hubCard, {
              backgroundColor: t.card,
              borderColor:     t.accent + '44',
            }]}
            onPress={() => toggle('shared')}
            accessibilityRole="button"
          >
            <View style={local.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[local.cardTitle, { color: '#fff' }]}>Shared Messages</Text>
                <Text style={[local.cardDesc, { color: t.soft + '88' }]}>
                  Things you chose to share
                </Text>
              </View>
              <View style={local.cardRight}>
                {sharedEntries.length > 0 && (
                  <View style={[local.badge, { backgroundColor: t.accent }]}>
                    <Text style={local.badgeText}>{sharedEntries.length}</Text>
                  </View>
                )}
                <Text style={[local.toggle, { color: t.soft + '88' }]}>
                  {expanded === 'shared' ? '▲' : '▼'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {expanded === 'shared' && (
            <View style={[local.expandBody, {
              backgroundColor: t.card + 'cc',
              borderColor:     t.accent + '33',
            }]}>
              {sharedEntries.length === 0 ? (
                <Text style={[local.emptyText, { color: t.soft + '66' }]}>
                  Nothing shared yet. That's okay. 💜
                </Text>
              ) : sharedEntries.map((entry: S2TellEntry) => (
                <View key={entry.id} style={[local.entryItem, { borderBottomColor: t.accent + '22' }]}>
                  <View style={local.entryMeta}>
                    <Text style={local.entryWho}>
                      {TONE_EMOJI[entry.tone] || '💜'} {entry.tone}
                    </Text>
                    <Text style={[local.entryDate, { color: t.soft + '55' }]}>
                      {fmtDate(entry.savedAt)}
                    </Text>
                  </View>
                  <Text style={[local.entryText, { color: '#fff' }]}>{entry.rewrite}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── 3. Parent Responses ─── accordion ─────────────────────────── */}
        <Animated.View style={slide(a3)}>
          <TouchableOpacity
            style={[local.hubCard, {
              backgroundColor: t.card,
              borderColor:     t.accent + '44',
            }]}
            onPress={() => toggle('responses')}
            accessibilityRole="button"
          >
            <View style={local.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[local.cardTitle, { color: '#fff' }]}>Parent Responses</Text>
                <Text style={[local.cardDesc, { color: t.soft + '88' }]}>
                  Video and text replies from your parent
                </Text>
              </View>
              <View style={local.cardRight}>
                {parentResponses.length > 0 && (
                  <View style={[local.badge, { backgroundColor: t.accent }]}>
                    <Text style={local.badgeText}>{parentResponses.length}</Text>
                  </View>
                )}
                <Text style={[local.toggle, { color: t.soft + '88' }]}>
                  {expanded === 'responses' ? '▲' : '▼'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {expanded === 'responses' && (
            <View style={[local.expandBody, {
              backgroundColor: t.card + 'cc',
              borderColor:     t.accent + '33',
            }]}>
              {parentResponses.length === 0 ? (
                <Text style={[local.emptyText, { color: t.soft + '66' }]}>
                  No responses yet. They'll show up here when your parent replies. 💜
                </Text>
              ) : parentResponses.map((r: ParentResponse) => (
                <View key={r.id} style={[local.entryItem, { borderBottomColor: t.accent + '22' }]}>
                  <View style={local.entryMeta}>
                    <Text style={local.entryWho}>🧡 Parent</Text>
                    <Text style={[local.entryDate, { color: t.soft + '55' }]}>
                      {fmtDate(r.respondedAt)}
                    </Text>
                  </View>
                  <Text style={[local.entryText, { color: '#fff' }]}>{r.text}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── 4. Bridge History ─── accordion ───────────────────────────── */}
        <Animated.View style={slide(a4)}>
          <TouchableOpacity
            style={[local.hubCard, {
              backgroundColor: t.card,
              borderColor:     t.accent + '44',
            }]}
            onPress={() => toggle('history')}
            accessibilityRole="button"
          >
            <View style={local.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[local.cardTitle, { color: '#fff' }]}>Bridge History</Text>
                <Text style={[local.cardDesc, { color: t.soft + '88' }]}>
                  Previous shared conversations
                </Text>
              </View>
              <View style={local.cardRight}>
                {timeline.length > 0 && (
                  <View style={[local.badge, { backgroundColor: t.accent + 'cc' }]}>
                    <Text style={local.badgeText}>{timeline.length}</Text>
                  </View>
                )}
                <Text style={[local.toggle, { color: t.soft + '88' }]}>
                  {expanded === 'history' ? '▲' : '▼'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {expanded === 'history' && (
            <View style={[local.expandBody, {
              backgroundColor: t.card + 'cc',
              borderColor:     t.accent + '33',
            }]}>
              {timeline.length === 0 ? (
                <Text style={[local.emptyText, { color: t.soft + '66' }]}>
                  Your bridge conversations will appear here. 🌉
                </Text>
              ) : timeline.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    local.entryItem,
                    { borderBottomColor: t.accent + '22' },
                    idx === timeline.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  {item.kind === 'shared' ? (
                    <>
                      <View style={local.entryMeta}>
                        <Text style={local.entryWho}>
                          {TONE_EMOJI[item.entry.tone] || '💜'} You
                        </Text>
                        <Text style={[local.entryDate, { color: t.soft + '55' }]}>
                          {fmtDate(item.entry.savedAt)}
                        </Text>
                      </View>
                      <Text style={[local.entryText, { color: '#fff' }]}>
                        {item.entry.rewrite}
                      </Text>
                    </>
                  ) : (
                    <>
                      <View style={local.entryMeta}>
                        <Text style={local.entryWho}>🧡 Parent</Text>
                        <Text style={[local.entryDate, { color: t.soft + '55' }]}>
                          {fmtDate(item.response.respondedAt)}
                        </Text>
                      </View>
                      <Text style={[local.entryText, { color: '#fff' }]}>
                        {item.response.text}
                      </Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {BottomNav}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const local = StyleSheet.create({
  title: {
    fontSize:     26,
    fontWeight:   'bold',
    color:        '#fff',
    textAlign:    'center',
    marginBottom: 6,
    marginTop:    Platform.OS === 'ios' ? 10 : 0,
  },
  subtitle: {
    fontSize:     14,
    color:        '#CBD5E1',
    textAlign:    'center',
    marginBottom: 20,
  },

  // Cards
  hubCard: {
    borderWidth:  1,
    borderRadius: 20,
    padding:      18,
    marginBottom: 12,
  },
  featuredCard: {
    paddingVertical: 22,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  cardTitle: {
    fontSize:     16,
    fontWeight:   '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize:   13,
    lineHeight: 20,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  chevron: {
    fontSize:   28,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  toggle: {
    fontSize: 12,
  },
  badge: {
    borderRadius:     10,
    paddingHorizontal: 7,
    paddingVertical:   2,
    minWidth:          22,
    alignItems:        'center',
  },
  badgeText: {
    color:      '#fff',
    fontSize:   12,
    fontWeight: '700',
  },

  // Expanded section body
  expandBody: {
    borderWidth:   1,
    borderRadius:  16,
    padding:       14,
    marginBottom:  12,
    marginTop:     -8,
  },
  emptyText: {
    fontSize:   14,
    textAlign:  'center',
    paddingVertical: 8,
    fontStyle:  'italic',
  },

  // Entry items inside expanded sections
  entryItem: {
    borderBottomWidth: 1,
    paddingVertical:   12,
  },
  entryMeta: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   6,
  },
  entryWho: {
    fontSize:   12,
    color:      '#CBD5E1',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  entryDate: {
    fontSize: 11,
  },
  entryText: {
    fontSize:   14,
    lineHeight: 22,
  },
});
