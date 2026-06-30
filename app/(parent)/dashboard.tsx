import React from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useParentDoorbell, type ParentDoorbellEvent } from '@/features/parent/useParentDoorbell';

const COPY: Record<ParentDoorbellEvent['type'], { emoji: string; title: string; body: string }> = {
  mood: { emoji: '💜', title: 'A mood was shared', body: 'Your teen opened a small window into how they are feeling.' },
  thought: { emoji: '💭', title: 'A thought was shared', body: 'There is something they chose to let you know.' },
  need: { emoji: '🤝', title: 'Support was requested', body: 'They may need presence more than answers right now.' },
  win: { emoji: '✨', title: 'A win was shared', body: 'They wanted you included in something good.' },
  other: { emoji: '🔔', title: 'A shared moment arrived', body: 'Your teen chose to send something through Bridge.' },
};

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ParentDashboardScreen() {
  const { events, linkedTeenId, loading, error, refresh } = useParentDoorbell();

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#071410', '#0d1f18', '#08140f']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#a7f3d0" />}
      >
        <Text style={styles.kicker}>PARENT WINDOW</Text>
        <Text style={styles.title}>The doorbell.</Text>
        <Text style={styles.body}>
          Only what your teen chooses to share appears here. No private journals, voice notes, or companion conversations.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusEmoji}>{linkedTeenId ? '🟢' : '🟡'}</Text>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>{linkedTeenId ? 'Connected' : 'Waiting for connection'}</Text>
            <Text style={styles.statusBody}>
              {linkedTeenId ? 'Your parent window is active.' : 'Finish linking with your teen’s private code.'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shared moments</Text>
          <TouchableOpacity onPress={() => router.push('/(parent)/bridge')}>
            <Text style={styles.bridgeLink}>Open Bridge</Text>
          </TouchableOpacity>
        </View>

        {loading && events.length === 0 ? (
          <View style={styles.centerState}><ActivityIndicator color="#a7f3d0" /></View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Couldn’t load the doorbell</Text>
            <Text style={styles.emptyBody}>{error}</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Quiet for now</Text>
            <Text style={styles.emptyBody}>Nothing has been shared through Bridge yet.</Text>
          </View>
        ) : (
          events.map(event => {
            const copy = COPY[event.type];
            return (
              <View key={event.id} style={styles.eventCard}>
                <Text style={styles.eventEmoji}>{copy.emoji}</Text>
                <View style={styles.eventText}>
                  <Text style={styles.eventTitle}>{copy.title}</Text>
                  <Text style={styles.eventBody}>{copy.body}</Text>
                  <Text style={styles.eventMeta}>{timeLabel(event.sentAt)}</Text>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity style={styles.roomButton} onPress={() => router.replace('/(parent)/room')}>
          <Text style={styles.roomButtonText}>Back to my room</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08140f' },
  content: { paddingTop: Platform.OS === 'ios' ? 72 : 48, paddingHorizontal: 22, paddingBottom: 44 },
  kicker: { color: '#6ee7b7', fontSize: 10, fontWeight: '900', letterSpacing: 2.4, marginBottom: 12 },
  title: { color: '#fff', fontSize: 38, lineHeight: 44, fontWeight: '900', marginBottom: 12 },
  body: { color: '#b7c9bf', fontSize: 15, lineHeight: 23, marginBottom: 22 },
  statusCard: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, borderColor: '#ffffff12', backgroundColor: '#ffffff08', padding: 16, marginBottom: 26 },
  statusEmoji: { fontSize: 18, marginRight: 12 },
  statusTextWrap: { flex: 1 },
  statusTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 3 },
  statusBody: { color: '#789082', fontSize: 12, lineHeight: 17 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  bridgeLink: { color: '#a7f3d0', fontSize: 12, fontWeight: '800' },
  centerState: { paddingVertical: 32, alignItems: 'center' },
  emptyCard: { borderRadius: 20, borderWidth: 1, borderColor: '#ffffff10', backgroundColor: '#ffffff06', padding: 20 },
  emptyTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  emptyBody: { color: '#789082', fontSize: 12, lineHeight: 18 },
  eventCard: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, borderColor: '#ffffff10', backgroundColor: '#ffffff08', padding: 16, marginBottom: 12 },
  eventEmoji: { width: 38, fontSize: 21 },
  eventText: { flex: 1 },
  eventTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  eventBody: { color: '#a7b8ad', fontSize: 12, lineHeight: 18, marginBottom: 8 },
  eventMeta: { color: '#607367', fontSize: 10, fontWeight: '700' },
  roomButton: { height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  roomButtonText: { color: '#a7f3d0', fontSize: 14, fontWeight: '800' },
});
