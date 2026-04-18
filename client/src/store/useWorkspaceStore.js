import { create } from "zustand";
import { usePlanStore, isWorkspaceLimitReached, getWorkspaceLimit } from "./usePlanStore";
import { api } from "../services/api";

const LS_WS_KEY  = "xpense_workspaces";
const LS_CUR_KEY = "xpense_active_workspace";

function loadFromLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveToLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const DEFAULT_WORKSPACE = {
  id: "default",
  name: "Personal Finance",
  createdAt: new Date("2026-01-01").toISOString(),
  role: "owner"
};

const initialWorkspaces = loadFromLS(LS_WS_KEY, [DEFAULT_WORKSPACE]).map(ws => {
  // Legacy local workspaces created before RBAC didn't have a role.
  // Since there was no join system before, any legacy workspace was originally created by this user.
  if (!ws.role) return { ...ws, role: "owner" };
  return ws;
});
const initialActiveId   = loadFromLS(LS_CUR_KEY, "default");

export const useWorkspaceStore = create((set, get) => ({
  workspaces:        initialWorkspaces,
  activeWorkspaceId: initialActiveId,

  get activeWorkspace() {
    return get().workspaces.find((w) => w.id === get().activeWorkspaceId)
      ?? get().workspaces[0]
      ?? DEFAULT_WORKSPACE;
  },

  setActiveWorkspace: (id) => {
    saveToLS(LS_CUR_KEY, id);
    set({ activeWorkspaceId: id });
  },

  createWorkspace: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, message: "Name cannot be empty." };

    const planId  = usePlanStore.getState().planId;
    const current = get().workspaces;
    if (isWorkspaceLimitReached(planId, current.length)) {
      const limit = getWorkspaceLimit(planId);
      return {
        ok: false,
        limitReached: true,
        message: `Workspace limit reached (${limit}/${limit}). Upgrade your plan to create more.`,
      };
    }

    const newWs = {
      id:        crypto.randomUUID(),
      name:      trimmed,
      createdAt: new Date().toISOString(),
      role: "owner",
    };
    
    // Sync with backend (fire-and-forget for local sync pattern)
    api.createWorkspace(trimmed, newWs.id);

    const next = [...get().workspaces, newWs];
    saveToLS(LS_WS_KEY, next);
    saveToLS(LS_CUR_KEY, newWs.id);
    set({ workspaces: next, activeWorkspaceId: newWs.id });
    return { ok: true, workspace: newWs };
  },

  deleteWorkspace: async (id) => {
    if (id === "default") return { ok: false, message: "Cannot delete default workspace." };

    // ── Optimistic update: remove from UI instantly ──────────────────────
    const prev = get().workspaces;
    const next = prev.filter((w) => w.id !== id);
    saveToLS(LS_WS_KEY, next);
    let activeId = get().activeWorkspaceId;
    if (activeId === id) {
      activeId = next[0]?.id ?? "default";
      saveToLS(LS_CUR_KEY, activeId);
    }
    set({ workspaces: next, activeWorkspaceId: activeId });

    // ── Background API call ──────────────────────────────────────────────
    const res = await api.deleteWorkspace(id);
    if (!res.ok) {
      // Rollback if API explicitly rejects (e.g. 403 not owner)
      saveToLS(LS_WS_KEY, prev);
      saveToLS(LS_CUR_KEY, get().activeWorkspaceId);
      set({ workspaces: prev });
      return res;
    }

    return { ok: true };
  },

  renameWorkspace: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = get().workspaces.map((w) => (w.id === id ? { ...w, name: trimmed } : w));
    saveToLS(LS_WS_KEY, next);
    set({ workspaces: next });
  },
}));
