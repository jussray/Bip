import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '@/context/AppContext';

const MOODS = [
  { id: 'sad', emoji: '😔', label: 'sad', group: 'heavy' },
  { id: 'anxious', emoji: '😰', label: 'anxious', group: 'heavy' },
  { id: 'frustrated', emoji: '😤', label: 'frustrated', group: 'heavy' },
  { id: 'angry', emoji: '😡', label: 'angry', group: 'heavy' },
  { id: 'lonely', emoji: '🥺', label: 'lonely', group: 'heavy' },
  { id: 'overwhelmed', emoji: '🌪️', label: 'overwhelmed', group: 'heavy' },
  { id: 'hurt', emoji: '💔', label: 'hurt', group: 'heavy' },
  { id: 'disappointed', emoji: '😞', label: 'disappointed', group: 'heavy' },
  { id: 'numb', emoji: '😶', label: 'numb', group: 'heavy' },
  { id: 'alone', emoji: '🫥', label: 'alone', group: 'heavy' },

  { id: 'calm', emoji: '😌', label: 'calm', group: 'steady' },
  { id: 'reflective', emoji: '☁️', label: 'reflective', group: 'steady' },
  { id: 'tired', emoji: '😴', label: 'tired', group: 'steady' },
  { id: 'okay', emoji: '🙂', label: 'okay', group: 'steady' },
  { id: 'content', emoji: '🌱', label: 'content', group: 'steady' },
  { id: 'thoughtful', emoji: '💭', label: 'thoughtful', group: 'steady' },
  { id: 'hopeful', emoji: '🌈', label: 'hopeful', group: 'steady' },
  { id: 'grateful', emoji: '🙏', label: 'grateful', group: 'steady' },
  { id: 'confused', emoji: '😵‍💫', label: 'confused', group: 'steady' },

  { id: 'proud', emoji: '🌟', label: 'proud', group: 'winning' },
  { id: 'motivated', emoji: '🔥', label: 'motivated', group: 'winning' },
  { id: 'confident', emoji: '😎', label: 'confident', group: 'winning' },
  { id: 'excited', emoji: '🥳', label: 'excited', group: 'winning' },
  { id: 'accomplished', emoji: '✨', label: 'accomplished', group: 'winning' },
  { id: 'loved', emoji: '💜', label: 'loved', group: 'winning' },
  { id: 'connected', emoji: '🤝', label: 'connected', group: 'winning' },
  { id: 'celebrating', emoji: '🎉', label: 'celebrating', group: 'winning' },
  { id: 'good', emoji: '😊', label: 'good', group: 'winning' },

  { id: 'crushing', emoji: '😭', label: 'crushing', group: 'fun' },
  { id: 'unbothered', emoji: '💅', label: 'unbothered', group: 'fun' },
  { id: 'curious', emoji: '👀', label: 'curious', group: 'fun' },
  { id: 'relieved', emoji: '😮‍💨', label: 'relieved', group: 'fun' },
  { id: 'feeling-seen', emoji: '🫶', label: 'feeling seen', group: 'fun' },
  { id: 'glow-up', emoji: '📈', label: 'glow up', group: 'fun' },
  { id: 'playful', emoji: '😜', label: 'playful', group: 'fun' },
  { id: 'bored', emoji: '🥱', label: 'bored', group: 'fun' },
] as const;

const GROUPS = ['heavy', 'steady', 'winning', 'fun'] as const;

const GROUP_LABELS: Record<(typeof GROUPS)[number], string> = {
  heavy: 'heavy',
  steady: 'steady',
  winning: 'winning',
  fun: 'fun + real life',
};

export function GlobalMoodButton() {
  const { mood, selectMood } = useAppContext();
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => MOODS.find(item => item.id === mood), [mood]);

  function choose(nextMood: string) {
    selectMood(nextMood);
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Choose mood"
        onPress={() => setOpen(true)}
        style={styles.floatingButton}
        activeOpacity={0.9}
      >
        <Text style={styles.floatingEmoji}>{selected?.emoji ?? '💭'}</Text>
        <Text style={styles.floatingText}>{selected?.label ?? 'Mood'}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.kicker}>MOOD</Text>
                <Text style={styles.title}>How you bippin?</Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sub}>Tap the emotion that feels closest. You can change it anytime.</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.moodContent}>
              {GROUPS.map(group => (
                <View key={group} style={styles.group}>
                  <Text style={styles.groupLabel}>{GROUP_LABELS[group]}</Text>
                  <View style={styles.grid}>
                    {MOODS.filter(item => item.group === group).map(item => {
                      const active = mood === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => choose(item.id)}
                          style={[styles.moodCard, active && styles.moodCardActive]}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.moodEmoji}>{item.emoji}</Text>
                          <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 14,
    zIndex: 1000,
    elevation: 20,
    minHeight: 40,
    maxWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    backgroundColor: 'rgba(18,11,29,0.94)',
  },
  floatingEmoji: { fontSize: 17 },
  floatingText: { color: '#f2ebf5', fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4,2,8,0.66)' },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#130d1d',
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: { color: '#c4b5fd', fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 4 },
  closeButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#d8cfde', fontSize: 23 },
  sub: { color: '#978d9e', fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 16 },
  moodContent: { paddingBottom: 8 },
  group: { marginBottom: 20 },
  groupLabel: { color: '#8f8398', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodCard: { width: '31%', minHeight: 80, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.035)', alignItems: 'center', justifyContent: 'center', padding: 8 },
  moodCardActive: { borderColor: '#c4b5fd', backgroundColor: 'rgba(196,181,253,0.16)' },
  moodEmoji: { fontSize: 26, marginBottom: 5 },
  moodLabel: { color: '#aaa0b1', fontSize: 10, fontWeight: '800', textTransform: 'capitalize', textAlign: 'center' },
  moodLabelActive: { color: '#fff' },
});
