import { Stack } from 'expo-router';
import { Analytics } from '@/components/shared/Analytics';
import { validateEnv } from '@/utils/env';

// Run once at startup — logs warnings for missing vars, throws if secrets
// like OPENAI_API_KEY or service_role appear in the client bundle.
void validateEnv();

export default function RootLayout() {
  return (
    <>
      <Analytics />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
