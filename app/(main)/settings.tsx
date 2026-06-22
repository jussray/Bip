import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '@/utils/notifications';

const THEME_ORDER = Object.keys(THEME_PACKS) as (keyof typeof THEME_PACKS)[];

export default function SettingsScreen() {
  const { theme, setTheme, notificationsEnabled, setNotificationsEnabled } = useAppContext();

  async function handleNotificationToggle(enabled: boolean) {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleDailyReminder();
        setNotificationsEnabled(true);
      } else {
        Alert.alert(
          'Notifications blocked',
          "To get daily check-in reminders, enable notifications for Se'kret Bip in your phone settings.",
        );
      }
    } else {
      await cancelDailyReminder();
      setNotificationsEnabled(false);
    }
  }

  function handleDeleteData() {
    Alert.alert(
      'Delete your data?',
      'This clears everything saved on this device — journal entries, moods, voice bips, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Done', 'All local data has been cleared.');
          },
        },
      ],
    );
  }

  function handleCrisisResources() {
    Alert.alert(
      'Crisis Resources',
      [
        '988 Suicide & Crisis Lifeline — call or text 988',
        '',
        'Crisis Text Line — text HOME to 741741',
        '',
        'The Trevor Project (LGBTQ+) — call 1-866-488-7386 or text START to 678-678',
        '',
        'If you are in immediate danger, call 911.',
      ].join('\n'),
      [{ text: 'Close', style: 'cancel' }],
    );
  }

  function handleAbout() {
    Alert.alert(
      "What is Se'kret Bip?",
      "Se'kret Bip is a private emotional wellness space for teens. Your Se'kret companions listen without judgment, help you process feelings, and keep your conversations local and private by default. No one reads your journal. Nothing is shared unless you choose it.",
      [{ text: 'Got it' }],
    );
  }

  function handleGuidelines() {
    Alert.alert(
      'Community Guidelines',
      [
        'Be honest. Be kind. Be yourself.',
        '',
        '• Your private space is yours — no one else sees it.',
        '• Circle posts are anonymous — keep it safe and supportive.',
        '• No hate, harassment, or harmful content.',
        '• If something feels unsafe, use the crisis resources.',
        '• The Bridge is for connection, not pressure.',
      ].join('\n'),
      [{ text: 'Got it' }],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>{'Settings ⚙️'}</Text>
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
                <Text style={[styles.themeName, active && { color: '#D946EF' }]}>{t.name}</Text>
                {active && <Text style={styles.themeActive}>Current</Text>}
              </View>
              {active && <Text style={styles.themeTick}>{'✓'}</Text>}
            </TouchableOpacity>
          );
        })}

        {/* ── Notifications ── */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Daily check-in reminder</Text>
          <Switch
            value={notificationsEnabled ?? false}
            onValueChange={handleNotificationToggle}
            trackColor={{ true: '#D946EF', false: '#333' }}
            thumbColor="#fff"
          />
        </View>

        {/* ── Account ── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(onboarding)/welcome' as any)}>
          <Text style={styles.rowLabel}>Sign in / Create account</Text>
          <Text style={styles.rowArrow}>{'›'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Alert.alert(
            'Privacy',
            "Your journal, moods, and voice bips are stored only on this device by default. Nothing is shared unless you choose it. Supabase stores only account metadata, signals, and parent connection info.",
          )}
        >
          <Text style={styles.rowLabel}>Privacy settings</Text>
          <Text style={styles.rowArrow}>{'›'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, styles.destructiveRow]} onPress={handleDeleteData}>
          <Text style={[styles.rowLabel, styles.destructiveLabel]}>Delete my data</Text>
          <Text style={styles.rowArrow}>{'›'}</Text>
        </TouchableOpacity>

        {/* ── About ── */}
        <Text style={styles.sectionLabel}>About</Text>
        <TouchableOpacity style={styles.row} onPress={handleAbout}>
          <Text style={styles.rowLabel}>{"What is Se'kret Bip?"}</Text>
          <Text style={styles.rowArrow}>{'›'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={handleGuidelines}>
          <Text style={styles.rowLabel}>Community guidelines</Text>
          <Text style={styles.rowArrow}>{'›'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, styles.crisisRow]} onPress={handleCrisisResources}>
          <Text style={[styles.rowLabel, styles.crisisLabel]}>Crisis resources</Text>
          <Text style={styles.rowArrow}>{'›'}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{"Se'kret Bip • v1.0.0-beta"}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#0d0d0d' },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  backBtn:          { marginRight: 14 },
  backText:         { color: '#888', fontSize: 22 },
  heading:          { color: '#fff', fontSize: 22, fontWeight: '800' },
  content:          { padding: 20, paddingTop: 12, paddingBottom: 60 },
  sectionLabel:     { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, marginTop: 24 },
  sectionHint:      { color: '#444', fontSize: 12, marginBottom: 10 },
  themeRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  themeRowActive:   { borderColor: '#D946EF40' },
  themeEmoji:       { fontSize: 26, marginRight: 14 },
  themeBody:        { flex: 1 },
  themeName:        { color: '#D1D5DB', fontSize: 15, fontWeight: '600' },
  themeActive:      { color: '#D946EF', fontSize: 11, marginTop: 2 },
  themeTick:        { color: '#D946EF', fontSize: 18, fontWeight: '700' },
  row:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 8 },
  rowLabel:         { color: '#D1D5DB', fontSize: 15 },
  rowArrow:         { color: '#555', fontSize: 20 },
  destructiveRow:   { borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  destructiveLabel: { color: '#f87171' },
  crisisRow:        { borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' },
  crisisLabel:      { color: '#34d399' },
  version:          { color: '#333', fontSize: 12, textAlign: 'center', marginTop: 40 },
});
