interface SpeechRecognitionResult {
  transcript: string;
}

interface SpeechRecognitionEvent extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>;
}

interface SpeechRecognition {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  start(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
