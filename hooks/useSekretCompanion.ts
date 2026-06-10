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

  const snapshot = useMemo(() => buildCompanionSnapshot(input, state), [input, state]);

  useEffect(() => {
    if (!isReady) return;
    const serializedState = JSON.stringify(state);
    const serializedSnapshot = JSON.stringify(snapshot);
    if (serializedState === serializedSnapshot) return;

    const nextState = { ...snapshot };
    setState(nextState);
    saveCompanionState(nextState);
  }, [isReady, snapshot, state]);

  return {
    ...snapshot,
    state,
    isReady,
  };
}
