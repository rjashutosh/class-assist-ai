import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { notificationsApi } from "../lib/api";

export default function Notifications() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.list().then(setList).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400 text-sm mt-1">Mock delivery log (WhatsApp, meeting invites, reminders)</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-xl border border-white/10 overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No notifications yet.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {list.map((n) => (
              <li key={n.id} className="px-4 py-3 hover:bg-white/5">
                <div className="flex justify-between items-start">
                  <span className="text-neon-cyan text-sm font-medium">{n.type}</span>
                  <span className="text-slate-500 text-xs">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">To: {n.recipient}</p>
                <p className="text-white text-sm mt-0.5">{n.message}</p>
                <p className="text-slate-500 text-xs mt-1">Status: {n.status}</p>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
