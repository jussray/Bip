// ─────────────────────────────────────────────────────────────────────────────
// constants/styles.ts — shared base styles, theme-aware
// ─────────────────────────────────────────────────────────────────────────────
import { StyleSheet, Platform } from 'react-native';

export const createStyles = (theme: any) => {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    logo: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: '#CBD5E1',
      textAlign: 'center',
      marginBottom: 20,
    },
    sectionTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      marginTop: 18,
    },
    card: {
      padding: 18,
      borderRadius: 20,
      marginBottom: 16,
      borderWidth: 1,
      backgroundColor: theme.card,
      borderColor: theme.accent,
    },
    button: {
      padding: 16,
      borderRadius: 18,
      marginBottom: 12,
      alignItems: 'center' as const,
      backgroundColor: theme.accent,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold' as const,
      textAlign: 'center' as const,
    },
    journalInput: {
      color: '#fff',
      padding: 16,
      borderRadius: 18,
      minHeight: 130,
      textAlignVertical: 'top' as const,
      marginBottom: 16,
      borderWidth: 1,
      backgroundColor: theme.card,
      borderColor: theme.accent,
    },
    moodRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      marginBottom: 18,
      gap: 8,
    },
    moodBubble: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: '#1E293B',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    bottomNav: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      paddingVertical: 14,
      backgroundColor: '#111827',
      borderRadius: 20,
      marginTop: 28,
      marginBottom: 20,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    navItem: {
      alignItems: 'center' as const,
      minWidth: 48,
    },
    navIcon: {
      fontSize: 20,
      marginBottom: 3,
    },
    navText: {
      color: '#94A3B8',
      fontSize: 11,
    },
    activeNavText: {
      color: '#fff',
      fontWeight: 'bold' as const,
    },
  });
};
