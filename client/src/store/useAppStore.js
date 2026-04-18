import { create } from "zustand";
import { api } from "../services/api";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import { notify, useNotificationStore } from "./useNotificationStore";
import { useUserStore } from "./useUserStore";
import { generateInsights } from "../utils/budgetInsights";
import { usePlanStore, isExpenseLimitReached } from "./usePlanStore";

// ─── localStorage helpers ────────────────────────────────────────────────────────────────
const WS_EXPENSE_MAP_KEY = "xpense_ws_expense_map";
const WS_BUDGETS_KEY     = "xpense_ws_budgets";

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/**
 * Re-apply stored workspaceId values to a fresh array of expenses from the
 * backend (which has no knowledge of client-side workspaces).
 */
function applyWorkspaceMap(expenses, map) {
  return expenses.map((e) => ({
    ...e,
    workspaceId: map[e.id] ?? "default",
  }));
}

function normalizeFirebaseUser(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    name: user.displayName || "",
    email: user.email || "",
  };
}

function mapFirebaseAuthError(error, mode) {
  const code = error?.code || "";
  if (mode === "signup") {
    if (code === "auth/email-already-in-use") return "Account already exists";
    if (code === "auth/invalid-email") return "Invalid email";
    if (code === "auth/weak-password") {
      return "Password must be at least 6 characters";
    }
    return "Signup failed.";
  }
  if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
    return "User not found";
  }
  if (code === "auth/wrong-password") return "Incorrect password";
  if (code === "auth/invalid-email") return "Invalid email";
  return "Login failed.";
}

