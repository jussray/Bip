import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ParentLinkState, VerificationSnapshot, VerificationState } from '@/types/verification';
import { INITIAL_VERIFICATION_SNAPSHOT } from '@/services/verificationState';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';

type Row = {
  verification_state: string;
  parent_link_state: string;
  verification_reason: string | null;
  verification_updated_at: string;
};

type Value = {
  verificationSnapshot: VerificationSnapshot;
  verificationState: VerificationState;
  isVerificationLoading: boolean;
  verificationError: string | null;
  isAuthResolved: boolean;
  isAuthenticated: boolean;
  refreshVerification: () => Promise<void>;
};

const Context = createContext<Value | null>(null);

const states = new Set<VerificationState>([
  'UNVERIFIED',
  'PENDING_PARENT',
  'PENDING_TRUSTED_ADULT',
  'LIMITED_MODE',
  'VERIFIED_TEEN',
  'EXPIRED',
  'MANUAL_REVIEW',
  'SUSPENDED',
  'VERIFIED_GUARDIAN',
  'PENDING_GUARDIAN_REVIEW',
  'GUARDIAN_REJECTED',
  'GUARDIAN_SUSPENDED',
]);
const linkStates = new Set<ParentLinkState>(['none','pending','active','expired','revoked','declined']);

function mapRow(row: Row): VerificationSnapshot {
  return {
    state: states.has(row.verification_state as VerificationState)
      ? row.verification_state as VerificationState
      : 'UNVERIFIED',
    parentLinkState: linkStates.has(row.parent_link_state as ParentLinkState)
      ? row.parent_link_state as ParentLinkState
      : 'none',
    updatedAt: row.verification_updated_at,
    reason: row.verification_reason ?? undefined,
  };
}

export function VerificationProvider({ children }: { children: ReactNode }) {
  const [verificationSnapshot, setSnapshot] = useState<VerificationSnapshot>(INITIAL_VERIFICATION_SNAPSHOT);
  const [isVerificationLoading, setLoading] = useState(isSupabaseConfigured);
  const [verificationError, setError] = useState<string | null>(null);
  const [isAuthResolved, setAuthResolved] = useState(!isSupabaseConfigured);
  const [isAuthenticated, setAuthenticated] = useState(false);

  const refreshVerification = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setSnapshot(INITIAL_VERIFICATION_SNAPSHOT);
      setAuthenticated(false);
      setAuthResolved(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const session = sessionData.session;
      const permanentSession = Boolean(session && !session.user.is_anonymous);
      const userId = permanentSession ? session?.user.id : undefined;
      setAuthenticated(permanentSession);
      setAuthResolved(true);

      if (!userId) {
        setSnapshot(INITIAL_VERIFICATION_SNAPSHOT);
        return;
      }

      const { data, error } = await supabase
        .from('account_verification')
        .select('verification_state,parent_link_state,verification_reason,verification_updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;

      // Missing or malformed server data must fail closed. The local default is
      // only a locked fallback and is never treated as proof of verification.
      if (!data) {
        setSnapshot(INITIAL_VERIFICATION_SNAPSHOT);
        setError('Verification record unavailable.');
        return;
      }
      setSnapshot(mapRow(data as Row));
    } catch (error) {
      setAuthenticated(false);
      setAuthResolved(true);
      setSnapshot(INITIAL_VERIFICATION_SNAPSHOT);
      setError(error instanceof Error ? error.message : 'Unable to load verification.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setAuthResolved(true);
      setLoading(false);
      return;
    }

    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const removeVerificationChannel = () => {
      if (channel) void supabase.removeChannel(channel);
      channel = null;
    };

    const subscribeToVerificationSignal = (userId: string) => {
      removeVerificationChannel();
      channel = supabase
        .channel(`account-verification-context-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'account_verification',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void refreshVerification();
          },
        )
        .subscribe();
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      if (user && !user.is_anonymous) subscribeToVerificationSignal(user.id);
    });
    void refreshVerification();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      const permanentSession = Boolean(session && !session.user.is_anonymous);
      setAuthResolved(true);
      setAuthenticated(permanentSession);
      removeVerificationChannel();

      if (!permanentSession) {
        setSnapshot(INITIAL_VERIFICATION_SNAPSHOT);
        setError(null);
        setLoading(false);
        return;
      }

      if (user) subscribeToVerificationSignal(user.id);
      void refreshVerification();
    });

    return () => {
      active = false;
      removeVerificationChannel();
      subscription.unsubscribe();
    };
  }, [refreshVerification]);

  const value = useMemo<Value>(() => ({
    verificationSnapshot,
    verificationState: verificationSnapshot.state,
    isVerificationLoading,
    verificationError,
    isAuthResolved,
    isAuthenticated,
    refreshVerification,
  }), [
    verificationSnapshot,
    isVerificationLoading,
    verificationError,
    isAuthResolved,
    isAuthenticated,
    refreshVerification,
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useVerificationContext(): Value {
  const value = useContext(Context);
  if (!value) throw new Error('useVerificationContext must be used inside VerificationProvider');
  return value;
}
