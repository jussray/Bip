import type { Character } from '../../constants/theme';

export type RoomSceneAnchor = 'desk' | 'bedside' | 'window-seat' | 'floor';
export type RoomSceneLighting = 'moonlit' | 'lamp-lit' | 'mixed';
export type RoomSceneProp = 'lamp' | 'desk' | 'notes' | 'plant' | 'blanket';

export type RoomSceneComposition = {
  companionKey: Character;
  anchor: RoomSceneAnchor;
  position: { x: number; y: number };
  scale: number;
  zIndex: number;
  lighting: RoomSceneLighting;
  nearbyProps: RoomSceneProp[];
  hotspotExclusions?: string[];
};

/**
 * Night is the first production vertical slice for the user-owned Room.
 * Coordinates are normalized percentages so the identity stays independent
 * from a specific device size and rendering implementation.
 */
export const NIGHT_USER_ROOM_SCENE: RoomSceneComposition = {
  companionKey: 'night',
  anchor: 'window-seat',
  position: { x: 18, y: 47 },
  scale: 0.92,
  zIndex: 10,
  lighting: 'mixed',
  nearbyProps: ['lamp', 'desk', 'notes', 'blanket'],
  hotspotExclusions: ['voiceBip'],
};

export const USER_ROOM_SCENES: Partial<Record<Character, RoomSceneComposition>> = {
  night: NIGHT_USER_ROOM_SCENE,
};
