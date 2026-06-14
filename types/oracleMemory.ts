// ─────────────────────────────────────────────────────────────────────────────
// Oracle Memory Types — Phase 1A
// HumanUnderstandingProfile: what Oracle quietly learns about a person.
// SelfTrustEvidence: observed moments that reveal self-trust developing.
// SekretUnderstandingBrief: per-character filtered view of the profile.
// ─────────────────────────────────────────────────────────────────────────────

export type ProfileOwner = 'teen' | 'parent';

// ── Self-Trust Evidence ───────────────────────────────────────────────────────

export type SelfTrustEvidenceType =
  | 'named-a-feeling'          // Teen accurately named an emotion
  | 'set-a-boundary'           // Teen described setting or wanting to set a boundary
  | 'asked-for-help'           // Teen reached out instead of isolating
  | 'completed-goal'           // Teen reported finishing something they set out to do
  | 'self-corrected'           // Teen caught themselves and changed course
  | 'reframed-setback'         // Teen found meaning or learning in a hard moment
  | 'expressed-opinion'        // Teen stated what they actually think/want
  | 'resisted-pressure'        // Teen described not going along with something
  | 'showed-self-compassion'   // Teen was kind to themselves after a mistake
  | 'initiated-change'         // Teen started something without being pushed
  | 'identified-pattern'       // Teen noticed a recurring pattern in their own behavior
  | 'named-a-strength'         // Teen acknowledged something they're genuinely good at
  | 'sat-with-discomfort';     // Teen stayed present with something hard instead of escaping

export interface SelfTrustEvidence {
  id: string;                       // uuid
  type: SelfTrustEvidenceType;
  observedAt: string;               // ISO timestamp
  sekretWitness: SekretName;        // which Se'kret observed it
  note: string;                     // brief natural-language description (1 sentence)
}

// ── Core profile ─────────────────────────────────────────────────────────────

export type SekretName = 'raylene' | 'rylane' | 'cloud' | 'night' | 'oracle';

export interface HumanUnderstanding {
  dimension: HumanUnderstandingDimension;
  theory: string;           // What Oracle believes about this person right now
  confidence: 'forming' | 'developing' | 'established';
  updatedAt: string;        // ISO timestamp
  sekretSource: SekretName; // Which Se'kret surfaced this understanding
}

export type HumanUnderstandingDimension =
  | 'emotional-pattern'     // How they typically process emotion
  | 'communication-style'   // How they express themselves
  | 'motivation-source'     // What gets them moving
  | 'avoidance-pattern'     // What they tend to dodge
  | 'strength-signature'    // What they reliably do well
  | 'fear-landscape'        // What they're afraid of (not clinical)
  | 'identity-anchor'       // What they build their sense of self around
  | 'resilience-indicator'  // How they recover
  | 'support-system'        // Who/what they lean on
  | 'growth-observation';   // Something Oracle has watched them do better over time

export interface HumanUnderstandingProfile {
  id: string;                              // uuid — matches Supabase row
  owner: ProfileOwner;
  userId: string;                          // Supabase auth.users.id
  understandings: HumanUnderstanding[];
  selfTrustEvidence: SelfTrustEvidence[];
  conversationCount: number;               // total sessions Oracle has observed
  lastActiveAt: string;                    // ISO timestamp
  createdAt: string;                       // ISO timestamp
  schemaVersion: 2;
}

// ── Per-Se'kret brief ─────────────────────────────────────────────────────────

export interface SekretUnderstandingBrief {
  sekret: SekretName;
  hasHistory: boolean;          // false until conversationCount >= 3 OR evidence >= 1
  contextLines: string[];       // max 6, ready to inject into system prompt
  selfTrustEvidenceCount: number;
  recentEvidence: SelfTrustEvidence[]; // last 3
  dominantDimensions: HumanUnderstandingDimension[];
}
