import React, { useState, useRef, useCallback } from 'react';
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
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useVerificationContext } from '@/context/VerificationContext';
import type { AccountSide } from '@/features/identity/accountProfile';
import {
  fetchPostAuthBootstrap,
  ONBOARDING_SIDE_KEY,
} from '@/services/auth/postAuthBootstrap';
import { getSupabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Error helpers (unchanged from original) ───────────────────────────────
function authErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}

function isAmbiguousSignupError(error: unknown): boolean {
  const msg = authErrorMessage(error).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('request timeout') ||
    msg.includes('request timed out') ||
    msg.includes('processing this request timed out') ||
    msg.includes('context deadline exceeded') ||
    msg.includes('gateway timeout') ||
    msg.includes('504')
  );
}

function isConfirmationPendingError(error: unknown): boolean {
  const msg = authErrorMessage(error).toLowerCase();
  return (
    msg.includes('email not confirmed') ||
    msg.includes('email_not_confirmed') ||
    (msg.includes('confirmation') && msg.includes('pending'))
  );
}

function hasAuthServerResponse(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('status' in error)) return false;
  const status = Number((error as { status?: unknown }).status);
  return Number.isFinite(status) && status >= 400;
}

function readableAuthError(error: unknown): string {
  if (isAmbiguousSignupError(error)) {
    if (hasAuthServerResponse(error)) {
      return 'The account server took too long to answer. Your account may still have been created, so check your email before trying again.';
    }
    return 'We could not reach the account server. Check your connection and try again.';
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SIGNUP_RECOVERY_DELAY_MS = 750;

// ─── Step config ───────────────────────────────────────────────────────────
const STEPS = 3; // 0: email+pw  1: username  2: birthday/done

export default function SignupScreen() {
  const params = useLocalSearchParams<{ side?: string }>();
  const preferredSide = normalizeSide(params.side);
  const { refreshVerification } = useVerificationContext();

  // Fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [username, setUsername] = useState('');
  const [pwVisible, setPwVisible] = useState(false);
  const [cfVisible, setCfVisible] = useState(false);

  // Flow
  const [step, setStep]         = useState(0);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const SCREEN_W  = 380;

  function animateToStep(nextStep: number) {
    const direction = nextStep > step ? 1 : -1;
    slideAnim.setValue(direction * SCREEN_W);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 22,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
    setStep(nextStep);
    setError('');
  }

  function shakeCard() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 30, useNativeDriver: true }),
    ]).start();
  }

  // ─── Auth helpers (unchanged logic) ──────────────────────────────────────
  const finishAuthenticatedSignup = useCallback(async (userId: string) => {
    await AsyncStorage.setItem(ONBOARDING_SIDE_KEY, preferredSide);
    const bootstrap = await fetchPostAuthBootstrap(preferredSide);
    await refreshVerification();
    router.replace(bootstrap.nextRoute as never);
  }, [preferredSide, refreshVerification]);

  function showConfirmationSuccess(message?: string) {
    setSuccessMessage(
      message ?? `We sent a confirmation link to ${email.trim()}.\nOpen it, then come back and sign in.`,
    );
    setSuccess(true);
  }

  async function recoverAmbiguousSignup(
    sb: NonNullable<ReturnType<typeof getSupabase>>,
    signupEmail: string,
    signupPassword: string,
    initialError: unknown,
  ): Promise<boolean> {
    await delay(SIGNUP_RECOVERY_DELAY_MS);
    const initialSignupReachedAuth = hasAuthServerResponse(initialError);
    try {
      const { data: signInData, error: signInError } =
        await sb.auth.signInWithPassword({ email: signupEmail, password: signupPassword });
      if (signInData.session?.user) {
        await finishAuthenticatedSignup(signInData.session.user.id);
        return true;
      }
      if (isConfirmationPendingError(signInError)) {
        showConfirmationSuccess(
          `Your account was created, but email confirmation is still pending for ${signupEmail}.\nCheck your inbox, then come back and sign in.`,
        );
        return true;
      }
    } catch (probeError) {
      if (!isAmbiguousSignupError(probeError)) return false;
    }
    try {
      const { data: retryData, error: retryError } =
        await sb.auth.signUp({ email: signupEmail, password: signupPassword });
      if (!retryError) {
        if (retryData.session?.user) {
          await finishAuthenticatedSignup(retryData.session.user.id);
        } else {
          showConfirmationSuccess();
        }
        return true;
      }
      if (isConfirmationPendingError(retryError)) {
        showConfirmationSuccess(
          `Your account was created, but email confirmation is still pending for ${signupEmail}.\nCheck your inbox, then come back and sign in.`,
        );
        return true;
      }
      const retryReachedAuth = hasAuthServerResponse(retryError);
      if (isAmbiguousSignupError(retryError) && (initialSignupReachedAuth || retryReachedAuth)) {
        showConfirmationSuccess(
          `The account server received your signup request, but confirmation is delayed for ${signupEmail}.\nCheck your inbox before trying again.`,
        );
        return true;
      }
    } catch (retryError) {
      if (isAmbiguousSignupError(retryError) && initialSignupReachedAuth) {
        showConfirmationSuccess(
          `The account server received your signup request, but confirmation is delayed for ${signupEmail}.\nCheck your inbox before trying again.`,
        );
        return true;
      }
    }
    return false;
  }

  // ─── Step 0 → 1: validate email/password, then slide ─────────────────────
  function handleNextStep0() {
    setError('');
    const e = email.trim();
    const p = password;
    if (!e) { setError('Enter your email address.'); shakeCard(); return; }
    if (p.length < 8) { setError('Password must be at least 8 characters.'); shakeCard(); return; }
    if (p !== confirm) { setError("Passwords don't match."); shakeCard(); return; }
    animateToStep(1);
  }

  // ─── Step 1 → 2: validate username ───────────────────────────────────────
  function handleNextStep1() {
    setError('');
    const u = username.trim();
    if (!u) { setError('Pick a username.'); shakeCard(); return; }
    if (u.length < 3) { setError('Username must be at least 3 characters.'); shakeCard(); return; }
    if (!/^[a-zA-Z0-9_.]+$/.test(u)) {
      setError('Username can only contain letters, numbers, . and _');
      shakeCard();
      return;
    }
    animateToStep(2);
  }

  // ─── Step 2: final signup submission ──────────────────────────────────────
  async function handleSignUp() {
    setError('');
    const e = email.trim();
    const p = password;

    setLoading(true);
    const sb = getSupabase();

    if (__DEV__) {
      console.log('[signup] sb=', sb ? 'ok' : 'NULL — check EXPO_PUBLIC_SUPABASE_URL/ANON_KEY');
      if (sb) {
        sb.auth.getSession().then(({ data, error: e2 }) => {
          console.log('[signup] session user=', data?.session?.user?.id ?? 'none',
            'anon=', data?.session?.user?.is_anonymous ?? false, 'err=', e2?.message ?? null);
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
      if (sessionError) { setError(sessionError.message); return; }

      const currentUser = sessionData.session?.user;
      const isAnonymous = Boolean(currentUser?.is_anonymous);

      if (isAnonymous) {
        const { data: refreshed0, error: refreshErr0 } = await sb.auth.getUser();
        if (refreshErr0 || !refreshed0.user?.is_anonymous) {
          await sb.auth.signOut();
        } else {
          const { error: upgradeError } = await sb.auth.updateUser({ email: e, password: p });
          if (upgradeError) {
            if (isAmbiguousSignupError(upgradeError)) {
              const recovered = await recoverAmbiguousSignup(sb, e, p, upgradeError);
              if (recovered) return;
            }
            const msg = upgradeError.message.toLowerCase();
            const emailExists =
              msg.includes('already registered') || msg.includes('already exists') ||
              msg.includes('duplicate') || msg.includes('email address is already');
            if (emailExists) {
              setError('That email already has a Bip account. Sign in instead so we can use that account safely.');
              return;
            }
            setError(readableAuthError(upgradeError));
            return;
          }
          const { data: refreshed, error: refreshError } = await sb.auth.getSession();
          if (!refreshError && refreshed.session?.user && !refreshed.session.user.is_anonymous) {
            await finishAuthenticatedSignup(refreshed.session.user.id);
          } else {
            showConfirmationSuccess();
          }
          return;
        }
      }

      const { data: signUpData, error: authErr } = await sb.auth.signUp({ email: e, password: p });
      if (authErr) {
        if (isAmbiguousSignupError(authErr)) {
          const recovered = await recoverAmbiguousSignup(sb, e, p, authErr);
          if (recovered) return;
        }
        setError(readableAuthError(authErr));
        shakeCard();
        return;
      }

      if (signUpData.session) {
        await finishAuthenticatedSignup(signUpData.session.user.id);
      } else {
        showConfirmationSuccess();
      }
    } catch (caught) {
      if (isAmbiguousSignupError(caught)) {
        const recovered = await recoverAmbiguousSignup(sb, e, p, caught);
        if (recovered) return;
      }
      setError(readableAuthError(caught));
      shakeCard();
    } finally {
      setLoading(false);
    }
  }

  // ─── Success screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={styles.root}>
        <View style={styles.successCard}>
          <Text style={styles.successEmoji}>📬</Text>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successBody}>{successMessage}</Text>
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

  // ─── Step labels ──────────────────────────────────────────────────────────
  const STEP_LABELS = ['Account', 'Username', 'Done'];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.bgDot1} pointerEvents="none" />
      <View style={styles.bgDot2} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoMark}>Bip</Text>
          <Text style={styles.logoHeart}>💜</Text>
        </View>
        <Text style={styles.wordmark}>Se'kret Bip</Text>
        <Text style={styles.tagline}>
          {preferredSide === 'parent' ? 'create your Parent Space' : 'create your space'}
        </Text>

        {/* Step dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>{STEP_LABELS[step]}</Text>

        {/* Animated step content */}
        <Animated.View style={[
          styles.stepContent,
          { transform: [{ translateX: slideAnim }, { translateX: shakeAnim }] },
        ]}>

          {/* ── Step 0: email + password ── */}
          {step === 0 && (
            <View style={styles.stepInner}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
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
              <View style={[styles.inputWrap, { marginBottom: 12 }]}>
                <TextInput
                  style={[styles.input, { paddingRight: 52 }]}
                  placeholder="Password (8+ characters)"
                  placeholderTextColor="#666"
                  secureTextEntry={!pwVisible}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={password}
                  editable={!loading}
                  onChangeText={t => { setPassword(t); setError(''); }}
                  accessibilityLabel="Password"
                />
                <Pressable style={styles.eyeBtn} onPress={() => setPwVisible(v => !v)}>
                  <Text style={styles.eyeText}>{pwVisible ? '🙈' : '👁'}</Text>
                </Pressable>
              </View>
              <View style={[styles.inputWrap, { marginBottom: 4 }]}>
                <TextInput
                  style={[styles.input, { paddingRight: 52 }]}
                  placeholder="Confirm password"
                  placeholderTextColor="#666"
                  secureTextEntry={!cfVisible}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={confirm}
                  editable={!loading}
                  onChangeText={t => { setConfirm(t); setError(''); }}
                  onSubmitEditing={handleNextStep0}
                  returnKeyType="next"
                  accessibilityLabel="Confirm password"
                />
                <Pressable style={styles.eyeBtn} onPress={() => setCfVisible(v => !v)}>
                  <Text style={styles.eyeText}>{cfVisible ? '🙈' : '👁'}</Text>
                </Pressable>
              </View>

              {error ? <Text style={styles.errorText} accessibilityRole="alert">{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, (!email || password.length < 8) && styles.btnDim]}
                onPress={handleNextStep0}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Next"
              >
                <Text style={styles.btnText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 1: username ── */}
          {step === 1 && (
            <View style={styles.stepInner}>
              <Text style={styles.stepHint}>Choose a username people will know you by.</Text>
              <View style={[styles.inputWrap, { marginBottom: 4 }]}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 4 }]}
                  placeholder="username"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  value={username}
                  editable={!loading}
                  onChangeText={t => { setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, '')); setError(''); }}
                  onSubmitEditing={handleNextStep1}
                  returnKeyType="next"
                  accessibilityLabel="Username"
                />
              </View>

              {error ? <Text style={styles.errorText} accessibilityRole="alert">{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, username.length < 3 && styles.btnDim]}
                onPress={handleNextStep1}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Next"
              >
                <Text style={styles.btnText}>Next</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => animateToStep(0)}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: confirm + submit ── */}
          {step === 2 && (
            <View style={styles.stepInner}>
              <Text style={styles.stepHint}>You're almost in 🎉</Text>

              <View style={styles.reviewCard}>
                <ReviewRow label="Email" value={email.trim()} />
                <ReviewRow label="Username" value={`@${username.trim()}`} />
                <ReviewRow label="Account" value={preferredSide === 'parent' ? 'Parent Space' : 'Teen Space'} />
              </View>

              {error ? <Text style={styles.errorText} accessibilityRole="alert">{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDim]}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Create Account"
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>Create account</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => animateToStep(1)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Switch to login */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Have an account?</Text>
          <TouchableOpacity
            onPress={() => router.replace(loginRoute(preferredSide) as never)}
            accessibilityRole="link"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.switchCta}> Log in.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={reviewStyles.row}>
      <Text style={reviewStyles.label}>{label}</Text>
      <Text style={reviewStyles.value}>{value}</Text>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2a',
  },
  label: { color: '#888', fontSize: 13 },
  value: { color: '#f3f3f5', fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});

