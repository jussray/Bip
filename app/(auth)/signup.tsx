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
import { fetchPostAuthBootstrap, ONBOARDING_SIDE_KEY } from '@/services/auth/postAuthBootstrap';
import { getSupabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

function readableAuthError(error: unknown): string {
  if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
    return 'Could not reach the account server. Check your connection and Supabase settings, then try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong while creating your account. Please try again.';
}

function normalizeSide(value: string | undefined): AccountSide {
  return value === 'parent' ? 'parent' : 'teen';
}

function loginRoute(side: AccountSide): string {
  return `/(auth)/login?side=${side}`;
}

export default function SignupScreen() {
  const params = useLocalSearchParams<{ side?: string }>();
  const preferredSide = normalizeSide(params.side);
  const { refreshVerification } = useVerificationContext();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);

  async function finishAuthenticatedSignup(userId: string) {
    await AsyncStorage.setItem(ONBOARDING_SIDE_KEY, preferredSide);
    const bootstrap = await fetchPostAuthBootstrap(preferredSide);
    await refreshVerification();
    router.replace(bootstrap.nextRoute as never);
  }

  async function handleSignUp() {
    setError('');
    const e = email.trim();
    const p = password;

    if (!e || !p) { setError('Email and password are required.'); return; }
    if (p.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (p !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    const sb = getSupabase();

    if (__DEV__) {
      console.log('[signup] sb=', sb ? 'ok' : 'NULL — check EXPO_PUBLIC_SUPABASE_URL/ANON_KEY');
      if (sb) {
        sb.auth.getSession().then(({ data, error: e2 }) => {
          console.log('[signup] session user=', data?.session?.user?.id ?? 'none', 'anon=', data?.session?.user?.is_anonymous ?? false, 'err=', e2?.message ?? null);
        }).catch(() => null);
      }
    }

    if (!sb) {
      setError('Auth unavailable. Check the Supabase app configuration.');
      setLoading(false);
      return;
    }

    try {
      await AsyncStorage.setItem(ONBOARDING_SIDE_KEY, preferredSide);
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      const currentUser = sessionData.session?.user;
      const isAnonymous = Boolean(currentUser?.is_anonymous);

      if (isAnonymous) {
        // Re-verify the anonymous session is still live before upgrading.
        // If it has expired or is missing, sign out and fall through to a
        // fresh signUp so the account is always created.
        const { data: refreshed0, error: refreshErr0 } = await sb.auth.getUser();
        if (refreshErr0 || !refreshed0.user?.is_anonymous) {
          await sb.auth.signOut();
          // Fall through to signUp below
        } else {
          const { error: upgradeError } = await sb.auth.updateUser({
            email: e,
            password: p,
          });

          if (upgradeError) {
            const message = upgradeError.message.toLowerCase();
            const emailExists =
              message.includes('already registered') ||
              message.includes('already exists') ||
              message.includes('duplicate') ||
              message.includes('email address is already');

            if (emailExists) {
              setError('That email already has a Bip account. Sign in instead so we can use that account safely.');
              return;
            }

            setError(upgradeError.message);
            return;
          }

          const { data: refreshed, error: refreshError } = await sb.auth.getSession();
          if (!refreshError && refreshed.session?.user && !refreshed.session.user.is_anonymous) {
            await finishAuthenticatedSignup(refreshed.session.user.id);
          } else {
            setSuccess(true);
          }
          return;
        }
      }

      const { data: signUpData, error: authErr } = await sb.auth.signUp({
        email: e,
        password: p,
      });

      if (authErr) {
        setError(authErr.message);
        return;
      }

      if (signUpData.session) {
        await finishAuthenticatedSignup(signUpData.session.user.id);
      } else {
        // session is null when Supabase email confirmation is enabled.
        // The user must click the confirmation link before they can sign in.
        setSuccess(true);
      }
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
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successBody}>
            We sent a confirmation link to {email.trim()}.{'\n'}
            Open it, then come back and sign in.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace(loginRoute(preferredSide) as never)}
            accessibilityRole="button"
            accessibilityLabel="Go to Sign In"
          >
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
        <Text style={styles.tagline}>{preferredSide === 'parent' ? 'create your Parent Space' : 'create your space'}</Text>

        <TextInput
          style={styles.input}
          placeholder="email"
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={t => { setEmail(t); setError(''); }}
        />
        <TextInput
          style={styles.input}
          placeholder="password (8+ characters)"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={t => { setPassword(t); setError(''); }}
        />
        <TextInput
          style={styles.input}
          placeholder="confirm password"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="new-password"
          value={confirm}
          onChangeText={t => { setConfirm(t); setError(''); }}
          onSubmitEditing={handleSignUp}
          returnKeyType="go"
        />

        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Create Account"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace(loginRoute(preferredSide) as never)}
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
  root:         { flex: 1, backgroundColor: '#0d0d0d' },
  inner:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo:         { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  tagline:      { color: '#6d28d9', fontSize: 15, marginBottom: 40 },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18, color: '#fff', fontSize: 15,
    backgroundColor: '#111', marginBottom: 12,
  },
  error:        { color: '#f87171', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  btn: {
    width: '100%', backgroundColor: '#6d28d9', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 4, marginBottom: 18,
  },
  btnDisabled:  { opacity: 0.55 },
  btnText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:         { marginBottom: 28 },
  linkText:     { color: '#c4b5fd', fontSize: 14 },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 14 },
  successBody:  { color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 36 },
});
