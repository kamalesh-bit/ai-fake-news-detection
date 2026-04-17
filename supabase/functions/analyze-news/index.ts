import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Please provide at least 20 characters of news content to analyze." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert fact-checker and media literacy analyst specializing in detecting misinformation and fake news.

Analyze the provided news content and assess its credibility. Look for:
- Sensationalist or emotionally manipulative language
- Lack of credible sources or citations
- Logical inconsistencies or factual contradictions
- Bias indicators and one-sided framing
- Conspiracy theory patterns
- Misleading headlines vs body content
- Unverifiable claims presented as facts
- Quality of writing and journalistic standards

Be balanced, fair, and evidence-based. Do not make political judgments — focus only on credibility signals.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this news content:\n\n"""\n${content}\n"""` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_credibility",
                description: "Return a structured credibility assessment.",
                parameters: {
                  type: "object",
                  properties: {
                    verdict: {
                      type: "string",
                      enum: ["likely_real", "uncertain", "likely_fake"],
                      description: "Overall credibility verdict.",
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence in the verdict, 0 to 100.",
                    },
                    summary: {
                      type: "string",
                      description: "One-sentence summary of the assessment.",
                    },
                    reasoning: {
                      type: "string",
                      description: "2-4 sentence detailed reasoning explaining the verdict.",
                    },
                    red_flags: {
                      type: "array",
                      items: { type: "string" },
                      description: "Specific warning signs detected (empty if none).",
                    },
                    credibility_signals: {
                      type: "array",
                      items: { type: "string" },
                      description: "Positive signals supporting credibility (empty if none).",
                    },
                    suggested_actions: {
                      type: "array",
                      items: { type: "string" },
                      description: "2-3 actionable steps the reader should take.",
                    },
                  },
                  required: [
                    "verdict",
                    "confidence",
                    "summary",
                    "reasoning",
                    "red_flags",
                    "credibility_signals",
                    "suggested_actions",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_credibility" } },
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-news error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
