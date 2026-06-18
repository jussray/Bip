export const PARENT_ROUTES = {
  room: '/(parent)/room',
  pages: '/(parent)/pages',
  circle: '/(parent)/circle',
  bridge: '/(parent)/bridge',
  voiceBip: '/(parent)/voicebip',
  more: '/(parent)/more',
  settings: '/(parent)/settings',
} as const;

export type ParentRouteKey = keyof typeof PARENT_ROUTES;
