import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/dashboard", label: "Assistant", icon: "🎙️", roles: ["TEACHER", "MANAGER"] },
  { to: "/students", label: "Students", icon: "👥", roles: ["TEACHER", "MANAGER"] },
  { to: "/calendar", label: "Calendar", icon: "📅", roles: ["TEACHER", "MANAGER"] },
  { to: "/notifications", label: "Notifications", icon: "🔔", roles: ["TEACHER", "MANAGER"] },
  { to: "/admin", label: "Admin", icon: "⚙️", adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-dark-900">
      <aside className="w-56 glass border-r border-white/5 flex flex-col fixed left-0 top-0 bottom-0 z-10">
        <div className="p-4 border-b border-white/5">
          <h1 className="font-bold text-neon-cyan text-lg">ClassAssist AI</h1>
          <p className="text-slate-500 text-xs mt-1">{user?.name} · {user?.role}</p>
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
        <div className="p-2 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition text-left"
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
