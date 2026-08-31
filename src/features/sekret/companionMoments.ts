export type CompanionMomentId = 'sort' | 'write' | 'company' | 'good' | 'night';

export type CompanionMomentDestination =
  | { kind: 'chat'; companion: 'sy' | 'night'; surface: 'chat' }
  | { kind: 'pages'; selectedSekret: 'rylane' };

export interface CompanionMoment {
  id: CompanionMomentId;
  label: string;
  quote: string;
  action: string;
  scene: 'quiet' | 'writing' | 'warm' | 'night';
  destination: CompanionMomentDestination;
}

/**
 * Sy's moment menu is an intent router, not a second chat engine.
 * Every action delegates to an existing protected Se'kret Bip surface.
 */
export const SY_COMPANION_MOMENTS: readonly CompanionMoment[] = [
  {
    id: 'sort',
    label: 'Sorting it out',
    quote: 'You don’t have to make sense of it all yet.',
    action: 'Talk with Sy',
    scene: 'quiet',
    destination: { kind: 'chat', companion: 'sy', surface: 'chat' },
  },
  {
    id: 'write',
    label: 'I need to write',
    quote: 'Put it somewhere safe. It does not have to be polished.',
    action: 'Start a private page',
    scene: 'writing',
    destination: { kind: 'pages', selectedSekret: 'rylane' },
  },
  {
    id: 'company',
    label: 'I need company',
    quote: 'I’m here. We do not have to fill the silence.',
    action: 'Sit with Sy',
    scene: 'quiet',
    destination: { kind: 'chat', companion: 'sy', surface: 'chat' },
  },
  {
    id: 'good',
    label: 'A good moment',
    quote: 'This feels worth keeping. Tell me what made it yours.',
    action: 'Save this moment',
    scene: 'warm',
    destination: { kind: 'pages', selectedSekret: 'rylane' },
  },
  {
    id: 'night',
    label: 'A late-night thought',
    quote: 'The rain makes everything feel slower… safer.',
    action: 'Bring this to Night',
    scene: 'night',
    destination: { kind: 'chat', companion: 'night', surface: 'chat' },
  },
] as const;

export function getSyCompanionMoment(id: CompanionMomentId): CompanionMoment {
  return SY_COMPANION_MOMENTS.find(moment => moment.id === id) ?? SY_COMPANION_MOMENTS[0];
}
