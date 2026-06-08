// screens/Bippin2Screen.tsx
// Phase 1 polish: time-of-day backdrop, mood-tinted glow, char-aware greeting,
// staggered entrance, breath loop on cloud + streak. Also fixes inverted
// gender-polarity: Raylene → Womanhood content, Rylane → Manhood content
// (was swapped). No screens removed, no new features.

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IMAGES, getRoomBg, TimeOfDay } from '../constants/theme';
import {
  Text, TouchableOpacity, ScrollView, View,
  Image, ImageBackground, Animated, StyleSheet, Platform, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ART: Record<string, Record<string, any>> = {
  raylene: {
    hero:     IMAGES.rayleneFullbody,
    neutral:  IMAGES.rayleneNeutral,
    window:   IMAGES.rayleneWindow,
    thinking: IMAGES.rayleneThinking,
  },
  rylane: {
    hero:     IMAGES.rylaneFullbody,
    neutral:  IMAGES.rylaneNeutral,
    window:   IMAGES.rylaneWindow,
    thinking: IMAGES.rylaneThinking,
  },
};

// ─── Static data — Womanhood (Raylene) ─────────────────────────────────────────
const W_CHIPS = [
  { key: 'period',   emoji: '🩸', label: 'First Period\nSupport' },
  { key: 'cycle',    emoji: '🫶', label: 'Cycle\nWellness' },
  { key: 'mood',     emoji: '🌙', label: 'Mood + Body\nCheck-in' },
  { key: 'comfort',  emoji: '🌷', label: 'Comfort\nMode' },
  { key: 'sekret',   emoji: '🤍', label: "Ask\nSe'kret" },
  { key: 'journal',  emoji: '📝', label: 'Private\nJournal' },
];

const W_MOOD_CHIPS = [
  { label: 'happy',     emoji: '😊' },
  { label: 'calm',      emoji: '😌' },
  { label: 'tired',     emoji: '😴' },
  { label: 'scared',    emoji: '😨' },
  { label: 'emotional', emoji: '🥺' },
  { label: 'okay',      emoji: '🤍' },
];

const W_BIP_FLOW = [
  { icon: '👁️\u200d🗨️', step: 'notice',   sub: 'how you feel' },
  { icon: '📝', step: 'name it',   sub: 'be real' },
  { icon: '🫶', step: 'nourish',   sub: 'yourself' },
  { icon: '🫧', step: 'release',  sub: 'let it out' },
  { icon: '🕊️', step: 'grow',     sub: 'keep bippin' },
];

// ─── Static data — Manhood (Rylane) ───────────────────────────────────────────
const M_CHIPS = [
  { key: 'puberty',    emoji: '🪱', label: 'Puberty\nGuide' },
  { key: 'body',       emoji: '🧠', label: 'Body\nChanges' },
  { key: 'confidence', emoji: '🕊️', label: 'Confidence\nBoost' },
  { key: 'hygiene',    emoji: '🌻', label: 'Hygiene +\nSelf-Care' },
  { key: 'mind',       emoji: '🧠', label: 'Mind\nCheck-in' },
  { key: 'journal',    emoji: '📝', label: 'Private\nJournal' },
];

const M_MOOD_CHIPS = [
  { label: 'happy',   emoji: '😊' },
  { label: 'calm',    emoji: '😌' },
  { label: 'stressed', emoji: '🤯' },
  { label: 'angry',   emoji: '😠' },
  { label: 'tired',   emoji: '😴' },
  { label: 'okay',    emoji: '🤍' },
];

const M_BIP_FLOW = [
  { icon: '👁️\u200d🗨️', step: 'notice',  sub: "what's up" },
  { icon: '📝', step: 'name it', sub: 'be honest' },
  { icon: '🪱', step: 'reset',   sub: 'refocus' },
  { icon: '🫧', step: 'release', sub: 'clear it out' },
  { icon: '🕒', step: 'grow',    sub: 'level up' },
];

interface Bippin2ScreenProps {
  t: Record<string, any>;
  mood: string;
  selectedSekret: string;
  setScreen: (screen: string) => void;
  onMilestone?: () => void;
  BottomNav: React.ReactNode;
  streakDays?: number;
}

const getTimeOfDay = (): TimeOfDay => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
};

