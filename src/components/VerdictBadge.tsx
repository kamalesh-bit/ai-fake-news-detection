import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

export type Verdict = "likely_real" | "uncertain" | "likely_fake";

const config: Record<
  Verdict,
  { label: string; Icon: typeof ShieldCheck; className: string }
> = {
  likely_real: {
    label: "Likely Real",
    Icon: ShieldCheck,
    className:
      "bg-[var(--verdict-real)]/15 text-[var(--verdict-real)] border-[var(--verdict-real)]/40",
  },
  uncertain: {
    label: "Uncertain",
    Icon: ShieldAlert,
    className:
      "bg-[var(--verdict-uncertain)]/15 text-[var(--verdict-uncertain)] border-[var(--verdict-uncertain)]/40",
  },
  likely_fake: {
    label: "Likely Fake",
    Icon: ShieldX,
    className:
      "bg-[var(--verdict-fake)]/15 text-[var(--verdict-fake)] border-[var(--verdict-fake)]/40",
  },
};

export function VerdictBadge({
  verdict,
  size = "md",
}: {
  verdict: Verdict;
  size?: "sm" | "md" | "lg";
}) {
  const { label, Icon, className } = config[verdict];
  const sizing =
    size === "lg"
      ? "text-base px-4 py-2 gap-2"
      : size === "sm"
        ? "text-xs px-2.5 py-1 gap-1.5"
        : "text-sm px-3 py-1.5 gap-2";
  const iconSize = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold tracking-wide uppercase",
        sizing,
        className,
      )}
    >
      <Icon className={iconSize} />
      {label}
    </span>
  );
}
