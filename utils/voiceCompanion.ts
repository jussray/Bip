export interface VoiceCompanionStatus {
  ready: boolean;
  mode: 'voice' | 'text' | 'future';
  message: string;
}

export interface VoiceCompanionSession {
  id: string;
  personality: string;
  mood: string;
  status: VoiceCompanionStatus;
}

export function createVoiceCompanionSession(personality: string, mood: string, mode: VoiceCompanionStatus['mode'] = 'voice'): VoiceCompanionSession {
  return {
    id: `voice-${Date.now()}`,
    personality,
    mood,
    status: {
      ready: true,
      mode,
      message: 'Voice-ready architecture is prepared for future conversations.',
    },
  };
}
