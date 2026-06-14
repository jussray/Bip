// ─────────────────────────────────────────────────────────────────────────────
// Oracle Signal Types — Worker Mirror
// Self-contained mirror of the ConversationSummary type for use inside
// the Cloudflare Worker. Keep in sync with services/oracleSignalDetector.ts.
// ─────────────────────────────────────────────────────────────────────────────

export type SekretName = 'raylene' | 'rylane' | 'cloud' | 'night' | 'oracle';

export interface ConversationMessage {
  role: 'user' | 'sekret';
  text: string;
  timestamp: string;
}

export interface ConversationSummary {
  sekret: SekretName;
  messages: ConversationMessage[];
  mood?: string;
  sessionDurationMs?: number;
}
