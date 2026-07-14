/**
 * useAmbientPlayer
 *
 * Manages a single looping ambient background track via expo-av.
 * Designed for the Se'kret Room — one track plays at a time.
 *
 * Setup: add audio files to assets/audio/ and fill in AMBIENT_SOURCES.
 * The hook gracefully no-ops if a source is empty (dev preview safe).
 *
 * Usage:
 *   const { activeTrack, play, stop } = useAmbientPlayer();
 *   play('rain');        // starts rain loop
 *   play('rain');        // stops it (toggle)
 *   stop();              // stops anything playing
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type AmbientKey = 'rain' | 'lofi' | 'ocean' | 'forest' | 'night';

export const AMBIENT_TRACKS: Record<AmbientKey, { label: string; emoji: string }> = {
  rain:   { label: 'rain',     emoji: '🌧️' },
  lofi:   { label: 'lo-fi',    emoji: '🎵' },
  ocean:  { label: 'ocean',    emoji: '🌊' },
  forest: { label: 'forest',   emoji: '🌿' },
  night:  { label: 'night city', emoji: '🌃' },
};

/**
 * Audio sources — swap empty strings for require() or { uri: '...' } once
 * you have licensed ambient audio files.
 *
 * Bundled local example:  require('@/assets/audio/ambient-rain.mp3')
 * Remote streaming example: { uri: 'https://your-cdn.com/rain.mp3' }
 */
const AMBIENT_SOURCES: Record<AmbientKey, any> = {
  rain:   null,
  lofi:   null,
  ocean:  null,
  forest: null,
  night:  null,
};

export function useAmbientPlayer() {
  const soundRef               = useRef<Audio.Sound | null>(null);
  const [activeTrack, setActiveTrack] = useState<AmbientKey | null>(null);
  const [loading, setLoading]  = useState(false);

  const stop = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch {
      // ignore cleanup errors
    }
    soundRef.current = null;
    setActiveTrack(null);
  }, []);

  const play = useCallback(async (key: AmbientKey) => {
    // Toggle off if same track
    if (activeTrack === key) {
      await stop();
      return;
    }

    const source = AMBIENT_SOURCES[key];
    if (!source) {
      // Source not configured yet — no-op in dev, show nothing to user
      return;
    }

    setLoading(true);
    await stop();

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        source,
        { isLooping: true, shouldPlay: true, volume: 0.55 },
      );
      soundRef.current = sound;
      setActiveTrack(key);
    } catch {
      // Fail silently — ambient audio is enhancement, not core
    } finally {
      setLoading(false);
    }
  }, [activeTrack, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => null);
    };
  }, []);

  const isConfigured = useCallback(
    (key: AmbientKey) => AMBIENT_SOURCES[key] !== null,
    [],
  );

  return { activeTrack, loading, play, stop, isConfigured };
}
