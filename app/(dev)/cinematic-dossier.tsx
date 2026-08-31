import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { CinematicEvidenceBoard } from '@/components/founder/CinematicEvidenceBoard';
import { isFounderPreviewEnabled } from '@/constants/founderPreview';
import { IMAGES, SEKRET_PROFILES, type VibeKey } from '@/constants/theme';

const COMPANIONS = ['night', 'soft', 'rylane', 'cloud'] as const satisfies readonly VibeKey[];
type DossierCompanion = (typeof COMPANIONS)[number];

const DISPLAY_NAMES: Record<DossierCompanion, string> = {
  night: 'Night',
  soft: 'Raylene',
  rylane: 'Rylane',
  cloud: 'Cloud',
};

const HERO_IMAGES: Record<DossierCompanion, number> = {
  night: IMAGES.nightNeutral,
  soft: IMAGES.rayleneNeutral,
  rylane: IMAGES.rylaneNeutral,
  cloud: IMAGES.cloudAvatarNeutral,
};

const SHOT_IMAGES: Record<DossierCompanion, readonly number[]> = {
  night: [
    IMAGES.nightNeutral,
    IMAGES.nightListening,
    IMAGES.nightThinking,
    IMAGES.nightProtective,
    IMAGES.nightRelaxed,
    IMAGES.nightSoftsmile,
    IMAGES.nightNeutral,
  ],
  soft: [
    IMAGES.rayleneNeutral,
    IMAGES.rayleneWindow,
    IMAGES.rayleneThinking,
    IMAGES.rayleneWriting,
    IMAGES.rayleneHappy,
    IMAGES.rayleneConfident,
    IMAGES.rayleneNeutral,
  ],
  rylane: [
    IMAGES.rylaneNeutral,
    IMAGES.rylaneWindow,
    IMAGES.rylaneThinking,
    IMAGES.rylaneWriting,
    IMAGES.rylaneHappy,
    IMAGES.rylaneFullbody,
    IMAGES.rylaneNeutral,
  ],
  cloud: [
    IMAGES.cloudAvatarNeutral,
    IMAGES.cloudAvatarThinking,
    IMAGES.cloudHeadphones,
    IMAGES.cloudAvatarWriting,
    IMAGES.cloudAvatarHappy,
    IMAGES.cloudAvatarWindow,
    IMAGES.cloudAvatarNeutral,
  ],
};

const SHOT_BLUEPRINT = [
  {
    id: '01',
    title: 'The room receives you',
    beat: 'Arrive first. Nothing demands an explanation.',
    camera: 'WIDE / SLOW PUSH',
    atmosphere: 'ROOM TONE / SOFT LIGHT',
  },
  {
    id: '02',
    title: 'A signal, not a spotlight',
    beat: 'Mood and room cues become noticeable without taking over.',
    camera: 'MEDIUM / GENTLE DRIFT',
    atmosphere: 'LOW MOTION / AMBIENCE',
  },
  {
    id: '03',
    title: 'The companion listens',
    beat: 'Presence leads. The user keeps control of the pace.',
    camera: 'CLOSE / HELD',
    atmosphere: 'QUIET / BREATHING ROOM',
  },
  {
    id: '04',
    title: 'Words find a shape',
    beat: 'Pages, voice, or a quiet tool gives the feeling somewhere to go.',
    camera: 'OVER SHOULDER / STATIC',
    atmosphere: 'FOCUS / LIGHT TEXTURE',
  },
  {
    id: '05',
    title: 'A small reset',
    beat: 'Comfort and Calm make regulation available without turning it into a test.',
    camera: 'MEDIUM / SLOW CIRCLE',
    atmosphere: 'SOFTEN / STEADY',
  },
  {
    id: '06',
    title: 'Connection stays a choice',
    beat: 'Bridge and community paths exist, but the user decides whether to open them.',
    camera: 'TWO-SHOT / STILL',
    atmosphere: 'WARM / OPEN SPACE',
  },
  {
    id: '07',
    title: 'The journey continues',
    beat: 'The room remembers the return without making the person perform for it.',
    camera: 'WIDE / SLOW PULL BACK',
    atmosphere: 'RETURN / ROOM FADE',
  },
] as const;

const ACCENTS: Record<DossierCompanion, string> = {
  night: '#9f7aea',
  soft: '#c44582',
  rylane: '#477f9f',
  cloud: '#7076c8',
};

