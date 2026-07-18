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
import { BIP_SURFACE } from '../../constants/vibeColors';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '@/utils/notifications';
import { createParentLink, redeemParentLink } from '@/utils/parentBridgeCompat';
import { revokeParentLink } from '@/utils/parentLink';
import { useSleepGuard, type SleepWindow } from '../../hooks/useSleepGuard';
import { AccountDeletionControls } from '@/components/settings/AccountDeletionControls';

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

type RedeemStatus = 'idle' | 'ok' | 'not_found' | 'error';

function themeLabel(key: keyof typeof THEME_PACKS): string {
  const label = (THEME_PACKS[key] as { label?: unknown }).label;
  return typeof label === 'string' ? label : String(key);
}

export default function SettingsScreen() {
  const {
    theme, setTheme,
    userSide, setUserSide,
    selectedSekret, setSelectedSekret,
    sekretMode, setSekretMode,
    notificationsEnabled, setNotificationsEnabled,
    colorScheme, setColorScheme,
    resetApp,
  } = useAppContext();

  const { sleepWindow, setSleepWindow } = useSleepGuard();
  const cs = BIP_SURFACE[colorScheme];

  const [inviteCode,   setInviteCode]   = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeInput,    setCodeInput]    = useState('');
  const [isRedeeming,  setIsRedeeming]  = useState(false);
  const [isUnlinking,  setIsUnlinking]  = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<RedeemStatus>('idle');

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
      'Delete local data?',
      'This clears data saved on this device only. It does not delete your account or server data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete local data',
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

  function handleUnlinkParent() {
    Alert.alert(
      'Unlink parent?',
      'Your parent will immediately lose linked access. You can create a new invite later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            setIsUnlinking(true);
            const revoked = await revokeParentLink();
            setIsUnlinking(false);
            if (revoked) {
              setInviteCode('');
              Alert.alert('Parent unlinked', 'Linked access has been removed.');
            } else {
              Alert.alert('Could not unlink', 'No active link was found, or the connection could not be updated.');
            }
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
    const raw = await redeemParentLink(codeInput);
    setIsRedeeming(false);
    const VALID: RedeemStatus[] = ['idle', 'ok', 'not_found', 'error'];
    const result = VALID.includes(raw as RedeemStatus) ? (raw as RedeemStatus) : 'error';
    setRedeemStatus(result);
  }, [codeInput]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cs.root }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: cs.textPrimary }]}>Settings</Text>

        <Text style={[styles.sectionTitle, { color: cs.section }]}>Appearance</Text>
        <View style={[styles.row, { backgroundColor: cs.row }]}>
          <Text style={[styles.label, { color: cs.textPrimary }]}>Dark mode</Text>
          <Switch
            value={colorScheme === 'dark'}
            onValueChange={(v) => setColorScheme(v ? 'dark' : 'light')}
            trackColor={{ false: cs.inputBorder, true: cs.accent }}
            thumbColor="#fff"
          />
        </View>

        <Text style={[styles.sectionTitle, { color: cs.section }]}>Side</Text>
        <View style={[styles.row, { backgroundColor: cs.row }]}>
          <Text style={[styles.label, { color: cs.textPrimary }]}>Teen side</Text>
          <Switch value={userSide === 'teen'} onValueChange={(v) => setUserSide(v ? 'teen' : 'parent')} />
        </View>

        <Text style={[styles.sectionTitle, { color: cs.section }]}>Theme</Text>
        {THEME_ORDER.map((key) => (
          <TouchableOpacity key={String(key)} style={[styles.option, { backgroundColor: cs.row }]} onPress={() => setTheme(key)}>
            <Text style={[styles.optionText, { color: cs.textPrimary }]}>{themeLabel(key)}</Text>
            {theme === key && <Text style={[styles.check, { color: cs.accent }]}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: cs.section }]}>Companion</Text>
        {COMPANIONS.map((c) => (
          <TouchableOpacity key={c.key} style={[styles.option, { backgroundColor: cs.row }]} onPress={() => setSelectedSekret(c.key)}>
            <Text style={[styles.optionText, { color: cs.textPrimary }]}>{c.emoji} {c.name} — {c.title}</Text>
            {selectedSekret === c.key && <Text style={[styles.check, { color: cs.accent }]}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: cs.section }]}>Se'kret mode</Text>
        {SEKRET_MODES.map((m) => (
          <TouchableOpacity key={m.key} style={[styles.option, { backgroundColor: cs.row }]} onPress={() => setSekretMode(m.key)}>
            <Text style={[styles.optionText, { color: cs.textPrimary }]}>{m.emoji} {m.label}</Text>
            {sekretMode === m.key && <Text style={[styles.check, { color: cs.accent }]}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: cs.section }]}>Notifications</Text>
        <View style={[styles.row, { backgroundColor: cs.row }]}>
          <Text style={[styles.label, { color: cs.textPrimary }]}>Daily reminder</Text>
          <Switch value={notificationsEnabled} onValueChange={handleNotificationToggle} />
        </View>

        <Text style={[styles.sectionTitle, { color: cs.section }]}>Sleep guard</Text>
        {SLEEP_OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.label} style={[styles.option, { backgroundColor: cs.row }]} onPress={() => setSleepWindow(opt.value)}>
            <Text style={[styles.optionText, { color: cs.textPrimary }]}>{opt.label}</Text>
            {JSON.stringify(sleepWindow) === JSON.stringify(opt.value) && <Text style={[styles.check, { color: cs.accent }]}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: cs.section }]}>Parent link</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: cs.accent }]} onPress={handleGenerateCode} disabled={isGenerating}>
          <Text style={styles.buttonText}>{isGenerating ? 'Generating…' : 'Generate parent code'}</Text>
        </TouchableOpacity>
        {!!inviteCode && (
          <TouchableOpacity style={[styles.codeBox, { borderColor: cs.accent }]} onPress={handleCopyCode}>
            <Text style={[styles.codeText, { color: cs.textPrimary }]}>{inviteCode}</Text>
            <Text style={[styles.hint, { color: cs.textSecond }]}>tap to copy</Text>
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.input, { color: cs.textPrimary, borderColor: cs.inputBorder }]}
          value={codeInput}
          onChangeText={setCodeInput}
          placeholder="Enter teen code"
          placeholderTextColor={cs.textMuted}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: cs.accent }]} onPress={handleRedeemCode} disabled={isRedeeming}>
          <Text style={styles.buttonText}>{isRedeeming ? 'Connecting…' : 'Redeem code'}</Text>
        </TouchableOpacity>
        {redeemStatus !== 'idle' && (
          <Text style={[styles.hint, { color: cs.textSecond }]}>Status: {redeemStatus}</Text>
        )}
        <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleUnlinkParent} disabled={isUnlinking}>
          <Text style={styles.buttonText}>{isUnlinking ? 'Unlinking…' : 'Unlink parent'}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: cs.section }]}>Danger zone</Text>
        <AccountDeletionControls />
        <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleDeleteData}>
          <Text style={styles.buttonText}>Delete local device data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  content:      { padding: 20, paddingBottom: 80 },
  title:        { fontSize: 28, fontWeight: '800', marginBottom: 20 },
  sectionTitle: { fontWeight: '800', fontSize: 16, marginTop: 18, marginBottom: 8 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 8 },
  label:        { fontWeight: '700' },
  option:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 8 },
  optionText:   { flex: 1 },
  check:        { fontWeight: '900', fontSize: 18 },
  button:       { padding: 14, borderRadius: 16, alignItems: 'center', marginBottom: 10 },
  danger:       { backgroundColor: '#ef4444' },
  buttonText:   { color: '#fff', fontWeight: '800' },
  codeBox:      { padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 10 },
  codeText:     { fontSize: 24, fontWeight: '900', letterSpacing: 3 },
  hint:         { textAlign: 'center', marginBottom: 10 },
  input:        { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
});
