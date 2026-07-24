/**
 * Canonical onboarding context.
 *
 * `advance()` waits for the current user's onboarding write attempt to finish,
 * so screens that already use `await advance(...)` do not race navigation
 * against the database. Onboarding progress is telemetry/routing state rather
 * than authorization, so failures are reported without trapping the user.
 */
import React, { createContext, useCallback, useContext } from 'react';
import { advanceStage, type OnboardingStage } from '@/services/onboarding';
import { getSupabase } from '@/utils/supabase';

interface OnboardingContextValue {
  advance: (
    stage: OnboardingStage,
    payload?: Record<string, unknown>,
  ) => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  advance: async () => undefined,
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const advance = useCallback(async (
    stage: OnboardingStage,
    payload?: Record<string, unknown>,
  ): Promise<void> => {
    const client = getSupabase();
    if (!client) return;

    try {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      if (!data.user) return;

      await advanceStage(data.user.id, stage, payload);
    } catch (cause) {
      console.warn(
        `[OnboardingContext] Could not record stage "${stage}":`,
        cause instanceof Error ? cause.message : 'unknown error',
      );
    }
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
