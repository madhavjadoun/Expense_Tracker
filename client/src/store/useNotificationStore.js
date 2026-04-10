import { create } from "zustand";
import toast from "react-hot-toast";

function sessionUid() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("activeSessionUid");
}

function storageKey() {
  const uid = sessionUid();
  return uid ? `notifications_${uid}` : "notifications";
}

function readStoredNotifications() {
  try {
    if (typeof window === "undefined") return [];
    const parsed = JSON.parse(window.localStorage.getItem(storageKey()) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(notifications) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        storageKey(),
        JSON.stringify(notifications.slice(0, 50))
      );
    }
  } catch {
    // ignore
  }
}

export const useNotificationStore = create((set) => ({
  notifications: readStoredNotifications(),

  /** Call after activeSessionUid is set (e.g. login) so keys match this user. */
  reloadFromStorage: () => set({ notifications: readStoredNotifications() }),

  addNotification: ({ message, type = "info" }) =>
    set((s) => {
      const next = [
        {
          id: crypto.randomUUID(),
          message: message || "",
          type,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...s.notifications,
      ].slice(0, 50);
      persist(next);
      return { notifications: next };
    }),

  markAllRead: () =>
    set((s) => {
      const next = s.notifications.map((n) => ({ ...n, read: true }));
      persist(next);
      return { notifications: next };
    }),

  clearAll: () =>
    set(() => {
      persist([]);
      return { notifications: [] };
    }),
}));

export function notify({ message, type = "info" }) {
  const add = useNotificationStore.getState().addNotification;
  add({ message, type });
  if (type === "success") toast.success(message);
  else if (type === "error") toast.error(message);
  else toast(message);
}
