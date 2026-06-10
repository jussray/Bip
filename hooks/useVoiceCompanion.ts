import { useMemo, useState } from 'react';
import { createVoiceCompanionSession, type VoiceCompanionSession, type VoiceCompanionStatus } from '../utils/voiceCompanion';

interface UseVoiceCompanionArgs {
  personality?: string;
  mood?: string;
}

export function useVoiceCompanion({ personality = 'Raylene', mood = 'calm' }: UseVoiceCompanionArgs) {
  const [session, setSession] = useState<VoiceCompanionSession | null>(null);

  const prepareVoiceSession = (mode: VoiceCompanionStatus['mode'] = 'voice') => {
    const nextSession = createVoiceCompanionSession(personality, mood, mode);
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
