import { motion as Motion } from "framer-motion";

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variants = {
    primary:
      "bg-gradient-to-br from-emerald-400 to-emerald-600 text-emerald-950 shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.45)] border border-emerald-300/20 shine-effect",
    subtle:
      "bg-white/5 text-white/85 border border-white/8 hover:bg-white/10 hover:border-white/15 hover:text-white shadow-sm",
    ghost: "text-white/75 hover:bg-white/5 hover:text-white/95",
  };

  return (
    <Motion.button
      whileHover={{ scale: 1.02, y: -0.5 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Motion.button>
  );
}

export default Button;

