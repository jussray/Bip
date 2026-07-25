import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useVerificationContext } from '@/context/VerificationContext';
import type { AccountSide } from '@/features/identity/accountProfile';
import {
  fetchPostAuthBootstrap,
  ONBOARDING_SIDE_KEY,
} from '@/services/auth/postAuthBootstrap';
import { getSupabase } from '@/utils/supabase';

function normalizeSide(value: string | undefined): AccountSide {
  return value === 'parent' ? 'parent' : 'teen';
}

function loginRoute(side: AccountSide): string {
  return `/(auth)/login?side=${side}`;
}

function confirmationRedirectUrl(side: AccountSide): string {
  const query = `emailConfirmed=1&side=${encodeURIComponent(side)}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/(auth)/login?${query}`;
  }
  return Linking.createURL('/(auth)/login', {
    queryParams: { emailConfirmed: '1', side },
  });
}

function signupMetadata(username: string, side: AccountSide) {
  return {
    username: username.trim(),
    account_side: side,
    signup_source: 'sekret-bip-app',
  };
}

function readableAuthError(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'That email already has a Bip account. Sign in instead.';
  }
  if (lower.includes('failed to fetch')) {
    return 'Could not reach the account server. Check your connection and try again.';
  }
  return message || 'Something went wrong while creating your account. Please try again.';
}

const STEPS = 3;

