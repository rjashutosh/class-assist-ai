import { createContext, useContext, useState, ReactNode } from "react";

interface VoiceModeContextValue {
  voiceMode: boolean;
  setVoiceMode: (v: boolean) => void;
  toggleVoiceMode: () => void;
}

const VoiceModeContext = createContext<VoiceModeContextValue | null>(null);

const STORAGE_KEY = "classassist-voice-mode";

export function VoiceModeProvider({ children }: { children: ReactNode }) {
  const [voiceMode, setVoiceModeState] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) !== "false";
  });

  const setVoiceMode = (v: boolean) => {
    setVoiceModeState(v);
    localStorage.setItem(STORAGE_KEY, String(v));
  };
  const toggleVoiceMode = () => setVoiceMode(!voiceMode);

  return (
    <VoiceModeContext.Provider value={{ voiceMode, setVoiceMode, toggleVoiceMode }}>
      {children}
    </VoiceModeContext.Provider>
  );
}

export function useVoiceMode() {
  const ctx = useContext(VoiceModeContext);
  if (!ctx) throw new Error("useVoiceMode must be used within VoiceModeProvider");
  return ctx;
}
