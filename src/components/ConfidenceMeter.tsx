import type { Verdict } from "./VerdictBadge";

export function ConfidenceMeter({
  confidence,
  verdict,
}: {
  confidence: number;
  verdict: Verdict;
}) {
  const color =
    verdict === "likely_real"
      ? "var(--verdict-real)"
      : verdict === "likely_fake"
        ? "var(--verdict-fake)"
        : "var(--verdict-uncertain)";
  const pct = Math.max(0, Math.min(100, confidence));
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Confidence
        </span>
        <span
          className="font-mono text-2xl font-bold tabular-nums"
          style={{ color }}
        >
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>
    </div>
  );
}
