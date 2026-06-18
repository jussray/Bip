export const TEEN_ROUTES = {
  room: '/(teen)/room',
  pages: '/(teen)/pages',
  calm: '/(teen)/calm',
  circle: '/(teen)/circle',
  voiceBip: '/(teen)/voicebip',
  cloud: '/(teen)/cloud',
  comfort: '/(teen)/comfort',
  crew: '/(teen)/crew',
  settings: '/(teen)/settings',
  more: '/(teen)/more',
  points: '/(teen)/points',
  history: '/(teen)/history',
  bridge: '/(teen)/bridge',
  s2tell: '/(teen)/bridge?compose=true',
  periodCalendar: '/(teen)/period-calendar',
  discover: '/(teen)/discover',
  profile: '/(teen)/profile',
  companionPicker: '/(teen)/chat',
  userRoom: '/(teen)/user-room',
} as const;

export type TeenRouteKey = keyof typeof TEEN_ROUTES;
