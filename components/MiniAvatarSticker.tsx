// MiniAvatarSticker — canonical reusable mini sticker component
//
// SEPARATION OF ENGINES:
//   Full-size avatar engine → RoomScreen, HomeScreen presence,
//                             VoiceBipScreen main companion, Tolan-style moments
//   Mini sticker engine    → journal corners, page reactions, Circle reactions,
//                             streaks, save confirmations, comfort/Cloud Thoughts
//
// Stickers NEVER replace full-size avatars.
//
// CHARACTER ROUTING RULES:
//   raylene page/context  → raylene mini sticker
//   rylane  page/context  → rylane  mini sticker
//   cloud   page/context  → cloud   mini sticker
//   night   context       → rylane/night sticker only if registered, else null
//   oracle  / sekretBrain → return null (never shown, never rendered)
//   null / unknown        → return null

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { IMAGES } from '../constants/theme';
import {
  getContextSticker,
  getStickerById,
  type StickerContext,
} from '../constants/characterStickers';

export type MiniAvatarCharacter =
  | 'raylene'
  | 'rylane'
  | 'cloud'
  | 'night'
  | 'oracle'
  | 'sekretBrain'
  | null;

interface MiniAvatarStickerProps {
  /** Which character owns this page/context. Oracle and sekretBrain always render null. */
  character: MiniAvatarCharacter;
  /** Screen context used to pick the right sticker emotion from the registry. */
  screenContext?: StickerContext | null;
  /** Rendered size in dp. Defaults to 48. */
  size?: number;
  /** Override absolute position. Defaults to bottom-right corner (bottom:8, right:8). */
  bottom?: number;
  right?: number;
  /** Opacity override. Defaults to 0.88. */
  opacity?: number;
}

export function MiniAvatarSticker({
  character,
  screenContext,
  size = 48,
  bottom = 8,
  right = 8,
  opacity = 0.88,
}: MiniAvatarStickerProps) {
  // Hard block: Oracle and Se'kret Brain are never shown as stickers
  if (!character || character === 'oracle' || character === 'sekretBrain') return null;

  const ctx: StickerContext = screenContext ?? 'general';

  // Night context: only render if rylane-night sticker is registered
  if (character === 'night') {
    const nightSticker = getStickerById('rylane-night');
    if (!nightSticker?.renderable || !nightSticker.assetKey) return null;
    const src = (IMAGES as Record<string, unknown>)[nightSticker.assetKey];
    if (!src) return null;
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, bottom, right, opacity },
        ]}
      >
        <Image
          source={src as any}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Raylene / Rylane / Cloud: look up context sticker from registry
  const sticker = getContextSticker(character, ctx);
  if (!sticker?.renderable || !sticker.assetKey) return null;

  const imgSource = (IMAGES as Record<string, unknown>)[sticker.assetKey];
  if (!imgSource) return null;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, bottom, right, opacity },
      ]}
    >
      <Image
        source={imgSource as any}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 12,
    pointerEvents: 'none',
  } as any,
});
