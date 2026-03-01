import { motion } from "framer-motion";
import VoicePanel from "../components/VoicePanel";

export default function Dashboard() {
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Voice Assistant</h1>
        <p className="text-slate-400 text-sm mt-1">
          Say: schedule a class, cancel class, add student, send reminder
        </p>
      </motion.div>
      <VoicePanel />
    </div>
  );
}
