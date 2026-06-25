import { Redirect, Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalMoodButton } from '@/components/GlobalMoodButton';
import { SideSafeBackButton } from '@/components/SideSafeBackButton';
import { useAppContext } from '@/context/AppContext';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: focused ? 21 : 19,
        opacity: focused ? 1 : 0.7,
      }}
    >
      {emoji}
    </Text>
  );
}

export default function TeenLayout() {
  const { userSide, isLoading } = useAppContext();
  const insets = useSafeAreaInsets();

  if (isLoading) return <View style={{ flex: 1, backgroundColor: '#0d0820' }} />;
  if (userSide === 'parent') return <Redirect href="/(parent)/room" />;
  if (userSide !== 'teen') return <Redirect href="/" />;

  const tabBarBottomPadding = Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + tabBarBottomPadding;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: '#111827',
            borderTopWidth: 0,
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: tabBarBottomPadding,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginTop: 1,
          },
        }}
      >
        <Tabs.Screen
          name="room"
          options={{
            title: 'Room',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="pages"
          options={{
            title: 'Pages',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="calm"
          options={{
            title: 'Calm',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🌙" focused={focused} />,
          }}
        />
        <Tabs.Screen name="calm/breathe" options={{ href: null }} />
        <Tabs.Screen
          name="circle"
          options={{
            title: 'Circle',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🌐" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ focused }) => <TabIcon emoji="•••" focused={focused} />,
          }}
        />
        <Tabs.Screen name="user-room" options={{ href: null }} />
        <Tabs.Screen name="sekret" options={{ href: null }} />
        <Tabs.Screen name="voicebip" options={{ href: null }} />
        <Tabs.Screen name="cloud" options={{ href: null }} />
        <Tabs.Screen name="cloudThoughts" options={{ href: null }} />
        <Tabs.Screen name="comfort" options={{ href: null }} />
        <Tabs.Screen name="crew" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="points" options={{ href: null }} />
        <Tabs.Screen name="history" options={{ href: null }} />
        <Tabs.Screen name="bridge" options={{ href: null }} />
        <Tabs.Screen name="s2tell" options={{ href: null }} />
        <Tabs.Screen name="period-calendar" options={{ href: null }} />
        <Tabs.Screen name="discover" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="chat/index" options={{ href: null }} />
        <Tabs.Screen name="chat/[personalityId]" options={{ href: null }} />
        <Tabs.Screen name="bippin2" options={{ href: null }} />
        <Tabs.Screen name="bippin2/womanhood" options={{ href: null }} />
        <Tabs.Screen name="bippin2/manhood" options={{ href: null }} />
        <Tabs.Screen name="growth" options={{ href: null }} />
        <Tabs.Screen name="mind-body-reset" options={{ href: null }} />
      </Tabs>
      <SideSafeBackButton side="teen" />
      <GlobalMoodButton />
    </View>
  );
}
