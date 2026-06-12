import type { VoiceBipAvatarKey, VoiceBipVoiceIdKey } from '../constants/voiceBip';

export interface VoiceCompanionStatus {
  ready: boolean;
  mode: 'voice' | 'text' | 'future';
  message: string;
}

export interface VoiceCompanionSession {
  id: string;
  avatarKey: string;
  personality: string;
  voiceId: string | null;
  avatarKey: VoiceBipAvatarKey;
  personality: string;
  voiceIdKey: VoiceBipVoiceIdKey;
  mood: string;
  status: VoiceCompanionStatus;
}

export function createVoiceCompanionSession(
  avatarKey: string,
  personality: string,
  mood: string,
  mode: VoiceCompanionStatus['mode'] = 'voice',
  voiceId: string | null = null,
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
    voiceId,
    voiceIdKey,
    mood,
    status: {
      ready: true,
      mode,
      message: 'Voice-ready architecture is prepared for future conversations.',
    },
  };
}
