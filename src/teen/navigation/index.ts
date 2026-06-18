import { router } from 'expo-router';

const TEEN_SCREEN_MAP: Record<string, string> = {
  home:           '/teen/room',
  room:           '/teen/room',
  pages:          '/teen/bips',
  bips:           '/teen/bips',
  calm:           '/teen/calm',
  circle:         '/teen/circle',
  sekret:         '/teen/sekret',
  voiceBip:       '/teen/voicebip',
  voicebip:       '/teen/voicebip',
  cloud:          '/teen/cloud',
  cloudThoughts:  '/teen/cloud',
  periodCalendar: '/teen/period-calendar',
  history:        '/teen/history',
  bridge:         '/teen/bridge',
  s2tell:         '/teen/s2tell',
  more:           '/teen/more',
  discover:       '/(main)/discover',
  settings:       '/(main)/settings',
  profile:        '/(main)/profile',
};

export function teenNavigateTo(screen: string): void {
  const path = TEEN_SCREEN_MAP[screen] ?? '/teen/room';
  router.push(path as Parameters<typeof router.push>[0]);
}
