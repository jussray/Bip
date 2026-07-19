/**
 * delete-account Edge Function
 * Runs a full cascade delete of all user data.
 * Requires a valid user JWT — only deletes the authenticated user's own data.
 * Uses service_role client to bypass RLS for the deletion cascade.
 *
 * Apple App Store requirement: in-app account deletion.
 * Deploy: supabase functions deploy delete-account
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify identity with anon client
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Service role client — bypasses RLS for cascade delete
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // CASCADE DELETE — FK-safe order (children before parents)
    await adminClient.from('messages').delete().eq('user_id', userId);
    await adminClient.from('companion_memories').delete().eq('user_id', userId);
    await adminClient.from('companion_sessions').delete().eq('user_id', userId);
    await adminClient.from('journal_entries').delete().eq('user_id', userId);
    await adminClient.from('user_rewards').delete().eq('user_id', userId);
    await adminClient.from('circle_members').delete().eq('user_id', userId);
    await adminClient.from('circle_invites').delete().eq('invitee_id', userId);
    await adminClient.from('notifications').delete().eq('user_id', userId);
    await adminClient.from('profiles').delete().eq('id', userId);

    // Final step: delete the auth user itself
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) throw deleteAuthError;

    return new Response(
      JSON.stringify({ success: true, message: 'Account and all data deleted.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[delete-account]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
