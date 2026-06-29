// constants/vibeColors.ts
// Se'kret Bip — Vibe Lab Color System
//
// DESIGN PHILOSOPHY
// ─────────────────
// This file is the atmosphere engine for Vibe Lab.
// Every color decision routes through the ACTIVE_VIBE state — not standalone
// mood conventions and not the old Night/Plum/Indigo palette.
//
// The system is daytime-first:
//   · Bright, comfortable in natural light
//   · Soft daylight glows, airy layered surfaces
//   · Artwork leads the hierarchy
//   · Vibrant and expressive — not dashboard-like
//
// The six Vibe identities are atmosphere presets grounded in existing room
// scenes. Rain and Sunset are atmosphere presets, not companion identities.
// Raylene and Rylane identities carry their companion character.
//
// All derivations use the seven foundation colors below as source material.
// Do not merge this file with theme.ts.

// ─────────────────────────────────────────────────────────────────────────────
// FOUNDATION PALETTE
// These are the seven named source colors. Every other value in this file is
// derived from (or anchored to) one of these.
// ─────────────────────────────────────────────────────────────────────────────

export const FOUNDATION = {
  //  Name              Hex         Role
  daylightCream:   "#FFF8EE",  // page base — warm, open, never stark
  warmPeach:       "#FFB289",  // primary warmth — expressive, sunlit
  skyBlue:         "#7EC8E3",  // openness, clarity, breathing room
  softMint:        "#A8E6CF",  // fresh, energised, supportive
  sunGold:         "#FFD166",  // uplifting, celebratory, Vibe Lab accent
  cloudWhite:      "#F5F5F5",  // card surfaces, overlays, soft contrast
  softAccentBerry: "#E07A9F",  // warmth spike — for emphasis, not mood
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC TOKENS — routed through foundation, not standalone hex
// ─────────────────────────────────────────────────────────────────────────────

export const SEMANTIC = {
  // Surfaces
  pageBg:           FOUNDATION.daylightCream,   // full-screen base
  cardBg:           FOUNDATION.cloudWhite,       // card / panel background
  cardBgWarm:       "#FFF1E6",                   // card variant — warm tint over peach
  surfaceFloat:     "rgba(255,248,238,0.85)",    // floating panels, sheets
  surfaceDim:       "rgba(255,248,238,0.60)",    // dimmed background when sheet is up
  overlayScrim:     "rgba(80,40,20,0.32)",       // modal scrim over artwork

  // Text
  textPrimary:      "#2C1A0E",   // warm near-black — readable on cream
  textSecondary:    "#7A5030",   // muted mid-brown — supporting copy
  textTertiary:     "#B08060",   // placeholder / faint label
  textOnDark:       "#FFF8EE",   // text on deep/dark vibe surfaces
  textOnAccent:     "#2C1A0E",   // text sitting on peach / gold accents

  // Accent / Action
  accentPrimary:    FOUNDATION.warmPeach,        // primary CTA, active states
  accentSecondary:  FOUNDATION.sunGold,          // secondary highlight, Vibe Lab selector
  accentTertiary:   FOUNDATION.softMint,         // supportive accent, progress
  accentBerry:      FOUNDATION.softAccentBerry,  // emphasis — used sparingly

  // Borders & Dividers
  borderSubtle:     "rgba(44,26,14,0.10)",       // card borders, list separators
  borderMedium:     "rgba(44,26,14,0.20)",       // input borders, active states
  borderAccent:     FOUNDATION.warmPeach,        // focused input, selected card

  // Glow / Halo
  glowDay:          "rgba(255,178,137,0.22)",    // soft halo behind artwork on day vibes
  glowGold:         "rgba(255,209,102,0.28)",    // sun-gold glow for Vibe Lab highlights
  glowSky:          "rgba(126,200,227,0.20)",    // sky-tinted depth layer
  glowMint:         "rgba(168,230,207,0.22)",    // fresh energy layer

  // Safety & Privacy (always explicit, never ambient)
  safetyBg:         "#FFF3F3",                  // safety card/modal background
  safetyBorder:     "#E07A9F",                  // safety card border (soft, not alarming)
  safetyText:       "#8B1A3A",                  // safety text — readable, serious
  privacyIndicator: "#7EC8E3",                  // parent-visibility badge fill
  privacyText:      "#1A4A5C",                  // parent-visibility badge text
  parentBoundary:   "#FFD166",                  // parent-boundary pill / banner

  // Verification
  verifiedFill:     FOUNDATION.softMint,
  verifiedText:     "#1A5C3A",
  unverifiedFill:   "#FFF3E0",
  unverifiedText:   "#7A4500",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY SCALE
// React Native uses sp units via fontSize. We export numbers.
// ─────────────────────────────────────────────────────────────────────────────

export const TYPE = {
  // Size
  xs:    11,   // tiny label, badge
  sm:    13,   // caption, meta, timestamp
  base:  15,   // body text (default)
  md:    17,   // slightly-above-body — journal, card body
  lg:    20,   // section heading
  xl:    24,   // screen title
  xxl:   30,   // room name, vibe label
  hero:  40,   // splash, onboarding

  // Weight (React Native string literals)
  light:     "300" as const,
  regular:   "400" as const,
  medium:    "500" as const,
  semibold:  "600" as const,
  bold:      "700" as const,
  extrabold: "800" as const,

  // Line-height multipliers (applied as lineHeight = size * multiplier)
  lineRelaxed: 1.6,
  lineSnug:    1.35,
  lineNone:    1.0,

  // Letter spacing (React Native letterSpacing)
  trackingTight:  -0.3,
  trackingNormal:  0,
  trackingWide:    0.5,
  trackingUpper:   1.2,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SPACING SCALE (4px grid)
// ─────────────────────────────────────────────────────────────────────────────

export const SPACE = {
  px:   1,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5: 10,
  3:   12,
  3.5: 14,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  14:  56,
  16:  64,
  20:  80,
  24:  96,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// RADIUS SCALE
// ─────────────────────────────────────────────────────────────────────────────

export const RADIUS = {
  none:  0,
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  xxl:   28,
  card:  18,
  pill:  999,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SHADOW TOKENS
// React Native shadow props; iOS uses shadow*, Android uses elevation.
// ─────────────────────────────────────────────────────────────────────────────

export type ShadowToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export const SHADOW: Record<string, ShadowToken> = {
  none: {
    shadowColor: "transparent", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  xs: {
    shadowColor: "#2C1A0E", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  sm: {
    shadowColor: "#2C1A0E", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  md: {
    shadowColor: "#2C1A0E", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  lg: {
    shadowColor: "#2C1A0E", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13, shadowRadius: 24, elevation: 8,
  },
  glow: {
    shadowColor: FOUNDATION.warmPeach, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55, shadowRadius: 18, elevation: 6,
  },
  glowGold: {
    shadowColor: FOUNDATION.sunGold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.50, shadowRadius: 20, elevation: 6,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION / TRANSITION TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const MOTION = {
  // Durations (ms)
  instant:    80,
  fast:      180,
  normal:    300,
  relaxed:   480,
  slow:      700,
  breath:   1200,

  // Easing names — map to Animated.Easing or Reanimated worklets
  spring: { damping: 18, stiffness: 180, mass: 1 },       // snappy card reveal
  springGentle: { damping: 22, stiffness: 120, mass: 1 }, // atmosphere shift
  easeOut: "easeOut" as const,
  easeInOut: "easeInOut" as const,

  // Atmosphere crossfade
  vibeCrossfade: 600, // ms — how long the room overlay blends when vibe changes
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// VIBE PACK TYPE
// Each Vibe is a complete atmosphere preset. All UI reads tokens from the
// active VibePack — never from FOUNDATION colors directly at the screen level.
// ─────────────────────────────────────────────────────────────────────────────

export type VibeKey = "raylene" | "rylane" | "cloud" | "night" | "rain" | "sunset";

export type VibePalette = {
  // Identity
  name: string;
  emoji: string;
  tagline: string;       // shown in Vibe Lab selector
  character?: string;    // companion name if applicable

  // Base surfaces (daytime-derived for all vibes; darken via overlay at night)
  bg: string;            // screen background
  card: string;          // card / panel
  cardAlt: string;       // alternate card (slight tint)

  // Accent triad — one per vibe, anchored to foundation
  accentA: string;       // dominant vibe accent
  accentB: string;       // supporting accent
  accentC: string;       // tertiary / glow source

  // Text
  textHigh: string;      // high-emphasis text on this vibe's bg
  textMid: string;       // supporting text
  textLow: string;       // placeholder / faint

  // Atmosphere overlays (3-stop gradient, bottom-to-top)
  // Applied over the room scene art; should not erase the artwork
  overlayBottom: string;
  overlayMid: string;
  overlayTop: string;

  // Glow — soft halo behind companion art
  glowColor: string;
  glowRadius: number;

  // Component-level tokens
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  buttonBg: string;
  buttonText: string;
  badgeBg: string;
  badgeText: string;
  tabActive: string;
  tabInactive: string;
  divider: string;

  // Vibe Lab selector ring color (appears around active vibe chip)
  selectorRing: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// VIBE PACKS
// Each pack is grounded in the foundation palette. Dark/night vibes still read
// daylight foundation in their accent triad and glow — the darkness is in the
// surface and overlay, not the energy.
// ─────────────────────────────────────────────────────────────────────────────

export const VIBE_PACKS: Record<VibeKey, VibePalette> = {

  // ── Raylene's Room ─────────────────────────────────────────────────────────
  // Scrapbook warmth. Warm peach light fills the windows. Fairy lights at dusk.
  // Feels like golden hour inside a room that belongs to you.
  raylene: {
    name: "Raylene's Room",
    emoji: "🌸",
    tagline: "scrapbook soft · fairy lights · yours",
    character: "Raylene",

    bg:        "#FFF8EE",   // → daylightCream
    card:      "#FFF1E6",   // warm paper card
    cardAlt:   "#FFE8D6",   // peach-tinted card

    accentA:   "#FFB289",   // → warmPeach  (dominant)
    accentB:   "#FFD166",   // → sunGold    (supportive)
    accentC:   "#F4A0C8",   // peach-berry bridge (glow)

    textHigh:  "#2C1A0E",
    textMid:   "#7A5030",
    textLow:   "#B08060",

    overlayBottom: "rgba(255,178,137,0.06)",
    overlayMid:    "rgba(255,209,102,0.14)",
    overlayTop:    "rgba(255,248,238,0.70)",

    glowColor:  "#FFB289",
    glowRadius: 48,

    inputBg:          "#FFF8EE",
    inputBorder:      "rgba(44,26,14,0.12)",
    inputBorderFocus: "#FFB289",
    buttonBg:         "#FFB289",
    buttonText:       "#2C1A0E",
    badgeBg:          "#FFD166",
    badgeText:        "#2C1A0E",
    tabActive:        "#FFB289",
    tabInactive:      "#B08060",
    divider:          "rgba(44,26,14,0.08)",
    selectorRing:     "#FFB289",
  },

  // ── Rylane After Dark ──────────────────────────────────────────────────────
  // City window. Cool sky-blue cast with warm accent. Midnight energy that
  // still feels open — like a window cracked at 2AM, city lights below.
  rylane: {
    name: "Rylane After Dark",
    emoji: "🌃",
    tagline: "city chill · cool-lit · keeps it real",
    character: "Rylane",

    bg:        "#EFF6FA",   // sky-derived day surface
    card:      "#E4EFF6",   // cool-card
    cardAlt:   "#D6E8F3",   // deeper cool card

    accentA:   "#7EC8E3",   // → skyBlue   (dominant)
    accentB:   "#A8E6CF",   // → softMint  (supportive)
    accentC:   "#FFB289",   // warmPeach bridge — keeps it from going cold

    textHigh:  "#0E2433",
    textMid:   "#3A6070",
    textLow:   "#7AACBA",

    overlayBottom: "rgba(126,200,227,0.07)",
    overlayMid:    "rgba(168,230,207,0.12)",
    overlayTop:    "rgba(239,246,250,0.72)",

    glowColor:  "#7EC8E3",
    glowRadius: 52,

    inputBg:          "#EFF6FA",
    inputBorder:      "rgba(14,36,51,0.12)",
    inputBorderFocus: "#7EC8E3",
    buttonBg:         "#7EC8E3",
    buttonText:       "#0E2433",
    badgeBg:          "#A8E6CF",
    badgeText:        "#0E2433",
    tabActive:        "#7EC8E3",
    tabInactive:      "#7AACBA",
    divider:          "rgba(14,36,51,0.08)",
    selectorRing:     "#7EC8E3",
  },

  // ── Cloud Drift ────────────────────────────────────────────────────────────
  // Soft mint + cloud white. Floaty and energised. The cozy purple cloud-neon
  // room seen through a morning haze. Feels like a brain-dump on paper while
  // something good is playing through headphones.
  cloud: {
    name: "Cloud Drift",
    emoji: "☁️",
    tagline: "floating · fresh start · headphones in",
    character: "Cloud",

    bg:        "#F3FEFA",   // mint-tinted cloud white
    card:      "#E8FAF4",   // mint card
    cardAlt:   "#D8F5EC",   // deeper mint card

    accentA:   "#A8E6CF",   // → softMint  (dominant)
    accentB:   "#7EC8E3",   // → skyBlue   (supportive)
    accentC:   "#FFD166",   // → sunGold   (energy pop)

    textHigh:  "#0E2E22",
    textMid:   "#3A6A52",
    textLow:   "#7ABAA2",

    overlayBottom: "rgba(168,230,207,0.08)",
    overlayMid:    "rgba(126,200,227,0.12)",
    overlayTop:    "rgba(243,254,250,0.74)",

    glowColor:  "#A8E6CF",
    glowRadius: 44,

    inputBg:          "#F3FEFA",
    inputBorder:      "rgba(14,46,34,0.12)",
    inputBorderFocus: "#A8E6CF",
    buttonBg:         "#A8E6CF",
    buttonText:       "#0E2E22",
    badgeBg:          "#FFD166",
    badgeText:        "#2C1A0E",
    tabActive:        "#A8E6CF",
    tabInactive:      "#7ABAA2",
    divider:          "rgba(14,46,34,0.08)",
    selectorRing:     "#A8E6CF",
  },

  // ── Night Comfort ──────────────────────────────────────────────────────────
  // Late-night safe harbor. Warmth lives in the gold accent; the surface is
  // deep but not cold. Still anchored to daylight warmth — like a lamp you
  // left on so the room wouldn't feel empty.
  night: {
    name: "Night Comfort",
    emoji: "🌙",
    tagline: "late-night safe · lamp still on",
    character: "Night",

    bg:        "#1E1A2E",   // deep blue-warm night
    card:      "#2A2440",   // elevated card over deep bg
    cardAlt:   "#332D50",   // second-level card

    accentA:   "#FFD166",   // → sunGold   (warmth in the dark)
    accentB:   "#FFB289",   // → warmPeach (belonging)
    accentC:   "#A8E6CF",   // → softMint  (hopeful touch)

    textHigh:  "#FFF8EE",   // daylightCream on dark
    textMid:   "#C4B49A",
    textLow:   "#7A6A52",

    overlayBottom: "rgba(255,209,102,0.05)",
    overlayMid:    "rgba(255,178,137,0.08)",
    overlayTop:    "rgba(30,26,46,0.78)",

    glowColor:  "#FFD166",
    glowRadius: 56,

    inputBg:          "#2A2440",
    inputBorder:      "rgba(255,248,238,0.12)",
    inputBorderFocus: "#FFD166",
    buttonBg:         "#FFD166",
    buttonText:       "#1E1A2E",
    badgeBg:          "#332D50",
    badgeText:        "#FFF8EE",
    tabActive:        "#FFD166",
    tabInactive:      "#7A6A52",
    divider:          "rgba(255,248,238,0.08)",
    selectorRing:     "#FFD166",
  },

  // ── Window Rain ────────────────────────────────────────────────────────────
  // Soft diffused sky-blue, rain on glass. Not moody — just still and held.
  // The warmth is in the peach glow through the glass, not the palette.
  rain: {
    name: "Window Rain",
    emoji: "🌧️",
    tagline: "reflective · held · rain on glass",

    bg:        "#EEF4F9",   // rain-washed sky surface
    card:      "#E4EEF6",   // mist card
    cardAlt:   "#D6E6F2",   // deeper mist

    accentA:   "#7EC8E3",   // → skyBlue   (dominant; rain-lit)
    accentB:   "#FFB289",   // → warmPeach (warmth through glass)
    accentC:   "#A8E6CF",   // → softMint  (fresh after rain)

    textHigh:  "#0E2030",
    textMid:   "#3A5A6E",
    textLow:   "#6A9AAE",

    overlayBottom: "rgba(126,200,227,0.08)",
    overlayMid:    "rgba(126,200,227,0.18)",
    overlayTop:    "rgba(238,244,249,0.75)",

    glowColor:  "#7EC8E3",
    glowRadius: 40,

    inputBg:          "#EEF4F9",
    inputBorder:      "rgba(14,32,48,0.12)",
    inputBorderFocus: "#7EC8E3",
    buttonBg:         "#7EC8E3",
    buttonText:       "#0E2030",
    badgeBg:          "#FFB289",
    badgeText:        "#2C1A0E",
    tabActive:        "#7EC8E3",
    tabInactive:      "#6A9AAE",
    divider:          "rgba(14,32,48,0.08)",
    selectorRing:     "#7EC8E3",
  },

  // ── Sunset Exhale ──────────────────────────────────────────────────────────
  // The golden hour right before everything quiets. Peach-gold sky, warm-lit
  // surfaces. Feels like exhaling at the end of a long day — relieved, not sad.
  sunset: {
    name: "Sunset Exhale",
    emoji: "🌆",
    tagline: "golden hour · warm exhale · unwinding",

    bg:        "#FFF4E6",   // warm golden-cream
    card:      "#FFE8CC",   // peach-gold card
    cardAlt:   "#FFD9B3",   // deeper sunset card

    accentA:   "#FFD166",   // → sunGold   (dominant; golden sky)
    accentB:   "#FFB289",   // → warmPeach (lamp-warm)
    accentC:   "#E07A9F",   // → softAccentBerry (last light)

    textHigh:  "#2C1A0E",
    textMid:   "#7A4A20",
    textLow:   "#B07840",

    overlayBottom: "rgba(255,209,102,0.10)",
    overlayMid:    "rgba(255,178,137,0.20)",
    overlayTop:    "rgba(255,244,230,0.72)",

    glowColor:  "#FFD166",
    glowRadius: 60,

    inputBg:          "#FFF4E6",
    inputBorder:      "rgba(44,26,14,0.12)",
    inputBorderFocus: "#FFD166",
    buttonBg:         "#FFD166",
    buttonText:       "#2C1A0E",
    badgeBg:          "#FFB289",
    badgeText:        "#2C1A0E",
    tabActive:        "#FFD166",
    tabInactive:      "#B07840",
    divider:          "rgba(44,26,14,0.08)",
    selectorRing:     "#FFD166",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ATMOSPHERE LAYER SYSTEM
// Layered on top of room scene images. Three stops, bottom-to-top.
// Keep opacity low enough that artwork breathes through.
// ─────────────────────────────────────────────────────────────────────────────

export type AtmosphereLayer = {
  bottom: string;  // gradient stop over horizon/floor area
  mid: string;     // mid-room atmosphere
  top: string;     // near-camera / sky region
};

export function getAtmosphereLayer(vibe: VibeKey): AtmosphereLayer {
  const p = VIBE_PACKS[vibe];
  return {
    bottom: p.overlayBottom,
    mid:    p.overlayMid,
    top:    p.overlayTop,
  };
}

// Utility: build a 3-stop vertical gradient string for LinearGradient
// colors array. Top of screen = index 0, bottom = index 2.
export function atmosphereGradient(vibe: VibeKey): string[] {
  const { overlayTop, overlayMid, overlayBottom } = VIBE_PACKS[vibe];
  return [overlayTop, overlayMid, overlayBottom];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT SURFACE HELPERS
// Each returns a flat object ready for use as a React Native style.
// ─────────────────────────────────────────────────────────────────────────────

/** Card surface style for the active vibe */
export function vibeCard(vibe: VibeKey) {
  const p = VIBE_PACKS[vibe];
  return {
    backgroundColor: p.card,
    borderColor:     p.divider,
    borderWidth:     1,
    borderRadius:    RADIUS.card,
    ...SHADOW.sm,
  };
}

/** Primary button style for the active vibe */
export function vibeButton(vibe: VibeKey) {
  const p = VIBE_PACKS[vibe];
  return {
    backgroundColor: p.buttonBg,
    borderRadius:    RADIUS.pill,
    paddingVertical: SPACE[3],
    paddingHorizontal: SPACE[6],
  };
}

/** Text input style for the active vibe */
export function vibeInput(vibe: VibeKey) {
  const p = VIBE_PACKS[vibe];
  return {
    backgroundColor: p.inputBg,
    borderColor:     p.inputBorder,
    borderWidth:     1.5,
    borderRadius:    RADIUS.md,
    paddingVertical:   SPACE[3],
    paddingHorizontal: SPACE[4],
    color:           p.textHigh,
    fontSize:        TYPE.base,
  };
}

/** Badge / chip style for the active vibe */
export function vibeBadge(vibe: VibeKey) {
  const p = VIBE_PACKS[vibe];
  return {
    backgroundColor: p.badgeBg,
    borderRadius:    RADIUS.pill,
    paddingVertical:  SPACE[1],
    paddingHorizontal: SPACE[3],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY & SAFETY SURFACE TOKENS
// These are invariant — they do not shift with the active vibe.
// Always render them using SEMANTIC.* values so they remain legible on any
// room background and cannot be accidentally overridden by theme logic.
// ─────────────────────────────────────────────────────────────────────────────

export const SAFETY_SURFACE = {
  background:   SEMANTIC.safetyBg,
  border:       SEMANTIC.safetyBorder,
  borderWidth:  1.5,
  borderRadius: RADIUS.lg,
  text:         SEMANTIC.safetyText,
  iconColor:    SEMANTIC.safetyBorder,
} as const;

export const PRIVACY_BADGE = {
  background:   SEMANTIC.privacyIndicator,
  text:         SEMANTIC.privacyText,
  borderRadius: RADIUS.pill,
  paddingV:     SPACE[1],
  paddingH:     SPACE[3],
  fontSize:     TYPE.xs,
  fontWeight:   TYPE.semibold,
} as const;

export const PARENT_BOUNDARY = {
  background:   SEMANTIC.parentBoundary,
  text:         "#2C1A0E",
  borderRadius: RADIUS.pill,
  paddingV:     SPACE[2],
  paddingH:     SPACE[4],
  fontSize:     TYPE.sm,
  fontWeight:   TYPE.semibold,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// VIBE LAB SCREEN TOKENS
// These drive the Vibe Lab selector UI itself.
// ─────────────────────────────────────────────────────────────────────────────

export const VIBE_LAB_UI = {
  // Selector chip
  chipBase: {
    borderRadius: RADIUS.xl,
    padding:      SPACE[3],
    ...SHADOW.xs,
  },
  chipSelected: {
    borderWidth:  2.5,
  },
  chipLabel: {
    fontSize:    TYPE.sm,
    fontWeight:  TYPE.semibold,
    letterSpacing: TYPE.trackingNormal,
  },

  // Preview panel
  previewCard: {
    borderRadius: RADIUS.xxl,
    overflow:     "hidden" as const,
    ...SHADOW.md,
  },
  previewHeight:  220,

  // Transition on vibe change
  crossfadeDuration: MOTION.vibeCrossfade,
  crossfadeEasing:   MOTION.easeInOut,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN LAYOUT CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const LAYOUT = {
  // Navigation bar height (bottom)
  navBarHeight:      64,
  navBarPaddingV:    SPACE[3],

  // Room scene image fill
  roomSceneAspect:   "16/9" as const,   // CSS-style; use for image sizing hints

  // Companion art positioning (from bottom of safe area)
  companionBottom:   16,
  companionMaxWidth: 260,

  // Standard content inset from screen edge
  contentPaddingH:   SPACE[5],   // 20px — comfortable on 390px screen
  contentPaddingV:   SPACE[4],   // 16px

  // Card grid
  cardGap:           SPACE[3],   // 12px
  cardMinWidth:      150,

  // Sheet peek height (bottom sheet partially visible)
  sheetPeekHeight:   88,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY — get active vibe pack
// Call with the user's stored vibeKey (defaults to "raylene").
// ─────────────────────────────────────────────────────────────────────────────

export function getVibe(key?: string | null): VibePalette {
  if (key && key in VIBE_PACKS) return VIBE_PACKS[key as VibeKey];
  return VIBE_PACKS.raylene;
}

/** Resolve a legacy VibeKey string (including theme.ts VibeKey aliases) */
export function resolveVibeKey(key?: string | null): VibeKey {
  if (!key) return "raylene";
  if (key in VIBE_PACKS) return key as VibeKey;
  // Legacy aliases from theme.ts
  if (key === "flower")  return "raylene";
  if (key === "galaxy")  return "rylane";
  if (key === "neon")    return "night";
  return "raylene";
}
