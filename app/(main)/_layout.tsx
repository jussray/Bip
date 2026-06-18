/**
 * app/(main)/_layout.tsx
 *
 * PHASE 2 FIX: All teen + parent routes registered.
 * Visible tabs: home, pages, calm, circle, sekret (teen) / parent-room (parent).
 * All other routes hidden with href:null but fully navigable.
 */
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
      {/* ── Teen visible tabs ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
          href: userSide === 'parent' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="pages"
        options={{
          title: 'Pages',
          tabBarIcon: () => <TabIcon emoji="📖" />,
          href: userSide === 'parent' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="calm"
        options={{
          title: 'Calm',
          tabBarIcon: () => <TabIcon emoji="🌙" />,
          href: userSide === 'parent' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Circle',
          tabBarIcon: () => <TabIcon emoji="🌐" />,
          href: userSide === 'parent' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="sekret"
        options={{
          title: "Se'kret",
          tabBarIcon: () => <TabIcon emoji="💜" />,
          href: userSide === 'parent' ? null : undefined,
        }}
      />

      {/* ── Parent visible tabs ── */}
      <Tabs.Screen
        name="parent-room"
        options={{
          title: 'Room',
          tabBarIcon: () => <TabIcon emoji="🌿" />,
          href: userSide === 'teen' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="parent-pages"
        options={{
          title: 'Pages',
          tabBarIcon: () => <TabIcon emoji="📝" />,
          href: userSide === 'teen' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="parent-circle"
        options={{
          title: 'Circle',
          tabBarIcon: () => <TabIcon emoji="🤝" />,
          href: userSide === 'teen' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="parent-bridge"
        options={{
          title: 'Bridge',
          tabBarIcon: () => <TabIcon emoji="🌉" />,
          href: userSide === 'teen' ? null : undefined,
        }}
      />

      {/* ── Hidden teen routes ── */}
      <Tabs.Screen name="voicebip"       options={{ href: null }} />
      <Tabs.Screen name="cloud"          options={{ href: null }} />
      <Tabs.Screen name="comfort"        options={{ href: null }} />
      <Tabs.Screen name="crew"           options={{ href: null }} />
      <Tabs.Screen name="more"           options={{ href: null }} />
      <Tabs.Screen name="settings"       options={{ href: null }} />
      <Tabs.Screen name="points"         options={{ href: null }} />
      <Tabs.Screen name="history"        options={{ href: null }} />
      <Tabs.Screen name="bridge"         options={{ href: null }} />
      <Tabs.Screen name="s2tell"         options={{ href: null }} />
      <Tabs.Screen name="period-calendar" options={{ href: null }} />
      <Tabs.Screen name="discover"       options={{ href: null }} />
      <Tabs.Screen name="profile"        options={{ href: null }} />

      {/* ── Chat nested routes ── */}
      <Tabs.Screen name="chat/index"           options={{ href: null }} />
      <Tabs.Screen name="chat/[personalityId]" options={{ href: null }} />
    </Tabs>
  );
}
