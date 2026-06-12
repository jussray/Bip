import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { JournalEntry } from '../types';

type TeenTab = 'me' | 'oracle' | 'raylene' | 'rylane' | 'cloud';
type ParentTab = 'me' | 'oracle' | 'parentSekret' | 'bridge';
export type PagesTab = TeenTab | ParentTab;

interface TabDefinition {
  id: PagesTab;
  label: string;
  icon: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  prompts?: string[];
  placeholder?: string;
  accent: string;
}

export interface SavePageInput {
  text: string;
  source: PagesTab;
  moodTag?: string;
  entryMode: 'typed' | 'voice';
  locked: boolean;
  imageUri?: string;
}

interface SharedPagesProps {
  side: 'teen' | 'parent';
  entries: JournalEntry[];
  draft: string;
  setDraft: (text: string) => void;
  onSave: (entry: SavePageInput) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
  mood?: string;
}

export interface PagesScreenProps {
  journalText: string;
  setJournalText: (text: string) => void;
  journalEntries: JournalEntry[];
  saveJournalEntry: (override?: SavePageInput) => void;
  mood: string;
  t: Record<string, unknown>;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
  moodHistory?: unknown[];
  voiceNotes?: unknown[];
  streakDays?: number;
  selectedSekret?: string;
}

const TEEN_TABS: TabDefinition[] = [
  { id: 'me', label: 'Me', icon: '◌', title: '', accent: '#c4b5fd' },
  { id: 'oracle', label: 'Oracle', icon: '◇', title: 'Oracle', accent: '#8b7bb8' },
  {
    id: 'raylene', label: 'Raylene', icon: '✦', eyebrow: 'Raylene pulled up',
    title: 'You been a little too quiet. What happened?',
    subtitle: 'Warm, curious, and already paying attention.', accent: '#e9a8d2',
    prompts: [
      'Okay, what happened for real?',
      'What have you been acting unbothered about?',
      'Who or what has been taking up too much space in your head?',
      'What did you need somebody to notice today?',
    ],
    placeholder: 'Tell it how it happened…',
  },
  {
    id: 'rylane', label: 'Rylane', icon: '—', eyebrow: 'Rylane keeps it real',
    title: 'What’s real right now?',
    subtitle: 'No cushion. No lecture.', accent: '#79aaf2',
    prompts: [
      'What are you avoiding?',
      'What did you almost say?',
      'Who showed up? Who didn’t?',
      'Say the part you keep editing.',
    ],
    placeholder: 'Say it straight…',
  },
  {
    id: 'cloud', label: 'Cloud', icon: '☁', eyebrow: 'Cloud can wait',
    title: 'You don’t have to know the words yet.',
    subtitle: 'Start anywhere. Or just sit here a minute.', accent: '#9bd8e5',
    prompts: [
      'A color, a feeling, one unfinished thought…',
      'What feels closest to the surface?',
      'If today had weather, what would it be?',
      'One word is enough.',
    ],
    placeholder: 'Let it take shape slowly…',
  },
];

const PARENT_TABS: TabDefinition[] = [
  { id: 'me', label: 'Me', icon: '◌', title: '', accent: '#d8c9b8' },
  { id: 'oracle', label: 'Oracle', icon: '◇', title: 'Oracle', accent: '#8d877f' },
  {
    id: 'parentSekret', label: 'Parent Se’kret', icon: '✦', eyebrow: 'Parent Se’kret',
    title: 'Let’s get honest before this turns into a whole thing.',
    subtitle: 'Calm, street-smart co-parent energy. No sugarcoating.', accent: '#d7a66d',
    prompts: [
      'What keeps setting you off in this situation?',
      'What are you trying to protect — and what might your teen be hearing instead?',
      'What part is yours to own before you ask them to own theirs?',
      'Are you trying to connect, correct, or control right now?',
    ],
    placeholder: 'Work through your side of it…',
  },
  {
    id: 'bridge', label: 'Bridge', icon: '⌁', eyebrow: 'Conversation prep',
    title: 'Say it here before you say it to them.',
    subtitle: 'This is prep, not monitoring. Their private pages never appear here.', accent: '#83b6a1',
    prompts: [
      'What do you need them to understand when this conversation is over?',
      'What can you say without blame, threat, or a lecture?',
      'What question could you ask — then actually listen to the answer?',
      'What would repair sound like in your own words?',
    ],
    placeholder: 'Draft the conversation…',
  },
];

