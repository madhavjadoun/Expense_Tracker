import { AnimatePresence, motion as Motion } from "framer-motion";
import { useToasts } from "./useToasts";

export default function ToastViewport() {
  const { toasts, dismiss } = useToasts();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-auto glass glow rounded-2xl border border-white/10 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white/85">
                  {t.type === "success"
                    ? "Success"
                    : t.type === "error"
                      ? "Error"
                      : "Notice"}
                </div>
                <div className="mt-1 text-xs text-white/65">{t.message}</div>
              </div>
              <button
                className="rounded-lg px-2 py-1 text-xs text-white/55 hover:bg-white/8 hover:text-white/80"
                onClick={() => dismiss(t.id)}
                type="button"
              >
                Close
              </button>
            </div>
          </Motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

