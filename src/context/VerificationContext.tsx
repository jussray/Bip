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
  refreshVerification: () => Promise<void>;
};

const Context = createContext<Value | null>(null);

const states = new Set<VerificationState>(['UNVERIFIED','PENDING_PARENT','PENDING_TRUSTED_ADULT','LIMITED_MODE','VERIFIED_TEEN','EXPIRED','MANUAL_REVIEW','SUSPENDED']);
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

  const refreshVerification = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setSnapshot(INITIAL_VERIFICATION_SNAPSHOT);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const userId = sessionData.session?.user.id;
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
      if (!data) {
        setSnapshot(INITIAL_VERIFICATION_SNAPSHOT);
        setError('Verification record unavailable.');
        return;
      }
      setSnapshot(mapRow(data as Row));
    } catch (error) {
      setSnapshot(INITIAL_VERIFICATION_SNAPSHOT);
      setError(error instanceof Error ? error.message : 'Unable to load verification.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    void refreshVerification();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setSnapshot(INITIAL_VERIFICATION_SNAPSHOT);
        setError(null);
        setLoading(false);
      } else {
        void refreshVerification();
      }
    });
    return () => subscription.unsubscribe();
  }, [refreshVerification]);

  const value = useMemo<Value>(() => ({
    verificationSnapshot,
    verificationState: verificationSnapshot.state,
    isVerificationLoading,
    verificationError,
    refreshVerification,
  }), [verificationSnapshot, isVerificationLoading, verificationError, refreshVerification]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useVerificationContext(): Value {
  const value = useContext(Context);
  if (!value) throw new Error('useVerificationContext must be used inside VerificationProvider');
  return value;
}