const TEEN_TAGS = ['heavy', 'mad', 'numb', 'confused', 'hopeful', 'okay'];
const PARENT_TAGS = ['reactive', 'worried', 'hurt', 'stuck', 'open', 'steady'];

function normalizeSource(entry: JournalEntry): PagesTab {
  const source = entry.activeTab || entry.source;
  if (source === 'parentSekret' || source === 'bridge' || source === 'oracle' || source === 'raylene' || source === 'rylane' || source === 'cloud') {
    return source;
  }
  return 'me';
}

function formatEntryMeta(entry: JournalEntry) {
  const mode = entry.entryMode === 'voice' ? 'voice' : 'typed';
  return [entry.date, entry.time, entry.moodTag || entry.mood, mode].filter(Boolean).join(' · ');
}

function PagesWorkspace({ side, entries, draft, setDraft, onSave, setScreen, BottomNav, mood }: SharedPagesProps) {
  const tabs = side === 'teen' ? TEEN_TABS : PARENT_TABS;
  const moodTags = side === 'teen' ? TEEN_TAGS : PARENT_TAGS;
  const [activeTab, setActiveTab] = useState<PagesTab>('me');
  const [tabDrafts, setTabDrafts] = useState<Partial<Record<PagesTab, string>>>({});
  const [selectedTag, setSelectedTag] = useState('');
  const [locked, setLocked] = useState(false);
  const [imageUri, setImageUri] = useState<string>();
  const [promptVisible, setPromptVisible] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);
  const [noPressure, setNoPressure] = useState(false);

  const tab = tabs.find(item => item.id === activeTab) || tabs[0];
  const text = activeTab === 'me' ? draft : tabDrafts[activeTab] || '';
  const tabEntries = useMemo(
    () => entries.filter(entry => normalizeSource(entry) === activeTab),
    [activeTab, entries],
  );
  const visiblePrompt = Boolean(tab.prompts?.length) && promptVisible && !noPressure;

  const changeTab = (next: PagesTab) => {
    setActiveTab(next);
    setSelectedTag('');
    setLocked(false);
    setImageUri(undefined);
    setPromptVisible(true);
    setPromptIndex(0);
  };

  const updateText = (value: string) => {
    if (activeTab === 'me') setDraft(value);
    else setTabDrafts(current => ({ ...current, [activeTab]: value }));
  };

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0]?.uri);
  };

  const save = () => {
    if (!text.trim() && !imageUri) return;
    onSave({
      text: text.trim(), source: activeTab, moodTag: selectedTag || mood,
      entryMode: 'typed', locked, imageUri,
    });
    updateText('');
    setSelectedTag('');
    setLocked(false);
    setImageUri(undefined);
  };

  return (
    <View style={[styles.root, side === 'parent' && styles.parentRoot]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: tab.accent }]}>{side === 'teen' ? 'TEEN PAGES' : 'PARENT PAGES'}</Text>
          <Text style={styles.headerTitle}>Pages</Text>
        </View>
        <View style={styles.privatePill}><Text style={styles.privatePillText}>private by default</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map(item => {
          const active = item.id === activeTab;
          return (
            <TouchableOpacity key={item.id} onPress={() => changeTab(item.id)} style={[styles.tab, active && { borderColor: item.accent, backgroundColor: item.accent + '1f' }]}>
              <Text style={[styles.tabIcon, active && { color: item.accent }]}>{item.icon}</Text>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {activeTab !== 'me' && (
          <View style={styles.intro}>
            {tab.eyebrow ? <Text style={[styles.eyebrow, { color: tab.accent }]}>{tab.eyebrow}</Text> : null}
            <Text style={[styles.title, activeTab === 'oracle' && styles.oracleTitle]}>{tab.title}</Text>
            {tab.subtitle && activeTab !== 'oracle' ? <Text style={styles.subtitle}>{tab.subtitle}</Text> : null}
          </View>
        )}

        {visiblePrompt && tab.prompts ? (
          <View style={[styles.promptCard, { borderColor: tab.accent + '66' }]}>
            <Text style={styles.prompt}>{tab.prompts[promptIndex % tab.prompts.length]}</Text>
            <View style={styles.promptActions}>
              <TouchableOpacity onPress={() => setPromptIndex(index => index + 1)}><Text style={[styles.promptAction, { color: tab.accent }]}>another</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setPromptVisible(false)}><Text style={styles.dismiss}>dismiss</Text></TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={[styles.paper, { borderColor: tab.accent + '70' }]}>
          <TextInput
            autoFocus={activeTab === 'me'}
            multiline
            value={text}
            onChangeText={updateText}
            placeholder={activeTab === 'me' || activeTab === 'oracle' ? undefined : tab.placeholder}
            placeholderTextColor="#736c82"
            style={styles.input}
            textAlignVertical="top"
          />
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.attachment as any} /> : null}
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity onPress={() => setNoPressure(value => !value)} style={[styles.modeChip, noPressure && styles.modeChipActive]}>
            <Text style={styles.modeChipText}>{noPressure ? 'no-pressure mode on' : 'no-pressure mode'}</Text>
          </TouchableOpacity>
          {tab.prompts?.length && !promptVisible && !noPressure ? (
            <TouchableOpacity onPress={() => setPromptVisible(true)}><Text style={[styles.showPrompt, { color: tab.accent }]}>show a prompt</Text></TouchableOpacity>
          ) : null}
        </View>

        {!noPressure ? (
          <View style={styles.tags}>
            {moodTags.map(tag => (
              <TouchableOpacity key={tag} onPress={() => setSelectedTag(current => current === tag ? '' : tag)} style={[styles.tag, selectedTag === tag && { borderColor: tab.accent, backgroundColor: tab.accent + '24' }]}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.toolRow}>
          <TouchableOpacity style={styles.tool} onPress={() => setScreen('voiceBip')}><Text style={styles.toolIcon}>◉</Text><Text style={styles.toolText}>Voice</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tool} onPress={chooseImage}><Text style={styles.toolIcon}>▧</Text><Text style={styles.toolText}>Image</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tool, locked && { borderColor: tab.accent, backgroundColor: tab.accent + '20' }]} onPress={() => setLocked(value => !value)}>
            <Text style={styles.toolIcon}>{locked ? '▣' : '▢'}</Text><Text style={styles.toolText}>Lock</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={!text.trim() && !imageUri} onPress={save} style={[styles.save, { backgroundColor: tab.accent }, !text.trim() && !imageUri && styles.saveDisabled]}>
            <Text style={styles.saveText}>Save page</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.privacyLine}>
          {side === 'teen'
            ? 'Only you can see these pages. Nothing goes to Parent Pages unless you deliberately choose to share elsewhere.'
            : 'For your reflection only. Teen Pages are separate and never shown here.'}
        </Text>

        <View style={styles.savedHeader}>
          <Text style={styles.savedTitle}>Saved · {tab.label}</Text>
          <Text style={styles.savedCount}>{tabEntries.length}</Text>
        </View>
        {tabEntries.length ? tabEntries.map(entry => (
          <View key={String(entry.id)} style={styles.entryCard}>
            <View style={styles.entryTop}>
              <Text style={styles.entryMeta}>{formatEntryMeta(entry)}</Text>
              {entry.locked ? <Text style={styles.locked}>extra private</Text> : null}
            </View>
            {entry.text ? <Text style={styles.entryText}>{entry.text}</Text> : null}
            {entry.imageUri ? <Image source={{ uri: entry.imageUri }} style={styles.savedImage as any} /> : null}
          </View>
        )) : (
          <View style={styles.empty}><Text style={styles.emptyText}>Nothing saved here yet.</Text></View>
        )}
      </ScrollView>
      {BottomNav}
    </View>
  );
}

