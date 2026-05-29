import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CircleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Se'kret Circle ♡</Text>
      <Text style={styles.subtitle}>you're not alone. we show up.</Text>

      <View style={styles.postCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>R</Text>
        </View>

        <Text style={styles.name}>Raylene ♡</Text>
        <Text style={styles.mood}>Mood: alone 💜</Text>

        <Text style={styles.postText}>
          some nights the thoughts are louder than everything else.
        </Text>

        <View style={styles.reactions}>
          <TouchableOpacity style={styles.reaction}>
            <Text style={styles.reactionText}>💜 46 felt this too</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reaction}>
            <Text style={styles.reactionText}>☁️ 31 sending comfort</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reaction}>
            <Text style={styles.reactionText}>🌙 8 stayed with this</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sekretCard}>
        <Text style={styles.sekretTitle}>☁️ Se'kret says...</Text>
        <Text style={styles.sekretText}>
          You don't have to carry this alone. 💜
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090014',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    color: '#ff4df3',
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#f5b3ff',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
  },
  postCard: {
    backgroundColor: 'rgba(80, 0, 130, 0.45)',
    borderColor: '#ff38df',
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#ff38df',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  mood: {
    color: '#d9a3ff',
    marginTop: 4,
  },
  postText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 32,
    marginVertical: 24,
  },
  reactions: {
    gap: 10,
  },
  reaction: {
    borderColor: '#c026d3',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(255, 0, 200, 0.12)',
  },
  reactionText: {
    color: '#ffd6ff',
    fontWeight: '700',
    textAlign: 'center',
  },
  sekretCard: {
    marginTop: 22,
    borderColor: '#9b2cff',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(40, 0, 80, 0.55)',
  },
  sekretTitle: {
    color: '#ff8df7',
    fontSize: 18,
    fontWeight: '800',
  },
  sekretText: {
    color: '#fff',
    fontSize: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  comfortModeCard: {
  marginBottom: 18,
  padding: 16,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#9b2cff',
  backgroundColor: 'rgba(155, 44, 255, 0.15)',
},

comfortModeTitle: {
  color: '#ff8df7',
  fontSize: 16,
  fontWeight: '900',
  marginBottom: 6,
},

comfortModeText: {
  color: '#fff',
  fontSize: 14,
  lineHeight: 22,
},
});
