import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { BipCrewScreen } from '@screens/BipCrewScreen';
import { MessagesScreen } from '@screens/MessagesScreen';
import { THEME_PACKS } from '@/constants/theme';
import { routeForSide } from '@/shared/routes';
import AnonymousCircle from './feed';

type Tab = 'circle' | 'crew' | 'messages';

export default function TeenCircleRoute() {
  const {
    theme, mood, selectedSekret,
    crewMembers, setCrewMembers,
    crewCheckIns, setCrewCheckIns,
  } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  const [tab, setTab] = useState<Tab>('circle');

  const goTo = (screen: string) => router.push(routeForSide('teen', screen) as any);

  return (
    <View style={s.root}>
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'circle' && s.tabActive]}
          onPress={() => setTab('circle')}
        >
          <Text style={[s.tabText, tab === 'circle' && s.tabTextActive]}>🌐 Circle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'crew' && s.tabActive]}
          onPress={() => setTab('crew')}
        >
          <Text style={[s.tabText, tab === 'crew' && s.tabTextActive]}>🤝 Crew</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'messages' && s.tabActive]}
          onPress={() => setTab('messages')}
        >
          <Text style={[s.tabText, tab === 'messages' && s.tabTextActive]}>💜 Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.weatherBtn}
          onPress={() => router.push('/(teen)/circle/weather' as any)}
        >
          <Text style={s.weatherBtnText}>🌧️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.profileBtn}
          onPress={() => router.push('/(teen)/profile' as any)}
        >
          <Text style={s.profileBtnText}>🪪 Me</Text>
        </TouchableOpacity>
      </View>

      <View style={s.identityNote}>
        <Text style={s.identityNoteText}>
          Your Circle identity is separate from your private account. Crew only sees what you choose to share.
        </Text>
      </View>

      <View style={s.content}>
        {tab === 'circle' ? (
          <AnonymousCircle />
        ) : tab === 'crew' ? (
          <BipCrewScreen
            t={t}
            mood={mood}
            selectedSekret={selectedSekret}
            crewMembers={crewMembers}
            setCrewMembers={setCrewMembers}
            crewCheckIns={crewCheckIns}
            setCrewCheckIns={setCrewCheckIns}
            setScreen={goTo}
            BottomNav={null}
          />
        ) : (
          <MessagesScreen
            side="teen"
            setScreen={goTo}
            BottomNav={null}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0518' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#130828',
    borderBottomWidth: 1,
    borderBottomColor: '#2e1250',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#a855f7' },
  tabText: { color: '#5a3a78', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#e8dff5' },
  weatherBtn: { paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  weatherBtnText: { color: '#7c5a9e', fontSize: 11, fontWeight: '700' },
  profileBtn: { paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  profileBtnText: { color: '#c4b5fd', fontSize: 11, fontWeight: '800' },
  identityNote: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#120823', borderBottomWidth: 1, borderBottomColor: '#2e1250' },
  identityNoteText: { color: '#8f7aa6', fontSize: 10, lineHeight: 15, textAlign: 'center' },
  content: { flex: 1 },
});
