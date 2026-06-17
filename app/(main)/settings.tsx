/**
 * app/(main)/settings.tsx
 *
 * App settings — theme, account, notifications, about.
 * Full Supabase-backed auth in a later sprint.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@/constants';

export default function SettingsScreen() {
  const { theme } = useAppContext();
  const [notifs, setNotifs] = React.useState(true);

  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS.neon;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Settings ⚙️</Text>

        {/* Theme */}
        <Text style={styles.sectionLabel}>Current Theme</Text>
        <View style={styles.themeRow}>
          <Text style={styles.themeEmoji}>{currentTheme.emoji}</Text>
          <View>
            <Text style={styles.themeName}>{currentTheme.name}</Text>
            <Text style={styles.themeSub}>Change theme in the Home tab</Text>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Daily check-in reminder</Text>
          <Switch
            value={notifs}
            onValueChange={setNotifs}
            trackColor={{ true: '#D946EF', false: '#333' }}
            thumbColor="#fff"
          />
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        {['Sign in / Create account', 'Privacy settings', 'Delete my data'].map((item) => (
          <TouchableOpacity key={item} style={styles.row}>
            <Text style={styles.rowLabel}>{item}</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        {["What is Se'kret Bip?", 'Community guidelines', 'Crisis resources'].map((item) => (
          <TouchableOpacity key={item} style={styles.row}>
            <Text style={styles.rowLabel}>{item}</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.version}>Se'kret Bip • v1.0.0-beta</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  content:      { padding: 24, paddingTop: 56, paddingBottom: 60 },
  heading:      { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 24 },
  sectionLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 24 },
  themeRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#111827', borderRadius: 14, padding: 14 },
  themeEmoji:   { fontSize: 28 },
  themeName:    { color: '#fff', fontSize: 15, fontWeight: '600' },
  themeSub:     { color: '#666', fontSize: 12, marginTop: 2 },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 8 },
  rowLabel:     { color: '#D1D5DB', fontSize: 15 },
  rowArrow:     { color: '#555', fontSize: 20 },
  version:      { color: '#333', fontSize: 12, textAlign: 'center', marginTop: 40 },
});
