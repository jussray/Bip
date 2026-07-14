import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { createSessionFromAuthUrl } from '@/services/authDeepLink';
import { loadPendingAccountUpgradeEmail } from '@/features/identity/accountUpgrade';

export default function AuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let completed = false;

    async function handleUrl(url: string | null) {
      if (!active || completed || !url) return;
      completed = true;

      try {
        const result = await createSessionFromAuthUrl(url);
        if (!result.handled) throw new Error('This authentication link did not contain a usable session.');

        if (result.kind === 'recovery') {
          router.replace('/(auth)/reset-password');
          return;
        }

        const pendingUpgradeEmail = await loadPendingAccountUpgradeEmail();
        router.replace(pendingUpgradeEmail ? '/(auth)/signup' : '/');
      } catch (caught) {
        if (active) {
          completed = false;
          setError(caught instanceof Error ? caught.message : 'The authentication link could not be completed.');
        }
      }
    }

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', event => {
      void handleUrl(event.url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.root}>
      {error ? (
        <>
          <Text style={styles.icon}>💜</Text>
          <Text style={styles.title}>We could not finish that link.</Text>
          <Text style={styles.body}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(auth)/signup')}
            accessibilityRole="button"
            accessibilityLabel="Return to account setup"
          >
            <Text style={styles.buttonText}>Return to account setup</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator color="#c4b5fd" size="large" />
          <Text style={styles.body}>Securing your Bip account…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: { fontSize: 42, marginBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  body: { color: '#94a3b8', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 14, marginBottom: 24 },
  button: { width: '100%', borderRadius: 16, backgroundColor: '#6d28d9', paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
