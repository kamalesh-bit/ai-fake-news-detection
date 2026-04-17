import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Search, Brain, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { AnalysisResult, type AnalysisData } from "@/components/AnalysisResult";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Fake News Detection — Verify any article in seconds" },
      {
        name: "description",
        content:
          "Paste any news article and get an instant AI-powered credibility analysis with confidence score, red flags, and reasoning.",
      },
      { property: "og:title", content: "VeriNews — AI Fake News Detection" },
      {
        property: "og:description",
        content: "Instant AI credibility analysis for any news article.",
      },
    ],
  }),
  component: Index,
});

const SAMPLE = `Scientists have CONFIRMED that drinking 3 glasses of lemon water every morning eliminates all forms of cancer in just 7 days. Big Pharma is hiding this miracle cure! Share before they delete this!!!`;

function Index() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);

  async function analyze() {
    if (!user) {
      router.navigate({ to: "/auth", search: { redirect: "/" } });
      return;
    }
    const trimmed = content.trim();
    if (trimmed.length < 20) {
      toast.error("Please paste at least 20 characters of news content.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // 1. Run the AI analysis
      const { data, error } = await supabase.functions.invoke("analyze-news", {
        body: { content: trimmed },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const analysis = data as AnalysisData;
      setResult(analysis);

      // 2. Persist to DB
      const { data: inserted, error: insertErr } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          content: trimmed,
          verdict: analysis.verdict,
          confidence: analysis.confidence,
          summary: analysis.summary,
          reasoning: analysis.reasoning,
          red_flags: analysis.red_flags,
          credibility_signals: analysis.credibility_signals,
          suggested_actions: analysis.suggested_actions,
        })
        .select("share_id")
        .single();

      if (insertErr) {
        console.error("Failed to save analysis:", insertErr);
        toast.warning("Analysis ready, but couldn't be saved to your history.");
        return;
      }

      // 3. Redirect to share page
      router.navigate({ to: "/r/$shareId", params: { shareId: inserted.share_id } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <Toaster theme="dark" position="top-center" richColors />
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroBg}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
          width={1536}
          height={1024}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        <div className="relative mx-auto max-w-4xl px-4 pt-12 pb-8 text-center md:px-6 md:pt-20 md:pb-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Real-time analysis online
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Spot fake news{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              before you share it
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Paste any news article, claim, or social media post. Our AI analyst returns a
            credibility verdict, confidence score, and the exact red flags it found —
            in seconds.
          </p>
        </div>
      </section>

      {/* Analyzer */}
      <section className="relative mx-auto max-w-4xl px-4 pb-16 md:px-6">
        <div
          className="rounded-2xl border border-border/60 p-5 shadow-[var(--shadow-elegant)] md:p-7"
          style={{ background: "var(--gradient-card)" }}
        >
          <label className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              News content to verify
            </span>
            <button
              onClick={() => setContent(SAMPLE)}
              className="text-xs text-primary hover:underline"
              type="button"
            >
              Try a sample
            </button>
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste a headline, article, tweet, or claim here..."
            className="min-h-40 resize-none border-border/60 bg-background/60 text-base focus-visible:ring-primary/50"
          />
          <div className="mt-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <span className="text-xs text-muted-foreground">
              {content.trim().length} characters · saved to your history & shareable
            </span>
            <Button
              onClick={analyze}
              disabled={loading || authLoading}
              size="lg"
              className="h-12 gap-2 px-6 font-semibold shadow-[var(--shadow-glow)] transition-[var(--transition-smooth)] hover:scale-[1.02]"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : !user && !authLoading ? (
                <>
                  <Search className="h-4 w-4" />
                  Sign in to analyze
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Analyze Credibility
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Inline result preview while redirect is happening */}
        {result && (
          <div className="mt-6">
            <AnalysisResult data={result} />
          </div>
        )}

        {/* Empty state features */}
        {!result && !loading && (
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Feature
              icon={Brain}
              title="Deep Reasoning"
              text="Tool-calling LLM produces structured, evidence-based assessments."
            />
            <Feature
              icon={Zap}
              title="Saved & Shareable"
              text="Every analysis is saved to your history and gets a unique share link."
            />
            <Feature
              icon={ShieldCheck}
              title="Action Steps"
              text="Each report includes what to verify next before sharing."
            />
          </div>
        )}

        {user && !result && !loading && (
          <div className="mt-8 text-center">
            <Link to="/history" className="text-sm text-primary hover:underline">
              View your past analyses →
            </Link>
          </div>
        )}
      </section>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        AI assessments are guidance, not verdicts. Always cross-check with trusted sources.
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Brain;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
