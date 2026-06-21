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
import { router } from 'expo-router';
import { getSupabase } from '@/utils/supabase';
import { ensureAnonymousSession } from '@/utils/sync';

export default function SignupScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSignUp() {
    setError('');
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) { setError('Email and password are required.'); return; }
    if (p.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (p !== confirm.trim()) { setError("Passwords don't match."); return; }
    setLoading(true);
    const sb = getSupabase();
    if (!sb) { setError('Auth unavailable. Try skipping for now.'); setLoading(false); return; }
    const { error: authErr } = await sb.auth.signUp({ email: e, password: p });
    setLoading(false);
    if (authErr) { setError(authErr.message); return; }
    // Supabase may require email confirmation — if so, session won't exist yet.
    const { data } = await sb.auth.getSession();
    if (data.session) {
      router.replace('/');
    } else {
      setSuccess(true);
    }
  }

  async function handleSkip() {
    setLoading(true);
    const uid = await ensureAnonymousSession();
    setLoading(false);
    if (!uid) {
      setError('Could not start a session. Check your connection and try again.');
      return;
    }
    router.replace('/');
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
        <Text style={styles.tagline}>create your space</Text>

        <TextInput
          style={styles.input}
          placeholder="email"
          placeholderTextColor="#555"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={t => { setEmail(t); setError(''); }}
        />
        <TextInput
          style={styles.input}
          placeholder="password (8+ characters)"
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={t => { setPassword(t); setError(''); }}
        />
        <TextInput
          style={styles.input}
          placeholder="confirm password"
          placeholderTextColor="#555"
          secureTextEntry
          value={confirm}
          onChangeText={t => { setConfirm(t); setError(''); }}
          onSubmitEditing={handleSignUp}
          returnKeyType="go"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skip} disabled={loading}>
          <Text style={styles.skipText}>Skip — use without an account</Text>
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
  btnText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:         { marginBottom: 28 },
  linkText:     { color: '#c4b5fd', fontSize: 14 },
  skip:         { position: 'absolute', bottom: 40 },
  skipText:     { color: '#444', fontSize: 13 },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 14 },
  successBody:  { color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 36 },
});
