import { router } from 'expo-router';

const PARENT_SCREEN_MAP: Record<string, string> = {
  home:            '/parent/room',
  room:            '/parent/room',
  pages:           '/parent/pages',
  circle:          '/parent/circle',
  bridge:          '/parent/bridge',
  voiceBip:        '/parent/voicebip',
  voicebip:        '/parent/voicebip',
  voiceReflect:    '/parent/voicereflect',
  voicereflect:    '/parent/voicereflect',
  periodCalendar:  '/parent/period-calendar',
  calm:            '/parent/calm',
  sekret:          '/parent/sekret',
  coach:           '/parent/sekret',
  repair:          '/parent/repair',
  s2tell:          '/parent/s2tell',
  more:            '/parent/more',
  settings:        '/(main)/settings',
  profile:         '/(main)/profile',
};

export function parentNavigateTo(screen: string): void {
  const path = PARENT_SCREEN_MAP[screen] ?? '/parent/room';
  router.push(path as Parameters<typeof router.push>[0]);
}
