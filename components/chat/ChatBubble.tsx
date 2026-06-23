// components/chat/ChatBubble.tsx
// Renders a single chat message bubble.
// 'companion' bubbles sit left; 'user' bubbles sit right.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  from: 'companion' | 'user';
  text: string;
  time: string;
};

export function ChatBubble({ from, text, time }: Props) {
  const isUser = from === 'user';

  return (
    <View style={[s.row, isUser ? s.rowUser : s.rowCompanion]}>
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleCompanion]}>
        <Text style={[s.text, isUser ? s.textUser : s.textCompanion]}>
          {text}
        </Text>
        <Text style={[s.time, isUser ? s.timeUser : s.timeCompanion]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowCompanion: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: 'rgba(217, 70, 239, 0.28)',
    borderBottomRightRadius: 4,
  },
  bubbleCompanion: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: '#f3e8ff',
  },
  textCompanion: {
    color: '#e8e3f0',
  },
  time: {
    fontSize: 11,
    marginTop: 4,
  },
  timeUser: {
    color: 'rgba(243, 232, 255, 0.45)',
    textAlign: 'right',
  },
  timeCompanion: {
    color: 'rgba(232, 227, 240, 0.40)',
    textAlign: 'left',
  },
});
