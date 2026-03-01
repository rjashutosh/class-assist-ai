import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 w-full max-w-md border border-white/10"
      >
        <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
          ClassAssist AI
        </h1>
        <p className="text-center text-slate-400 text-sm mb-6">Voice-powered class management</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none transition"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none transition"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30 transition font-medium"
          >
            Sign in
          </button>
        </form>
        <p className="text-slate-500 text-xs mt-4 text-center">
          Demo: teacher@classassist.ai / teacher123 · manager@classassist.ai / manager123 · admin@classassist.ai / admin123
        </p>
      </motion.div>
    </div>
  );
}
