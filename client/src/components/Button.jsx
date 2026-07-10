import { motion as Motion } from "framer-motion";

import { useAppStore } from "../store/useAppStore";

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const theme = useAppStore((s) => s.theme);
  const isLightTheme = theme === "light";

  const base = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
    isLightTheme ? "focus-visible:ring-2 focus-visible:ring-emerald-400/50" : "focus-visible:ring-2 focus-visible:ring-white/20"
  }`;

  const variants = {
    primary: isLightTheme
      ? "bg-[#84cc16] text-black border border-[#84cc16]/15 hover:bg-[#a3e635] shadow-sm"
      : "bg-[#EFF2F0] text-black border border-white/10 hover:bg-white shadow-sm",
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

