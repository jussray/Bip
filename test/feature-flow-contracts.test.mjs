import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the mounted AppContext owns durable Teen and Parent journal writes', () => {
  const context = read('src/context/AppContext.tsx');
  assert.equal(context.includes("from '@/features/journal/journalRepository'"), true);
  assert.equal(context.includes("upsertJournalEntry(entry, 'teen')"), true);
  assert.equal(context.includes("upsertJournalEntry(entry, 'parent')"), true);
  assert.equal(context.includes("upsertJournalEntry(patched, 'teen')"), true);
  assert.equal(context.includes('useState<CirclePost[]>'), false);
  assert.equal(context.includes('useState<VoiceNote[]>'), false);
});

test('canonical state hydrates durable feature records after the offline cache', () => {
  const state = read('src/hooks/useSekretState.ts');
  assert.equal(state.includes('pullAll()'), true);
  assert.equal(state.includes("loadJournalEntries('teen')"), true);
  assert.equal(state.includes("loadJournalEntries('parent')"), true);
  assert.equal(state.includes('loadPeriodDays()'), true);
  assert.equal(state.includes('mergeById'), true);
});

test('public Circle reconciles the inserted database row instead of inventing a permanent ID', () => {
  const repository = read('src/features/circle/circleRepository.ts');
  const screen = read('app/(teen)/circle/feed-v2.tsx');
  assert.equal(repository.includes(".select('id,user_id,text,post_mood,media_kind,reactions,created_at')"), true);
  assert.equal(repository.includes('react_to_public_circle_post'), true);
  assert.equal(repository.includes(".from('circle_profiles')"), true);
  assert.equal(screen.includes('createPublicCirclePost'), true);
  assert.equal(screen.includes('Date.now()'), false);
  assert.equal(screen.includes('For You'), false);
  assert.equal(screen.includes('Following'), false);
});

test('the database migration separates private notebooks and hardens Circle reactions', () => {
  const migration = read('supabase/migrations/20260712190000_feature_flow_contracts.sql');
  assert.equal(migration.includes('owner_side text not null'), true);
  assert.equal(migration.includes("check (owner_side in ('teen', 'parent'))"), true);
  assert.equal(migration.includes('circle_reactions_unique_user_post'), true);
  assert.equal(migration.includes('react_to_public_circle_post'), true);
  assert.equal(migration.includes("auth.jwt() ->> 'is_anonymous'"), true);
  assert.equal(migration.includes('revoke all on function public.react_to_public_circle_post(bigint, text) from anon'), true);
  assert.equal(migration.includes('grant execute on function public.react_to_public_circle_post(bigint, text) to authenticated'), true);
});

test('Parent Circle does not re-upload local history or double-save a new post', () => {
  const route = read('app/(parent)/circle/feed.tsx');
  assert.equal(route.includes('parentCirclePosts.forEach'), false);
  assert.equal(route.includes('syncParentCirclePost'), false);
  assert.equal(route.includes('saveParentCirclePost={saveParentCirclePost}'), true);
});

test('navigation exposes Bridge and canonicalizes duplicate Room paths', () => {
  const parentLayout = read('app/(parent)/_layout.tsx');
  const sharedRoutes = read('src/shared/routes.ts');
  const userRoom = read('app/(teen)/user-room.tsx');
  const points = read('app/(teen)/points.tsx');
  assert.equal(parentLayout.includes('name="bridge"'), true);
  assert.equal(parentLayout.includes('name="calm" options={{ href: null }}'), true);
  assert.equal(sharedRoutes.includes("return side === 'parent' ? PARENT_ROUTES.more : TEEN_ROUTES.more"), true);
  assert.equal(sharedRoutes.includes('crew: TEEN_ROUTES.circle'), true);
  assert.equal(userRoom.includes('<Redirect href="/(teen)/room"'), true);
  assert.equal(points.includes('comfortSessions={comfortSessions}'), true);
});

test('placeholder Crew is not exposed as a real connection flow', () => {
  const circleRoute = read('app/(teen)/circle/index.tsx');
  const crew = read('src/screens/CrewAccountabilityScreen.tsx');
  assert.equal(circleRoute.includes('BipCrewScreen'), false);
  assert.equal(circleRoute.includes('CrewAccountabilityScreen'), true);
  assert.equal(crew.includes("isRelationshipFeatureAvailable('crewAccountability'"), true);
  assert.equal(crew.includes(".eq('connection_status', 'accepted')"), true);
  assert.equal(crew.includes('Placeholder invite codes are no longer treated as real connections.'), true);
});
