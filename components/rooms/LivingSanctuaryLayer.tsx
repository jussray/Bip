import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LivingSanctuaryLayerProps {
  companionKey: string;
}

export function LivingSanctuaryLayer({ companionKey: _companionKey }: LivingSanctuaryLayerProps) {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      testID="living-sanctuary-layer"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        testID="living-sanctuary-depth"
        colors={[
          'rgba(8,3,22,0.00)',
          'rgba(8,3,22,0.02)',
          'rgba(8,3,22,0.24)',
        ]}
        locations={[0, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
