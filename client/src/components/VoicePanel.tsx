import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startListening } from "../lib/speech";
import { intentApi, voiceApi } from "../lib/api";
import type { ExtractedIntent } from "../types/api";
import ConfirmationModal from "./ConfirmationModal";
import ExecutionPanel from "./ExecutionPanel";
import UpgradeModal from "./UpgradeModal";
import { useVoiceMode } from "../context/VoiceModeContext";

type Step = "idle" | "transcript" | "extracting" | "confirm" | "executing" | "done";

export default function VoicePanel() {
  const { voiceMode } = useVoiceMode();
  const [step, setStep] = useState<Step>("idle");
  const [transcript, setTranscript] = useState("");
  const [extracted, setExtracted] = useState<ExtractedIntent | null>(null);
  const [error, setError] = useState("");
  const [execError, setExecError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const stopListeningRef = useRef<(() => void) | null>(null);

  const handleResult = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript((prev) => (prev ? prev + " " + text : text));
    } else {
      setTranscript((prev) => {
        const base = prev.split(" ").slice(0, -1).join(" ");
        return base ? base + " " + text : text;
      });
    }
  }, []);

  const startMic = () => {
    setError("");
    setTranscript("");
    setStep("idle");
    stopListeningRef.current = startListening(
      handleResult,
      (err) => setError(err)
    );
    setStep("transcript");
  };

  const stopMic = () => {
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
  };

  const handleConfirmTranscript = async () => {
    if (!transcript.trim()) return;
    setStep("extracting");
    setError("");
    try {
      if (voiceMode) {
        const result = await voiceApi.process(transcript);
        if (result.success && result.intent && result.intent !== "unsupported") {
          setStep("done");
          return;
        }
        if (!result.success) {
          setError(result.error ?? "Command could not be completed.");
          setStep("transcript");
          return;
        }
      }
      const result = await intentApi.extract(transcript);
      setExtracted(result);
      if (result.intent === "unsupported") {
        setError(result.message ?? "I couldn't match that to a supported action. Try: schedule a class, cancel class, add student, send reminder.");
        setStep("transcript");
        return;
      }
      if (result.requiresStudentName && !result.studentName?.trim()) {
        setError("Please say who the class is for (e.g. \"with Ashutosh\" or \"for Rahul\").");
        setStep("transcript");
        return;
      }
      setStep("confirm");
    } catch (err: any) {
      setError(err.message ?? "Failed to understand. Try again.");
      setStep("transcript");
    }
  };

  const handleCancelConfirm = () => {
    setExtracted(null);
    setStep("transcript");
  };

  const handleModifyConfirm = () => {
    setExtracted(null);
    setStep("transcript");
  };

  const handleExecute = () => {
    setStep("executing");
    setExecError("");
  };

  const handleExecutionDone = useCallback(() => {
    setStep("done");
    setExtracted(null);
    setTranscript("");
  }, []);

  const handleExecutionError = useCallback((msg: string, isUpgrade?: boolean) => {
    setExecError(msg);
    if (isUpgrade) setShowUpgrade(true);
  }, []);

  const handleReset = () => {
    setStep("idle");
    setTranscript("");
    setExtracted(null);
    setError("");
    setExecError("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <AnimatePresence mode="wait">
        {step === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-lg md:text-xl font-medium">Tap the mic and speak your command</p>
            <MicButton onPress={startMic} />
          </motion.div>
        )}

        {(step === "transcript" || step === "extracting") && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg"
          >
            {step === "transcript" && (
              <div className="flex items-center justify-center gap-2 mb-4" role="status" aria-live="polite">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan/60" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-cyan" />
                </span>
                <span className="text-neon-cyan font-semibold text-lg">Listening...</span>
              </div>
            )}
            <div className="glass rounded-xl p-5 border-2 border-white/10 dark:border-white/10">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your command will appear here..."
                className="w-full min-h-[140px] bg-dark-800 rounded-lg p-4 text-white placeholder-slate-500 border border-white/10 focus:border-neon-cyan outline-none text-base md:text-lg resize-none"
                disabled={step === "extracting"}
              />
              {error && <p className="text-red-500 dark:text-red-400 text-base mt-3 font-medium" role="alert">{error}</p>}
              <div className="flex gap-3 mt-5 flex-wrap">
                <button
                  type="button"
                  onClick={() => { stopMic(); setStep("idle"); setTranscript(""); setError(""); }}
                  className="px-5 py-3 rounded-xl border-2 border-slate-400 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 text-base font-medium"
                >
                  Start over
                </button>
                <button
                  type="button"
                  onClick={stopMic}
                  className="px-5 py-3 rounded-xl border-2 border-slate-400 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 text-base font-medium"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTranscript}
                  disabled={!transcript.trim() || step === "extracting"}
                  className="px-5 py-3 rounded-xl bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan/50 hover:bg-neon-cyan/30 disabled:opacity-50 text-base font-bold"
                >
                  {step === "extracting" ? "Understanding..." : "Confirm"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === "confirm" && extracted && (
        <ConfirmationModal
          extracted={extracted}
          transcript={transcript}
          onCancel={handleCancelConfirm}
          onModify={handleModifyConfirm}
          onExecute={handleExecute}
        />
      )}

      {step === "executing" && extracted && (
        <ExecutionPanel
          extracted={extracted}
          transcript={transcript}
          onDone={handleExecutionDone}
          onError={handleExecutionError}
        />
      )}

      {step === "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-neon-green text-xl md:text-2xl font-bold mb-6">Request completed successfully.</p>
          <button
            onClick={handleReset}
            className="px-8 py-4 rounded-xl bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan/50 hover:bg-neon-cyan/30 text-lg font-bold"
          >
            New command
          </button>
        </motion.div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}

function MicButton({ onPress }: { onPress: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onPress}
      className="relative w-32 h-32 rounded-full glass-strong border-2 border-neon-cyan/50 flex items-center justify-center text-4xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-neon-cyan/30"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        boxShadow: [
          "0 0 20px rgba(0, 245, 255, 0.3)",
          "0 0 40px rgba(0, 245, 255, 0.6)",
          "0 0 20px rgba(0, 245, 255, 0.3)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="text-neon-cyan">🎙️</span>
    </motion.button>
  );
}
