/**
 * Backward-compatible founder-facing adapter for the canonical Se'kret Worker
 * client. New product code should import sekretClient from
 * src/services/backend/sekretClient.
 */

import type {
  CompanionHistoryTurn,
  CompanionId,
  CompanionReplyData,
  CompanionReplyRequest,
  CompanionSurface,
  TranscriptionRequest,
  VoiceSynthesisRequest,
  WorkerErrorCode,
  WorkerResult,
} from '@/contracts/sekretApi';
import {
  sekretClient,
  WORKER_BASE_URL,
  type WorkerHealthResult,
} from '@/services/backend/sekretClient';
import { getCurrentFounderProfile, isFounderProfile } from '@/services/founderAudit';

export type CharacterId = CompanionId;
export type Surface = CompanionSurface;
export type ConversationTurn = CompanionHistoryTurn;
export type SendReplyParams = CompanionReplyRequest;
export type CompanionReply = CompanionReplyData;
export type SendVoiceParams = VoiceSynthesisRequest;
export type TranscribeParams = TranscriptionRequest;
export type { WorkerHealthResult };

export class WorkerError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: WorkerErrorCode,
    message: string,
    public readonly retryable = false,
    public readonly traceId?: string,
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}

function unwrap<T>(result: WorkerResult<T>): T {
  if (result.ok) return result.data;
  throw new WorkerError(
    result.error.status,
    result.error.code,
    result.error.message,
    result.error.retryable,
    result.error.traceId,
  );
}

const WORKER_MANAGER_ROLES = new Set(['admin', 'founder']);

async function assertWorkerManagementAccess(): Promise<void> {
  const profile = await getCurrentFounderProfile();
  const authorized = Boolean(
    profile &&
      isFounderProfile(profile) &&
      profile.can_manage_app &&
      WORKER_MANAGER_ROLES.has(profile.role),
  );

  if (!authorized) {
    throw new WorkerError(
      403,
      'ACCESS_DENIED',
      'Founder or admin management access is required for live Worker operations.',
    );
  }
}

const workerClient = {
  async sendReply(params: SendReplyParams): Promise<CompanionReply> {
    await assertWorkerManagementAccess();
    return unwrap(await sekretClient.sendReply(params));
  },

  async synthesizeVoice(params: SendVoiceParams): Promise<{ audioBase64: string }> {
    await assertWorkerManagementAccess();
    const data = unwrap(await sekretClient.synthesizeVoice(params));
    return { audioBase64: data.audioBase64 };
  },

  async transcribeAudio(params: TranscribeParams): Promise<{ text: string }> {
    await assertWorkerManagementAccess();
    const data = unwrap(await sekretClient.transcribeAudio(params));
    return { text: data.transcript ?? data.text ?? '' };
  },

  ping(): Promise<WorkerHealthResult> {
    return sekretClient.ping();
  },
};

export { workerClient, WORKER_BASE_URL };
