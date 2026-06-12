// screens/PagesScreen.tsx
// Se'kret Bip — Pages v2 — Tabbed Expression Hub
//
// Five tabs on the left rail: Me · Oracle · Raylene · Rylane · Cloud
// Me  — quiet writing, no avatar, no AI pressure, optional prompt
// Oracle — what should Se'kret understand better? feeds companion memory
// Raylene / Rylane / Cloud — character-voiced journal with matching assets
//
// Saved entries share journalEntries store via optional `source` field.
// Old entries (no source) display in Me tab. Nothing breaks.

import React, { useMemo, useState } from 'react';
import {
  Animated, Alert, Easing, Image, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { IMAGES } from '../constants/theme';
import type { JournalEntry, MoodEntry, VoiceNote } from '../types/bridge';
import { buildOracleInsight, type OracleInsight } from '../services/oracle';

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = 'me' | 'oracle' | 'raylene' | 'rylane' | 'cloud';

export interface PagesScreenProps {
  journalText:       string;
  setJournalText:    (text: string) => void;
  journalEntries:    JournalEntry[];
  saveJournalEntry:  (override?: { text: string; source: string }) => void;
  mood:              string;
  t:                 Record<string, any>;
  setScreen:         (screen: string) => void;
  BottomNav:         React.ReactNode;
  moodHistory?:      MoodEntry[];
  voiceNotes?:       VoiceNote[];
  streakDays?:       number;
  selectedSekret?:   string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; emoji: string; short: string }[] = [
  { id: 'me',      emoji: '📖', short: 'Me'  },
  { id: 'oracle',  emoji: '🔮', short: 'Ora' },
  { id: 'raylene', emoji: '💜', short: 'Ray' },
  { id: 'rylane',  emoji: '⚡', short: 'Ryl' },
  { id: 'cloud',   emoji: '☁️', short: 'Cld' },
];

const MOOD_GLOW: Record<string, string> = {
  Happy:   '#fbbf24',
  Neutral: '#c4b5fd',
  Sad:     '#7dd3fc',
  Angry:   '#f472b6',
  Tired:   '#6d28d9',
};

const MOOD_TAGS = [
  'school', 'family', 'friends', 'pressure',
  'grief', 'lonely', 'trying', 'peace',
];

const CHAR_COLOR: Record<string, string> = {
  raylene: '#c084fc',
  rylane:  '#60a5fa',
  cloud:   '#a5f3fc',
};

// ── Time helpers ───────────────────────────────────────────────────────────

function getTimeOfDay(): 'morning' | 'day' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

// ── Prompts ────────────────────────────────────────────────────────────────

const ME_PROMPTS: Record<string, string[]> = {
  morning: [
    "What's one thing you want to feel by the end of today?",
    "What would make today a good day for you?",
    "What are you carrying into the morning that you didn't put down last night?",
  ],
  day: [
    "What's been living in the back of your head all day?",
    "How are you actually doing right now — be honest.",
    "What's something small that went okay today?",
  ],
  evening: [
    "What's one thing from today you're still holding onto?",
    "What did you have to pretend was fine today?",
    "What do you wish you could say to someone right now?",
  ],
  night: [
    "What's keeping you up that you haven't said out loud yet?",
    "What do you need right now that nobody's offered?",
    "What would you say if you knew nobody was judging you?",
  ],
};

const RAYLENE_PROMPTS = [
  "Okay spill — what actually happened today?",
  "Who got on your nerves? Don't protect them.",
  "What are you pretending you're fine about?",
  "Something went wrong and nobody asked about it, huh.",
  "What do you wish someone understood about you right now?",
];

const RYLANE_PROMPTS = [
  "What's real right now.",
  "What did you almost say but didn't.",
  "Who showed up for you. Who didn't.",
  "What are you not dealing with yet.",
  "Say it straight. No softening needed.",
];

const CLOUD_PROMPTS = [
  "What's still floating from today.",
  "Something quiet that you noticed.",
  "What you carried that no one saw.",
  "What felt different today, even just a little.",
];

// ── Small helpers ──────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ── Decorative sub-components ──────────────────────────────────────────────

function LinedPaper() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 10 }).map((_, i) => (
        <View key={i} style={[s.paperLine, { top: 28 + i * 26 }]} />
      ))}
    </View>
  );
}

