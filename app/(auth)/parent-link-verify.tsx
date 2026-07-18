import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  generateInviteCodeResult,
  PARENT_INVITE_CODE_LENGTH,
} from '@/utils/parentLink';
import { fetchPendingInviteCodeResult } from '@/utils/pendingParentInvite';
import { useVerificationContext } from '@/context/VerificationContext';

export default function ParentLinkVerifyScreen() {
  const { verificationState, refreshVerification } = useVerificationContext();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (verificationState === 'VERIFIED_TEEN') router.replace('/(teen)/room');
  }, [verificationState]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const lookup = await fetchPendingInviteCodeResult();
      if (!mounted) return;

      if (!lookup.ok) {
        setLookupFailed(true);
        setError(lookup.message);
        setCheckingExisting(false);
        return;
      }

      if (lookup.value) {
        setCode(lookup.value);
        setCheckingExisting(false);
        return;
      }

      const result = await generateInviteCodeResult();
      if (!mounted) return;

      if (result.ok) {
        setCode(result.value);
        await refreshVerification();
      } else {
        setError(result.message);
      }
      if (mounted) setCheckingExisting(false);
    })();

    return () => { mounted = false; };
  }, [refreshVerification]);

  async function retryExistingCodeLookup() {
    setLoading(true);
    setError('');
    const lookup = await fetchPendingInviteCodeResult();
    if (!lookup.ok) {
      setLookupFailed(true);
      setError(lookup.message);
      setLoading(false);
      return;
    }

    setLookupFailed(false);
    if (lookup.value) {
      setCode(lookup.value);
      setLoading(false);
      return;
    }

    const result = await generateInviteCodeResult();
    if (result.ok) {
      setCode(result.value);
      await refreshVerification();
    } else {
      setError(result.message);
    }
    setLoading(false);
  }

  async function createCode() {
    if (lookupFailed) {
      await retryExistingCodeLookup();
      return;
    }

    setLoading(true);
    setError('');
    const result = await generateInviteCodeResult();
    if (result.ok) {
      setCode(result.value);
      await refreshVerification();
    } else {
      setError(result.message);
    }
    setLoading(false);
  }

  async function checkStatus() {
    setLoading(true);
    setError('');
    try {
      await refreshVerification();
    } catch {
      setError('Could not check approval status. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const displayCode = code ?? '•'.repeat(PARENT_INVITE_CODE_LENGTH);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#10091b', '#1b0f2e', '#090711']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Text style={styles.kicker}>ACCOUNT VERIFICATION</Text>
        <Text style={styles.title}>Bring in a parent or trusted adult.</Text>
        <Text style={styles.body}>
          Share one private eight-character code. After they enter it, your accounts connect and your approval status updates automatically.
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{code ? 'YOUR PRIVATE CODE' : lookupFailed ? 'CODE CHECK NEEDED' : 'CREATING YOUR PRIVATE CODE'}</Text>
          {checkingExisting ? (
            <ActivityIndicator color="#c4b5fd" style={styles.codeLoader} />
          ) : (
            <Text selectable={Boolean(code)} style={styles.code}>{displayCode}</Text>
          )}
          <Text style={styles.codeNote}>Codes expire after 48 hours. Only share yours with the adult you trust.</Text>
        </View>

        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

        <TouchableOpacity style={styles.primary} onPress={createCode} disabled={loading || checkingExisting}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>
              {lookupFailed ? 'Retry existing code check' : code ? 'Create a new code' : 'Try creating code again'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={checkStatus} disabled={loading || checkingExisting}>
          <Text style={styles.secondaryText}>Check approval status</Text>
        </TouchableOpacity>

        <View style={styles.parentHint}>
          <Text style={styles.parentHintTitle}>For your parent or trusted adult</Text>
          <Text style={styles.parentHintBody}>They should finish Parent Setup, continue to the private-code step, and enter this exact eight-character code.</Text>
        </View>

        <TouchableOpacity style={styles.link} onPress={() => router.replace('/(auth)/limited-mode')}>
          <Text style={styles.linkText}>Keep using Limited Mode</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  content: { flex: 1, paddingTop: Platform.OS === 'ios' ? 76 : 52, paddingHorizontal: 24 },
  kicker: { color: '#a78bfa', fontSize: 11, fontWeight: '900', letterSpacing: 2.2, marginBottom: 16 },
  title: { color: '#fff', fontSize: 34, lineHeight: 40, fontWeight: '900', marginBottom: 14 },
  body: { color: '#c7bdd1', fontSize: 15, lineHeight: 23, marginBottom: 28 },
  codeCard: { backgroundColor: '#ffffff0b', borderWidth: 1, borderColor: '#ffffff16', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 18 },
  codeLabel: { color: '#8f82a0', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  code: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 6, marginVertical: 16 },
  codeLoader: { marginVertical: 24 },
  codeNote: { color: '#807487', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  error: { color: '#fca5a5', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 12 },
  primary: { height: 58, borderRadius: 18, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  secondary: { height: 54, borderRadius: 18, borderWidth: 1, borderColor: '#6d28d955', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#c4b5fd', fontSize: 14, fontWeight: '800' },
  parentHint: { marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: '#ffffff10', backgroundColor: '#ffffff07', padding: 14 },
  parentHintTitle: { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  parentHintBody: { color: '#8f82a0', fontSize: 12, lineHeight: 18 },
  link: { alignItems: 'center', paddingVertical: 22 },
  linkText: { color: '#776c83', fontSize: 13, fontWeight: '700' },
});