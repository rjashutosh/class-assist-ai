import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { classesApi } from "../lib/api";
import type { Class } from "../types/api";

export default function Calendar() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<Class | null>(null);

  const start = new Date(month.year, month.month, 1);
  const end = new Date(month.year, month.month + 1, 0);

  useEffect(() => {
    setLoading(true);
    classesApi
      .list({ from: start.toISOString(), to: end.toISOString() })
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month.year, month.month]);

  const prevMonth = () => {
    if (month.month === 0) setMonth({ year: month.year - 1, month: 11 });
    else setMonth({ year: month.year, month: month.month - 1 });
  };
  const nextMonth = () => {
    if (month.month === 11) setMonth({ year: month.year + 1, month: 0 });
    else setMonth({ year: month.year, month: month.month + 1 });
  };

  const getStatusColor = (status: string) => {
    if (status === "UPCOMING") return "bg-blue-500/30 border-blue-500/50 text-blue-300";
    if (status === "COMPLETED") return "bg-green-500/30 border-green-500/50 text-green-300";
    return "bg-red-500/30 border-red-500/50 text-red-300";
  };

  const monthName = start.toLocaleString("default", { month: "long", year: "numeric" });
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const firstDay = new Date(month.year, month.month, 1).getDay();

  const daySlots: { day: number | null; classes: Class[] }[] = [];
  for (let i = 0; i < firstDay; i++) daySlots.push({ day: null, classes: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${month.year}-${String(month.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayClasses = classes.filter((c) => c.dateTime.startsWith(dateStr));
    daySlots.push({ day: d, classes: dayClasses });
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-slate-400 text-sm mt-1">Monthly view · Blue: Upcoming, Green: Done, Red: Cancelled</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="px-3 py-1 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5"
          >
            ←
          </button>
          <span className="px-4 py-1 text-white font-medium">{monthName}</span>
          <button
            onClick={nextMonth}
            className="px-3 py-1 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5"
          >
            →
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-xl border border-white/10 overflow-hidden"
      >
        <div className="grid grid-cols-7 gap-px bg-white/5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="p-2 text-center text-slate-500 text-sm font-medium bg-dark-800">
              {d}
            </div>
          ))}
          {daySlots.map((slot, i) => (
            <div
              key={i}
              className="min-h-[80px] p-1 bg-dark-800 flex flex-col gap-0.5"
            >
              {slot.day != null && (
                <span className="text-slate-500 text-xs font-medium">{slot.day}</span>
              )}
              {slot.classes.length > 0 &&
                slot.classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`text-left text-xs p-1.5 rounded border truncate ${getStatusColor(c.status)}`}
                    title={`${c.subject} with ${c.student.name} at ${new Date(c.dateTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })}`}
                  >
                    {c.subject} · {c.student.name} · {new Date(c.dateTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 w-full max-w-md border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{selected.subject}</h3>
              <p className="text-slate-400 text-sm">Student: {selected.student.name}</p>
              <p className="text-slate-400 text-sm">Date: {new Date(selected.dateTime).toLocaleString()}</p>
              <p className="text-slate-400 text-sm">Status: {selected.status}</p>
              {selected.meetingLink && (
                <a
                  href={selected.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-cyan text-sm mt-2 inline-block"
                >
                  Meeting link
                </a>
              )}
              <button
                onClick={() => setSelected(null)}
                className="mt-4 w-full py-2 rounded-xl border border-white/20 text-slate-300"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
