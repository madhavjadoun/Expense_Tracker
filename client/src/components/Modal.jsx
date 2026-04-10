import { AnimatePresence, motion as Motion } from "framer-motion";

export default function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open ? (
        <Motion.div
          className="fixed inset-0 z-50 grid place-items-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Motion.button
            aria-label="Close modal overlay"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <Motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl border border-white/12 bg-[#0b0b18]/80 p-5 shadow-[0_30px_120px_rgba(0,0,0,.6)] backdrop-blur-xl"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white/90">{title}</div>
              <button
                className="rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                onClick={onClose}
              >
                Esc
              </button>
            </div>
            {children}
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

