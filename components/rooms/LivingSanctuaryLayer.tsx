import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getCompanionRuntime,
  type CompanionRuntimeKey,
} from '@/config/companionRuntimeRegistry';

interface LivingSanctuaryLayerProps {
  companionKey: string;
}

function resolveRuntimeKey(value: string): CompanionRuntimeKey {
  if (
    value === 'raylene' ||
    value === 'rylane' ||
    value === 'cloud' ||
    value === 'night' ||
    value === 'suhana' ||
    value === 'sy' ||
    value === 'mom' ||
    value === 'dad'
  ) {
    return value;
  }

  return 'raylene';
}

export function LivingSanctuaryLayer({ companionKey }: LivingSanctuaryLayerProps) {
  const companion = useMemo(
    () => getCompanionRuntime(resolveRuntimeKey(companionKey)),
    [companionKey],
  );

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      testID="living-sanctuary-layer"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        colors={[
          'rgba(8,3,22,0.58)',
          'rgba(8,3,22,0.08)',
          'rgba(8,3,22,0.02)',
          'rgba(8,3,22,0.34)',
        ]}
        locations={[0, 0.2, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={s.innerFrame} />
      <View testID="living-sanctuary-halo" style={s.halo} />

      <View style={s.heading}>
        <Text style={s.eyebrow}>YOUR SANCTUARY</Text>
        <View style={s.headingRule} />
        <Text style={s.tagline}>your room, your pace.</Text>
      </View>

      <View style={s.discovery}>
        <Text style={s.discoveryLabel}>✦ yours to explore</Text>
        <Text style={s.discoverySub}>{companion.label} is already here</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  innerFrame: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 86,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(221,214,254,0.12)',
  },
  halo: {
    position: 'absolute',
    top: '22%',
    right: '-14%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(192,132,252,0.22)',
    opacity: 0.24,
  },
  heading: {
    position: 'absolute',
    top: 34,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  eyebrow: {
    color: 'rgba(245,243,255,0.74)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  headingRule: {
    width: 34,
    height: 1,
    marginTop: 7,
    marginBottom: 6,
    backgroundColor: 'rgba(216,180,254,0.48)',
  },
  tagline: {
    color: 'rgba(245,243,255,0.64)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  discovery: {
    position: 'absolute',
    right: 18,
    bottom: 136,
    alignItems: 'flex-end',
  },
  discoveryLabel: {
    color: 'rgba(245,243,255,0.84)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  discoverySub: {
    marginTop: 3,
    color: 'rgba(221,214,254,0.54)',
    fontSize: 9,
    fontWeight: '600',
  },
});
