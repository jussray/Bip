import React, { useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { useVerificationContext } from '@/context/VerificationContext';
import type { AccountSide } from '@/features/identity/accountProfile';
import { fetchPostAuthBootstrap } from '@/services/auth/postAuthBootstrap';
import { getSupabase } from '@/utils/supabase';

function readableAuthError(error: unknown): string {
  if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
    return 'Could not reach the account server. Check your connection and try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong while signing in. Please try again.';
}

function normalizeSide(value: string | undefined): AccountSide | undefined {
  return value === 'parent' || value === 'teen' ? value : undefined;
}

function authRoute(path: '/(auth)/signup' | '/(auth)/login', side?: AccountSide): string {
  return side ? `${path}?side=${side}` : path;
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ passwordReset?: string; side?: string }>();
  const passwordReset = params.passwordReset === '1';
  const preferredSide = normalizeSide(params.side);
  const { refreshVerification } = useVerificationContext();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSignIn() {
    setError('');
    const e = email.trim();
    const p = password;
    if (!e || !p) { setError('Email and password are required.'); return; }

    setLoading(true);
    const sb = getSupabase();
    if (!sb) {
      setError('Auth unavailable. Check the Supabase app configuration.');
      setLoading(false);
      return;
    }

    try {
      const { error: authErr } = await sb.auth.signInWithPassword({ email: e, password: p });
      if (authErr) { setError(authErr.message); return; }

      // The auth response alone is not enough to route safely. Fetch the live
      // profile and required-consent state, then refresh verification before
      // entering any teen or parent surface.
      const bootstrap = await fetchPostAuthBootstrap(preferredSide);
      await refreshVerification();
      router.replace(bootstrap.nextRoute as never);
    } catch (caught) {
      setError(readableAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
        <Text style={styles.tagline}>welcome back</Text>

        {passwordReset ? (
          <Text style={styles.success} accessibilityRole="alert">
            Password updated. Sign in with your new password.
          </Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="email"
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          editable={!loading}
          onChangeText={t => { setEmail(t); setError(''); }}
          accessibilityLabel="Email"
        />
        <TextInput
          style={styles.input}
          placeholder="password"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          value={password}
          editable={!loading}
          onChangeText={t => { setPassword(t); setError(''); }}
          onSubmitEditing={handleSignIn}
          returnKeyType="go"
          accessibilityLabel="Password"
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgot}
          accessibilityRole="link"
          accessibilityLabel="Forgot password"
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSignIn}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign In"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(authRoute('/(auth)/signup', preferredSide) as never)}
          style={styles.link}
          accessibilityRole="link"
          accessibilityLabel="New here? Create an account"
        >
          <Text style={styles.linkText}>New here? Create an account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#0d0d0d' },
  inner:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo:     { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  tagline:  { color: '#6d28d9', fontSize: 15, marginBottom: 24 },
  success: {
    width: '100%', color: '#c4b5fd', backgroundColor: '#1f1630', borderWidth: 1,
    borderColor: '#6d28d9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    textAlign: 'center', fontSize: 14, marginBottom: 16,
  },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18, color: '#fff', fontSize: 15,
    backgroundColor: '#111', marginBottom: 12,
  },
  forgot:     { alignSelf: 'flex-end', marginTop: 2, marginBottom: 18 },
  forgotText: { color: '#c4b5fd', fontSize: 14 },
  error:      { color: '#f87171', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  btn: {
    width: '100%', backgroundColor: '#6d28d9', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 4, marginBottom: 18,
  },
  btnDisabled: { opacity: 0.55 },
  btnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:     { marginBottom: 28 },
  linkText: { color: '#c4b5fd', fontSize: 14 },
});