function TagRow({
  selectedTag, setSelectedTag, t,
}: {
  selectedTag: string;
  setSelectedTag: (v: string) => void;
  t: Record<string, any>;
}) {
  return (
    <View style={s.tagRow}>
      {MOOD_TAGS.map(tag => {
        const active = selectedTag === tag;
        return (
          <TouchableOpacity
            key={tag}
            onPress={() => setSelectedTag(active ? '' : tag)}
            style={[
              s.tagChip,
              {
                backgroundColor: active ? '#7c3aed' : 'rgba(13,9,20,0.82)',
                borderColor: active ? '#a855f7' : t.accent,
              },
            ]}
          >
            <Text style={[s.tagChipText, { color: active ? '#fff' : t.soft }]}>{tag}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function EntryCard({ entry, t }: { entry: JournalEntry; t: Record<string, any> }) {
  return (
    <View style={[s.entryCard, { borderColor: t.accent }]}>
      <Text style={s.entryDate}>
        {entry.date}{entry.time ? ` · ${entry.time}` : ''}{entry.mood ? ` · ${entry.mood}` : ''}
      </Text>
      <Text style={s.entryText}>"{entry.text}"</Text>
    </View>
  );
}

// ── Me Panel ───────────────────────────────────────────────────────────────

interface MePanelProps {
  journalText:    string;
  setJournalText: (v: string) => void;
  timeOfDay:      string;
  showPrompt:     boolean;
  onTogglePrompt: () => void;
  onNextPrompt:   () => void;
  currentPrompt:  string;
  selectedTag:    string;
  setSelectedTag: (v: string) => void;
  moodGlow:       string;
  t:              Record<string, any>;
  setScreen:      (s: string) => void;
  onSave:         () => void;
  entries:        JournalEntry[];
}

function MePanel({
  journalText, setJournalText,
  showPrompt, onTogglePrompt, onNextPrompt, currentPrompt,
  selectedTag, setSelectedTag,
  moodGlow, t, setScreen, onSave, entries,
}: MePanelProps) {
  const tagGlow = selectedTag ? '#a855f7' : moodGlow;
  const wc = wordCount(journalText);

  return (
    <>
      <View style={s.panelHeader}>
        <Text style={s.panelTitle}>my page.</Text>
        <Text style={s.panelSub}>my rules.</Text>
      </View>

      {/* Optional starter prompt — hidden by default */}
      <TouchableOpacity
        style={[s.starterBtn, { borderColor: moodGlow + '55' }]}
        onPress={onTogglePrompt}
      >
        <Text style={[s.starterBtnText, { color: moodGlow }]}>
          {showPrompt ? 'hide prompt' : 'need a starter?'}
        </Text>
      </TouchableOpacity>

      {showPrompt && (
        <View style={[s.promptCard, { borderColor: moodGlow + '44' }]}>
          <Text style={s.promptCardText}>{currentPrompt}</Text>
          <TouchableOpacity
            style={[s.cycleBtn, { borderColor: moodGlow + '55' }]}
            onPress={onNextPrompt}
          >
            <Text style={[s.cycleBtnText, { color: moodGlow }]}>different prompt</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lined journal paper input */}
      <View style={[s.paperWrap, { borderColor: tagGlow + '88', shadowColor: tagGlow }]}>
        <LinedPaper />
        <TextInput
          style={s.paperInput}
          placeholder="Say it exactly how it felt…"
          placeholderTextColor="#4a3d6b"
          multiline
          value={journalText}
          onChangeText={setJournalText}
        />
      </View>

      <Text style={s.wordCount}>{wc > 0 ? `${wc} word${wc === 1 ? '' : 's'}` : ''}</Text>

      {/* Mood tags — optional */}
      <TagRow selectedTag={selectedTag} setSelectedTag={setSelectedTag} t={t} />

      <Text style={s.privateNote}>🔒 only you can see this.</Text>

      <TouchableOpacity
        style={[s.saveBtn, { backgroundColor: t.accent, shadowColor: moodGlow }]}
        onPress={onSave}
      >
        <Text style={s.saveBtnText}>Drop Bip 💜</Text>
      </TouchableOpacity>

      {/* Media tools row */}
      <View style={s.mediaRow}>
        <TouchableOpacity
          style={[s.mediaTool, { borderColor: t.accent }]}
          onPress={() => setScreen('voiceBip')}
        >
          <Text style={s.mediaEmoji}>🎙️</Text>
          <Text style={[s.mediaLabel, { color: t.soft }]}>Voice</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mediaTool, { borderColor: t.accent }]}
          onPress={() => Alert.alert('Video Bip', 'Coming soon. 📹')}
        >
          <Text style={s.mediaEmoji}>📹</Text>
          <Text style={[s.mediaLabel, { color: t.soft }]}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mediaTool, { borderColor: t.accent }]}
          onPress={() => Alert.alert('Photo Scrap', 'Coming soon. 🖼️')}
        >
          <Text style={s.mediaEmoji}>🖼️</Text>
          <Text style={[s.mediaLabel, { color: t.soft }]}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mediaTool, { borderColor: t.accent }]}
          onPress={() => {/* private toggle — future feature */}}
        >
          <Text style={s.mediaEmoji}>🔒</Text>
          <Text style={[s.mediaLabel, { color: t.soft }]}>Lock</Text>
        </TouchableOpacity>
      </View>

      {/* Saved Me pages */}
      {entries.length > 0 ? (
        <>
          <Text style={s.savedTitle}>Saved Pages</Text>
          {entries.map(e => <EntryCard key={e.id} entry={e} t={t} />)}
        </>
      ) : (
        <View style={[s.emptyCard, { borderColor: t.accent }]}>
          <Text style={s.emptyText}>No pages yet. Your truth has a place here.</Text>
        </View>
      )}
    </>
  );
}

// ── Oracle Panel ───────────────────────────────────────────────────────────

interface OraclePanelProps {
  oracleText:    string;
  setOracleText: (v: string) => void;
  oracleInsight: OracleInsight | null;
  t:             Record<string, any>;
  onSave:        () => void;
  entries:       JournalEntry[];
}

function OraclePanel({ oracleText, setOracleText, oracleInsight, t, onSave, entries }: OraclePanelProps) {
  const wc = wordCount(oracleText);
  return (
    <>
      <View style={s.panelHeader}>
        <Text style={[s.panelTitle, { color: '#c4b5fd' }]}>Oracle</Text>
        <Text style={s.panelSub}>quiet · wise · pattern-aware</Text>
      </View>

      <View style={[s.oracleFrame, { borderColor: 'rgba(196,181,253,0.25)' }]}>
        <Text style={s.oracleQuestion}>What should Se'kret understand better?</Text>

        <View style={[s.paperWrap, { borderColor: '#c4b5fd55', shadowColor: '#c4b5fd' }]}>
          <LinedPaper />
          <TextInput
            style={s.paperInput}
            placeholder="What's beneath the surface right now…"
            placeholderTextColor="#4a3d6b"
            multiline
            value={oracleText}
            onChangeText={setOracleText}
          />
        </View>

        <Text style={s.wordCount}>{wc > 0 ? `${wc} word${wc === 1 ? '' : 's'}` : ''}</Text>
        <Text style={s.privateNote}>🔒 Oracle memory — private.</Text>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: '#3b1d6b', shadowColor: '#c4b5fd' }]}
          onPress={onSave}
        >
          <Text style={s.saveBtnText}>Save to Oracle Memory 🔮</Text>
        </TouchableOpacity>
      </View>

      {/* Pattern insight if history supports it */}
      {oracleInsight && (
        <View style={s.oracleInsightCard}>
          <Text style={s.oracleInsightLabel}>📖 PATTERN NOTICED</Text>
          {oracleInsight.lines.map(line => (
            <Text key={line} style={s.oracleInsightLine}>{line}</Text>
          ))}
        </View>
      )}

      {entries.length > 0 && (
        <>
          <Text style={s.savedTitle}>Oracle Memory</Text>
          {entries.map(e => <EntryCard key={e.id} entry={e} t={t} />)}
        </>
      )}
    </>
  );
}

