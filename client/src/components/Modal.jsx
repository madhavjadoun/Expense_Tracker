import { useEffect } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

/**
 * Modal — accessible, scroll-locked, max-height constrained dialog.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-md",
}) {
  const theme = useAppStore((s) => s.theme);
  const isLightTheme = theme === "light";

  // ── Body scroll lock ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── Backdrop ── */}
          <Motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-black/55 backdrop-blur-2xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          />

          {/* ── Panel ── */}
          <Motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`
              relative flex w-full flex-col
              ${maxWidth}
              max-h-[90vh]
              rounded-[28px]
              shadow-[0_20px_60px_rgba(0,0,0,0.25)]
              text-white
              ${isLightTheme ? "bg-[#1A1F14]/95 border border-[#1A1E1C]" : "bg-[#0e1116]/95 border border-white/[0.08]"}
            `}
            style={{
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            {/* ── Sticky header ── */}
            <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-6 pb-2">
              <div className="text-sm font-bold text-white/90">{title}</div>

              <Motion.button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.06)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/40 hover:text-white/85 transition-colors"
              >
                <X size={15} strokeWidth={2.5} />
              </Motion.button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-4 pt-2 text-sm text-white/70 leading-relaxed">
              {children}
            </div>

            {/* ── Optional sticky footer ── */}
            {footer && (
              <div className="shrink-0 px-6 pb-6 pt-2">
                {footer}
              </div>
            )}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
