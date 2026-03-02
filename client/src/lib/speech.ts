export function speak(text: string, onEnd?: () => void): void {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  u.pitch = 1;
  const voices = speechSynthesis.getVoices();
  const en = voices.find((v) => v.lang.startsWith("en"));
  if (en) u.voice = en;
  if (onEnd) u.onend = onEnd;
  speechSynthesis.speak(u);
}

export function cancelSpeech(): void {
  speechSynthesis.cancel();
}

export function getSpeechRecognition(): SpeechRecognition | null {
  const API = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
    || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
  if (!API) return null;
  const rec = new API();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";
  return rec;
}

export function startListening(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError?: (err: string) => void
): () => void {
  const rec = getSpeechRecognition();
  if (!rec) {
    onError?.("Speech recognition not supported");
    return () => {};
  }
  const handleResult = (e: SpeechRecognitionEvent) => {
    let finalTranscript = "";
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalTranscript += transcript;
      else interim += transcript;
    }
    if (finalTranscript) onResult(finalTranscript, true);
    else if (interim) onResult(interim, false);
  };
  rec.onresult = handleResult;
  rec.onerror = (e: Event & { error?: string }) => {
    if (e.error !== "aborted") onError?.(e.error ?? "Unknown error");
  };
  rec.start();
  return () => {
    try {
      rec.stop();
    } catch {
      // ignore
    }
  };
}
