import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function ParentLayout() {
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
        tabBarActiveTintColor:   '#fff',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="room"   options={{ title: 'Room',   tabBarIcon: () => <TabIcon emoji="🌿" /> }} />
      <Tabs.Screen name="pages"  options={{ title: 'Pages',  tabBarIcon: () => <TabIcon emoji="📝" /> }} />
      <Tabs.Screen name="circle" options={{ title: 'Circle', tabBarIcon: () => <TabIcon emoji="🤝" /> }} />
      <Tabs.Screen name="more"   options={{ title: 'More',   tabBarIcon: () => <TabIcon emoji="✨" /> }} />

      {/* Hidden — reachable via navigation, not tab bar */}
      <Tabs.Screen name="bridge"   options={{ href: null }} />
      <Tabs.Screen name="voicebip" options={{ href: null }} />
    </Tabs>
  );
}
