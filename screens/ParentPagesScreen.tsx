import React from 'react';
import type { JournalEntry } from '../types';
import { PagesWorkspace, type SavePageInput } from './PagesScreen';
import type { OracleProfile, OracleSessionSummary } from '../services/oracleDiscovery';

interface ParentPagesScreenProps {
  entries: JournalEntry[];
  draft: string;
  setDraft: (text: string) => void;
  onSave: (entry: SavePageInput) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
  mood?: string;
  oracleProfile?: OracleProfile;
  onCompleteOracleSession: (profile: OracleProfile, session: OracleSessionSummary) => void;
}

export function ParentPagesScreen(props: ParentPagesScreenProps) {
  return <PagesWorkspace side="parent" {...props} />;
}
