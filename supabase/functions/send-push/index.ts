import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PushAudience = 'self' | 'linked_parent' | 'linked_teen';

type PushRequest = {
  audience?: PushAudience;
  teenId?: string;
  title?: string;
  body?: string;
  url?: string;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return json({ error: 'A signed-in user is required.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Push service is not configured.' }, 503);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user) return json({ error: 'Invalid or expired session.' }, 401);

  let payload: PushRequest;
  try {
    payload = await request.json() as PushRequest;
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const title = payload.title?.trim().slice(0, 80) || "Se'kret Bip";
  const body = payload.body?.trim().slice(0, 240);
  const url = payload.url?.trim();
  const audience = payload.audience ?? 'self';
  if (!body) return json({ error: 'body is required.' }, 400);
  if (url && !url.startsWith('/')) return json({ error: 'url must be an internal app route.' }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let recipientUserId = user.id;

  if (audience === 'linked_parent') {
    const { data: link, error } = await admin
      .from('parent_links')
      .select('parent_user_id')
      .eq('teen_user_id', user.id)
      .eq('status', 'active')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return json({ error: 'Unable to resolve linked parent.' }, 500);
    if (!link?.parent_user_id) return json({ sent: 0, message: 'No active linked parent found.' });
    recipientUserId = link.parent_user_id;
  }

  if (audience === 'linked_teen') {
    const teenId = payload.teenId?.trim();
    if (!teenId) return json({ error: 'teenId is required.' }, 400);

    const { data: link, error } = await admin
      .from('parent_links')
      .select('teen_user_id')
      .eq('parent_user_id', user.id)
      .eq('teen_user_id', teenId)
      .eq('status', 'active')
      .eq('is_active', true)
      .maybeSingle();

    if (error) return json({ error: 'Unable to verify linked teen.' }, 500);
    if (!link?.teen_user_id) return json({ error: 'No active parent link found.' }, 403);
    recipientUserId = link.teen_user_id;
  }

  const { data: rows, error: tokenError } = await admin
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', recipientUserId)
    .eq('enabled', true);

  if (tokenError) return json({ error: 'Unable to load push tokens.' }, 500);
  const tokens = (rows ?? []).map((row) => row.expo_push_token).filter(Boolean);
  if (tokens.length === 0) return json({ sent: 0, message: 'No enabled devices found.' });

  const messages = tokens.map((to) => ({
    to,
    title,
    body,
    sound: 'default',
    data: url ? { url } : {},
  }));

  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  };
  if (expoAccessToken) headers.Authorization = `Bearer ${expoAccessToken}`;

  const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });
  const result = await expoResponse.json().catch(() => null);

  if (!expoResponse.ok) {
    return json({ error: 'Expo rejected the push request.', details: result }, 502);
  }

  return json({ sent: tokens.length, result });
});
