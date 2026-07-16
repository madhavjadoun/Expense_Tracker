import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Moon, Sun, RefreshCw, Calendar } from "lucide-react";
import Button from "./Button";
import { useUserStore } from "../store/useUserStore";
import { useAppStore } from "../store/useAppStore";
import { useState, useEffect, useRef } from "react";

export default function Navbar({ onLogout, onHamburger, isScrolled }) {
  const navigate = useNavigate();
  const location = useLocation();
  const avatar = useUserStore((s) => s.avatar);
  const profile = useUserStore((s) => s.profile);
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const isLightTheme = theme === "light";
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);

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
              src={isLightTheme ? "/logo_black.svg" : "/logo_white.svg"}
              alt="Arthaa Logo"
              style={{ height: "32px", width: "auto", maxWidth: "120px" }}
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

          {/* Theme toggle — always visible */}
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white/85 hover:text-white hover:bg-white/[0.10] hover:border-white/30 transition cursor-pointer"
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
