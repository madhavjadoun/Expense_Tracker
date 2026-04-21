import { create } from "zustand";
import { usePlanStore, isWorkspaceLimitReached, getWorkspaceLimit } from "./usePlanStore";
import { api } from "../services/api";

// ── Shared (non-user-scoped) key — only used for cold-start before uid is known.
// Once a uid is known, all reads/writes use uid-scoped keys instead.
const LS_WS_KEY_LEGACY  = "xpense_workspaces";
const LS_CUR_KEY_LEGACY = "xpense_active_workspace";

/** Returns the uid-scoped localStorage keys for this user. */
function userKeys(uid) {
  return {
    ws:  `xpense_workspaces_${uid}`,
    cur: `xpense_active_workspace_${uid}`,
  };
}

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
  role: "owner",
};

// ── Cold-start state — always start with a clean default.
// restoreForUser(uid) loads the real user's workspaces once uid is known.
const initialWorkspaces = [DEFAULT_WORKSPACE];
const initialActiveId   = "default";

export const useWorkspaceStore = create((set, get) => ({
  workspaces:        initialWorkspaces,
  activeWorkspaceId: initialActiveId,

  /** The active workspace object — derived, never stored separately. */
  get activeWorkspace() {
    return (
      get().workspaces.find((w) => w.id === get().activeWorkspaceId) ??
      get().workspaces[0] ??
      DEFAULT_WORKSPACE
    );
  },

  setActiveWorkspace: (id) => {
    const uid = get()._uid;
    if (uid) {
      const keys = userKeys(uid);
      saveToLS(keys.cur, id);
    }
    set({ activeWorkspaceId: id });
  },

  /**
   * Called immediately after login with the Firebase uid.
   * Loads this user's uid-scoped workspace data into memory BEFORE
   * initFromServer runs, so the merge has the correct baseline.
   * Falls back to the legacy (unscoped) key for users who logged in
   * before uid-scoped keys were introduced (one-time migration).
   */
  restoreForUser: (uid) => {
    if (!uid) return;
    const keys = userKeys(uid);

    // Only read uid-scoped keys — NEVER fall back to legacy keys.
    // If no uid-scoped key exists this is a new user: keep the default workspace.
    const savedWs  = localStorage.getItem(keys.ws);
    const savedCur = localStorage.getItem(keys.cur);

    let workspaces = null;
    try { if (savedWs)  workspaces = JSON.parse(savedWs);  } catch {}
    let activeId = null;
    try { if (savedCur) activeId   = JSON.parse(savedCur); } catch {}

    if (workspaces && Array.isArray(workspaces) && workspaces.length > 0) {
      const validActiveId = activeId && workspaces.some((w) => w.id === activeId)
        ? activeId : workspaces[0]?.id ?? "default";
      set({ workspaces, activeWorkspaceId: validActiveId, _uid: uid });
    } else {
      // New user: persist the default workspace so it survives next login.
      saveToLS(keys.ws,  [DEFAULT_WORKSPACE]);
      saveToLS(keys.cur, "default");
      set({ workspaces: [DEFAULT_WORKSPACE], activeWorkspaceId: "default", _uid: uid });
    }
  },

  /**
   * Called after the server returns the workspace list for this user.
   * Merges server data with any local-only workspaces (created when the
   * fire-and-forget API call failed, or created offline) so nothing is lost.
   */
  initFromServer: (serverWorkspaces) => {
    const uid = get()._uid;
    if (!Array.isArray(serverWorkspaces)) return;

    const localWorkspaces = get().workspaces;

    // Build a Set of IDs the server knows about
    const serverIds = new Set(serverWorkspaces.map((w) => w.id));

    // Keep local-only workspaces (not in server list) so they aren't wiped
    const localOnlyWs = localWorkspaces.filter((w) => !serverIds.has(w.id));

    // Server is authoritative for workspaces it knows about;
    // local-only workspaces are appended (they'll sync next time createWorkspace fires)
    const merged = [...serverWorkspaces, ...localOnlyWs];

    if (merged.length === 0) {
      // New user — no data anywhere yet
      return;
    }

    const currentActiveId = get().activeWorkspaceId;
    const isActiveValid   = merged.some((w) => w.id === currentActiveId);
    const nextActiveId    = isActiveValid ? currentActiveId : merged[0].id;

    if (uid) {
      const keys = userKeys(uid);
      saveToLS(keys.ws,  merged);
      saveToLS(keys.cur, nextActiveId);
    }

    set({ workspaces: merged, activeWorkspaceId: nextActiveId });
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
      role:      "owner",
    };

    // Sync with backend (fire-and-forget — will be merged from local on next login if this fails)
    api.createWorkspace(trimmed, newWs.id);

    const next = [...get().workspaces, newWs];
    const uid  = get()._uid;
    if (uid) {
      const keys = userKeys(uid);
      saveToLS(keys.ws,  next);
      saveToLS(keys.cur, newWs.id);
    }
    set({ workspaces: next, activeWorkspaceId: newWs.id });
    return { ok: true, workspace: newWs };
  },

  deleteWorkspace: async (id) => {
    if (id === "default") return { ok: false, message: "Cannot delete default workspace." };

    // ── Optimistic: remove from UI instantly ──────────────────────────────
    const prev = get().workspaces;
    const next = prev.filter((w) => w.id !== id);
    let activeId = get().activeWorkspaceId;
    if (activeId === id) {
      activeId = next[0]?.id ?? "default";
    }
    const uid = get()._uid;
    if (uid) {
      const keys = userKeys(uid);
      saveToLS(keys.ws,  next);
      saveToLS(keys.cur, activeId);
    }
    set({ workspaces: next, activeWorkspaceId: activeId });

    // ── Background API call ──────────────────────────────────────────────
    const res = await api.deleteWorkspace(id);
    if (!res.ok) {
      // Rollback if API explicitly rejects (e.g. 403 not owner)
      if (uid) {
        const keys = userKeys(uid);
        saveToLS(keys.ws,  prev);
        saveToLS(keys.cur, get().activeWorkspaceId);
      }
      set({ workspaces: prev });
      return res;
    }

    return { ok: true };
  },

  /**
   * Called on logout — resets in-memory state to the default workspace
   * but does NOT remove the uid-scoped localStorage keys.
   * The user's data is preserved and restored when they log back in.
   */
  resetForLogout: () => {
    set({ workspaces: [DEFAULT_WORKSPACE], activeWorkspaceId: "default", _uid: null });
  },

  renameWorkspace: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = get().workspaces.map((w) => (w.id === id ? { ...w, name: trimmed } : w));
    const uid  = get()._uid;
    if (uid) {
      const keys = userKeys(uid);
      saveToLS(keys.ws, next);
    }
    set({ workspaces: next });
  },
}));
