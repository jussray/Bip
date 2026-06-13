import type { VoiceBipAvatarKey } from '../constants/voiceBip';
import { buildOracleContext, type OracleProfile, type OracleSide } from './oracleDiscovery';
import type {
  AvatarResponseRequest,
  OracleJournalEntry,
  SekretUnderstanding,
  VoiceBipIntelligenceResult,
  VoiceBipTranscript,
} from '../types/voiceIntelligence';

export interface PrepareVoiceBipIntelligenceInput {
  voiceNoteId: number;
  avatarKey: VoiceBipAvatarKey;
  side: OracleSide;
  mood?: string;
  transcriptText?: string | null;
  privateProfile?: OracleProfile;
  oracleJournal?: readonly OracleJournalEntry[];
  now?: Date;
}


export function normalizeOracleJournalEntries(
  value: unknown,
  side: OracleSide = 'teen',
): OracleJournalEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is OracleJournalEntry => Boolean(
    entry
    && typeof entry === 'object'
    && entry.source === 'oracle'
    && entry.activeTab === 'oracle'
    && entry.hidden === true
    && entry.locked === true
    && entry.entryMode === 'oracle-memory'
    && entry.oracle?.side === side
    && Array.isArray(entry.oracle?.evidence)
  ));
}

const cleanTranscript = (value?: string | null): string | null => {
  const clean = value?.trim();
  return clean ? clean : null;
};

const memoryContext = (
  privateProfile: OracleProfile | undefined,
  side: OracleSide,
  oracleJournal: readonly OracleJournalEntry[],
): string[] => [
  ...buildOracleContext(privateProfile, side),
  ...oracleJournal.slice(0, 5).map(entry => entry.text),
].filter(Boolean).slice(0, 8);

function createTranscript(
  input: PrepareVoiceBipIntelligenceInput,
  capturedAt: string,
): VoiceBipTranscript {
  const text = cleanTranscript(input.transcriptText);
  return {
    id: `voice-transcript-${input.voiceNoteId}`,
    voiceNoteId: input.voiceNoteId,
    side: input.side,
    avatarKey: input.avatarKey,
    status: text ? 'available' : 'unavailable',
    text,
    capturedAt,
    provider: 'none',
  };
}

/**
 * Phase 3 intentionally does not infer a memory from silence or recording
 * metadata. A hidden Oracle journal entry is created only after a real
 * transcript exists and a future analyzer supplies a grounded observation.
 */
export function createOracleMemoryEntry(
  transcript: VoiceBipTranscript,
  observation?: Pick<OracleJournalEntry, 'text' | 'mood' | 'oracle'>,
): OracleJournalEntry | null {
  if (transcript.status !== 'available' || !transcript.text || !observation) return null;
  const observedAt = new Date(transcript.capturedAt);
  return {
    id: observedAt.getTime(),
    text: observation.text,
    mood: observation.mood,
    date: observedAt.toLocaleDateString(),
    time: observedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'oracle',
    activeTab: 'oracle',
    hidden: true,
    locked: true,
    entryMode: 'oracle-memory',
    oracle: observation.oracle,
  };
}

function createSekretUnderstanding(
  transcript: VoiceBipTranscript,
  context: string[],
  createdAt: string,
): SekretUnderstanding {
  const hasMemory = context.length > 0;
  return {
    id: `sekret-understanding-${transcript.voiceNoteId}`,
    side: transcript.side,
    transcriptId: transcript.id,
    avatarKey: transcript.avatarKey,
    memoryContext: context,
    emotionalDirection: hasMemory ? 'notice' : 'hold',
    responseBrief: hasMemory
      ? 'Respond as the selected avatar with quiet continuity. Do not mention memory systems, profiles, analysis, or Oracle.'
      : 'Respond as the selected avatar by listening first. Do not analyze, diagnose, teach, or mention Oracle.',
    createdAt,
  };
}

export function prepareVoiceBipIntelligence(
  input: PrepareVoiceBipIntelligenceInput,
): VoiceBipIntelligenceResult {
  const capturedAt = (input.now ?? new Date()).toISOString();
  const transcript = createTranscript(input, capturedAt);
  const context = memoryContext(input.privateProfile, input.side, input.oracleJournal ?? []);
  const sekretUnderstanding = createSekretUnderstanding(transcript, context, capturedAt);
  const transcriptText = transcript.text ?? 'I just recorded a Voice Bip and needed somewhere safe to let it out.';
  const avatarResponse: AvatarResponseRequest = {
    avatarKey: input.avatarKey,
    visibleSpeaker: input.avatarKey,
    transcriptText,
    mood: input.mood,
    sekretUnderstanding,
    privateProfile: input.privateProfile,
    profileSide: input.side,
  };

  return {
    transcript,
    oracleMemory: null,
    sekretUnderstanding,
    avatarResponse,
  };
}
