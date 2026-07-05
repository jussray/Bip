/**
 * src/components/room/character/CharacterLayer.tsx
 *
 * Positions SekretSprite in the lower third of the room.
 * Layer sits above overlays, below UI chrome.
 *
 * Usage inside RoomBackground children:
 *   <CharacterLayer sekret="raylene" mood={currentMood} />
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SekretSprite, type SekretMood } from './SekretSprite';

type Sekret = 'raylene' | 'rylane' | 'cloud' | 'night' | 'dad' | 'mom';

interface CharacterLayerProps {
  sekret: Sekret;
  mood?: SekretMood;
}

export function CharacterLayer({ sekret, mood }: CharacterLayerProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <SekretSprite sekret={sekret} mood={mood} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: '12%',
    zIndex: 5,
  },
});
