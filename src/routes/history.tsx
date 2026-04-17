import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { VerdictBadge, type Verdict } from "@/components/VerdictBadge";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Your analyses — VeriNews" },
      { name: "description", content: "All your saved fake news credibility analyses." },
    ],
  }),
  component: HistoryPage,
});

interface AnalysisRow {
  id: string;
  share_id: string;
  content: string;
  verdict: Verdict;
  confidence: number;
  summary: string;
  created_at: string;
}

function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AnalysisRow[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.navigate({ to: "/auth", search: { redirect: "/history" } });
      return;
    }
    supabase
      .from("analyses")
      .select("id, share_id, content, verdict, confidence, summary, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
          setItems([]);
          return;
        }
        setItems((data ?? []) as AnalysisRow[]);
      });
  }, [user, authLoading, router]);

  async function remove(id: string) {
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null);
    toast.success("Analysis deleted");
  }

  return (
    <div className="min-h-screen text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <Toaster theme="dark" position="top-center" richColors />
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Your analyses</h1>
          <p className="mt-2 text-muted-foreground">
            Every fact-check you've run. Click any item to revisit or share it.
          </p>
        </div>

        {items === null ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div
            className="rounded-2xl border border-border/60 p-10 text-center"
            style={{ background: "var(--gradient-card)" }}
          >
            <p className="text-muted-foreground">You haven't analyzed anything yet.</p>
            <Link to="/" className="mt-4 inline-block">
              <Button className="mt-4 font-semibold" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                Run your first analysis
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/60 p-4 transition-[var(--transition-smooth)] hover:border-primary/40"
              >
                <VerdictBadge verdict={it.verdict} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{it.summary}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {new Date(it.created_at).toLocaleString()} · {it.confidence.toFixed(0)}% confidence
                  </p>
                </div>
                <Link to="/r/$shareId" params={{ shareId: it.share_id }}>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Open</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(it.id)}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
