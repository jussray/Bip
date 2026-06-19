import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '@/context/AppContext';

const MOODS = [
  { id: 'good', emoji: '😊', label: 'good', group: 'up' },
  { id: 'hopeful', emoji: '🌤️', label: 'hopeful', group: 'up' },
  { id: 'proud', emoji: '🥹', label: 'proud', group: 'up' },
  { id: 'calm', emoji: '😌', label: 'calm', group: 'steady' },
  { id: 'okay', emoji: '🙂', label: 'okay', group: 'steady' },
  { id: 'tired', emoji: '😴', label: 'tired', group: 'steady' },
  { id: 'confused', emoji: '😵‍💫', label: 'confused', group: 'mixed' },
  { id: 'overwhelmed', emoji: '😩', label: 'overwhelmed', group: 'mixed' },
  { id: 'numb', emoji: '😶', label: 'numb', group: 'mixed' },
  { id: 'sad', emoji: '😔', label: 'sad', group: 'heavy' },
  { id: 'hurt', emoji: '💔', label: 'hurt', group: 'heavy' },
  { id: 'mad', emoji: '😤', label: 'mad', group: 'heavy' },
  { id: 'anxious', emoji: '😰', label: 'anxious', group: 'heavy' },
  { id: 'alone', emoji: '🫥', label: 'alone', group: 'heavy' },
] as const;

const GROUP_LABELS: Record<string, string> = {
  up: 'feeling up', steady: 'steady-ish', mixed: 'mixed up', heavy: 'heavy',
};

export function GlobalMoodButton() {
  const { mood, selectMood } = useAppContext();
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => MOODS.find(item => item.id === mood), [mood]);
  const groups = ['up', 'steady', 'mixed', 'heavy'];

  function choose(nextMood: string) {
    selectMood(nextMood);
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.floatingButton} activeOpacity={0.9}>
        <Text style={styles.floatingEmoji}>{selected?.emoji ?? '💭'}</Text>
        <Text style={styles.floatingText}>{selected?.label ?? 'Mood'}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.kicker}>MOOD CHECK</Text>
                <Text style={styles.title}>How are you, for real?</Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sub}>Pick one. Change it anytime, from anywhere in Se’kret Bip.</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.moodContent}>
              {groups.map(group => (
                <View key={group} style={styles.group}>
                  <Text style={styles.groupLabel}>{GROUP_LABELS[group]}</Text>
                  <View style={styles.grid}>
                    {MOODS.filter(item => item.group === group).map(item => {
                      const active = mood === item.id;
                      return (
                        <TouchableOpacity key={item.id} onPress={() => choose(item.id)} style={[styles.moodCard, active && styles.moodCardActive]}>
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
  floatingButton: { position: 'absolute', top: 54, right: 14, zIndex: 1000, elevation: 20, minHeight: 38, maxWidth: 118, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(18,11,29,0.92)' },
  floatingEmoji: { fontSize: 15 },
  floatingText: { color: '#f2ebf5', fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4,2,8,0.62)' },
  sheet: { maxHeight: '82%', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: '#130d1d', paddingTop: 20, paddingHorizontal: 18, paddingBottom: 28 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: { color: '#c4b5fd', fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 4 },
  closeButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#d8cfde', fontSize: 23 },
  sub: { color: '#978d9e', fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 16 },
  moodContent: { paddingBottom: 8 },
  group: { marginBottom: 18 },
  groupLabel: { color: '#7f7487', fontSize: 9, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodCard: { width: '31%', minHeight: 78, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.035)', alignItems: 'center', justifyContent: 'center', padding: 8 },
  moodCardActive: { borderColor: '#c4b5fd', backgroundColor: 'rgba(196,181,253,0.16)' },
  moodEmoji: { fontSize: 25, marginBottom: 5 },
  moodLabel: { color: '#aaa0b1', fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  moodLabelActive: { color: '#fff' },
});
