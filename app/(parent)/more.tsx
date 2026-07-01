import React from 'react';
import { ImageBackground, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { IMAGES } from '@/constants/theme';
import { routeForSide } from '@/shared/routes';
import { useAppContext } from '@/context/AppContext';
import { PARENT_MORE_GROUPS } from '@/constants/screenPurpose';
import { isDevTestFamilyEnabled } from '@/features/testing/devTestFamily';

export default function ParentMoreRoute() {
  const { setUserSide } = useAppContext();
  const allowSideSwitch = process.env.EXPO_PUBLIC_ENABLE_SIDE_SWITCH === 'true' || isDevTestFamilyEnabled();

  function open(route: string) {
    if (route === 'parent-link') {
      router.push('/(onboarding)/parent-link');
      return;
    }
    router.push(routeForSide('parent', route) as any);
  }

  return (
    <ImageBackground source={IMAGES.parentHomeBg} style={styles.root} resizeMode="cover">
      <LinearGradient
        colors={['rgba(36,16,56,0.72)', 'rgba(22,11,43,0.88)', 'rgba(13,9,20,0.97)']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>FEATURE DRAWER</Text>
        <Text style={styles.logo}>Parent More</Text>
        <Text style={styles.subtitle}>
          Extra tools, connection management, and support resources. Bridge carries Doorbell signals, S2Tell shares, and replies.
        </Text>

        {PARENT_MORE_GROUPS.map(group => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.items.map(item => (
              <TouchableOpacity key={item.route} style={styles.row} onPress={() => open(item.route)} activeOpacity={0.82}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.rowText}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.promiseCard}>
          <Text style={styles.promiseTitle}>Support without surveillance</Text>
          <Text style={styles.promiseBody}>
            Bridge contains only intentional teen-parent connection. Circle stays completely separate. Teen journals, voice notes, and companion conversations stay private.
          </Text>
        </View>

        {allowSideSwitch ? (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => { setUserSide('teen'); router.push('/(teen)/room' as any); }}
          >
            <Text style={styles.switchText}>Founder Test: Go to Teen Side</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0914' },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 110,
    ...(Platform.OS === 'web' ? { maxWidth: 520, width: '100%', alignSelf: 'center' as const } : {}),
  },
  kicker: { color: '#a7f3d0', fontSize: 10, fontWeight: '900', letterSpacing: 2.3, marginBottom: 8 },
  logo: { fontSize: 34, fontWeight: '900', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#c6d5cc', marginBottom: 24, lineHeight: 21 },
  group: { marginBottom: 22 },
  groupTitle: { color: '#85aa96', fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginBottom: 10 },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#a7f3d026', borderRadius: 18, backgroundColor: 'rgba(17,37,28,0.90)', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  emoji: { width: 38, fontSize: 21 },
  rowText: { flex: 1 },
  label: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 3 },
  description: { color: '#91a79a', fontSize: 12, lineHeight: 17 },
  arrow: { color: '#a7f3d0', fontSize: 28, paddingLeft: 8 },
  promiseCard: { borderRadius: 20, borderWidth: 1, borderColor: '#a7f3d02e', backgroundColor: 'rgba(17,37,28,0.92)', padding: 18, marginTop: 4, marginBottom: 14 },
  promiseTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 6 },
  promiseBody: { color: '#9bb0a2', fontSize: 12, lineHeight: 18 },
  switchButton: { height: 54, borderRadius: 18, backgroundColor: '#4338CA', alignItems: 'center', justifyContent: 'center' },
  switchText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
