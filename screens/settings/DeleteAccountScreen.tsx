/**
 * DeleteAccountScreen.tsx
 * Apple App Store requirement — in-app account deletion (mandatory since June 2023).
 * Deletes: auth user, all messages, all memories, all companion history, all profile data.
 * Triggered via Settings → Account → Delete Account.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';

const WHAT_GETS_DELETED = [
  "Your Se'kret Bip account and login",
  'All conversations with Raylene, Rylane, Night, and Cloud',
  'All memories your companions have of you',
  'Your journal entries and scrapbook',
  'Your rewards and badges',
  'Parent Circle connections',
  'All personal data stored by Se\'kret Bip',
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    Alert.alert(
      'Delete your account?',
      'This cannot be undone. Everything listed will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setConfirmed(false) },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: performDeletion,
        },
      ]
    );
  };

  const performDeletion = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Deletion failed');
      }

      await supabase.auth.signOut();

      Alert.alert(
        'Account deleted',
        "Your Se'kret Bip account and all data have been permanently deleted.",
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Something went wrong',
        `We couldn't delete your account right now. Please try again or contact support@sekretbip.net.\n\n${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Delete your account</Text>
        <Text style={styles.subtitle}>
          Deleting your account is permanent and cannot be undone.
        </Text>

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>What will be deleted:</Text>
          {WHAT_GETS_DELETED.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItem}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.warning}>
          If you have an active subscription, cancel it in the App Store before deleting.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#c0392b" style={styles.loader} />
        ) : (
          <TouchableOpacity
            style={[styles.deleteButton, confirmed && styles.deleteButtonConfirmed]}
            onPress={handleDelete}
            accessibilityLabel="Delete account permanently"
            accessibilityRole="button"
          >
            <Text style={styles.deleteButtonText}>
              {confirmed
                ? '⚠️ Tap again to confirm — this cannot be undone'
                : 'Delete my account'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.support}>
          Need help? Contact{' '}
          <Text style={styles.supportLink}>support@sekretbip.net</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf9f7' },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 24 },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  listRow: { flexDirection: 'row', marginBottom: 8 },
  bullet: { color: '#c0392b', marginRight: 8, fontSize: 16 },
  listItem: { fontSize: 14, color: '#444', lineHeight: 20, flex: 1 },
  warning: {
    fontSize: 13,
    color: '#8a6a00',
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 28,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#c0392b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 54,
  },
  deleteButtonConfirmed: { backgroundColor: '#96281b' },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    minHeight: 54,
  },
  cancelButtonText: { color: '#333', fontSize: 16 },
  loader: { marginVertical: 20 },
  support: { fontSize: 13, color: '#888', textAlign: 'center' },
  supportLink: { color: '#01696f' },
});
