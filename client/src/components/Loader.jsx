import { AnimatePresence, motion as Motion } from "framer-motion";

export default function Loader({ show, label = "Loading…" }) {
  return (
    <AnimatePresence>
      {show ? (
        <Motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <Motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="glass glow inline-flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-emerald-400/80" />
            <div className="text-xs font-medium text-white/75">{label}</div>
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

