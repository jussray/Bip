# Se'kret Bip — Onboarding System

> **ULTRATHINK OODA Reference**
> This document is the single source of truth for the Se'kret Bip onboarding flow.
> Treat it as the living spec for the state machine, activation milestones, and funnel.

---

## Activation Milestones (North Star)

Onboarding is **complete** when a user reaches `activated` stage.
The definition of activation differs by role:

| Role | Activation Action | `activation_action` value |
|---|---|---|
| **Teen** | First mood log saved | `first_mood_log` |
| **Teen** | First journal entry saved | `first_journal_entry` |
| **Teen** | First anonymous post published | `first_post` |
| **Parent** | First bridge message sent to teen | `first_bridge_message` |
| **Parent** | First teen check-in viewed | `first_checkin_viewed` |

Call `markActivated(userId, activationAction)` from the service layer
immediately after confirming the user completed their first action.

---

## State Machine

```
pre_signup
    │  (user signs up via auth)
    ▼
signed_up          → welcome.tsx
    │  (accepts terms)
    ▼
consent_complete   → age.tsx
    │  (confirms age)
    ▼
age_verified       → identity.tsx
    │  (selects role: teen | parent)
    ▼
role_selected
    │
    ├─[teen]──────────────────────────────────────────────────┐
    │                                                          │
    ▼                                                          │
name.tsx                                                       │
    │  (sets name/username)                                    │
    ▼                                                          │
name_set → reflection.tsx                                      │
    │  (completes emotional reflection)                        │
    ▼                                                          │
reflection_complete → parent-link.tsx                         │
    │  (sends parent invite code)                              │
    ▼                                                          │
parent_link_sent → (teen) app tabs ──► first core action      │
    │                                        │                 │
    │                               markActivated()           │
    │                                        │                 │
    ▼                                        ▼                 │
                                         activated             │
                                             │                 │
                                             ▼                 │
                                        steady_state           │
                                                               │
    └─[parent]─────────────────────────────────────────────────┘
         │
         ▼
    parent-welcome.tsx → parent-setup.tsx
         │  (completes parent profile)
         ▼
    parent_setup_done → (parent) app tabs ──► first core action
                                                    │
                                           markActivated()
                                                    │
                                                    ▼
                                                activated
                                                    │
                                                    ▼
                                               steady_state
```

---

## Files

| File | Purpose |
|---|---|
| `app/(onboarding)/_layout.tsx` | Expo Router layout wrapper for the flow |
| `app/(onboarding)/welcome.tsx` | First screen — role selection entry |
| `app/(onboarding)/consent.tsx` | Terms & privacy consent |
| `app/(onboarding)/age.tsx` | Age verification / bucket selection |
| `app/(onboarding)/identity.tsx` | Role selection (teen / parent) |
| `app/(onboarding)/name.tsx` | Username / display name (teen path) |
| `app/(onboarding)/reflection.tsx` | Emotional reflection (teen path) |
| `app/(onboarding)/parent-link.tsx` | Parent invite code (teen path) |
| `app/(onboarding)/parent-splash.tsx` | Parent entry splash |
| `app/(onboarding)/parent-welcome.tsx` | Parent welcome (parent path) |
| `app/(onboarding)/parent-setup.tsx` | Parent profile setup |
| `app/(onboarding)/teen-splash.tsx` | Teen entry splash |
| `services/onboarding.ts` | State machine service — DB reads/writes |
| `context/OnboardingContext.tsx` | React context — exposes state to screens |
| `supabase/migrations/20260718000000_onboarding_state.sql` | DB schema |

---

## OODA Loop Mapping

| OODA Phase | What Happens | Where |
|---|---|---|
| **Observe** | Funnel timing columns (`signup_to_consent_secs`, etc.) capture drop-off data per stage | `user_onboarding_state` table |
| **Orient** | `role`, `age_bucket`, `referral_source`, `device_platform` segment users for adaptive flows | `user_onboarding_state` table |
| **Decide** | `nextScreenForStage()` computes the correct next route given role + stage | `services/onboarding.ts` |
| **Act** | `advanceStage()` writes state, `OnboardingGuard` redirects mid-flow users to correct screen | `services/onboarding.ts` + `context/OnboardingContext.tsx` |

---

## Funnel KPIs (Control Room)

Query `user_onboarding_state` for these metrics:

```sql
-- Activation rate
SELECT
  COUNT(*) FILTER (WHERE stage = 'activated') * 100.0 / COUNT(*) AS activation_rate_pct
FROM user_onboarding_state;

-- Stage drop-off funnel
SELECT stage, COUNT(*) as users_at_stage
FROM user_onboarding_state
GROUP BY stage
ORDER BY MIN(created_at);

-- Avg time-to-activation by role
SELECT role, AVG(identity_to_activated_secs) AS avg_secs_to_activate
FROM user_onboarding_state
WHERE activated_at IS NOT NULL
GROUP BY role;

-- Breakdown by activation action
SELECT activation_action, COUNT(*) as count
FROM user_onboarding_state
WHERE activated_at IS NOT NULL
GROUP BY activation_action;
```

These queries are the Observe inputs for your OODA cycle.
Run them from `founder-control-room` on your dashboard.

---

## Adding a New Onboarding Step

1. Add the new stage value to the `onboarding_stage` enum in the migration.
2. Add it to the `STAGE_ORDER` array in `services/onboarding.ts` at the correct position.
3. Add the new screen to `app/(onboarding)/`.
4. Add the screen route to `nextScreenForStage()` in `services/onboarding.ts`.
5. Call `advance(newStage)` at the end of the new screen's submit handler.
6. Update this doc.

---

## Integration: `useOnboarding()` in a Screen

```tsx
// app/(onboarding)/name.tsx — example integration
import { useOnboarding } from '@/context/OnboardingContext';
import { router } from 'expo-router';

export default function NameScreen() {
  const { advance, loading } = useOnboarding();

  const handleNext = async (displayName: string) => {
    await advance('name_set', { display_name: displayName });
    router.push('/(onboarding)/reflection');
  };

  return (
    // ... your existing UI
  );
}
```

---

## Integration: Triggering Activation

```tsx
// Call this wherever the first core action fires — e.g. MoodLogScreen
import { useOnboarding } from '@/context/OnboardingContext';

const { markActivated, isComplete } = useOnboarding();

// After saving first mood log to DB:
if (!isComplete) {
  await markActivated('first_mood_log');
}
```
