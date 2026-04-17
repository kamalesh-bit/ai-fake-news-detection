import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { VerdictBadge, type Verdict } from "./VerdictBadge";
import { ConfidenceMeter } from "./ConfidenceMeter";

export interface AnalysisData {
  verdict: Verdict;
  confidence: number;
  summary: string;
  reasoning: string;
  red_flags: string[];
  credibility_signals: string[];
  suggested_actions: string[];
}

export function AnalysisResult({ data }: { data: AnalysisData }) {
  return (
    <div
      className="rounded-2xl border border-border/60 p-6 md:p-8 shadow-[var(--shadow-elegant)] animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ background: "var(--gradient-card)" }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <VerdictBadge verdict={data.verdict} size="lg" />
          <p className="text-lg font-medium leading-snug text-foreground">
            {data.summary}
          </p>
        </div>
        <div className="md:w-64 md:shrink-0">
          <ConfidenceMeter confidence={data.confidence} verdict={data.verdict} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border/40 bg-background/40 p-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Analyst Reasoning
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90">
          {data.reasoning}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SignalList
          title="Red Flags"
          items={data.red_flags}
          icon={AlertTriangle}
          color="var(--verdict-fake)"
          empty="No major red flags detected."
        />
        <SignalList
          title="Credibility Signals"
          items={data.credibility_signals}
          icon={CheckCircle2}
          color="var(--verdict-real)"
          empty="No strong credibility signals found."
        />
      </div>

      {data.suggested_actions.length > 0 && (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
              What you should do
            </h3>
          </div>
          <ul className="space-y-2">
            {data.suggested_actions.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground/90">
                <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SignalList({
  title,
  items,
  icon: Icon,
  color,
  empty,
}: {
  title: string;
  items: string[];
  icon: typeof AlertTriangle;
  color: string;
  empty: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground/90">
              <span style={{ color }}>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
