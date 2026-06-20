import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { BipCrewScreen } from '@screens/BipCrewScreen';
import { THEME_PACKS } from '@/constants/theme';
import { loadState, saveState } from '@/utils';
import { routeForSide } from '@/shared/routes';
import AnonymousCircle from '../(main)/circle';
import type { CrewMember, CrewCheckIn } from '@/types';

type Tab = 'circle' | 'crew';

export default function TeenCircleRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  const [tab, setTab] = useState<Tab>('circle');
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [crewCheckIns, setCrewCheckIns] = useState<CrewCheckIn[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadState().then(s => {
      if (Array.isArray(s.crewMembers))  setCrewMembers(s.crewMembers);
      if (Array.isArray(s.crewCheckIns)) setCrewCheckIns(s.crewCheckIns);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void saveState({ crewMembers, crewCheckIns });
  }, [crewMembers, crewCheckIns, loaded]);

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
      </View>

      <View style={s.content}>
        {tab === 'circle' ? (
          <AnonymousCircle />
        ) : (
          <BipCrewScreen
            t={t}
            mood={mood}
            selectedSekret={selectedSekret}
            crewMembers={crewMembers}
            setCrewMembers={setCrewMembers}
            crewCheckIns={crewCheckIns}
            setCrewCheckIns={setCrewCheckIns}
            setScreen={(screen: string) => router.push(routeForSide('teen', screen) as any)}
            BottomNav={null}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#0d0518' },
  tabs:        {
    flexDirection: 'row',
    backgroundColor: '#130828',
    borderBottomWidth: 1,
    borderBottomColor: '#2e1250',
  },
  tab:         { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:   { borderBottomWidth: 2, borderBottomColor: '#a855f7' },
  tabText:     { color: '#5a3a78', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#e8dff5' },
  content:     { flex: 1 },
});
