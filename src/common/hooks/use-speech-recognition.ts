import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0?: {
    transcript?: string;
  };
};

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type BrowserSpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export type UseSpeechRecognitionOptions = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  restartOnEnd?: boolean;
  onTranscript: (transcript: string) => void | Promise<void>;
  onError?: (message: string) => void;
  onListeningChange?: (isListening: boolean) => void;
};

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const browserWindow = window as BrowserSpeechRecognitionWindow;
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
};

const mapSpeechRecognitionError = (error?: string): string => {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission was denied. Please allow microphone access and try again.';
    case 'no-speech':
      return 'No speech was detected. Please try again and speak a little closer to the microphone.';
    case 'audio-capture':
      return 'No microphone was found. Please check your microphone connection and try again.';
    case 'network':
      return 'Voice recognition hit a network issue. Please try again.';
    case 'aborted':
      return 'Voice recognition was stopped.';
    default:
      return 'Voice recognition is unavailable right now. Please try again.';
  }
};

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions) => {
  const {
    lang = 'en-US',
    continuous = false,
    interimResults = true,
    restartOnEnd = false,
    onTranscript,
    onError,
    onListeningChange,
  } = options;
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  const onListeningChangeRef = useRef(onListeningChange);
  const shouldRestartRef = useRef(false);
  const hasManualStopRef = useRef(false);
  const [isSupported, setIsSupported] = useState<boolean>(() =>
    Boolean(getSpeechRecognitionConstructor())
  );
  const [isListening, setIsListening] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onListeningChangeRef.current = onListeningChange;
  }, [onListeningChange]);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionConstructor()));
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      hasManualStopRef.current = true;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const updateListeningState = useCallback((nextListening: boolean): void => {
    setIsListening(nextListening);
    onListeningChangeRef.current?.(nextListening);
  }, []);

  const ensureRecognition = useCallback((): SpeechRecognitionLike | null => {
    if (recognitionRef.current) {
      return recognitionRef.current;
    }

    const RecognitionConstructor = getSpeechRecognitionConstructor();
    if (!RecognitionConstructor) {
      return null;
    }

    const recognition = new RecognitionConstructor();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let nextInterimTranscript = '';
      let nextFinalTranscript = '';

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript?.trim();

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          nextFinalTranscript = `${nextFinalTranscript} ${transcript}`.trim();
        } else {
          nextInterimTranscript = `${nextInterimTranscript} ${transcript}`.trim();
        }
      }

      setTranscriptPreview(nextFinalTranscript || nextInterimTranscript);

      if (!nextFinalTranscript) {
        return;
      }

      void Promise.resolve(onTranscriptRef.current(nextFinalTranscript)).catch(() => undefined);
    };
    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldRestartRef.current = false;
      }

      if (event.error === 'audio-capture') {
        shouldRestartRef.current = false;
      }

      updateListeningState(false);
      onErrorRef.current?.(mapSpeechRecognitionError(event.error));
    };
    recognition.onend = () => {
      updateListeningState(false);

      if (!shouldRestartRef.current || hasManualStopRef.current) {
        return;
      }

      window.setTimeout(() => {
        try {
          recognition.start();
          updateListeningState(true);
        } catch {
          onErrorRef.current?.('Voice recognition could not restart. Please try again.');
        }
      }, 250);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [continuous, interimResults, lang, updateListeningState]);

  const startListening = useCallback((): void => {
    if (isListening) {
      return;
    }

    const recognition = ensureRecognition();

    if (!recognition) {
      setIsSupported(false);
      onErrorRef.current?.(
        'Voice commands are not supported in this browser. Chrome or Edge works best for this feature.'
      );
      return;
    }

    setTranscriptPreview('');

    try {
      hasManualStopRef.current = false;
      shouldRestartRef.current = restartOnEnd;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.start();
      updateListeningState(true);
    } catch {
      onErrorRef.current?.('Voice recognition could not start. Please try again.');
    }
  }, [
    continuous,
    ensureRecognition,
    interimResults,
    isListening,
    lang,
    restartOnEnd,
    updateListeningState,
  ]);

  const stopListening = useCallback((): void => {
    hasManualStopRef.current = true;
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    updateListeningState(false);
  }, [updateListeningState]);

  return {
    isSupported,
    isListening,
    transcriptPreview,
    startListening,
    stopListening,
  };
};

export default useSpeechRecognition;
