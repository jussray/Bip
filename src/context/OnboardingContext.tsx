/**
 * OnboardingContext
 *
 * Provides `useOnboarding()` to all onboarding screens.
 * The `advance(event, payload)` method records a stage transition
 * for the current Supabase user (fire-and-forget — never blocks UI).
 */
import React, { createContext, useContext, useCallback } from 'react';
import { advanceStage, type OnboardingStage } from '@/services/onboarding';
import { getSupabase } from '@/utils/supabase';

interface OnboardingContextValue {
  /** Fire-and-forget: advance the onboarding state machine for the current user. */
  advance: (event: OnboardingStage, payload?: Record<string, unknown>) => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  advance: () => undefined,
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const advance = useCallback((event: OnboardingStage, payload?: Record<string, unknown>) => {
    getSupabase()
      ?.auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          advanceStage(data.user.id, event, payload).catch(() => null);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <OnboardingContext.Provider value={{ advance }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  return useContext(OnboardingContext);
}
