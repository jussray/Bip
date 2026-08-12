import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
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
import { FRONT_DOOR_THEME } from '@/constants/frontDoorTheme';
import { FRONT_DOOR_MOTION } from '@/motion/frontDoorMotion';

const TEEN_HERO = require('../assets/brand/sekret-bip-teen-family-v1.jpg');
const BIP_JR_HERO = require('../assets/images/parent-space-splash.png');

export type WelcomeAudience = 'teen' | 'bip-jr';

type WebWelcomeScreenProps = {
  onEnter: (side: AccountSide) => void;
  variant?: AccountSide;
  audience?: WelcomeAudience;
  showSignIn?: boolean;
};

export function welcomeAudienceForAccountSide(side: AccountSide): WelcomeAudience {
  return side === 'parent' ? 'bip-jr' : 'teen';
}

export function accountSideForWelcomeAudience(audience: WelcomeAudience): AccountSide {
  return audience === 'bip-jr' ? 'parent' : 'teen';
}

function getPreviewAudience(defaultAudience: WelcomeAudience): WelcomeAudience {
  if (typeof window === 'undefined') return defaultAudience;

  const params = new URLSearchParams(window.location.search);
  const audienceOverride = params.get('bipDevAudience');
  if (audienceOverride === 'teen' || audienceOverride === 'bip-jr') {
    return audienceOverride;
  }

  const legacySideOverride = params.get('bipDevSide');
  if (legacySideOverride === 'teen' || legacySideOverride === 'parent') {
    return welcomeAudienceForAccountSide(legacySideOverride);
  }

  return defaultAudience;
}

