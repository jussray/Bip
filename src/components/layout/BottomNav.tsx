/**
 * src/components/layout/BottomNav.tsx
 *
 * Canonical location (moved from components/BottomNav.tsx in Step 3).
 * Uses Expo Router — no setScreen prop needed.
 *
 * Import via: import { BottomNav } from '@/components/layout';
 */
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const SCREEN_MAP: Record<string, string> = {
  home:          '/(teen)/room',
  pages:         '/(teen)/pages',
  calm:          '/(teen)/calm',
  circle:        '/(teen)/circle',
  sekret:        '/(teen)/room',
  voiceBip:      '/(teen)/voicebip',
  bridge:        '/(teen)/bridge',
  parentBridge:  '/(parent)/bridge',
  cloudThoughts: '/(teen)/cloud',
  settings:      '/(teen)/settings',
  more:          '/(teen)/settings',
  parentHome:    '/(parent)/room',
  parentPages:   '/(parent)/pages',
  parentCircle:  '/(parent)/circle',
  parentMore:    '/(parent)/more',
};

interface BottomNavProps {
  /** @deprecated — active tab is derived from usePathname(). No longer needed. */
  screen?:    string;
  /** @deprecated — navigation now uses useRouter().push(). No longer needed. */
  setScreen?: (s: string) => void;
  userSide:   'teen' | 'parent';
}

export function BottomNav({ userSide }: BottomNavProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const items: [string, string, string][] =
    userSide === 'parent'
      ? [
          ['parentHome', '🏡', 'Room'],
          ['parentPages', '📝', 'Pages'],
          ['parentCircle', '🤝', 'Circle'],
          ['parentMore', '☰',  'More'],
        ]
      : [
          ['home',   '🏠', 'Home'],
          ['pages',  '📖', 'Pages'],
          ['calm',   '🌙', 'Calm'],
          ['circle', '🌐', 'Circle'],
          ['more',   '☰',  'More'],
        ];

  return (
    <View style={styles.bottomNav}>
      {items.map(([id, icon, label]) => {
        const isActive = pathname.includes(id);
        return (
          <TouchableOpacity
            key={id}
            onPress={() => router.push(SCREEN_MAP[id] as any)}
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
    flexDirection:  'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: '#111827',
    borderRadius:    20,
    marginTop:       28,
    marginBottom:    20,
    flexWrap:        'wrap',
    gap:             8,
  },
  navItem: {
    alignItems: 'center',
    minWidth:   48,
  },
  navIcon: {
    fontSize:     20,
    marginBottom: 3,
  },
  navText: {
    color:    '#94A3B8',
    fontSize: 11,
  },
  activeNavText: {
    color:      '#fff',
    fontWeight: 'bold',
  },
});
