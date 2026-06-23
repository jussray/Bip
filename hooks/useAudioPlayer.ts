import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'finished' | 'error';

export interface AudioPlayerResult {
  state: PlaybackState;
  positionMs: number;
  durationMs: number;
  progress: number;
  error: string | null;
  load: (uri: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  unload: () => Promise<void>;
}

export function useAudioPlayer(): AudioPlayerResult {
  const [state, setState] = useState<PlaybackState>('idle');
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const unload = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setState('idle');
    setPositionMs(0);
    setDurationMs(0);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      unload();
    };
  }, [unload]);

  const load = useCallback(async (uri: string) => {
    await unload();
    try {
      setState('loading');
      setError(null);
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        (s) => {
          if (!s.isLoaded) return;
          setPositionMs(s.positionMillis);
          setDurationMs(s.durationMillis ?? 0);
          if (s.didJustFinish) {
            setState('finished');
          }
        }
      );
      soundRef.current = sound;
      if (status.isLoaded) {
        setDurationMs(status.durationMillis ?? 0);
      }
      setState('paused');
    } catch (e: any) {
      setState('error');
      setError(e?.message ?? 'Failed to load audio.');
    }
  }, [unload]);

  const play = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.playAsync();
      setState('playing');
    } catch (e: any) {
      setError(e?.message ?? 'Playback failed.');
    }
  }, []);

  const pause = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.pauseAsync();
      setState('paused');
    } catch (e: any) {
      setError(e?.message ?? 'Pause failed.');
    }
  }, []);

  const seek = useCallback(async (ms: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(ms);
      setPositionMs(ms);
    } catch (e: any) {
      setError(e?.message ?? 'Seek failed.');
    }
  }, []);

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return { state, positionMs, durationMs, progress, error, load, play, pause, seek, unload };
}
