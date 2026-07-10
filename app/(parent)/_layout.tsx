import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SideSafeBackButton } from '@/components/SideSafeBackButton';
import { useAppContext } from '@/context/AppContext';
import { resolveParentEntryState, type ParentEntryState } from '@/services/parentEntryState';
import { getDevSplitViewSideOverride } from '@/utils/devSplitViewSide';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

function ParentTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: '#111827', borderTopWidth: 0, height: 68, paddingBottom: 10 },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen name="room" options={{ title: 'Room', tabBarIcon: () => <TabIcon emoji="🏡" /> }} />
        <Tabs.Screen name="pages" options={{ title: 'Pages', tabBarIcon: () => <TabIcon emoji="📝" /> }} />
        <Tabs.Screen name="calm" options={{ title: 'Calm', tabBarIcon: () => <TabIcon emoji="🌙" /> }} />
        <Tabs.Screen name="circle" options={{ title: 'Circle', tabBarIcon: () => <TabIcon emoji="🤝" /> }} />
        <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: () => <TabIcon emoji="•••" /> }} />

        <Tabs.Screen name="dashboard" options={{ href: null }} />
        <Tabs.Screen name="circle/[id]" options={{ href: null }} />
        <Tabs.Screen name="circle/weather" options={{ href: null }} />
        <Tabs.Screen name="bridge" options={{ href: null }} />
        <Tabs.Screen name="voicebip" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="s2tell" options={{ href: null }} />
        <Tabs.Screen name="repair" options={{ href: null }} />
        <Tabs.Screen name="voicereflect" options={{ href: null }} />
        <Tabs.Screen name="period-calendar" options={{ href: null }} />
        <Tabs.Screen name="sekret" options={{ href: null }} />
        <Tabs.Screen name="growth" options={{ href: null }} />
        <Tabs.Screen name="resources" options={{ href: null }} />
        <Tabs.Screen name="approvals" options={{ href: null }} />
      </Tabs>
      <SideSafeBackButton side="parent" />
    </View>
  );
}

export default function ParentLayout() {
  const { userSide, isLoading } = useAppContext();
  const [entryState, setEntryState] = useState<ParentEntryState | null>(null);

  useEffect(() => {
    let active = true;
    void resolveParentEntryState().then(state => {
      if (active) setEntryState(state);
    });
    return () => {
      active = false;
    };
  }, []);

  const effectiveUserSide = getDevSplitViewSideOverride() ?? userSide;

  if (isLoading || !entryState) {
    return <View style={{ flex: 1, backgroundColor: '#08140f' }} />;
  }
  if (effectiveUserSide === 'teen') return <Redirect href="/(teen)/room" />;
  if (effectiveUserSide !== 'parent') return <Redirect href="/" />;
  if (entryState.state === 'signed_out') return <Redirect href="/(auth)/login" />;
  if (entryState.state === 'profile_required') return <Redirect href="/(onboarding)/parent-welcome" />;
  if (entryState.state !== 'active') return <Redirect href="/(onboarding)/parent-link" />;

  return <ParentTabs />;
}
