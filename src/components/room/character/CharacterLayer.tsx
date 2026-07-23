/**
 * src/components/room/character/CharacterLayer.tsx
 *
 * Positions SekretSprite in the lower third of the room.
 * Layer sits above overlays, below UI chrome.
 *
 * Usage inside RoomBackground children:
 *   <CharacterLayer sekret="suhana" mood={currentMood} />
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SekretSprite, type SekretMood } from './SekretSprite';

type Sekret = 'suhana' | 'sy' | 'cloud' | 'night' | 'dad' | 'mom';

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
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: '12%',
    zIndex: 5,
  },
});
