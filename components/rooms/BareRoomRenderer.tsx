/**
 * BareRoomRenderer
 *
 * Code-driven bare room shell for the User Room system.
 *
 * Matches the ACTUAL architecture of the four Avatar Room bg images:
 * — cream/warm-white walls with baseboard trim
 * — light hardwood floor (angled perspective)
 * — large left-side window showing city skyline
 * — character-specific curtain color + lighting tint
 * — ceiling visible at top with coving
 *
 * This component renders the empty room shell exactly as the bg images
 * look when all furniture is removed. It serves as the User Room base
 * layer until extracted bare-room PNGs are ready from the design team.
 *
 * Time-of-day is handled via `lightingMode` — the same 8 phases used
 * across the whole app. Day = warm golden light from left window.
 * Night = cooler, darker, city glow replaces sunlight.
 *
 * Layer order (bottom to top):
 *   0  ceiling strip
 *   1  back wall
 *   2  left wall panel (with window)
 *   3  window: sky gradient + city silhouette + glass tint
 *   4  curtain left + right panels
 *   5  window frame + sill
 *   6  floor (angled trapezoid via border trick)
 *   7  baseboard trim
 *   8  lighting atmosphere overlay
 *   9  character-specific ambient (ivy peek, city neon)
 */

import React from 'react';
import { Dimensions, DimensionValue, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Character } from '../../constants/theme';
import type { LightingMode } from '../../screens/UserRoomScreen';

const { width, height } = Dimensions.get('window');

// ─── Wall + room palette per character ────────────────────────────────────────
// Based on the colour temperature and tint of each bg image's architecture.

interface RoomPalette {
  wallBase:     string;   // main wall colour (cream, off-white)
  wallShadow:   string;   // far edge / top shadow
  ceiling:      string;   // thin ceiling band at top
  floorLight:   string;   // floor near window
  floorMid:     string;   // floor centre
  floorDark:    string;   // floor far corner / base
  curtain:      string;   // curtain fabric colour
  curtainSheer: string;   // sheer inner curtain
  trim:         string;   // baseboard / window sill
  accent:       string;   // neon / glow colour per character
}

const PALETTES: Record<Character, RoomPalette> = {
  raylene: {
    wallBase:     '#f5f0f8',  // warm cream with purple blush
    wallShadow:   '#e0d6ec',
    ceiling:      '#ede8f4',
    floorLight:   '#c8a97a',  // warm honey oak near window
    floorMid:     '#b8975f',
    floorDark:    '#9a7a45',
    curtain:      '#9b59b6',  // purple silk curtains
    curtainSheer: 'rgba(200,170,230,0.28)',
    trim:         '#efe9f6',
    accent:       '#c084fc',
  },
  rylane: {
    wallBase:     '#eeedf5',  // cool off-white / slight blue cast
    wallShadow:   '#d0cedf',
    ceiling:      '#e8e7f2',
    floorLight:   '#a08868',  // darker oak, city apartment
    floorMid:     '#8c7250',
    floorDark:    '#705a38',
    curtain:      '#1a0a2e',  // near-black deep purple
    curtainSheer: 'rgba(80,60,120,0.22)',
    trim:         '#dddaea',
    accent:       '#6366f1',
  },
  cloud: {
    wallBase:     '#f4f0f9',  // soft lavender cream
    wallShadow:   '#e2d9f0',
    ceiling:      '#eee9f5',
    floorLight:   '#c4a070',  // warm wood, airy feel
    floorMid:     '#b48d58',
    floorDark:    '#987040',
    curtain:      '#7c3aed',  // medium purple
    curtainSheer: 'rgba(180,140,220,0.22)',
    trim:         '#eee8f5',
    accent:       '#a78bfa',
  },
  night: {
    wallBase:     '#eceaf5',  // muted lavender-white
    wallShadow:   '#c8c5dc',
    ceiling:      '#e4e2f0',
    floorLight:   '#948068',  // greyer wood, darker apartment
    floorMid:     '#7a6850',
    floorDark:    '#5e503a',
    curtain:      '#0f0820',  // near-black midnight
    curtainSheer: 'rgba(40,30,70,0.35)',
    trim:         '#dddbe8',
    accent:       '#818cf8',
  },
};

// ─── Time-of-day atmosphere ───────────────────────────────────────────────────

interface LightAtmosphere {
  skyTop:    string;  // sky gradient top colour in window
  skyBot:    string;  // sky gradient bottom colour in window
  sunBeam:   string;  // light shaft entering from window
  wallTint:  string;  // warm/cool tint cast on wall from window light
  floorTint: string;  // floor lit area colour from window
}

