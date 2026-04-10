import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import Button from "./Button";
import { useUserStore } from "../store/useUserStore";
import { useAppStore } from "../store/useAppStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useState, useEffect, useRef } from "react";

export default function Navbar({ onLogout, onHamburger }) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const avatar = useUserStore((s) => s.avatar);
  const profile = useUserStore((s) => s.profile);
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifOpen]);

  const displayName = profile?.name || user?.name || "User";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020617]/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onHamburger}
            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/7 hover:text-white/90 lg:hidden"
            aria-label="Open menu"
          >
            Menu
          </button>


          <div className="lg:hidden">
            <div className="text-xs text-white/50">Workspace</div>
            <div className="text-sm font-semibold text-white/90">
              Personal Finance
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/75 outline-none hover:bg-white/8 transition focus:ring-2 focus:ring-emerald-400/15 cursor-pointer max-w-[60px]"
          >
            <option value="INR" className="bg-[#020617]">INR</option>
            <option value="USD" className="bg-[#020617]">USD</option>
            <option value="EUR" className="bg-[#020617]">EUR</option>
          </select>
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/8 hover:text-white"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/8 hover:text-white"
              aria-label="Notifications"
            >
              <span className="text-sm">🔔</span>
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-emerald-500 px-1 text-center text-[10px] font-semibold text-emerald-950">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            <AnimatePresence>
              {notifOpen ? (
                <Motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/12 bg-[#020617]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,.45)] backdrop-blur-xl"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-white/85">
                      Notifications
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[10px] text-white/55 hover:text-white/80"
                      >
                        Mark read
                      </button>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-[10px] text-white/55 hover:text-white/80"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-3 text-xs text-white/50">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`rounded-xl border px-3 py-2 text-xs ${n.type === "error"
                              ? "border-red-400/25 bg-red-500/10 text-red-100"
                              : n.type === "success"
                                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                                : "border-white/10 bg-white/4 text-white/75"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="line-clamp-2">{n.message}</div>
                            {!n.read ? (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/80" />
                            ) : null}
                          </div>
                          <div className="mt-1 text-[10px] text-white/45">
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <Motion.button
            type="button"
            onClick={() => navigate("/profile")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500/20 to-emerald-500/15 ring-1 ring-white/10 overflow-hidden cursor-pointer"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Profile avatar"
                className="h-full w-full object-cover profile-avatar"
                style={{ filter: 'none', WebkitFilter: 'none' }}
              />
            ) : (
              <span className="text-xs font-semibold text-white/80">{initials}</span>
            )}
          </Motion.button>
          <Button variant="subtle" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

