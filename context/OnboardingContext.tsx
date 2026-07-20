/**
 * OnboardingContext — Se'kret Bip
 * ============================================================
 * SUPERSEDED — the live onboarding provider is src/context/OnboardingContext.tsx,
 * wired into app/_layout.tsx and used by every app/(onboarding)/*.tsx screen.
 * This earlier draft has zero importers and references an @/services/onboarding
 * API surface (OnboardingState, UserRole, getOnboardingState, etc.) that was
 * never implemented — it's excluded from tsconfig rather than deleted. If this
 * design is revived, reconcile it with src/context/OnboardingContext.tsx first
 * instead of maintaining two competing onboarding contexts.
 *
 * React context that wraps the onboarding service layer.
 * Provides current stage + typed advance/skip actions to all
 * onboarding screens without prop-drilling.
 *
 * Usage:
 *   const { state, advance, markActivated } = useOnboarding();
 *
 * Wrap app/_layout.tsx (or the (onboarding) layout) with
 * <OnboardingProvider> to activate.
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
import { useAuth } from '@/context/AuthContext'; // adjust path if needed
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

// ─── Context Shape ────────────────────────────────────────────

interface OnboardingContextValue {
  /** Full onboarding state row from Supabase. Null while loading. */
  state: OnboardingState | null;
  /** True while any async onboarding operation is in flight. */
  loading: boolean;
  /** True if the user has already completed onboarding. */
  isComplete: boolean;
  /**
   * Advance to the next stage. Automatically routes to the correct
   * next screen via Expo Router after the DB write succeeds.
   */
  advance: (stage: OnboardingStage, extras?: Record<string, unknown>) => Promise<void>;
  /** Mark the user as activated (first core action completed). */
  markActivated: (activationAction: string) => Promise<void>;
  /** Set the parent link code for a teen user. */
  linkParent: (code: string) => Promise<void>;
  /** Complete a parent link (called from parent side). */
  acceptParentLink: (parentUserId: string) => Promise<void>;
  /** Reload state from Supabase (e.g. after background update). */
  refresh: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load or initialize onboarding state when user signs in
  useEffect(() => {
    if (!user?.id) {
      setState(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        let existing = await getOnboardingState(user.id);
        if (!existing) {
          // First sign-in: create the row
          existing = await initOnboardingState(
            user.id,
            // Platform detection — adjust based on your Expo setup
            typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
          );
        }
        setState(existing);
      } catch (err) {
        console.error('[OnboardingContext] Load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const fresh = await getOnboardingState(user.id);
    setState(fresh);
  }, [user?.id]);

  const advance = useCallback(
    async (stage: OnboardingStage, extras: Record<string, unknown> = {}) => {
      if (!user?.id || !state) return;
      setLoading(true);
      try {
        const updated = await advanceStage(user.id, { stage, ...extras });
        setState(updated);
        // Expo Router navigation — import router at call site to avoid
        // circular deps. Consumers can also handle navigation themselves.
      } catch (err) {
        console.error('[OnboardingContext] Advance stage error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, state]
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
    [user?.id]
  );

  const linkParent = useCallback(
    async (code: string) => {
      if (!user?.id) return;
      await setParentLinkCode(user.id, code);
      await refresh();
    },
    [user?.id, refresh]
  );

  const acceptParentLink = useCallback(
    async (parentUserId: string) => {
      if (!user?.id) return;
      await completeParentLink(user.id, parentUserId);
      await refresh();
    },
    [user?.id, refresh]
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
    [state, loading, isComplete, advance, markActivated, linkParent, acceptParentLink, refresh]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  }
  return ctx;
}

// ─── Guard Component ──────────────────────────────────────────

/**
 * Wrap any screen that requires onboarding to be complete.
 * Redirects to the correct onboarding step if not done yet.
 *
 * Usage:
 *   <OnboardingGuard>
 *     <MyProtectedScreen />
 *   </OnboardingGuard>
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { state, loading, isComplete } = useOnboarding();

  // Still loading — render nothing (or a splash screen)
  if (loading) return null;

  // No state = not signed in, handled by AuthGuard upstream
  if (!state) return <>{children}</>;

  if (!isComplete) {
    // Lazy import to avoid circular dep with router
    const { router } = require('expo-router');
    const next = nextScreenForStage(state.stage, state.role as UserRole);
    router.replace(next);
    return null;
  }

  return <>{children}</>;
}
