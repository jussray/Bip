import { useEffect, useMemo, useState } from 'react';
import {
  buildCompanionSnapshot,
  DEFAULT_COMPANION_STATE,
  loadCompanionState,
  saveCompanionState,
} from '../utils/sekretCompanion';
import type { CompanionActivityInput, CompanionState } from '../types/sekretCompanion';

export function useSekretCompanion(input: CompanionActivityInput) {
  const [state, setState] = useState<CompanionState>(DEFAULT_COMPANION_STATE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadCompanionState();
      if (!cancelled) {
        setState(loaded);
        setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const inputSignature = JSON.stringify(input);
  const snapshot = useMemo(
    () => buildCompanionSnapshot(input, state),
    [inputSignature, state]
  );

  useEffect(() => {
    if (!isReady) return;
    const { lastUpdated: _stateUpdated, ...stateContent } = state;
    const { lastUpdated: _snapshotUpdated, ...snapshotContent } = snapshot;
    if (JSON.stringify(stateContent) === JSON.stringify(snapshotContent)) return;

    const nextState = { ...snapshot, lastUpdated: new Date().toISOString() };
    setState(nextState);
    void saveCompanionState(nextState);
  }, [isReady, snapshot, state]);

  return {
    ...snapshot,
    state,
    isReady,
  };
}
