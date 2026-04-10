import { motion as Motion } from "framer-motion";

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-emerald-500/90 text-emerald-950 shadow-[0_16px_50px_rgba(34,197,94,.18)] hover:bg-emerald-500 hover:shadow-[0_22px_70px_rgba(34,197,94,.22)]",
    subtle:
      "bg-white/6 text-white/85 border border-white/10 hover:bg-white/8",
    ghost: "text-white/80 hover:bg-white/8",
  };

  return (
    <Motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Motion.button>
  );
}

export default Button;

