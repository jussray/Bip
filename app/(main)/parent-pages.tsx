/**
 * app/(main)/parent-pages.tsx
 *
 * Se'kret Bip — Parent entry screen.
 *
 * Layout:
 *   1. Full-screen splash image (sekret-splash-parent.jpg)
 *   2. "Press Se'kret Bip" label + glowing CTA button
 *   3. Bottom shortcut bar: Parent Pages · Parent Voice · Bridge · Parent Circle
 *
 * Pressing the CTA button transitions into the full ParentPagesScreen.
 *
 * The splash image lives at:
 *   assets/images/sekret-splash-parent.jpg
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { ParentPagesScreen } from '@screens/ParentPagesScreen';

// ── Asset path ────────────────────────────────────────────────────────────
const PARENT_SPLASH = require('@/assets/images/sekret-splash-parent.jpg');

// Bottom shortcut bar items for the parent splash
const PARENT_SHORTCUTS = [
  { label: 'Parent Pages', emoji: '📖', route: null },           // opens ParentPagesScreen inline
  { label: 'Parent Voice', emoji: '🎙️', route: '/(main)/voicebip' },
  { label: 'Bridge',       emoji: '🌉', route: '/(main)/bridge' },
  { label: 'Parent Circle',emoji: '👨‍👩‍👧', route: '/(main)/parent-circle' },
] as const;

export default function ParentPagesRoute() {
  const [
    splashDismissed,
    setSplashDismissed,
  ] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {
    parentMood,
    parentRoomStyle,
    parentPagesDraft,
    setParentPagesDraft,
    parentPagesEntries,
    parentOracleProfile,
    completeParentOracleSession,
    saveParentPageEntry,
  } = useAppContext();

  function dismissSplash() {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setSplashDismissed(true));
  }

  function handleShortcut(item: typeof PARENT_SHORTCUTS[number]) {
    if (item.route === null) {
      dismissSplash();
    } else {
      router.push(item.route as any);
    }
  }

  // Once splash is fully dismissed, render the full ParentPagesScreen
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
        setScreen={navigateTo}
        BottomNav={null}
      />
    );
  }

  return (
    <ParentPagesScreen
      mood={parentMood}
      parentRoomStyle={parentRoomStyle === 'dad' ? 'dad' : 'mom'}
      draft={parentPagesDraft}
      setDraft={setParentPagesDraft}
      entries={parentPagesEntries}
      onSave={saveParentPageEntry}
      oracleProfile={(parentOracleProfile ?? undefined) as any}
      onCompleteOracleSession={completeParentOracleSession}
      setScreen={navigateTo}
      BottomNav={null}
    />
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.splashWrap, { opacity: fadeAnim }]}>
        <ImageBackground
          source={PARENT_SPLASH}
          style={styles.splash}
          resizeMode="cover"
        >
          <SafeAreaView style={styles.splashInner}>
            {/* CTA area */}
            <View style={styles.ctaBlock}>
              <Text style={styles.ctaLabel}>Press Se'kret Bip</Text>
              <Text style={styles.ctaSub}>to enter your parent space</Text>

              <TouchableOpacity
                style={styles.ctaButton}
                onPress={dismissSplash}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaButtonText}>Se'kret Bip 🩷</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom shortcut bar */}
            <View style={styles.shortcutBar}>
              {PARENT_SHORTCUTS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.shortcutItem}
                  onPress={() => handleShortcut(item)}
                  activeOpacity={0.8}
                >
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

  // CTA
  ctaBlock:      { alignItems: 'center', paddingHorizontal: 32, paddingBottom: 16 },
  ctaLabel:      { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  ctaSub:        { color: '#ddd', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  ctaButton:     {
    borderWidth:       2,
    borderColor:       '#9333ea',
    borderRadius:      50,
    paddingVertical:    14,
    paddingHorizontal:  48,
    backgroundColor:   'rgba(147,51,234,0.18)',
    shadowColor:       '#9333ea',
    shadowOffset:      { width: 0, height: 0 },
    shadowOpacity:     0.9,
    shadowRadius:      14,
  },
  ctaButtonText: { color: '#e9d5ff', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },

  // Shortcut bar
  shortcutBar:   {
    flexDirection:    'row',
    justifyContent:   'space-around',
    paddingHorizontal: 12,
    paddingVertical:   12,
    backgroundColor:  'rgba(10,0,21,0.72)',
    marginTop:         8,
  },
  shortcutItem:  { alignItems: 'center', flex: 1 },
  shortcutEmoji: { fontSize: 22, marginBottom: 4 },
  shortcutLabel: { color: '#d8b4fe', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  tagline:       { color: '#a855f7', fontSize: 11, textAlign: 'center', paddingBottom: 8 },
});
