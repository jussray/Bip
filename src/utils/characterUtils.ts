/** Maps the active sekret/theme key to a sticker-layer character identity. */
export function getActiveCharacter(
  themeKey: string
): 'raylene' | 'rylane' | 'cloud' | 'night' | null {
  if (themeKey === 'raylene' || themeKey === 'soft') return 'raylene';
  if (themeKey === 'rylane') return 'rylane';
  if (themeKey === 'cloud')  return 'cloud';
  if (themeKey === 'night')  return 'night';
  return null;
}
