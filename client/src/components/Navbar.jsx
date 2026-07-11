import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Moon, Sun, RefreshCw, Calendar, Bell } from "lucide-react";
import Button from "./Button";
import { useUserStore } from "../store/useUserStore";
import { useAppStore } from "../store/useAppStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useState, useEffect, useRef } from "react";

export default function Navbar({ onLogout, onHamburger }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const avatar = useUserStore((s) => s.avatar);
  const profile = useUserStore((s) => s.profile);
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const isLightTheme = theme === "light";
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

  const pageTitle = (() => {
    switch (location.pathname) {
      case "/dashboard": return "Dashboard";
      case "/expenses": return "Expenses";
      case "/analytics": return "Analytics";
      case "/split": return "Split Bills";
      case "/profile": return "Profile Settings";
      default: return "Dashboard";
    }
  })();

  return (
    <header className="z-40 bg-transparent px-3 py-4 sm:px-6 sm:py-6 md:px-8">
      <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Hamburger & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onHamburger}
            className="inline-flex rounded-xl border border-white/15 bg-white/[0.05] px-2.5 py-2.5 text-xs text-white/85 transition hover:bg-white/[0.10] hover:text-white hover:border-white/30 lg:hidden animate-pulse"
            aria-label="Open menu"
          >
            Menu
          </button>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white/95 truncate max-w-[120px] sm:max-w-none">
            {pageTitle}
          </h1>
        </div>


        {/* Right Side: Action utilities */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Reload / Refresh icon button */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white/85 hover:text-white hover:bg-white/[0.10] hover:border-white/30 transition cursor-pointer"
            title="Reload application"
          >
            <RefreshCw size={17} />
          </button>



          {/* Notifications button */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white/85 hover:text-white hover:bg-white/[0.10] hover:border-white/30 transition cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 ? (
                <span className={`absolute -right-0.5 -top-0.5 min-w-3.5 rounded-full px-1 text-center text-[8px] font-bold text-black ${
                  isLightTheme ? "bg-[#84cc16]" : "bg-[#EFF2F0]"
                }`}>
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
                  className={`absolute right-0 mt-2 w-80 rounded-2xl border border-white/[0.12] p-3 shadow-[0_20px_60px_rgba(0,0,0,.65)] backdrop-blur-xl ${
                    isLightTheme ? "bg-[#0d0f14]/95" : "bg-[#15171A]/95"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-white/85">
                      Notifications
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-white/60 transition hover:bg-white/10 hover:text-white/80"
                      >
                        Read all
                      </button>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-white/60 transition hover:bg-white/10 hover:text-white/80"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-xs text-white/50">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`rounded-xl border px-3 py-2 text-xs ${n.type === "error"
                              ? "border-red-500/20 bg-red-500/10 text-red-200"
                              : n.type === "success"
                                ? (isLightTheme ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-white/12 bg-white/5 text-white/90")
                                : "border-white/[0.08] bg-white/[0.03] text-white/75"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="line-clamp-2">{n.message}</div>
                            {!n.read ? (
                              <span className={`h-2 w-2 shrink-0 rounded-full ${
                                isLightTheme ? "bg-[#84cc16]/80" : "bg-[#EFF2F0]"
                              }`} />
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

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white/85 hover:text-white hover:bg-white/[0.10] hover:border-white/30 transition cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Currency dropdown selector - hidden on small mobile */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="hidden sm:block rounded-xl border border-white/15 bg-white/[0.05] px-2 py-1.5 text-xs text-white/85 outline-none hover:bg-white/[0.10] hover:border-white/30 transition focus:ring-2 focus:ring-[#84cc16]/15 cursor-pointer max-w-[60px] h-10"
          >
            <option value="INR" className="bg-[#090b0e]">INR</option>
            <option value="USD" className="bg-[#090b0e]">USD</option>
            <option value="EUR" className="bg-[#090b0e]">EUR</option>
          </select>

          {/* Profile Image & Logout */}
          <Motion.button
            type="button"
            onClick={() => navigate("/profile")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#84cc16]/20 to-[#16a34a]/15 ring-1 ring-white/18 overflow-hidden cursor-pointer shrink-0"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Profile avatar"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            ) : (
              <span className="text-xs font-semibold text-white/80">{initials}</span>
            )}
          </Motion.button>

          <Button variant="ghost" className="hidden md:inline-flex border border-white/15 bg-white/[0.05] px-4.5 py-2.5 rounded-xl text-xs hover:bg-white/[0.10] hover:border-white/30 text-white/85 hover:text-white" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
