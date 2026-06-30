export type AppSide = 'teen' | 'parent';

export type PrimarySurface =
  | 'room'
  | 'pages'
  | 'calm'
  | 'voicebip'
  | 'circle'
  | 'more'
  | 'doorbell';

export interface ScreenPurpose {
  id: PrimarySurface;
  side: AppSide;
  title: string;
  purpose: string;
  owns: string[];
  mustNotBecome: string[];
}

export const SCREEN_PURPOSES: ScreenPurpose[] = [
  {
    id: 'room',
    side: 'teen',
    title: 'Room',
    purpose: 'Visual home base and companion presence.',
    owns: ['time/weather atmosphere', 'mood check-in', 'continue last activity', 'feature hotspots'],
    mustNotBecome: ['a second dashboard', 'a journal editor', 'a chat transcript'],
  },
  {
    id: 'pages',
    side: 'teen',
    title: 'Pages',
    purpose: 'Journal and notebook hub.',
    owns: ['typed entries', 'voice attachments', 'prompts', 'saved history', 'entry-linked Se’kret replies'],
    mustNotBecome: ['a full companion chat', 'a comfort hub', 'a duplicate home screen'],
  },
  {
    id: 'calm',
    side: 'teen',
    title: 'Calm',
    purpose: 'Comfort tools and regulation exercises.',
    owns: ['breathing', 'grounding', 'Cloud Thoughts', 'comfort cards', 'wind-down tools'],
    mustNotBecome: ['a journal editor', 'a chat screen', 'a social feed'],
  },
  {
    id: 'voicebip',
    side: 'teen',
    title: 'Voice Bip',
    purpose: 'Voice-first talk mode.',
    owns: ['recording', 'playback', 'transcript', 'spoken companion reply', 'save to Pages'],
    mustNotBecome: ['Pages with a microphone', 'a text chat clone', 'a calm dashboard'],
  },
  {
    id: 'circle',
    side: 'teen',
    title: 'Circle',
    purpose: 'Community, Crew, and chosen connection.',
    owns: ['public anonymous posts', 'friends', 'Crew', 'reactions', 'moderation'],
    mustNotBecome: ['private journaling', 'parent surveillance', 'a general dashboard'],
  },
  {
    id: 'more',
    side: 'teen',
    title: 'More',
    purpose: 'Feature drawer, account tools, and settings.',
    owns: ['Profile', 'Rewards', 'Bippin 2', 'Period Calendar', 'Parent Link', 'Safety', 'Help and legal'],
    mustNotBecome: ['a second home', 'a flat junk drawer', 'a duplicate feature screen'],
  },
  {
    id: 'room',
    side: 'parent',
    title: 'Parent Room',
    purpose: 'Parent home base and calm starting point.',
    owns: ['parent mood check-in', 'return shortcuts', 'shared-signal presence', 'time/weather atmosphere'],
    mustNotBecome: ['a monitoring dashboard', 'a copy of Teen Room', 'a private teen activity feed'],
  },
  {
    id: 'pages',
    side: 'parent',
    title: 'Parent Pages',
    purpose: 'Parent-owned notebook and reflection hub.',
    owns: ['letters', 'private journal', 'repair notes', 'wins', 'future letters', 'Bridge reply drafts'],
    mustNotBecome: ['teen journal access', 'a companion chat clone', 'Doorbell'],
  },
  {
    id: 'calm',
    side: 'parent',
    title: 'Parent Calm',
    purpose: 'Pause-before-replying and parent regulation tools.',
    owns: ['breathing', 'grounding', 'reply reset', 'wind-down', 'support prompts'],
    mustNotBecome: ['Teen Calm copied word-for-word', 'a journal screen', 'a dashboard'],
  },
  {
    id: 'voicebip',
    side: 'parent',
    title: 'Parent Voice Bip',
    purpose: 'Voice reflection and optional spoken Bridge replies.',
    owns: ['private recording', 'playback', 'transcript', 'reflection reply', 'save to Parent Pages'],
    mustNotBecome: ['teen voice-note access', 'a text chat clone', 'a second journal editor'],
  },
  {
    id: 'circle',
    side: 'parent',
    title: 'Parent Circle',
    purpose: 'Parent-to-parent community and support.',
    owns: ['parent community posts', 'reactions', 'resources', 'moderation', 'anonymous identity'],
    mustNotBecome: ['teen Circle access', 'Doorbell', 'family monitoring'],
  },
  {
    id: 'doorbell',
    side: 'parent',
    title: 'Doorbell',
    purpose: 'Shared signal hub for teen-initiated moments.',
    owns: ['Bridge signals', 'support requests', 'shared wins', 'connection status', 'calm reply entry point'],
    mustNotBecome: ['a teen activity log', 'journal access', 'analytics surveillance'],
  },
  {
    id: 'more',
    side: 'parent',
    title: 'Parent More',
    purpose: 'Parent feature drawer, connection management, and settings.',
    owns: ['Parent Profile', 'Parent Circle', 'Settings', 'Resources', 'Parent Link', 'Help and legal'],
    mustNotBecome: ['a second Parent Room', 'Doorbell', 'a flat junk drawer'],
  },
];

