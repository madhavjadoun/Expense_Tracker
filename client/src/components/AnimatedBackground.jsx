import { motion as Motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "radial-gradient(ellipse at top left, #141418 0%, #0c0c0e 50%, #070709 100%)" }}>

      {/* Animated dark indigo blobs */}
      <Motion.div
        className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full blur-3xl"
        style={{ background: "rgba(99,102,241,0.07)" }}
        animate={{ x: [0, 40, -20, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <Motion.div
        className="absolute top-20 right-[-180px] h-[580px] w-[580px] rounded-full blur-3xl"
        style={{ background: "rgba(139,92,246,0.06)" }}
        animate={{ x: [0, -30, 20, 0], y: [0, -20, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <Motion.div
        className="absolute bottom-[-180px] left-1/3 h-[560px] w-[560px] rounded-full blur-3xl"
        style={{ background: "rgba(79,70,229,0.05)" }}
        animate={{ x: [0, 25, -25, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
