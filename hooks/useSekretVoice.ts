import { useCallback, useMemo, useState } from 'react';

export function useSekretVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceReady, setVoiceReady] = useState(true);

  const speak = useCallback((text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    setVoiceReady(true);

    // Placeholder voice architecture: no external service is invoked.
    // This keeps the hook future-safe and free of paid APIs.
    const timer = setTimeout(() => setIsSpeaking(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const stop = useCallback(() => {
    setIsSpeaking(false);
  }, []);

  return useMemo(() => ({
    speak,
    stop,
    isSpeaking,
    voiceReady,
  }), [isSpeaking, speak, stop, voiceReady]);
}
