import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useVoiceMode } from "../context/VoiceModeContext";

const nav = [
  { to: "/dashboard", label: "Assistant", icon: "🎙️", roles: ["TEACHER", "MANAGER"] },
  { to: "/students", label: "Students", icon: "👥", roles: ["TEACHER", "MANAGER"] },
  { to: "/calendar", label: "Calendar", icon: "📅", roles: ["TEACHER", "MANAGER"] },
  { to: "/notifications", label: "Notifications", icon: "🔔", roles: ["TEACHER", "MANAGER"] },
  { to: "/admin", label: "Admin", icon: "⚙️", adminOnly: true },
];

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { voiceMode, toggleVoiceMode } = useVoiceMode();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-dark-900">
      <aside className="w-56 glass border-r border-slate-200 dark:border-white/5 flex flex-col fixed left-0 top-0 bottom-0 z-10">
        <div className="p-4 border-b border-slate-200 dark:border-white/5">
          <h1 className="font-bold text-neon-cyan text-lg">ClassAssist Pro</h1>
          <p className="text-slate-600 dark:text-slate-500 text-sm mt-1">{user?.name} · {user?.role}</p>
          {DEMO_MODE && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Demo
            </span>
          )}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((item) => {
            if (item.adminOnly && user?.role !== "ADMIN") return null;
            if ("roles" in item && item.roles && user?.role && !item.roles.includes(user.role)) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    isActive
                      ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-2 border-t border-white/5 space-y-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full px-3 py-2 rounded-lg text-slate-400 hover:text-neon-cyan hover:bg-white/5 transition text-left flex items-center gap-2 text-base"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <button
            type="button"
            onClick={toggleVoiceMode}
            className={`w-full px-3 py-2 rounded-lg transition text-left flex items-center gap-2 text-base ${
              voiceMode ? "text-neon-cyan bg-neon-cyan/10 dark:bg-neon-cyan/10" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
            }`}
            aria-label={voiceMode ? "Voice mode on" : "Voice mode off"}
          >
            <span>🎙️</span>
            <span>Voice {voiceMode ? "On" : "Off"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition text-left text-base"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-56 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
