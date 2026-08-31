import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

export interface CinematicDossierIdentity {
  project: string;
  name: string;
  title: string;
  tagline: string;
  mission: string;
  about: string;
  quote: string;
  image: ImageSourcePropType;
}

export interface CinematicDossierShot {
  id: string;
  title: string;
  beat: string;
  camera: string;
  atmosphere: string;
  image: ImageSourcePropType;
}

export interface CinematicDossierModule {
  title: string;
  note?: string;
  items: readonly string[];
}

export interface CinematicDossierTruth {
  state: string;
  proof: string;
  nextGate: string;
}

export interface CinematicEvidenceBoardProps {
  identity: CinematicDossierIdentity;
  shots: readonly CinematicDossierShot[];
  modules: readonly CinematicDossierModule[];
  truth: CinematicDossierTruth;
  accent?: string;
  version?: string;
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>{label}</Text>
      <Text style={styles.metadataValue}>{value}</Text>
    </View>
  );
}

export function CinematicEvidenceBoard({
  identity,
  shots,
  modules,
  truth,
  accent = '#6d28d9',
  version = 'V1',
}: CinematicEvidenceBoardProps) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  return (
    <View
      testID="cinematic-evidence-board"
      style={styles.board}
      accessibilityLabel={`${identity.name} cinematic evidence dossier`}
    >
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>CINEMATIC EVIDENCE DOSSIER</Text>
        <Text style={[styles.topBarText, { color: accent }]}>{version} · {shots.length} SHOTS</Text>
      </View>

      <View style={[styles.primaryGrid, !wide && styles.primaryGridStacked]}>
        <View style={[styles.identityPanel, wide ? styles.identityWide : styles.identityStacked]}>
          <Text style={styles.microLabel}>PROJECT: {identity.project.toUpperCase()}</Text>
          <View style={[styles.rule, { backgroundColor: accent }]} />
          <Text style={styles.identityName}>{identity.name.toUpperCase()}</Text>
          <Text style={[styles.tagline, { color: accent }]}>{identity.tagline}</Text>

          <View style={styles.heroFrame}>
            <Image
              testID="cinematic-dossier-hero"
              source={identity.image}
              style={styles.heroImage}
              resizeMode="contain"
              accessibilityLabel={`${identity.name} approved companion reference`}
            />
            <View style={[styles.heroStamp, { borderColor: accent }]}>
              <Text style={[styles.heroStampText, { color: accent }]}>IDENTITY LOCK</Text>
            </View>
          </View>

          <MetadataRow label="ROLE" value={identity.title} />
          <MetadataRow label="MISSION" value={identity.mission} />

          <Text style={styles.sectionEyebrow}>ABOUT</Text>
          <Text style={styles.bodyCopy}>{identity.about}</Text>

          <View style={[styles.quoteCard, { borderLeftColor: accent }]}>
            <Text style={styles.quoteText}>“{identity.quote}”</Text>
          </View>
        </View>

        <View style={[styles.sequencePanel, wide ? styles.sequenceWide : styles.sequenceStacked]}>
          <View style={styles.sequenceHeader}>
            <Text style={styles.sequenceTitle}>STORYBOARD SEQUENCE</Text>
            <Text style={styles.sequenceNote}>IDENTITY → BEHAVIOR → RETURN</Text>
          </View>

          <View style={styles.storyGrid}>
            {shots.map((shot, index) => {
              const finale = index === shots.length - 1;
              return (
                <View
                  key={shot.id}
                  testID={`cinematic-shot-${shot.id}`}
                  style={[
                    styles.shotCard,
                    wide && !finale ? styles.shotCardWide : styles.shotCardFull,
                  ]}
                >
                  <View style={styles.shotHeader}>
                    <Text style={[styles.shotNumber, { color: accent }]}>{shot.id}</Text>
                    <Text style={styles.shotTitle}>{shot.title.toUpperCase()}</Text>
                  </View>
                  <View style={[styles.shotImageFrame, finale && wide && styles.shotImageFinale]}>
                    <Image
                      source={shot.image}
                      style={styles.shotImage}
                      resizeMode="cover"
                      accessibilityLabel={`${shot.title} storyboard frame`}
                    />
                    <View style={styles.shotImageShade} />
                    <Text style={styles.shotBeat}>{shot.beat}</Text>
                  </View>
                  <View style={styles.shotMetadata}>
                    <MetadataRow label="CAMERA" value={shot.camera} />
                    <MetadataRow label="ATMOS" value={shot.atmosphere} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.moduleGrid, !wide && styles.moduleGridStacked]}>
        {modules.map((module, index) => (
          <View
            key={module.title}
            testID={`cinematic-module-${index + 1}`}
            style={[styles.moduleCard, wide ? styles.moduleCardWide : styles.moduleCardStacked]}
          >
            <View style={styles.moduleHeader}>
              <Text style={[styles.moduleNumber, { color: accent }]}>0{index + 1}</Text>
              <Text style={styles.moduleTitle}>{module.title.toUpperCase()}</Text>
            </View>
            {module.note ? <Text style={styles.moduleNote}>{module.note}</Text> : null}
            <View style={styles.itemWrap}>
              {module.items.map(item => (
                <View key={item} style={styles.itemChip}>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View testID="cinematic-truth-strip" style={styles.truthStrip}>
        <View style={styles.truthCell}>
          <Text style={[styles.truthLabel, { color: accent }]}>CURRENT STATE</Text>
          <Text style={styles.truthValue}>{truth.state}</Text>
        </View>
        <View style={styles.truthCell}>
          <Text style={[styles.truthLabel, { color: accent }]}>PROOF</Text>
          <Text style={styles.truthValue}>{truth.proof}</Text>
        </View>
        <View style={[styles.truthCell, styles.truthCellLast]}>
          <Text style={[styles.truthLabel, { color: accent }]}>NEXT GATE</Text>
          <Text style={styles.truthValue}>{truth.nextGate}</Text>
        </View>
      </View>
    </View>
  );
}

const PAPER = '#eee2c8';
const PAPER_DEEP = '#e3d4b7';
const INK = '#17130f';
const MUTED = '#6f6353';

const styles = StyleSheet.create({
  board: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: '#2a241d',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  topBar: {
    minHeight: 42,
    backgroundColor: INK,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topBarText: {
    color: '#f4ecd9',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  primaryGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  primaryGridStacked: {
    flexDirection: 'column',
  },
  identityPanel: {
    padding: 16,
    borderColor: '#2a241d',
  },
  identityWide: {
    width: '36%',
    borderRightWidth: 1,
  },
  identityStacked: {
    width: '100%',
    borderBottomWidth: 1,
  },
  microLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  rule: {
    width: 46,
    height: 3,
    marginTop: 9,
    marginBottom: 10,
  },
  identityName: {
    color: INK,
    fontSize: 42,
    lineHeight: 45,
    fontWeight: '900',
    letterSpacing: -1.8,
  },
  tagline: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginTop: 5,
  },
  heroFrame: {
    height: 360,
    backgroundColor: '#d5c5a8',
    borderWidth: 1,
    borderColor: '#70624f',
    marginTop: 16,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroStamp: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    transform: [{ rotate: '-3deg' }],
    backgroundColor: '#eee2c8dd',
  },
  heroStampText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8c7e6a66',
  },
  metadataLabel: {
    width: 58,
    color: MUTED,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.65,
  },
  metadataValue: {
    flex: 1,
    color: INK,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700',
  },
  sectionEyebrow: {
    color: MUTED,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 13,
  },
  bodyCopy: {
    color: '#3d352c',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
  quoteCard: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginTop: 14,
  },
  quoteText: {
    color: INK,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  sequencePanel: {
    padding: 10,
  },
  sequenceWide: {
    width: '64%',
  },
  sequenceStacked: {
    width: '100%',
  },
  sequenceHeader: {
    backgroundColor: INK,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sequenceTitle: {
    color: '#f4ecd9',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sequenceNote: {
    color: '#aa9c87',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'right',
  },
  storyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  shotCard: {
    borderWidth: 1,
    borderColor: '#554a3c',
    backgroundColor: PAPER_DEEP,
    overflow: 'hidden',
  },
  shotCardWide: {
    width: '49%',
  },
  shotCardFull: {
    width: '100%',
  },
  shotHeader: {
    minHeight: 32,
    backgroundColor: INK,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  shotNumber: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  shotTitle: {
    flex: 1,
    color: '#f4ecd9',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  shotImageFrame: {
    height: 150,
    position: 'relative',
    backgroundColor: '#221c17',
  },
  shotImageFinale: {
    height: 190,
  },
  shotImage: {
    width: '100%',
    height: '100%',
  },
  shotImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 8, 20, 0.22)',
  },
  shotBeat: {
    position: 'absolute',
    left: 9,
    right: 9,
    bottom: 8,
    color: '#fffaf0',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowRadius: 3,
  },
  shotMetadata: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  moduleGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a241d',
  },
  moduleGridStacked: {
    flexDirection: 'column',
  },
  moduleCard: {
    padding: 13,
    borderColor: '#2a241d',
    minHeight: 160,
  },
  moduleCardWide: {
    width: '33.333%',
    borderRightWidth: 1,
  },
  moduleCardStacked: {
    width: '100%',
    borderBottomWidth: 1,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: INK,
  },
  moduleNumber: {
    fontSize: 9,
    fontWeight: '900',
  },
  moduleTitle: {
    color: INK,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  moduleNote: {
    color: MUTED,
    fontSize: 8,
    lineHeight: 12,
    marginTop: 8,
  },
  itemWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  itemChip: {
    backgroundColor: '#d5c4a5',
    borderWidth: 1,
    borderColor: '#8a7a62',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  itemText: {
    color: INK,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
  },
  truthStrip: {
    backgroundColor: INK,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  truthCell: {
    flexGrow: 1,
    flexBasis: 240,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#f4ecd933',
  },
  truthCellLast: {
    borderRightWidth: 0,
  },
  truthLabel: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  truthValue: {
    color: '#f4ecd9',
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '800',
    marginTop: 4,
  },
});
