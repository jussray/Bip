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
import { getSupabase } from '@/utils/supabase';

function readTokens(url: string): { accessToken: string; refreshToken: string } | null {
  const [, hash = ''] = url.split('#');
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  const params = new URLSearchParams(hash || query);
  const accessToken = params.get('access_token') ?? '';
  const refreshToken = params.get('refresh_token') ?? '';
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

function readableAuthError(error: unknown): string {
  if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
    return 'Could not reach the account server. Check your connection and try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Could not update your password. Please request a new reset link.';
}

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setError('Auth unavailable. Check the Supabase app configuration.');
      return;
    }
    const supabase = sb;

    let active = true;

    async function acceptRecoveryUrl(url: string | null) {
      if (!url) return;
      const tokens = readTokens(url);
      if (!tokens) return;
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      else setReady(true);
    }

    void (async () => {
      const { data } = await sb.auth.getSession();
      if (!active) return;
      if (data.session) setReady(true);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        await acceptRecoveryUrl(window.location.href);
      } else {
        await acceptRecoveryUrl(await Linking.getInitialURL());
      }
    })();

    const authSubscription = sb.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    }).data.subscription;

    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      void acceptRecoveryUrl(url);
    });

    return () => {
      active = false;
      authSubscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  async function handleUpdatePassword() {
    setError('');
    if (!ready) {
      setError('This reset link is missing or expired. Request a new one.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
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
        setError(updateError.message);
        return;
      }
      await sb.auth.signOut();
      setSuccess(true);
    } catch (caught) {
      setError(readableAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.root}>
        <View style={styles.inner}>
          <Text style={styles.logo}>💜</Text>
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.body}>Your new password is ready. Sign in with it now.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.btnText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
        <Text style={styles.title}>Choose a new password</Text>
        <Text style={styles.body}>
          {ready ? 'Use at least 8 characters.' : 'Opening your secure reset link…'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="new password"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="new-password"
          value={password}
          editable={ready && !loading}
          onChangeText={value => { setPassword(value); setError(''); }}
        />
        <TextInput
          style={styles.input}
          placeholder="confirm new password"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="new-password"
          value={confirm}
          editable={ready && !loading}
          onChangeText={value => { setConfirm(value); setError(''); }}
          onSubmitEditing={handleUpdatePassword}
          returnKeyType="go"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, !ready && styles.btnDisabled]}
          onPress={handleUpdatePassword}
          disabled={!ready || loading}
          accessibilityRole="button"
          accessibilityLabel="Update password"
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Password</Text>}
        </TouchableOpacity>

        {!ready ? (
          <TouchableOpacity onPress={() => router.replace('/(auth)/forgot-password')} style={styles.link}>
            <Text style={styles.linkText}>Request a new reset link</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d0d' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 14 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  body: { color: '#94a3b8', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
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
