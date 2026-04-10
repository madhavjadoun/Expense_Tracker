import { motion as Motion } from "framer-motion";

const options = [
  { value: "pie", label: "Pie Chart" },
  { value: "bar", label: "Bar Chart (Histogram)" },
  { value: "line", label: "Line Chart" },
];

export default function ChartSwitcher({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs font-medium text-white/60">Chart</div>
      <Motion.select
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.12 }}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Motion.select>
    </div>
  );
}

