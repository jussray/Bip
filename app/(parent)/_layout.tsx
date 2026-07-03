import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { SideSafeBackButton } from '@/components/SideSafeBackButton';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function ParentLayout() {
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
        {/* Keep both sides consistent: Room · Pages · Calm · Circle · More. */}
        <Tabs.Screen name="room" options={{ title: 'Room', tabBarIcon: () => <TabIcon emoji="🏡" /> }} />
        <Tabs.Screen name="pages" options={{ title: 'Pages', tabBarIcon: () => <TabIcon emoji="📝" /> }} />
        <Tabs.Screen name="calm" options={{ title: 'Calm', tabBarIcon: () => <TabIcon emoji="🌙" /> }} />
        <Tabs.Screen name="circle" options={{ title: 'Circle', tabBarIcon: () => <TabIcon emoji="🤝" /> }} />
        <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: () => <TabIcon emoji="•••" /> }} />

        {/* Everything else stays off the bottom nav and is reached from More or in-flow navigation. */}
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
