/**
 * app/(main)/pages.tsx
 *
 * Pages / Journal tab.
 */
import { View } from 'react-native';
import PagesScreen from '@/screens/PagesScreen';
import { useAppContext } from '@/context/AppContext';

export default function PagesTab() {
  const { entries, setEntries } = useAppContext();
  return (
    <View style={{ flex: 1 }}>
      <PagesScreen entries={entries} setEntries={setEntries} />
    </View>
  );
}
