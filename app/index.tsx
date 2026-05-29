import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { HomeScreen } from '@screens/HomeScreen';
import { JournalScreen } from '@screens/JournalScreen';
import { CalmScreen } from '@screens/CalmScreen';
import { useSekretState } from '@hooks/useSekretState';
import { HOME_MESSAGES } from '@constants/theme';

export default function AppRoot() {
  const [screen, setScreen] = useState('home');
  const [journalText, setJournalText] = useState('');
  const [sekretMessage, setSekretMessage] = useState('');
  const [comfortIdx, setComfortIdx] = useState(0);
  const [homeMessageIndex, setHomeMessageIndex] = useState(0);
  const breatheAnim = useRef(new Animated.Value(1)).current;

  const {
    theme,
    mood,
    setMood,
    userSide,
    selectedSekret,
    growthPath,
    entries,
    setEntries,
    moodHistory,
    setMoodHistory,
    circlePosts,
    isLoading,
  } = useSekretState();

  // Breathe animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.1, duration: 2200, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Rotate home messages
  useEffect(() => {
    const i = setInterval(() => setHomeMessageIndex((p) => (p + 1) % HOME_MESSAGES.length), 5000);
    return () => clearInterval(i);
  }, []);

  const selectMood = (m: string) => {
    setMood(m);
    setMoodHistory((h) => [
      {
        id: Date.now(),
        mood: m,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
      ...h,
    ]);
  };

  const saveEntry = () => {
    if (!journalText.trim()) return;
    setEntries((e) => [
      {
        id: Date.now(),
        text: journalText,
        mood,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
      ...e,
    ]);
    setJournalText('');
  };

  if (isLoading) {
    return null; // Loading state
  }

  // Home Screen
  if (screen === 'home') {
    return (
      <HomeScreen
        theme={theme}
        mood={mood}
        setMood={selectMood}
        setScreen={setScreen}
        userSide={userSide}
        selectedSekret={selectedSekret}
        homeMessageIndex={homeMessageIndex}
        breatheAnim={breatheAnim}
      />
    );
  }

  // Journal/Pages Screen
  if (screen === 'pages') {
    return (
      <JournalScreen
        theme={theme}
        selectedSekret={selectedSekret}
        journalText={journalText}
        setJournalText={setJournalText}
        entries={entries}
        mood={mood}
        setScreen={setScreen}
        userSide={userSide}
        saveEntry={saveEntry}
      />
    );
  }

  // Calm Screen
  if (screen === 'calm') {
    return (
      <CalmScreen
        theme={theme}
        comfortIdx={comfortIdx}
        setComfortIdx={setComfortIdx}
        setScreen={setScreen}
        userSide={userSide}
        breatheAnim={breatheAnim}
      />
    );
  }

  // Default fallback
  return (
    <HomeScreen
      theme={theme}
      mood={mood}
      setMood={selectMood}
      setScreen={setScreen}
      userSide={userSide}
      selectedSekret={selectedSekret}
      homeMessageIndex={homeMessageIndex}
      breatheAnim={breatheAnim}
    />
  );
}