export default function CinematicDossierPreviewRoute() {
  const enabled = isFounderPreviewEnabled();
  const [selected, setSelected] = useState<DossierCompanion>('night');

  const board = useMemo(() => {
    const profile = SEKRET_PROFILES[selected];
    const images = SHOT_IMAGES[selected];
    const displayName = DISPLAY_NAMES[selected];

    return {
      identity: {
        project: "Se'kret Bip",
        name: displayName,
        title: profile.title,
        tagline: profile.vibe,
        mission: 'Help feelings become safer to notice, name, and move through.',
        about: `${displayName} is shown here as a companion system, not just a portrait: identity, behavior, tools, environment, and the evidence gate all live on one board.`,
        quote: profile.greeting,
        image: HERO_IMAGES[selected],
      },
      shots: SHOT_BLUEPRINT.map((shot, index) => ({
        ...shot,
        image: images[index] ?? HERO_IMAGES[selected],
      })),
      modules: [
        {
          title: 'Tools & rituals',
          note: 'What the companion can point toward without becoming the whole experience.',
          items: ['Pages', 'Voice Bip', 'Calm', 'Cloud Thoughts', 'Bridge'],
        },
        {
          title: 'Emotional fingerprint',
          note: profile.vibe,
          items: [profile.title, 'Low-pressure presence', 'Choice-first interaction', 'Readable emotion', 'Safe return'],
        },
        {
          title: 'Room & conditions',
          note: 'The environment carries part of the emotional storytelling.',
          items: ['Room', 'Day / evening / night', 'Mood atmosphere', 'Discoverable hotspots', 'Return memory'],
        },
      ],
      truth: {
        state: 'FOUNDER PREVIEW · VISUAL GRAMMAR ONLY · NOT A PRODUCTION CLAIM',
        proof: 'REPOSITORY COMPANION ASSETS + LIVE PROFILE COPY + RESPONSIVE CODE',
        nextGate: 'PLAYWRIGHT DESKTOP + MOBILE → THEN REUSE THE PRIMITIVE',
      },
    };
  }, [selected]);

  if (!enabled) {
    return (
      <View style={styles.locked} testID="cinematic-dossier-locked">
        <Text style={styles.lockedIcon}>🔒</Text>
        <Text style={styles.lockedTitle}>Cinematic dossier preview is development-only.</Text>
        <Text style={styles.lockedBody}>Production does not expose this founder visual-system surface.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="cinematic-dossier-screen">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back from cinematic dossier"
          >
            <Text style={styles.backText}>← Founder Preview</Text>
          </TouchableOpacity>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>VISUAL SYSTEM · V1</Text>
          </View>
        </View>

        <Text style={styles.kicker}>FOUNDER VISUAL SYSTEM</Text>
        <Text style={styles.title}>Character bible + storyboard + evidence.</Text>
        <Text style={styles.subtitle}>
          A reusable dossier grammar built from the reference structure, not its characters or compositions. Identity anchors the left rail, behavior moves through seven cinematic beats, and the bottom edge stays bound to tools, traits, environment, state, proof, and next gate.
        </Text>

        <View style={styles.selectorBlock}>
          <Text style={styles.selectorLabel}>SWITCH COMPANION · SAME GRAMMAR</Text>
          <View style={styles.selectorRow}>
            {COMPANIONS.map(companion => {
              const active = companion === selected;
              return (
                <TouchableOpacity
                  key={companion}
                  testID={`cinematic-dossier-select-${companion}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Show ${DISPLAY_NAMES[companion]} dossier`}
                  onPress={() => setSelected(companion)}
                  style={[
                    styles.selectorButton,
                    active && { borderColor: ACCENTS[companion], backgroundColor: '#ffffff18' },
                  ]}
                >
                  <Text style={[styles.selectorText, active && { color: ACCENTS[companion] }]}>
                    {DISPLAY_NAMES[companion]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <CinematicEvidenceBoard
          identity={board.identity}
          shots={board.shots}
          modules={board.modules}
          truth={board.truth}
          accent={ACCENTS[selected]}
          version="SE'KRET BIP / 01"
        />

        <View style={styles.footerNote}>
          <Text style={styles.footerTitle}>SYSTEM RULE</Text>
          <Text style={styles.footerText}>
            Preserve the information architecture. Keep every Se’kret Bip character, expression, room, object, and story beat original to this world.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0710',
  },
  locked: {
    flex: 1,
    backgroundColor: '#0a0710',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  lockedIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  lockedTitle: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 27,
    textAlign: 'center',
    fontWeight: '900',
  },
  lockedBody: {
    color: '#9d92aa',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 22,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 10,
  },
  backText: {
    color: '#c8bdd2',
    fontSize: 11,
    fontWeight: '900',
  },
  previewBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9f7aea66',
    backgroundColor: '#2c174466',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewBadgeText: {
    color: '#cfb7ff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  kicker: {
    color: '#9f7aea',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: '#fff',
    fontSize: 31,
    lineHeight: 39,
    fontWeight: '900',
    marginTop: 7,
  },
  subtitle: {
    color: '#afa2bc',
    fontSize: 12,
    lineHeight: 20,
    maxWidth: 860,
    marginTop: 9,
  },
  selectorBlock: {
    marginTop: 20,
    marginBottom: 18,
  },
  selectorLabel: {
    color: '#786c85',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 9,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorButton: {
    minHeight: 40,
    minWidth: 82,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff22',
    backgroundColor: '#ffffff0c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  selectorText: {
    color: '#a99db4',
    fontSize: 10,
    fontWeight: '900',
  },
  footerNote: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#9f7aea33',
    backgroundColor: '#17101f',
    padding: 14,
  },
  footerTitle: {
    color: '#9f7aea',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  footerText: {
    color: '#b9adbf',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
});
