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
        className="glass rounded-2xl p-6 w-full max-w-md border border-red-500/30"
      >
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => onDone()}
          className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5"
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
      className="glass rounded-2xl p-6 w-full max-w-md border border-neon-cyan/20"
    >
      <h3 className="text-neon-cyan font-medium mb-4">Executing</h3>
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {STEPS.slice(0, currentStep + 1).map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 text-sm ${
                i < currentStep ? "text-slate-500" : i === currentStep ? "text-neon-cyan" : "text-slate-600"
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">
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
