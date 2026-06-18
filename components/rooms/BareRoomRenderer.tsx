/**
 * BareRoomRenderer
 *
 * Code-driven bare room shell for the User Room system.
 * Renders walls, floor, window, and ambient light using LinearGradient + Views.
 * No image extraction needed — styled to match each character room's palette.
 *
 * Used as LAYER 0 in UserRoomScreen when the user is in customization mode.
 * Furniture, decor, and companion layers sit on top.
 */

import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Character } from '../../constants/theme';
import type { LightingMode } from '../UserRoomScreen';

const { width, height } = Dimensions.get('window');

// ─── Room palettes ────────────────────────────────────────────────────────────

interface RoomPalette {
  wallTop:        string;
  wallMid:        string;
  wallBot:        string;
  ceilingStrip:   string;
  floorTop:       string;
  floorBot:       string;
  trim:           string;
  windowBorder:   string;
  windowInner:    string;
  accent:         string;
}

const PALETTES: Record<Character, RoomPalette> = {
  raylene: {
    wallTop:      '#2a1248',
    wallMid:      '#1e0a35',
    wallBot:      '#180830',
    ceilingStrip: '#1a0830',
    floorTop:     '#150720',
    floorBot:     '#0a0414',
    trim:         '#3a1e5e',
    windowBorder: '#4a2870',
    windowInner:  '#2a1448',
    accent:       '#c084fc',
  },
  rylane: {
    wallTop:      '#0d0d1e',
    wallMid:      '#09091a',
    wallBot:      '#060614',
    ceilingStrip: '#080812',
    floorTop:     '#040408',
    floorBot:     '#020204',
    trim:         '#18183a',
    windowBorder: '#1e2880',
    windowInner:  '#0c0c22',
    accent:       '#6080ff',
  },
  cloud: {
    wallTop:      '#1c0c44',
    wallMid:      '#130a36',
    wallBot:      '#0e0828',
    ceilingStrip: '#110830',
    floorTop:     '#0c0620',
    floorBot:     '#060314',
    trim:         '#28105e',
    windowBorder: '#4828a0',
    windowInner:  '#1a0c3a',
    accent:       '#9060f0',
  },
  night: {
    wallTop:      '#08001a',
    wallMid:      '#060014',
    wallBot:      '#04000e',
    ceilingStrip: '#060012',
    floorTop:     '#030008',
    floorBot:     '#010004',
    trim:         '#120030',
    windowBorder: '#1a1060',
    windowInner:  '#0a0820',
    accent:       '#8888ff',
  },
};

// ─── Lighting: window light color per mode ────────────────────────────────────

const WINDOW_LIGHT: Record<string, string> = {
  auto:      'rgba(255,235,210,0.13)',
  day:       'rgba(255,240,200,0.20)',
  midday:    'rgba(255,255,235,0.22)',
  afternoon: 'rgba(255,175,80,0.17)',
  evening:   'rgba(210,90,170,0.18)',
  rain:      'rgba(70,110,175,0.15)',
  night:     'rgba(175,195,255,0.10)',
  deepNight: 'rgba(120,140,220,0.07)',
};

const WALL_TINT: Record<string, string> = {
  auto:      'rgba(255,235,210,0.03)',
  day:       'rgba(255,240,200,0.05)',
  midday:    'rgba(255,255,235,0.06)',
  afternoon: 'rgba(255,160,60,0.05)',
  evening:   'rgba(180,60,140,0.06)',
  rain:      'rgba(50,90,150,0.08)',
  night:     'rgba(10,10,60,0.10)',
  deepNight: 'rgba(5,5,40,0.14)',
};

// ─── Window layouts per character ─────────────────────────────────────────────

interface WindowConfig {
  top:    string | number;
  left?:  string | number;
  right?: string | number;
  w:      string | number;
  h:      string | number;
  panes?: 'cross' | 'single' | 'grid';
}

