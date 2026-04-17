import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { AnalysisResult, type AnalysisData } from "@/components/AnalysisResult";

interface SharedAnalysis extends AnalysisData {
  id: string;
  share_id: string;
  content: string;
  created_at: string;
}

export const Route = createFileRoute("/r/$shareId")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("analyses")
      .select(
        "id, share_id, content, verdict, confidence, summary, reasoning, red_flags, credibility_signals, suggested_actions, created_at",
      )
      .eq("share_id", params.shareId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw notFound();
    return data as unknown as SharedAnalysis;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Analysis — VeriNews" }] };
    const verdictLabel =
      loaderData.verdict === "likely_fake"
        ? "Likely Fake"
        : loaderData.verdict === "likely_real"
          ? "Likely Real"
          : "Uncertain";
    const title = `${verdictLabel} (${Math.round(loaderData.confidence)}%) — VeriNews`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.summary },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Analysis not found</h1>
        <p className="mt-2 text-muted-foreground">
          This share link is invalid or the analysis has been deleted.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen text-foreground" style={{ background: "var(--gradient-hero)" }}>
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Couldn't load analysis</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button
            className="mt-6"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  },
  component: SharePage,
});

function SharePage() {
  const data = Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("Share link copied");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <Toaster theme="dark" position="top-center" richColors />
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              New analysis
            </Button>
          </Link>
          <Button
            onClick={copyLink}
            size="sm"
            variant="outline"
            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy share link"}
          </Button>
        </div>

        <AnalysisResult data={data} />

        <div
          className="mt-6 rounded-2xl border border-border/60 p-5 md:p-6"
          style={{ background: "var(--gradient-card)" }}
        >
          <button
            onClick={() => setShowSource((s) => !s)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Original content
            </span>
            <span className="text-xs text-primary">{showSource ? "Hide" : "Show"}</span>
          </button>
          {showSource && (
            <p className="mt-4 whitespace-pre-wrap rounded-lg border border-border/40 bg-background/40 p-4 text-sm text-foreground/90">
              {data.content}
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Analyzed on {new Date(data.created_at).toLocaleString()} · VeriNews AI
        </p>
      </main>
    </div>
  );
}

// Suppress unused import warning when SSR doesn't use Loader2
void Loader2;
