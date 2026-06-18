import type { useAppState } from './useAppState';
import {
  syncMood, syncJournal, syncCirclePost,
  syncParentCirclePost, syncComfortSession,
} from '../utils/sync';
import type { JournalEntry, CirclePost, ParentCirclePost, MoodEntry, ComfortSession } from '../types/index';
import type { OracleProfile, OracleSessionSummary } from '../services/oracleDiscovery';
import type { SavePageInput } from '../types/index';
import type { RoomMemory } from '../types/roomMemory';

type S = ReturnType<typeof useAppState>;
type SyncWrap = (fn: () => Promise<void>) => void;

export function useAppActions(s: S, withSyncWrap: SyncWrap) {
  // ── Room Memory ────────────────────────────────────────────────────────────
  const updateRoomMemory = (patch: Partial<RoomMemory>) => {
    s.setRoomMemory(prev => ({ ...prev, ...patch, visitCount: prev.visitCount + 1 }));
  };

  // ── Activity tracker ──────────────────────────────────────────────────────
  const trackActivity = (type: 'calm' | 'comfort' | 'voice' | 'journal' | 'growth' | 'mood') => {
    updateRoomMemory({ lastVisit: new Date().toISOString() });
    const now = new Date();
    const session: ComfortSession = {
      id: Date.now(), type, mood: s.mood,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    s.setComfortSessions(prev => [session, ...prev].slice(0, 365));
    void withSyncWrap(async () => syncComfortSession(session));
  };

  // ── Mood ──────────────────────────────────────────────────────────────────
  const selectMood = (m: string) => {
    s.setMood(m);
    const entry: MoodEntry = {
      id: Date.now(), mood: m,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };
    s.setMoodHistory(h => [entry, ...h]);
    void withSyncWrap(async () => syncMood(entry));
    trackActivity('mood');
  };

  // ── Journal ────────────────────────────────────────────────────────────────
  const saveJournalEntry = (override?: SavePageInput & { id?: number }) => {
    const textToSave = override?.text ?? s.journalText;
    if (!textToSave.trim() && !override?.imageUri) return;
    const entry: JournalEntry = {
      id: override?.id ?? Date.now(), text: textToSave, mood: s.mood,
      source: override?.source ?? 'me',
      activeTab: override?.source ?? 'me',
      moodTag: override?.moodTag || s.mood,
      entryMode: override?.entryMode || 'typed',
      locked: override?.locked || false,
      imageUri: override?.imageUri,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    s.setJournalEntries(e => [entry, ...e]);
    if (!override) s.setJournalText('');
    void withSyncWrap(async () => syncJournal(entry));
    trackActivity('journal');
  };

  const patchJournalEntry = (entryId: number, reply: string) => {
    if (!reply) return;
    s.setJournalEntries(prev => {
      const next = prev.map(e => e.id === entryId ? { ...e, sekretReply: reply } : e);
      const patched = next.find(e => e.id === entryId);
      if (patched) void withSyncWrap(async () => syncJournal(patched));
      return next;
    });
  };

  const saveParentPageEntry = (input: SavePageInput) => {
    if (!input.text.trim() && !input.imageUri) return;
    const entry: JournalEntry = {
      id: Date.now(), text: input.text,
      mood: s.parentMood || s.mood,
      source: input.source, activeTab: input.source,
      moodTag: input.moodTag || s.parentMood || s.mood,
      entryMode: input.entryMode, locked: input.locked, imageUri: input.imageUri,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    s.setParentPagesEntries(current => [entry, ...current]);
  };

  // ── Circle (Teen) ─────────────────────────────────────────────────────────
  const saveCirclePost = (extra?: Partial<CirclePost>) => {
    const textToSave = extra?.text ?? s.circlePostText;
    if (!textToSave.trim()) return;
    const post: CirclePost = {
      id: Number(Date.now()), text: textToSave,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      bipType: extra?.bipType, mediaKind: extra?.mediaKind,
      circleTag: extra?.circleTag, postMood: extra?.postMood,
      reactions: { felt: 0, comfort: 0, proud: 0, stay: 0, sameHere: 0 },
    };
    s.setCirclePosts(p => [post, ...p]);
    void withSyncWrap(async () => syncCirclePost(post));
  };

  const reactToPost = (id: string | number, type: string) => {
    s.setCirclePosts(posts => posts.map(p =>
      String(p.id) === String(id)
        ? { ...p, reactions: { ...p.reactions, [type]: ((p.reactions as any)[type] || 0) + 1 } }
        : p
    ));
  };

  const saveParentCirclePost = () => {
    if (!s.parentCirclePostText.trim()) return;
    const post: ParentCirclePost = {
      id: Number(Date.now()), text: s.parentCirclePostText,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      reactions: { beenThere: 0, solidarity: 0, reminder: 0, needed: 0, strength: 0 } as ParentCirclePost['reactions'],
    };
    s.setParentCirclePosts(p => [post, ...p]);
    s.setParentCirclePostText('');
    void withSyncWrap(async () => syncParentCirclePost(post));
  };

  const reactToParentPost = (id: string | number, type: string) => {
    s.setParentCirclePosts(posts => posts.map(p =>
      String(p.id) === String(id)
        ? {
            ...p,
            reactions: {
              ...(p.reactions ?? {}),
              [type]: (((p.reactions as Record<string, number> | undefined)?.[type]) ?? 0) + 1,
            },
          } as ParentCirclePost
        : p
    ));
  };

  // ── Oracle ────────────────────────────────────────────────────────────────
  const completeTeenOracleSession = (profile: OracleProfile, session: OracleSessionSummary) => {
    s.setOracleProfile(profile);
    s.setOracleSessions(prev => [session, ...prev]);
  };

  const completeParentOracleSession = (profile: OracleProfile, session: OracleSessionSummary) => {
    s.setParentOracleProfile(profile);
    s.setParentOracleSessions(prev => [session, ...prev]);
  };

  return {
    updateRoomMemory, trackActivity, selectMood,
    saveJournalEntry, patchJournalEntry, saveParentPageEntry,
    saveCirclePost, reactToPost,
    saveParentCirclePost, reactToParentPost,
    completeTeenOracleSession, completeParentOracleSession,
  };
}
