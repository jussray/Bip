import { useMemo, useState } from 'react';
import { createVoiceCompanionSession, type VoiceCompanionSession, type VoiceCompanionStatus } from '../utils/voiceCompanion';
import type { VoiceBipAvatarKey, VoiceBipVoiceIdKey } from '../constants/voiceBip';

interface UseVoiceCompanionArgs {
  avatarKey?: VoiceBipAvatarKey;
  personality?: string;
  voiceIdKey?: VoiceBipVoiceIdKey;
  mood?: string;
}

export function useVoiceCompanion({ avatarKey = 'raylene', personality = 'Raylene', voiceIdKey = 'rayleneVoiceId', mood = 'calm' }: UseVoiceCompanionArgs) {
  const [session, setSession] = useState<VoiceCompanionSession | null>(null);

  const prepareVoiceSession = (mode: VoiceCompanionStatus['mode'] = 'voice') => {
    const nextSession = createVoiceCompanionSession(avatarKey, personality, voiceIdKey, mood, mode);
    setSession(nextSession);
    return nextSession;
  };

  const voiceStatus = useMemo(() => session?.status || {
    ready: true,
    mode: 'future' as const,
    message: 'Voice-ready architecture is prepared for future conversations.',
  }, [session]);

  return {
    session,
    voiceStatus,
    prepareVoiceSession,
  };
}
