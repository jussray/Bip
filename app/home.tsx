import React from ‘react’;
import { View, Text, TouchableOpacity, StyleSheet } from ‘react-native’;

export default function HomeScreen() {
return (
Se’kret Bip 💜
your space. your voice. always you.
  <View style={styles.card}>
    <Text style={styles.cardTitle}>
      How's your heart right now?
    </Text>
    <Text style={styles.cardText}>
      No pressure. Just check in softly.
    </Text>
    <View style={styles.moodRow}>
      {['😭', '😔', '😐', '🙂', '🥹', '✨'].map((mood) => (
        <TouchableOpacity key={mood} style={styles.mood}>
          <Text style={styles.moodText}>{mood}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
  <View style={styles.actions}>
    <TouchableOpacity style={styles.action}>
      <Text style={styles.actionText}>Write It Out</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.action}>
      <Text style={styles.actionText}>Voice Bip</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.action}>
      <Text style={styles.actionText}>Calm Me</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.action}>
      <Text style={styles.actionText}>Circle</Text>
    </TouchableOpacity>
  </View>
</View>

);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: ‘#090014’,
padding: 24,
justifyContent: ‘center’,
},

logo: {
color: ‘#ff4df3’,
fontSize: 38,
fontWeight: ‘900’,
textAlign: ‘center’,
textShadowColor: ‘#ff00dd’,
textShadowRadius: 18,
},

subtitle: {
color: ‘#f5b3ff’,
textAlign: ‘center’,
marginTop: 8,
marginBottom: 30,
},

card: {
backgroundColor: ‘rgba(80, 0, 130, 0.42)’,
borderColor: ‘#c026d3’,
borderWidth: 1,
borderRadius: 28,
padding: 24,
},

cardTitle: {
color: ‘#fff’,
fontSize: 24,
fontWeight: ‘800’,
textAlign: ‘center’,
},

cardText: {
color: ‘#f3c4ff’,
textAlign: ‘center’,
marginTop: 10,
marginBottom: 20,
},

moodRow: {
flexDirection: ‘row’,
justifyContent: ‘center’,
flexWrap: ‘wrap’,
gap: 10,
},

mood: {
width: 56,
height: 56,
borderRadius: 20,
backgroundColor: ‘rgba(255,255,255,0.08)’,
borderColor: ‘#ff38df’,
borderWidth: 1,
alignItems: ‘center’,
justifyContent: ‘center’,
},

moodText: {
fontSize: 26,
},

actions: {
marginTop: 28,
flexDirection: ‘row’,
flexWrap: ‘wrap’,
justifyContent: ‘center’,
gap: 14,
},

action: {
width: 145,
paddingVertical: 18,
borderRadius: 22,
borderColor: ‘#ff38df’,
borderWidth: 1,
backgroundColor: ‘rgba(255, 0, 200, 0.14)’,
},

actionText: {
color: ‘#ffd6ff’,
fontWeight: ‘800’,
textAlign: ‘center’,
},
});