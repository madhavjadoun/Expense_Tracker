import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Moon, Sun, RefreshCw, Calendar, Bell } from "lucide-react";
import Button from "./Button";
import { useUserStore } from "../store/useUserStore";
import { useAppStore } from "../store/useAppStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useState, useEffect, useRef } from "react";

export default function Navbar({ onLogout, onHamburger, isScrolled }) {
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
    <header className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 border-b px-3 py-4 sm:px-6 sm:py-5 md:px-8 rounded-t-[20px] sm:rounded-t-[28px] ${
      isScrolled 
        ? `backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] ${isLightTheme ? 'bg-[#0e130e]/80 border-white/[0.08]' : 'bg-[#0B0C0F]/80 border-white/[0.05]'}`
        : 'bg-transparent border-transparent'
    }`}>
      <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Hamburger & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onHamburger(); }}
            className="inline-flex rounded-xl border border-white/15 bg-white/[0.05] px-2.5 py-2.5 text-xs text-white/85 transition hover:bg-white/[0.10] hover:text-white hover:border-white/30 lg:hidden"
            aria-label="Open menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {/* Fintra logo for mobile — hidden on lg desktop since sidebar is visible */}
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer lg:hidden"
          >
            <img
              src={isLightTheme ? "/logo_black.png" : "/logo_white.png"}
              alt="Fintra Logo"
              style={{ height: "24px", width: "auto", maxWidth: "95px" }}
              className="object-contain"
            />
          </div>
          {/* Page title — hidden on mobile/tablet, visible on desktop */}
          <h1 className="hidden lg:block text-2xl font-bold tracking-tight text-white/95 truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Right Side: Action utilities */}
        <div className="flex items-center gap-1.5 sm:gap-3">

          {/* Reload — hidden on mobile, visible sm+ */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="hidden sm:grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white/85 hover:text-white hover:bg-white/[0.10] hover:border-white/30 transition cursor-pointer"
            title="Reload application"
          >
            <RefreshCw size={17} />
          </button>

          {/* Notifications — always visible */}
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
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={`fixed inset-x-4 top-20 w-auto sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 rounded-2xl border border-white/[0.08] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl z-50 ${
                    isLightTheme ? "bg-[#090B0A]/95" : "bg-[#0C0D0F]/95"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Notifications</div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-white/50 hover:text-white transition cursor-pointer"
                      >
                        Read all
                      </button>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-[10px] font-bold text-white/50 hover:text-white transition cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center text-xs text-white/35">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`rounded-xl border p-3 text-xs transition duration-200 ${
                            n.type === "error"
                              ? "border-red-500/20 bg-red-500/5 text-red-200"
                              : n.type === "success"
                              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
                              : "border-white/[0.06] bg-white/[0.015] text-white/80 hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="line-clamp-2 leading-relaxed">{n.message}</div>
                            {!n.read ? (
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full mt-1.5 ${
                                isLightTheme ? "bg-[#84cc16]" : "bg-[#EFF2F0]"
                              }`} />
                            ) : null}
                          </div>
                          <div className="mt-1.5 text-[9px] text-white/30 font-medium">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Theme toggle — hidden on mobile */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden sm:grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white/85 hover:text-white hover:bg-white/[0.10] hover:border-white/30 transition cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Currency — hidden on mobile */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="hidden sm:block rounded-xl border border-white/15 bg-white/[0.05] px-2 py-1.5 text-xs text-white/85 outline-none hover:bg-white/[0.10] hover:border-white/30 transition cursor-pointer max-w-[60px] h-10"
          >
            <option value="INR" className="bg-[#090b0e]">INR</option>
            <option value="USD" className="bg-[#090b0e]">USD</option>
            <option value="EUR" className="bg-[#090b0e]">EUR</option>
          </select>

          {/* Profile Avatar — always visible */}
          <Motion.button
            type="button"
            onClick={() => navigate("/profile")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#84cc16]/20 to-[#16a34a]/15 ring-1 ring-white/18 overflow-hidden cursor-pointer shrink-0"
          >
            {avatar ? (
              <img src={avatar} alt="Profile avatar" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            ) : (
              <span className="text-xs font-semibold text-white/80">{initials}</span>
            )}
          </Motion.button>

          {/* SINGLE Logout — icon only on mobile, icon+text on sm+ */}
          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] text-white/85 hover:text-white hover:bg-red-500/10 hover:border-red-400/30 transition cursor-pointer h-10 px-2.5 sm:px-3.5"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="hidden sm:inline text-xs font-semibold">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
