/**
 * src/features/control-room/workspace/types.ts
 *
 * Canonical types for the Replit-style Founder Workspace.
 * Every thread, task, artifact, and approval event is typed here.
 * No runtime logic — pure type declarations only.
 */

// ─── Thread lifecycle ─────────────────────────────────────────────────────────

export type ThreadStatus =
  | 'draft'
  | 'planned'
  | 'running'
  | 'review'
  | 'approved'
  | 'applied'
  | 'blocked'
  | 'failed'
  | 'rolled_back';

export type BlockReason =
  | 'runner_startup_failure'
  | 'workflow_no_jobs'
  | 'workflow_step_failure'
  | 'founder_gate_pending'
  | 'dependency_not_merged'
  | 'ci_evidence_incomplete'
  | 'supabase_split_brain'
  | 'manual_hold';

export type ThreadDomain =
  | 'engineering'
  | 'growth'
  | 'ops'
  | 'support'
  | 'finance'
  | 'admin'
  | 'infra';

export type ArtifactKind =
  | 'pull_request'
  | 'sql_migration'
  | 'deploy'
  | 'email_draft'
  | 'spec'
  | 'report'
  | 'ci_log';

// ─── Core models ──────────────────────────────────────────────────────────────

export interface ThreadArtifact {
  id: string;
  kind: ArtifactKind;
  label: string;
  url?: string;
  previewText?: string;
  createdAt: number;
}

export interface ThreadDependency {
  prNumber: number;
  title: string;
  status: 'open' | 'merged' | 'closed' | 'draft';
  url: string;
}

export interface ApprovalEvent {
  id: string;
  actorLabel: string;  // e.g. 'founder', 'chief-of-staff'
  decision: 'approved' | 'rejected' | 'held';
  note?: string;
  ts: number;
}

export interface Thread {
  id: string;
  title: string;
  brief: string;
  domain: ThreadDomain;
  status: ThreadStatus;
  blockReason?: BlockReason;
  blockDetail?: string;
  artifacts: ThreadArtifact[];
  dependencies: ThreadDependency[];
  approvals: ApprovalEvent[];
  createdAt: number;
  updatedAt: number;
  // Risk metadata
  riskLevel: 'low' | 'medium' | 'high';
  blastRadius?: string;   // e.g. 'DB migration — all users'
  rollbackNote?: string;
}

// ─── Board columns ────────────────────────────────────────────────────────────

export const BOARD_COLUMNS: { status: ThreadStatus; label: string; emoji: string }[] = [
  { status: 'draft',    label: 'Draft',    emoji: '📝' },
  { status: 'planned',  label: 'Planned',  emoji: '🗺️' },
  { status: 'running',  label: 'Running',  emoji: '⚡' },
  { status: 'review',   label: 'Review',   emoji: '🔍' },
  { status: 'blocked',  label: 'Blocked',  emoji: '🚧' },
  { status: 'approved', label: 'Approved', emoji: '✅' },
  { status: 'applied',  label: 'Applied',  emoji: '🚀' },
];

// ─── Seed data (demo threads matching real repo state) ────────────────────────

export const SEED_THREADS: Thread[] = [
  {
    id: 'thread-ci-runner',
    title: 'CI Runner Startup Failure',
    brief: 'GitHub Actions workflows producing steps:null — jobs never start. Affects all 5 repos.',
    domain: 'infra',
    status: 'blocked',
    blockReason: 'runner_startup_failure',
    blockDetail: 'steps: null across ci.yml, quality-gate.yml. No logs_url. Suspected: runner label mismatch or private-repo billing limit.',
    artifacts: [],
    dependencies: [],
    approvals: [],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 900000,
    riskLevel: 'high',
    blastRadius: 'All CI-gated PRs blocked',
    rollbackNote: 'N/A — observation only until runner confirmed healthy',
  },
  {
    id: 'thread-pr-482',
    title: 'PR #482 — Control Room event inbox',
    brief: 'Event-driven inbox → durable queue → GitHub reconciliation controller.',
    domain: 'engineering',
    status: 'review',
    artifacts: [
      { id: 'a1', kind: 'pull_request', label: 'PR #482', url: 'https://github.com/jussray/Sekret-Bip/pull/482', createdAt: Date.now() - 7200000 },
    ],
    dependencies: [
      { prNumber: 481, title: 'PR #481 — Postgres event schema', status: 'draft', url: 'https://github.com/jussray/Sekret-Bip/pull/481' },
    ],
    approvals: [],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    riskLevel: 'medium',
    blastRadius: 'Control Room backend only',
    rollbackNote: 'Revert migration via Supabase shadow environment',
  },
  {
    id: 'thread-pr-490',
    title: 'PR #490 — Approval gate flow',
    brief: 'Founder approval gate: branch/merge flow, idempotent change_proposals upserts.',
    domain: 'engineering',
    status: 'planned',
    artifacts: [
      { id: 'a2', kind: 'pull_request', label: 'PR #490', url: 'https://github.com/jussray/Sekret-Bip/pull/490', createdAt: Date.now() - 3600000 },
    ],
    dependencies: [
      { prNumber: 482, title: 'PR #482 — Event inbox', status: 'open', url: 'https://github.com/jussray/Sekret-Bip/pull/482' },
    ],
    approvals: [],
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 1800000,
    riskLevel: 'medium',
    rollbackNote: 'Gate is additive — remove approval check to revert',
  },
  {
    id: 'thread-pr-480',
    title: 'PR #480 — CI failure routing to Control Room',
    brief: 'Route workflow failures into founder-facing blocked-thread evidence cards.',
    domain: 'infra',
    status: 'draft',
    blockReason: 'dependency_not_merged',
    blockDetail: 'Depends on #490 approval gate being live first.',
    artifacts: [
      { id: 'a3', kind: 'pull_request', label: 'PR #480', url: 'https://github.com/jussray/Sekret-Bip/pull/480', createdAt: Date.now() - 1800000 },
    ],
    dependencies: [
      { prNumber: 490, title: 'PR #490 — Approval gate', status: 'draft', url: 'https://github.com/jussray/Sekret-Bip/pull/490' },
    ],
    approvals: [],
    createdAt: Date.now() - 21600000,
    updatedAt: Date.now() - 600000,
    riskLevel: 'low',
    rollbackNote: 'Remove webhook handler to revert',
  },
  {
    id: 'thread-companion-replies',
    title: 'Companion Reply Delivery Fix',
    brief: 'Optimistic bubble fires before reply committed. sekretClient.ts / postJson fix + Playwright E2E gate.',
    domain: 'engineering',
    status: 'running',
    artifacts: [],
    dependencies: [],
    approvals: [],
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 300000,
    riskLevel: 'medium',
    blastRadius: 'Companion chat surface — all characters',
    rollbackNote: 'Revert optimistic bubble timing change',
  },
];
