import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { BipCrewScreen } from '@screens/BipCrewScreen';
import { THEME_PACKS } from '@/constants/theme';
import { loadState, saveState } from '@/utils';
import { routeForSide } from '@/shared/routes';
import ParentCircle from '../(main)/parent-circle';
import type { CrewMember, CrewCheckIn } from '@/types';

type Tab = 'circle' | 'crew';

export default function ParentCircleRoute() {
  const { theme, parentMood, parentRoomStyle } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  const [tab, setTab] = useState<Tab>('circle');
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [crewCheckIns, setCrewCheckIns] = useState<CrewCheckIn[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Parents use rylane voice for dad-style, raylene for everything else
  const companion = parentRoomStyle === 'dad' ? 'rylane' : 'raylene';

  useEffect(() => {
    void loadState().then(s => {
      if (Array.isArray(s.parentCrewMembers))  setCrewMembers(s.parentCrewMembers);
      if (Array.isArray(s.parentCrewCheckIns)) setCrewCheckIns(s.parentCrewCheckIns);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void saveState({ parentCrewMembers: crewMembers, parentCrewCheckIns: crewCheckIns });
  }, [crewMembers, crewCheckIns, loaded]);

  return (
    <View style={s.root}>
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'circle' && s.tabActive]}
          onPress={() => setTab('circle')}
        >
          <Text style={[s.tabText, tab === 'circle' && s.tabTextActive]}>🤝 Circle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'crew' && s.tabActive]}
          onPress={() => setTab('crew')}
        >
          <Text style={[s.tabText, tab === 'crew' && s.tabTextActive]}>🌿 Crew</Text>
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        {tab === 'circle' ? (
          <ParentCircle />
        ) : (
          <BipCrewScreen
            t={t}
            mood={parentMood}
            selectedSekret={companion}
            crewMembers={crewMembers}
            setCrewMembers={setCrewMembers}
            crewCheckIns={crewCheckIns}
            setCrewCheckIns={setCrewCheckIns}
            setScreen={(screen: string) => router.push(routeForSide('parent', screen) as any)}
            BottomNav={null}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0a1a14' },
  tabs:          {
    flexDirection: 'row',
    backgroundColor: '#0d1f18',
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a2f',
  },
  tab:           { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: '#34d399' },
  tabText:       { color: '#3d6b54', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#d1fae5' },
  content:       { flex: 1 },
});
