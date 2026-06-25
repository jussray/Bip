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
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { getSupabase } from '@/utils/supabase';
import { upsertPrivateProfile, generateBipId, normalizeAnonymousHandle } from '@/utils/account';
import type { AccountSide } from '@/utils/account';

export default function ProfileSetupScreen() {
  const [firstName, setFirstName]         = useState('');
  const [handle, setHandle]               = useState('');
  const [side, setSide]                   = useState<AccountSide>('teen');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const previewBipId = handle.trim()
    ? generateBipId(handle.trim(), 'preview')
    : null;

  async function handleSubmit() {
    setError('');
    if (!firstName.trim()) { setError('First name is required.'); return; }
    if (!handle.trim()) { setError('Anonymous handle is required.'); return; }

    setLoading(true);
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Account setup unavailable. Check connection.');
      const { data: userData } = await sb.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error('No active session — please sign in first.');

      await upsertPrivateProfile(user.id, {
        email: user.email ?? '',
        firstName: firstName.trim(),
        side,
        ageGateStatus: side,
        anonymousHandle: handle.trim(),
        avatarKey: 'soft',
      });

      router.replace('/');
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
        <Text style={styles.tagline}>set up your space</Text>

        <Text style={styles.label}>first name</Text>
        <TextInput
          style={styles.input}
          placeholder="how we'll know you privately"
          placeholderTextColor="#555"
          value={firstName}
          onChangeText={t => { setFirstName(t); setError(''); }}
          autoCapitalize="words"
        />

        <Text style={styles.label}>anonymous handle</Text>
        <TextInput
          style={styles.input}
          placeholder="your public identity (no real name)"
          placeholderTextColor="#555"
          value={handle}
          onChangeText={t => { setHandle(t); setError(''); }}
          autoCapitalize="none"
        />
        {previewBipId ? (
          <Text style={styles.bipPreview}>Bip ID preview: {previewBipId}</Text>
        ) : null}

        <Text style={styles.label}>I am a…</Text>
        <View style={styles.sideRow}>
          <TouchableOpacity
            style={[styles.sideBtn, side === 'teen' && styles.sideBtnActive]}
            onPress={() => setSide('teen')}
          >
            <Text style={[styles.sideBtnText, side === 'teen' && styles.sideBtnTextActive]}>
              Teen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sideBtn, side === 'guardian' && styles.sideBtnActive]}
            onPress={() => setSide('guardian')}
          >
            <Text style={[styles.sideBtnText, side === 'guardian' && styles.sideBtnTextActive]}>
              Guardian
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.privacyNote}>
          Your first name stays private — only visible to trusted connections you approve.
          Your anonymous handle is what the community sees.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create my space</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#0d0d0d' },
  inner:           { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  logo:            { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  tagline:         { color: '#6d28d9', fontSize: 15, marginBottom: 36 },
  label:           { alignSelf: 'flex-start', color: '#94a3b8', fontSize: 12, marginBottom: 6, marginTop: 12 },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18, color: '#fff', fontSize: 15,
    backgroundColor: '#111', marginBottom: 4,
  },
  bipPreview:      { alignSelf: 'flex-start', color: '#6d28d9', fontSize: 12, marginBottom: 8 },
  sideRow:         { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 8, width: '100%' },
  sideBtn:         { flex: 1, borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#111' },
  sideBtnActive:   { borderColor: '#6d28d9', backgroundColor: '#1e1033' },
  sideBtnText:     { color: '#888', fontSize: 15, fontWeight: '600' },
  sideBtnTextActive: { color: '#c4b5fd' },
  privacyNote:     { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 12, marginBottom: 4 },
  error:           { color: '#f87171', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  btn: {
    width: '100%', backgroundColor: '#6d28d9', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 20,
  },
  btnText:         { color: '#fff', fontWeight: '700', fontSize: 16 },
});
