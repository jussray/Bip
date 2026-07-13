import React from 'react';
import { router } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TEEN_ROUTES } from '@/teen/routes';

const REQUIRED_PROTECTIONS = [
  ['🧾', 'Clear source', 'You should be able to see where a remembered detail came from.'],
  ['✏️', 'Correction', 'You should be able to fix something Bip remembered incorrectly.'],
  ['🗑️', 'Deletion', 'You should be able to remove a memory and have it stay removed.'],
  ['⏳', 'Expiration', 'Old details should not live forever without a reason.'],
  ['🔒', 'Private by default', 'Parents, Circle, and other users must not receive private continuity data.'],
] as const;

export default function L4StatusRoute() {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace(TEEN_ROUTES.more as any)}
            accessibilityRole="button"
            accessibilityLabel="Back to More"
          >
            <Text style={styles.backText}>‹ More</Text>
          </TouchableOpacity>
          <View style={styles.statusChip}>
            <Text style={styles.statusText}>PLANNED</Text>
          </View>
        </View>

        <Text style={styles.kicker}>L4 CONTINUITY</Text>
        <Text style={styles.title}>Memory should earn your trust first. 🧭</Text>
        <Text style={styles.subtitle}>
          Bip is not saving durable companion memory yet. This page is the safe entry point while the privacy, correction, expiration, and deletion rules are completed and tested.
        </Text>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>What works today</Text>
          <Text style={styles.noticeBody}>
            Your saved Pages, History, profile choices, and current conversation tools still work through their existing private paths. Opening this screen does not create, read, or store an L4 memory.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Before continuity can turn on</Text>
        {REQUIRED_PROTECTIONS.map(([emoji, title, body]) => (
          <View key={title} style={styles.requirementCard}>
            <Text style={styles.emoji}>{emoji}</Text>
            <View style={styles.requirementText}>
              <Text style={styles.requirementTitle}>{title}</Text>
              <Text style={styles.requirementBody}>{body}</Text>
            </View>
          </View>
        ))}

        <View style={styles.boundaryCard}>
          <Text style={styles.boundaryTitle}>Parent boundary</Text>
          <Text style={styles.boundaryBody}>
            L4 continuity will not become a parent activity feed. Anything shared through Bridge must still be chosen through Bridge, with its own relationship and consent rules.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push(TEEN_ROUTES.pages as any)}
          accessibilityRole="button"
          accessibilityLabel="Open my private Pages"
        >
          <Text style={styles.primaryButtonText}>Open my private Pages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push(TEEN_ROUTES.bridge as any)}
          accessibilityRole="button"
          accessibilityLabel="Open Bridge"
        >
          <Text style={styles.secondaryButtonText}>Open Bridge</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0820',
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 72,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  backText: {
    color: '#d8b4fe',
    fontSize: 15,
    fontWeight: '800',
  },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fbbf2466',
    backgroundColor: '#fbbf2418',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    color: '#fde68a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  kicker: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
    marginBottom: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginBottom: 12,
  },
  subtitle: {
    color: '#c4b5d4',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
  },
  noticeCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#8b5cf655',
    backgroundColor: '#21143b',
    padding: 18,
    marginBottom: 28,
  },
  noticeTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 7,
  },
  noticeBody: {
    color: '#c9bdd6',
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#ede9fe',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  requirementCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff16',
    backgroundColor: '#171025',
    padding: 15,
    marginBottom: 10,
  },
  emoji: {
    width: 28,
    fontSize: 21,
  },
  requirementText: {
    flex: 1,
  },
  requirementTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 3,
  },
  requirementBody: {
    color: '#a99db5',
    fontSize: 12,
    lineHeight: 18,
  },
  boundaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38bdf844',
    backgroundColor: '#0c2030',
    padding: 17,
    marginTop: 12,
    marginBottom: 24,
  },
  boundaryTitle: {
    color: '#bae6fd',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  boundaryBody: {
    color: '#b7cbd8',
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#a78bfa66',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d1330',
  },
  secondaryButtonText: {
    color: '#ddd6fe',
    fontSize: 14,
    fontWeight: '900',
  },
});
