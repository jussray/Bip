import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IMAGES } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  getSyCompanionMoment,
  SY_COMPANION_MOMENTS,
  type CompanionMomentId,
} from '@/features/sekret/companionMoments';
import { TEEN_ROUTES } from '@/teen/routes';

const SCENE_TINTS = {
  quiet: '#8b5cf6',
  writing: '#6b21a8',
  warm: '#f0c96a',
  night: '#7c3aed',
} as const;

export default function CompanionMomentScreen() {
  const router = useRouter();
  const { setSelectedSekret } = useAppContext();
  const [selectedId, setSelectedId] = useState<CompanionMomentId>('sort');

  const selected = useMemo(() => getSyCompanionMoment(selectedId), [selectedId]);

  function continueFromMoment() {
    if (selected.destination.kind === 'pages') {
      // AppContext intentionally keeps the persisted compatibility key.
      // Downstream Pages normalizes rylane -> canonical companion id `sy`.
      setSelectedSekret(selected.destination.selectedSekret);
      router.push(TEEN_ROUTES.pages as never);
      return;
    }

    // companion-chat still accepts the persisted PersonalityId vocabulary.
    // Adapt canonical `sy` to legacy route key `rylane` here; the chat engine
    // then normalizes rylane -> sy before any companion/safety request.
    const routeCompanion = selected.destination.companion === 'sy' ? 'rylane' : selected.destination.companion;
    setSelectedSekret(routeCompanion);
    router.push({
      pathname: TEEN_ROUTES.companionChat,
      params: {
        companion: routeCompanion,
        surface: selected.destination.surface,
      },
    } as never);
  }

  return (
    <LinearGradient colors={['#210d39', '#0d0618', '#140620']} style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.header}>
            <Text style={s.brand} accessibilityRole="header">
              Se'<Text style={s.brandSoft}>kret</Text> Bip
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [s.backButton, pressed && s.pressed]}
            >
              <Text style={s.backGlyph}>‹</Text>
            </Pressable>
          </View>

          <Text style={s.eyebrow}>A quiet space with Sy</Text>
          <Text style={s.title} accessibilityRole="header">
            Let Sy help you name the moment.
          </Text>
          <Text style={s.subtitle}>
            Choose what feels closest. There is no right answer, and you can change it at any time.
          </Text>

          <View
            style={s.scene}
            accessibilityLabel={`Sy is here with you. ${selected.label} is selected.`}
          >
            <View
              pointerEvents="none"
              style={[s.sceneGlow, { backgroundColor: SCENE_TINTS[selected.scene] }]}
            />
            <View pointerEvents="none" style={[s.star, s.starOne]} />
            <View pointerEvents="none" style={[s.star, s.starTwo]} />
            <View pointerEvents="none" style={[s.star, s.starThree]} />
            <View pointerEvents="none" style={[s.star, s.starFour]} />

            {selected.scene === 'night' ? (
              <View pointerEvents="none" style={s.window}>
                <View style={s.windowVertical} />
                <View style={s.windowHorizontal} />
                <View style={s.cityRow}>
                  <View style={[s.building, { height: 28 }]} />
                  <View style={[s.building, { height: 42 }]} />
                  <View style={[s.building, { height: 32 }]} />
                  <View style={[s.building, { height: 48 }]} />
                </View>
              </View>
            ) : null}

            <Image
              source={IMAGES.rylaneNeutral}
              resizeMode="contain"
              accessibilityLabel="Sy, the quiet and loyal Se'kret Bip companion"
              style={[
                s.syImage,
                selected.scene === 'writing' && s.syWriting,
                selected.scene === 'night' && s.syNight,
              ]}
            />

            {selected.scene === 'writing' ? (
              <View pointerEvents="none" style={s.journal}>
                <View style={s.journalLine} />
                <View style={s.journalLine} />
                <View style={[s.journalLine, { width: '62%' }]} />
              </View>
            ) : null}
          </View>

          <View style={s.quoteBubble} accessibilityLiveRegion="polite">
            <Text style={s.quote}>“{selected.quote}”</Text>
          </View>

          <Text style={s.eyebrow}>What kind of moment is this?</Text>
          <View style={s.choices} accessibilityRole="radiogroup">
            {SY_COMPANION_MOMENTS.map(moment => {
              const isSelected = moment.id === selectedId;
              return (
                <Pressable
                  key={moment.id}
                  testID={`sy-moment-choice-${moment.id}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={moment.label}
                  onPress={() => setSelectedId(moment.id)}
                  style={({ pressed }) => [
                    s.choice,
                    isSelected && s.choiceSelected,
                    pressed && s.pressed,
                  ]}
                >
                  <Text style={[s.choiceText, isSelected && s.choiceTextSelected]}>
                    {moment.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            testID="sy-moment-action"
            accessibilityRole="button"
            accessibilityLabel={selected.action}
            onPress={continueFromMoment}
            style={({ pressed }) => [s.action, pressed && s.actionPressed]}
          >
            <Text style={s.actionText}>{selected.action}  →</Text>
          </Pressable>

          <Text style={s.exitNote}>You can leave, switch companions, or change your choice whenever you want.</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0618' },
  safe: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 30 },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: '#f0c96a',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  brandSoft: { color: '#ddd6fe', fontWeight: '500' },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(221,214,254,0.20)',
    backgroundColor: 'rgba(105,53,150,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: { color: '#ddd6fe', fontSize: 32, lineHeight: 34, marginTop: -2 },
  eyebrow: {
    marginTop: 12,
    marginBottom: 8,
    color: '#cda864',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: 330,
    color: '#fff',
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    maxWidth: 350,
    marginTop: 10,
    color: '#b6a1d0',
    fontSize: 13,
    lineHeight: 20,
  },
  scene: {
    height: 270,
    marginHorizontal: -24,
    marginTop: 18,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sceneGlow: {
    position: 'absolute',
    width: 250,
    height: 150,
    borderRadius: 125,
    left: '50%',
    bottom: -18,
    marginLeft: -125,
    opacity: 0.28,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#f0c96a',
    opacity: 0.8,
  },
  starOne: { left: '16%', top: 44 },
  starTwo: { right: '20%', top: 30, backgroundColor: '#ddd6fe' },
  starThree: { right: '8%', top: 134 },
  starFour: { left: '9%', top: 176, backgroundColor: '#ddd6fe' },
  syImage: {
    position: 'absolute',
    width: 252,
    height: 276,
    left: '50%',
    bottom: -8,
    marginLeft: -126,
  },
  syWriting: { transform: [{ rotate: '-2deg' }] },
  syNight: { transform: [{ translateX: 12 }, { rotate: '-2deg' }] },
  window: {
    position: 'absolute',
    left: 28,
    top: 20,
    width: 118,
    height: 142,
    borderWidth: 2,
    borderColor: 'rgba(221,214,254,0.17)',
    borderRadius: 15,
    backgroundColor: 'rgba(27,8,59,0.72)',
    overflow: 'hidden',
  },
  windowVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(221,214,254,0.14)',
  },
  windowHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '52%',
    height: 2,
    backgroundColor: 'rgba(221,214,254,0.14)',
  },
  cityRow: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 7,
    height: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  building: { width: 20, backgroundColor: '#18072e', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  journal: {
    position: 'absolute',
    width: 102,
    height: 58,
    left: '50%',
    bottom: 14,
    marginLeft: -51,
    borderRadius: 8,
    padding: 12,
    gap: 7,
    backgroundColor: 'rgba(107,33,168,0.94)',
  },
  journalLine: { width: '100%', height: 2, borderRadius: 1, backgroundColor: 'rgba(221,214,254,0.58)' },
  quoteBubble: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 58,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(221,214,254,0.19)',
    backgroundColor: 'rgba(63,26,96,0.34)',
  },
  quote: {
    color: '#ddd6fe',
    fontSize: 17,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
    marginBottom: 15,
  },
  choice: {
    width: '48.5%',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(221,214,254,0.19)',
    backgroundColor: 'rgba(105,53,150,0.18)',
  },
  choiceSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(107,33,168,0.72)',
  },
  choiceText: { color: '#b6a1d0', fontSize: 12, lineHeight: 16, fontWeight: '600' },
  choiceTextSelected: { color: '#fff' },
  pressed: { opacity: 0.78 },
  action: {
    minHeight: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#7c3aed',
  },
  actionPressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  exitNote: {
    marginTop: 12,
    paddingHorizontal: 8,
    color: 'rgba(221,214,254,0.46)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
