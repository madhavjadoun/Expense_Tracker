import { NavLink, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { LayoutDashboard, Wallet, BarChart3, User, SplitSquareVertical, HelpCircle, Menu, X } from "lucide-react";
import WorkspaceDropdown from "./WorkspaceDropdown";
import { useAppStore } from "../store/useAppStore";

const mainItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/expenses",  label: "Expenses",  icon: Wallet },
  { to: "/split",     label: "Split Bills", icon: SplitSquareVertical },
];

function SidebarContent({ collapsed, onToggleCollapsed, onNavigate, onHelpOpen }) {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const isLightTheme = theme === "light";

  const displayName = user?.name || "Wade Warren";
  const email = user?.email || "owner-9f6d4d9";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "W";

  return (
    <div className="flex h-full flex-col">
      {/* ── Brand Header ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-xl transition ${
            isLightTheme ? "bg-[#84cc16]/12 ring-1 ring-[#84cc16]/25" : "bg-white/10 ring-1 ring-white/10"
          }`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition ${isLightTheme ? "text-[#84cc16]" : "text-[#EFF2F0]"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
          </div>
          {!collapsed ? (
            <div className="min-w-0 leading-tight">
              <div className="text-base font-bold tracking-tight text-white/95">
                InsightX
              </div>
              <div className={`truncate text-[10px] uppercase tracking-widest font-semibold ${
                isLightTheme ? "text-[#84cc16]" : "text-[#EFF2F0]"
              }`}>
                Premium
              </div>
            </div>
          ) : null}
        </div>

        <button
          onClick={onToggleCollapsed}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-white/50 transition duration-200 hover:bg-white/[0.08] hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {collapsed ? <Menu size={14} /> : <X size={14} />}
        </button>
      </div>

      {/* ── Workspace picker ── */}
      <WorkspaceDropdown collapsed={collapsed} />

      {/* ── Main Category ── */}
      <div className="px-3 mt-4">
        {!collapsed && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 mb-2 select-none">
            Main
          </div>
        )}
        <nav className="space-y-1">
          {mainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                [
                   "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ease-out",
                   isActive
                     ? (isLightTheme
                        ? "bg-[#171d17] text-[#68995E] no-invert font-semibold shadow-sm"
                        : "bg-[#181A1E] text-[#EFF2F0] border border-white/[0.06] font-semibold shadow-sm")
                     : "text-white/60 hover:bg-white/5 hover:text-white/95 group",
                ].join(" ")
              }
            >
              {({ isActive }) => {
                const Icon = item.icon;
                return (
                  <div className="flex items-center gap-3 w-full">
                    <Icon
                      size={18}
                      className={`transition-colors ${
                        isActive
                          ? (isLightTheme ? "text-[#68995E]" : "text-[#EFF2F0]")
                          : "text-white/60 group-hover:text-white/95"
                      }`}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                );
              }}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── System Category ── */}
      <div className="px-3 mt-4">
        {!collapsed && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 mb-2 select-none">
            System
          </div>
        )}
        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onHelpOpen?.();
              onNavigate?.();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition duration-200 text-white/60 hover:bg-white/5 hover:text-white/95 group"
          >
            <HelpCircle
              size={18}
              className="shrink-0 text-white/60 group-hover:text-white/95 transition-colors"
            />
            {!collapsed && <span>Help & Support</span>}
          </button>
        </nav>
      </div>

      {/* ── User Account Category (Bottom widget) ── */}
      <div className="mt-auto border-t border-white/[0.06] p-3">
        {!collapsed && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 mb-2 select-none">
            User Account
          </div>
        )}
        <div
          onClick={() => {
            navigate("/profile");
            onNavigate?.();
          }}
          className="flex items-center gap-3 rounded-xl p-2 cursor-pointer transition hover:bg-white/5"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[#84cc16] to-[#16a34a] flex items-center justify-center text-sm font-semibold text-white shadow-md">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-xs font-semibold text-white/90 truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-white/40 truncate">{email}</div>
            </div>
          )}
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
  onHelpOpen,
}) {
  const theme = useAppStore((s) => s.theme);

  if (variant === "mobile") {
    return (
      <div className="h-full">
        <SidebarContent
          collapsed={false}
          onToggleCollapsed={() => {}}
          onNavigate={onNavigate}
          onHelpOpen={onHelpOpen}
        />
      </div>
    );
  }

  return (
    <Motion.aside
      animate={{ width: collapsed ? 84 : 264 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={`sticky top-0 hidden h-screen shrink-0 border-r border-white/[0.05] lg:block transition-colors duration-300 backdrop-blur-md ${
        theme === "light" ? "bg-[#212b21]/88" : "bg-[#0C0D0F]/90"
      }`}
    >
      <SidebarContent
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        onHelpOpen={onHelpOpen}
      />
    </Motion.aside>
  );
}
