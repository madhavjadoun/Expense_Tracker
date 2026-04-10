import { create } from "zustand";

const useToastStore = create((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    const t = {
      id,
      type: toast.type || "info",
      title: toast.title || "",
      message: toast.message || "",
      ttlMs: toast.ttlMs ?? 2600,
    };
    set((s) => ({ toasts: [t, ...s.toasts].slice(0, 4) }));
    window.setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
      t.ttlMs
    );
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function useToasts() {
  const toasts = useToastStore((s) => s.toasts);
  const push = useToastStore((s) => s.push);
  const dismiss = useToastStore((s) => s.dismiss);
  return { toasts, push, dismiss };
}
