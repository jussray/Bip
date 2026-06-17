/**
 * app/(main)/home.tsx
 *
 * Home tab — renders the real HomeScreen component.
 * State is read from AppContext (no more prop drilling).
 */
import { View } from 'react-native';
import HomeScreen from '@/screens/HomeScreen';
import { useAppContext } from '@/context/AppContext';

export default function HomeTab() {
  const { mood, setMood, entries, setEntries } = useAppContext();
  // setMood is also aliased as selectMood in some legacy call sites;
  // both refer to the same setter — the alias is intentional.
  return (
    <View style={{ flex: 1 }}>
      <HomeScreen
        mood={mood}
        selectMood={setMood}
        entries={entries}
        setEntries={setEntries}
      />
    </View>
  );
}
