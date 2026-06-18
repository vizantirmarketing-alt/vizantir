// components/ui/MadeInUSA.tsx

const STRIPES = Array.from({ length: 13 });
const STAR_POS = (() => {
  const Uw = 76, Uh = (100 / 13) * 7, hx = Uw / 12, vy = Uh / 10, r = vy * 0.4;
  const pts: string[] = [];
  for (let row = 1; row <= 9; row++) {
    const cols = row % 2 === 1 ? [1, 3, 5, 7, 9, 11] : [2, 4, 6, 8, 10];
    for (const c of cols) {
      const cx = c * hx, cy = row * vy, p: string[] = [];
      for (let i = 0; i < 5; i++) {
        const ao = -Math.PI / 2 + (i * 2 * Math.PI) / 5, ai = ao + Math.PI / 5;
        p.push(`${(cx + r * Math.cos(ao)).toFixed(2)},${(cy + r * Math.sin(ao)).toFixed(2)}`);
        p.push(`${(cx + r * 0.382 * Math.cos(ai)).toFixed(2)},${(cy + r * 0.382 * Math.sin(ai)).toFixed(2)}`);
      }
      pts.push(`M${p.join(" L")} Z`);
    }
  }
  return pts;
})();

function USFlag({ width = 26 }: { width?: number }) {
  const sH = 100 / 13;
  return (
    <svg
      width={width}
      height={width / 1.9}
      viewBox="0 0 190 100"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      aria-hidden="true"
      className="rounded-[1px]"
    >
      {STRIPES.map((_, i) => (
        <rect key={i} x="0" y={i * sH} width="190" height={sH} fill={i % 2 === 0 ? "#B22234" : "#FFFFFF"} />
      ))}
      <rect width="76" height={sH * 7} fill="#3C3B6E" />
      {STAR_POS.map((d, i) => <path key={i} d={d} fill="#FFFFFF" />)}
    </svg>
  );
}

export default function MadeInUSA() {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
      style={{ borderColor: "var(--cobalt-muted-border)", background: "var(--cobalt-muted-subtle)" }}
    >
      <span className="inline-flex overflow-hidden rounded-[1px] leading-none shadow-[0_0_0_1px_rgba(0,0,0,0.10)]">
        <USFlag width={26} />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-neutral-800">
        Made in U.S.A.
      </span>
    </span>
  );
}
