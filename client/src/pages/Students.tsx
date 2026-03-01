import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { studentsApi } from "../lib/api";
import type { Student } from "../types/api";

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    studentsApi.list().then(setStudents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const s = await studentsApi.create({ name: name.trim(), email: email || undefined, phone: phone || undefined });
      setStudents((prev) => [...prev, s]);
      setName("");
      setEmail("");
      setPhone("");
    } catch {}
    setAdding(false);
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Students</h1>
        <p className="text-slate-400 text-sm mt-1">Manage students for scheduling</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-xl p-4 mb-6 border border-white/10"
      >
        <h2 className="text-lg font-medium text-neon-cyan mb-3">Add student</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <input
            type="text"
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white placeholder-slate-500 w-40"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white placeholder-slate-500 w-48"
          />
          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white placeholder-slate-500 w-36"
          />
          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2 rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30 disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-xl border border-white/10 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-medium text-white">All students</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No students yet. Add one above or via voice.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {students.map((s) => (
              <li key={s.id} className="px-4 py-3 flex justify-between items-center hover:bg-white/5">
                <span className="text-white font-medium">{s.name}</span>
                <span className="text-slate-500 text-sm">{s.email || s.phone || "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
