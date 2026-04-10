import { motion as Motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_25%_10%,rgba(34,197,94,.14),transparent_58%),radial-gradient(1000px_circle_at_80%_20%,rgba(59,130,246,.12),transparent_55%),radial-gradient(900px_circle_at_40%_90%,rgba(148,163,184,.10),transparent_60%)]" />

      {/* Animated blobs */}
      <Motion.div
        className="absolute -top-28 -left-28 h-[440px] w-[440px] rounded-full bg-emerald-500/14 blur-3xl"
        animate={{ x: [0, 40, -20, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <Motion.div
        className="absolute top-24 right-[-160px] h-[560px] w-[560px] rounded-full bg-blue-500/12 blur-3xl"
        animate={{ x: [0, -30, 20, 0], y: [0, -20, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <Motion.div
        className="absolute bottom-[-160px] left-1/3 h-[540px] w-[540px] rounded-full bg-slate-200/8 blur-3xl"
        animate={{ x: [0, 25, -25, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/55" />
    </div>
  );
}

