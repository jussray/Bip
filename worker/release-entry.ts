import worker from './voice-entry';
import {WORKER_RELEASE_SHA} from './release-identity.generated';

interface MinimalExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

type WorkerHandler = typeof worker;
type WorkerEnv = Parameters<WorkerHandler['fetch']>[1];

function withReleaseIdentity(response: Response): Promise<Response> | Response {
  if (!response.ok) return response;
  return response.clone().json()
    .then((data: unknown) => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return response;
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'application/json');
      return new Response(JSON.stringify({
        ...(data as Record<string, unknown>),
        releaseSha: WORKER_RELEASE_SHA,
      }), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    })
    .catch(() => response);
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: MinimalExecutionContext): Promise<Response> {
    const response = await worker.fetch(request, env, ctx);
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/health') {
      return withReleaseIdentity(response);
    }
    return response;
  },

  email: worker.email,
};
