import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const EXPECTED_REPOSITORY = 'jussray/Bip';
const EXPECTED_AUDIENCE = 'sekret-bip-release-health';
const githubJwks = createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'));

type ReleasePayload = {
  commit_sha?: unknown;
  branch?: unknown;
  workflow_run_id?: unknown;
  deployed_at?: unknown;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function verifyGitHubOidc(request: Request): Promise<boolean> {
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, githubJwks, {
      issuer: 'https://token.actions.githubusercontent.com',
      audience: EXPECTED_AUDIENCE,
    });

    return payload.repository === EXPECTED_REPOSITORY
      && payload.ref === 'refs/heads/main'
      && typeof payload.workflow_ref === 'string'
      && payload.workflow_ref.includes('/.github/workflows/deploy-cloudflare.yml@refs/heads/main');
  } catch {
    return false;
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!(await verifyGitHubOidc(request))) return json({ error: 'unauthorized' }, 401);

  let payload: ReleasePayload;
  try {
    payload = await request.json() as ReleasePayload;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const commitSha = typeof payload.commit_sha === 'string' ? payload.commit_sha.trim() : '';
  if (!/^[a-f0-9]{40}$/i.test(commitSha)) {
    return json({ error: 'valid commit_sha is required' }, 400);
  }

  const releaseKey = `cloudflare:${commitSha.slice(0, 12)}`;
  const branch = typeof payload.branch === 'string' && payload.branch.trim() ? payload.branch.trim().slice(0, 120) : 'main';
  const workflowRunId = typeof payload.workflow_run_id === 'string' ? payload.workflow_run_id.trim().slice(0, 120) : null;
  const deployedAt = typeof payload.deployed_at === 'string' && !Number.isNaN(Date.parse(payload.deployed_at))
    ? new Date(payload.deployed_at).toISOString()
    : new Date().toISOString();

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: insertError } = await supabase
    .from('control_room_releases')
    .insert({
      release_key: releaseKey,
      commit_sha: commitSha,
      branch,
      workflow_run_id: workflowRunId,
      deployed_at: deployedAt,
      status: 'observing',
      summary: { provider: 'cloudflare' },
    });

  if (insertError && insertError.code !== '23505') {
    return json({ error: 'release insert failed' }, 500);
  }

  const { data: health, error: healthError } = await supabase.rpc(
    'refresh_control_room_release_health',
    { p_release_key: releaseKey },
  );

  if (healthError) return json({ error: 'release health refresh failed' }, 500);

  return json({ release_key: releaseKey, health });
});
