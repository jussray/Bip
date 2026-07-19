import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  generateInviteCodeResult,
  PARENT_INVITE_CODE_LENGTH,
} from '@/utils/parentLink';
import { fetchPendingInviteCodeResult } from '@/utils/pendingParentInvite';
import { useVerificationContext } from '@/context/VerificationContext';

export default function ParentLinkVerifyScreen() {
  const { verificationState, refreshVerification } = useVerificationContext();
  const [code, setCode]                     = useState<string | null>(null);
  const [loading, setLoading]               = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [lookupFailed, setLookupFailed]     = useState(false);
  const [error, setError]                   = useState('');

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
    if (lookup.value) { setCode(lookup.value); setLoading(false); return; }
    const result = await generateInviteCodeResult();
    if (result.ok) { setCode(result.value); await refreshVerification(); }
    else setError(result.message);
    setLoading(false);
  }

  async function createCode() {
    if (lookupFailed) { await retryExistingCodeLookup(); return; }
    setLoading(true);
    setError('');
    const result = await generateInviteCodeResult();
    if (result.ok) { setCode(result.value); await refreshVerification(); }
    else setError(result.message);
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
      <View style={styles.bgDot1} pointerEvents="none" />
      <View style={styles.bgDot2} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoMark}>Bip</Text>
          <Text style={styles.logoHeart}>💜</Text>
        </View>
        <Text style={styles.wordmark}>Se'kret Bip</Text>

        <Text style={styles.kicker}>ACCOUNT VERIFICATION</Text>
        <Text style={styles.title}>Bring in a parent or trusted adult.</Text>
        <Text style={styles.body}>
          Share one private {PARENT_INVITE_CODE_LENGTH}-character code. After they enter it, your accounts connect and your approval status updates automatically.
        </Text>

        {/* Code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>
            {code
              ? 'YOUR PRIVATE CODE'
              : lookupFailed
                ? 'CODE CHECK NEEDED'
                : 'CREATING YOUR CODE…'}
          </Text>
          {checkingExisting ? (
            <ActivityIndicator color="#a78bfa" style={styles.codeLoader} />
          ) : (
            <Text selectable={Boolean(code)} style={styles.code}>
              {displayCode}
            </Text>
          )}
          <Text style={styles.codeNote}>
            Codes expire after 48 hours. Only share yours with the adult you trust.
          </Text>
        </View>

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
        ) : null}

        {/* Primary: create/retry code */}
        <TouchableOpacity
          style={[styles.btn, (loading || checkingExisting) && styles.btnDim]}
          onPress={createCode}
          disabled={loading || checkingExisting}
          activeOpacity={0.86}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>
              {lookupFailed ? 'Retry existing code check' : code ? 'Create a new code' : 'Try creating code again'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Secondary: check status */}
        <TouchableOpacity
          style={[styles.outlineBtn, (loading || checkingExisting) && styles.outlineBtnDim]}
          onPress={checkStatus}
          disabled={loading || checkingExisting}
        >
          <Text style={styles.outlineBtnText}>Check approval status</Text>
        </TouchableOpacity>

        {/* Parent hint */}
        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>For your parent or trusted adult</Text>
          <Text style={styles.hintBody}>
            They should finish Parent Setup, continue to the private-code step, and enter this exact {PARENT_INVITE_CODE_LENGTH}-character code.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => router.replace('/(auth)/limited-mode')}
        >
          <Text style={styles.linkText}>Keep using Limited Mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const PURPLE     = '#7c3aed';
const PURPLE_DIM = '#4c1d95';
const BG         = '#0a0a0a';
const BORDER     = '#1e1e2a';
const TEXT       = '#f3f3f5';
const MUTED      = '#888';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  bgDot1: {
    position: 'absolute', width: 340, height: 340,
    borderRadius: 170, backgroundColor: '#4c1d9520',
    top: -80, right: -100,
  },
  bgDot2: {
    position: 'absolute', width: 260, height: 260,
    borderRadius: 130, backgroundColor: '#7c3aed12',
    bottom: 60, left: -80,
  },
  content: {
    paddingTop: Platform.OS === 'ios' ? 72 : 52,
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  logoWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: PURPLE_DIM,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  logoMark:  { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  logoHeart: { fontSize: 10, position: 'absolute', bottom: 6, right: 7 },
  wordmark:  { color: TEXT, fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 28 },
  kicker: {
    color: '#a78bfa', fontSize: 10, fontWeight: '900',
    letterSpacing: 2.2, marginBottom: 10, alignSelf: 'flex-start',
  },
  title: {
    color: TEXT, fontSize: 24, lineHeight: 30, fontWeight: '900',
    marginBottom: 12, alignSelf: 'flex-start',
  },
  body: {
    color: MUTED, fontSize: 14, lineHeight: 21,
    marginBottom: 24, alignSelf: 'flex-start',
  },

  // Code display
  codeCard: {
    width: '100%',
    backgroundColor: '#16161e',
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 18,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  codeLabel: {
    color: MUTED, fontSize: 9, fontWeight: '900',
    letterSpacing: 2, marginBottom: 12,
  },
  code: {
    color: TEXT, fontSize: 30, fontWeight: '900',
    letterSpacing: 7, marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  codeLoader: { marginVertical: 22 },
  codeNote: {
    color: '#555', fontSize: 11, lineHeight: 16, textAlign: 'center',
  },

  errorText: {
    color: '#f87171', fontSize: 12, alignSelf: 'flex-start',
    marginBottom: 10,
  },
  btn: {
    width: '100%', backgroundColor: PURPLE, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
    marginBottom: 12,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  btnDim:  { backgroundColor: PURPLE_DIM, shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2, textAlign: 'center' },

  outlineBtn: {
    width: '100%', borderRadius: 12,
    borderWidth: 1, borderColor: '#6d28d966',
    paddingVertical: 15, alignItems: 'center',
    marginBottom: 20,
  },
  outlineBtnDim:  { opacity: 0.4 },
  outlineBtnText: { color: '#a78bfa', fontSize: 14, fontWeight: '700' },

  hintCard: {
    width: '100%',
    backgroundColor: '#16161e',
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, padding: 14, marginBottom: 18,
  },
  hintTitle: { color: TEXT, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  hintBody:  { color: MUTED, fontSize: 12, lineHeight: 18 },

  linkBtn:  { paddingVertical: 14 },
  linkText: { color: '#555', fontSize: 13, fontWeight: '700' },
});
