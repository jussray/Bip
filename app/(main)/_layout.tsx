/**
 * app/(main)/_layout.tsx
 *
 * PHASE 5 — Se'kret → Pages migration
 *
 * Teen visible tabs:   home · pages · calm · circle · more
 * Parent visible tabs: parent-room · parent-pages · parent-circle · parent-bridge · more
 *
 * sekret: registered but hidden (href: null).
 *   ↳ Fully reachable via  Pages → Se'kret Replies → tap companion → chat
 *   ↳ Direct push:  router.push('/(main)/sekret')  still works
 *
 * SAFETY RULE (Phase 5):
 *   Do NOT simply hide this tab and leave Se'kret unreachable.
 *   Se'kret's companion-picker UI is embedded inside PagesScreen
 *   under the "Se'kret Replies" section so companion interaction
 *   is always one tap from Pages.
 *
 * All other utility routes: hidden but navigable.
 */
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAppContext } from '@/context/AppContext';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function MainLayout() {
  const { userSide } = useAppContext();
  const isParent = userSide === 'parent';
  const isTeen   = !isParent;

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
          title: 'Room',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
          href: isParent ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="pages"
        options={{
          title: 'Pages',
          tabBarIcon: () => <TabIcon emoji="📖" />,
          href: isParent ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="calm"
        options={{
          title: 'Calm',
          tabBarIcon: () => <TabIcon emoji="🌙" />,
          href: isParent ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Circle',
          tabBarIcon: () => <TabIcon emoji="🌐" />,
          href: isParent ? null : undefined,
        }}
      />

      {/* ── Parent visible tabs ── */}
      <Tabs.Screen
        name="parent-room"
        options={{
          title: 'Room',
          tabBarIcon: () => <TabIcon emoji="🌿" />,
          href: isTeen ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="parent-pages"
        options={{
          title: 'Pages',
          tabBarIcon: () => <TabIcon emoji="📝" />,
          href: isTeen ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="parent-circle"
        options={{
          title: 'Circle',
          tabBarIcon: () => <TabIcon emoji="🤝" />,
          href: isTeen ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="parent-bridge"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="parent-growth"
        options={{ href: null }}
      />

      {/* ── More: visible on BOTH sides ── */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: () => <TabIcon emoji="✨" />,
        }}
      />

      {/* ── sekret: hidden from nav — soul lives inside Pages > Se'kret Replies ── */}
      <Tabs.Screen name="sekret"          options={{ href: null }} />

      {/* ── Hidden utility routes — all reachable via Pages navigation ── */}
      <Tabs.Screen name="voicebip"        options={{ href: null }} />
      <Tabs.Screen name="cloud"           options={{ href: null }} />
      <Tabs.Screen name="comfort"         options={{ href: null }} />
      <Tabs.Screen name="crew"            options={{ href: null }} />
      <Tabs.Screen name="settings"        options={{ href: null }} />
      <Tabs.Screen name="points"          options={{ href: null }} />
      <Tabs.Screen name="history"         options={{ href: null }} />
      <Tabs.Screen name="bridge"          options={{ href: null }} />
      <Tabs.Screen name="s2tell"          options={{ href: null }} />
      <Tabs.Screen name="period-calendar" options={{ href: null }} />
      <Tabs.Screen name="discover"        options={{ href: null }} />
      <Tabs.Screen name="profile"         options={{ href: null }} />

      {/* ── Memories: hidden, reachable from More ── */}
      <Tabs.Screen name="memories" options={{ href: null }} />

      {/* ── Chat nested routes ── */}
      <Tabs.Screen name="chat/index"            options={{ href: null }} />
      <Tabs.Screen name="chat/[personalityId]"  options={{ href: null }} />
    </Tabs>
  );
}
