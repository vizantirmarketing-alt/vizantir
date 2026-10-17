export function America250({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="Commemorating 250 years of the United States, 1776 to 2026"
      className={`inline-flex items-baseline gap-[7px] ${className}`}
    >
      <span className="text-[11px] font-medium uppercase leading-none tracking-[0.18em] text-muted-foreground">
        Commemorating
      </span>
      <span className="text-[15px] font-bold leading-none tracking-[-0.02em] text-black/85">
        250
      </span>
      <span className="text-[11px] font-medium uppercase leading-none tracking-[0.18em] text-muted-foreground">
        Years &middot; 1776&ndash;2026
      </span>
    </span>
  );
}