export default function SignupScreen() {
  const params = useLocalSearchParams<{ side?: string }>();
  const preferredSide = normalizeSide(params.side);
  const { refreshVerification } = useVerificationContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [pwVisible, setPwVisible] = useState(false);
  const [cfVisible, setCfVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function animateToStep(next: number) {
    slideAnim.setValue(next > step ? 320 : -320);
    setStep(next);
    setError('');
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 22,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }

  function shakeCard() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  const finishAuthenticatedSignup = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_SIDE_KEY, preferredSide);
    const bootstrap = await fetchPostAuthBootstrap(preferredSide);
    await refreshVerification();
    router.replace(bootstrap.nextRoute as never);
  }, [preferredSide, refreshVerification]);

  function validateAccountStep() {
    setError('');
    if (!email.trim()) {
      setError('Enter your email address.');
      shakeCard();
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      shakeCard();
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      shakeCard();
      return;
    }
    animateToStep(1);
  }

  function validateUsernameStep() {
    setError('');
    const value = username.trim();
    if (value.length < 3) {
      setError('Username must be at least 3 characters.');
      shakeCard();
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(value)) {
      setError('Letters, numbers, . and _ only.');
      shakeCard();
      return;
    }
    animateToStep(2);
  }

  async function handleSignUp() {
    setError('');
    setLoading(true);
    const sb = getSupabase();
    if (!sb) {
      setError('Auth unavailable. Check the Supabase app configuration.');
      setLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const metadata = signupMetadata(username, preferredSide);
    const redirectTo = confirmationRedirectUrl(preferredSide);

    try {
      await AsyncStorage.setItem(ONBOARDING_SIDE_KEY, preferredSide);
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError) throw sessionError;

      const currentUser = sessionData.session?.user;
      if (currentUser?.is_anonymous) {
        const { data, error: upgradeError } = await sb.auth.updateUser(
          {
            email: normalizedEmail,
            password,
            data: metadata,
          },
          { emailRedirectTo: redirectTo },
        );
        if (upgradeError) throw upgradeError;
        if (data.user && !data.user.is_anonymous && data.user.email_confirmed_at) {
          await finishAuthenticatedSignup();
        } else {
          setSuccess(true);
        }
        return;
      }

      const { data, error: signupError } = await sb.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: metadata,
        },
      });
      if (signupError) throw signupError;
      if (data.session) {
        await finishAuthenticatedSignup();
      } else {
        setSuccess(true);
      }
    } catch (caught) {
      setError(readableAuthError(caught));
      shakeCard();
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={s.rootCenter}>
        <Text style={s.successEmoji}>📬</Text>
        <Text style={s.title}>Check your email</Text>
        <Text style={s.body}>
          We sent a {preferredSide === 'parent' ? 'Parent Space' : 'Teen Space'} confirmation link to {email.trim()}.
        </Text>
        <TouchableOpacity style={s.btn} onPress={() => router.replace(loginRoute(preferredSide) as never)}>
          <Text style={s.btnText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const labels = ['Account', 'Username', 'Done'];
  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.wordmark}>Se'kret Bip</Text>
        <Text style={s.heart}>♡</Text>
        <Text style={s.tagline}>{preferredSide === 'parent' ? 'create your Parent Space' : 'create your space'}</Text>
        <View style={s.dotsRow}>
          {Array.from({ length: STEPS }).map((_, index) => (
            <View key={index} style={[s.dot, index === step && s.dotActive]} />
          ))}
        </View>
        <Text style={s.stepLabel}>{labels[step]}</Text>

        <Animated.View style={[s.card, { transform: [{ translateX: slideAnim }, { translateX: shakeAnim }] }]}>
          {step === 0 ? (
            <>
              <Input value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />
              <PasswordInput value={password} onChangeText={setPassword} placeholder="Password (8+ characters)" visible={pwVisible} toggle={() => setPwVisible(v => !v)} />
              <PasswordInput value={confirm} onChangeText={setConfirm} placeholder="Confirm password" visible={cfVisible} toggle={() => setCfVisible(v => !v)} />
              <ErrorText value={error} />
              <PrimaryButton label="Next" onPress={validateAccountStep} />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={s.body}>Choose a username people will know you by.</Text>
              <Input
                value={username}
                onChangeText={value => setUsername(value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="username"
              />
              <ErrorText value={error} />
              <PrimaryButton label="Next" onPress={validateUsernameStep} />
              <BackButton onPress={() => animateToStep(0)} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <View style={s.reviewCard}>
                <ReviewRow label="Email" value={email.trim()} />
                <ReviewRow label="Username" value={`@${username.trim()}`} />
                <ReviewRow label="Account" value={preferredSide === 'parent' ? 'Parent Space' : 'Teen Space'} />
              </View>
              <ErrorText value={error} />
              <PrimaryButton label="Create account" onPress={handleSignUp} loading={loading} />
              <BackButton onPress={() => animateToStep(1)} disabled={loading} />
            </>
          ) : null}
        </Animated.View>

        <View style={s.switchRow}>
          <Text style={s.muted}>Have an account?</Text>
          <TouchableOpacity onPress={() => router.replace(loginRoute(preferredSide) as never)}>
            <Text style={s.link}> Log in.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <View style={s.inputWrap}>
      <TextInput
        {...props}
        style={s.input}
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function PasswordInput({ value, onChangeText, placeholder, visible, toggle }: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  visible: boolean;
  toggle: () => void;
}) {
  return (
    <View style={s.inputWrap}>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        secureTextEntry={!visible}
        autoCapitalize="none"
      />
      <Pressable onPress={toggle} style={s.eyeBtn}><Text>{visible ? '🙈' : '👁'}</Text></Pressable>
    </View>
  );
}

function PrimaryButton({ label, onPress, loading = false }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <TouchableOpacity style={[s.btn, loading && s.btnDim]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

function BackButton({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity onPress={onPress} disabled={disabled}><Text style={s.backText}>← Back</Text></TouchableOpacity>;
}

function ErrorText({ value }: { value: string }) {
  return value ? <Text style={s.errorText} accessibilityRole="alert">{value}</Text> : null;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return <View style={s.reviewRow}><Text style={s.muted}>{label}</Text><Text style={s.reviewValue}>{value}</Text></View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  rootCenter: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 32 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { width: '100%', maxWidth: 380 },
  wordmark: { color: '#f3f3f5', fontSize: 32, fontWeight: '800' },
  heart: { color: '#7c3aed', fontSize: 18, marginBottom: 10 },
  tagline: { color: '#666', fontSize: 13, marginBottom: 20 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2a2a3a' },
  dotActive: { width: 22, backgroundColor: '#7c3aed' },
  stepLabel: { color: '#666', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 24 },
  inputWrap: { width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a35', borderRadius: 10, backgroundColor: '#111118', marginBottom: 12 },
  input: { flex: 1, color: '#f3f3f5', paddingHorizontal: 14, paddingVertical: 14, fontSize: 14 },
  eyeBtn: { padding: 14 },
  btn: { width: '100%', backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 6, marginBottom: 14 },
  btnDim: { backgroundColor: '#4c1d95' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  backText: { color: '#888', textAlign: 'center', paddingVertical: 8 },
  errorText: { color: '#f87171', fontSize: 12, marginBottom: 8 },
  reviewCard: { width: '100%', backgroundColor: '#111118', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a35', paddingHorizontal: 16, marginBottom: 16 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a35' },
  reviewValue: { color: '#f3f3f5', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  switchRow: { flexDirection: 'row', marginTop: 8 },
  muted: { color: '#666', fontSize: 14 },
  link: { color: '#a78bfa', fontSize: 14, fontWeight: '700' },
  title: { color: '#f3f3f5', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  body: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  successEmoji: { fontSize: 52, marginBottom: 16 },
});
