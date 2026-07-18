import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import type { AccountSide } from '@/features/identity/accountProfile';
import { fetchPostAuthBootstrap } from '@/services/auth/postAuthBootstrap';
import { getSupabase } from '@/utils/supabase';
import { consentService } from '../../services/consentService';
import { useOnboarding } from '@/context/OnboardingContext';

const PRIVACY_POLICY_URL = 'https://github.com/jussray/Sekret-Bip/blob/main/docs/PRIVACY_POLICY.md';
const TERMS_URL = 'https://github.com/jussray/Sekret-Bip/blob/main/docs/TERMS_OF_SERVICE.md';

function normalizeSide(value: string | undefined): AccountSide {
  return value === 'parent' ? 'parent' : 'teen';
}

function CheckRow({
  checked,
  label,
  onPress,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.checkRow}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        <Text style={styles.checkmark}>{checked ? '✓' : ''}</Text>
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ConsentScreen() {
  const params = useLocalSearchParams<{ side?: string }>();
  const side = normalizeSide(params.side);
  const { advance } = useOnboarding();
  const [userId, setUserId] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) throw new Error('The account service is unavailable.');
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!data.user || data.user.is_anonymous) {
          router.replace(`/(auth)/signup?side=${side}` as never);
          return;
        }

        await consentService.load(data.user.id);
        if (!active) return;
        setUserId(data.user.id);
        setPrivacyAccepted(consentService.has('privacyPolicy'));
        setTermsAccepted(consentService.has('termsOfService'));
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load consent status.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [side]);

  async function openPolicy(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      setError('That policy could not be opened on this device.');
      return;
    }
    await Linking.openURL(url);
  }

  async function handleContinue() {
    if (!userId || !privacyAccepted || !termsAccepted || saving) return;
    setSaving(true);
    setError(null);

    try {
      if (!consentService.has('privacyPolicy')) {
        await consentService.grant(userId, 'privacyPolicy');
      }
      if (!consentService.has('termsOfService')) {
        await consentService.grant(userId, 'termsOfService');
      }

      await consentService.load(userId);
      if (!consentService.hasCompletedOnboarding()) {
        throw new Error('Your choices were not fully saved. Please try again.');
      }

      // ── Onboarding state machine ──────────────────────────────────
      await advance('consent_complete');
      // ─────────────────────────────────────────────────────────────

      const bootstrap = await fetchPostAuthBootstrap(side);
      router.replace(bootstrap.nextRoute as never);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save your choices.');
    } finally {
      setSaving(false);
    }
  }

  const ready = Boolean(userId && privacyAccepted && termsAccepted && !saving);
  const accent = side === 'parent' ? '#a7f3d0' : '#8b5cf6';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={side === 'parent' ? ['#071410', '#0d1f18', '#08140f'] : ['#10091b', '#171024', '#090711']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: accent }]}>BEFORE WE BUILD YOUR SPACE</Text>
        <Text style={styles.title}>Your choices should be clear.</Text>
        <Text style={styles.body}>
          Review the Privacy Policy and Terms of Service. Nothing is recorded until you check both boxes and press Continue.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy Policy</Text>
          <Text style={styles.cardBody}>
            Explains what Bip stores, how private spaces work, and the controls available to account holders.
          </Text>
          <TouchableOpacity onPress={() => void openPolicy(PRIVACY_POLICY_URL)} style={styles.policyLink}>
            <Text style={[styles.policyLinkText, { color: accent }]}>Review Privacy Policy →</Text>
          </TouchableOpacity>
          <CheckRow
            checked={privacyAccepted}
            label="I reviewed the Privacy Policy"
            onPress={() => { setPrivacyAccepted(value => !value); setError(null); }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Terms of Service</Text>
          <Text style={styles.cardBody}>
            Explains the rules for using Bip, account responsibilities, and the limits of AI-generated guidance.
          </Text>
          <TouchableOpacity onPress={() => void openPolicy(TERMS_URL)} style={styles.policyLink}>
            <Text style={[styles.policyLinkText, { color: accent }]}>Review Terms of Service →</Text>
          </TouchableOpacity>
          <CheckRow
            checked={termsAccepted}
            label="I agree to the Terms of Service"
            onPress={() => { setTermsAccepted(value => !value); setError(null); }}
          />
        </View>

        <View style={styles.boundaryCard}>
          <Text style={styles.boundaryTitle}>This does not turn on optional features.</Text>
          <Text style={styles.boundaryText}>
            Notifications, analytics, AI chat, journaling, and mood tracking keep their own controls and are not silently accepted here.
          </Text>
        </View>

        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!ready || loading}
          onPress={handleContinue}
          style={[styles.button, { backgroundColor: accent }, (!ready || loading) && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel="Save consent choices and continue"
        >
          {loading || saving ? (
            <ActivityIndicator color={side === 'parent' ? '#062015' : '#fff'} />
          ) : (
            <Text style={[styles.buttonText, side === 'parent' && styles.parentButtonText]}>Continue →</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity disabled={saving} onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  content: { paddingTop: Platform.OS === 'ios' ? 72 : 48, paddingHorizontal: 24, paddingBottom: 180 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 2.2, marginBottom: 14 },
  title: { color: '#fff', fontSize: 32, lineHeight: 39, fontWeight: '900', marginBottom: 12 },
  body: { color: '#b9afc5', fontSize: 15, lineHeight: 23, marginBottom: 24 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: '#ffffff16', backgroundColor: '#ffffff08', padding: 17, marginBottom: 14 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginBottom: 7 },
  cardBody: { color: '#a89daf', fontSize: 13, lineHeight: 20 },
  policyLink: { alignSelf: 'flex-start', paddingVertical: 13 },
  policyLinkText: { fontSize: 13, fontWeight: '900' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: '#ffffff40', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#6d28d9', borderColor: '#c4b5fd' },
  checkmark: { color: '#fff', fontWeight: '900' },
  checkLabel: { color: '#eee7f2', fontSize: 14, fontWeight: '700', flex: 1 },
  boundaryCard: { borderRadius: 18, borderWidth: 1, borderColor: '#ffffff10', backgroundColor: '#00000022', padding: 15, marginTop: 4 },
  boundaryTitle: { color: '#ddd4e5', fontSize: 13, fontWeight: '900', marginBottom: 5 },
  boundaryText: { color: '#8f839a', fontSize: 12, lineHeight: 18 },
  error: { color: '#fca5a5', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 18 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 44 : 28, backgroundColor: 'rgba(9,7,17,0.97)' },
  button: { height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  parentButtonText: { color: '#062015' },
  backLink: { alignItems: 'center', paddingVertical: 12 },
  backText: { color: '#756a7e', fontSize: 13, fontWeight: '700' },
});
