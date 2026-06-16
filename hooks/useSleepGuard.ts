/**
 * hooks/useSleepGuard.ts
 *
 * Guardrail 5 — Sleep hours guardrail.
 *
 * Reads the teen's configured sleep window from AsyncStorage
 * (stored as { start: "22:00", end: "07:00" }) and returns
 * whether sleep mode is currently active.
 *
 * The hook rechecks every time the screen re-mounts so that
 * if the teen has their phone open at sleep time it updates.
 *
 * sleepActive is false until the sleep window is loaded, so
 * the app never accidentally blocks on startup.
 *
 * Sleep window defaults to null (no blocking) if never set.
 *
 * Usage:
 *   const { sleepActive } = useSleepGuard();
 *   <SleepGate sleepActive={sleepActive} onComfort={goToComfort}>
 *     {content}
 *   </SleepGate>
 */

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SLEEP_KEY = 'sleepWindow';

export interface SleepWindow {
  start: string; // 'HH:MM' 24-hour
  end:   string;
}

function isInSleepWindow(window: SleepWindow): boolean {
  const now   = new Date();
  const hm    = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = window.start.split(':').map(Number);
  const [eh, em] = window.end.split(':').map(Number);
  const start = sh * 60 + sm;
  const end   = eh * 60 + em;

  if (start < end) {
    // e.g. 22:00 to 06:00 wraps midnight → start > end
    // e.g. 01:00 to 06:00 doesn't wrap
    return hm >= start && hm < end;
  } else {
    // Wraps midnight
    return hm >= start || hm < end;
  }
}

export function useSleepGuard() {
  const [sleepActive, setSleepActive] = useState(false);
  const [window_, setWindow] = useState<SleepWindow | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(SLEEP_KEY).then(raw => {
      if (!raw || !mounted) return;
      try {
        const w: SleepWindow = JSON.parse(raw);
        setWindow(w);
        setSleepActive(isInSleepWindow(w));
      } catch {
        // Malformed — treat as no window set
      }
    });
    return () => { mounted = false; };
  }, []);

  // Expose setSleepWindow so SettingsScreen can save a new window.
  const setSleepWindow = async (w: SleepWindow | null) => {
    if (w === null) {
      await AsyncStorage.removeItem(SLEEP_KEY);
      setWindow(null);
      setSleepActive(false);
    } else {
      await AsyncStorage.setItem(SLEEP_KEY, JSON.stringify(w));
      setWindow(w);
      setSleepActive(isInSleepWindow(w));
    }
  };

  return { sleepActive, sleepWindow: window_, setSleepWindow };
}
