import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { SplashScreen } from '@screens/SplashScreen';

export default function Index() {
  const { userSide, setUserSide, isLoading } = useAppContext();
  const [pendingSide, setPendingSide] = useState<'teen' | 'parent' | null>(null);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color="#c4b5fd" />
      </View>
    );
  }

  const activeSide = userSide ?? pendingSide;

  async function enterSide(side: 'teen' | 'parent') {
    if (!userSide) setUserSide(side);
    const profileKey = side === 'parent' ? 'parent_profile_done' : 'teen_profile_done';
    const done = await AsyncStorage.getItem(profileKey);
    if (done === 'true') {
      router.replace(side === 'parent' ? '/(parent)/room' : '/(teen)/room');
      return;
    }
    router.replace(side === 'parent' ? '/(parent)/profile' : '/(teen)/profile');
  }

  if (activeSide) {
    return (
      <SplashScreen
        userSide={activeSide}
        setScreen={() => {
          void enterSide(activeSide);
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
      <Text style={styles.tagline}>Who&#39;s here right now?</Text>

      <TouchableOpacity
        style={[styles.btn, styles.btnTeen]}
        onPress={() => setPendingSide('teen')}
        activeOpacity={0.82}
      >
        <Text style={styles.btnText}>I&#39;m the teen 💜</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnParent]}
        onPress={() => setPendingSide('parent')}
        activeOpacity={0.82}
      >
        <Text style={styles.btnText}>I&#39;m the parent 🌿</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  tagline: { color: '#94A3B8', fontSize: 15, marginBottom: 48 },
  btn: { width: '100%', borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginBottom: 14 },
  btnTeen: { backgroundColor: '#6d28d9' },
  btnParent: { backgroundColor: '#1e3a2f' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
