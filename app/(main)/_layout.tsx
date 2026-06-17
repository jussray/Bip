/**
 * app/(main)/_layout.tsx
 *
 * Main tab navigator — replaces the BottomNav component rendered
 * at the bottom of every screen in the old string-router architecture.
 *
 * Tab bar is intentionally minimal (dark, emoji icons).
 * Swap tabBarIcon to vector icons (Lucide / Ionicons) in Step 3.
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
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="pages"
        options={{
          title: 'Pages',
          tabBarIcon: () => <TabIcon emoji="📖" />,
        }}
      />
      <Tabs.Screen
        name="calm"
        options={{
          title: 'Calm',
          tabBarIcon: () => <TabIcon emoji="🌙" />,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Circle',
          tabBarIcon: () => <TabIcon emoji="🌐" />,
        }}
      />
      <Tabs.Screen
        name="sekret"
        options={{
          title: "Se'kret",
          tabBarIcon: () => <TabIcon emoji="💜" />,
        }}
      />
      {/* Hidden from tab bar — accessible via router.push() only */}
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="profile"  options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="bridge"   options={{ href: null }} />
      {/* Chat dynamic route group */}
      <Tabs.Screen name="chat"     options={{ href: null }} />
    </Tabs>
  );
}
