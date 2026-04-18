import { useState, useRef, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Check, Trash2, X, Lock, Link2 } from "lucide-react";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { usePlanStore, getWorkspaceLimit, isWorkspaceLimitReached } from "../store/usePlanStore";
import toast from "react-hot-toast";
import { api } from "../services/api";

// ─── Workspace initials avatar ────────────────────────────────────────────────

function WorkspaceAvatar({ name, size = "sm" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const colors = [
    "from-emerald-500/40 to-teal-500/30 ring-emerald-400/20",
    "from-violet-500/40 to-purple-500/30 ring-violet-400/20",
    "from-blue-500/40 to-cyan-500/30 ring-blue-400/20",
    "from-amber-500/40 to-orange-500/30 ring-amber-400/20",
    "from-rose-500/40 to-pink-500/30 ring-rose-400/20",
  ];
  const colorIndex =
    name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % colors.length;
  const color = colors[colorIndex];

  const sizeClass = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";

  return (
    <div className={`grid shrink-0 place-items-center rounded-lg bg-gradient-to-br ring-1 font-semibold text-white/80 ${color} ${sizeClass}`}>
      {initials || "?"}
    </div>
  );
}

// ─── Create Workspace inline form ─────────────────────────────────────────────

function CreateWorkspaceForm({ onDone, limitReached }) {
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const [value, setValue]       = useState("");
  const [error, setError]       = useState("");
  const inputRef                = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleCreate() {
    const trimmed = value.trim();
    if (!trimmed) return;
    const result = createWorkspace(trimmed);
    if (result?.ok === false) {
      setError(result.message);
      return;
    }
    onDone?.();
  }

  function handleKey(e) {
    if (e.key === "Enter")  handleCreate();
    if (e.key === "Escape") onDone?.();
  }

  if (limitReached) {
    return (
      <div className="border-t border-white/8 px-3 py-3">
        <div className="flex items-start gap-2">
          <Lock size={12} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="text-[11px] leading-relaxed text-amber-200/80">
            Upgrade to create more workspaces.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-white/8 px-2.5 pb-2.5 pt-2">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/38">
        New workspace
      </div>

      {error && (
        <div className="mb-1.5 rounded-lg border border-red-400/20 bg-red-500/8 px-2.5 py-1.5 text-[11px] text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          placeholder="Workspace name…"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={handleKey}
          maxLength={40}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/12 transition"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={!value.trim()}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-emerald-500/85 text-emerald-950 transition hover:bg-emerald-500 disabled:pointer-events-none disabled:opacity-40"
        >
          <Check size={13} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onDone}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/9 hover:text-white/80"
        >
          <X size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Dropdown ─────────────────────────────────────────────────────────────

export default function WorkspaceDropdown({ collapsed }) {
  const workspaces         = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId  = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const deleteWorkspace    = useWorkspaceStore((s) => s.deleteWorkspace);

  // Plan-based workspace limits
  const planId         = usePlanStore((s) => s.planId);
  const wsLimit        = getWorkspaceLimit(planId);
  const wsLimitReached = isWorkspaceLimitReached(planId, workspaces.length);
  const wsLimitLabel   = wsLimit === Infinity ? "∞" : String(wsLimit);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  const [open, setOpen]         = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef             = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setCreating(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function handleSelect(id) {
    setActiveWorkspace(id);
    setOpen(false);
    setCreating(false);
  }

  async function handleInvite(e, workspaceId) {
    e.stopPropagation();
    const toastId = toast.loading("Generating invite link…");
    const result = await api.generateInviteLink(workspaceId);
    if (result.ok) {
      await navigator.clipboard.writeText(result.inviteLink).catch(() => {});
      toast.success("Invite link copied!", { id: toastId });
    } else {
      toast.error(result.message || "Failed to generate link.", { id: toastId });
    }
  }

  // Collapsed sidebar — avatar only
  if (collapsed) {
    return (
      <div className="relative flex justify-center px-2 pb-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="transition hover:opacity-80"
          title={activeWs?.name}
        >
          <WorkspaceAvatar name={activeWs?.name ?? "?"} size="sm" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative px-3 pb-2">
      {/* Trigger */}
      <button
        type="button"
        id="workspace-dropdown-trigger"
        onClick={() => { setOpen((v) => !v); setCreating(false); }}
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-left transition hover:border-white/14 hover:bg-white/7"
      >
        <WorkspaceAvatar name={activeWs?.name ?? "?"} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-white/82">{activeWs?.name}</div>
          <div className="text-[10px] text-white/38">
            {workspaces.length} / {wsLimitLabel} workspace{wsLimit !== 1 ? "s" : ""}
          </div>
        </div>
        <Motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="shrink-0 text-white/35"
        >
          <ChevronDown size={14} />
        </Motion.span>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <Motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="absolute left-3 right-3 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-white/12 bg-[#0d1224]/95 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            {/* Header with usage */}
            <div className="flex items-center justify-between border-b border-white/7 px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
                Workspaces
              </div>
              <div className={`text-[10px] font-medium tabular-nums ${
                wsLimitReached ? "text-amber-300" : "text-white/35"
              }`}>
                {workspaces.length} / {wsLimitLabel}
              </div>
            </div>

            {/* Workspace list */}
            <div className="max-h-48 overflow-y-auto px-2 py-1.5">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <div key={ws.id} className="group flex items-center gap-2 rounded-xl px-1.5 py-1">
                    <button
                      type="button"
                      onClick={() => handleSelect(ws.id)}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "text-white/65 hover:bg-white/6 hover:text-white/88"
                      }`}
                    >
                      <WorkspaceAvatar name={ws.name} size="sm" />
                      <div className="min-w-0 flex-1 flex items-center justify-between">
                        <div className="truncate text-xs font-medium">{ws.name}</div>
                        {ws.role && (
                          <div className="ml-2 text-[9px] uppercase tracking-wider text-white/30 border border-white/10 px-1.5 py-0.5 rounded">
                            {ws.role}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <Check size={12} className="shrink-0 text-emerald-400" strokeWidth={2.5} />
                      )}
                    </button>

                    {ws.id !== "default" && (
                      <>
                        {["owner", "admin"].includes(ws.role) && (
                          <button
                            type="button"
                            onClick={(e) => handleInvite(e, ws.id)}
                            className="hidden shrink-0 rounded-lg p-1 text-white/25 transition hover:bg-emerald-500/12 hover:text-emerald-400 group-hover:flex"
                            title="Copy invite link"
                          >
                            <Link2 size={12} />
                          </button>
                        )}
                        {ws.role === "owner" && (
                          <button
                            type="button"
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              const res = await deleteWorkspace(ws.id);
                              if (!res?.ok && res?.message) {
                                toast.error(res.message);
                              }
                            }}
                            className="hidden shrink-0 rounded-lg p-1 text-white/25 transition hover:bg-red-500/12 hover:text-red-400 group-hover:flex"
                            title="Delete workspace"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {wsLimit !== Infinity && (
              <div className="px-3 pb-1">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      wsLimitReached
                        ? "bg-gradient-to-r from-amber-500/85 to-yellow-400/65"
                        : "bg-gradient-to-r from-emerald-500/85 to-teal-400/65"
                    }`}
                    style={{ width: `${Math.min(100, (workspaces.length / wsLimit) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Create form or button */}
            {creating ? (
              <CreateWorkspaceForm
                onDone={() => { setCreating(false); setOpen(false); }}
                limitReached={wsLimitReached}
              />
            ) : (
              <div className="border-t border-white/7 p-2">
                {wsLimitReached ? (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2">
                    <Lock size={12} className="shrink-0 text-amber-400/70" />
                    <span className="text-xs text-amber-300/70">
                      Upgrade to create more workspaces
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="create-workspace-btn"
                    onClick={() => setCreating(true)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/52 transition hover:bg-white/6 hover:text-white/80"
                  >
                    <Plus size={13} strokeWidth={2.2} />
                    Create workspace
                  </button>
                )}
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
