import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { speak, cancelSpeech } from "../lib/speech";
import { executeApi } from "../lib/api";
import type { ExtractedIntent } from "../types/api";

const STEPS = [
  "Processing request...",
  "Performing action...",
  "Generating meeting link...",
  "Sending notifications...",
  "Completed successfully!",
];

interface Props {
  extracted: ExtractedIntent;
  transcript: string;
  onDone: () => void;
  onError: (message: string, isUpgrade?: boolean) => void;
}

export default function ExecutionPanel({ extracted, transcript, onDone, onError }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setCurrentStep(0);
        await new Promise((r) => setTimeout(r, 600));
        if (cancelled) return;
        setCurrentStep(1);
        const body = { ...extracted, transcript };
        const res = await executeApi.execute(body);
        if (cancelled) return;
        if (!res.success) {
          setError("Action could not be completed.");
          return;
        }
        setCurrentStep(2);
        await new Promise((r) => setTimeout(r, 500));
        if (cancelled) return;
        setCurrentStep(3);
        await new Promise((r) => setTimeout(r, 500));
        if (cancelled) return;
        setCurrentStep(4);
        doneRef.current = true;
        speak("Your request has been successfully completed.", () => {
          if (!cancelled) onDone();
        });
      } catch (err: any) {
        if (cancelled) return;
        const msg = err.message ?? "Execution failed";
        const isUpgrade =
          msg.includes("BASIC_LIMIT") ||
          msg.includes("Upgrade") ||
          msg.includes("REMINDER_NOT_ALLOWED");
        setError(msg);
        onError(msg, isUpgrade);
      }
    };
    run();
    return () => {
      cancelled = true;
      cancelSpeech();
    };
  }, [extracted, transcript, onDone, onError]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-2xl p-8 w-full max-w-lg border-2 border-red-500/50 bg-slate-800/50 dark:bg-dark-800"
      >
        <p className="text-red-500 dark:text-red-400 text-lg font-medium mb-6" role="alert">{error}</p>
        <button
          onClick={() => onDone()}
          className="px-6 py-3 rounded-xl border-2 border-slate-400 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 text-lg font-medium"
        >
          Back
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-2xl p-8 w-full max-w-lg border-2 border-neon-cyan/30 dark:border-neon-cyan/30 bg-slate-800/50 dark:bg-dark-800"
    >
      <h3 className="text-neon-cyan font-bold text-xl mb-6">Executing</h3>
      <div className="space-y-4" role="status" aria-live="polite">
        <AnimatePresence mode="wait">
          {STEPS.slice(0, currentStep + 1).map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 text-base md:text-lg ${
                i < currentStep ? "text-slate-500 dark:text-slate-500" : i === currentStep ? "text-neon-cyan font-semibold" : "text-slate-600 dark:text-slate-600"
              }`}
            >
              <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold shrink-0">
                {i < currentStep ? "✓" : i + 1}
              </span>
              {label}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