const greetingByTime = (time: TimeOfDay, charName: string, isRylane: boolean) => {
  const verb =
    time === 'morning' ? 'Good morning' :
    time === 'day'     ? 'Hey' :
    time === 'evening' ? 'Good evening' :
                         'Good night';
  if (isRylane) {
    return {
      title: `${verb}, ${charName} 🪱`,
      body:
        time === 'morning' ? "fresh start. small wins count today.\nlet's lock in."
      : time === 'day'     ? "mid-day check. you doing okay?\ntake a breath."
      : time === 'evening' ? "long day. you held it together.\nrespect."
                           : "late hours. keep building the best version of you.\nyou've got this.",
    };
  }
  return {
    title: `${verb}, ${charName} 🫶`,
    body:
      time === 'morning' ? "soft start. you don't have to do it all today.\njust be here 💜"
    : time === 'day'     ? "mid-day check-in. how's your body feeling?\nbe gentle 💜"
    : time === 'evening' ? "evening wind-down. you made it through.\nproud of you 💜"
                         : "your body is changing.\nthat's not something to fear or hide.",
  };
};

const moodGlow = (mood?: string): string => {
  const m = (mood || '').toLowerCase();
  if (m === 'happy') return '#fbbf24';
  if (m === 'sad' || m === 'anxious') return '#7dd3fc';
  if (m === 'angry' || m === 'overwhelmed' || m === 'stressed') return '#f472b6';
  if (m === 'tired') return '#6d28d9';
  if (m === 'calm') return '#c4b5fd';
  return '#c4b5fd';
};

