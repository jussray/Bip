/**
 * OnboardingContext — Se'kret Bip
 * ============================================================
 * React context that wraps the onboarding service layer.
 * Provides current stage + typed advance/skip actions to all
 * onboarding screens without prop-drilling.
 * ============================================================
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  type OnboardingState,
  type OnboardingStage,
  type UserRole,
  advanceStage,
  getOnboardingState,
  initOnboardingState,
  isOnboardingComplete,
  markActivated as serviceMarkActivated,
  nextScreenForStage,
  setParentLinkCode,
  completeParentLink,
} from '@/services/onboarding';

interface OnboardingContextValue {
  state: OnboardingState | null;
  loading: boolean;
  isComplete: boolean;
  advance: (stage: OnboardingStage, extras?: Record<string, unknown>) => Promise<void>;
  markActivated: (activationAction: string) => Promise<void>;
  linkParent: (code: string) => Promise<void>;
  acceptParentLink: (parentUserId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setState(null);
      setLoading(false);
      return;
    }

    let active = true;
    void (async () => {
      setLoading(true);
      try {
        let existing = await getOnboardingState(user.id);
        if (!existing) {
          existing = await initOnboardingState(
            user.id,
            typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          );
        }
        if (active) setState(existing);
      } catch (err) {
        console.error('[OnboardingContext] Load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const fresh = await getOnboardingState(user.id);
    setState(fresh);
  }, [user?.id]);

  const advance = useCallback(
    async (stage: OnboardingStage, extras: Record<string, unknown> = {}) => {
      if (!user?.id) return;
      setLoading(true);
      try {
        // Do not depend on the React state snapshot. The service reads current
        // database truth, initializes a missing row, and retries safely.
        const updated = await advanceStage(user.id, { stage, ...extras });
        setState(updated);
      } catch (err) {
        console.error('[OnboardingContext] Advance stage error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  const markActivated = useCallback(
    async (activationAction: string) => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const updated = await serviceMarkActivated(user.id, activationAction);
        setState(updated);
      } catch (err) {
        console.error('[OnboardingContext] markActivated error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  const linkParent = useCallback(
    async (code: string) => {
      if (!user?.id) return;
      await setParentLinkCode(user.id, code);
      await refresh();
    },
    [user?.id, refresh],
  );

  const acceptParentLink = useCallback(
    async (parentUserId: string) => {
      if (!user?.id) return;
      await completeParentLink(user.id, parentUserId);
      await refresh();
    },
    [user?.id, refresh],
  );

  const isComplete = useMemo(() => isOnboardingComplete(state), [state]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      loading,
      isComplete,
      advance,
      markActivated,
      linkParent,
      acceptParentLink,
      refresh,
    }),
    [state, loading, isComplete, advance, markActivated, linkParent, acceptParentLink, refresh],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  }
  return ctx;
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { state, loading, isComplete } = useOnboarding();

  if (loading) return null;
  if (!state) return <>{children}</>;

  if (!isComplete) {
    const { router } = require('expo-router');
    const next = nextScreenForStage(state.stage, state.role as UserRole);
    router.replace(next);
    return null;
  }

  return <>{children}</>;
}
