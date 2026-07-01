import { getSupabase } from '@/utils/supabase';
import { captureRuntimeError, withRuntimeAudit } from '@/services/runtimeAudit';

export async function invokeWorker<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');

  return withRuntimeAudit(
    'cloudflare_worker',
    {
      event_type: 'worker_request_failed',
      screen: functionName,
      severity: 'error',
      metadata: { functionName },
    },
    async () => {
      const { data, error } = await sb.functions.invoke(functionName, { body });
      if (error) {
        await captureRuntimeError('cloudflare_worker', error, {
          event_type: 'worker_request_failed',
          screen: functionName,
          severity: 'error',
          metadata: { functionName },
        });
        throw error;
      }
      return data as T;
    },
  );
}
