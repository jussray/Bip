import { TEEN_ROUTES } from '@/teen/routes';
import { PARENT_ROUTES } from '@/parent/routes';

export const SIDE_ROOTS = {
  teen: TEEN_ROUTES.room,
  parent: PARENT_ROUTES.room,
} as const;

export function routeForSide(side: 'teen' | 'parent' | null | undefined, key: string): string {
  if (side === 'parent') {
    const parentMap: Record<string, string> = {
      home:           PARENT_ROUTES.room,
      room:           PARENT_ROUTES.room,
      pages:          PARENT_ROUTES.pages,
      parentPages:    PARENT_ROUTES.pages,
      circle:         PARENT_ROUTES.circle,
      parentCircle:   PARENT_ROUTES.circle,
      bridge:         PARENT_ROUTES.bridge,
      parentBridge:   PARENT_ROUTES.bridge,
      voiceBip:       PARENT_ROUTES.voiceBip,
      voicebip:       PARENT_ROUTES.voiceBip,
      settings:       PARENT_ROUTES.settings,
      more:           PARENT_ROUTES.more,
      calm:           PARENT_ROUTES.calm,
      s2tell:         PARENT_ROUTES.s2tell,
      repair:         PARENT_ROUTES.repair,
      voiceReflect:   PARENT_ROUTES.voiceReflect,
      voicereflect:   PARENT_ROUTES.voiceReflect,
      periodCalendar: PARENT_ROUTES.periodCalendar,
      coach:          PARENT_ROUTES.room,
      sekret:         PARENT_ROUTES.room,
    };
    return parentMap[key] ?? PARENT_ROUTES.room;
  }

  const teenMap: Record<string, string> = {
    home: TEEN_ROUTES.room,
    room: TEEN_ROUTES.room,
    pages: TEEN_ROUTES.pages,
    calm: TEEN_ROUTES.calm,
    circle: TEEN_ROUTES.circle,
    sekret: TEEN_ROUTES.room,
    companionPicker: TEEN_ROUTES.companionPicker,
    voiceBip: TEEN_ROUTES.voiceBip,
    voicebip: TEEN_ROUTES.voiceBip,
    cloudThoughts: TEEN_ROUTES.cloud,
    cloud: TEEN_ROUTES.cloud,
    comfort: TEEN_ROUTES.comfort,
    crew: TEEN_ROUTES.crew,
    settings: TEEN_ROUTES.settings,
    more: TEEN_ROUTES.more,
    points: TEEN_ROUTES.points,
    history: TEEN_ROUTES.history,
    bridge: TEEN_ROUTES.bridge,
    parentBridge: TEEN_ROUTES.bridge,
    s2tell: TEEN_ROUTES.s2tell,
    periodCalendar: TEEN_ROUTES.periodCalendar,
    discover: TEEN_ROUTES.discover,
    profile: TEEN_ROUTES.profile,
    userRoom: TEEN_ROUTES.userRoom,
    // Avatar Room hotspot targets
    write:    TEEN_ROUTES.pages,
    goals:    TEEN_ROUTES.points,
    memories: TEEN_ROUTES.circle,
    music:    TEEN_ROUTES.calm,
    rewards:  TEEN_ROUTES.points,
    vibeLab:  TEEN_ROUTES.userRoom,
  };
  return teenMap[key] ?? TEEN_ROUTES.room;
}