export function WebWelcomeScreen({
  onEnter,
  variant = 'teen',
  audience,
  showSignIn = false,
}: WebWelcomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const motionEnabled = reduceMotion === false;
  const compact = width < 520;
  const shortViewport = compact && height < 700;
  const shellHeight = compact ? height : Math.min(height, 900);
  const defaultAudience = audience ?? welcomeAudienceForAccountSide(variant);
  const activeAudience = getPreviewAudience(defaultAudience);
  const entrySide = accountSideForWelcomeAudience(activeAudience);
  const isBipJr = activeAudience === 'bip-jr';
  const heroContract = isBipJr
    ? FRONT_DOOR_THEME.heroSafeArea.bipJr
    : FRONT_DOOR_THEME.heroSafeArea.teen;
  const heroHeight = shortViewport
    ? heroContract.shortHeight
    : compact
      ? heroContract.compactHeight
      : heroContract.desktopHeight;
  const worldPulse = useRef(new Animated.Value(0)).current;
  const heroDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (mounted) setReduceMotion(value);
      })
      .catch(() => {
        if (mounted) setReduceMotion(true);
      });

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (!motionEnabled) {
      worldPulse.stopAnimation();
      heroDrift.stopAnimation();
      worldPulse.setValue(FRONT_DOOR_MOTION.reducedPulseRestValue);
      heroDrift.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(worldPulse, {
          toValue: 1,
          duration: FRONT_DOOR_MOTION.pulseDurationMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(worldPulse, {
          toValue: 0,
          duration: FRONT_DOOR_MOTION.pulseDurationMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroDrift, {
          toValue: 1,
          duration: FRONT_DOOR_MOTION.driftDurationMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroDrift, {
          toValue: 0,
          duration: FRONT_DOOR_MOTION.driftDurationMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    driftLoop.start();

    return () => {
      pulseLoop.stop();
      driftLoop.stop();
    };
  }, [heroDrift, motionEnabled, worldPulse]);

  const ambientMotionStyle = motionEnabled
    ? {
        opacity: worldPulse.interpolate({
          inputRange: [0, 1],
          outputRange: FRONT_DOOR_MOTION.ambientOpacity,
        }),
        transform: [
          {
            scale: worldPulse.interpolate({
              inputRange: [0, 1],
              outputRange: FRONT_DOOR_MOTION.ambientScale,
            }),
          },
        ],
      }
    : {
        opacity: 0.84,
        transform: [{ scale: 1 }],
      };
  const heroMotionStyle = motionEnabled
    ? {
        transform: [
          {
            translateY: heroDrift.interpolate({
              inputRange: [0, 1],
              outputRange: FRONT_DOOR_MOTION.heroTranslateY,
            }),
          },
          {
            scale: worldPulse.interpolate({
              inputRange: [0, 1],
              outputRange: FRONT_DOOR_MOTION.heroScale,
            }),
          },
        ],
      }
    : {
        transform: [{ translateY: 0 }, { scale: 1 }],
      };
  const sparkMotionStyle = motionEnabled
    ? {
        opacity: worldPulse.interpolate({
          inputRange: [0, 1],
          outputRange: FRONT_DOOR_MOTION.sparkOpacity,
        }),
        transform: [
          {
            translateY: heroDrift.interpolate({
              inputRange: [0, 1],
              outputRange: FRONT_DOOR_MOTION.sparkTranslateY,
            }),
          },
          {
            rotate: worldPulse.interpolate({
              inputRange: [0, 1],
              outputRange: FRONT_DOOR_MOTION.sparkRotate,
            }),
          },
        ],
      }
    : {
        opacity: 0.86,
        transform: [{ translateY: 0 }, { rotate: '0deg' }],
      };

  const copy = isBipJr
    ? {
        eyebrow: 'YOUR FAMILY. YOUR SPACE.',
        subtitle: 'A playful family space where everyone can stay connected and every child still has room to grow.',
        hero: BIP_JR_HERO,
        heroLabel: 'The Bip Jr family welcome artwork',
        note: 'Made for real family rhythms.',
        enterLabel: 'Bip Jr family welcome — continue to family setup',
      }
    : {
        eyebrow: 'YOUR PEOPLE. YOUR PEACE.',
        subtitle: 'A close-knit world where teens and parents can stay connected without losing their own space.',
        hero: TEEN_HERO,
        heroLabel: 'Night on the left, Suhana in the center, Sy on the right, Cloud, and their parents together',
        note: '☁  stay awhile. start when you’re ready.',
        enterLabel: "Se'kret Bip teen welcome — continue to age setup",
      };

  return (
    <View style={[styles.page, { minHeight: height }]}>
      <Animated.View pointerEvents="none" style={[styles.ambientTop, ambientMotionStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientBottom, ambientMotionStyle]} />
      <View
        pointerEvents="none"
        testID="web-welcome-living-world"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.livingWorld}
      >
        <Animated.Text style={[styles.livingMoon, sparkMotionStyle]}>☾</Animated.Text>
        <Animated.Text style={[styles.livingStar, sparkMotionStyle]}>✦</Animated.Text>
        <Animated.Text style={[styles.livingCloud, sparkMotionStyle]}>☁</Animated.Text>
      </View>
      <View
        testID="web-welcome-shell"
        accessibilityLabel={isBipJr ? 'Bip Jr welcome' : "Se'kret Bip teen welcome"}
        style={[styles.shell, { height: shellHeight }, compact && styles.shellCompact]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.topBar}>
            <Pressable
              testID="web-welcome-about"
              accessibilityRole="button"
              accessibilityLabel={aboutOpen ? "Close About Se'kret Bip" : "About Se'kret Bip"}
              accessibilityState={{ expanded: aboutOpen }}
              onPress={() => setAboutOpen(value => !value)}
              style={({ pressed }) => [styles.roundButton, pressed && styles.controlPressed]}
            >
              <Text style={styles.roundButtonText}>i</Text>
            </Pressable>

            <View style={styles.wordmark}>
              <LinearGradient
                colors={FRONT_DOOR_THEME.gradient.wordmark}
                style={styles.wordmarkBadge}
              >
                <Text style={styles.wordmarkHeart}>♡</Text>
              </LinearGradient>
              <Text style={styles.wordmarkText}>{isBipJr ? 'BIP JR' : 'SE’KRET BIP'}</Text>
            </View>

            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={styles.decorativeSpark}
            >
              <Animated.Text style={[styles.decorativeSparkText, sparkMotionStyle]}>✦</Animated.Text>
            </View>
          </View>

          {aboutOpen && (
            <View
              testID="web-welcome-about-panel"
              accessible
              accessibilityLabel="Se'kret Bip has separate Teen and Bip Jr welcome experiences. Account setup controls what each person can access."
              style={styles.aboutPanel}
            >
              <Text style={styles.aboutTitle}>Two welcome worlds. One connected family.</Text>
              <Text style={styles.aboutBody}>
                Teen and Bip Jr use separate presentation paths. Account setup and age-appropriate permissions decide what each person can access.
              </Text>
            </View>
          )}

          <View style={styles.copy}>
            <Text testID="web-welcome-eyebrow" style={styles.eyebrow}>{copy.eyebrow}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Come on in.</Text>
              <Animated.Text style={[styles.spark, sparkMotionStyle]}>✦</Animated.Text>
            </View>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <View
            testID="web-welcome-hero-safe-area"
            style={{ paddingBottom: heroContract.bottomGap }}
          >
            <Animated.View
              testID="web-welcome-hero-motion"
              style={[
                styles.heroWrap,
                { height: heroHeight },
                isBipJr && styles.heroWrapBipJr,
                heroMotionStyle,
              ]}
            >
              <Animated.View style={[styles.heroGlow, ambientMotionStyle]} />
              <Image
                testID={isBipJr ? 'web-welcome-hero-bip-jr' : 'web-welcome-hero-teen'}
                source={copy.hero}
                resizeMode={isBipJr ? 'contain' : 'cover'}
                style={[styles.hero, isBipJr && styles.heroBipJr]}
                accessibilityLabel={copy.heroLabel}
              />
            </Animated.View>
          </View>

          <Text style={styles.handNote}>{copy.note}</Text>

          <Pressable
            testID="web-welcome-enter"
            accessibilityRole="button"
            accessibilityLabel={copy.enterLabel}
            onPress={() => onEnter(entrySide)}
          >
            {({ pressed }) => (
              <LinearGradient
                colors={FRONT_DOOR_THEME.gradient.action}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.enterButton, pressed && styles.enterPressed]}
              >
                <Text style={styles.enterText}>Enter Se’kret Bip</Text>
                <View style={styles.enterHeartBadge}>
                  <Text style={styles.enterHeart}>♡</Text>
                </View>
              </LinearGradient>
            )}
          </Pressable>

          {showSignIn && (
            <Pressable
              testID="web-welcome-sign-in"
              accessibilityRole="button"
              accessibilityLabel="Sign in to your existing Se'kret Bip account"
              onPress={() => router.push(`/(auth)/login?side=${entrySide}` as never)}
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

const { color, RADIUS, SPACE, TYPE } = FRONT_DOOR_THEME;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: color.page,
  },
  ambientTop: {
    position: 'absolute',
    width: 520,
    height: 520,
    top: -220,
    right: -160,
    borderRadius: RADIUS.pill,
    backgroundColor: color.ambientViolet,
  },
  ambientBottom: {
    position: 'absolute',
    width: 460,
    height: 460,
    bottom: -210,
    left: -160,
    borderRadius: RADIUS.pill,
    backgroundColor: color.ambientPink,
  },
  livingWorld: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  livingMoon: {
    position: 'absolute',
    top: 96,
    right: 42,
    color: color.lilacLight,
    fontSize: 34,
    opacity: 0.72,
    textShadowColor: color.heroGlow,
    textShadowRadius: 18,
  },
  livingStar: {
    position: 'absolute',
    top: 188,
    left: 28,
    color: color.pinkLight,
    fontSize: 22,
    opacity: 0.68,
    textShadowColor: color.ambientPink,
    textShadowRadius: 16,
  },
  livingCloud: {
    position: 'absolute',
    bottom: 116,
    right: 34,
    color: color.textHigh,
    fontSize: 26,
    opacity: 0.28,
    textShadowColor: color.heroGlow,
    textShadowRadius: 18,
  },
  shell: {
    width: '100%',
    maxWidth: 430,
    maxHeight: 900,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: RADIUS.xxl + SPACE[2],
    backgroundColor: color.shell,
    boxShadow: FRONT_DOOR_THEME.shadow.shell as never,
  },
  shellCompact: {
    maxWidth: '100%',
    borderRadius: RADIUS.none,
    borderWidth: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACE[7],
  },
  topBar: {
    minHeight: 78,
    paddingHorizontal: SPACE[5],
    paddingTop: SPACE[4],
    paddingBottom: SPACE[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: color.borderStrong,
    backgroundColor: color.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPressed: {
    opacity: 0.72,
  },
  roundButtonText: {
    color: color.textHigh,
    fontSize: TYPE.xl,
    fontWeight: TYPE.bold,
  },
  decorativeSpark: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeSparkText: {
    color: color.pinkLight,
    fontSize: TYPE.xl,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2.5],
  },
  wordmarkBadge: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkHeart: {
    color: color.textHigh,
    fontSize: TYPE.lg,
    fontWeight: TYPE.bold,
  },
  wordmarkText: {
    color: color.textHigh,
    fontSize: TYPE.sm,
    fontWeight: '900',
    letterSpacing: 3.2,
  },
  aboutPanel: {
    marginHorizontal: SPACE[5],
    marginBottom: SPACE[3],
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceRaised,
  },
  aboutTitle: {
    color: color.textHigh,
    fontSize: TYPE.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  aboutBody: {
    color: color.textMid,
    fontSize: TYPE.xs,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: SPACE[1.5],
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: SPACE[7],
    paddingTop: SPACE[3],
  },
  eyebrow: {
    color: color.eyebrow,
    fontSize: TYPE.xs,
    fontWeight: '800',
    letterSpacing: 3.2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACE[3],
  },
  title: {
    color: color.textHigh,
    fontFamily: 'Georgia',
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -2,
  },
  spark: {
    color: color.pinkLight,
    fontSize: TYPE.lg,
    marginLeft: SPACE[2],
    marginTop: SPACE[1],
  },
  subtitle: {
    color: color.textMid,
    fontSize: TYPE.base,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 350,
    marginTop: SPACE[2.5],
  },
  heroWrap: {
    marginTop: SPACE[1],
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroWrapBipJr: {
    marginHorizontal: SPACE[5],
    marginTop: SPACE[3.5],
    borderRadius: RADIUS.xxl + SPACE[1.5],
    backgroundColor: color.shellRaised,
  },
  heroGlow: {
    position: 'absolute',
    width: 340,
    height: 340,
    left: '50%',
    top: 35,
    marginLeft: -170,
    borderRadius: RADIUS.pill,
    backgroundColor: color.heroGlow,
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  heroBipJr: {
    borderRadius: RADIUS.xxl + SPACE[1.5],
  },
  handNote: {
    color: color.textMid,
    fontSize: TYPE.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACE[3],
    paddingHorizontal: SPACE[5],
  },
  enterButton: {
    minHeight: 72,
    marginHorizontal: SPACE[8],
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: color.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[4],
    boxShadow: FRONT_DOOR_THEME.shadow.action as never,
  },
  enterPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  enterText: {
    color: color.textHigh,
    fontSize: TYPE.xl,
    fontWeight: '800',
  },
  enterHeartBadge: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    backgroundColor: color.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterHeart: {
    color: color.textHigh,
    fontSize: 28,
    lineHeight: 32,
  },
  signInButton: {
    minHeight: 48,
    marginHorizontal: SPACE[8],
    marginTop: SPACE[2.5],
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[1.5],
  },
  signInPressed: {
    opacity: 0.7,
  },
  signInPrompt: {
    color: color.textLow,
    fontSize: TYPE.sm,
  },
  signInText: {
    color: color.lilacLight,
    fontSize: TYPE.sm,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});