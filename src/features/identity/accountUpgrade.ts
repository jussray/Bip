import AsyncStorage from '@react-native-async-storage/async-storage';

export const PENDING_ACCOUNT_UPGRADE_KEY = 'bip_pending_account_upgrade_email';

export function normalizeAccountEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

export async function markPendingAccountUpgrade(email: string): Promise<void> {
  const normalized = normalizeAccountEmail(email);
  if (!normalized) throw new Error('A valid account email is required.');
  await AsyncStorage.setItem(PENDING_ACCOUNT_UPGRADE_KEY, normalized);
}

export async function loadPendingAccountUpgradeEmail(): Promise<string | null> {
  const stored = normalizeAccountEmail(
    await AsyncStorage.getItem(PENDING_ACCOUNT_UPGRADE_KEY),
  );
  return stored || null;
}

export async function clearPendingAccountUpgrade(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_ACCOUNT_UPGRADE_KEY);
}

export function isPendingUpgradeForEmail(
  pendingEmail: string | null | undefined,
  accountEmail: string | null | undefined,
): boolean {
  const pending = normalizeAccountEmail(pendingEmail);
  return Boolean(pending) && pending === normalizeAccountEmail(accountEmail);
}
