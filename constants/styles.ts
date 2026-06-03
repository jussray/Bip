// ─────────────────────────────────────────────────────────────────────────────
// constants/styles.ts — shared base styles, theme-aware
//
// USAGE
//   import { createStyles } from '../constants/styles';
//   const styles = createStyles(t);      // screens that receive prop as 't'
//   const styles = createStyles(theme);  // screens that receive prop as 'theme'
//
// WHAT'S INCLUDED
//   Base layout keys shared across 6+ screens: container, scrollContent, root,
//   logo, subtitle, sectionTitle, card, button, buttonText, journalInput,
//   moodRow, moodBubble.
//
// WHAT'S NOT INCLUDED (intentionally)
//   bottomNav / navItem / navIcon / navText / activeNavText — these belong
//   exclusively to the BottomNav renderer in app/index.tsx. Screens never
//   render BottomNav markup directly; it is passed in as a ReactNode prop.
//
// CARD BORDER NOTE
//   card.borderColor defaults to 'transparent'. Every screen overrides this
//   inline with a dimmed variant (e.g. theme.accent + '55'). A hard accent
//   default would flash through on mount before inline styles apply.
// ─────────────────────────────────────────────────────────────────────────────

import { StyleSheet, Platform } from 'react-native';

export const createStyles = (theme: {
  background: string;
  card:       string;
  accent:     string;
  soft:       string;
  [key: string]: string;
}) => {
  return StyleSheet.create({

    // ── Root container (use on the outermost View, not ScrollView) ───────────
    root: {
      flex:            1,
      backgroundColor: theme.background,
    },

    // ── ScrollView contentContainerStyle ────────────────────────────────────
    // Safe for screens that scroll their full content.
    // Screens with custom headers (Calm, VoiceBip, MindBody, Room) should
    // set paddingTop: 0 and manage top spacing inside their header component.
    container: {
      flexGrow:   1,
      padding:    20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },

    // ── Alias — same as container, more descriptive name ────────────────────
    scrollContent: {
      flexGrow:   1,
      padding:    20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },

    // ── Typography ───────────────────────────────────────────────────────────
    logo: {
      fontSize:     28,
      fontWeight:   'bold',
      color:        '#fff',
      textAlign:    'center',
      marginBottom: 8,
    },

    subtitle: {
      fontSize:     15,
      color:        '#CBD5E1',
      textAlign:    'center',
      marginBottom: 20,
    },

    sectionTitle: {
      color:        '#fff',
      fontSize:     20,
      fontWeight:   'bold',
      marginBottom: 12,
      marginTop:    18,
    },

    // ── Cards ────────────────────────────────────────────────────────────────
    // borderColor is transparent by default — screens always override with a
    // dimmed accent variant. Do not change this default.
    card: {
      padding:         18,
      borderRadius:    20,
      marginBottom:    16,
      borderWidth:     1,
      backgroundColor: theme.card,
      borderColor:     'transparent',
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    button: {
      padding:         16,
      borderRadius:    18,
      marginBottom:    12,
      alignItems:      'center' as const,
      backgroundColor: theme.accent,
    },

    buttonText: {
      color:       '#fff',
      fontSize:    16,
      fontWeight:  'bold'    as const,
      textAlign:   'center'  as const,
    },

    // ── Journal / text input ─────────────────────────────────────────────────
    journalInput: {
      color:             '#fff',
      padding:           16,
      borderRadius:      18,
      minHeight:         130,
      textAlignVertical: 'top'  as const,
      marginBottom:      16,
      borderWidth:       1,
      backgroundColor:   theme.card,
      borderColor:       theme.accent,
    },

    // ── Mood row ─────────────────────────────────────────────────────────────
    moodRow: {
      flexDirection:   'row'          as const,
      justifyContent:  'space-around' as const,
      marginBottom:    18,
      gap:             8,
    },

    moodBubble: {
      width:           66,
      height:          66,
      borderRadius:    33,
      backgroundColor: '#1E293B',
      justifyContent:  'center'  as const,
      alignItems:      'center'  as const,
    },

  });
};
