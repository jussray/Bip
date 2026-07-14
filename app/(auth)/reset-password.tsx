import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import {
  PASSWORD_RECOVERY_PATH,
  isRecoveryCredential,
  parseRecoveryUrl,
  validateNewPassword,
} from '@/features/auth/passwordRecovery';
import { getSupabase } from '@/utils/supabase';

type RecoveryState = 'checking' | 'ready' | 'invalid';

function readableAuthError(error: unknown): string {
  if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
    return 'Could not reach the account server. Check your connection and try again.';
  }
  return 'Could not update your password. Please request a new reset link.';
}

function scrubRecoveryUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  window.history.replaceState({}, document.title, PASSWORD_RECOVERY_PATH);
}

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setRecoveryState('invalid');
      setError('Auth unavailable. Check the Supabase app configuration.');
      return;
    }
    const supabase = sb;

    let active = true;
    let recoveryAccepted = false;

    function markReady() {
      if (!active) return;
      recoveryAccepted = true;
      setError('');
      setRecoveryState('ready');
      scrubRecoveryUrl();
    }

    function markInvalid(message: string) {
      if (!active || recoveryAccepted) return;
      setRecoveryState('invalid');
      setError(message);
    }

    async function acceptRecoveryUrl(url: string | null) {
      const parsed = parseRecoveryUrl(url);
      if (parsed.kind === 'error') {
        markInvalid(parsed.message);
        return;
      }
      if (parsed.kind === 'missing') {
        markInvalid('This reset link is missing or expired. Request a new one.');
        return;
      }
      if (!isRecoveryCredential(parsed)) {
        markInvalid('This link is not a password-recovery link. Request a new one.');
        return;
      }

      try {
        if (parsed.kind === 'tokens') {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
          });
          if (sessionError) {
            markInvalid('This reset link is invalid or expired. Request a new one.');
            return;
          }
          markReady();
          return;
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code);
        if (exchangeError) {
          markInvalid('This reset link is invalid or expired. Request a new one.');
          return;
        }
        markReady();
      } catch (caught) {
        markInvalid(readableAuthError(caught));
      }
    }

    const authSubscription = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') markReady();
    }).data.subscription;

    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      void acceptRecoveryUrl(url);
    });

    void (async () => {
      const initialUrl = Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.href
        : await Linking.getInitialURL();
      await acceptRecoveryUrl(initialUrl);
    })();

    return () => {
      active = false;
      authSubscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  async function handleUpdatePassword() {
    setError('');
    if (recoveryState !== 'ready') {
      setError('This reset link is missing or expired. Request a new one.');
      return;
    }

    const validationError = validateNewPassword(password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError('Auth unavailable. Check the Supabase app configuration.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await sb.auth.updateUser({ password });
      if (updateError) {
        setError(readableAuthError(updateError));
        return;
      }

      const { error: signOutError } = await sb.auth.signOut();
      if (signOutError) {
        setError('Your password changed, but the recovery session could not close. Restart the app, then sign in with the new password.');
        return;
      }

      setPassword('');
      setConfirm('');
      router.replace('/(auth)/login?passwordReset=1');
    } catch (caught) {
      setError(readableAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  const ready = recoveryState === 'ready';
  const checking = recoveryState === 'checking';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
        <Text style={styles.title}>Choose a new password</Text>
        <Text style={styles.body}>
          {ready
            ? 'Use at least 8 characters. Your temporary recovery session will close after the change.'
            : checking
              ? 'Opening your secure reset link…'
              : 'That reset link cannot be used.'}
        </Text>

        {checking ? <ActivityIndicator color="#c4b5fd" style={styles.checking} /> : null}

        <TextInput
          style={styles.input}
          placeholder="new password"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          value={password}
          editable={ready && !loading}
          onChangeText={value => { setPassword(value); setError(''); }}
          accessibilityLabel="New password"
        />
        <TextInput
          style={styles.input}
          placeholder="confirm new password"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          value={confirm}
          editable={ready && !loading}
          onChangeText={value => { setConfirm(value); setError(''); }}
          onSubmitEditing={handleUpdatePassword}
          returnKeyType="go"
          accessibilityLabel="Confirm new password"
        />

        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, (!ready || loading) && styles.btnDisabled]}
          onPress={handleUpdatePassword}
          disabled={!ready || loading}
          accessibilityRole="button"
          accessibilityLabel="Update password"
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Password</Text>}
        </TouchableOpacity>

        {!ready && !checking ? (
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/forgot-password')}
            style={styles.link}
            accessibilityRole="link"
            accessibilityLabel="Request a new reset link"
          >
            <Text style={styles.linkText}>Request a new reset link</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.link}
          accessibilityRole="link"
          accessibilityLabel="Back to Sign In"
        >
          <Text style={styles.linkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d0d' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 14 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  body: { color: '#94a3b8', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  checking: { marginBottom: 20 },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18, color: '#fff', fontSize: 15,
    backgroundColor: '#111', marginBottom: 12,
  },
  error: { color: '#f87171', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  btn: {
    width: '100%', backgroundColor: '#6d28d9', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 4, marginBottom: 18,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { paddingVertical: 8 },
  linkText: { color: '#c4b5fd', fontSize: 14 },
});
