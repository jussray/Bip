/**
 * furnishingCatalog.ts
 *
 * All placeable room items for the User Room furnishing system.
 * Organized by category to give a MySpace-style room customization feel.
 *
 * Items without their own standalone PNG are marked `placeholder: true`
 * and use a stand-in image until the design team delivers the asset.
 * Items that are ready show `available: true`.
 *
 * Sourced from visual inventory of the four Avatar Room bg images:
 * Raylene (cozy purple bedroom), Rylane (dark city setup),
 * Cloud (brain dump creative space), Night (late-night thinker den).
 */

import type { ImageSourcePropType } from 'react-native';
import { IMAGES } from './theme';
import STICKER_IMAGES from './stickerImages';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FurnishCategory =
  | 'furniture'    // beds, chairs, desks
  | 'lighting'     // lamps, neons, candles, fairy lights
  | 'decor'        // banners, posters, photo wall, signs, rugs
  | 'accessories'  // headphones, journal, boba, hoodie, backpack
  | 'plants'       // ivy, succulents, potted plants
  | 'characters';  // the 53 Bip stickers (characters in poses)

export type RoomOrigin = 'raylene' | 'rylane' | 'cloud' | 'night' | 'shared';

export interface FurnishItem {
  id:          string;
  label:       string;
  emoji:       string;
  category:    FurnishCategory;
  origin:      RoomOrigin;
  source:      ImageSourcePropType | null;
  available:   boolean;   // true = real PNG exists; false = placeholder needed
  placeholder: boolean;
  tags:        string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const item = (
  id: string,
  label: string,
  emoji: string,
  category: FurnishCategory,
  origin: RoomOrigin,
  source: ImageSourcePropType | null,
  tags: string[] = [],
): FurnishItem => ({
  id, label, emoji, category, origin,
  source,
  available:   source !== null,
  placeholder: source === null,
  tags,
});

// ─── Catalog ─────────────────────────────────────────────────────────────────

export const FURNISH_CATALOG: FurnishItem[] = [

  // ── FURNITURE ──────────────────────────────────────────────────────────────

  // Beds
  item('bed-raylene',    'Purple Fuzzy Bed',   '🛏️',  'furniture', 'raylene', null, ['bed', 'cozy', 'purple', 'sleep']),
  item('bed-rylane',     'Dark Galaxy Bed',    '🛏️',  'furniture', 'rylane',  null, ['bed', 'dark', 'galaxy', 'sleep']),
  item('bed-night',      'Starry Night Bed',   '🌙',  'furniture', 'night',   null, ['bed', 'starry', 'dark', 'sleep']),

  // Chairs / seating
  item('bean-bag-cloud', 'Purple Bean Bag',    '🪑',  'furniture', 'cloud',   null, ['beanbag', 'cozy', 'seat']),
  item('moon-chair',     'Moon Chair',         '🌙',  'furniture', 'night',   null, ['moon', 'chair', 'cozy', 'night']),

  // Desks
  item('desk-raylene',   'Wooden Desk',        '🪵',  'furniture', 'raylene', null, ['desk', 'study', 'wood']),
  item('desk-rylane',    'Dark Gaming Desk',   '🖥️',  'furniture', 'rylane',  null, ['desk', 'gaming', 'dark', 'city']),
  item('desk-night',     'Night Study Desk',   '📚',  'furniture', 'night',   null, ['desk', 'books', 'night']),

  // Bookshelf / shelving
  item('shelf-raylene',  'Bookshelf',          '📚',  'furniture', 'raylene', null, ['shelf', 'books', 'raylene']),
  item('shelf-rylane',   'Trophy Shelf',       '🏆',  'furniture', 'rylane',  null, ['shelf', 'trophies', 'rylane']),

  // Rugs
  item('rug-purple',     'Purple Plush Rug',   '🟣',  'furniture', 'shared',  null, ['rug', 'purple', 'cozy', 'floor']),
  item('rug-sekret',     "SE'KRET Crown Rug",  '👑',  'furniture', 'rylane',  null, ['rug', 'sekret', 'crown', 'rylane']),

  // ── LIGHTING ───────────────────────────────────────────────────────────────

  // Desk lamp
  item('lamp-desk',      'Desk Lamp',          '💡',  'lighting', 'shared',   null, ['lamp', 'desk', 'light']),

  // Neon signs
  item('neon-cloud',     'Cloud Neon Sign',    '☁️',  'lighting', 'shared',
    IMAGES.cloud,   // cloud mascot standing in as visual until neon PNG exists
    ['neon', 'cloud', 'sign', 'purple']),
  item('neon-moon',      'Moon Neon Sign',     '🌙',  'lighting', 'night',    null, ['neon', 'moon', 'night', 'sign']),

  // Candles
  item('candle-self-love', 'Self Love Candle', '🕯️',  'lighting', 'shared',  null, ['candle', 'purple', 'cozy', 'self-love']),

  // String / fairy lights
  item('fairy-lights',   'Fairy String Lights','✨',   'lighting', 'night',   null, ['lights', 'fairy', 'night', 'cozy']),

  // Cloud lamp plush (on Raylene's bed)
  item('cloud-lamp',     'Cloud Lamp Plush',   '☁️',  'lighting', 'raylene',
    IMAGES.cloudSleepy, // closest existing asset — sleepy cloud
    ['cloud', 'lamp', 'plush', 'cozy', 'raylene']),

  // ── DECOR ──────────────────────────────────────────────────────────────────

  // Tapestry / banner
  item('banner-sekret',  "SE'KRET Banner",     '👑',  'decor', 'shared',      null, ['banner', 'sekret', 'crown', 'tapestry']),

  // Posters / signs
  item('sign-progress',  'Progress Not Perfection', '✍🏾', 'decor', 'shared', null, ['sign', 'quote', 'progress', 'poster']),
  item('sign-voice-bip', 'Voice Bip Corner',   '🎙️',  'decor', 'night',      null, ['sign', 'voice', 'corner', 'night']),
  item('sign-note-self', 'Note to Self Sign',  '📝',  'decor', 'cloud',       null, ['sign', 'note', 'self-love', 'cloud']),

  // Checklists
  item('checklist-woman','Bippin2WomanHood',   '📋',  'decor', 'raylene',     null, ['checklist', 'bippin', 'goals', 'raylene']),
  item('checklist-mann', 'Bippin2MannHood',    '📋',  'decor', 'rylane',      null, ['checklist', 'bippin', 'goals', 'rylane']),

  // Photo wall
  item('photo-wall',     'Polaroid Photo Wall','📸',  'decor', 'shared',      null, ['photos', 'polaroid', 'memories', 'wall']),

  // Sticky notes wall
  item('sticky-wall',    'Sticky Notes Wall',  '📌',  'decor', 'night',       null, ['sticky', 'notes', 'thoughts', 'wall', 'night']),
  item('sticky-thoughts','Cloud Thoughts Wall','🌫️',  'decor', 'cloud',       null, ['sticky', 'cloud', 'thoughts', 'brain-dump']),

  // Character art / photo pins
  item('char-art-raylene', 'Raylene Photo',   '💜',  'decor', 'raylene',
    IMAGES.rayleneNeutral, ['photo', 'raylene', 'wall', 'art']),
  item('char-art-rylane',  'Rylane Photo',    '⚡',  'decor', 'rylane',
    IMAGES.rylaneNeutral, ['photo', 'rylane', 'wall', 'art']),
  item('char-art-cloud',   'Cloud Photo',     '☁️',  'decor', 'cloud',
    IMAGES.cloudAvatarNeutral, ['photo', 'cloud', 'wall', 'art']),
  item('char-art-night',   'Night Photo',     '🌙',  'decor', 'night',
    IMAGES.nightNeutral, ['photo', 'night', 'wall', 'art']),

  // SE'KRET jersey
  item('jersey-sekret',  "SE'KRET Jersey #23",'👕',  'decor', 'rylane',      null, ['jersey', 'sekret', '23', 'rylane', 'wall']),

  // ── ACCESSORIES ────────────────────────────────────────────────────────────

  // Headphones
  item('headphones-purple', 'Purple Headphones','🎧', 'accessories', 'raylene', null, ['headphones', 'music', 'purple']),
  item('headphones-black',  'Black Headphones', '🎧', 'accessories', 'rylane',  null, ['headphones', 'music', 'dark']),

  // Journal / notebook (open)
  item('journal-gratitude', 'Gratitude Journal','📓', 'accessories', 'shared',  null, ['journal', 'gratitude', 'writing', 'pages']),
  item('journal-late-night','Late Night Journal','📓', 'accessories', 'night',  null, ['journal', 'night', 'agenda', 'writing']),
  item('journal-cloud',     'Cloud Thoughts Journal','📓','accessories','cloud', null, ['journal', 'cloud', 'thoughts', 'writing']),

  // Drinks
  item('boba',             'Boba Iced Coffee',  '🧋', 'accessories', 'shared',
    STICKER_IMAGES['raylene-boba'], // raylene-boba sticker is perfect here
    ['boba', 'iced coffee', 'drink', 'cozy']),

  // Hoodies
  item('hoodie-raylene',   'Se\'kret Hoodie 💜','👕', 'accessories', 'raylene', null, ['hoodie', 'purple', 'sekret', 'raylene']),
  item('hoodie-rylane',    'Keep Bippin Hoodie','👕', 'accessories', 'rylane',  null, ['hoodie', 'dark', 'keep-bippin', 'rylane']),

  // Backpack
  item('backpack-bip',     'Bip Backpack',      '🎒', 'accessories', 'shared',  null, ['backpack', 'bip', 'purple']),

  // Candle mug
  item('night-fuel-mug',   'Night Fuel Mug',    '☕', 'accessories', 'night',   null, ['mug', 'night', 'fuel', 'coffee']),

  // Record player
  item('record-player',    'Vinyl Record Player','🎵', 'accessories', 'cloud',  null, ['vinyl', 'record', 'music', 'cloud']),

  // Basketball
  item('basketball',       'Basketball',         '🏀', 'accessories', 'rylane', null, ['basketball', 'sports', 'rylane']),

  // Clock
  item('clock-11-27',      '11:27 Desk Clock',  '🕐', 'accessories', 'night',  null, ['clock', '1127', 'night', 'late']),

  // Cloud plush pillow
  item('cloud-pillow',     'Cloud Plush Pillow', '☁️', 'accessories', 'shared',
    IMAGES.cloud,   // cloud mascot as stand-in
    ['cloud', 'pillow', 'plush', 'cozy']),

  // ── PLANTS ─────────────────────────────────────────────────────────────────

  item('plant-ivy',        'Hanging Ivy',        '🌿', 'plants', 'shared', null, ['ivy', 'plant', 'hanging', 'green']),
  item('plant-succulent',  'Succulent',           '🪴', 'plants', 'shared', null, ['succulent', 'plant', 'small']),
  item('plant-potted',     'Potted Plant',        '🪴', 'plants', 'shared', null, ['plant', 'potted', 'green']),
  item('plant-pencil',     'Pencil Cup + Plant',  '✏️', 'plants', 'shared', null, ['plant', 'pencil', 'desk', 'small']),

  // ── CHARACTERS (the 53 Bip stickers — all immediately available) ───────────

  // Raylene stickers
  item('stk-ray-standing',    'Raylene',         '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-standing'],   ['raylene', 'standing', 'confident']),
  item('stk-ray-lounging',    'Raylene Lounging','💜', 'characters', 'raylene', STICKER_IMAGES['raylene-lounging'],   ['raylene', 'lounging', 'relaxed']),
  item('stk-ray-studying',    'Raylene Studying','💜', 'characters', 'raylene', STICKER_IMAGES['raylene-studying'],   ['raylene', 'studying', 'focused']),
  item('stk-ray-sleepy',      'Raylene Sleepy',  '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-sleepy'],     ['raylene', 'sleepy', 'tired']),
  item('stk-ray-peace',       'Raylene Peace',   '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-peace'],      ['raylene', 'peace', 'calm']),
  item('stk-ray-listening',   'Raylene Listening','💜','characters', 'raylene', STICKER_IMAGES['raylene-listening'],  ['raylene', 'headphones', 'music']),
  item('stk-ray-comfort',     'Raylene Comfort', '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-comfort'],    ['raylene', 'comfort', 'hug']),
  item('stk-ray-sunglasses',  'Raylene Sunglasses','💜','characters','raylene', STICKER_IMAGES['raylene-sunglasses'],['raylene', 'cool', 'sunglasses']),
  item('stk-ray-happy',       'Raylene Happy',   '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-happy'],      ['raylene', 'happy', 'excited']),
  item('stk-ray-journaling',  'Raylene Journaling','💜','characters','raylene', STICKER_IMAGES['raylene-journaling'],['raylene', 'journal', 'writing']),
  item('stk-ray-thinking',    'Raylene Thinking','💜', 'characters', 'raylene', STICKER_IMAGES['raylene-thinking'],  ['raylene', 'thinking', 'curious']),
  item('stk-ray-boba',        'Raylene + Boba',  '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-boba'],       ['raylene', 'boba', 'cozy']),
  item('stk-ray-crown',       'Raylene Crown',   '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-crown'],      ['raylene', 'crown']),
  item('stk-ray-sunnies',     'Raylene Sunnies', '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-sunnies'],   ['raylene', 'sunnies']),
  item('stk-ray-hoodie',      'Raylene Hoodie',  '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-hoodie'],    ['raylene', 'hoodie']),
  item('stk-ray-sekret-bip',  'Raylene Sekret',  '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-sekret-bip'],['raylene', 'sekret']),
  item('stk-ray-sekret-heart','Raylene Heart',   '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-sekret-heart'],['raylene', 'heart', 'love']),
  item('stk-ray-pillow',      'Raylene + Pillow','💜', 'characters', 'raylene', STICKER_IMAGES['raylene-pillow'],    ['raylene', 'pillow', 'cozy']),
  item('stk-ray-icon-cloud',  'Raylene Cloud',   '💜', 'characters', 'raylene', STICKER_IMAGES['raylene-icon-cloud'],['raylene', 'cloud', 'icon']),

  // Rylane stickers
  item('stk-ryl-mini',        'Rylane',          '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-mini'],        ['rylane', 'mini', 'neutral']),
  item('stk-ryl-reading',     'Rylane Reading',  '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-reading'],     ['rylane', 'reading', 'focused']),
  item('stk-ryl-phone',       'Rylane Phone',    '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-phone'],       ['rylane', 'phone', 'casual']),
  item('stk-ryl-thinking',    'Rylane Thinking', '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-thinking'],    ['rylane', 'thinking', 'curious']),
  item('stk-ryl-sitting',     'Rylane Sitting',  '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-sitting'],     ['rylane', 'sitting', 'calm']),
  item('stk-ryl-headphones',  'Rylane Headphones','⚡','characters', 'rylane',  STICKER_IMAGES['rylane-headphones'], ['rylane', 'headphones', 'music']),
  item('stk-ryl-hoodie',      'Rylane Hoodie',   '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-hoodie'],      ['rylane', 'hoodie', 'cozy']),
  item('stk-ryl-calm',        'Rylane Calm',     '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-calm'],        ['rylane', 'calm', 'grounded']),
  item('stk-ryl-stormy',      'Rylane Stormy',   '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-stormy'],      ['rylane', 'stormy', 'upset']),
  item('stk-ryl-peace',       'Rylane Peace',    '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-peace'],       ['rylane', 'peace', 'proud']),
  item('stk-ryl-happy',       'Rylane Happy',    '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-happy'],       ['rylane', 'happy', 'excited']),
  item('stk-ryl-sleepy',      'Rylane Sleepy',   '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-sleepy'],      ['rylane', 'sleepy', 'tired']),
  item('stk-ryl-night',       'Rylane Night',    '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-night'],       ['rylane', 'night', 'window']),
  item('stk-ryl-music',       'Rylane Music',    '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-music'],       ['rylane', 'music', 'listening']),
  item('stk-ryl-late-night',  'Late Night',      '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-late-night'], ['rylane', 'late-night', 'text']),
  item('stk-ryl-protect',     'Protect Sign',    '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-protect'],    ['rylane', 'protect', 'text']),
  item('stk-ryl-why-i-love',  'Why I Love',      '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-why-i-love'],['rylane', 'love', 'text']),
  item('stk-ryl-writing',     'Writing Icon',    '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-writing'],    ['rylane', 'writing', 'icon']),
  item('stk-ryl-speech',      'Speech Bubble',   '⚡', 'characters', 'rylane',  STICKER_IMAGES['rylane-speech'],     ['rylane', 'speech', 'icon']),

  // Cloud stickers
  item('stk-cld-sleepy',      'Cloud Sleepy',    '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-sleepy'],       ['cloud', 'sleepy', 'rest']),
  item('stk-cld-happy',       'Cloud Happy',     '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-happy'],        ['cloud', 'happy', 'energetic']),
  item('stk-cld-listening',   'Cloud Listening', '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-listening'],   ['cloud', 'listening', 'focused']),
  item('stk-cld-voice-bip',   'Cloud Voice Bip', '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-voice-bip'],   ['cloud', 'voice', 'active']),
  item('stk-cld-journal',     'Cloud Journal',   '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-journal'],     ['cloud', 'journal', 'writing']),
  item('stk-cld-comfort',     'Cloud Comfort',   '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-comfort'],     ['cloud', 'comfort', 'calm']),
  item('stk-cld-hug',         'Cloud Hug',       '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-hug'],         ['cloud', 'hug', 'loving']),
  item('stk-cld-proud',       'Cloud Proud',     '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-proud'],       ['cloud', 'proud', 'happy']),
  item('stk-cld-stormy',      'Cloud Stormy',    '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-stormy'],      ['cloud', 'stormy', 'moody']),
  item('stk-cld-crying',      'Cloud Crying',    '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-crying'],      ['cloud', 'crying', 'sad']),
  item('stk-cld-cozy',        'Cloud Cozy',      '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-cozy'],        ['cloud', 'cozy', 'calm']),
  item('stk-cld-dreamy',      'Cloud Dreamy',    '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-dreamy'],      ['cloud', 'dreamy', 'night']),
  item('stk-cld-thinking',    'Cloud Thinking',  '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-thinking'],   ['cloud', 'thinking', 'curious']),
  item('stk-cld-bippin-brb',  'Bippin BRB',      '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-bippin-brb'], ['cloud', 'brb', 'sleepy']),
  item('stk-cld-cheer',       'Cloud Cheer',     '☁️', 'characters', 'cloud',   STICKER_IMAGES['cloud-cheer'],      ['cloud', 'cheer', 'excited']),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const CATALOG_BY_CATEGORY = FURNISH_CATALOG.reduce<Record<FurnishCategory, FurnishItem[]>>(
  (acc, item) => {
    acc[item.category] = acc[item.category] ?? [];
    acc[item.category].push(item);
    return acc;
  },
  {} as Record<FurnishCategory, FurnishItem[]>,
);

export const AVAILABLE_ITEMS   = FURNISH_CATALOG.filter(i => i.available);
export const PLACEHOLDER_ITEMS = FURNISH_CATALOG.filter(i => i.placeholder);

export function getItemsByOrigin(origin: RoomOrigin): FurnishItem[] {
  return FURNISH_CATALOG.filter(i => i.origin === origin || i.origin === 'shared');
}

export function getItemsByCategory(category: FurnishCategory): FurnishItem[] {
  return CATALOG_BY_CATEGORY[category] ?? [];
}

export function getFurnishItemById(id: string): FurnishItem | undefined {
  return FURNISH_CATALOG.find(i => i.id === id);
}

/** How many items need standalone PNG assets from the design team */
export const PENDING_ASSET_COUNT = PLACEHOLDER_ITEMS.length;