export function PagesScreen({ journalText, setJournalText, journalEntries, saveJournalEntry, mood, setScreen, BottomNav }: PagesScreenProps) {
  return (
    <PagesWorkspace
      side="teen" entries={journalEntries} draft={journalText} setDraft={setJournalText}
      onSave={entry => saveJournalEntry(entry)} mood={mood} setScreen={setScreen} BottomNav={BottomNav}
    />
  );
}

export { PagesWorkspace };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#100b18', paddingTop: Platform.OS === 'ios' ? 54 : 28 },
  parentRoot: { backgroundColor: '#14110f' },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  headerTitle: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 2 },
  privatePill: { borderWidth: 1, borderColor: '#ffffff22', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  privatePillText: { color: '#aaa2b5', fontSize: 10 },
  tabs: { paddingHorizontal: 16, paddingVertical: 15, gap: 8 },
  tab: { minWidth: 76, height: 58, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff18', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  tabIcon: { color: '#8c8498', fontSize: 15, marginBottom: 3 },
  tabText: { color: '#8c8498', fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  intro: { minHeight: 76, justifyContent: 'flex-end', marginBottom: 14 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 },
  title: { color: '#fff', fontSize: 23, lineHeight: 29, fontWeight: '700' },
  oracleTitle: { color: '#b0a8bb', fontSize: 18, fontWeight: '600' },
  subtitle: { color: '#aaa2b5', fontSize: 13, lineHeight: 19, marginTop: 6 },
  promptCard: { borderWidth: 1, backgroundColor: '#ffffff08', borderRadius: 16, padding: 14, marginBottom: 12 },
  prompt: { color: '#f4eff7', fontSize: 15, lineHeight: 21 },
  promptActions: { flexDirection: 'row', gap: 18, marginTop: 12 },
  promptAction: { fontSize: 11, fontWeight: '800' },
  dismiss: { color: '#827b8d', fontSize: 11 },
  paper: { minHeight: 245, backgroundColor: '#f4efe7', borderRadius: 18, borderWidth: 2, overflow: 'hidden' },
  input: { minHeight: 245, color: '#27212c', fontSize: 17, lineHeight: 29, padding: 18 },
  attachment: { height: 160, margin: 12, marginTop: 0, borderRadius: 12 },
  modeRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeChip: { borderWidth: 1, borderColor: '#ffffff1c', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  modeChipActive: { backgroundColor: '#ffffff12' },
  modeChipText: { color: '#a79eaf', fontSize: 10 },
  showPrompt: { fontSize: 11, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 13 },
  tag: { borderWidth: 1, borderColor: '#ffffff20', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { color: '#beb6c7', fontSize: 11 },
  toolRow: { flexDirection: 'row', gap: 7, alignItems: 'stretch' },
  tool: { width: 57, borderWidth: 1, borderColor: '#ffffff1e', borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  toolIcon: { color: '#d9d1df', fontSize: 15 },
  toolText: { color: '#a9a1b2', fontSize: 9, marginTop: 3 },
  save: { flex: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  saveDisabled: { opacity: 0.3 },
  saveText: { color: '#171018', fontSize: 13, fontWeight: '900' },
  privacyLine: { color: '#77707f', fontSize: 10, lineHeight: 15, marginTop: 13 },
  savedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 10 },
  savedTitle: { color: '#e9e2ed', fontSize: 15, fontWeight: '800' },
  savedCount: { color: '#827a89', fontSize: 11 },
  entryCard: { backgroundColor: '#ffffff08', borderWidth: 1, borderColor: '#ffffff12', borderRadius: 15, padding: 14, marginBottom: 9 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  entryMeta: { color: '#81798b', fontSize: 9, flex: 1 },
  locked: { color: '#d9b8e3', fontSize: 9, fontWeight: '700' },
  entryText: { color: '#e9e2ed', fontSize: 14, lineHeight: 21, marginTop: 8 },
  savedImage: { height: 150, borderRadius: 10, marginTop: 10 },
  empty: { borderWidth: 1, borderColor: '#ffffff12', borderStyle: 'dashed', borderRadius: 15, padding: 22, alignItems: 'center' },
  emptyText: { color: '#746d7c', fontSize: 12 },
});
