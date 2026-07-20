/**
 * Auth middleware for Sekret-Bip
 *
 * Enforces:
 *  - Valid Supabase session (JWT verification via Supabase client)
 *  - Role-based route guards (admin / user / public)
 *  - Automatic token refresh on expiry
 *
 * Usage (in _layout.tsx or route guards):
 *   import { requireAuth, requireRole } from '@/src/middleware/auth';
 */
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true },
});

export type AuthResult =
  | { ok: true; user: User; role: string }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' | 'error'; error?: string };

/**
 * Returns the current session user, refreshing the token if needed.
 * Returns null if no valid session exists.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Enforces that a user is authenticated.
 * Call at the top of any protected screen's useEffect or loader.
 */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };
  const role = (user.app_metadata?.role as string) ?? 'user';
  return { ok: true, user, role };
}

/**
 * Enforces that a user has the required role.
 * @param required - minimum role required ('admin' | 'user')
 */
export async function requireRole(required: 'admin' | 'user'): Promise<AuthResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const roleRank: Record<string, number> = { user: 1, admin: 2 };
  const userRank = roleRank[auth.role] ?? 0;
  const requiredRank = roleRank[required] ?? 99;

  if (userRank < requiredRank) {
    return { ok: false, reason: 'forbidden', error: `Role '${auth.role}' cannot access this resource. Requires '${required}'.` };
  }

  return auth;
}

/**
 * Sign out and clear session.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
