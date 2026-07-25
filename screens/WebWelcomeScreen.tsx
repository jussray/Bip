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
  onEnter: (side: AccountSide) => void;
  variant?: AccountSide;
};

type ScreenName = 'home' | 'enter' | 'family' | 'moments' | 'more' | 'bip-jr';

type NavItem = {
  icon: string;
  label: string;
  screen: Exclude<ScreenName, 'bip-jr'>;
  center?: boolean;
};

const navItems: readonly NavItem[] = [
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

function playWelcomeTone(): void {
  if (typeof window === 'undefined') return;
  const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const context = new AudioContextCtor();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.75);
  gain.connect(context.destination);

  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(context.currentTime + index * 0.1);
    oscillator.stop(context.currentTime + 0.75);
  });

  window.setTimeout(() => void context.close(), 900);
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
        return { symbol: '♧', eyebrow: 'OUR CIRCLE', title: 'Everybody has a place here.', body: 'A shared view for staying close, checking in, and making room for what matters.' };
      case 'moments':
        return { symbol: '✦', eyebrow: 'MOMENTS', title: 'Keep what matters close.', body: 'A gentle place for memories, check-ins, and the small signals families do not want to lose.' };
      case 'more':
        return { symbol: '•••', eyebrow: 'MORE TO EXPLORE', title: 'Two worlds, one family.', body: 'The teen welcome stays distinct while Bip Jr remains available as its softer younger-family space.' };
      default:
        return null;
    }
  }, [screen]);

  const toggleSound = () => {
    setSoundOn(value => {
      const next = !value;
      if (next) playWelcomeTone();
      return next;
    });
  };

  return (
    <View style={[styles.page, { minHeight: height }]}>
      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientBottom} />
      <View pointerEvents="none" style={styles.starField}>
        {['✦', '·', '✧', '·', '✦', '·', '✧', '·'].map((star, index) => (
          <Text key={`${star}-${index}`} style={[styles.star, { left: `${8 + index * 12}%`, top: `${8 + (index % 3) * 19}%` }]}>{star}</Text>
        ))}
      </View>

      <View testID="web-welcome-shell" accessibilityLabel="Se'kret Bip teen welcome" style={[styles.shell, { height: shellHeight }, compact && styles.shellCompact]}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="About Se'kret Bip" onPress={() => setScreen('more')} style={styles.roundButton}>
            <Text style={styles.roundButtonText}>i</Text>
          </Pressable>
          <View style={styles.wordmark}>
            <LinearGradient colors={['#f07bc3', '#8b64ff', '#596be1']} style={styles.wordmarkBadge}><Text style={styles.wordmarkHeart}>♡</Text></LinearGradient>
            <Text style={styles.wordmarkText}>{screen === 'bip-jr' ? 'BIP JR' : 'SE’KRET BIP'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={soundOn ? 'Turn welcome sound off' : 'Play welcome sound'} accessibilityState={{ selected: soundOn }} onPress={toggleSound} style={[styles.roundButton, soundOn && styles.roundButtonActive]}>
            <Text style={styles.music}>{soundOn ? '♫' : '♪'}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          {screen === 'home' && (
            <View testID="web-welcome-home">
              <View style={styles.copy}>
                <Text testID="web-welcome-eyebrow" style={styles.eyebrow}>YOUR PEOPLE. YOUR PEACE.</Text>
                <View style={styles.titleRow}><Text style={styles.title}>Come on in.</Text><Text style={styles.spark}>✦</Text></View>
                <Text style={styles.subtitle}>A safe little world where teens and parents can stay close without losing their own space.</Text>
              </View>
              <View style={[styles.heroWrap, compact && styles.heroWrapCompact]}>
                <View style={styles.heroGlow} /><View style={styles.orbitOne} /><View style={styles.orbitTwo} />
                <Text style={styles.moon}>☾</Text><Text style={styles.doodleHeart}>♡</Text>
                <Image testID="web-welcome-hero-teen" source={TEEN_HERO} resizeMode="cover" style={styles.hero} accessibilityLabel="Night on the left, Suhana in the center, Sy on the right, Cloud, and their parents together" />
              </View>
              <View style={styles.namePill} accessibilityLabel="Night, Suhana, and Sy">
                <Text style={styles.nameText}>Night</Text><Text style={styles.nameDot}>·</Text><Text testID="web-welcome-suhana" style={styles.nameText}>Suhana</Text><Text style={styles.nameDot}>·</Text><Text style={styles.nameText}>Sy</Text>
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
                <Pressable testID="web-welcome-enter-teen" accessibilityRole="button" accessibilityLabel="Enter Teen Side" onPress={() => onEnter('teen')} style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}><Text style={styles.roleIcon}>✦</Text><Text style={styles.roleTitle}>Teen</Text><Text style={styles.roleBody}>My space, my pace</Text></Pressable>
                <Pressable testID="web-welcome-enter-parent" accessibilityRole="button" accessibilityLabel="Enter Parent Side" onPress={() => onEnter('parent')} style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}><Text style={[styles.roleIcon, styles.parentIcon]}>♡</Text><Text style={styles.roleTitle}>Parent</Text><Text style={styles.roleBody}>Stay close, stay trusted</Text></Pressable>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setScreen('home')}><Text style={styles.textLink}>Not ready yet? Go back</Text></Pressable>
            </Panel>
          )}

          {activeCopy && (
            <Panel onBack={() => setScreen('home')} symbol={activeCopy.symbol} eyebrow={activeCopy.eyebrow} title={activeCopy.title}>
              <Text style={styles.panelIntro}>{activeCopy.body}</Text>
              <View style={styles.comingCard}><View style={styles.pulseDot} /><View style={styles.comingCopy}><Text style={styles.comingTitle}>Preview destination</Text><Text style={styles.comingBody}>Explore this public preview, then use Enter to continue into the real account flow.</Text></View></View>
              {screen === 'more' && (
                <Pressable accessibilityRole="button" accessibilityLabel="Open Bip Jr welcome" onPress={() => setScreen('bip-jr')} style={styles.bipJrLink}><Text style={styles.bipJrMark}>☁</Text><View style={styles.bipJrCopy}><Text style={styles.bipJrTitle}>Bip Jr</Text><Text style={styles.bipJrBody}>The softer original, kept as its own world.</Text></View><Text style={styles.bipJrArrow}>→</Text></Pressable>
              )}
              <EnterButton label="Choose a side" onPress={() => setScreen('enter')} compact />
            </Panel>
          )}

          {screen === 'bip-jr' && (
            <Panel onBack={() => setScreen('more')} symbol="☁" eyebrow="THE SOFTER ORIGINAL" title="Bip Jr">
              <Text style={styles.panelIntro}>A separate, younger welcome world, kept intact while the main Se’kret Bip experience grows with teens.</Text>
              <View style={styles.bipJrArtWrap}><Image testID="web-welcome-hero-bip-jr" source={BIP_JR_HERO} resizeMode="contain" style={styles.bipJrHero} accessibilityLabel="The Bip Jr family welcome artwork" /><Text style={styles.bipJrFloatingHeart}>♡</Text></View>
              <EnterButton label="Enter Bip Jr" onPress={() => onEnter('parent')} compact />
              <Pressable accessibilityRole="button" onPress={() => setScreen('home')}><Text style={styles.textLink}>Go to teen welcome</Text></Pressable>
            </Panel>
          )}
        </ScrollView>

        <View testID="web-welcome-bottom-nav" accessibilityRole="tablist" style={[styles.bottomNav, compact && styles.bottomNavCompact]}>
          {navItems.map(item => {
            const active = screen === item.screen;
            return (
              <Pressable key={item.label} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active }} onPress={() => setScreen(item.screen)} style={({ pressed }) => [styles.navItem, item.center && styles.centerNavItem, pressed && styles.navItemPressed]}>
                {item.center ? (
                  <LinearGradient colors={['#8065fb', '#d66eb6']} style={[styles.navIconWrap, styles.centerIconWrap, active && styles.centerIconActiveWrap]}><Text style={[styles.navIcon, styles.centerIcon]}>{item.icon}</Text></LinearGradient>
                ) : (
                  <View style={[styles.navIconWrap, active && styles.navIconActiveWrap]}><Text style={[styles.navIcon, active && styles.navIconActive]}>{item.icon}</Text></View>
                )}
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
  return <View style={styles.panel}><Pressable accessibilityRole="button" accessibilityLabel="Back to welcome" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable><View style={styles.panelSymbol}><Text style={styles.panelSymbolText}>{symbol}</Text></View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.panelTitle}>{title}</Text>{children}</View>;
}

