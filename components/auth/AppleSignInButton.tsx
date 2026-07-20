/**
 * AppleSignInButton.tsx
 * Sign in with Apple — mandatory for App Store if ANY other social login exists.
 * Wires expo-apple-authentication → Supabase signInWithIdToken.
 *
 * Usage:
 *   import AppleSignInButton from '@/components/auth/AppleSignInButton';
 *   <AppleSignInButton onSuccess={(session) => router.replace('/home')} />
 *
 * Prerequisites (not yet done — this file is excluded from tsconfig until they are):
 *   - expo install expo-apple-authentication
 *   - Add "Sign In with Apple" capability in Xcode
 *   - Enable Apple provider in Supabase Auth dashboard
 *   - Wire this component into an actual sign-in screen (currently has zero importers)
 */
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/utils/supabase';
import type { Session } from '@supabase/supabase-js';

interface Props {
  onSuccess?: (session: Session) => void;
  onError?: (error: Error) => void;
}

export default function AppleSignInButton({ onSuccess, onError }: Props) {
  // Only available on iOS 13+
  if (Platform.OS !== 'ios') return null;

  const handlePress = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple.');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;
      if (data.session) onSuccess?.(data.session);
    } catch (error: any) {
      // ERR_REQUEST_CANCELED = user tapped Cancel — not a real error
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      console.error('[AppleSignIn]', error);
      onError?.(error instanceof Error ? error : new Error(error.message));
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={styles.button}
      onPress={handlePress}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 54,
  },
});
