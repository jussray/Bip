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
  const defaultAudience = audience ?? welcomeAudienceForAccountSide(variant);
  const [activeAudience, setActiveAudience] = useState<WelcomeAudience>(() =>
    getPreviewAudience(defaultAudience),
  );
  const motionEnabled = reduceMotion === false;
  const compact = width < 520;
  const shortViewport = compact && height < 700;
  const shellHeight = compact ? height : Math.min(height, 900);
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
        title: 'A softer doorway for growing together.',
        lead: 'Bip Jr. + Family',
        subtitle: 'A calm family space for younger kids, with a grown-up beside them.',
        hero: BIP_JR_HERO,
        heroLabel: 'The Bip Jr family welcome artwork',
        cues: [
          { symbol: '☁', label: 'set up together' },
          { symbol: '♡', label: 'stay connected' },
          { symbol: '✦', label: 'room to grow' },
        ],
        cueLabel: 'Bip Jr world cues: set up together, stay connected, room to grow',
        note: 'Made for real family rhythms.',
        enterText: 'Enter with a grown-up',
        enterLabel: 'Bip Jr family welcome — continue to family setup',
        switchText: 'Looking for Teen space? →',
        switchLabel: "Switch to the Se'kret Bip Teen welcome",
        nextAudience: 'teen' as WelcomeAudience,
      }
    : {
        eyebrow: 'YOUR PEOPLE. YOUR PEACE.',
        title: 'Come on in.',
        lead: 'You can be real here.',
        subtitle: 'Reflect, talk, breathe, create, or just be for a minute.',
        hero: TEEN_HERO,
        heroLabel: 'Night on the left, Suhana in the center, Sy on the right, Cloud, and their parents together',
        cues: [
          { symbol: '☾', label: 'start quiet' },
          { symbol: '♡', label: 'stay close' },
          { symbol: '✦', label: 'keep your space' },
        ],
        cueLabel: "Se'kret Bip world cues: start quiet, stay close, keep your space",
        note: '☁  stay awhile. start when you’re ready.',
        enterText: 'Enter Se’kret Bip',
        enterLabel: "Se'kret Bip teen welcome — continue to age setup",
        switchText: 'Looking for Bip Jr. + Family? →',
        switchLabel: 'Switch to the Bip Jr and Family welcome',
        nextAudience: 'bip-jr' as WelcomeAudience,
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
            <Text style={styles.wordmarkText}>SE’KRET BIP</Text>

            <View style={styles.topControls}>
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

              <View
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                style={styles.decorativeSpark}
              >
                <Animated.Text style={[styles.decorativeSparkText, sparkMotionStyle]}>✦</Animated.Text>
              </View>
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
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.lead}>{copy.lead}</Text>
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

          <View
            testID="web-welcome-world-cues"
            accessible
            accessibilityLabel={copy.cueLabel}
            style={styles.worldCues}
          >
            {copy.cues.map(cue => (
              <View
                key={cue.label}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                style={styles.worldCue}
              >
                <Text style={styles.worldCueSymbol}>{cue.symbol}</Text>
                <Text style={styles.worldCueLabel}>{cue.label}</Text>
              </View>
            ))}
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
                <Text style={styles.enterText}>{copy.enterText}</Text>
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

          <Pressable
            testID="web-welcome-audience-switch"
            accessibilityRole="button"
            accessibilityLabel={copy.switchLabel}
            onPress={() => setActiveAudience(copy.nextAudience)}
            style={({ pressed }) => [styles.audienceSwitch, pressed && styles.controlPressed]}
          >
            <Text style={styles.audienceSwitchText}>{copy.switchText}</Text>
          </Pressable>
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
    paddingBottom: SPACE[6],
  },
  topBar: {
    minHeight: 70,
    paddingHorizontal: SPACE[5],
    paddingTop: SPACE[4],
    paddingBottom: SPACE[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmarkText: {
    color: color.textHigh,
    fontSize: TYPE.sm,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonText: {
    color: color.textMid,
    fontSize: TYPE.sm,
    fontWeight: TYPE.bold,
  },
  controlPressed: {
    opacity: 0.72,
  },
  decorativeSpark: {
    width: 28,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeSparkText: {
    color: color.pinkLight,
    fontSize: TYPE.lg,
  },
  aboutPanel: {
    marginHorizontal: SPACE[5],
    marginBottom: SPACE[2],
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
  },
  aboutBody: {
    color: color.textMid,
    fontSize: TYPE.xs,
    lineHeight: 17,
    marginTop: SPACE[1],
  },
  copy: {
    alignItems: 'flex-start',
    paddingHorizontal: SPACE[5],
    paddingTop: SPACE[2],
  },
  eyebrow: {
    color: color.eyebrow,
    fontSize: TYPE.xs,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: color.textHigh,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginTop: SPACE[2],
    maxWidth: 350,
  },
  lead: {
    color: color.lilacLight,
    fontSize: TYPE.xl,
    lineHeight: 28,
    fontWeight: '800',
    marginTop: SPACE[1],
  },
  subtitle: {
    color: color.textMid,
    fontSize: TYPE.base,
    lineHeight: 22,
    maxWidth: 350,
    marginTop: SPACE[2],
  },
  heroWrap: {
    marginHorizontal: SPACE[5],
    marginTop: SPACE[4],
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.shellRaised,
  },
  heroWrapBipJr: {
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
    borderRadius: RADIUS.xxl,
  },
  heroBipJr: {
    borderRadius: RADIUS.xxl,
  },
  worldCues: {
    marginHorizontal: SPACE[5],
    marginBottom: SPACE[2],
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[2],
  },
  worldCue: {
    minHeight: 36,
    paddingHorizontal: SPACE[3],
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[1],
  },
  worldCueSymbol: {
    color: color.pinkLight,
    fontSize: TYPE.sm,
  },
  worldCueLabel: {
    color: color.textMid,
    fontSize: TYPE.xs,
    fontWeight: '800',
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
    minHeight: 54,
    marginHorizontal: SPACE[5],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: FRONT_DOOR_THEME.shadow.action as never,
  },
  enterPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  enterText: {
    color: color.textHigh,
    fontSize: TYPE.base,
    fontWeight: '900',
  },
  signInButton: {
    minHeight: 48,
    marginHorizontal: SPACE[5],
    marginTop: SPACE[2],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[1],
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
  },
  audienceSwitch: {
    minHeight: 48,
    marginHorizontal: SPACE[5],
    marginTop: SPACE[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceSwitchText: {
    color: color.textMid,
    fontSize: TYPE.sm,
    fontWeight: '700',
  },
});
