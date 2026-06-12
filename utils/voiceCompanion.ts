import type { VoiceBipAvatarKey, VoiceBipVoiceIdKey } from '../constants/voiceBip';

export interface VoiceCompanionStatus {
  ready: boolean;
  mode: 'voice' | 'text' | 'future';
  message: string;
}

export interface VoiceCompanionSession {
  id: string;
  avatarKey: VoiceBipAvatarKey;
  personality: string;
  voiceIdKey: VoiceBipVoiceIdKey;
  mood: string;
  status: VoiceCompanionStatus;
}

export function createVoiceCompanionSession(
  avatarKey: VoiceBipAvatarKey,
  personality: string,
  voiceIdKey: VoiceBipVoiceIdKey,
  mood: string,
  mode: VoiceCompanionStatus['mode'] = 'voice',
): VoiceCompanionSession {
  return {
    id: `voice-${Date.now()}`,
    avatarKey,
    personality,
    voiceIdKey,
    mood,
    status: {
      ready: true,
      mode,
      message: 'Voice-ready architecture is prepared for future conversations.',
    },
  };
}
