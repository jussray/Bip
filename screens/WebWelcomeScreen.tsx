import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { AccountSide } from '@/features/identity/accountProfile';

const TEEN_HERO = require('../assets/brand/sekret-bip-teen-family-v1.jpg');
const BIP_JR_HERO = require('../assets/images/parent-space-splash.png');

type WebWelcomeScreenProps = {
  onEnter: (side: AccountSide) => void;
  variant?: AccountSide;
  showSignIn?: boolean;
};

function getPreviewVariant(variant: AccountSide): AccountSide {
  if (typeof window === 'undefined') return variant;
  const override = new URLSearchParams(window.location.search).get('bipDevSide');
  return override === 'teen' || override === 'parent' ? override : variant;
}

export function WebWelcomeScreen({ onEnter, variant = 'teen', showSignIn = false }: WebWelcomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const compact = width < 520;
  const shellHeight = compact ? height : Math.min(height, 900);
  const activeVariant = getPreviewVariant(variant);
  const isBipJr = activeVariant === 'parent';

  const copy = isBipJr
    ? {
        eyebrow: 'YOUR FAMILY. YOUR SPACE.',
        subtitle: 'A safe little world where families can stay close while every child still has room to grow.',
        hero: BIP_JR_HERO,
        heroLabel: 'The Bip Jr family welcome artwork',
      }
    : {
        eyebrow: 'YOUR PEOPLE. YOUR PEACE.',
        subtitle: 'A safe little world where teens and parents can stay close without losing their own space.',
        hero: TEEN_HERO,
        heroLabel: 'Night on the left, Suhana in the center, Sy on the right, Cloud, and their parents together',
      };

  return (
    <View style={[styles.page, { minHeight: height }]}>
      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientBottom} />
      <View
        testID="web-welcome-shell"
        accessibilityLabel={isBipJr ? 'Bip Jr welcome' : "Se'kret Bip teen welcome"}
        style={[styles.shell, { height: shellHeight }, compact && styles.shellCompact]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.topBar}>
            <View accessibilityLabel="About Se'kret Bip" style={styles.roundButton}><Text style={styles.roundButtonText}>i</Text></View>
            <View style={styles.wordmark}>
              <LinearGradient colors={['#f07bc3', '#8b64ff', '#596be1']} style={styles.wordmarkBadge}><Text style={styles.wordmarkHeart}>♡</Text></LinearGradient>
              <Text style={styles.wordmarkText}>{isBipJr ? 'BIP JR' : 'SE’KRET BIP'}</Text>
            </View>
            <View accessibilityLabel="Welcome sound" style={styles.roundButton}><Text style={styles.music}>♪</Text></View>
          </View>

          <View style={styles.copy}>
            <Text testID="web-welcome-eyebrow" style={styles.eyebrow}>{copy.eyebrow}</Text>
            <View style={styles.titleRow}><Text style={styles.title}>Come on in.</Text><Text style={styles.spark}>✦</Text></View>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <View style={[styles.heroWrap, compact && styles.heroWrapCompact, isBipJr && styles.heroWrapBipJr]}>
            <View style={styles.heroGlow} />
            <Image
              testID={isBipJr ? 'web-welcome-hero-bip-jr' : 'web-welcome-hero-teen'}
              source={copy.hero}
              resizeMode={isBipJr ? 'contain' : 'cover'}
              style={[styles.hero, isBipJr && styles.heroBipJr]}
              accessibilityLabel={copy.heroLabel}
            />
          </View>

          {!isBipJr && <Text style={styles.handNote}>☁  stay awhile. you’re safe here.</Text>}
          {isBipJr && <Text testID="web-welcome-bip-jr-note" style={styles.handNote}>Built for trust. Made for real families.</Text>}

          <Pressable
            testID="web-welcome-enter"
            accessibilityRole="button"
            accessibilityLabel={isBipJr ? 'Bip Jr — enter your family space' : "Se'kret Bip — enter your safe space"}
            onPress={() => onEnter(activeVariant)}
          >
            {({ pressed }) => (
              <LinearGradient
                colors={['#6549e7', '#9c63ed', '#dc68b1']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.enterButton, pressed && styles.enterPressed]}
              >
                <Text style={styles.enterText}>Enter Se’kret Bip</Text>
                <View style={styles.enterHeartBadge}><Text style={styles.enterHeart}>♡</Text></View>
              </LinearGradient>
            )}
          </Pressable>

          {showSignIn && (
            <Pressable
              testID="web-welcome-sign-in"
              accessibilityRole="button"
              accessibilityLabel="Sign in to your existing Se'kret Bip account"
              onPress={() => router.push(`/(auth)/login?side=${activeVariant}` as never)}
              style={({ pressed }) => [styles.signInButton, pressed && styles.signInPressed]}
            >
              <Text style={styles.signInPrompt}>Already have an account?</Text>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#05030f' },
  ambientTop: { position: 'absolute', width: 520, height: 520, top: -220, right: -160, borderRadius: 260, backgroundColor: 'rgba(137,91,241,.22)' },
  ambientBottom: { position: 'absolute', width: 460, height: 460, bottom: -210, left: -160, borderRadius: 230, backgroundColor: 'rgba(231,81,162,.15)' },
  shell: { width: '100%', maxWidth: 430, maxHeight: 900, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.13)', borderRadius: 38, backgroundColor: '#120927', boxShadow: '0 40px 110px rgba(0,0,0,.66)' as never },
  shellCompact: { maxWidth: '100%', borderRadius: 0, borderWidth: 0 },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  topBar: { height: 78, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(220,199,255,.2)', backgroundColor: 'rgba(255,255,255,.05)', alignItems: 'center', justifyContent: 'center' },
  roundButtonText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  music: { color: '#fff', fontSize: 18 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkBadge: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  wordmarkHeart: { color: '#fff', fontSize: 20, fontWeight: '700' },
  wordmarkText: { color: '#f2edff', fontSize: 14, fontWeight: '900', letterSpacing: 3.2 },
  copy: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 12 },
  eyebrow: { color: '#bda8ee', fontSize: 12, fontWeight: '800', letterSpacing: 3.2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
  title: { color: '#fff', fontFamily: 'Georgia', fontSize: 48, lineHeight: 54, letterSpacing: -2 },
  spark: { color: '#f2a4d5', fontSize: 18, marginLeft: 8, marginTop: 3 },
  subtitle: { color: '#c9bddf', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 350, marginTop: 10 },
  heroWrap: { height: 430, marginTop: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  heroWrapCompact: { height: 360 },
  heroWrapBipJr: { marginHorizontal: 18, marginTop: 14, borderRadius: 34, backgroundColor: '#0d1732' },
  heroGlow: { position: 'absolute', width: 340, height: 340, left: '50%', top: 35, marginLeft: -170, borderRadius: 170, backgroundColor: 'rgba(142,89,255,.18)' },
  hero: { width: '100%', height: '100%' },
  heroBipJr: { borderRadius: 34 },
  handNote: { color: '#c4aed7', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 8, marginBottom: 12 },
  enterButton: { minHeight: 72, marginHorizontal: 34, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, boxShadow: '0 16px 30px rgba(101,65,219,.35)' as never },
  enterPressed: { opacity: .84, transform: [{ scale: .99 }] },
  enterText: { color: '#fff', fontSize: 23, fontWeight: '800' },
  enterHeartBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  enterHeart: { color: '#fff', fontSize: 28, lineHeight: 32 },
  signInButton: { minHeight: 48, marginHorizontal: 34, marginTop: 10, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  signInPressed: { opacity: .7 },
  signInPrompt: { color: '#a99dbc', fontSize: 14 },
  signInText: { color: '#f1d3ff', fontSize: 14, fontWeight: '900', textDecorationLine: 'underline' },
});