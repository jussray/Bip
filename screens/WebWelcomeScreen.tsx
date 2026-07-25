import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { AccountSide } from '@/features/identity/accountProfile';

const TEEN_HERO = require('../assets/brand/sekret-bip-teen-family-v1.jpg');
const BIP_JR_HERO = require('../assets/images/parent-space-splash.png');

type WebWelcomeScreenProps = {
  onEnter: () => void;
  variant?: AccountSide;
};

type ScreenName = 'home' | 'enter' | 'family' | 'moments' | 'more' | 'bip-jr';

const navItems: ReadonlyArray<{ icon: string; label: string; screen: ScreenName; center?: boolean }> = [
  { icon: '⌂', label: 'Home', screen: 'home' },
  { icon: '♧', label: 'Family', screen: 'family' },
  { icon: '♥', label: 'Enter', screen: 'enter', center: true },
  { icon: '✦', label: 'Moments', screen: 'moments' },
  { icon: '•••', label: 'More', screen: 'more' },
];

function getPreviewVariant(variant: AccountSide): AccountSide {
  if (typeof window === 'undefined') return variant;
  const override = new URLSearchParams(window.location.search).get('bipDevSide');
  return override === 'teen' || override === 'parent' ? override : variant;
}

export function WebWelcomeScreen({ onEnter, variant = 'teen' }: WebWelcomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const compact = width < 520;
  const shellHeight = compact ? height : Math.min(height, 900);
  const activeVariant = getPreviewVariant(variant);
  const [screen, setScreen] = useState<ScreenName>(activeVariant === 'parent' ? 'bip-jr' : 'home');
  const [soundOn, setSoundOn] = useState(false);

  const activeCopy = useMemo(() => {
    switch (screen) {
      case 'family':
        return {
          symbol: '♧',
          eyebrow: 'OUR CIRCLE',
          title: 'Everybody has a place here.',
          body: 'A shared view for staying close, checking in, and making room for what matters.',
        };
      case 'moments':
        return {
          symbol: '✦',
          eyebrow: 'MOMENTS',
          title: 'Keep what matters close.',
          body: 'A gentle place for memories, check-ins, and the small signals families do not want to lose.',
        };
      case 'more':
        return {
          symbol: '•••',
          eyebrow: 'MORE TO EXPLORE',
          title: 'Two worlds, one family.',
          body: 'The teen welcome stays distinct while Bip Jr remains available as its softer younger-family space.',
        };
      default:
        return null;
    }
  }, [screen]);

  return (
    <View style={[styles.page, { minHeight: height }]}>
      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientBottom} />
      <View pointerEvents="none" style={styles.starField}>
        {['✦', '·', '✧', '·', '✦', '·', '✧', '·'].map((star, index) => (
          <Text key={`${star}-${index}`} style={[styles.star, { left: `${8 + index * 12}%`, top: `${8 + (index % 3) * 19}%` }]}>{star}</Text>
        ))}
      </View>

      <View
        testID="web-welcome-shell"
        accessibilityLabel="Se'kret Bip teen welcome"
        style={[styles.shell, { height: shellHeight }, compact && styles.shellCompact]}
      >
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="About Se'kret Bip" onPress={() => setScreen('more')} style={styles.roundButton}>
            <Text style={styles.roundButtonText}>i</Text>
          </Pressable>

          <View style={styles.wordmark}>
            <LinearGradient colors={['#f07bc3', '#8b64ff', '#596be1']} style={styles.wordmarkBadge}>
              <Text style={styles.wordmarkHeart}>♡</Text>
            </LinearGradient>
            <Text style={styles.wordmarkText}>{screen === 'bip-jr' ? 'BIP JR' : 'SE’KRET BIP'}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={soundOn ? 'Turn welcome sound off' : 'Turn welcome sound on'}
            accessibilityState={{ selected: soundOn }}
            onPress={() => setSoundOn(value => !value)}
            style={[styles.roundButton, soundOn && styles.roundButtonActive]}
          >
            <Text style={styles.music}>{soundOn ? '♫' : '♪'}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          {screen === 'home' && (
            <View testID="web-welcome-home">
              <View style={styles.copy}>
                <Text testID="web-welcome-eyebrow" style={styles.eyebrow}>YOUR PEOPLE. YOUR PEACE.</Text>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>Come on in.</Text>
                  <Text style={styles.spark}>✦</Text>
                </View>
                <Text style={styles.subtitle}>A safe little world where teens and parents can stay close without losing their own space.</Text>
              </View>

              <View style={[styles.heroWrap, compact && styles.heroWrapCompact]}>
                <View style={styles.heroGlow} />
                <View style={styles.orbitOne} />
                <View style={styles.orbitTwo} />
                <Text style={styles.moon}>☾</Text>
                <Text style={styles.doodleHeart}>♡</Text>
                <Image
                  testID="web-welcome-hero-teen"
                  source={TEEN_HERO}
                  resizeMode="cover"
                  style={styles.hero}
                  accessibilityLabel="Night on the left, Suhana in the center, Sy on the right, Cloud, and their parents together"
                />
              </View>

              <View style={styles.namePill} accessibilityLabel="Night, Suhana, and Sy">
                <Text style={styles.nameText}>Night</Text><Text style={styles.nameDot}>·</Text>
                <Text testID="web-welcome-suhana" style={styles.nameText}>Suhana</Text><Text style={styles.nameDot}>·</Text>
                <Text style={styles.nameText}>Sy</Text>
              </View>
              <Text style={styles.handNote}>☁  stay awhile. you’re safe here.</Text>

              <EnterButton label="Enter" onPress={() => setScreen('enter')} />
              <Text style={styles.privacyNote}>◉  Built for trust. Made for real families.</Text>
            </View>
          )}

          {screen === 'enter' && (
            <Panel onBack={() => setScreen('home')} symbol="♡" eyebrow="STEP INTO YOUR SPACE" title="Who’s entering today?">
              <Text style={styles.panelIntro}>Choose your side. The real account flow begins after this welcome.</Text>
              <View style={styles.roleGrid}>
                <Pressable accessibilityRole="button" onPress={onEnter} style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}>
                  <Text style={styles.roleIcon}>✦</Text><Text style={styles.roleTitle}>Teen</Text><Text style={styles.roleBody}>My space, my pace</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={onEnter} style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}>
                  <Text style={[styles.roleIcon, styles.parentIcon]}>♡</Text><Text style={styles.roleTitle}>Parent</Text><Text style={styles.roleBody}>Stay close, stay trusted</Text>
                </Pressable>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setScreen('home')}><Text style={styles.textLink}>Not ready yet? Go back</Text></Pressable>
            </Panel>
          )}

          {activeCopy && (
            <Panel onBack={() => setScreen('home')} symbol={activeCopy.symbol} eyebrow={activeCopy.eyebrow} title={activeCopy.title}>
              <Text style={styles.panelIntro}>{activeCopy.body}</Text>
              <View style={styles.comingCard}>
                <View style={styles.pulseDot} />
                <View style={styles.comingCopy}><Text style={styles.comingTitle}>Concept destination</Text><Text style={styles.comingBody}>This entry is ready for the next Se’kret Bip screen to be connected.</Text></View>
              </View>
              {screen === 'more' && (
                <Pressable accessibilityRole="button" onPress={() => setScreen('bip-jr')} style={styles.bipJrLink}>
                  <Text style={styles.bipJrMark}>☁</Text>
                  <View style={styles.bipJrCopy}><Text style={styles.bipJrTitle}>Bip Jr</Text><Text style={styles.bipJrBody}>The softer original, kept as its own world.</Text></View>
                  <Text style={styles.bipJrArrow}>→</Text>
                </Pressable>
              )}
              <EnterButton label="Return home" onPress={() => setScreen('home')} compact />
            </Panel>
          )}

          {screen === 'bip-jr' && (
            <Panel onBack={() => setScreen('more')} symbol="☁" eyebrow="THE SOFTER ORIGINAL" title="Bip Jr">
              <Text style={styles.panelIntro}>A separate, younger welcome world, kept intact while the main Se’kret Bip experience grows with teens.</Text>
              <View style={styles.bipJrArtWrap}>
                <Image testID="web-welcome-hero-bip-jr" source={BIP_JR_HERO} resizeMode="contain" style={styles.bipJrHero} accessibilityLabel="The Bip Jr family welcome artwork" />
                <Text style={styles.bipJrFloatingHeart}>♡</Text>
              </View>
              <EnterButton label="Go to teen welcome" onPress={() => setScreen('home')} compact />
            </Panel>
          )}
        </ScrollView>

        <View testID="web-welcome-bottom-nav" style={styles.bottomNav}>
          {navItems.map(item => {
            const active = screen === item.screen;
            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => setScreen(item.screen)}
                style={[styles.navItem, item.center && styles.centerNavItem]}
              >
                <View style={[styles.navIconWrap, item.center && styles.centerIconWrap, active && !item.center && styles.navIconActiveWrap]}>
                  <Text style={[styles.navIcon, item.center && styles.centerIcon, active && !item.center && styles.navIconActive]}>{item.icon}</Text>
                </View>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Panel({ onBack, symbol, eyebrow, title, children }: { onBack: () => void; symbol: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to welcome" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable>
      <View style={styles.panelSymbol}><Text style={styles.panelSymbolText}>{symbol}</Text></View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function EnterButton({ label, onPress, compact = false }: { label: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable testID={label === 'Enter' ? 'web-welcome-enter' : undefined} accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {({ pressed }) => (
        <LinearGradient colors={['#6549e7', '#9c63ed', '#dc68b1']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.enterButton, compact && styles.enterButtonCompact, pressed && styles.pressed]}>
          <Text style={[styles.enterText, compact && styles.enterTextCompact]}>{label}</Text>
          <View style={styles.enterHeartBadge}><Text style={styles.enterHeart}>♡</Text></View>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#05030f' },
  ambientTop: { position: 'absolute', width: 520, height: 520, top: -220, right: -160, borderRadius: 260, backgroundColor: 'rgba(137,91,241,.22)' },
  ambientBottom: { position: 'absolute', width: 460, height: 460, bottom: -210, left: -160, borderRadius: 230, backgroundColor: 'rgba(231,81,162,.15)' },
  starField: { ...StyleSheet.absoluteFillObject },
  star: { position: 'absolute', color: 'rgba(232,216,255,.34)', fontSize: 18 },
  shell: { width: '100%', maxWidth: 430, maxHeight: 900, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.13)', borderRadius: 38, backgroundColor: '#120927', boxShadow: '0 40px 110px rgba(0,0,0,.66)' as never },
  shellCompact: { maxWidth: '100%', borderRadius: 0, borderWidth: 0 },
  topBar: { height: 78, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(220,199,255,.2)', backgroundColor: 'rgba(255,255,255,.05)', alignItems: 'center', justifyContent: 'center' },
  roundButtonActive: { backgroundColor: 'rgba(176,105,223,.28)', borderColor: 'rgba(237,193,255,.5)' },
  roundButtonText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  music: { color: '#fff', fontSize: 18 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkBadge: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  wordmarkHeart: { color: '#fff', fontSize: 20, fontWeight: '700' },
  wordmarkText: { color: '#f2edff', fontSize: 14, fontWeight: '900', letterSpacing: 3.2 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  copy: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 12 },
  eyebrow: { color: '#bda8ee', fontSize: 12, fontWeight: '800', letterSpacing: 3.2, textAlign: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
  title: { color: '#fff', fontFamily: 'Georgia', fontSize: 48, lineHeight: 54, letterSpacing: -2 },
  spark: { color: '#f2a4d5', fontSize: 18, marginLeft: 8, marginTop: 3 },
  subtitle: { color: '#c9bddf', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 350, marginTop: 10 },
  heroWrap: { height: 430, marginTop: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  heroWrapCompact: { height: 360 },
  heroGlow: { position: 'absolute', width: 340, height: 340, left: '50%', top: 35, marginLeft: -170, borderRadius: 170, backgroundColor: 'rgba(142,89,255,.18)' },
  orbitOne: { position: 'absolute', width: 330, height: 330, left: '50%', top: 45, marginLeft: -165, borderRadius: 165, borderWidth: 1, borderColor: 'rgba(210,185,255,.18)' },
  orbitTwo: { position: 'absolute', width: 270, height: 270, left: '50%', top: 76, marginLeft: -135, borderRadius: 135, borderWidth: 1, borderColor: 'rgba(242,164,213,.16)' },
  moon: { position: 'absolute', left: 24, top: 45, color: '#e1c8ff', fontSize: 34, zIndex: 2 },
  doodleHeart: { position: 'absolute', right: 28, top: 86, color: '#f2a4d5', fontSize: 28, zIndex: 2, transform: [{ rotate: '12deg' }] },
  hero: { width: '100%', height: '100%' },
  namePill: { minHeight: 44, marginHorizontal: 36, marginTop: -36, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', backgroundColor: 'rgba(6,3,18,.9)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nameText: { color: '#ddcfef', fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 17 },
  nameDot: { color: '#b469f0', fontSize: 17 },
  handNote: { color: '#c4aed7', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 8, marginBottom: 12 },
  enterButton: { minHeight: 72, marginHorizontal: 34, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, boxShadow: '0 16px 30px rgba(101,65,219,.35)' as never },
  enterButtonCompact: { minHeight: 58, marginHorizontal: 0, marginTop: 22 },
  enterText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  enterTextCompact: { fontSize: 17 },
  enterHeartBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  enterHeart: { color: '#fff', fontSize: 28, lineHeight: 32 },
  pressed: { opacity: .84, transform: [{ scale: .99 }] },
  privacyNote: { color: '#8f84a3', fontSize: 12, textAlign: 'center', marginTop: 12 },
  panel: { flex: 1, minHeight: 650, paddingHorizontal: 28, paddingTop: 18, justifyContent: 'center' },
  backButton: { position: 'absolute', left: 18, top: 10, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 24 },
  panelSymbol: { width: 74, height: 74, alignSelf: 'center', borderRadius: 26, backgroundColor: 'rgba(176,105,223,.18)', borderWidth: 1, borderColor: 'rgba(226,193,255,.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  panelSymbolText: { color: '#f3d5ff', fontSize: 36 },
  panelTitle: { color: '#fff', fontFamily: 'Georgia', fontSize: 36, lineHeight: 42, textAlign: 'center', marginTop: 14 },
  panelIntro: { color: '#c9bddf', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 12 },
  roleGrid: { flexDirection: 'row', gap: 12, marginTop: 28 },
  roleCard: { flex: 1, minHeight: 170, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  roleIcon: { color: '#d9b9ff', fontSize: 36 },
  parentIcon: { color: '#f3a9d5' },
  roleTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 },
  roleBody: { color: '#aa9fbb', fontSize: 12, marginTop: 6, textAlign: 'center' },
  textLink: { color: '#baa8d1', fontSize: 13, textAlign: 'center', marginTop: 24, textDecorationLine: 'underline' },
  comingCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 28, padding: 18, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#b969df' },
  comingCopy: { flex: 1 },
  comingTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  comingBody: { color: '#a99dbb', fontSize: 12, lineHeight: 18, marginTop: 4 },
  bipJrLink: { flexDirection: 'row', alignItems: 'center', marginTop: 18, padding: 16, borderRadius: 22, backgroundColor: 'rgba(78,107,184,.16)', borderWidth: 1, borderColor: 'rgba(145,174,255,.2)' },
  bipJrMark: { color: '#d5e1ff', fontSize: 28 },
  bipJrCopy: { flex: 1, marginLeft: 12 },
  bipJrTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bipJrBody: { color: '#a9b5d0', fontSize: 12, marginTop: 3 },
  bipJrArrow: { color: '#d5e1ff', fontSize: 22 },
  bipJrArtWrap: { height: 330, marginTop: 22, borderRadius: 30, overflow: 'hidden', backgroundColor: '#0d1732', borderWidth: 1, borderColor: 'rgba(162,186,255,.18)' },
  bipJrHero: { width: '100%', height: '100%' },
  bipJrFloatingHeart: { position: 'absolute', right: 18, top: 14, color: '#f1c7eb', fontSize: 26 },
  bottomNav: { height: 92, borderTopWidth: 1, borderTopColor: 'rgba(220,199,255,.15)', backgroundColor: 'rgba(7,4,20,.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, paddingBottom: 8 },
  navItem: { flex: 1, height: 72, alignItems: 'center', justifyContent: 'center', gap: 5 },
  centerNavItem: { transform: [{ translateY: -12 }] },
  navIconWrap: { width: 44, height: 38, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  navIconActiveWrap: { backgroundColor: 'rgba(185,105,223,.15)' },
  centerIconWrap: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#b969df', boxShadow: '0 12px 26px rgba(134,92,239,.42)' as never },
  navIcon: { color: '#817694', fontSize: 23, fontWeight: '800' },
  navIconActive: { color: '#ddd1ff' },
  centerIcon: { color: '#fff', fontSize: 22 },
  navLabel: { color: '#756a89', fontSize: 11, fontWeight: '700' },
  navLabelActive: { color: '#ddd1ff' },
});