// ── Character Panel (Raylene · Rylane · Cloud) ─────────────────────────────

interface CharacterPanelProps {
  character:      string;
  promptText:     string;
  onNextPrompt:   () => void;
  totalPrompts:   number;
  text:           string;
  setText:        (v: string) => void;
  selectedTag:    string;
  setSelectedTag: (v: string) => void;
  moodGlow:       string;
  t:              Record<string, any>;
  onSave:         () => void;
  entries:        JournalEntry[];
  label:          string;
  saveLabel:      string;
  placeholder:    string;
  avatar:         any;
  sub:            string;
}

function CharacterPanel({
  character, promptText, onNextPrompt, totalPrompts,
  text, setText, selectedTag, setSelectedTag,
  moodGlow, t, onSave, entries,
  label, saveLabel, placeholder, avatar, sub,
}: CharacterPanelProps) {
  const wc = wordCount(text);
  const accentColor = CHAR_COLOR[character] ?? moodGlow;
  const tagGlow = selectedTag ? '#a855f7' : moodGlow;

  return (
    <>
      {/* Character header — avatar + name */}
      <View style={s.charHeader}>
        <Image source={avatar} style={s.charAvatar} resizeMode="contain" />
        <View style={s.charHeaderText}>
          <Text style={[s.charName, { color: accentColor }]}>{label}</Text>
          <Text style={s.charSub}>{sub}</Text>
        </View>
      </View>

      {/* Prompt card */}
      <View style={[s.charPromptCard, { borderColor: accentColor + '44' }]}>
        <Text style={s.charPromptText}>{promptText}</Text>
        {totalPrompts > 1 && (
          <TouchableOpacity
            style={[s.cycleBtn, { borderColor: accentColor + '55' }]}
            onPress={onNextPrompt}
          >
            <Text style={[s.cycleBtnText, { color: accentColor }]}>different prompt</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lined journal paper */}
      <View style={[s.paperWrap, { borderColor: tagGlow + '88', shadowColor: tagGlow }]}>
        <LinedPaper />
        <TextInput
          style={s.paperInput}
          placeholder={placeholder}
          placeholderTextColor="#4a3d6b"
          multiline
          value={text}
          onChangeText={setText}
        />
      </View>

      <Text style={s.wordCount}>{wc > 0 ? `${wc} word${wc === 1 ? '' : 's'}` : ''}</Text>

      {/* Optional mood tag */}
      <TagRow selectedTag={selectedTag} setSelectedTag={setSelectedTag} t={t} />
      <Text style={s.privateNote}>🔒 only you can see this.</Text>

      <TouchableOpacity
        style={[s.saveBtn, { backgroundColor: t.accent, shadowColor: accentColor }]}
        onPress={onSave}
      >
        <Text style={s.saveBtnText}>{saveLabel}</Text>
      </TouchableOpacity>

      {entries.length > 0 ? (
        <>
          <Text style={s.savedTitle}>Saved {label} Pages</Text>
          {entries.map(e => <EntryCard key={e.id} entry={e} t={t} />)}
        </>
      ) : (
        <View style={[s.emptyCard, { borderColor: accentColor + '44' }]}>
          <Text style={s.emptyText}>No {label.toLowerCase()} pages yet.</Text>
        </View>
      )}
    </>
  );
}

// ── PagesScreen (main export) ─────────────────────────────────────────────

export function PagesScreen({
  journalText, setJournalText,
  journalEntries, saveJournalEntry,
  mood, t, setScreen, BottomNav,
  moodHistory = [], voiceNotes = [], streakDays = 0,
  selectedSekret = 'soft',
}: PagesScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>('me');

  // Per-tab draft text — Me tab uses journalText prop (persisted at root)
  const [oracleText,   setOracleText]   = useState('');
  const [rayleneText,  setRayleneText]  = useState('');
  const [rylaneText,   setRylaneText]   = useState('');
  const [cloudText,    setCloudText]    = useState('');

  // Me tab prompt state
  const [showPrompt,   setShowPrompt]   = useState(false);
  const [mePromptIdx,  setMePromptIdx]  = useState(0);
  const [meTag,        setMeTag]        = useState('');

  // Character tab states
  const [raylenePromptIdx, setRaylenePromptIdx] = useState(0);
  const [rylanePromptIdx,  setRylanePromptIdx]  = useState(0);
  const [cloudPromptIdx,   setCloudPromptIdx]   = useState(0);
  const [rayleneTag, setRayleneTag] = useState('');
  const [rylaneTag,  setRylaneTag]  = useState('');
  const [cloudTag,   setCloudTag]   = useState('');

  const timeOfDay = getTimeOfDay();
  const moodGlow  = MOOD_GLOW[mood] ?? MOOD_GLOW.Neutral;

  const oracleInsight = useMemo(
    () => buildOracleInsight({ journalEntries, moodHistory, voiceNotes, streakDays }),
    [journalEntries, moodHistory, voiceNotes, streakDays],
  );

  // Filter entries by source — old entries (no source) go to Me tab
  const meEntries      = journalEntries.filter(e => !e.source || e.source === 'me');
  const oracleEntries  = journalEntries.filter(e => e.source === 'oracle');
  const rayleneEntries = journalEntries.filter(e => e.source === 'raylene');
  const rylaneEntries  = journalEntries.filter(e => e.source === 'rylane');
  const cloudEntries   = journalEntries.filter(e => e.source === 'cloud');

  // Save handlers
  const saveMe = () => {
    if (!journalText.trim()) return;
    saveJournalEntry(); // reads journalText + clears it in App
  };

  const saveOracle = () => {
    if (!oracleText.trim()) return;
    saveJournalEntry({ text: oracleText, source: 'oracle' });
    setOracleText('');
  };

  const saveRaylene = () => {
    if (!rayleneText.trim()) return;
    saveJournalEntry({ text: rayleneText, source: 'raylene' });
    setRayleneText('');
  };

  const saveRylane = () => {
    if (!rylaneText.trim()) return;
    saveJournalEntry({ text: rylaneText, source: 'rylane' });
    setRylaneText('');
  };

  const saveCloud = () => {
    if (!cloudText.trim()) return;
    saveJournalEntry({ text: cloudText, source: 'cloud' });
    setCloudText('');
  };

  const mePrompts = ME_PROMPTS[timeOfDay] ?? ME_PROMPTS.day;

  return (
    <View style={s.root}>
      {/* Ambient glow blobs — decorative only */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[s.glowBlob, { top: 60, right: 16, backgroundColor: moodGlow + '08' }]} />
        <View style={[s.glowBlob, { bottom: 160, left: 8, width: 70, height: 70, backgroundColor: '#a855f707' }]} />
      </View>

      <View style={s.layout}>
        {/* ── Left tab bar ──────────────────────────────────────── */}
        <View style={s.tabBar}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[s.tabItem, active && s.tabItemActive]}
                activeOpacity={0.7}
              >
                <Text style={s.tabEmoji}>{tab.emoji}</Text>
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.short}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Content panel ─────────────────────────────────────── */}
        <ScrollView
          key={activeTab}
          style={s.contentPanel}
          contentContainerStyle={s.contentScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'me' && (
            <MePanel
              journalText={journalText}
              setJournalText={setJournalText}
              timeOfDay={timeOfDay}
              showPrompt={showPrompt}
              onTogglePrompt={() => setShowPrompt(p => !p)}
              onNextPrompt={() => setMePromptIdx(i => i + 1)}
              currentPrompt={mePrompts[mePromptIdx % mePrompts.length]}
              selectedTag={meTag}
              setSelectedTag={setMeTag}
              moodGlow={moodGlow}
              t={t}
              setScreen={setScreen}
              onSave={saveMe}
              entries={meEntries}
            />
          )}

          {activeTab === 'oracle' && (
            <OraclePanel
              oracleText={oracleText}
              setOracleText={setOracleText}
              oracleInsight={oracleInsight}
              t={t}
              onSave={saveOracle}
              entries={oracleEntries}
            />
          )}

          {activeTab === 'raylene' && (
            <CharacterPanel
              character="raylene"
              promptText={RAYLENE_PROMPTS[raylenePromptIdx % RAYLENE_PROMPTS.length]}
              onNextPrompt={() => setRaylenePromptIdx(i => i + 1)}
              totalPrompts={RAYLENE_PROMPTS.length}
              text={rayleneText}
              setText={setRayleneText}
              selectedTag={rayleneTag}
              setSelectedTag={setRayleneTag}
              moodGlow={moodGlow}
              t={t}
              onSave={saveRaylene}
              entries={rayleneEntries}
              label="Raylene"
              saveLabel="Save Page 💜"
              placeholder="Write with Raylene sitting with you…"
              avatar={IMAGES.rayleneWriting}
              sub="big sis energy"
            />
          )}

          {activeTab === 'rylane' && (
            <CharacterPanel
              character="rylane"
              promptText={RYLANE_PROMPTS[rylanePromptIdx % RYLANE_PROMPTS.length]}
              onNextPrompt={() => setRylanePromptIdx(i => i + 1)}
              totalPrompts={RYLANE_PROMPTS.length}
              text={rylaneText}
              setText={setRylaneText}
              selectedTag={rylaneTag}
              setSelectedTag={setRylaneTag}
              moodGlow={moodGlow}
              t={t}
              onSave={saveRylane}
              entries={rylaneEntries}
              label="Rylane"
              saveLabel="Save Page ⚡"
              placeholder="Write it straight…"
              avatar={IMAGES.rylaneWriting}
              sub="porch-cousin honesty"
            />
          )}

          {activeTab === 'cloud' && (
            <CharacterPanel
              character="cloud"
              promptText={CLOUD_PROMPTS[cloudPromptIdx % CLOUD_PROMPTS.length]}
              onNextPrompt={() => setCloudPromptIdx(i => i + 1)}
              totalPrompts={CLOUD_PROMPTS.length}
              text={cloudText}
              setText={setCloudText}
              selectedTag={cloudTag}
              setSelectedTag={setCloudTag}
              moodGlow={moodGlow}
              t={t}
              onSave={saveCloud}
              entries={cloudEntries}
              label="Cloud"
              saveLabel="Save Page ☁️"
              placeholder="Let it drift onto the page…"
              avatar={IMAGES.cloud}
              sub="quiet reflection"
            />
          )}
        </ScrollView>
      </View>

      {BottomNav}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const WEB = Platform.OS === 'web';

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0914',
  },
  glowBlob: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 90,
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  layout: {
    flex: 1,
    flexDirection: 'row',
    ...(WEB ? { maxWidth: 520, width: '100%', alignSelf: 'center' as const } : {}),
  },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabBar: {
    width: 52,
    backgroundColor: '#070512',
    paddingTop: 16,
    paddingBottom: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(168,85,247,0.12)',
  },
  tabItem: {
    paddingVertical: 14,
    alignItems: 'center',
    width: 52,
  },
  tabItemActive: {
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderRightWidth: 2,
    borderRightColor: '#a855f7',
  },
  tabEmoji: {
    fontSize: 17,
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 9,
    color: '#4a3d6b',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#c4b5fd',
  },

  // ── Content panel ──────────────────────────────────────────────────────────
  contentPanel: {
    flex: 1,
  },
  contentScroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 100,
  },

  // ── Panel header ──────────────────────────────────────────────────────────
  panelHeader: {
    marginBottom: 14,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f5f0ff',
    fontStyle: 'italic',
  },
  panelSub: {
    fontSize: 11,
    color: '#6b5b9a',
    letterSpacing: 0.6,
    marginTop: 2,
  },

  // ── Starter prompt ────────────────────────────────────────────────────────
  starterBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  starterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  promptCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(20,12,35,0.9)',
    marginBottom: 12,
  },
  promptCardText: {
    color: '#f5f0ff',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  cycleBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  cycleBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Lined paper input ────────────────────────────────────────────────────
  paperWrap: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 170,
    overflow: 'hidden',
    backgroundColor: '#0f0b1a',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    marginBottom: 6,
  },
  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(168,85,247,0.07)',
  },
  paperInput: {
    flex: 1,
    minHeight: 170,
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 26,
    color: '#f5f0ff',
    backgroundColor: 'transparent',
    zIndex: 1,
  },

  // ── Word count ─────────────────────────────────────────────────────────────
  wordCount: {
    fontSize: 10,
    color: '#4a3d6b',
    textAlign: 'right',
    marginBottom: 8,
    fontStyle: 'italic',
  },

  // ── Mood tags ──────────────────────────────────────────────────────────────
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 8,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Private note ──────────────────────────────────────────────────────────
  privateNote: {
    fontSize: 10,
    color: '#4a3d6b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },

  // ── Save button ───────────────────────────────────────────────────────────
  saveBtn: {
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ── Media tools row ───────────────────────────────────────────────────────
  mediaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  mediaTool: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(13,9,20,0.82)',
  },
  mediaEmoji: {
    fontSize: 18,
    marginBottom: 3,
  },
  mediaLabel: {
    fontSize: 9,
    fontWeight: '600',
  },

  // ── Saved entries ─────────────────────────────────────────────────────────
  savedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7c6899',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(13,9,20,0.88)',
  },
  entryDate: {
    fontSize: 10,
    color: '#6b5b9a',
    marginBottom: 5,
  },
  entryText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#e9d5ff',
    fontStyle: 'italic',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    backgroundColor: 'rgba(13,9,20,0.75)',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#4a3d6b',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // ── Oracle panel ─────────────────────────────────────────────────────────
  oracleFrame: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(14,10,26,0.92)',
    marginBottom: 14,
  },
  oracleQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c4b5fd',
    marginBottom: 12,
    lineHeight: 20,
  },
  oracleInsightCard: {
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.4)',
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(20,14,34,0.96)',
    marginBottom: 14,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowColor: '#c4b5fd',
    shadowOffset: { width: 0, height: 0 },
  },
  oracleInsightLabel: {
    color: '#c4b5fd',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  oracleInsightLine: {
    color: '#f5f0ff',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 3,
    fontWeight: '600',
  },

  // ── Character panel ───────────────────────────────────────────────────────
  charHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  charAvatar: {
    width: 52,
    height: 72,
    borderRadius: 8,
  },
  charHeaderText: {
    flex: 1,
  },
  charName: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  charSub: {
    fontSize: 11,
    color: '#6b5b9a',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  charPromptCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(14,9,28,0.9)',
    marginBottom: 12,
  },
  charPromptText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#f5f0ff',
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