const ATMOSPHERE: Record<string, LightAtmosphere> = {
  auto:      { skyTop: '#87ceeb', skyBot: '#c8e6f5', sunBeam: 'rgba(255,240,200,0.22)', wallTint: 'rgba(255,235,200,0.08)', floorTint: 'rgba(255,220,150,0.12)' },
  day:       { skyTop: '#6bb8e8', skyBot: '#b8ddf5', sunBeam: 'rgba(255,235,180,0.28)', wallTint: 'rgba(255,240,200,0.10)', floorTint: 'rgba(255,225,140,0.16)' },
  midday:    { skyTop: '#4ba8e0', skyBot: '#a0cef0', sunBeam: 'rgba(255,248,220,0.35)', wallTint: 'rgba(255,248,220,0.12)', floorTint: 'rgba(255,240,180,0.20)' },
  afternoon: { skyTop: '#f0a060', skyBot: '#f8c890', sunBeam: 'rgba(255,180,80,0.30)',  wallTint: 'rgba(255,160,60,0.10)',  floorTint: 'rgba(240,160,80,0.18)' },
  evening:   { skyTop: '#7b3a8a', skyBot: '#c06898', sunBeam: 'rgba(200,80,160,0.22)', wallTint: 'rgba(180,60,140,0.09)',  floorTint: 'rgba(160,60,120,0.14)' },
  rain:      { skyTop: '#546e7a', skyBot: '#7899a6', sunBeam: 'rgba(100,140,180,0.14)', wallTint: 'rgba(60,100,140,0.10)',  floorTint: 'rgba(60,90,120,0.12)' },
  night:     { skyTop: '#0d0821', skyBot: '#1a1040', sunBeam: 'rgba(100,120,220,0.12)', wallTint: 'rgba(10,10,50,0.18)',   floorTint: 'rgba(20,20,80,0.14)' },
  deepNight: { skyTop: '#04030e', skyBot: '#0d0920', sunBeam: 'rgba(60,70,160,0.08)',  wallTint: 'rgba(4,3,20,0.28)',    floorTint: 'rgba(8,6,30,0.22)' },
};

// ─── City skyline silhouette ──────────────────────────────────────────────────
// A row of simplified building shapes rendered as absolute Views within the window.

const SKYLINE: { l: DimensionValue; w: DimensionValue; h: DimensionValue }[] = [
  { l: '0%',   w: '12%', h: '38%' },
  { l: '10%',  w: '8%',  h: '55%' },
  { l: '16%',  w: '14%', h: '40%' },
  { l: '28%',  w: '10%', h: '62%' },
  { l: '36%',  w: '6%',  h: '48%' },
  { l: '40%',  w: '16%', h: '35%' },
  { l: '54%',  w: '10%', h: '52%' },
  { l: '62%',  w: '8%',  h: '44%' },
  { l: '68%',  w: '18%', h: '38%' },
  { l: '84%',  w: '12%', h: '58%' },
  { l: '94%',  w: '10%', h: '42%' },
];

// ─── Layout constants ─────────────────────────────────────────────────────────

const FLOOR_H      = height * 0.26;   // floor occupies bottom 26%
const TRIM_H       = 3;
const CEIL_H       = height * 0.06;   // ceiling band at top
const WIN_TOP      = CEIL_H + height * 0.04;
const WIN_LEFT     = width  * 0.01;
const WIN_W        = width  * 0.36;
const WIN_H        = height * 0.52;
const CURTAIN_W    = width  * 0.08;

// ─── Component ────────────────────────────────────────────────────────────────

interface BareRoomRendererProps {
  character:    Character;
  lightingMode: LightingMode;
}

