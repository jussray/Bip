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

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSignIn() {
    setError('');
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) { setError('Email and password are required.'); return; }
    setLoading(true);
    const sb = getSupabase();
    if (!sb) { setError('Auth unavailable. Try skipping for now.'); setLoading(false); return; }
    const { error: authErr } = await sb.auth.signInWithPassword({ email: e, password: p });
    setLoading(false);
    if (authErr) { setError(authErr.message); return; }
    router.replace('/');
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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
        <Text style={styles.tagline}>welcome back</Text>

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
          placeholder="password"
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={t => { setPassword(t); setError(''); }}
          onSubmitEditing={handleSignIn}
          returnKeyType="go"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={handleSignIn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.link}>
          <Text style={styles.linkText}>New here? Create an account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skip} disabled={loading}>
          <Text style={styles.skipText}>Skip — use without an account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#0d0d0d' },
  inner:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo:     { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  tagline:  { color: '#6d28d9', fontSize: 15, marginBottom: 40 },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18, color: '#fff', fontSize: 15,
    backgroundColor: '#111', marginBottom: 12,
  },
  error:    { color: '#f87171', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  btn: {
    width: '100%', backgroundColor: '#6d28d9', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 4, marginBottom: 18,
  },
  btnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:     { marginBottom: 28 },
  linkText: { color: '#c4b5fd', fontSize: 14 },
  skip:     { position: 'absolute', bottom: 40 },
  skipText: { color: '#444', fontSize: 13 },
});
