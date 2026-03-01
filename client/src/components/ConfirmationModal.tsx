import { useEffect } from "react";
import { motion } from "framer-motion";
import { speak, cancelSpeech } from "../lib/speech";
import type { ExtractedIntent } from "../types/api";

const INTENT_LABELS: Record<string, string> = {
  schedule_class: "Schedule a class",
  cancel_class: "Cancel a class",
  reschedule_class: "Reschedule a class",
  add_student: "Add a student",
  send_reminder: "Send a reminder",
};

function getSummary(intent: ExtractedIntent): string {
  switch (intent.intent) {
    case "schedule_class":
      return `schedule a class for ${intent.studentName ?? "student"} in ${intent.subject ?? "subject"} on ${intent.date ?? "date"} at ${intent.time ?? "time"}`;
    case "cancel_class":
      return `cancel the class for ${intent.studentName ?? intent.subject ?? "that student"} on ${intent.date ?? "that date"}`;
    case "reschedule_class":
      return `reschedule the class to ${intent.newDate ?? intent.date} at ${intent.newTime ?? intent.time}`;
    case "add_student":
      return `add student ${intent.studentName ?? ""}`;
    case "send_reminder":
      return `send a reminder for ${intent.studentName ?? intent.subject ?? "the class"} on ${intent.date ?? "that date"}`;
    default:
      return "do that";
  }
}

interface Props {
  extracted: ExtractedIntent;
  transcript: string;
  onCancel: () => void;
  onModify: () => void;
  onExecute: () => void;
}

export default function ConfirmationModal({ extracted, transcript, onCancel, onModify, onExecute }: Props) {
  useEffect(() => {
    const summary = getSummary(extracted);
    speak(`I understood that you want to ${summary}. Shall I proceed?`);
    return () => cancelSpeech();
  }, [extracted]);

  const fields = [
    extracted.studentName && { label: "Student", value: extracted.studentName },
    extracted.subject && { label: "Subject", value: extracted.subject },
    extracted.date && { label: "Date", value: extracted.date },
    extracted.time && { label: "Time", value: extracted.time },
    extracted.newDate && { label: "New date", value: extracted.newDate },
    extracted.newTime && { label: "New time", value: extracted.newTime },
    extracted.message && { label: "Message", value: extracted.message },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl p-6 w-full max-w-md border border-neon-cyan/20 shadow-2xl shadow-neon-cyan/10"
      >
        <h2 className="text-xl font-semibold text-neon-cyan mb-4">Here's what I understood</h2>
        <p className="text-slate-400 text-sm mb-4">{INTENT_LABELS[extracted.intent] ?? extracted.intent}</p>
        <div className="space-y-2 mb-6">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between text-sm">
              <span className="text-slate-500">{f.label}</span>
              <span className="text-white">{f.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onModify}
            className="flex-1 py-2 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5"
          >
            Modify
          </button>
          <button
            onClick={onExecute}
            className="flex-1 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30"
          >
            Execute
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
