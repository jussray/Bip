/**
 * app/(main)/settings.tsx
 *
 * App settings — theme, notifications, account, about.
 *
 * Fixes:
 * - THEME_PACKS import corrected to @constants/theme (consistent with all
 *   other screens).
 * - setTheme from context is now called when the user taps a theme row.
 * - notificationsEnabled persisted in AppContext instead of ephemeral useState.
 * - Back chevron added so the screen is dismissible without the tab bar.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { getSupabase } from '@/utils/supabase';

const THEME_ORDER = Object.keys(THEME_PACKS) as (keyof typeof THEME_PACKS)[];

export default function SettingsScreen() {
  const {
    theme,
    setTheme,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useAppContext();

  const [deletePending, setDeletePending] = useState(false);
  const [exportPending, setExportPending] = useState(false);

  async function handleDeleteData() {
    Alert.alert(
      'Delete my account',
      'This permanently deletes all your journal entries, mood history, voice notes, and conversations. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            setDeletePending(true);
            try {
              const sb = getSupabase();
              if (sb) {
                await sb.rpc('request_account_deletion');
              }
              // Clear local data regardless of Supabase result
              await AsyncStorage.clear();
              router.replace('/(auth)/age-gate');
            } catch {
              Alert.alert('Error', 'Could not process deletion. Please try again or contact support@sekretbip.com');
              setDeletePending(false);
            }
          },
        },
      ]
    );
  }

  async function handleExportData() {
    setExportPending(true);
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.rpc('request_data_export');
      }
      Alert.alert(
        'Export requested',
        "We'll email you a download link within 48 hours. Check the email you used to sign in."
      );
    } catch {
      Alert.alert('Error', 'Could not submit export request. Please try again.');
    } finally {
      setExportPending(false);
    }
  }

  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS.neon;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>\u2190</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Settings \u2699\uFE0F</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Theme ── */}
        <Text style={styles.sectionLabel}>Theme</Text>
        <Text style={styles.sectionHint}>Tap a theme to switch</Text>
        {THEME_ORDER.map(key => {
          const t = THEME_PACKS[key];
          const active = key === theme;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.themeRow, active && styles.themeRowActive]}
              onPress={() => setTheme(key)}
              activeOpacity={0.75}
            >
              <Text style={styles.themeEmoji}>{t.emoji}</Text>
              <View style={styles.themeBody}>
                <Text style={[styles.themeName, active && { color: '#D946EF' }]}>
                  {t.name}
                </Text>
                {active && <Text style={styles.themeActive}>Current</Text>}
              </View>
              {active && <Text style={styles.themeTick}>\u2713</Text>}
            </TouchableOpacity>
          );
        })}

        {/* ── Notifications ── */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Daily check-in reminder</Text>
          <Switch
            value={notificationsEnabled ?? true}
            onValueChange={v => setNotificationsEnabled?.(v)}
            trackColor={{ true: '#D946EF', false: '#333' }}
            thumbColor="#fff"
          />
        </View>

        {/* ── Account ── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Sign in / Create account</Text>
          <Text style={styles.rowArrow}>\u203a</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Privacy settings</Text>
          <Text style={styles.rowArrow}>\u203a</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={handleExportData}
          disabled={exportPending}
          activeOpacity={0.75}
        >
          <Text style={styles.rowLabel}>Download my data</Text>
          {exportPending
            ? <ActivityIndicator size="small" color="#888" />
            : <Text style={styles.rowArrow}>\u203a</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.row, styles.rowDanger]}
          onPress={handleDeleteData}
          disabled={deletePending}
          activeOpacity={0.75}
        >
          <Text style={[styles.rowLabel, styles.rowLabelDanger]}>Delete my data</Text>
          {deletePending
            ? <ActivityIndicator size="small" color="#f87171" />
            : <Text style={[styles.rowArrow, styles.rowLabelDanger]}>\u203a</Text>
          }
        </TouchableOpacity>

        {/* ── About ── */}
        <Text style={styles.sectionLabel}>About</Text>
        {["What is Se'kret Bip?", "Community guidelines", "Crisis resources"].map(item => (
          <TouchableOpacity key={item} style={styles.row}>
            <Text style={styles.rowLabel}>{item}</Text>
            <Text style={styles.rowArrow}>\u203a</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.version}>Se'kret Bip \u2022 v1.0.0-beta</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#0d0d0d' },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  backBtn:       { marginRight: 14 },
  backText:      { color: '#888', fontSize: 22 },
  heading:       { color: '#fff', fontSize: 22, fontWeight: '800' },
  content:       { padding: 20, paddingTop: 12, paddingBottom: 60 },
  sectionLabel:  { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, marginTop: 24 },
  sectionHint:   { color: '#444', fontSize: 12, marginBottom: 10 },
  themeRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  themeRowActive:{ borderColor: '#D946EF40' },
  themeEmoji:    { fontSize: 26, marginRight: 14 },
  themeBody:     { flex: 1 },
  themeName:     { color: '#D1D5DB', fontSize: 15, fontWeight: '600' },
  themeActive:   { color: '#D946EF', fontSize: 11, marginTop: 2 },
  themeTick:     { color: '#D946EF', fontSize: 18, fontWeight: '700' },
  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 8 },
  rowLabel:       { color: '#D1D5DB', fontSize: 15 },
  rowArrow:       { color: '#555', fontSize: 20 },
  rowDanger:      { borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  rowLabelDanger: { color: '#f87171' },
  version:        { color: '#333', fontSize: 12, textAlign: 'center', marginTop: 40 },
});