function sortByDateDesc(a, b) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export const useAppStore = create((set, get) => ({
  user: null,

  theme: (() => {
    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.toggle("dark", saved === "dark");
    return saved;
  })(),
  toggleTheme: () => set((s) => {
    const nextTheme = s.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    return { theme: nextTheme };
  }),

  currency: localStorage.getItem("preferred_currency") || "INR",
  setCurrency: (currency) => {
    localStorage.setItem("preferred_currency", currency);
    set({ currency });
  },

  ui: {
    sidebarOpen: false, // mobile drawer
    sidebarCollapsed: false, // desktop
  },

  expenses: [],

  /**
   * Client-side map: expenseId → workspaceId.
   * Persisted in localStorage so workspaceId survives page refresh and
   * backend re-fetches (backend has no workspace concept).
   */
  workspaceExpenseMap: loadJSON(WS_EXPENSE_MAP_KEY, {}),

  /**
   * Per-workspace monthly budgets for non-default workspaces.
   * Map: workspaceId → number.
   * Default workspace budget is stored in budgetMonthly (MongoDB-synced).
   */
  workspaceBudgets: loadJSON(WS_BUDGETS_KEY, {}),

  // Monthly budget (per Firebase uid, default workspace — synced with MongoDB)
  budgetMonthly: 0,

  // Generated insights (UI-only)
  insights: {
    lines: [],
    budgetStatus: "unknown",
  },
  budgetExceededNotified: false,

  loading: {
    auth: false,
    expenses: false,
  },

  error: {
    expenses: null,
  },

  // --- UI actions ---
  setAuthUser: (firebaseUser) => set({ user: normalizeFirebaseUser(firebaseUser) }),
  setSidebarOpen: (open) =>
    set((s) => ({ ui: { ...s.ui, sidebarOpen: open } })),
  toggleSidebarOpen: () =>
    set((s) => ({ ui: { ...s.ui, sidebarOpen: !s.ui.sidebarOpen } })),
  toggleSidebarCollapsed: () =>
    set((s) => ({ ui: { ...s.ui, sidebarCollapsed: !s.ui.sidebarCollapsed } })),

  /**
   * After login: sync profile + budget from MongoDB, clear stale expenses, refetch.
   * Sets localStorage activeSessionUid for per-user notification keys.
   */
  bootstrapUserSession: async (authUser) => {
    if (!authUser?.uid) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("activeSessionUid", authUser.uid);
    }
    useNotificationStore.getState().reloadFromStorage();
    set((s) => ({
      expenses: [],
      error: { ...s.error, expenses: null },
      budgetExceededNotified: false,
      loading: { ...s.loading, expenses: true },
    }));
    await useUserStore.getState().syncProfileFromServer(authUser);
    const prof = useUserStore.getState().profile;
    const budget = Number(prof?.monthlyBudget) || 0;
    const insights = generateInsights([], budget);
    set({ budgetMonthly: budget, insights });
    await get().fetchExpenses();
  },

  setBudgetMonthly: async (nextBudget) => {
    const budget = Number(nextBudget);
    const safeBudget = Number.isFinite(budget) ? budget : 0;
    const uid = get().user?.uid;
    const prevProfile = useUserStore.getState().profile;
    useUserStore.getState().setProfile({ ...prevProfile, monthlyBudget: safeBudget });
    if (uid) {
      try {
        await api.saveProfile({ monthlyBudget: safeBudget });
      } catch {
        // offline / server down — local cache still updated
      }
    }
    const expenses = get().expenses;
    const insights = generateInsights(expenses, safeBudget);
    set({ budgetMonthly: safeBudget, insights });
    const wasNotified = get().budgetExceededNotified;
    const isExceeded = insights?.budgetStatus === "exceeded";
    if (isExceeded && !wasNotified) {
      notify({ type: "error", message: "Budget exceeded." });
      set({ budgetExceededNotified: true });
    } else if (!isExceeded && wasNotified) {
      set({ budgetExceededNotified: false });
    }
  },

  recomputeInsights: () => {
    const expenses = get().expenses;
    const budgetMonthly = get().budgetMonthly;
    const insights = generateInsights(expenses, budgetMonthly);
    set({ insights });
  },

  // --- Auth actions (UI-only) ---
  signup: async ({ name, email, password }) => {
    const normalizedEmail = (email || "").trim();
    const normalizedPassword = password || "";
    const trimmedName = (name || "").trim();
    if (!normalizedEmail) {
      return { ok: false, message: "Email should not be empty." };
    }
    if (normalizedPassword.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters" };
    }
    set((s) => ({ loading: { ...s.loading, auth: true } }));
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword
      );
      if (trimmedName) {
        await updateProfile(cred.user, { displayName: trimmedName });
      }
      const nextUser = {
        uid: cred.user.uid,
        name: trimmedName || cred.user.displayName || "",
        email: cred.user.email || normalizedEmail,
      };
      set((s) => ({ user: nextUser, loading: { ...s.loading, auth: false } }));
      return { ok: true, user: nextUser };
    } catch (e) {
      set((s) => ({ loading: { ...s.loading, auth: false } }));
      return { ok: false, message: mapFirebaseAuthError(e, "signup") };
    }
  },

  login: async ({ email, password }) => {
    const normalizedEmail = (email || "").trim();
    const normalizedPassword = password || "";
    if (!normalizedEmail) {
      return { ok: false, message: "Email should not be empty." };
    }
    if (normalizedPassword.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters" };
    }
    set((s) => ({ loading: { ...s.loading, auth: true } }));
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword
      );
      const nextUser = normalizeFirebaseUser(cred.user);
      set((s) => ({ user: nextUser, loading: { ...s.loading, auth: false } }));
      return { ok: true, user: nextUser };
    } catch (e) {
      set((s) => ({ loading: { ...s.loading, auth: false } }));
      return { ok: false, message: mapFirebaseAuthError(e, "login") };
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeSessionUid");
      }
      useNotificationStore.getState().clearAll();
      useUserStore.getState().resetForLogout();
      set({
        user: null,
        expenses: [],
        budgetMonthly: 0,
        insights: { lines: [], budgetStatus: "unknown" },
        budgetExceededNotified: false,
        error: { expenses: null },
      });
    }
  },

  // --- Expenses (with loading/error + optimistic updates) ---
  fetchExpenses: async () => {
    set((s) => ({
      loading: { ...s.loading, expenses: true },
      error:   { ...s.error,   expenses: null },
    }));
    try {
      const raw       = await api.fetchExpenses();
      const map       = get().workspaceExpenseMap;
      // Re-apply client-side workspaceId to every expense from the backend
      const hydrated  = applyWorkspaceMap(raw, map);
      const sorted    = hydrated.slice().sort(sortByDateDesc);
      const budget    = get().budgetMonthly;
      const insights  = generateInsights(sorted, budget);
      set((s) => ({ expenses: sorted, insights, loading: { ...s.loading, expenses: false } }));
      const wasNotified = get().budgetExceededNotified;
      const isExceeded  = insights?.budgetStatus === "exceeded";
      if (isExceeded && !wasNotified) {
        notify({ type: "error", message: "Budget exceeded." });
        set({ budgetExceededNotified: true });
      } else if (!isExceeded && wasNotified) {
        set({ budgetExceededNotified: false });
      }
      return { ok: true };
    } catch (e) {
      set((s) => ({
        loading: { ...s.loading, expenses: false },
        error:   { ...s.error, expenses: e?.message || "Failed to load expenses." },
      }));
      return { ok: false };
    }
  },

  addExpenseOptimistic: async (draftExpense) => {
    // ── Plan limit guard ───────────────────────────────────────────────────
    const planId = usePlanStore.getState().planId;
    if (isExpenseLimitReached(planId, get().expenses.length)) {
      return { ok: false, limitReached: true, message: "Limit reached! Upgrade your plan to add more expenses." };
    }

    // ── Workspace tag ───────────────────────────────────────────────────
    const workspaceId = draftExpense.workspaceId ?? "default";

    const tempId = crypto.randomUUID();
    const optimistic = {
      id:          tempId,
      amount:      Number(draftExpense.amount),
      category:    draftExpense.category,
      note:        draftExpense.note || "",
      date:        new Date().toISOString(),
      workspaceId, // ← always attached
      isRecurring:  Boolean(draftExpense.isRecurring),
      recurringType: draftExpense.isRecurring ? draftExpense.recurringType : null,
      _optimistic: true,
    };

    // Store workspaceId in the persistent map immediately (temp ID)
    const mapWithTemp = { ...get().workspaceExpenseMap, [tempId]: workspaceId };
    saveJSON(WS_EXPENSE_MAP_KEY, mapWithTemp);
    set({ workspaceExpenseMap: mapWithTemp });

    const prev = get().expenses;
    const nextExpenses = [optimistic, ...prev].slice().sort(sortByDateDesc);
    const insights     = generateInsights(nextExpenses, get().budgetMonthly);
    set({ expenses: nextExpenses, insights });

    const wasNotified = get().budgetExceededNotified;
    const isExceeded  = insights?.budgetStatus === "exceeded";
    if (isExceeded && !wasNotified) {
      notify({ type: "error", message: "Budget exceeded." });
      set({ budgetExceededNotified: true });
    } else if (!isExceeded && wasNotified) {
      set({ budgetExceededNotified: false });
    }

    try {
      const saved = await api.addExpense(optimistic);

      // Migrate temp ID → real ID in the workspace map
      const prevMap   = get().workspaceExpenseMap;
      const nextMap   = { ...prevMap, [saved.id]: workspaceId };
      delete nextMap[tempId];
      saveJSON(WS_EXPENSE_MAP_KEY, nextMap);
      set({ workspaceExpenseMap: nextMap });

      set((s) => {
        const updated = s.expenses
          .map((e) => (e.id === tempId ? { ...saved, workspaceId } : e))
          .slice()
          .sort(sortByDateDesc);
        return { expenses: updated, insights: generateInsights(updated, get().budgetMonthly) };
      });
      return { ok: true };
    } catch (e) {
      // Rollback — remove temp entry from map too
      const rolledMap = { ...get().workspaceExpenseMap };
      delete rolledMap[tempId];
      saveJSON(WS_EXPENSE_MAP_KEY, rolledMap);
      set({ expenses: prev, workspaceExpenseMap: rolledMap,
            insights: generateInsights(prev, get().budgetMonthly) });
      return { ok: false, message: e?.message || "Failed to add expense." };
    }
  },

  /** Per-workspace budget (non-default workspaces only). */
  setWorkspaceBudget: (workspaceId, amount) => {
    const safe = Number(amount) || 0;
    const next = { ...get().workspaceBudgets, [workspaceId]: safe };
    saveJSON(WS_BUDGETS_KEY, next);
    set({ workspaceBudgets: next });
  },

  deleteExpenseOptimistic: async (id) => {
    const prev        = get().expenses;
    const next        = prev.filter((e) => e.id !== id);
    const insights    = generateInsights(next, get().budgetMonthly);
    // Optimistic: remove from UI immediately
    set({ expenses: next, insights });
    const wasNotified = get().budgetExceededNotified;
    const isExceeded  = insights?.budgetStatus === "exceeded";
    if (isExceeded && !wasNotified) {
      notify({ type: "error", message: "Budget exceeded." });
      set({ budgetExceededNotified: true });
    } else if (!isExceeded && wasNotified) {
      set({ budgetExceededNotified: false });
    }

    // Clean up workspace map immediately (don't wait for API)
    const nextMap = { ...get().workspaceExpenseMap };
    delete nextMap[id];
    saveJSON(WS_EXPENSE_MAP_KEY, nextMap);
    set({ workspaceExpenseMap: nextMap });

    try {
      await api.deleteExpense(id);
      return { ok: true };
    } catch (e) {
      const msg = e?.message || "";
      // If "not found" — expense was already deleted or never in backend. Don't rollback.
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("404")) {
        return { ok: true };
      }
      // For genuine server errors — rollback UI
      set({ expenses: prev, insights: generateInsights(prev, get().budgetMonthly) });
      // Restore workspace map
      saveJSON(WS_EXPENSE_MAP_KEY, { ...get().workspaceExpenseMap, [id]: prev.find(e => e.id === id)?.workspaceId });
      return { ok: false, message: msg || "Failed to delete expense." };
    }
  },

  updateExpenseOptimistic: async (id, patch) => {
    const prev        = get().expenses;
    // Preserve workspaceId through the update — never let backend data overwrite it
    const existingWs  = prev.find((e) => e.id === id)?.workspaceId ?? "default";
    const nextExpenses = prev
      .map((e) => (e.id === id ? { ...e, ...patch, workspaceId: existingWs } : e))
      .slice()
      .sort(sortByDateDesc);
    const insights    = generateInsights(nextExpenses, get().budgetMonthly);
    set({ expenses: nextExpenses, insights });
    const wasNotified = get().budgetExceededNotified;
    const isExceeded  = insights?.budgetStatus === "exceeded";
    if (isExceeded && !wasNotified) {
      notify({ type: "error", message: "Budget exceeded." });
      set({ budgetExceededNotified: true });
    } else if (!isExceeded && wasNotified) {
      set({ budgetExceededNotified: false });
    }
    try {
      const saved = await api.updateExpense(id, patch);
      set((s) => {
        const updated = s.expenses
          // Preserve workspaceId — backend response doesn't include it
          .map((e) => (e.id === id ? { ...saved, workspaceId: existingWs } : e))
          .slice()
          .sort(sortByDateDesc);
        return { expenses: updated, insights: generateInsights(updated, get().budgetMonthly) };
      });
      return { ok: true };
    } catch (e) {
      set({ expenses: prev, insights: generateInsights(prev, get().budgetMonthly) });
      return { ok: false, message: e?.message || "Failed to update expense." };
    }
  },
}));

