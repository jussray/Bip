import { isRelationshipFeatureAvailable } from '@/constants/relationshipFeatureFlags';
import type {
  BridgeShareSourceRef,
  BridgeSummaryContent,
  RelationshipResult,
} from '@/types/relationshipLayer';
import type {
  BridgeSummaryListItem,
  CreateBridgeShareRequestInput,
  CreateBridgeShareRequestValue,
} from '@/types/bridgeSummary';
import { backendAuthHeaders } from '@/utils/backendAuth';
import { getSupabase } from '@/utils/supabase';

const BASE_URL = ((process.env as Record<string, string | undefined>).EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');

export interface BridgeSharePreviewItem {
  kind: BridgeShareSourceRef['kind'];
  sourceId: string;
  label: string;
}

export interface BridgeSharePreview {
  parentUserId: string;
  items: BridgeSharePreviewItem[];
  notice: string;
}

interface BridgeRequestRow {
  id: string;
  teen_user_id: string;
  parent_user_id: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

interface BridgeSummaryRow {
  id: string;
  request_id: string;
  themes: string[] | null;
  conversation_starters: string[] | null;
  limitations: string;
  generated_at: string;
  used_fallback: boolean;
}

function unavailable<T>(): RelationshipResult<T> {
  return { ok: false, code: 'not_configured', message: 'Bridge Summaries are not available yet.' };
}

export function buildBridgeSharePreview(
  parentUserId: string,
  sources: BridgeShareSourceRef[],
): RelationshipResult<BridgeSharePreview> {
  if (!parentUserId.trim()) {
    return { ok: false, code: 'invalid_input', message: 'Choose a linked parent first.' };
  }
  if (sources.length === 0) {
    return { ok: false, code: 'invalid_input', message: 'Choose at least one item to share.' };
  }
  if (sources.length > 20) {
    return { ok: false, code: 'invalid_input', message: 'Choose no more than 20 items at once.' };
  }

  return {
    ok: true,
    value: {
      parentUserId,
      items: sources.map((source) => ({
        kind: source.kind,
        sourceId: source.sourceId,
        label: source.kind === 'journal'
          ? 'Journal entry'
          : source.kind === 'mood'
            ? 'Mood check-in'
            : source.kind === 'goal'
              ? 'Goal'
              : 'Scrapbook memory',
      })),
      notice: 'Your parent will receive a generated summary, not your full private content. You can revoke access later.',
    },
  };
}

export async function createBridgeShareRequest(
  input: CreateBridgeShareRequestInput,
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
): Promise<RelationshipResult<CreateBridgeShareRequestValue>> {
  if (!isRelationshipFeatureAvailable('bridgeSummaries', audience)) return unavailable();

  const preview = buildBridgeSharePreview(input.parentUserId, input.sources);
  if (!preview.ok) return preview;

  const sb = getSupabase();
  if (!sb) return unavailable();

  try {
    const { data, error } = await sb.rpc('create_bridge_share_request', {
      p_parent_user_id: input.parentUserId,
      p_idempotency_key: input.idempotencyKey,
      p_sources: input.sources.map((source) => ({ kind: source.kind, sourceId: source.sourceId })),
      p_expires_at: input.expiresAt ?? null,
    });

    if (error || typeof data !== 'string') {
      return { ok: false, code: 'server_error', message: error?.message || 'Could not create the Bridge share.' };
    }

    if (BASE_URL) {
      const headers = await backendAuthHeaders();
      const response = await fetch(`${BASE_URL}/api/bridge/summary/generate`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: data, idempotencyKey: input.idempotencyKey }),
      });
      if (!response.ok) {
        return { ok: false, code: 'ai_unavailable', message: 'The share was saved, but the summary is still being prepared.', retryable: true };
      }
    }

    return { ok: true, value: { requestId: data, status: 'pending' } };
  } catch {
    return { ok: false, code: 'server_error', message: 'Could not create the Bridge share.', retryable: true };
  }
}

export async function revokeBridgeShareRequest(
  requestId: string,
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
): Promise<RelationshipResult<{ revoked: boolean }>> {
  if (!isRelationshipFeatureAvailable('bridgeSummaries', audience)) return unavailable();
  const sb = getSupabase();
  if (!sb) return unavailable();

  const { data, error } = await sb.rpc('revoke_bridge_share_request', { p_request_id: requestId });
  if (error) return { ok: false, code: 'server_error', message: error.message || 'Could not revoke the share.' };
  return { ok: true, value: { revoked: data === true } };
}

export async function fetchTeenBridgeShareHistory(
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
): Promise<RelationshipResult<BridgeSummaryListItem[]>> {
  if (!isRelationshipFeatureAvailable('bridgeSummaries', audience)) return unavailable();
  const sb = getSupabase();
  if (!sb) return unavailable();

  const { data: requests, error: requestError } = await sb
    .from('bridge_share_requests')
    .select('id,teen_user_id,parent_user_id,status,created_at,expires_at,revoked_at')
    .order('created_at', { ascending: false });
  if (requestError) return { ok: false, code: 'server_error', message: requestError.message };

  const rows = (requests ?? []) as BridgeRequestRow[];
  if (rows.length === 0) return { ok: true, value: [] };

  const { data: summaries, error: summaryError } = await sb
    .from('bridge_summaries')
    .select('id,request_id,themes,conversation_starters,limitations,generated_at,used_fallback')
    .in('request_id', rows.map((row) => row.id));
  if (summaryError) return { ok: false, code: 'server_error', message: summaryError.message };

  const byRequest = new Map((summaries ?? []).map((row) => {
    const summary = row as BridgeSummaryRow;
    return [summary.request_id, summary] as const;
  }));

  const items: BridgeSummaryListItem[] = [];
  for (const request of rows) {
    const summary = byRequest.get(request.id);
    if (!summary || (request.status !== 'ready' && request.status !== 'viewed')) continue;
    const content: BridgeSummaryContent = {
      themes: summary.themes ?? [],
      conversationStarters: summary.conversation_starters ?? [],
      limitations: summary.limitations,
    };
    items.push({
      requestId: request.id,
      summaryId: summary.id,
      teenUserId: request.teen_user_id,
      parentUserId: request.parent_user_id,
      status: request.status,
      summary: content,
      generatedAt: summary.generated_at,
      expiresAt: request.expires_at,
      usedFallback: summary.used_fallback,
    });
  }

  return { ok: true, value: items };
}
