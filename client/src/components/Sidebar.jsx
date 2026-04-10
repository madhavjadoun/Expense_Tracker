import { NavLink } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { LayoutDashboard, Wallet, BarChart3, User } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

function SidebarContent({ collapsed, onToggleCollapsed, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/12 ring-1 ring-emerald-400/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-emerald-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {/* Wallet */}
              <rect x="3" y="7" width="18" height="10" rx="2" />
              <circle cx="17" cy="12" r="1.5" />

              {/* Piggy bank (top-right small) */}
              <circle cx="16" cy="6" r="2" />
              <circle cx="17.5" cy="6" r="0.3" fill="currentColor" />
              <path d="M14.5 7.5 L13.5 8" />
            </svg>
          </div>
          {!collapsed ? (
            <div className="min-w-0 leading-tight">
              <div className="flex items-center font-semibold text-white/90">
                <span className="text-base">E</span>
                <span className="tracking-wide">xpense Tracker</span>
              </div>
              <div className="truncate text-xs text-white/45">
                Premium workspace
              </div>
            </div>
          ) : null}
        </div>

        <button
          onClick={onToggleCollapsed}
          className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/60 transition duration-200 hover:bg-white/5 hover:text-white/80"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition duration-200",
                isActive
                  ? "rounded-xl border border-white/10 bg-white/5 text-white backdrop-blur-md"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90 group",
              ].join(" ")
            }
          >
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={`transition-colors ${isActive ? "text-white" : "text-white/80 group-hover:text-white/95"}`} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed ? (
                    <span className="text-[10px] text-white/35">↗</span>
                  ) : null}
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-4">
        <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
          <div className="text-xs font-medium text-white/70">
            {collapsed ? "Pro" : "Pro plan"}
          </div>
          {!collapsed ? (
            <div className="mt-1 text-xs text-white/45">
              Clean UX, smooth motion.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  variant = "desktop", // "desktop" | "mobile"
  onNavigate,
}) {
  if (variant === "mobile") {
    return (
      <div className="h-full">
        <SidebarContent
          collapsed={false}
          onToggleCollapsed={() => {}}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  return (
    <Motion.aside
      animate={{ width: collapsed ? 84 : 264 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="sticky top-0 hidden h-screen shrink-0 border-r border-white/10 bg-gradient-to-b from-[#0f172a] to-[#020617] backdrop-blur-xl lg:block"
    >
      <SidebarContent
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
      />
    </Motion.aside>
  );
}