export function Bippin2Screen({
  t, mood, selectedSekret, setScreen, onMilestone, BottomNav, streakDays = 0,
}: Bippin2ScreenProps) {

  const isRylane   = selectedSekret === 'rylane';
  const charName   = isRylane ? 'Rylane' : 'Raylene';
  const charEmoji  = isRylane ? '🪱' : '🫶';
  const art        = ART[isRylane ? 'rylane' : 'raylene'];
  const charKey: 'raylene' | 'rylane' = isRylane ? 'rylane' : 'raylene';

  const time = useMemo(() => getTimeOfDay(), []);
  const bg   = useMemo(() => getRoomBg(charKey, time), [charKey, time]);

  // Rylane: cool electric blue. Raylene: theme accent (warm purple).
  // Both still mood-tinted via glow overlay.
  const idAccent   = isRylane ? '#4DA3FF' : t.accent;
  const idSoft     = isRylane ? '#B6DCFF' : t.soft;
  const glow       = useMemo(() => moodGlow(mood), [mood]);

  // ─── Animations ───────────────────────────────────────────────────────────
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const breath   = useRef(new Animated.Value(0)).current;
  const card1    = useRef(new Animated.Value(0)).current;
  const card2    = useRef(new Animated.Value(0)).current;
  const card3    = useRef(new Animated.Value(0)).current;
  const card4    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 550, useNativeDriver: true }).start();

    const stagger = (val: Animated.Value, delay: number) =>
      Animated.timing(val, {
        toValue: 1, duration: 380, delay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      });
    Animated.parallel([
      stagger(card1, 80),
      stagger(card2, 220),
      stagger(card3, 360),
      stagger(card4, 500),
    ]).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2600, useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    breathLoop.start();

    return () => { glowLoop.stop(); breathLoop.stop(); };
  }, [fadeIn, glowAnim, breath, card1, card2, card3, card4]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.18, 0.42] });
  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const cardStyle = (val: Animated.Value) => ({
    opacity: val,
    transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  });

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energyLevel] = useState(72);
  const [sleepHours] = useState('6h 42m');

  const handleChip = (key: string) => {
    const routes: Record<string, string> = {
      period:    'periodCalendar',
      cycle:     'periodCalendar',
      mood:      'calm',
      comfort:   'comfort',
      sekret:    'sekret',
      journal:   'pages',
      puberty:   'sekret',
      body:      'sekret',
      confidence:'bippin2',
      hygiene:   'sekret',
      mind:      'calm',
    };
    const route = routes[key];
    if (route) setScreen(route);
  };

  const scrapCard = (extra?: object) => [
    styles.scrapCard,
    { backgroundColor: 'rgba(30,18,55,0.78)', borderColor: glow + '88', shadowColor: glow },
    extra,
  ] as any;

  const accentBtn = (extra?: object) => [
    styles.accentBtn,
    { backgroundColor: idAccent, shadowColor: idAccent },
    extra,
  ] as any;

  const greeting = greetingByTime(time, charName, isRylane);

  const streakLabel = isRylane ? 'focus streak'     : 'connection streak';
  const streakSub   = isRylane ? 'consistency builds confidence.' : "you're showing up for you.";
  const streakNote  = isRylane ? 'respect, fr.' : 'proud of you 💜';

  const chips       = isRylane ? M_CHIPS       : W_CHIPS;
  const moodChips   = isRylane ? M_MOOD_CHIPS : W_MOOD_CHIPS;
  const bipFlow     = isRylane ? M_BIP_FLOW   : W_BIP_FLOW;

  const cloudSpeech = isRylane
    ? "yo. i'm here. what's on ya mind rn?"
    : "hey. whatever you're feeling right now ✨ it's valid 💜";

  return (
    <View style={styles.root}>
      <ImageBackground source={bg} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(20,10,40,0.55)', 'rgba(40,20,70,0.72)', 'rgba(15,8,30,0.9)']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View pointerEvents="none" style={[styles.bgGlow, { backgroundColor: glow, opacity: glowOpacity }]} />

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backChip} onPress={() => setScreen('home')}>
            <Text style={styles.backChipText}>🛡 room</Text>
          </TouchableOpacity>
          <View style={[styles.privateBadge, { backgroundColor: 'rgba(20,12,40,0.7)', borderColor: glow + '66' }]}>
            <Text style={styles.privateBadgeText}>🔒 private</Text>
          </View>
        </View>
        <Text style={[styles.screenTitle, { color: idAccent }]}>
          {isRylane ? 'Bippin 2\nManhood 🪱' : 'Bippin 2\nWomanhood 🫶'}
        </Text>
        <Text style={[styles.screenSub, { color: idSoft }]}>
          {isRylane ? 'growing into yourself. ⚡' : 'growing at your own pace. 💜'}
        </Text>

        <Animated.View style={cardStyle(card1)}>
          <View style={styles.heroSection}>
            <Image source={art.hero} style={styles.heroArt} resizeMode="contain" />
            <View style={styles.heroRight}>
              <View style={scrapCard(styles.greetCard)}>
                <Text style={[styles.greetTitle, { color: idSoft }]}>{greeting.title}</Text>
                <Text style={styles.greetBody}>{greeting.body}</Text>
              </View>
              <Animated.View style={[styles.streakCard, { backgroundColor: 'rgba(20,12,40,0.78)', borderColor: glow + '88' }, { transform: [{ scale: breathScale }] }]}>
                <Text style={[styles.streakLabel, { color: idAccent }]}>{streakLabel}</Text>
                <View style={styles.streakRow}>
                  <Text style={styles.streakFlame}>{isRylane ? '🪱' : '🫀'}</Text>
                  <Text style={[styles.streakDays, { color: '#fff' }]}>{streakDays} days</Text>
                </View>
                <Text style={styles.streakSub}>{streakSub}</Text>
                <Text style={styles.streakNote}>{streakNote}</Text>
              </Animated.View>
            </View>
          </View>

          <View style={styles.cloudRow}>
            <Animated.Text style={[styles.cloudMascot, { transform: [{ scale: breathScale }] }]}>
              {isRylane ? '☁️' : '☁️'}
            </Animated.Text>
            <View style={[styles.cloudBubble, { backgroundColor: 'rgba(30,18,55,0.85)', borderColor: glow + '66' }]}>
              <Text style={styles.cloudText}>{cloudSpeech}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={cardStyle(card2)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {chips.map(chip => (
              <TouchableOpacity
                key={chip.key}
                style={[styles.featureChip, { backgroundColor: 'rgba(20,12,40,0.75)', borderColor: glow + '66' }]}
                onPress={() => handleChip(chip.key)}
              >
                <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                <Text style={[styles.chipLabel, { color: idSoft }]}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* WOMANHOOD CARDS (Raylene = !isRylane). Polarity fixed. */}
        <Animated.View style={cardStyle(card3)}>
          {!isRylane && (
            <>
              <View style={scrapCard()}>
                <Text style={[styles.cardLabel, { color: idAccent }]}>first period support 🩸</Text>
                <View style={styles.periodCardInner}>
                  <View style={styles.periodCardText}>
                    <Text style={styles.cardBodyText}>it's okay to feel scared.</Text>
                    <Text style={styles.cardBodyText}>you're not alone, ever.</Text>
                    <TouchableOpacity
                      style={[styles.learnBtn, { borderColor: idAccent }]}
                      onPress={() => setScreen('periodCalendar')}
                    >
                      <Text style={[styles.learnBtnText, { color: idAccent }]}>learn more</Text>
                    </TouchableOpacity>
                  </View>
                  <Image source={art.thinking} style={styles.periodArt} resizeMode="contain" />
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={[scrapCard(), styles.halfCard]}>
                  <Text style={[styles.cardLabel, { color: idAccent }]}>comfort tip 🌷</Text>
                  <Text style={styles.cardBodyText}>
                    warmth for cramps. water. rest. be gentle with yourself.
                  </Text>
                  <TouchableOpacity onPress={() => setScreen('comfort')}>
                    <Text style={[styles.linkText, { color: idAccent }]}>more tips 💬</Text>
                  </TouchableOpacity>
                </View>
                <View style={[scrapCard(), styles.halfCard]}>
                  <Text style={[styles.cardLabel, { color: idAccent }]}>cycle calendar 🗓️</Text>
                  <Text style={styles.cardBodyText}>
                    track your cycle. private. yours.
                  </Text>
                  <TouchableOpacity
                    style={accentBtn({ marginTop: 10 })}
                    onPress={() => setScreen('periodCalendar')}
                  >
                    <Text style={styles.accentBtnText}>view calendar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={scrapCard()}>
                <Text style={[styles.cardLabel, { color: idAccent }]}>mood + body check-in {charEmoji}</Text>
                <Text style={styles.cardBodyText}>how are you feeling right now?</Text>
                <View style={styles.moodRow}>
                  {moodChips.map(chip => {
                    const active = selectedMood === chip.label;
                    return (
                      <TouchableOpacity
                        key={chip.label}
                        style={[
                          styles.moodChip,
                          {
                            backgroundColor: active ? idAccent : 'rgba(20,12,40,0.6)',
                            borderColor: active ? idAccent : glow + '55',
                          },
                        ]}
                        onPress={() => setSelectedMood(active ? null : chip.label)}
                      >
                        <Text style={styles.moodEmoji}>{chip.emoji}</Text>
                        <Text style={[styles.moodLabel, { color: active ? '#fff' : idSoft }]}>
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedMood && (
                  <Text style={[styles.moodAck, { color: idSoft }]}>
                    {charEmoji} {charName} sees you. that's valid.
                  </Text>
                )}
              </View>
            </>
          )}

          {/* MANHOOD CARDS (Rylane = isRylane). Polarity fixed. */}
          {isRylane && (
            <>
              <View style={styles.threeColRow}>
                <View style={[scrapCard(), styles.thirdCard]}>
                  <Text style={[styles.cardLabel, { color: idAccent }]}>energy check 🪱</Text>
                  <Text style={styles.cardBodySmall}>how you feel rn?</Text>
                  <View style={styles.batteryOuter}>
                    <View style={[styles.batteryInner, { width: `${energyLevel}%`, backgroundColor: idAccent }]} />
                  </View>
                  <Text style={[styles.batteryLabel, { color: idSoft }]}>{energyLevel}% energy</Text>
                  <TouchableOpacity
                    style={[styles.learnBtn, { borderColor: idAccent, marginTop: 8 }]}
                    onPress={() => setScreen('calm')}
                  >
                    <Text style={[styles.learnBtnText, { color: idAccent }]}>check in</Text>
                  </TouchableOpacity>
                </View>

                <View style={[scrapCard(), styles.thirdCard]}>
                  <Text style={[styles.cardLabel, { color: idAccent }]}>sleep 😴</Text>
                  <Text style={styles.cardBodySmall}>how'd you sleep?</Text>
                  <Text style={styles.sleepBig}>😴</Text>
                  <Text style={styles.sleepTime}>{sleepHours}</Text>
                  <Text style={styles.cardBodySmall}>last night</Text>
                  <TouchableOpacity onPress={() => {}}>
                    <Text style={[styles.linkText, { color: idAccent }]}>track sleep 💤</Text>
                  </TouchableOpacity>
                </View>

                <View style={[scrapCard(), styles.thirdCard]}>
                  <Text style={[styles.cardLabel, { color: idAccent }]}>quick tip 🪞</Text>
                  <Text style={styles.cardBodySmall}>
                    small habits. big future. stay focused, stay you.
                  </Text>
                  <TouchableOpacity onPress={() => setScreen('calm')}>
                    <Text style={[styles.linkText, { color: idAccent }]}>more tips 💬</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={scrapCard()}>
                <View style={styles.goalRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardLabel, { color: idAccent }]}>goal tracker 🏆</Text>
                    <Text style={styles.cardBodyText}>
                      track goals. level up. every day.
                    </Text>
                    <TouchableOpacity
                      style={accentBtn({ marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 18 })}
                      onPress={() => { onMilestone?.(); }}
                    >
                      <Text style={styles.accentBtnText}>view goals</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.goalTrophy}>🏆</Text>
                </View>
              </View>

              <View style={scrapCard()}>
                <Text style={[styles.cardLabel, { color: idAccent }]}>mood check {charEmoji}</Text>
                <Text style={styles.cardBodyText}>how are you feeling rn?</Text>
                <View style={styles.moodRow}>
                  {moodChips.map(chip => {
                    const active = selectedMood === chip.label;
                    return (
                      <TouchableOpacity
                        key={chip.label}
                        style={[
                          styles.moodChip,
                          {
                            backgroundColor: active ? idAccent : 'rgba(20,12,40,0.6)',
                            borderColor: active ? idAccent : glow + '55',
                          },
                        ]}
                        onPress={() => setSelectedMood(active ? null : chip.label)}
                      >
                        <Text style={styles.moodEmoji}>{chip.emoji}</Text>
                        <Text style={[styles.moodLabel, { color: active ? '#fff' : idSoft }]}>
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedMood && (
                  <Text style={[styles.moodAck, { color: idSoft }]}>
                    {charEmoji} {charName} got you. that's valid.
                  </Text>
                )}
              </View>
            </>
          )}
        </Animated.View>

        <Animated.View style={cardStyle(card4)}>
          <View style={scrapCard()}>
            <Text style={[styles.cardLabel, { color: idAccent }]}>
              BIP FLOW {isRylane ? '🪱' : '🫶'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flowScroll}
            >
              {bipFlow.map((item, i) => (
                <React.Fragment key={item.step}>
                  <View style={styles.flowStep}>
                    <View style={[styles.flowIconWrap, { backgroundColor: idAccent + '22', borderColor: idAccent + '66' }]}>
                      <Text style={styles.flowIcon}>{item.icon}</Text>
                    </View>
                    <Text style={[styles.flowStepLabel, { color: '#fff' }]}>{item.step}</Text>
                    <Text style={[styles.flowStepSub, { color: idSoft }]}>{item.sub}</Text>
                  </View>
                  {i < bipFlow.length - 1 && (
                    <Text style={[styles.flowArrow, { color: idAccent }]}>➜</Text>
                  )}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>

          <View style={[scrapCard(), styles.quoteCard]}>
            <Image source={art.neutral} style={styles.quoteArt} resizeMode="contain" />
            <Text style={[styles.quoteText, { color: idSoft }]}>
              {isRylane
                ? `"you don't gotta have it all figured out. just keep going. that's enough."`
                : `"you are allowed to be both a work in progress and a whole person right now."`}
            </Text>
            <Text style={[styles.quoteSig, { color: idAccent }]}>— {charName}</Text>
          </View>

          <View style={styles.stickyNote}>
            <Text style={styles.stickyText}>
              {isRylane ? '“grow at your pace. no race. respect.”' : '“soft is strong. you’re growing right on time.”'}
            </Text>
          </View>

          <TouchableOpacity
            style={accentBtn()}
            onPress={() => { onMilestone?.(); setScreen('sekret'); }}
          >
            <Text style={styles.accentBtnText}>
              {isRylane ? `talk to ${charName} 🪱` : `talk to ${charName} 🫶`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => setScreen('pages')}
          >
            <Text style={styles.ghostBtnText}>🔒 open private journal</Text>
          </TouchableOpacity>

          <View style={{ height: 36 }} />
        </Animated.View>
      </Animated.ScrollView>

      {BottomNav}
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#0e0820' },
  bgGlow:       {
    position: 'absolute', top: -100, alignSelf: 'center',
    width: 360, height: 360, borderRadius: 180,
  },
  container:    { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 58 : 38 },

  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backChip:      { backgroundColor: 'rgba(20,12,40,0.75)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  backChipText:   { color: '#cbb6f7', fontSize: 13, fontWeight: '600' },
  privateBadge:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  privateBadgeText:{ color: '#cbb6f7', fontSize: 12, fontWeight: '600' },
  screenTitle:    { fontSize: 32, fontWeight: 'bold', letterSpacing: 0.3, marginBottom: 4 },
  screenSub:      { fontSize: 14, marginBottom: 22, fontStyle: 'italic' },

  heroSection:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  heroArt:        { width: 120, height: 180, borderRadius: 18 },
  heroRight:      { flex: 1, gap: 10 },
  greetCard:      { marginBottom: 0 },
  greetTitle:     { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  greetBody:      { color: '#e9defc', fontSize: 13, lineHeight: 20 },
  streakCard:     { padding: 12, borderRadius: 18, borderWidth: 1, shadowOpacity: 0.4, shadowRadius: 10 },
  streakLabel:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  streakRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  streakFlame:    { fontSize: 20 },
  streakDays:     { fontSize: 22, fontWeight: 'bold' },
  streakSub:      { color: '#cbb6f7', fontSize: 11, marginBottom: 2 },
  streakNote:     { fontSize: 11, fontStyle: 'italic', color: '#fff' },

  cloudRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  cloudMascot:    { fontSize: 30 },
  cloudBubble:    { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, borderBottomLeftRadius: 4 },
  cloudText:      { color: '#e9defc', fontSize: 13, lineHeight: 19 },

  chipsScroll:    { paddingBottom: 4, gap: 10, marginBottom: 18 },
  featureChip:    {
    width: 84, padding: 10, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', gap: 4,
  },
  chipEmoji:      { fontSize: 22 },
  chipLabel:      { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  scrapCard:      {
    padding: 16, borderRadius: 22, marginBottom: 14, borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.32, shadowRadius: 10, elevation: 4,
  },
  cardLabel:      { fontSize: 15, fontWeight: '700', marginBottom: 8, letterSpacing: 0.2 },
  cardBodyText:   { color: '#e9defc', fontSize: 14, lineHeight: 21, marginBottom: 4 },
  cardBodySmall:  { color: '#cbb6f7', fontSize: 12, lineHeight: 18, marginBottom: 4 },
  linkText:       { fontSize: 13, fontWeight: '600', marginTop: 6 },
  learnBtn:       { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  learnBtnText:   { fontSize: 13, fontWeight: '600' },

  twoColRow:      { flexDirection: 'row', gap: 12, marginBottom: 14 },
  halfCard:       { flex: 1, marginBottom: 0 },
  threeColRow:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
  thirdCard:      { flex: 1, marginBottom: 0, padding: 12 },

  periodCardInner:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodCardText: { flex: 1 },
  periodArt:      { width: 70, height: 80 },

  batteryOuter:   { height: 10, backgroundColor: 'rgba(20,12,40,0.8)', borderRadius: 6, marginVertical: 6, overflow: 'hidden' },
  batteryInner:   { height: '100%', borderRadius: 6 },
  batteryLabel:   { fontSize: 12, fontWeight: '700' },

  sleepBig:       { fontSize: 28, textAlign: 'center', marginVertical: 4 },
  sleepTime:      { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#fff' },

  goalRow:        { flexDirection: 'row', alignItems: 'center' },
  goalTrophy:     { fontSize: 52, marginLeft: 8 },

  moodRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  moodChip:       {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  moodEmoji:      { fontSize: 16 },
  moodLabel:      { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  moodAck:        { fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },

  flowScroll:     { alignItems: 'center', gap: 6, paddingVertical: 8 },
  flowStep:       { alignItems: 'center', width: 72 },
  flowIconWrap:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  flowIcon:       { fontSize: 22 },
  flowStepLabel:  { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  flowStepSub:    { fontSize: 10, textAlign: 'center', marginTop: 2 },
  flowArrow:      { fontSize: 18, marginTop: -6, paddingHorizontal: 2 },

  quoteCard:      { alignItems: 'center', paddingVertical: 20 },
  quoteArt:       { width: 80, height: 80, marginBottom: 12 },
  quoteText:      { fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  quoteSig:       { fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },

  stickyNote:     { backgroundColor: '#fff8e7', borderColor: '#7c3aed', borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 10, marginBottom: 14, transform: [{ rotate: '-2deg' }] },
  stickyText:     { color: '#3a2461', fontSize: 13, fontStyle: 'italic', textAlign: 'center' },

  accentBtn:      {
    padding: 15, borderRadius: 18, alignItems: 'center', marginBottom: 12,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  accentBtnText:  { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  ghostBtn:       { backgroundColor: 'rgba(20,12,40,0.75)', padding: 13, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
  ghostBtnText:   { color: '#cbb6f7', fontWeight: '600', fontSize: 14 },
});
