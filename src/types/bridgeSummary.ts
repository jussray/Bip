import type {
  BridgeShareSourceRef,
  BridgeSummaryContent,
  RelationshipFailureCode,
  RelationshipRecordStatus,
  RelationshipResult,
} from './relationshipLayer';

export type BridgeShareStatus = Extract<
  RelationshipRecordStatus,
  'pending' | 'processing' | 'ready' | 'viewed' | 'revoked' | 'expired' | 'failed' | 'deleted'
>;

export interface CreateBridgeShareRequestInput {
  parentUserId: string;
  idempotencyKey: string;
  sources: BridgeShareSourceRef[];
  expiresAt?: string | null;
}

export interface CreateBridgeShareRequestValue {
  requestId: string;
  status: 'pending';
}

export type CreateBridgeShareRequestResult = RelationshipResult<CreateBridgeShareRequestValue>;

export interface GenerateBridgeSummaryRequest {
  requestId: string;
  idempotencyKey: string;
}

export interface GenerateBridgeSummaryResponse {
  requestId: string;
  status: 'ready' | 'failed' | 'revoked';
  summary?: BridgeSummaryContent;
  promptVersion?: string;
  model?: string | null;
  usedFallback?: boolean;
  failureCode?: RelationshipFailureCode;
}

export interface BridgeSummaryListItem {
  requestId: string;
  summaryId: string;
  teenUserId: string;
  parentUserId: string;
  status: 'ready' | 'viewed';
  summary: BridgeSummaryContent;
  generatedAt: string;
  viewedAt?: string | null;
  expiresAt?: string | null;
  usedFallback: boolean;
}

export interface RevokeBridgeShareRequestInput {
  requestId: string;
}

export type RevokeBridgeShareRequestResult = RelationshipResult<{ revoked: boolean }>;