export function BareRoomRenderer({ character, lightingMode }: BareRoomRendererProps) {
  const p  = PALETTES[character];
  const atm = ATMOSPHERE[lightingMode] ?? ATMOSPHERE.auto;
  const isNight = lightingMode === 'night' || lightingMode === 'deepNight';
  const cityOpacity = isNight ? 0.85 : 0.55;
  const cityColor   = isNight ? 'rgba(30,25,60,0.9)' : 'rgba(60,55,80,0.45)';

  return (
    <View style={styles.root}>

      {/* ── 0: Ceiling band ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={[p.ceiling, p.wallBase]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.ceiling}
      />

      {/* ── 1: Back wall ────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[p.wallBase, p.wallShadow]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.wall}
      />

      {/* ── 2: Window opening — sky + skyline ──────────────────────────── */}
      <View style={[styles.windowOpening, { top: WIN_TOP, left: WIN_LEFT, width: WIN_W, height: WIN_H }]}>
        {/* Sky gradient */}
        <LinearGradient
          colors={[atm.skyTop, atm.skyBot]}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* City skyline silhouette — bottom-aligned buildings */}
        <View style={styles.skylineRow}>
          {SKYLINE.map((b, i) => (
            <View
              key={i}
              style={[
                styles.building,
                {
                  left:            b.l,
                  width:           b.w,
                  height:          b.h,
                  backgroundColor: cityColor,
                  opacity:         cityOpacity,
                },
              ]}
            />
          ))}
        </View>

        {/* Night city window lights — tiny dots on buildings */}
        {isNight && (
          <View style={styles.cityLights} pointerEvents="none">
            {CITY_LIGHTS.map((l, i) => (
              <View key={i} style={[styles.cityLight, { left: l.x, top: l.y, opacity: l.o }]} />
            ))}
          </View>
        )}

        {/* Window glass sheen — diagonal light */}
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'transparent', 'rgba(255,255,255,0.05)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* ── 3: Window frame (white painted wood) ───────────────────────── */}
      <View
        style={[
          styles.windowFrame,
          { top: WIN_TOP, left: WIN_LEFT, width: WIN_W, height: WIN_H },
        ]}
        pointerEvents="none"
      >
        {/* Horizontal centre rail */}
        <View style={styles.winRailH} />
        {/* Vertical centre mullion */}
        <View style={styles.winRailV} />
      </View>

      {/* Window sill */}
      <View
        style={[
          styles.windowSill,
          { top: WIN_TOP + WIN_H, left: WIN_LEFT - 4, width: WIN_W + 8 },
        ]}
        pointerEvents="none"
      />

      {/* ── 4: Curtains ─────────────────────────────────────────────────── */}

      {/* Left curtain panel */}
      <LinearGradient
        colors={[p.curtain, p.curtain + 'cc', p.curtain + '88']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[
          styles.curtainLeft,
          { top: WIN_TOP - 12, left: WIN_LEFT - 6, width: CURTAIN_W, height: WIN_H + 16 },
        ]}
      />

      {/* Left sheer */}
      <View
        style={[
          styles.curtainSheer,
          { top: WIN_TOP, left: WIN_LEFT, width: CURTAIN_W * 0.7, height: WIN_H, backgroundColor: p.curtainSheer },
        ]}
        pointerEvents="none"
      />

      {/* Right curtain panel */}
      <LinearGradient
        colors={[p.curtain + '88', p.curtain + 'cc', p.curtain]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[
          styles.curtainRight,
          { top: WIN_TOP - 12, left: WIN_LEFT + WIN_W - CURTAIN_W + 6, width: CURTAIN_W, height: WIN_H + 16 },
        ]}
      />

      {/* Right sheer */}
      <View
        style={[
          styles.curtainSheer,
          { top: WIN_TOP, left: WIN_LEFT + WIN_W - CURTAIN_W * 0.7, width: CURTAIN_W * 0.7, height: WIN_H, backgroundColor: p.curtainSheer },
        ]}
        pointerEvents="none"
      />

      {/* Curtain rod */}
      <View
        style={[
          styles.curtainRod,
          { top: WIN_TOP - 14, left: WIN_LEFT - CURTAIN_W * 0.5, width: WIN_W + CURTAIN_W },
        ]}
      />

      {/* ── 5: Light shaft from window onto wall ───────────────────────── */}
      <LinearGradient
        colors={[atm.sunBeam, 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={[
          styles.lightShaft,
          { top: WIN_TOP, left: WIN_LEFT + WIN_W, width: width * 0.45, height: WIN_H },
        ]}
        pointerEvents="none"
      />

      {/* ── 6: Baseboard trim ───────────────────────────────────────────── */}
      <View style={[styles.trim, { backgroundColor: p.trim }]} />

      {/* ── 7: Floor ────────────────────────────────────────────────────── */}
      <View style={styles.floorContainer}>
        {/* Floor base gradient: warm wood */}
        <LinearGradient
          colors={[p.floorLight, p.floorMid, p.floorDark]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Floorboard plank lines (horizontal perspective) */}
        {PLANKS.map((pct, i) => (
          <View key={i} style={[styles.plank, { top: `${pct}%` as any }]} />
        ))}

        {/* Window light spill on floor */}
        <LinearGradient
          colors={[atm.floorTint, 'transparent']}
          start={{ x: 0, y: 0.3 }} end={{ x: 0.7, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* ── 8: Global atmosphere tint over whole room ──────────────────── */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: atm.wallTint }]}
        pointerEvents="none"
      />

      {/* ── 9: Character atmosphere ─────────────────────────────────────── */}
      {character === 'night'   && <NightAtmosphere  atm={atm} />}
      {character === 'cloud'   && <CloudAtmosphere  palette={p} />}
      {character === 'rylane'  && <RylaneAtmosphere atm={atm} isNight={isNight} />}

    </View>
  );
}

