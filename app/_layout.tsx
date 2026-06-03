import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { Stack } from 'expo-router';
import { SEKRET_PROFILES, COMFORT_MESSAGES } from '../constants/theme';

type UserSide = 'teen' | 'parent';

const SekretContext = createContext<any>(null);

export function useSekret() {
  return useContext(SekretContext);
}

export default function RootLayout() {
  const [userSide, setUserSide] = useState<UserSide>('teen');
  const [theme, setTheme] = useState('neon');
  const [selectedSekret, setSelectedSekret] = useState('raylene');

  const [sekretMessage, setSekretMessage] = useState('');
  const [sekretReply, setSekretReply] = useState("I'm here with you. 💜");
  const [isSekretTyping, setIsSekretTyping] = useState(false);

  const [comfortIdx, setComfortIdx] = useState(0);
  const [bridgeText, setBridgeText] = useState('');
  const [selectedTone, setSelectedTone] = useState('softStart');

  const [circlePostText, setCirclePostText] = useState('');
  const [circlePosts, setCirclePosts] = useState<any[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);

  const breatheAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentSekret =
    SEKRET_PROFILES[selectedSekret] ||
    SEKRET_PROFILES.raylene ||
    Object.values(SEKRET_PROFILES)[0];

  const voiceKey = selectedSekret === 'rylane' ? 'rylane' : 'raylene';
  const charName = currentSekret?.name || 'Raylene';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.18,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: isRecording ? 1.12 : 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [isRecording]);

  const sendSekretMessage = () => {
    if (!sekretMessage.trim()) return;

    setIsSekretTyping(true);

    setTimeout(() => {
      setSekretReply("I hear you. You don't have to hold all of that alone. 💜");
      setSekretMessage('');
      setIsSekretTyping(false);
    }, 900);
  };

  const saveCirclePost = () => {
    if (!circlePostText.trim()) return;

    const newPost = {
      id: Date.now(),
      user: 'Anonymous Bip',
      time: 'just now',
      mood: 'soft 💜',
      text: circlePostText,
      hasVoice: false,
      reactions: { felt: 0, comfort: 0, proud: 0, stay: 0 },
    };

    setCirclePosts(prev => [newPost, ...prev]);
    setCirclePostText('');
  };

  const reactToPost = (postId: number, key: string) => {
    setCirclePosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              reactions: {
                ...post.reactions,
                [key]: (post.reactions?.[key] || 0) + 1,
              },
            }
          : post
      )
    );
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);

    const newNote = {
      id: Date.now(),
      title: 'Voice Bip',
      date: 'today',
      duration: '0:42',
    };

    setVoiceNotes(prev => [newNote, ...prev]);
    setIsSekretTyping(true);

    setTimeout(() => {
      setSekretReply("Thank you for letting that out. I'm proud of you. 💜");
      setIsSekretTyping(false);
    }, 900);
  };

  return (
    <SekretContext.Provider
      value={{
        userSide,
        setUserSide,

        theme,
        setTheme,

        selectedSekret,
        setSelectedSekret,
        currentSekret,
        voiceKey,
        charName,

        sekretMessage,
        setSekretMessage,
        sekretReply,
        isSekretTyping,
        sendSekretMessage,

        comfortIdx,
        setComfortIdx,

        bridgeText,
        setBridgeText,
        selectedTone,
        setSelectedTone,

        circlePostText,
        setCirclePostText,
        circlePosts,
        saveCirclePost,
        reactToPost,

        isRecording,
        voiceNotes,
        startRecording,
        stopRecording,

        breatheAnim,
        pulseAnim,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </SekretContext.Provider>
  );
}