const WINDOW_CONFIGS: Record<Character, WindowConfig> = {
  raylene: { top: '12%',  left: '1%',  w: '16%', h: '44%', panes: 'cross' },
  rylane:  { top: '8%',   left: '0%',  w: '18%', h: '50%', panes: 'grid'  },
  cloud:   { top: '10%',  left: '28%', w: '44%', h: '30%', panes: 'single' },
  night:   { top: '4%',   left: '4%',  w: '44%', h: '44%', panes: 'cross' },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface BareRoomRendererProps {
  character:    Character;
  lightingMode: LightingMode;
}

export function BareRoomRenderer({ character, lightingMode }: BareRoomRendererProps) {
  const p   = PALETTES[character];
  const wl  = WINDOW_LIGHT[lightingMode] ?? WINDOW_LIGHT.auto;
  const wt  = WALL_TINT[lightingMode]    ?? WALL_TINT.auto;
  const win = WINDOW_CONFIGS[character];

  return (
    <View style={styles.root}>

      {/* ── Main wall ──────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[p.ceilingStrip, p.wallTop, p.wallMid, p.wallBot]}
        locations={[0, 0.06, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.wall}
      />

      {/* Lighting tint over wall */}
      <View style={[styles.wall, { backgroundColor: wt }]} />

      {/* ── Window ─────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.windowFrame,
          {
            top:    win.top,
            left:   win.left,
            right:  win.right,
            width:  win.w,
            height: win.h,
            borderColor: p.windowBorder,
          },
        ]}
      >
        {/* Window glass — inner gradient */}
        <LinearGradient
          colors={[wl, p.windowInner, p.windowInner]}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Window panes */}
        {win.panes === 'cross' && (
          <>
            <View style={[styles.paneH, { borderColor: p.windowBorder + 'aa' }]} />
            <View style={[styles.paneV, { borderColor: p.windowBorder + 'aa' }]} />
          </>
        )}
        {win.panes === 'grid' && (
          <>
            <View style={[styles.paneH, { top: '33%', borderColor: p.windowBorder + '88' }]} />
            <View style={[styles.paneH, { top: '66%', borderColor: p.windowBorder + '88' }]} />
            <View style={[styles.paneV, { borderColor: p.windowBorder + '88' }]} />
          </>
        )}
      </View>

      {/* Window ambient light spill onto floor/wall */}
      <View
        style={[
          styles.windowSpill,
          {
            top:   win.top,
            left:  win.left ?? 0,
            width: '55%',
            height: win.h,
            opacity: 0.6,
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[wl, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* ── Wall trim / skirting board ─────────────────────────────────── */}
      <View style={[styles.trim, { backgroundColor: p.trim }]} />

      {/* ── Floor ──────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[p.floorTop, p.floorBot]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.floor}
      />

      {/* Floor ambient window-light spill */}
      <View style={[styles.floorSpill, { opacity: 0.4 }]} pointerEvents="none">
        <LinearGradient
          colors={[wl, 'transparent']}
          start={{ x: character === 'rylane' || character === 'raylene' ? 0 : 0.5, y: 0 }}
          end={{   x: character === 'rylane' || character === 'raylene' ? 0.6 : 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* ── Character-specific atmosphere ──────────────────────────────── */}
      {character === 'night' && <NightAtmosphere palette={p} lightingMode={lightingMode} />}
      {character === 'cloud' && <CloudAtmosphere palette={p} lightingMode={lightingMode} />}
      {character === 'rylane' && <RylaneAtmosphere palette={p} lightingMode={lightingMode} />}
    </View>
  );
}

// ─── Night atmosphere ─────────────────────────────────────────────────────────

function NightAtmosphere({ palette, lightingMode }: { palette: RoomPalette; lightingMode: LightingMode }) {
  const isLate = lightingMode === 'night' || lightingMode === 'deepNight' || lightingMode === 'auto';
  if (!isLate) return null;
  return (
    <>
      {/* Stars through window — tiny dots */}
      {STARS.map((star, i) => (
        <View key={i} style={[styles.star, { top: star.y, left: star.x, opacity: star.o, width: star.s, height: star.s }]} />
      ))}
    </>
  );
}

// Star positions (within the Night room's left window area)
const STARS = [
  { x: '3%',  y: '6%',  s: 2, o: 0.7 },
  { x: '8%',  y: '8%',  s: 1.5, o: 0.5 },
  { x: '12%', y: '5%',  s: 2, o: 0.8 },
  { x: '6%',  y: '14%', s: 1, o: 0.6 },
  { x: '15%', y: '10%', s: 1.5, o: 0.4 },
  { x: '22%', y: '7%',  s: 2, o: 0.65 },
  { x: '30%', y: '12%', s: 1, o: 0.5 },
  { x: '10%', y: '20%', s: 1, o: 0.45 },
  { x: '18%', y: '16%', s: 1.5, o: 0.6 },
  { x: '38%', y: '8%',  s: 1, o: 0.4 },
];

// ─── Cloud atmosphere ─────────────────────────────────────────────────────────

function CloudAtmosphere({ palette }: { palette: RoomPalette; lightingMode: LightingMode }) {
  return (
    <>
      {/* Soft ambient center glow */}
      <View style={styles.cloudGlow} pointerEvents="none">
        <LinearGradient
          colors={['rgba(144,96,240,0.14)', 'rgba(192,128,255,0.06)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    </>
  );
}

// ─── Rylane atmosphere (city light reflections) ───────────────────────────────

function RylaneAtmosphere({ lightingMode }: { palette: RoomPalette; lightingMode: LightingMode }) {
  const isNight = lightingMode === 'night' || lightingMode === 'deepNight' || lightingMode === 'auto';
  return (
    <>
      {/* City neon floor reflection */}
      {isNight && (
        <View style={styles.neonReflection} pointerEvents="none">
          <LinearGradient
            colors={['rgba(64,96,255,0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FLOOR_HEIGHT_RATIO = 0.27;
const TRIM_HEIGHT = 3;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#070010',
    overflow: 'hidden',
  },

  // Fills from top down to trim line
  wall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: height * FLOOR_HEIGHT_RATIO + TRIM_HEIGHT,
  },

  // Thin skirting board separating wall from floor
  trim: {
    position: 'absolute',
    bottom: height * FLOOR_HEIGHT_RATIO,
    left: 0,
    right: 0,
    height: TRIM_HEIGHT,
  },

  // Floor occupies bottom 27% of screen
  floor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * FLOOR_HEIGHT_RATIO,
  },

  // Window frame
  windowFrame: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 4,
    overflow: 'hidden',
    zIndex: 2,
  },

  // Cross pane — horizontal bar
  paneH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1.5,
    borderTopWidth: 1,
  },

  // Cross pane — vertical bar
  paneV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1.5,
    borderLeftWidth: 1,
  },

  // Ambient light spill from window onto wall
  windowSpill: {
    position: 'absolute',
    zIndex: 1,
  },

  // Light spill on floor from window
  floorSpill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%',
    height: height * FLOOR_HEIGHT_RATIO,
    zIndex: 1,
  },

  // Night room: stars
  star: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: '#e0e8ff',
    zIndex: 3,
  },

  // Cloud room: center ambient glow
  cloudGlow: {
    position: 'absolute',
    top: '8%',
    left: '15%',
    right: '15%',
    height: '45%',
    zIndex: 1,
  },

  // Rylane: neon floor reflection
  neonReflection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '30%',
    height: height * FLOOR_HEIGHT_RATIO * 1.5,
    zIndex: 1,
  },
});
