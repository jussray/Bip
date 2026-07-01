import { getSupabase } from '@/utils/supabase';
import { captureRuntimeError } from '@/services/runtimeAudit';

export interface RouteAccessCheck {
  allowed: boolean;
  reason?: string;
}

export async function canAccessFounderDev(userId: string): Promise<RouteAccessCheck> {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error('Supabase not configured');
    await captureRuntimeError('supabase', error, {
      event_type: 'supabase_write_failed',
      screen: 'routeAccess.canAccessFounderDev',
      severity: 'warning',
      metadata: { userId },
    });
    return { allowed: false, reason: 'Missing Supabase client' };
  }

  try {
    const { data, error } = await sb
      .from('app_profiles')
      .select('role,can_view_audits')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    const allowed = Boolean(data?.can_view_audits && ['founder', 'admin', 'developer'].includes(data.role));
    return {
      allowed,
      reason: allowed ? undefined : 'Founder-only route',
    };
  } catch (error) {
    await captureRuntimeError('supabase', error, {
      event_type: 'supabase_write_failed',
      screen: 'routeAccess.canAccessFounderDev',
      severity: 'warning',
      metadata: { userId },
    });
    return { allowed: false, reason: 'Profile lookup failed' };
  }
}
