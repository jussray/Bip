// supabase/functions/account-delete/index.ts
// Se'kret Bip — delayed account deletion processor
//
// This endpoint is intentionally NOT user-callable. It is invoked by a trusted
// admin job after the user's seven-day grace period has expired.
//
// Required secrets:
//   ACCOUNT_DELETION_PROCESS_SECRET
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Deploy with JWT verification disabled because the processor authenticates
// with x-account-deletion-secret instead of a user session.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROCESS_SECRET = Deno.env.get('ACCOUNT_DELETION_PROCESS_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const PRIVATE_BUCKETS = ['avatar-uploads', 'journal-images', 'voice-notes'] as const;

interface DeleteRequestBody {
  requestId?: string;
}

interface DeletionRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'cancelled' | 'processing' | 'completed' | 'failed';
  scheduled_for: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function listFilesRecursively(
  admin: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const files: string[] = [];
  const queue = [prefix];

  while (queue.length > 0) {
    const current = queue.shift()!;
    let offset = 0;

    while (true) {
      const { data, error } = await admin.storage
        .from(bucket)
        .list(current, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });

      if (error) throw new Error(`storage_list_failed:${bucket}`);
      if (!data || data.length === 0) break;

      for (const item of data) {
        const path = current ? `${current}/${item.name}` : item.name;
        if (item.id) files.push(path);
        else queue.push(path);
      }

      if (data.length < 100) break;
      offset += data.length;
    }
  }

  return files;
}

async function removePrivateFiles(admin: SupabaseClient, userId: string): Promise<void> {
  for (const bucket of PRIVATE_BUCKETS) {
    const paths = await listFilesRecursively(admin, bucket, userId);

    for (let index = 0; index < paths.length; index += 100) {
      const batch = paths.slice(index, index + 100);
      const { error } = await admin.storage.from(bucket).remove(batch);
      if (error) throw new Error(`storage_remove_failed:${bucket}`);
    }
  }
}

async function markFailed(
  admin: SupabaseClient,
  requestId: string,
  reason: string,
): Promise<void> {
  await admin
    .from('account_deletion_requests')
    .update({ status: 'failed', failure_reason: reason.slice(0, 500) })
    .eq('id', requestId)
    .eq('status', 'processing');
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const suppliedSecret = req.headers.get('x-account-deletion-secret') ?? '';
  if (!PROCESS_SECRET || suppliedSecret !== PROCESS_SECRET) {
    return json({ error: 'unauthorized' }, 401);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'server_config' }, 500);
  }

  let body: DeleteRequestBody;
  try {
    body = (await req.json()) as DeleteRequestBody;
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const requestId = body.requestId?.trim() ?? '';
  if (!isUuid(requestId)) return json({ error: 'invalid_request_id' }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: deletionRequest, error: lookupError } = await admin
    .from('account_deletion_requests')
    .select('id,user_id,status,scheduled_for')
    .eq('id', requestId)
    .maybeSingle<DeletionRequest>();

  if (lookupError) return json({ error: 'request_lookup_failed' }, 500);
  if (!deletionRequest) return json({ error: 'request_not_found' }, 404);
  if (deletionRequest.status !== 'pending') {
    return json({ error: 'request_not_pending' }, 409);
  }

  const scheduledAt = Date.parse(deletionRequest.scheduled_for);
  if (!Number.isFinite(scheduledAt)) return json({ error: 'invalid_schedule' }, 500);
  if (scheduledAt > Date.now()) return json({ error: 'grace_period_active' }, 409);

  // Claim this request. Only one processor can move it from pending to processing.
  const { data: claimed, error: claimError } = await admin
    .from('account_deletion_requests')
    .update({ status: 'processing', failure_reason: null })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (claimError) return json({ error: 'request_claim_failed' }, 500);
  if (!claimed) return json({ error: 'request_already_claimed' }, 409);

  const userId = deletionRequest.user_id;

  try {
    // Supabase Auth cannot delete a user while they still own Storage objects.
    await removePrivateFiles(admin, userId);

    // These relationships intentionally use SET NULL, so remove the user's own
    // authored/parent link records before deleting the Auth user.
    const { error: replyError } = await admin
      .from('circle_replies')
      .delete()
      .eq('user_id', userId);
    if (replyError) throw new Error('circle_reply_delete_failed');

    const { error: parentLinkError } = await admin
      .from('parent_links')
      .delete()
      .eq('parent_user_id', userId);
    if (parentLinkError) throw new Error('parent_link_delete_failed');

    // The remaining account-owned rows cascade from auth.users.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw new Error(`auth_delete_failed:${deleteError.message}`);

    return json({ ok: true, requestId, deletedUserId: userId });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'account_delete_failed';
    await markFailed(admin, requestId, reason);
    return json({ error: reason }, 500);
  }
});
