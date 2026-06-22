import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
  Clipboard,
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
import { createParentLink, redeemParentLink } from '@/utils/sync';
import { useSleepGuard, type SleepWindow } from '../../../hooks/useSleepGuard';

const THEME_ORDER = Object.keys(THEME_PACKS) as (keyof typeof THEME_PACKS)[];

const COMPANIONS = [
  { key: 'soft',   name: 'Raylene', emoji: '💜', title: 'Big Sis', tagline: 'warm · protective · emotionally real' },
  { key: 'rylane', name: 'Rylane',  emoji: '⚡', title: 'Loyal Bro', tagline: 'street smart · down to earth · no cap' },
];

const SEKRET_MODES = [
  { key: 'soft',     emoji: '🌙', label: 'Soft' },
  { key: 'realTalk', emoji: '🧠', label: 'Real Talk' },
  { key: 'distract', emoji: '😂', label: 'Distract' },
  { key: 'listen',   emoji: '☁️', label: 'Just Listen' },
  { key: 'push',     emoji: '🔥', label: 'Push Me' },
];

const SLEEP_OPTIONS: Array<{ label: string; value: SleepWindow | null }> = [
  { label: 'Off',         value: null },
  { label: '10pm – 7am',  value: { start: '22:00', end: '07:00' } },
  { label: '11pm – 8am',  value: { start: '23:00', end: '08:00' } },
];

