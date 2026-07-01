export * from '../../services/voiceBipIntelligence';

import { logRuntimeAuditEvent } from '@/services/runtimeAudit';

export async function reportVoiceRequestFailure(input: {
  companion?: string | null;
  durationMs?: number | null;
  errorCode?: string | null;
  screen?: string | null;
  message?: string | null;
}): Promise<void> {
  await logRuntimeAuditEvent('voice_runtime', {
    event_type: 'voice_bip_request_failed',
    screen: input.screen ?? 'VoiceBip',
    severity: 'error',
    message: input.message ?? 'Voice response request failed.',
    metadata: {
      companion: input.companion ?? null,
      durationMs: input.durationMs ?? null,
      errorCode: input.errorCode ?? null,
    },
  });
}
