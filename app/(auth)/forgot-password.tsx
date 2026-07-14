import React, { useState } from 'react';
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
  buildRecoveryRedirectUrl,
  normalizeRecoveryEmail,
  validateRecoveryEmail,
} from '@/features/auth/passwordRecovery';
import { getSupabase } from '@/utils/supabase';

function recoveryRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return buildRecoveryRedirectUrl({ webOrigin: window.location.origin });
  }
  return buildRecoveryRedirectUrl({ nativeUrl: Linking.createURL(PASSWORD_RECOVERY_PATH) });
}

function readableAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (error instanceof TypeError && message.includes('failed to fetch')) {
    return 'Could not reach the account server. Check your connection and try again.';
  }
  if (message.includes('rate') || message.includes('too many')) {
    return 'Too many reset requests. Wait a little, then try again.';
  }
  return 'Could not send a reset email right now. Please try again.';
}

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResetRequest() {
    setError('');
    const validationError = validateRecoveryEmail(email);
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
      const { error: resetError } = await sb.auth.resetPasswordForEmail(
        normalizeRecoveryEmail(email),
        { redirectTo: recoveryRedirectUrl() },
      );
      if (resetError) {
        setError(readableAuthError(resetError));
        return;
      }
      setSent(true);
    } catch (caught) {
      setError(readableAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.root}>
        <View style={styles.inner}>
          <Text style={styles.logo}>📧</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.body}>
            If an account matches that email, a secure reset link is on the way. Check spam or junk too.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace('/(auth)/login')}
            accessibilityRole="button"
            accessibilityLabel="Back to Sign In"
          >
            <Text style={styles.btnText}>Back to Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setSent(false); setError(''); }}
            style={styles.link}
            accessibilityRole="link"
            accessibilityLabel="Try another email or resend"
          >
            <Text style={styles.linkText}>Try another email or resend</Text>
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
        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.body}>
          Enter the email connected to your account. We’ll send a secure link to choose a new password.
        </Text>

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
          onChangeText={value => { setEmail(value); setError(''); }}
          onSubmitEditing={handleResetRequest}
          returnKeyType="send"
          accessibilityLabel="Account email"
        />

        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleResetRequest}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Send password reset email"
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
        </TouchableOpacity>

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
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { paddingVertical: 8 },
  linkText: { color: '#c4b5fd', fontSize: 14 },
});
