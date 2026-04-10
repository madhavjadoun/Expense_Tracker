import { AnimatePresence, motion as Motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAppStore } from "../store/useAppStore";

export default function Layout({ onLogout }) {
  const ui = useAppStore((s) => s.ui);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const toggleSidebarOpen = useAppStore((s) => s.toggleSidebarOpen);
  const toggleSidebarCollapsed = useAppStore((s) => s.toggleSidebarCollapsed);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        <Sidebar
          collapsed={ui?.sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
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
                />
              </div>
            </Motion.div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
