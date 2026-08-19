import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useOnboarding } from '@/context/OnboardingContext';
import {
  CANONICAL_COMPANION_IDS,
  presentationForMode,
  presentationModeForProfileGender,
  saveCompanionPresentation,
  uniformCompanionPresentation,
  type CompanionPresentationMap,
  type CompanionPresentationVariant,
} from '@/features/identity/companionPresentation';
import { resolveVisibleIdentity, type NamedCompanionId } from '@/features/sekret/identityContract';

type Identity = 'girl' | 'boy' | 'other';
type Companion = 'raylene' | 'rylane' | 'cloud' | 'night';

const IDENTITIES: { id: Identity; label: string }[] = [
  { id: 'girl', label: 'Girl' },
  { id: 'boy', label: 'Boy' },
  { id: 'other', label: 'My own way' },
];

const COMPANIONS: { id: Companion; label: string }[] = [
  { id: 'raylene', label: 'Suhana' },
  { id: 'rylane', label: 'Sy' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'night', label: 'Night' },
];

const PRESENTATION_VARIANTS: CompanionPresentationVariant[] = ['girl', 'boy'];

const PURPLE     = '#7c3aed';
const PURPLE_DIM = '#4c1d95';
const BG         = '#0a0a0a';
const TEXT       = '#f3f3f5';
const MUTED      = '#8b7fa0';
const ACCENT     = '#a78bfa';

const STEPS    = 4;
const STEP_IDX = 2; // step 3 of 4

export default function IdentityScreen() {
  const { advance } = useOnboarding();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [choice, setChoice] = useState<Companion>('raylene');
  const [presentationVariants, setPresentationVariants] = useState<CompanionPresentationMap>(
    uniformCompanionPresentation('girl'),
  );

  function chooseIdentity(next: Identity) {
    setIdentity(next);
    const mode = presentationModeForProfileGender(next);
    setPresentationVariants(current => presentationForMode(mode, current));
  }

  function setCompanionVariant(
    companionId: NamedCompanionId,
    variant: CompanionPresentationVariant,
  ) {
    setPresentationVariants(current => ({
      ...current,
      [companionId]: variant,
    }));
  }

  async function handleNext() {
    if (!identity) return;

    const presentationMode = presentationModeForProfileGender(identity);
    await AsyncStorage.multiSet([
      ['bip_onboarding_gender', identity],
      ['bip_onboarding_companion', choice],
    ]);
    await saveCompanionPresentation({
      mode: presentationMode,
      variants: presentationForMode(presentationMode, presentationVariants),
    });
    await advance('identity_set', { role: 'teen' });
    router.push('/(onboarding)/reflection');
  }

  return (
    <View style={styles.root}>
      <View style={styles.bgDot1} pointerEvents="none" />
      <View style={styles.bgDot2} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.stepDots}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === STEP_IDX && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.title}>Make this space feel like you.</Text>
        <Text style={styles.sub}>Pick a starting point. You can change it later in Profile.</Text>

        <Text style={styles.label}>You are</Text>
        <View style={styles.grid}>
          {IDENTITIES.map(item => (
            <TouchableOpacity
              key={item.id}
              testID={`identity-${item.id}`}
              onPress={() => chooseIdentity(item.id)}
              style={[styles.card, identity === item.id && styles.cardActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: identity === item.id }}
            >
              <Text style={[styles.cardText, identity === item.id && styles.cardTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.presentationNote}>
          Your choice sets the starting look for your crew. Their names and personalities stay the same.
        </Text>

        {identity === 'other' ? (
          <View testID="companion-presentation-mixer" style={styles.mixer}>
            <Text style={styles.label}>Mix your crew</Text>
            <Text style={styles.mixerHint}>Choose the girl or boy visual for each companion.</Text>
            {CANONICAL_COMPANION_IDS.map(companionId => (
              <View key={companionId} style={styles.mixerRow}>
                <Text style={styles.mixerName}>{resolveVisibleIdentity(companionId)}</Text>
                <View style={styles.variantChoices}>
                  {PRESENTATION_VARIANTS.map(variant => {
                    const selected = presentationVariants[companionId] === variant;
                    return (
                      <TouchableOpacity
                        key={variant}
                        testID={`companion-presentation-${companionId}-${variant}`}
                        onPress={() => setCompanionVariant(companionId, variant)}
                        accessibilityRole="button"
                        accessibilityLabel={`${resolveVisibleIdentity(companionId)} ${variant} presentation`}
                        accessibilityState={{ selected }}
                        style={[styles.variantButton, selected && styles.variantButtonActive]}
                      >
                        <Text style={[styles.variantText, selected && styles.variantTextActive]}>
                          {variant === 'girl' ? 'Girl' : 'Boy'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.label}>Your first Se'kret</Text>
        <View style={styles.grid}>
          {COMPANIONS.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setChoice(item.id)}
              style={[styles.card, choice === item.id && styles.cardActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: choice === item.id }}
            >
              <Text style={[styles.cardText, choice === item.id && styles.cardTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!identity}
          onPress={handleNext}
          style={[styles.button, !identity && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.buttonText}>Keep going →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  bgDot1:        { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: '#4c1d9520', top: -80, right: -100 },
  bgDot2:        { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#7c3aed12', bottom: 60, left: -80 },
  content:       { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingHorizontal: 28, paddingBottom: 180 },
  back:          { marginBottom: 24 },
  backText:      { color: MUTED, fontSize: 22 },
  stepDots:      { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333' },
  dotActive:     { backgroundColor: PURPLE, width: 18, borderRadius: 3 },
  title:         { color: TEXT, fontSize: 31, fontWeight: '900', lineHeight: 39, marginBottom: 10 },
  sub:           { color: MUTED, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  label:         { color: TEXT, fontSize: 13, fontWeight: '900', marginTop: 18, marginBottom: 10 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card:          { width: '48%', minHeight: 62, borderRadius: 18, borderWidth: 1.5, borderColor: '#ffffff14', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16161e', padding: 10 },
  cardActive:    { borderColor: PURPLE, backgroundColor: 'rgba(124,58,237,0.18)' },
  cardText:      { color: ACCENT, fontSize: 14, fontWeight: '800' },
  cardTextActive: { color: TEXT },
  presentationNote: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 12 },
  mixer:         { marginTop: 6 },
  mixerHint:     { color: MUTED, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  mixerRow:      { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ffffff0d' },
  mixerName:     { color: TEXT, fontSize: 14, fontWeight: '800' },
  variantChoices: { flexDirection: 'row', gap: 8 },
  variantButton: { minWidth: 66, minHeight: 40, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#ffffff14', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16161e' },
  variantButtonActive: { borderColor: PURPLE, backgroundColor: 'rgba(124,58,237,0.18)' },
  variantText:   { color: ACCENT, fontSize: 12, fontWeight: '800' },
  variantTextActive: { color: TEXT },
  footer:        { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36, paddingTop: 16, backgroundColor: 'rgba(10,10,10,0.97)' },
  button:        { height: 58, borderRadius: 20, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  disabled:      { opacity: 0.35, shadowOpacity: 0 },
  buttonText:    { color: '#fff', fontSize: 17, fontWeight: '900' },
});
