import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  FOUNDER_PREVIEW_FEATURES,
  isFounderPreviewEnabled,
  type PreviewFeatureStatus,
} from '@/constants/founderPreview';
import { useAppContext } from '@/context/AppContext';

const STATUS_COPY: Record<PreviewFeatureStatus, { label: string; color: string }> = {
  live: { label: 'OPEN NOW', color: '#86efac' },
  needs_setup: { label: 'OPEN · NEEDS ACCOUNT SETUP', color: '#fde68a' },
  ui_preview: { label: 'PREVIEW', color: '#bfdbfe' },
  not_built: { label: 'NOT BUILT YET', color: '#fca5a5' },
};

export default function FounderFeaturePreviewRoute() {
  const { setUserSide } = useAppContext();
  const enabled = isFounderPreviewEnabled();

  if (!enabled) {
    return (
      <View style={styles.lockedRoot}>
        <Text style={styles.lockedEmoji}>🔒</Text>
        <Text style={styles.lockedTitle}>Founder Preview is closed.</Text>
        <Text style={styles.lockedBody}>
          Open this route in Expo Go/development, or use a controlled build with EXPO_PUBLIC_ENABLE_FOUNDER_PREVIEW=true.
        </Text>
      </View>
    );
  }

  function openRoute(route: string) {
    if (route.startsWith('/(parent)/')) setUserSide('parent');
    if (route.startsWith('/(teen)/')) setUserSide('teen');
    router.push(route as never);
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#10051f', '#1d0d35', '#090511']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>DEV ONLY</Text>
          </View>
        </View>

        <Text style={styles.kicker}>FOUNDER PREVIEW</Text>
        <Text style={styles.title}>See what Bip can do now.</Text>
        <Text style={styles.subtitle}>
          These shortcuts open real screens in Expo Go. Preview points do not touch Supabase, rewards, purchases, or your actual Bip Energy balance.
        </Text>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>What “unlocked” means</Text>
          <Text style={styles.noticeBody}>
            Built screens and client gates are open. Features that require a second accepted account still need that account. Server-controlled AI summaries remain closed until the Worker rollout is deliberately enabled.
          </Text>
        </View>

        {FOUNDER_PREVIEW_FEATURES.map(feature => {
          const status = STATUS_COPY[feature.status];
          return (
            <View key={feature.key} style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{feature.title}</Text>
                <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
              </View>
              <Text style={styles.cardDetail}>{feature.detail}</Text>
              {feature.route ? (
                <TouchableOpacity
                  style={styles.openButton}
                  onPress={() => openRoute(feature.route)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${feature.title}`}
                >
                  <Text style={styles.openButtonText}>Open feature</Text>
                  <Text style={styles.openArrow}>›</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.noRoute}>
                  <Text style={styles.noRouteText}>No honest screen exists to open yet.</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Production remains locked.</Text>
          <Text style={styles.footerBody}>
            Normal release builds ignore this preview unless the founder-preview environment variable is explicitly enabled. Delete or disable that variable before any public beta build.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090511' },
  lockedRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#090511', padding: 30 },
  lockedEmoji: { fontSize: 44, marginBottom: 14 },
  lockedTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  lockedBody: { color: '#a89bb5', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10, maxWidth: 420 },
  content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 70, maxWidth: 620, width: '100%', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  backButton: { paddingVertical: 8, paddingRight: 10 },
  backText: { color: '#b8a9c9', fontSize: 12, fontWeight: '800' },
  previewBadge: { borderRadius: 999, borderWidth: 1, borderColor: '#f59e0b66', backgroundColor: '#78350f44', paddingHorizontal: 10, paddingVertical: 5 },
  previewBadgeText: { color: '#fde68a', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  kicker: { color: '#a78bfa', fontSize: 10, fontWeight: '900', letterSpacing: 2.2, marginBottom: 8 },
  title: { color: '#fff', fontSize: 31, lineHeight: 38, fontWeight: '900' },
  subtitle: { color: '#b8a9c9', fontSize: 13, lineHeight: 20, marginTop: 9, marginBottom: 18 },
  noticeCard: { borderRadius: 18, borderWidth: 1, borderColor: '#f59e0b44', backgroundColor: '#3a210d66', padding: 15, marginBottom: 16 },
  noticeTitle: { color: '#fde68a', fontSize: 13, fontWeight: '900' },
  noticeBody: { color: '#d8c49a', fontSize: 11, lineHeight: 17, marginTop: 5 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: '#ffffff16', backgroundColor: 'rgba(27,14,46,0.94)', padding: 16, marginBottom: 11 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '900', flex: 1 },
  status: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8, textAlign: 'right' },
  cardDetail: { color: '#9f91ad', fontSize: 11, lineHeight: 17, marginTop: 7 },
  openButton: { minHeight: 44, borderRadius: 14, backgroundColor: '#6d28d9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 13, paddingHorizontal: 15 },
  openButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  openArrow: { color: '#fff', fontSize: 22, marginLeft: 7 },
  noRoute: { borderRadius: 13, backgroundColor: '#2a1420', padding: 11, marginTop: 13 },
  noRouteText: { color: '#e3a5b6', fontSize: 10, textAlign: 'center', fontWeight: '700' },
  footerCard: { borderRadius: 18, borderWidth: 1, borderColor: '#86efac33', backgroundColor: '#12331f55', padding: 15, marginTop: 8 },
  footerTitle: { color: '#bbf7d0', fontSize: 13, fontWeight: '900' },
  footerBody: { color: '#9bc9aa', fontSize: 11, lineHeight: 17, marginTop: 5 },
});
