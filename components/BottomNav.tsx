import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface BottomNavProps {
  screen: string;
  setScreen: (screen: string) => void;
  userSide: 'teen' | 'parent';
}

export function BottomNav({ screen, setScreen, userSide }: BottomNavProps) {
  const items = userSide === 'parent'
    ? [
        ['home', '🏠', 'Room'],
        ['pages', '📖', 'Pages'],
        ['voiceBip', '🎙', 'Voice'],
        ['calm', '🌙', 'Calm'],
        ['circle', '🌐', 'Circle'],
        ['more', '☰', 'More'],
      ]
    : [
        ['home', '🏠', 'Room'],
        ['pages', '📖', 'Pages'],
        ['voiceBip', '🎙', 'Voice'],
        ['calm', '🌙', 'Calm'],
        ['circle', '🌐', 'Circle'],
        ['more', '☰', 'More'],
      ];

  return (
    <View style={styles.bottomNav}>
      {items.map(([id, icon, label]: any) => (
        <TouchableOpacity
          key={id}
          onPress={() => setScreen(id)}
          style={styles.navItem}
        >
          <Text style={styles.navIcon}>{icon}</Text>
          <Text
            style={[
              styles.navText,
              screen === id && styles.activeNavText,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
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