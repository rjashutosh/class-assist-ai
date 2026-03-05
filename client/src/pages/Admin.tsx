import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { adminApi } from "../lib/api";

interface AccountWithDetails {
  id: string;
  subscriptionTier: string;
  users: { id: string; email: string; name: string; role: string }[];
  _count: { classes: number; students: number };
}

interface UsageRow {
  id: string;
  subscriptionTier: string;
  _count: { classes: number; students: number };
  classesThisMonth: number;
}

interface AnalyticsData {
  totalAccounts: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  voiceCommandsUsage: number;
  classesCreatedThisMonth: number;
  classesPerAccount: { accountId: string; count: number }[];
}

export default function Admin() {
  const [accounts, setAccounts] = useState<AccountWithDetails[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"analytics" | "accounts" | "create">("analytics");
  const [newTier, setNewTier] = useState<"BASIC" | "PRO">("BASIC");
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "TEACHER" as "TEACHER" | "MANAGER",
    accountId: "",
  });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([adminApi.accounts(), adminApi.usage(), adminApi.analytics().catch(() => null)])
      .then(([a, u, ax]) => {
        setAccounts(a);
        setUsage(u);
        setAnalytics(ax ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage("");
    try {
      const acc = await adminApi.createAccount(newTier);
      setMessage(`Account created: ${acc.id}`);
      setAccounts((prev) => [...prev, { ...acc, users: [], _count: { classes: 0, students: 0 } }]);
    } catch (err: any) {
      setMessage(err.message ?? "Failed");
    }
    setCreating(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.accountId) {
      setMessage("Select an account");
      return;
    }
    setCreating(true);
    setMessage("");
    try {
      await adminApi.createUser(newUser);
      setMessage("User created. They can log in with the given email/password.");
      setNewUser((prev) => ({ ...prev, email: "", password: "", name: "" }));
      const [a] = await Promise.all([adminApi.accounts()]);
      setAccounts(a);
    } catch (err: any) {
      setMessage(err.message ?? "Failed");
    }
    setCreating(false);
  };

  const usageMap = Object.fromEntries(usage.map((u) => [u.id, u.classesThisMonth]));

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Create accounts, assign users, view usage</p>
      </motion.div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("analytics")}
          className={`px-4 py-2 rounded-xl ${tab === "analytics" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50" : "border border-white/20 text-slate-400"}`}
        >
          Analytics
        </button>
        <button
          onClick={() => setTab("accounts")}
          className={`px-4 py-2 rounded-xl ${tab === "accounts" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50" : "border border-white/20 text-slate-400"}`}
        >
          Accounts & usage
        </button>
        <button
          onClick={() => setTab("create")}
          className={`px-4 py-2 rounded-xl ${tab === "create" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50" : "border border-white/20 text-slate-400"}`}
        >
          Create
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm">
          {message}
        </div>
      )}

      {tab === "analytics" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {loading || !analytics ? (
            <div className="p-8 text-center text-slate-500">Loading analytics...</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div className="glass rounded-xl p-5 border border-white/10">
                  <p className="text-slate-400 text-sm font-medium">Total Accounts</p>
                  <p className="text-2xl font-bold text-white mt-1">{analytics.totalAccounts}</p>
                </div>
                <div className="glass rounded-xl p-5 border border-white/10">
                  <p className="text-slate-400 text-sm font-medium">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-neon-cyan mt-1">{analytics.activeSubscriptions}</p>
                </div>
                <div className="glass rounded-xl p-5 border border-white/10">
                  <p className="text-slate-400 text-sm font-medium">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-neon-green mt-1">${analytics.monthlyRevenue}</p>
                </div>
                <div className="glass rounded-xl p-5 border border-white/10">
                  <p className="text-slate-400 text-sm font-medium">Voice Commands (month)</p>
                  <p className="text-2xl font-bold text-white mt-1">{analytics.voiceCommandsUsage}</p>
                </div>
                <div className="glass rounded-xl p-5 border border-white/10">
                  <p className="text-slate-400 text-sm font-medium">Classes This Month</p>
                  <p className="text-2xl font-bold text-white mt-1">{analytics.classesCreatedThisMonth}</p>
                </div>
              </div>
              {analytics.classesPerAccount.length > 0 && (
                <div className="glass rounded-xl border border-white/10 overflow-hidden">
                  <h2 className="p-4 text-lg font-medium text-white border-b border-white/10">Classes per account</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="p-4 text-slate-400 font-medium">Account ID</th>
                          <th className="p-4 text-slate-400 font-medium">Classes (this month)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.classesPerAccount.map((row) => (
                          <tr key={row.accountId} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4 text-white font-mono text-sm">{row.accountId.slice(0, 12)}...</td>
                            <td className="p-4 text-neon-cyan">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {tab === "accounts" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-xl border border-white/10 overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-slate-400 font-medium">Account ID</th>
                    <th className="p-4 text-slate-400 font-medium">Tier</th>
                    <th className="p-4 text-slate-400 font-medium">Users</th>
                    <th className="p-4 text-slate-400 font-medium">Classes</th>
                    <th className="p-4 text-slate-400 font-medium">Students</th>
                    <th className="p-4 text-slate-400 font-medium">This month</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 text-white font-mono text-sm">{acc.id.slice(0, 8)}...</td>
                      <td className="p-4">
                        <span className={acc.subscriptionTier === "PRO" ? "text-neon-green" : "text-slate-400"}>
                          {acc.subscriptionTier}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {acc.users.map((u) => `${u.name} (${u.role})`).join(", ") || "—"}
                      </td>
                      <td className="p-4 text-slate-400">{acc._count.classes}</td>
                      <td className="p-4 text-slate-400">{acc._count.students}</td>
                      <td className="p-4 text-neon-cyan">{usageMap[acc.id] ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {tab === "create" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <div className="glass rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-medium text-neon-cyan mb-4">Create account</h2>
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <label className="block text-slate-400 text-sm">Tier</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value as "BASIC" | "PRO")}
                className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white"
              >
                <option value="BASIC">BASIC</option>
                <option value="PRO">PRO</option>
              </select>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30 disabled:opacity-50"
              >
                Create account
              </button>
            </form>
          </div>
          <div className="glass rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-medium text-neon-cyan mb-4">Create user (Teacher / Manager)</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <select
                value={newUser.accountId}
                onChange={(e) => setNewUser((p) => ({ ...p, accountId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white"
                required
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.id.slice(0, 8)}... ({acc.subscriptionTier})
                  </option>
                ))}
              </select>
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white placeholder-slate-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white placeholder-slate-500"
                required
                minLength={6}
              />
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white placeholder-slate-500"
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as "TEACHER" | "MANAGER" }))}
                className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white"
              >
                <option value="TEACHER">Teacher</option>
                <option value="MANAGER">Manager</option>
              </select>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30 disabled:opacity-50"
              >
                Create user
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}