export default function SettingsScreen() {
  const {
    theme, setTheme,
    userSide, setUserSide,
    selectedSekret, setSelectedSekret,
    sekretMode, setSekretMode,
    notificationsEnabled, setNotificationsEnabled,
    resetApp,
  } = useAppContext();

  const { sleepWindow, setSleepWindow } = useSleepGuard();

  // Parent linking state
  const [inviteCode,   setInviteCode]   = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeInput,    setCodeInput]    = useState('');
  const [isRedeeming,  setIsRedeeming]  = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'ok' | 'not_found' | 'error'>('idle');

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
            resetApp();
            router.replace('/(onboarding)/welcome' as any);
          },
        },
      ],
    );
  }

  const handleGenerateCode = useCallback(async () => {
    setIsGenerating(true);
    const code = await createParentLink();
    setIsGenerating(false);
    if (code) {
      setInviteCode(code);
    } else {
      Alert.alert('Not signed in', 'Sign in to your account first, then generate a link code.');
    }
  }, []);

  const handleCopyCode = useCallback(() => {
    if (!inviteCode) return;
    Clipboard.setString(inviteCode);
    Alert.alert('Copied!', `Share this code with your parent:\n\n${inviteCode}\n\nIt expires in 48 hours.`);
  }, [inviteCode]);

  const handleRedeemCode = useCallback(async () => {
    if (!codeInput.trim()) return;
    setIsRedeeming(true);
    setRedeemStatus('idle');
    const result = await redeemParentLink(codeInput.trim());
    setIsRedeeming(false);
    setRedeemStatus(result);
    if (result === 'ok') setCodeInput('');
  }, [codeInput]);

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

  const activeSleepLabel = SLEEP_OPTIONS.find(o =>
    o.value === null ? sleepWindow === null
      : sleepWindow?.start === o.value.start && sleepWindow?.end === o.value.end
  )?.label ?? 'Off';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>{'Settings ⚙️'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Switch side (dev convenience) ── */}
        <Text style={styles.sectionLabel}>View as</Text>
        <View style={styles.segRow}>
          {(['teen', 'parent'] as const).map(side => (
            <TouchableOpacity
              key={side}
              style={[styles.segBtn, userSide === side && styles.segBtnActive]}
              onPress={() => setUserSide(side)}
            >
              <Text style={[styles.segLabel, userSide === side && styles.segLabelActive]}>
                {side === 'teen' ? '🧑 Teen' : '👨‍👩‍👧 Parent'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Your Se'kret ── */}
        <Text style={styles.sectionLabel}>Your Se'kret</Text>
        {COMPANIONS.map(c => {
          const active = selectedSekret === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.companionRow, active && styles.companionRowActive]}
              onPress={() => setSelectedSekret(c.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.companionEmoji}>{c.emoji}</Text>
              <View style={styles.companionBody}>
                <Text style={[styles.companionName, active && { color: '#D946EF' }]}>
                  {c.name} · {c.title}
                </Text>
                <Text style={styles.companionTagline}>{c.tagline}</Text>
              </View>
              {active && <Text style={styles.themeTick}>{'✓'}</Text>}
            </TouchableOpacity>
          );
        })}

        {/* ── Se'kret Mode ── */}
        <Text style={styles.sectionLabel}>Se'kret Mode</Text>
        <Text style={styles.sectionHint}>How you want to talk today</Text>
        <View style={styles.pillRow}>
          {SEKRET_MODES.map(m => {
            const active = sekretMode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSekretMode(m.key)}
              >
                <Text style={styles.pillEmoji}>{m.emoji}</Text>
                <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

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

        {/* ── Sleep Hours ── */}
        <Text style={styles.sectionLabel}>Sleep Hours</Text>
        <Text style={styles.sectionHint}>During sleep hours, only Comfort stays open</Text>
        <View style={styles.pillRow}>
          {SLEEP_OPTIONS.map(o => {
            const active = o.value === null
              ? sleepWindow === null
              : sleepWindow?.start === o.value.start && sleepWindow?.end === o.value.end;
            return (
              <TouchableOpacity
                key={o.label}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSleepWindow(o.value)}
              >
                <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{o.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(auth)/login' as any)}>
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

        {/* ── Bridge Connection (teen side) ── */}
        {userSide !== 'parent' && (
          <>
            <Text style={styles.sectionLabel}>Bridge Connection</Text>
            <Text style={styles.sectionHint}>
              Generate a code and share it with your parent so they can send you warm notes on Bridge.
            </Text>
            {inviteCode ? (
              <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode}>
                <Text style={styles.codeText}>{inviteCode}</Text>
                <Text style={styles.codeCopyHint}>tap to copy · expires in 48 hours</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.row, styles.bridgeRow]}
                onPress={handleGenerateCode}
                disabled={isGenerating}
              >
                <Text style={styles.bridgeLabel}>
                  {isGenerating ? 'Generating…' : '🔗 Generate invite code'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── Bridge Connection (parent side) ── */}
        {userSide === 'parent' && (
          <>
            <Text style={styles.sectionLabel}>Bridge Connection</Text>
            <Text style={styles.sectionHint}>
              Ask your teen to generate a code in their settings, then enter it here.
            </Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter 6-letter code"
              placeholderTextColor="#555"
              autoCapitalize="characters"
              maxLength={6}
              value={codeInput}
              onChangeText={v => { setCodeInput(v); setRedeemStatus('idle'); }}
            />
            {redeemStatus === 'ok' && (
              <Text style={styles.redeemOk}>✓ Linked! You're now connected to your teen.</Text>
            )}
            {redeemStatus === 'not_found' && (
              <Text style={styles.redeemError}>Code not found or already used — check with your teen.</Text>
            )}
            {redeemStatus === 'error' && (
              <Text style={styles.redeemError}>Something went wrong — try again in a moment.</Text>
            )}
            <TouchableOpacity
              style={[styles.row, styles.bridgeRow, (!codeInput.trim() || isRedeeming) && styles.bridgeRowDisabled]}
              onPress={handleRedeemCode}
              disabled={!codeInput.trim() || isRedeeming}
            >
              <Text style={styles.bridgeLabel}>
                {isRedeeming ? 'Linking…' : '🔗 Link to teen'}
              </Text>
            </TouchableOpacity>
          </>
        )}

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
  // Side switch
  segRow:           { flexDirection: 'row', gap: 8, marginBottom: 8 },
  segBtn:           { flex: 1, backgroundColor: '#111827', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  segBtnActive:     { borderColor: '#D946EF40', backgroundColor: '#1f0a2a' },
  segLabel:         { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  segLabelActive:   { color: '#D946EF' },
  // Companions
  companionRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  companionRowActive: { borderColor: '#D946EF40' },
  companionEmoji:   { fontSize: 26, marginRight: 14 },
  companionBody:    { flex: 1 },
  companionName:    { color: '#D1D5DB', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  companionTagline: { color: '#6B7280', fontSize: 12 },
  // Pills (mode + sleep)
  pillRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill:             { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'transparent', gap: 5 },
  pillActive:       { borderColor: '#D946EF66', backgroundColor: '#1f0a2a' },
  pillEmoji:        { fontSize: 14 },
  pillLabel:        { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  pillLabelActive:  { color: '#D946EF' },
  // Theme
  themeRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  themeRowActive:   { borderColor: '#D946EF40' },
  themeEmoji:       { fontSize: 26, marginRight: 14 },
  themeBody:        { flex: 1 },
  themeName:        { color: '#D1D5DB', fontSize: 15, fontWeight: '600' },
  themeActive:      { color: '#D946EF', fontSize: 11, marginTop: 2 },
  themeTick:        { color: '#D946EF', fontSize: 18, fontWeight: '700' },
  // Rows
  row:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 8 },
  rowLabel:         { color: '#D1D5DB', fontSize: 15 },
  rowArrow:         { color: '#555', fontSize: 20 },
  destructiveRow:   { borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  destructiveLabel: { color: '#f87171' },
  crisisRow:        { borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' },
  crisisLabel:      { color: '#34d399' },
  // Bridge connection
  bridgeRow:        { justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(77,163,255,0.35)' },
  bridgeRowDisabled:{ opacity: 0.4 },
  bridgeLabel:      { color: '#4DA3FF', fontSize: 15, fontWeight: '600' },
  codeBox:          { alignItems: 'center', backgroundColor: '#111827', borderRadius: 14, paddingVertical: 20, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(77,163,255,0.4)', borderStyle: 'dashed' },
  codeText:         { color: '#4DA3FF', fontSize: 34, fontWeight: '900', letterSpacing: 8 },
  codeCopyHint:     { color: '#4DA3FF99', fontSize: 11, marginTop: 6, fontWeight: '600' },
  codeInput:        { backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#333', color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 6, textAlign: 'center', paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8 },
  redeemOk:         { color: '#34d399', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  redeemError:      { color: '#f87171', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  version:          { color: '#333', fontSize: 12, textAlign: 'center', marginTop: 40 },
});
