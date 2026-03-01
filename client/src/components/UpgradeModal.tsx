import { motion } from "framer-motion";

interface Props {
  onClose: () => void;
}

export default function UpgradeModal({ onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl p-6 w-full max-w-sm border border-neon-purple/30 shadow-2xl"
      >
        <h2 className="text-xl font-semibold text-neon-purple mb-2">Upgrade to PRO</h2>
        <p className="text-slate-400 text-sm mb-4">
          You've reached the monthly limit for BASIC. Upgrade to PRO for unlimited classes and reminder automation.
        </p>
        <ul className="text-slate-300 text-sm space-y-1 mb-6">
          <li>• Unlimited classes per month</li>
          <li>• Send reminders</li>
        </ul>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-neon-purple/20 text-neon-purple border border-neon-purple/50"
        >
          Maybe later
        </button>
      </motion.div>
    </motion.div>
  );
}
