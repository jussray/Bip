import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const currentUserId = 'me';

const posts = [
  {
    id: '1',
    authorId: 'me',
    name: 'Anonymous Bip',
    mood: 'heavy',
    text: 'some nights the thoughts are louder than everything else.',
    supports: {
      felt: 46,
      comfort: 31,
      proud: 12,
      stay: 8,
    },
  },
  {
    id: '2',
    authorId: 'someoneElse',
    name: 'Anonymous Bip',
    mood: 'trying',
    text: 'i did one small thing today and honestly that counts.',
    supports: {
      felt: 20,
      comfort: 14,
      proud: 9,
      stay: 5,
    },
  },
];

export default function CircleScreen() {
  const [draft, setDraft] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Se&apos;kret Circle ♡</Text>

        <Text style={styles.subtitle}>
          no likes. no ranking. just support.
        </Text>

        <Image
          source={require('../assets/images/9D7577CE-3E29-4D2D-AEC4-E7F9A3C054ED.png')}          style={styles.mockupPreview}
          resizeMode="cover"
        />

        <View style={styles.comfortModeCard}>
          <Text style={styles.comfortModeTitle}>☁️ Comfort Only Mode</Text>
          <Text style={styles.comfortModeText}>
            Replies stay supportive. No advice. No fixing. Just comfort.
          </Text>
        </View>

        <View style={styles.writeCard}>
          <Text style={styles.writeLabel}>drop a soft Bip</Text>

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="what’s sitting on your heart?"
            placeholderTextColor="#9f7bbd"
            multiline
            style={styles.input}
          />

          <TouchableOpacity style={styles.postButton}>
            <Text style={styles.postButtonText}>post anonymous 💜</Text>
          </TouchableOpacity>
        </View>

        {posts.map((post) => {
          const isOwner = post.authorId === currentUserId;

          return (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.topRow}>
                <Image
                  source={require('../assets/images/cloud-headphones.png')}
                  style={styles.cloudAvatar}
                  resizeMode="contain"
                />

                <View>
                  <Text style={styles.name}>{post.name}</Text>
                  <Text style={styles.mood}>mood: {post.mood} 💜</Text>
                </View>
              </View>

              <Text style={styles.postText}>{post.text}</Text>

              <View style={styles.voiceBox}>
                <Text style={styles.voicePlay}>▶</Text>
                <View style={styles.waveLine} />
                <Text style={styles.voiceTime}>0:42</Text>
              </View>

              <View style={styles.reactions}>
                {[
                  '💜 Felt This',
                  '☁️ Comfort',
                  '⭐ Proud',
                  '🌙 Stay With Them',
                ].map((reaction) => (
                  <TouchableOpacity key={reaction} style={styles.reaction}>
                    <Text style={styles.reactionText}>{reaction}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.replyBox}>
                <Text style={styles.replyTitle}>respond gently...</Text>

                <View style={styles.replyActions}>
                  {['💜 Write', '🎙 Voice', '☁️ Comfort', '🌙 Stay'].map(
                    (item) => (
                      <TouchableOpacity key={item} style={styles.replyButton}>
                        <Text style={styles.replyButtonText}>{item}</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              {isOwner && (
                <>
                  <View style={styles.ownerBox}>
                    <Text style={styles.ownerTitle}>only you can see this ✦</Text>

                    <Text style={styles.ownerText}>
                      💜 {post.supports.felt} people understood.
                    </Text>
                    <Text style={styles.ownerText}>
                      ☁️ {post.supports.comfort} people sent comfort.
                    </Text>
                    <Text style={styles.ownerText}>
                      ⭐ {post.supports.proud} people are proud of you.
                    </Text>
                    <Text style={styles.ownerText}>
                      🌙 {post.supports.stay} people stayed with this feeling.
                    </Text>
                  </View>

                  <View style={styles.stayCard}>
                    <Text style={styles.stayTitle}>🌙 Stay With Them</Text>
                    <Text style={styles.stayText}>
                      {post.supports.stay} people are sitting with this feeling
                      tonight.
                    </Text>
                  </View>
                </>
              )}
            </View>
          );
        })}

        <View style={styles.sekretCard}>
          <Text style={styles.sekretTitle}>☁️ Se&apos;kret says...</Text>
          <Text style={styles.sekretText}>
            Everybody can support. Only the person who posted sees the numbers.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090014',
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    color: '#ff4df3',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#f5b3ff',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  mockupPreview: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#9b2cff',
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

  writeCard: {
    backgroundColor: 'rgba(40, 0, 80, 0.65)',
    borderColor: '#9b2cff',
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  writeLabel: {
    color: '#ff8df7',
    fontWeight: '800',
    marginBottom: 10,
  },
  input: {
    minHeight: 90,
    color: '#fff',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  postButton: {
    marginTop: 12,
    backgroundColor: '#c026d3',
    borderRadius: 18,
    padding: 13,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
  },

  postCard: {
    backgroundColor: 'rgba(80, 0, 130, 0.45)',
    borderColor: '#ff38df',
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cloudAvatar: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  mood: {
    color: '#d9a3ff',
    marginTop: 3,
  },
  postText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 30,
    marginVertical: 20,
  },

  voiceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#c026d3',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(255, 0, 200, 0.12)',
    marginBottom: 16,
  },
  voicePlay: {
    color: '#fff',
    fontSize: 18,
    marginRight: 10,
  },
  waveLine: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#ff4df3',
    opacity: 0.8,
  },
  voiceTime: {
    color: '#ffd6ff',
    marginLeft: 10,
    fontWeight: '700',
  },

  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reaction: {
    borderColor: '#c026d3',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 0, 200, 0.12)',
    marginRight: 8,
    marginBottom: 8,
  },
  reactionText: {
    color: '#ffd6ff',
    fontWeight: '700',
  },

  replyBox: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  replyTitle: {
    color: '#ff8df7',
    fontWeight: '800',
    marginBottom: 10,
  },
  replyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  replyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,0,200,0.12)',
    borderWidth: 1,
    borderColor: '#c026d3',
  },
  replyButtonText: {
    color: '#ffd6ff',
    fontWeight: '700',
  },

  ownerBox: {
    marginTop: 16,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  ownerTitle: {
    color: '#ff8df7',
    fontWeight: '900',
    marginBottom: 8,
  },
  ownerText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
  },

  stayCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#9b2cff',
    backgroundColor: 'rgba(155, 44, 255, 0.18)',
  },
  stayTitle: {
    color: '#ff8df7',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  stayText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },

  sekretCard: {
    marginTop: 6,
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
    fontSize: 18,
    lineHeight: 27,
    marginTop: 10,
    textAlign: 'center',
  },
});