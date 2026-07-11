import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useVerificationContext } from '@/context/VerificationContext';
import { submitGuardianVerification } from '@/features/identity/accountProfile';

const COPY: Record<string, { title: string; body: string }> = {
  PENDING_GUARDIAN_REVIEW: {
    title: 'Your guardian review is pending.',
    body: 'Your Parent space stays locked until the account is reviewed. Teen sharing and parent-link consent are separate and are not created by this review.',
  },
  GUARDIAN_REJECTED: {
    title: 'We could not verify this account yet.',
    body: 'Review your Parent profile and resubmit. No teen data is visible while guardian verification is incomplete.',
  },
  GUARDIAN_SUSPENDED: {
    title: 'This guardian account is suspended.',
    body: 'Parent and guardian-only community areas remain unavailable while the account is suspended.',
  },
  UNVERIFIED: {
    title: 'Guardian verification is required.',
    body: 'Completing a Parent profile starts review. Linking to a teen is a separate consent step and does not verify an adult account.',
  },
};

export default function GuardianVerificationScreen() {
  const {
    verificationState,
    refreshVerification,
    verificationError,
  } = useVerificationContext();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (verificationState === 'VERIFIED_GUARDIAN') {
      router.replace('/(parent)/room');
    } else if (verificationState === 'GUARDIAN_SUSPENDED') {
      router.replace('/(auth)/suspended');
    }
  }, [verificationState]);

  const copy = COPY[verificationState] ?? COPY.UNVERIFIED;
  const canSubmit = verificationState === 'UNVERIFIED' || verificationState === 'GUARDIAN_REJECTED';

  async function handlePrimary() {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      if (canSubmit) await submitGuardianVerification();
      await refreshVerification();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update guardian review.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#06150f', '#0d2118', '#07110d']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>GUARDIAN ACCESS</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What stays separate</Text>
          <Text style={styles.row}>✓ Guardian identity review unlocks Parent surfaces.</Text>
          <Text style={styles.row}>✓ A teen chooses whether to create a parent link.</Text>
          <Text style={styles.row}>✓ No journal, voice note, or private source is shared automatically.</Text>
        </View>

        {(actionError || verificationError) ? (
          <Text style={styles.error}>{actionError ?? verificationError}</Text>
        ) : null}

        <TouchableOpacity style={styles.primary} onPress={handlePrimary} disabled={busy} activeOpacity={0.86}>
          <Text style={styles.primaryText}>
            {busy ? 'checking…' : canSubmit ? 'Submit for guardian review' : 'Check review status'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={() => router.replace('/(onboarding)/parent-setup')}>
          <Text style={styles.secondaryText}>Review Parent profile</Text>
        </TouchableOpacity>

        <Text style={styles.note}>Parent access fails closed until Supabase reports VERIFIED_GUARDIAN.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07110d' },
  content: { paddingTop: Platform.OS === 'ios' ? 72 : 48, paddingHorizontal: 24, paddingBottom: 48 },
  kicker: { color: '#6ee7b7', fontSize: 11, fontWeight: '900', letterSpacing: 2.4, marginBottom: 14 },
  title: { color: '#fff', fontSize: 34, lineHeight: 41, fontWeight: '900', marginBottom: 14 },
  body: { color: '#a8c8b6', fontSize: 15, lineHeight: 23, marginBottom: 24 },
  card: { backgroundColor: '#ffffff0a', borderWidth: 1, borderColor: '#ffffff12', borderRadius: 22, padding: 18, marginBottom: 18 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 12 },
  row: { color: '#a8c8b6', fontSize: 13, lineHeight: 20, marginBottom: 9 },
  error: { color: '#fca5a5', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  primary: { height: 58, borderRadius: 18, backgroundColor: '#6ee7b7', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: '#062015', fontSize: 15, fontWeight: '900', textAlign: 'center', paddingHorizontal: 12 },
  secondary: { height: 52, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#a7f3d0', fontSize: 14, fontWeight: '700' },
  note: { color: '#4d6a59', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
});
