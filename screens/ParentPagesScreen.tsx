import React from 'react';
import type { JournalEntry } from '../types';
import { PagesWorkspace, type SavePageInput } from './PagesScreen';

interface ParentPagesScreenProps {
  entries: JournalEntry[];
  draft: string;
  setDraft: (text: string) => void;
  onSave: (entry: SavePageInput) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
  mood?: string;
  parentRoomStyle?: 'mom' | 'dad';
}

export function ParentPagesScreen(props: ParentPagesScreenProps) {
  return <PagesWorkspace side="parent" {...props} />;
}