const PURPLE      = '#7c3aed';
const PURPLE_DIM  = '#4c1d95';
const BG          = '#0a0a0a';
const BORDER      = '#1e1e2a';
const TEXT        = '#f3f3f5';
const MUTED       = '#888';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

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

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
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
    color: TEXT, fontSize: 24, fontWeight: '800',
    letterSpacing: -0.3, marginBottom: 4,
  },
  tagline: { color: MUTED, fontSize: 13, marginBottom: 20, letterSpacing: 0.2 },

  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#2a2a3a',
  },
  dotActive: { backgroundColor: PURPLE, width: 22 },
  stepLabel: { color: MUTED, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 24 },

  stepContent: { width: '100%' },
  stepInner:   { width: '100%' },

  stepHint: {
    color: TEXT, fontSize: 15, fontWeight: '600',
    marginBottom: 20, textAlign: 'center',
  },

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
  input: {
    flex: 1, paddingVertical: 15,
    paddingHorizontal: 16,
    color: TEXT, fontSize: 15,
  },
  atSign: {
    color: MUTED, fontSize: 18,
    paddingLeft: 14, paddingRight: 2,
    fontWeight: '600',
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 15 },
  eyeText: { fontSize: 16 },

  errorText: {
    color: '#f87171', fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 8, marginLeft: 2,
  },

  btn: {
    width: '100%',
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDim: { backgroundColor: PURPLE_DIM, shadowOpacity: 0 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },

  backBtn: { alignSelf: 'center', paddingVertical: 8 },
  backText: { color: MUTED, fontSize: 13 },

  reviewCard: {
    width: '100%',
    backgroundColor: '#16161e',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  switchLabel: { color: MUTED, fontSize: 14 },
  switchCta: { color: '#a78bfa', fontSize: 14, fontWeight: '700' },

  // Success
  successCard: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  successEmoji: { fontSize: 52, marginBottom: 16 },
  successTitle: { color: TEXT, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  successBody: {
    color: MUTED, fontSize: 15,
    textAlign: 'center', lineHeight: 22, marginBottom: 36,
  },
});
