import { useCallback, useEffect, useMemo, useState } from 'react';

type BrowserSpeechSynthesisWindow = Window & {
  speechSynthesis?: SpeechSynthesis;
};

export type UseSpeechSynthesisOptions = {
  enabledByDefault?: boolean;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

const hasSpeechSynthesis = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean((window as BrowserSpeechSynthesisWindow).speechSynthesis);
};

export const useSpeechSynthesis = (options: UseSpeechSynthesisOptions = {}) => {
  const { enabledByDefault = true, lang = 'en-US', rate = 0.9, pitch = 1.1, volume = 1 } = options;
  const [isSupported, setIsSupported] = useState<boolean>(() => hasSpeechSynthesis());
  const [isEnabled, setIsEnabled] = useState<boolean>(enabledByDefault && hasSpeechSynthesis());
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setIsSupported(hasSpeechSynthesis());
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') {
        return;
      }

      window.speechSynthesis?.cancel();
    };
  }, []);

  const synthesis = useMemo(
    () => (typeof window === 'undefined' ? null : window.speechSynthesis || null),
    []
  );

  const stopSpeaking = useCallback((): void => {
    synthesis?.cancel();
    setIsSpeaking(false);
  }, [synthesis]);

  const speak = useCallback(
    (content: string): void => {
      if (!isSupported || !isEnabled || !synthesis) {
        return;
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return;
      }

      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmedContent);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      synthesis.speak(utterance);
    },
    [isEnabled, isSupported, lang, pitch, rate, synthesis, volume]
  );

  const toggleEnabled = useCallback((): void => {
    if (!isSupported) {
      return;
    }

    setIsEnabled((previousValue) => {
      const nextValue = !previousValue;

      if (!nextValue) {
        synthesis?.cancel();
        setIsSpeaking(false);
      }

      return nextValue;
    });
  }, [isSupported, synthesis]);

  return {
    isSupported,
    isEnabled,
    isSpeaking,
    speak,
    stopSpeaking,
    toggleEnabled,
  };
};

export default useSpeechSynthesis;
