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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  PARENT_INVITE_CODE_LENGTH,
  normalizeParentInviteCode,
  redeemInviteCodeResult as redeemInviteCode,
} from '@/utils/parentLink';
import { useAppContext } from '@/context/AppContext';

export default function ParentLinkOnboarding() {
  const { setUserSide } = useAppContext();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalized = normalizeParentInviteCode(code);
  const ready = normalized.length === PARENT_INVITE_CODE_LENGTH && !loading;

  async function handleLink() {
    if (!ready) {
      setError('Enter the full eight-character code from your teen.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await redeemInviteCode(normalized);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setUserSide('parent');
      await AsyncStorage.multiSet([
        ['parent_profile_done', 'true'],
        ['linked_teen_id', result.value],
      ]);
      router.replace('/(parent)/room');
    } catch {
      setError('Could not connect right now. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#071410', '#0d1f18', '#08140f']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>LINK YOUR TEEN</Text>
        <Text style={styles.title}>Enter their private code.</Text>
        <Text style={styles.body}>
          Your teen creates an eight-character code from Limited Mode. Enter it here to connect your accounts and finish verification.
        </Text>

        <View style={styles.codeWrap}>
          <TextInput
            value={normalized}
            onChangeText={text => {
              setCode(text);
              setError('');
            }}
            placeholder="AB12CD34"
            placeholderTextColor="#355246"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={PARENT_INVITE_CODE_LENGTH}
            returnKeyType="go"
            onSubmitEditing={handleLink}
            style={styles.codeInput}
            accessibilityLabel="Teen private invite code"
          />
        </View>

        <Text style={styles.privacy}>
          This code only establishes the trusted teen-parent connection. You will only see what your teen intentionally sends through Bridge.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          disabled={!ready}
          onPress={handleLink}
          activeOpacity={0.85}
          style={[styles.primary, !ready && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color="#062015" />
          ) : (
            <Text style={styles.primaryText}>Approve and connect</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(onboarding)/parent-welcome')} style={styles.help}>
          <Text style={styles.helpText}>I do not have a code yet</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08140f' },
  content: { flex: 1, paddingTop: Platform.OS === 'ios' ? 68 : 46, paddingHorizontal: 28 },
  back: { marginBottom: 28 },
  backText: { color: '#789082', fontSize: 22 },
  kicker: { color: '#6ee7b7', fontSize: 10, fontWeight: '900', letterSpacing: 2.5, marginBottom: 12 },
  title: { color: '#fff', fontSize: 36, lineHeight: 42, fontWeight: '900', marginBottom: 14 },
  body: { color: '#b7c9bf', fontSize: 15, lineHeight: 23, marginBottom: 32 },
  codeWrap: { borderRadius: 22, borderWidth: 1.5, borderColor: '#a7f3d044', backgroundColor: '#ffffff08', paddingHorizontal: 20, marginBottom: 18 },
  codeInput: { height: 86, color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: 6, textAlign: 'center' },
  privacy: { color: '#789082', fontSize: 12, lineHeight: 18, marginBottom: 18 },
  error: { color: '#fca5a5', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 14 },
  primary: { height: 60, borderRadius: 20, backgroundColor: '#a7f3d0', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  primaryText: { color: '#062015', fontSize: 16, fontWeight: '900' },
  help: { alignItems: 'center', paddingVertical: 22 },
  helpText: { color: '#789082', fontSize: 13, fontWeight: '700' },
});
