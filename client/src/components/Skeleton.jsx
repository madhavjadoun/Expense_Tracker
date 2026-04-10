export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10 ${className}`}
    />
  );
}

export function SkeletonText({ lines = 2 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={i === 0 ? "h-3 w-3/4" : "h-3 w-2/3"} />
      ))}
    </div>
  );
}

