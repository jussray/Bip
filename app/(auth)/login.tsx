import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Pressable,
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
  const [pwVisible, setPwVisible] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shakeCard() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 40,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 40,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 30,  useNativeDriver: true }),
    ]).start();
  }

  async function handleSignIn() {
    setError('');
    const e = email.trim();
    const p = password;
    if (!e || !p) {
      setError('Email and password are required.');
      shakeCard();
      return;
    }

    setLoading(true);
    const sb = getSupabase();
    if (!sb) {
      setError('Auth unavailable. Check the Supabase app configuration.');
      setLoading(false);
      return;
    }

    try {
      const { error: authErr } = await sb.auth.signInWithPassword({ email: e, password: p });
      if (authErr) {
        setError(authErr.message);
        shakeCard();
        return;
      }
      const bootstrap = await fetchPostAuthBootstrap(preferredSide);
      await refreshVerification();
      router.replace(bootstrap.nextRoute as never);
    } catch (caught) {
      setError(readableAuthError(caught));
      shakeCard();
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background gradient dots — decorative */}
      <View style={styles.bgDot1} pointerEvents="none" />
      <View style={styles.bgDot2} pointerEvents="none" />

      <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoMark}>Bip</Text>
          <Text style={styles.logoHeart}>💜</Text>
        </View>

        <Text style={styles.wordmark}>Se'kret Bip</Text>
        <Text style={styles.tagline}>sign in to continue</Text>

        {passwordReset ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              Password updated. Sign in with your new password.
            </Text>
          </View>
        ) : null}

        {/* Email */}
        <View style={[styles.inputWrap, error && email.length === 0 && styles.inputError]}>
          <TextInput
            style={styles.input}
            placeholder="Phone number, username or email"
            placeholderTextColor="#666"
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
        </View>

        {/* Password */}
        <View style={[styles.inputWrap, { marginBottom: 6 }]}>
          <TextInput
            style={[styles.input, { paddingRight: 52 }]}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry={!pwVisible}
            autoComplete="current-password"
            textContentType="password"
            value={password}
            editable={!loading}
            onChangeText={t => { setPassword(t); setError(''); }}
            onSubmitEditing={handleSignIn}
            returnKeyType="go"
            accessibilityLabel="Password"
          />
          <Pressable
            style={styles.eyeBtn}
            onPress={() => setPwVisible(v => !v)}
            accessibilityLabel={pwVisible ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.eyeText}>{pwVisible ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>

        {/* Error */}
        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
        ) : null}

        {/* Forgot */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotRow}
          accessibilityRole="link"
          accessibilityLabel="Forgot password"
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Sign In CTA */}
        <TouchableOpacity
          style={[styles.btn, (loading || !email || !password) && styles.btnDim]}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Sign In"
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnText}>Log in</Text>
          }
        </TouchableOpacity>

        {/* OR divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Switch to signup */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => router.push(authRoute('/(auth)/signup', preferredSide) as never)}
            accessibilityRole="link"
            accessibilityLabel="Sign up"
          >
            <Text style={styles.switchCta}> Sign up.</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const PURPLE = '#7c3aed';
const PURPLE_DIM = '#4c1d95';
const BG = '#0a0a0a';
const CARD = '#111218';
const BORDER = '#1e1e2a';
const TEXT = '#f3f3f5';
const MUTED = '#888';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Atmospheric background dots
  bgDot1: {
    position: 'absolute', width: 340, height: 340,
    borderRadius: 170, backgroundColor: '#4c1d9520',
    top: -80, right: -100,
  },
  bgDot2: {
    position: 'absolute', width: 260, height: 260,
    borderRadius: 130, backgroundColor: '#7c3aed12',
    bottom: 60, left: -80,
  },

  card: {
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
  },

  logoWrap: {
    width: 64, height: 64,
    borderRadius: 20,
    backgroundColor: PURPLE_DIM,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  logoMark: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  logoHeart: { fontSize: 11, position: 'absolute', bottom: 8, right: 9 },

  wordmark: {
    color: TEXT,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  tagline: {
    color: MUTED,
    fontSize: 13,
    marginBottom: 28,
    letterSpacing: 0.2,
  },

  successBanner: {
    width: '100%',
    backgroundColor: '#1a1030',
    borderWidth: 1,
    borderColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  successBannerText: { color: '#c4b5fd', fontSize: 13, textAlign: 'center', lineHeight: 18 },

  inputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: '#16161e',
    marginBottom: 12,
    overflow: 'hidden',
  },
  inputError: { borderColor: '#ef4444' },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 16,
    color: TEXT,
    fontSize: 15,
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 15 },
  eyeText: { fontSize: 16 },

  errorText: {
    color: '#f87171',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginLeft: 2,
  },

  forgotRow: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },

  btn: {
    width: '100%',
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDim: { backgroundColor: PURPLE_DIM, shadowOpacity: 0 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },

  dividerRow: {
    width: '100%', flexDirection: 'row',
    alignItems: 'center', marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { color: MUTED, fontSize: 12, fontWeight: '600', marginHorizontal: 12, letterSpacing: 1 },

  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { color: MUTED, fontSize: 14 },
  switchCta: { color: '#a78bfa', fontSize: 14, fontWeight: '700' },
});