function EnterButton({ label, onPress, compact = false }: { label: string; onPress: () => void; compact?: boolean }) {
  return <Pressable testID={label === 'Enter' ? 'web-welcome-enter' : undefined} accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>{({ pressed }) => <LinearGradient colors={['#6549e7', '#9c63ed', '#dc68b1']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.enterButton, compact && styles.enterButtonCompact, pressed && styles.pressed]}><Text style={[styles.enterText, compact && styles.enterTextCompact]}>{label}</Text><View style={styles.enterHeartBadge}><Text style={styles.enterHeart}>♡</Text></View></LinearGradient>}</Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#05030f' },
  ambientTop: { position: 'absolute', width: 520, height: 520, top: -220, right: -160, borderRadius: 260, backgroundColor: 'rgba(137,91,241,.22)' },
  ambientBottom: { position: 'absolute', width: 460, height: 460, bottom: -210, left: -160, borderRadius: 230, backgroundColor: 'rgba(231,81,162,.15)' },
  starField: { ...StyleSheet.absoluteFillObject }, star: { position: 'absolute', color: 'rgba(232,216,255,.34)', fontSize: 18 },
  shell: { width: '100%', maxWidth: 430, maxHeight: 900, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.13)', borderRadius: 42, backgroundColor: '#120927', boxShadow: '0 40px 110px rgba(0,0,0,.66)' as never },
  shellCompact: { maxWidth: '100%', borderRadius: 0, borderWidth: 0 },
  topBar: { height: 76, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(220,199,255,.2)', backgroundColor: 'rgba(255,255,255,.055)', alignItems: 'center', justifyContent: 'center' },
  roundButtonActive: { backgroundColor: 'rgba(176,105,223,.28)', borderColor: 'rgba(237,193,255,.5)' }, roundButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' }, music: { color: '#fff', fontSize: 17 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 }, wordmarkBadge: { width: 24, height: 24, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, wordmarkHeart: { color: '#fff', fontSize: 15, fontWeight: '700' }, wordmarkText: { color: '#f2edff', fontSize: 12, fontWeight: '900', letterSpacing: 2.6 },
  scrollContent: { flexGrow: 1, paddingBottom: 14 }, copy: { alignItems: 'center', paddingHorizontal: 29, paddingTop: 7 }, eyebrow: { color: '#b8a0eb', fontSize: 10, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }, title: { color: '#fff', fontFamily: 'Georgia', fontSize: 48, lineHeight: 52, letterSpacing: -2 }, spark: { color: '#f4a8d6', fontSize: 17, marginLeft: 8, marginTop: 2 }, subtitle: { color: '#cabce1', fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 335, marginTop: 12 },
  heroWrap: { height: 390, marginTop: -8, overflow: 'hidden', justifyContent: 'flex-end' }, heroWrapCompact: { height: 330 }, heroGlow: { position: 'absolute', width: 314, height: 314, left: '50%', top: 30, marginLeft: -157, borderRadius: 157, backgroundColor: 'rgba(157,104,255,.21)' }, orbitOne: { position: 'absolute', width: 338, height: 338, left: '50%', top: 18, marginLeft: -169, borderRadius: 169, borderWidth: 1, borderColor: 'rgba(187,153,255,.11)' }, orbitTwo: { position: 'absolute', width: 394, height: 394, left: '50%', top: -10, marginLeft: -197, borderRadius: 197, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.045)' }, moon: { position: 'absolute', left: 28, top: 60, color: '#d7c1ff', fontSize: 24, zIndex: 2 }, doodleHeart: { position: 'absolute', right: 30, top: 48, color: '#ff9ed1', fontSize: 25, zIndex: 2 }, hero: { width: '100%', height: '100%' },
  namePill: { minHeight: 19, marginHorizontal: 36, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, nameText: { color: '#d8caef', fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 11, letterSpacing: .4 }, nameDot: { color: '#b26df1', fontSize: 11 }, handNote: { color: '#c8afd9', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: -2, marginBottom: 10 },
  enterButton: { minHeight: 57, marginHorizontal: 32, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 16px 30px rgba(101,65,219,.3)' as never }, enterButtonCompact: { minHeight: 52, marginHorizontal: 0, marginTop: 22, minWidth: 210, alignSelf: 'center', paddingHorizontal: 24 }, enterText: { color: '#fff', fontSize: 16, fontWeight: '800' }, enterTextCompact: { fontSize: 13 }, enterHeartBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' }, enterHeart: { color: '#fff', fontSize: 18 }, pressed: { opacity: .84, transform: [{ scale: .99 }] }, privacyNote: { color: '#8f82ad', fontSize: 10, textAlign: 'center', marginTop: 10 },
  panel: { flex: 1, minHeight: 650, paddingHorizontal: 30, paddingTop: 38, paddingBottom: 28, justifyContent: 'center' }, backButton: { position: 'absolute', left: 18, top: 8, width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(220,199,255,.15)', backgroundColor: 'rgba(255,255,255,.05)', alignItems: 'center', justifyContent: 'center' }, backText: { color: '#d8ccef', fontSize: 20 }, panelSymbol: { width: 82, height: 82, alignSelf: 'center', borderRadius: 28, backgroundColor: 'rgba(176,105,223,.55)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }, panelSymbolText: { color: '#fff', fontSize: 38 }, panelTitle: { color: '#fff', fontFamily: 'Georgia', fontSize: 38, lineHeight: 40, textAlign: 'center', marginTop: 8 }, panelIntro: { color: '#cabce1', fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 14 },
  roleGrid: { flexDirection: 'row', gap: 12, marginTop: 25 }, roleCard: { flex: 1, minHeight: 164, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(220,199,255,.15)', backgroundColor: 'rgba(255,255,255,.052)', alignItems: 'center', justifyContent: 'center', padding: 12 }, roleIcon: { color: '#d9b9ff', fontSize: 32 }, parentIcon: { color: '#f3a9d5' }, roleTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 12 }, roleBody: { color: '#9f93b8', fontSize: 10, marginTop: 7, textAlign: 'center' }, textLink: { color: '#a899c4', fontSize: 12, textAlign: 'center', marginTop: 22, textDecorationLine: 'underline' },
  comingCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 25, padding: 17, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.045)', borderWidth: 1, borderColor: 'rgba(220,199,255,.15)' }, pulseDot: { width: 9, height: 9, marginTop: 5, borderRadius: 5, backgroundColor: '#b895ff' }, comingCopy: { flex: 1 }, comingTitle: { color: '#fff', fontSize: 12, fontWeight: '800' }, comingBody: { color: '#9d90b5', fontSize: 10, lineHeight: 15, marginTop: 4 }, bipJrLink: { flexDirection: 'row', alignItems: 'center', marginTop: 18, padding: 14, borderRadius: 20, backgroundColor: 'rgba(125,98,214,.18)', borderWidth: 1, borderColor: 'rgba(217,193,255,.18)' }, bipJrMark: { color: '#eee6ff', fontSize: 24 }, bipJrCopy: { flex: 1, marginLeft: 10 }, bipJrTitle: { color: '#fff', fontSize: 14, fontWeight: '800' }, bipJrBody: { color: '#a9b5d0', fontSize: 10, marginTop: 3 }, bipJrArrow: { color: '#d5e1ff', fontSize: 20 }, bipJrArtWrap: { height: 310, marginTop: 22, borderRadius: 30, overflow: 'hidden', backgroundColor: '#0d1732' }, bipJrHero: { width: '100%', height: '100%' }, bipJrFloatingHeart: { position: 'absolute', right: 18, top: 14, color: '#f1c7eb', fontSize: 26 },
  bottomNav: { height: 78, borderTopWidth: 1, borderTopColor: 'rgba(220,199,255,.15)', backgroundColor: 'rgba(7,4,20,.94)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 7, paddingBottom: 11 }, bottomNavCompact: { paddingBottom: 11 }, navItem: { flex: 1, minWidth: 0, height: 57, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4 }, navItemPressed: { backgroundColor: 'rgba(255,255,255,.04)' }, centerNavItem: { transform: [{ translateY: -11 }] }, navIconWrap: { width: 42, height: 34, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, navIconActiveWrap: { backgroundColor: 'rgba(255,255,255,.04)' }, centerIconWrap: { width: 48, height: 48, borderRadius: 18, boxShadow: '0 10px 24px rgba(134,92,239,.36)' as never }, centerIconActiveWrap: { borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }, navIcon: { color: '#766b91', fontSize: 20, lineHeight: 22, fontWeight: '800' }, navIconActive: { color: '#d9ccff' }, centerIcon: { color: '#fff', fontSize: 19 }, navLabel: { color: '#766b91', fontSize: 9, fontWeight: '700' }, navLabelActive: { color: '#d9ccff' },
});
