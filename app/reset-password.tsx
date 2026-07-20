import React, { useEffect, useMemo, useState } from 'react';
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
  isRecoveryCredential,
  parseRecoveryUrl,
  validateNewPassword,
} from '@/features/auth/passwordRecovery';
import { getSupabase } from '@/utils/supabase';

function currentUrl(linkingUrl: string | null): string | null {
  if (linkingUrl) return linkingUrl;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.href;
  return null;
}

function readableError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Unable to verify the reset link. Request a new password email.';
}

export default function ResetPasswordScreen() {
  const linkingUrl = Linking.useURL();
  const parsed = useMemo(() => parseRecoveryUrl(currentUrl(linkingUrl)), [linkingUrl]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Checking reset link…');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyRecoverySession() {
      const sb = getSupabase();
      if (!sb) {
        if (!active) return;
        setReady(false);
        setStatus('');
        setError('Auth unavailable. Check the Supabase app configuration.');
        return;
      }

      if (parsed.kind === 'error') {
        if (!active) return;
        setReady(false);
        setStatus('');
        setError(parsed.message);
        return;
      }

      try {
        if (parsed.kind === 'tokens') {
          if (!isRecoveryCredential(parsed)) throw new Error('This link is not a password recovery link.');
          const { error: sessionError } = await sb.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
          });
          if (sessionError) throw sessionError;
        } else if (parsed.kind === 'code') {
          if (!isRecoveryCredential(parsed)) throw new Error('This link is not a password recovery link.');
          const { error: codeError } = await sb.auth.exchangeCodeForSession(parsed.code);
          if (codeError) throw codeError;
        } else {
          const { data } = await sb.auth.getSession();
          if (!data.session) throw new Error('Open this screen from the password reset email.');
        }

        if (!active) return;
        setReady(true);
        setStatus('Choose a new password that only you know.');
        setError('');
      } catch (caught) {
        if (!active) return;
        setReady(false);
        setStatus('');
        setError(readableError(caught));
      }
    }

    void verifyRecoverySession();
    return () => { active = false; };
  }, [parsed]);

  async function updatePassword() {
    setError('');
    setStatus('');
    const validation = validateNewPassword(password, confirm);
    if (validation) {
      setError(validation);
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
      if (updateError) throw updateError;
      await sb.auth.signOut();
      router.replace('/(auth)/login?passwordReset=1' as never);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.card}>
        <Text style={s.wordmark}>Se'kret Bip</Text>
        <Text style={s.title}>Set a new password</Text>
        <Text style={s.body}>
          This page only works from a valid reset link or an existing Supabase session. Your new password goes straight to Supabase Auth.
        </Text>

        {status ? <Text style={s.statusText} accessibilityRole="status">{status}</Text> : null}
        {error ? <Text style={s.errorText} accessibilityRole="alert">{error}</Text> : null}

        {ready ? (
          <>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                placeholder="New password"
                placeholderTextColor={MUTED}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                value={password}
                editable={!loading}
                onChangeText={(value) => { setPassword(value); setError(''); }}
                accessibilityLabel="New password"
              />
            </View>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                placeholder="Confirm password"
                placeholderTextColor={MUTED}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                value={confirm}
                editable={!loading}
                onChangeText={(value) => { setConfirm(value); setError(''); }}
                onSubmitEditing={updatePassword}
                accessibilityLabel="Confirm password"
              />
            </View>
            <TouchableOpacity
              style={[s.btn, loading && s.btnDim]}
              onPress={updatePassword}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Update password"
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Update password</Text>}
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/forgot-password' as never)}
          accessibilityRole="link"
          accessibilityLabel="Request a new reset link"
        >
          <Text style={s.linkText}>Request a new reset link</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const PURPLE = '#7c3aed';
const PURPLE_DIM = '#4c1d95';
const BG = '#0a0a0a';
const BORDER = '#2a2a35';
const TEXT = '#f3f3f5';
const MUTED = '#777';

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  wordmark: {
    color: TEXT,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  title: {
    color: TEXT,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 18,
  },
  inputWrap: {
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#111118',
    marginBottom: 12,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: TEXT,
    fontSize: 14,
  },
  statusText: {
    width: '100%',
    color: '#c4b5fd',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    width: '100%',
    color: '#f87171',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  btnDim: { backgroundColor: PURPLE_DIM },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  linkText: { color: '#a78bfa', fontSize: 14, fontWeight: '700' },
});