// ─── Floor plank positions (% from top of floor) ─────────────────────────────

const PLANKS = [14, 28, 42, 57, 71, 85];

// ─── Night city light dots ────────────────────────────────────────────────────

const CITY_LIGHTS: { x: DimensionValue; y: DimensionValue; o: number }[] = [
  { x: '12%', y: '42%', o: 0.9 }, { x: '18%', y: '38%', o: 0.7 },
  { x: '28%', y: '30%', o: 0.8 }, { x: '33%', y: '35%', o: 0.6 },
  { x: '45%', y: '50%', o: 0.9 }, { x: '52%', y: '44%', o: 0.7 },
  { x: '60%', y: '28%', o: 0.8 }, { x: '68%', y: '35%', o: 0.6 },
  { x: '75%', y: '48%', o: 0.9 }, { x: '82%', y: '32%', o: 0.7 },
  { x: '90%', y: '40%', o: 0.5 }, { x: '15%', y: '55%', o: 0.6 },
  { x: '38%', y: '60%', o: 0.7 }, { x: '56%', y: '58%', o: 0.8 },
  { x: '72%', y: '55%', o: 0.6 }, { x: '88%', y: '62%', o: 0.5 },
];

// ─── Night atmosphere ─────────────────────────────────────────────────────────

function NightAtmosphere({ atm }: { atm: LightAtmosphere }) {
  return (
    <>
      {/* Moon glow outside window */}
      <View style={styles.moonGlow} pointerEvents="none">
        <LinearGradient
          colors={['rgba(200,210,255,0.35)', 'transparent']}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </>
  );
}

// ─── Cloud atmosphere ─────────────────────────────────────────────────────────

function CloudAtmosphere({ palette }: { palette: RoomPalette }) {
  return (
    <View style={styles.cloudAmbient} pointerEvents="none">
      <LinearGradient
        colors={[palette.accent + '18', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

// ─── Rylane atmosphere (city-apartment feel) ──────────────────────────────────

function RylaneAtmosphere({ atm, isNight }: { atm: LightAtmosphere; isNight: boolean }) {
  if (!isNight) return null;
  return (
    <View style={styles.neonFloor} pointerEvents="none">
      <LinearGradient
        colors={['rgba(99,102,241,0.10)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#f0edf7',
    overflow: 'hidden',
  },

  ceiling: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: CEIL_H,
  },

  wall: {
    position: 'absolute',
    top: CEIL_H,
    left: 0, right: 0,
    bottom: FLOOR_H + TRIM_H,
  },

  // Window
  windowOpening: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 2,
    zIndex: 2,
  },
  skylineRow: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '70%',
  },
  building: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  cityLights: {
    position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0,
  },
  cityLight: {
    position: 'absolute',
    width: 2, height: 2,
    borderRadius: 1,
    backgroundColor: '#ffe878',
  },

  windowFrame: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#e8e4f0',
    borderRadius: 2,
    zIndex: 3,
  },
  winRailH: {
    position: 'absolute',
    top: '50%',
    left: 0, right: 0,
    height: 3,
    backgroundColor: '#e8e4f0',
  },
  winRailV: {
    position: 'absolute',
    left: '50%',
    top: 0, bottom: 0,
    width: 3,
    backgroundColor: '#e8e4f0',
  },
  windowSill: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#ece8f2',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 3,
  },

  // Curtains
  curtainLeft: {
    position: 'absolute',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 4,
  },
  curtainRight: {
    position: 'absolute',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    zIndex: 4,
  },
  curtainSheer: {
    position: 'absolute',
    zIndex: 3,
  },
  curtainRod: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#c8b8d8',
    borderRadius: 3,
    zIndex: 5,
  },

  // Light shaft
  lightShaft: {
    position: 'absolute',
    zIndex: 2,
  },

  // Trim
  trim: {
    position: 'absolute',
    bottom: FLOOR_H,
    left: 0, right: 0,
    height: TRIM_H,
    zIndex: 4,
  },

  // Floor
  floorContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: FLOOR_H,
    overflow: 'hidden',
    zIndex: 3,
  },
  plank: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  // Atmospheres
  moonGlow: {
    position: 'absolute',
    top: WIN_TOP - 20,
    left: WIN_LEFT,
    width: WIN_W * 0.4,
    height: WIN_H * 0.3,
    zIndex: 2,
  },
  cloudAmbient: {
    position: 'absolute',
    top: '10%', left: '20%', right: '20%',
    height: '35%',
    zIndex: 2,
  },
  neonFloor: {
    position: 'absolute',
    bottom: 0, left: 0,
    width: '40%',
    height: FLOOR_H * 1.4,
    zIndex: 4,
  },
});
