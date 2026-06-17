/**
 * app/(main)/_layout.tsx
 *
 * Main tab navigator — replaces the BottomNav component rendered
 * at the bottom of every screen in the old string-router architecture.
 *
 * Tab bar is intentionally minimal (dark, emoji icons).
 * Swap tabBarIcon to vector icons (Lucide / Ionicons) in Step 3.
 *
 * Route registration notes:
 *  - The five visible tabs are flat files (home, pages, calm, circle, sekret).
 *  - All other routes (discover, profile, settings, bridge) are hidden
 *    from the tab bar with `href: null` but remain navigable via router.push().
 *  - The chat/ subdirectory is a nested route group. Each segment must be
 *    registered explicitly so Expo Router resolves them correctly:
 *      • chat/index      → personality picker hub
 *      • chat/[personalityId]  → full chat screen
 *    Registering only `name="chat"` (flat) caused a "route not found" error
 *    when pushing to /(main)/chat/raylene.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAppContext } from '@/context/AppContext';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function MainLayout() {
  const { userSide } = useAppContext();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {/* ── Visible tabs ── */}
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="pages"
        options={{ title: 'Pages', tabBarIcon: () => <TabIcon emoji="📖" /> }}
      />
      <Tabs.Screen
        name="calm"
        options={{ title: 'Calm', tabBarIcon: () => <TabIcon emoji="🌙" /> }}
      />
      <Tabs.Screen
        name="circle"
        options={{ title: 'Circle', tabBarIcon: () => <TabIcon emoji="🌐" /> }}
      />
      <Tabs.Screen
        name="sekret"
        options={{ title: "Se'kret", tabBarIcon: () => <TabIcon emoji="💜" /> }}
      />

      {/* ── Hidden routes (no tab bar entry, reachable via router.push) ── */}
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="profile"  options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="bridge"   options={{ href: null }} />

      {/* ── Chat nested routes — must register each segment explicitly ── */}
      {/* Registering "chat" (flat) does NOT cover chat/[personalityId]. */}
      <Tabs.Screen name="chat/index"            options={{ href: null }} />
      <Tabs.Screen name="chat/[personalityId]"  options={{ href: null }} />
    </Tabs>
  );
}
