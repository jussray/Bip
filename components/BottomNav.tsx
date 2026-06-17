/**
 * components/BottomNav.tsx
 *
 * Step 2b: migrated from setScreen prop to useRouter().push().
 *
 * setScreen prop is kept as an optional no-op for backward compatibility
 * during the transition. All navigation now goes through Expo Router.
 *
 * SCREEN_MAP is the canonical string-key → Expo Router path mapping.
 * Any screen that adds a new setScreen() call must also add an entry here.
 */
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const SCREEN_MAP: Record<string, string> = {
  home:         '/(main)/home',
  pages:        '/(main)/pages',
  calm:         '/(main)/calm',
  circle:       '/(main)/circle',
  sekret:       '/(main)/sekret',
  voiceBip:     '/(main)/discover',
  bridge:       '/(main)/bridge',
  parentBridge: '/(main)/bridge',
  cloudThoughts:'/(main)/discover',
  settings:     '/(main)/settings',
  more:         '/(main)/settings',
};

interface BottomNavProps {
  screen?: string;           // optional — active tab now derived from usePathname()
  setScreen?: (s: string) => void; // optional — kept for backward compat, no-op
  userSide: 'teen' | 'parent';
}

export function BottomNav({ userSide }: BottomNavProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const items: [string, string, string][] =
    userSide === 'parent'
      ? [
          ['home',   '🏠', 'Home'],
          ['bridge', '🌉', 'Bridge'],
          ['sekret', '💜', "Se'kret"],
          ['pages',  '📖', 'Pages'],
          ['more',   '☰',  'More'],
        ]
      : [
          ['home',   '🏠', 'Home'],
          ['pages',  '📖', 'Pages'],
          ['calm',   '🌙', 'Calm'],
          ['circle', '🌐', 'Circle'],
          ['sekret', '💜', "Se'kret"],
          ['more',   '☰',  'More'],
        ];

  return (
    <View style={styles.bottomNav}>
      {items.map(([id, icon, label]) => {
        const path    = SCREEN_MAP[id] ?? '/(main)/home';
        const isActive = pathname.includes(id);
        return (
          <TouchableOpacity
            key={id}
            onPress={() => router.push(path as any)}
            style={styles.navItem}
          >
            <Text style={styles.navIcon}>{icon}</Text>
            <Text style={[styles.navText, isActive && styles.activeNavText]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: '#111827',
    borderRadius: 20,
    marginTop: 28,
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  navItem: {
    alignItems: 'center',
    minWidth: 48,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 3,
  },
  navText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  activeNavText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
