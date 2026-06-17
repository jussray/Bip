import { useCallback } from 'react';
import type { VoiceBipAvatarKey } from '../constants/voiceBip';
import type { OracleProfile, OracleSide } from '../services/oracleDiscovery';
import { prepareVoiceBipIntelligence } from '../services/voiceBipIntelligence';
import type { OracleJournalEntry } from '../types/voiceIntelligence';

interface UseVoiceBipIntelligenceArgs {
  avatarKey: VoiceBipAvatarKey;
  side: OracleSide;
  mood?: string;
  privateProfile?: OracleProfile;
  oracleJournalEntries?: readonly OracleJournalEntry[];
  onStoreOracleMemory?: (entry: OracleJournalEntry) => void;
}

export function useVoiceBipIntelligence({
  avatarKey,
  side,
  mood,
  privateProfile,
  oracleJournalEntries = [],
  onStoreOracleMemory,
}: UseVoiceBipIntelligenceArgs) {
  const prepareIntelligence = useCallback((voiceNoteId: number, transcriptText?: string | null) => {
    const result = prepareVoiceBipIntelligence({
      voiceNoteId,
      avatarKey,
      side,
      mood,
      transcriptText,
      privateProfile,
      oracleJournal: oracleJournalEntries,
    });
    if (result.oracleMemory) onStoreOracleMemory?.(result.oracleMemory);
    return result;
  }, [avatarKey, mood, onStoreOracleMemory, oracleJournalEntries, privateProfile, side]);

  return { prepareIntelligence };
}
