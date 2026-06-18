import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ImageBackground, SafeAreaView, Animated, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { parentNavigateTo } from '@/parent/navigation';
import { ParentPagesScreen } from '@screens/ParentPagesScreen';
import { PARENT_SPLASH } from '@/parent/assets';

const PARENT_SHORTCUTS = [
  { label: 'Parent Pages', emoji: '📖', route: null },
  { label: 'Parent Voice', emoji: '🎙️', route: '/parent/voicebip' },
  { label: 'Parent Circle', emoji: '👨‍👩‍👧', route: '/parent/circle' },
] as const;

export default function ParentPagesRoute() {
  const [splashDismissed, setSplashDismissed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {
    parentMood, parentRoomStyle,
    parentPagesDraft, setParentPagesDraft,
    parentPagesEntries, parentOracleProfile,
    completeParentOracleSession, saveParentPageEntry,
  } = useAppContext();

  function dismissSplash() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true })
      .start(() => setSplashDismissed(true));
  }

  function handleShortcut(item: typeof PARENT_SHORTCUTS[number]) {
    if (item.route === null) dismissSplash();
    else router.push(item.route as any);
  }

  if (splashDismissed) {
    return (
      <ParentPagesScreen
        mood={parentMood}
        parentRoomStyle={parentRoomStyle === 'dad' ? 'dad' : 'mom'}
        draft={parentPagesDraft}
        setDraft={setParentPagesDraft}
        entries={parentPagesEntries}
        onSave={saveParentPageEntry}
        oracleProfile={parentOracleProfile ?? undefined}
        onCompleteOracleSession={completeParentOracleSession}
        setScreen={parentNavigateTo}
        onOpenPeriodCalendar={() => router.push('/parent/period-calendar' as any)}
        BottomNav={null}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.splashWrap, { opacity: fadeAnim }]}>
        <ImageBackground source={PARENT_SPLASH} style={styles.splash} resizeMode="cover">
          <SafeAreaView style={styles.splashInner}>
            <View style={styles.ctaBlock}>
              <Text style={styles.ctaLabel}>Press Se'kret Bip</Text>
              <Text style={styles.ctaSub}>to enter your parent space</Text>
              <TouchableOpacity style={styles.ctaButton} onPress={dismissSplash} activeOpacity={0.85}>
                <Text style={styles.ctaButtonText}>Se'kret Bip 🩷</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.shortcutBar}>
              {PARENT_SHORTCUTS.map(item => (
                <TouchableOpacity key={item.label} style={styles.shortcutItem} onPress={() => handleShortcut(item)} activeOpacity={0.8}>
                  <Text style={styles.shortcutEmoji}>{item.emoji}</Text>
                  <Text style={styles.shortcutLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.tagline}>better conversations start here. 🩷</Text>
          </SafeAreaView>
        </ImageBackground>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0a0015' },
  splashWrap:    { flex: 1 },
  splash:        { flex: 1 },
  splashInner:   { flex: 1, justifyContent: 'flex-end' },
  ctaBlock:      { alignItems: 'center', paddingHorizontal: 32, paddingBottom: 16 },
  ctaLabel:      { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  ctaSub:        { color: '#ddd', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  ctaButton: {
    borderWidth: 2, borderColor: '#9333ea', borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 48,
    backgroundColor: 'rgba(147,51,234,0.18)',
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 14,
  },
  ctaButtonText: { color: '#e9d5ff', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  shortcutBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: 'rgba(10,0,21,0.72)', marginTop: 8,
  },
  shortcutItem:  { alignItems: 'center', flex: 1 },
  shortcutEmoji: { fontSize: 22, marginBottom: 4 },
  shortcutLabel: { color: '#d8b4fe', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  tagline:       { color: '#a855f7', fontSize: 11, textAlign: 'center', paddingBottom: 8 },
});