export interface FeatureDrawerItem {
  emoji: string;
  label: string;
  route: string;
  description: string;
}

export interface FeatureDrawerGroup {
  title: string;
  items: FeatureDrawerItem[];
}

export const TEEN_MORE_GROUPS: FeatureDrawerGroup[] = [
  {
    title: 'YOUR SPACE',
    items: [
      { emoji: '👤', label: 'Profile', route: 'profile', description: 'Your identity and preferences.' },
      { emoji: '🏆', label: 'Rewards', route: 'points', description: 'Points, streaks, and earned rewards.' },
      { emoji: '📖', label: 'History', route: 'history', description: 'Your saved growth over time.' },
    ],
  },
  {
    title: 'GROWTH TOOLS',
    items: [
      { emoji: '🌱', label: 'Bippin 2', route: 'bippin2', description: 'Body, identity, and growing-up support.' },
      { emoji: '🩸', label: 'Period Calendar', route: 'period-calendar', description: 'Private cycle tracking and support.' },
      { emoji: '🤝', label: 'Bip Crew', route: 'crew', description: 'Your chosen accountability people.' },
    ],
  },
  {
    title: 'ACCOUNT & SAFETY',
    items: [
      { emoji: '🔗', label: 'Parent Link', route: 'parent-link-verify', description: 'Manage verification and trusted connection.' },
      { emoji: '⚙️', label: 'Settings', route: 'settings', description: 'Theme, privacy, notifications, and account.' },
      { emoji: '🛟', label: 'Help & Safety', route: 'resources', description: 'Support, safety tools, and legal information.' },
    ],
  },
];

export const PARENT_MORE_GROUPS: FeatureDrawerGroup[] = [
  {
    title: 'PARENT WINDOW',
    items: [
      { emoji: '🔔', label: 'Doorbell', route: 'dashboard', description: 'Teen-shared signals and support requests.' },
      { emoji: '🌉', label: 'Bridge', route: 'parent-bridge', description: 'Replies and intentionally shared moments.' },
      { emoji: '🤝', label: 'Connection Hub', route: 'parent-connection', description: 'Repair, boundaries, and relationship tools.' },
    ],
  },
  {
    title: 'YOUR SUPPORT SPACE',
    items: [
      { emoji: '🎙️', label: 'Parent Voice Bip', route: 'voicebip', description: 'Private voice reflection and reply drafts.' },
      { emoji: '🌱', label: 'Bippin 2', route: 'parent-growth', description: 'Parent guidance for growing-up topics.' },
      { emoji: '🤝', label: 'Parent Circle', route: 'circle', description: 'Parent-to-parent support and community.' },
    ],
  },
  {
    title: 'ACCOUNT & RESOURCES',
    items: [
      { emoji: '👤', label: 'Parent Profile', route: 'profile', description: 'Your parent-side identity and preferences.' },
      { emoji: '🔗', label: 'Parent Link', route: 'parent-link', description: 'Manage the trusted teen connection.' },
      { emoji: '⚙️', label: 'Settings', route: 'settings', description: 'Privacy, notifications, and account.' },
      { emoji: '📚', label: 'Resources', route: 'resources', description: 'Guides, support, and legal information.' },
    ],
  },
];
