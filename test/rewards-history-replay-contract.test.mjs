import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const migrationDir = new URL('../supabase/migrations/', import.meta.url);
const activityPath = new URL('../supabase/migrations/20260628235716_add_activity_events_for_memory_markers.sql', import.meta.url);
const rewardsPath = new URL('../supabase/migrations/20260629023925_add_rewards_and_redemption_transaction.sql', import.meta.url);
const approvalsPath = new URL('../src/utils/parentApprovals.ts', import.meta.url);

const activity = fs.readFileSync(activityPath, 'utf8');
const rewards = fs.readFileSync(rewardsPath, 'utf8');
const approvals = fs.readFileSync(approvalsPath, 'utf8');
const activeMigrations = new Set(fs.readdirSync(migrationDir));

test('unrecorded June 27 task/reward mega-migration stays retired', () => {
  assert.equal(activeMigrations.has('20260627193000_phase_2_tasks_approvals_rewards.sql'), false);
});

test('canonical activity-events migration owns the memory-marker event table', () => {
  assert.match(activity, /create table if not exists public\.activity_events/i);
  assert.match(activity, /activity_events_owner_select/i);
  assert.match(activity, /activity_events_owner_insert/i);
  assert.match(activity, /grant select, insert on public\.activity_events to authenticated/i);
});

test('canonical rewards migration owns rewards and user-scoped redemptions', () => {
  assert.match(rewards, /create table if not exists public\.rewards/i);
  assert.match(rewards, /create table if not exists public\.reward_redemptions/i);
  assert.match(rewards, /user_id uuid not null references auth\.users\(id\)/i);
  assert.match(rewards, /reward_id uuid not null references public\.rewards\(id\)/i);
  assert.match(rewards, /reward_redemptions_owner_read/i);
  assert.match(rewards, /create or replace function public\.request_reward_redemption\(p_reward_id uuid\)/i);
});

test('parent approvals read the production rewards contract, not the retired reward_catalog fork', () => {
  assert.match(approvals, /\.from\('reward_redemptions'\)/);
  assert.match(approvals, /reward:rewards\(id, name, description, point_cost, requires_parent_approval\)/);
  assert.match(approvals, /\.eq\('user_id', teenId\)/);
  assert.doesNotMatch(approvals, /reward_catalog/);
  assert.doesNotMatch(approvals, /\.eq\('teen_id', teenId\)[\s\S]*pending_parent/);
});
