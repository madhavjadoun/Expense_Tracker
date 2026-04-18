import { useEffect } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Modal — accessible, scroll-locked, max-height constrained dialog.
 *
 * Layout:
 *   ┌──────────────────────────────┐  ← rounded panel, max-h-[90vh]
 *   │  sticky header (title + ✕)  │
 *   ├──────────────────────────────┤
 *   │  scrollable content area     │  ← overflow-y-auto, flex-1
 *   ├──────────────────────────────┤  (optional)
 *   │  sticky footer               │  ← rendered via `footer` prop
 *   └──────────────────────────────┘
 *
 * Props:
 *   open       — boolean
 *   onClose    — () => void   (backdrop click or ✕ button)
 *   title      — string
 *   children   — scrollable body content
 *   footer     — optional sticky footer node (buttons etc.)
 *   maxWidth   — Tailwind max-w-* class, default "max-w-md"
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-md",
}) {
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
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* ── Backdrop ── */}
          <Motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
              rounded-2xl border border-white/12
              bg-[#0b0b18]/92
              shadow-[0_30px_120px_rgba(0,0,0,.65)]
              backdrop-blur-xl
            `}
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0,  opacity: 1, scale: 1    }}
            exit={{    y: 20, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            {/* ── Sticky header ── */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
              <div className="text-sm font-semibold text-white/90">{title}</div>

              <Motion.button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.10)" }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-colors hover:text-white/85"
              >
                <X size={14} strokeWidth={2.2} />
              </Motion.button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {children}
            </div>

            {/* ── Optional sticky footer ── */}
            {footer && (
              <div className="shrink-0 border-t border-white/8 px-5 py-4">
                {footer}
              </div>
            )}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
