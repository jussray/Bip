import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { getSupabase } from '@/utils/supabase';
import {
  clearPendingAccountUpgrade,
  isPendingUpgradeForEmail,
  loadPendingAccountUpgradeEmail,
  markPendingAccountUpgrade,
  normalizeAccountEmail,
} from '@/features/identity/accountUpgrade';

type SuccessMode = 'new-account-confirmation' | 'anonymous-upgrade-verification' | null;

function readableAuthError(error: unknown): string {
  if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
    return 'Could not reach the account server. Check your connection and Supabase settings, then try again.';
  }

  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong while creating your account. Please try again.';
}

function emailAlreadyRegistered(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('already registered')
    || normalized.includes('already exists')
    || normalized.includes('duplicate')
    || normalized.includes('email address is already');
}

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [successMode, setSuccessMode] = useState<SuccessMode>(null);
  const [pendingUpgradeEmail, setPendingUpgradeEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    loadPendingAccountUpgradeEmail().then(pending => {
      if (!active || !pending) return;
      setPendingUpgradeEmail(pending);
      setEmail(pending);
    });
    return () => { active = false; };
  }, []);

  async function finishVerifiedUpgrade(accountEmail: string, nextPassword: string) {
    const sb = getSupabase();
    if (!sb) throw new Error('Auth unavailable. Check the Supabase app configuration.');

    // The email confirmation link may have refreshed the session in another app
    // view. Refresh first, then ask the Auth server for the authoritative user.
    await sb.auth.refreshSession();
    const { data, error: userError } = await sb.auth.getUser();
    if (userError) throw userError;

    const user = data.user;
    if (
      !user
      || user.is_anonymous
      || !user.email_confirmed_at
      || normalizeAccountEmail(user.email) !== normalizeAccountEmail(accountEmail)
    ) {
      throw new Error('Your email is not verified in this app yet. Open the confirmation link on this device, then try again.');
    }

    // Supabase requires the email identity to be verified before a password is
    // attached to an anonymous account. Never persist the password locally.
    const { error: passwordError } = await sb.auth.updateUser({
      password: nextPassword,
    });
    if (passwordError) throw passwordError;

    await clearPendingAccountUpgrade();
    setPendingUpgradeEmail(null);
    router.replace('/');
  }

  async function handleSignUp() {
    setError('');
    const e = normalizeAccountEmail(email);
    const p = password.trim();

    if (!e || !p) { setError('Email and password are required.'); return; }
    if (p.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (p !== confirm.trim()) { setError("Passwords don't match."); return; }

    setLoading(true);
    const sb = getSupabase();
    if (!sb) {
      setError('Auth unavailable. Check the Supabase app configuration.');
      setLoading(false);
      return;
    }

    try {
      const storedPendingEmail = await loadPendingAccountUpgradeEmail();
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError) throw sessionError;

      const currentUser = sessionData.session?.user;

      if (currentUser?.is_anonymous) {
        // First attach only the email identity. Supabase sends verification;
        // the password is set only after that identity becomes permanent.
        const { error: upgradeError } = await sb.auth.updateUser({
          email: e,
        });

        if (upgradeError) {
          if (emailAlreadyRegistered(upgradeError.message)) {
            throw new Error('That email already has a Bip account. Sign in instead so we can use that account safely.');
          }
          throw upgradeError;
        }

        await markPendingAccountUpgrade(e);
        setPendingUpgradeEmail(e);
        setSuccessMode('anonymous-upgrade-verification');
        return;
      }

      if (currentUser) {
        if (
          isPendingUpgradeForEmail(storedPendingEmail, currentUser.email)
          && normalizeAccountEmail(currentUser.email) === e
        ) {
          await finishVerifiedUpgrade(e, p);
          return;
        }

        if (normalizeAccountEmail(currentUser.email) === e) {
          router.replace('/');
          return;
        }

        throw new Error('Another Bip account is already signed in on this device. Sign out before creating a different account.');
      }

      if (storedPendingEmail && normalizeAccountEmail(storedPendingEmail) === e) {
        setPendingUpgradeEmail(storedPendingEmail);
        setSuccessMode('anonymous-upgrade-verification');
        throw new Error('Open the verification link on this device first. Then return here to finish adding your password.');
      }

      const { data: signUpData, error: authError } = await sb.auth.signUp({
        email: e,
        password: p,
      });
      if (authError) throw authError;

      if (signUpData.session) {
        router.replace('/');
      } else {
        setSuccessMode('new-account-confirmation');
      }
    } catch (caught) {
      setError(readableAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  async function handleFinishVerifiedUpgrade() {
    setError('');
    const e = normalizeAccountEmail(pendingUpgradeEmail ?? email);
    const p = password.trim();
    if (!e) { setError('The pending account email is missing. Enter it again.'); return; }
    if (p.length < 8 || p !== confirm.trim()) {
      setSuccessMode(null);
      setError('Enter and confirm your password again to finish the account.');
      return;
    }

    setLoading(true);
    try {
      await finishVerifiedUpgrade(e, p);
    } catch (caught) {
      setError(readableAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  if (successMode) {
    const upgrading = successMode === 'anonymous-upgrade-verification';
    return (
      <View style={styles.root}>
        <View style={styles.inner}>
          <Text style={styles.logo}>💜</Text>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successBody}>
            {upgrading
              ? `We sent a verification link to ${pendingUpgradeEmail ?? email.trim()}. Open it on this device, then come back and finish your account.`
              : `We sent a confirmation link to ${email.trim()}. Open it, then come back and sign in.`}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={styles.btn}
            onPress={upgrading ? handleFinishVerifiedUpgrade : () => router.replace('/(auth)/login')}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={upgrading ? 'Finish verified account' : 'Go to Sign In'}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{upgrading ? "I've verified — finish account" : 'Go to Sign In'}</Text>
            )}
          </TouchableOpacity>
          {upgrading ? (
            <TouchableOpacity
              onPress={() => { setSuccessMode(null); setError(''); }}
              style={styles.link}
              accessibilityRole="button"
              accessibilityLabel="Enter password again"
            >
              <Text style={styles.linkText}>Enter password again</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  const resumingUpgrade = Boolean(pendingUpgradeEmail);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
        <Text style={styles.tagline}>{resumingUpgrade ? 'finish your account' : 'create your space'}</Text>
        {resumingUpgrade ? (
          <Text style={styles.helper}>Your email is attached. Verify it, then enter your password here to make the account recoverable.</Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="email"
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={text => { setEmail(text); setError(''); }}
        />
        <TextInput
          style={styles.input}
          placeholder="password (8+ characters)"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={text => { setPassword(text); setError(''); }}
        />
        <TextInput
          style={styles.input}
          placeholder="confirm password"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="new-password"
          value={confirm}
          onChangeText={text => { setConfirm(text); setError(''); }}
          onSubmitEditing={handleSignUp}
          returnKeyType="go"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.btn}
          onPress={handleSignUp}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={resumingUpgrade ? 'Finish Account' : 'Create Account'}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{resumingUpgrade ? 'Finish Account' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.link}
          accessibilityRole="link"
          accessibilityLabel="Already have an account? Sign in"
        >
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d0d' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  tagline: { color: '#6d28d9', fontSize: 15, marginBottom: 18 },
  helper: { color: '#94a3b8', fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 18 },
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
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { marginBottom: 28 },
  linkText: { color: '#c4b5fd', fontSize: 14 },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 14 },
  successBody: { color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
});
