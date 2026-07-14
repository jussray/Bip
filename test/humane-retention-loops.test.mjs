import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('Bip Energy fade keeps the intentional bounded contract', () => {
  const restoreMigration = read('supabase/migrations/20260714045500_restore_intentional_bip_energy_fade.sql');
  const finalMigration = read('supabase/migrations/20260714051500_align_bip_energy_with_bip_events.sql');
  const ledger = read('src/features/activity/ledger.ts');
  const overlay = read('components/retention/BipReturnOverlay.tsx');

  assert.match(finalMigration, /v_days_away <= 1/);
  assert.match(finalMigration, /least\(v_balance, least\(5, greatest\(1, v_days_away - 1\)\)\)/);
  assert.match(finalMigration, /once per day|max five|never below zero/i);
  assert.match(finalMigration, /source_type[\s\S]*'inactivity_adjustment'/);
  assert.match(finalMigration, /from public\.bip_events/);
  assert.match(finalMigration, /event_type not in \('app_opened', 'streak_milestone'\)/);
  assert.doesNotMatch(finalMigration, /from public\.activity_events/);
  assert.match(restoreMigration, /when 'streak_milestone' then 3/);
  assert.match(ledger, /void applyBipEnergyFade\(\)/);
  assert.match(ledger, /Bip Tickets and redeemed room items[\s\S]*never removed/);
  assert.match(overlay, /await applyBipEnergyFade\(\)/);
  assert.doesNotMatch(ledger, /disabled_no_guilt_retention/);
});

test('Room and History use meaningful return value rather than streak shame', () => {
  const roomRoute = read('app/(teen)/room.tsx');
  const overlay = read('components/retention/BipReturnOverlay.tsx');
  const historyRoute = read('app/(teen)/history.tsx');
  const historyScreen = read('screens/MeaningfulHistoryScreen.tsx');
  const receipts = read('src/features/retention/meaningfulReturn.ts');

  assert.match(roomRoute, /BipReturnOverlay/);
  assert.match(overlay, /Bip Energy faded a little/);
  assert.match(overlay, /Bip Tickets, redeemed rewards, and unlocked room items stay yours/);
  assert.match(historyRoute, /MeaningfulHistoryScreen/);
  assert.doesNotMatch(historyRoute, /streakDays=/);
  assert.match(historyScreen, /days you checked in this month/);
  assert.match(historyScreen, /Missing a day does not erase anything/);
  assert.match(receipts, /journal_saved/);
  assert.match(receipts, /comfort_completed/);
  assert.match(receipts, /bridge_shared/);
  assert.doesNotMatch(receipts, /journalText|messageContent|transcript/);
});

test('public Circle keeps support actions but hides popularity totals', () => {
  const circle = read('app/(teen)/circle/feed-v2.tsx');

  assert.match(circle, /Support is visible without popularity totals/);
  assert.match(circle, /accessibilityLabel={`Support with \$\{reaction\.label\}`}/);
  assert.match(circle, /selected \? 'sent' : reaction\.label/);
  assert.doesNotMatch(circle, /const count = item\.reactions\[reaction\.key\]/);
  assert.doesNotMatch(circle, /busy \? '…' : count/);
});

test('Bridge carries a teen-selected response request without private content', () => {
  const migration = read('supabase/migrations/20260714043000_humane_retention_loops.sql');
  const teenDock = read('components/bridge/BridgeResponsePreferenceDock.tsx');
  const parentCard = read('components/bridge/ParentBridgeResponseRequestCard.tsx');
  const bridgeCompat = read('src/utils/parentBridgeCompat.ts');
  const preferenceContract = read('src/features/bridge/responsePreference.ts');

  assert.match(migration, /add column if not exists response_preference text/);
  assert.match(migration, /'listen', 'comfort', 'help_plan', 'check_later', 'give_space'/);
  assert.match(teenDock, /What would help after you send this\?/);
  assert.match(teenDock, /They still do not get the rest of your private space/);
  assert.match(parentCard, /Honor the request without asking to see journals, chats, mood history/);
  assert.match(bridgeCompat, /response_preference: responsePreference/);
  assert.match(bridgeCompat, /select\('id, share_type, conv_mode, response_preference/);
  assert.match(preferenceContract, /just listen/);
  assert.match(preferenceContract, /give me space/);
});

test('new private retention and Bridge keys clear on sign-out', () => {
  const storage = read('src/utils/storage.ts');

  for (const key of [
    'sekretbip_meaningful_return_receipts_v1',
    'sekretbip_meaningful_return_seen_v1',
    'sekretbip_bip_energy_adjustment_v1',
    'sekretbip_bip_energy_adjustment_seen_v1',
    'sekretbip_bridge_response_preference_v1',
  ]) {
    assert.match(storage, new RegExp(key));
  }

  assert.match(storage, /PRIVATE_ACCOUNT_KEYS/);
  assert.match(storage, /AsyncStorage\.multiRemove\(\[\.\.\.PRIVATE_ACCOUNT_KEYS\]\)/);
});

test('meaningful return snapshot is metadata-only and permanent-account gated', () => {
  const migration = read('supabase/migrations/20260714043000_humane_retention_loops.sql');

  assert.match(migration, /permanent account required/);
  assert.match(migration, /latest_safe_meta/);
  assert.match(migration, /'category', meta ->> 'category'/);
  assert.match(migration, /'route', meta ->> 'route'/);
  assert.match(migration, /'receiptKey', meta ->> 'receiptKey'/);
  assert.doesNotMatch(migration, /journal_entries|voice_notes|parent_notes\.content/);
});
