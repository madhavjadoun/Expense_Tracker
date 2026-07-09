import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import HelpPanel from "./HelpPanel";
import { useAppStore } from "../store/useAppStore";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

export default function Layout({ onLogout }) {
  const ui = useAppStore((s) => s.ui);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const toggleSidebarOpen = useAppStore((s) => s.toggleSidebarOpen);
  const toggleSidebarCollapsed = useAppStore((s) => s.toggleSidebarCollapsed);
  const fetchExpenses = useAppStore((s) => s.fetchExpenses);
  const user = useAppStore((s) => s.user);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const [helpOpen, setHelpOpen] = useState(false);

  // Re-fetch expenses from the backend whenever the active workspace changes.
  // Layout wraps all authenticated pages so this single effect covers
  // Dashboard, Expenses, Analytics and Split without any per-page logic.
  const lastFetchKey = useRef(null);
  useEffect(() => {
    if (!user?.uid || !activeWorkspaceId) return;
    const key = `${user.uid}|${activeWorkspaceId}`;
    if (lastFetchKey.current === key) return; // skip identical calls (e.g. initial render)
    lastFetchKey.current = key;
    fetchExpenses(activeWorkspaceId);
  }, [user?.uid, activeWorkspaceId, fetchExpenses]);

  return (
    <div className="min-h-screen">
      {/* Premium ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#0b1220] transition-colors duration-300">
        <div className="absolute top-[-100px] right-[-100px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.07),transparent_70%)] blur-3xl" />
        <div className="absolute top-[20%] left-[-150px] h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.05),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-150px] left-[30%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.04),transparent_70%)] blur-3xl" />
      </div>
      <div className="mx-auto flex min-h-screen w-full">
        <Sidebar
          collapsed={ui?.sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
          onHelpOpen={() => setHelpOpen(true)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            onLogout={onLogout}
            onToggleSidebar={toggleSidebarCollapsed}
            onHamburger={toggleSidebarOpen}
          />

          <div className="min-w-0 flex-1 px-4 py-6 sm:px-6">
            <div className="min-w-0">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {ui?.sidebarOpen ? (
          <Motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              type="button"
            />
            <Motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="absolute left-0 top-0 h-full w-[280px] border-r border-white/10 bg-[#020617]/80 backdrop-blur-xl"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white/90">
                    Menu
                  </div>
                  <button
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/7"
                    onClick={() => setSidebarOpen(false)}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="h-[calc(100%-64px)]">
                <Sidebar
                  variant="mobile"
                  onNavigate={() => setSidebarOpen(false)}
                  onHelpOpen={() => { setSidebarOpen(false); setHelpOpen(true); }}
                />
              </div>
            </Motion.div>
          </Motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Global Help Panel ── */}
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
