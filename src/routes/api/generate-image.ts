import { createFileRoute } from "@tanstack/react-router";
import { getLovableApiKey } from "@/lib/config.server";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt: string };
        if (!prompt) return new Response("Missing prompt", { status: 400 });
        const key = getLovableApiKey();
        if (!key) return new Response("Missing LOVABLE_API_KEY. Add it to .env.local for local dev.", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "manual-fetch",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          console.error("generate-image upstream error", upstream.status, text);
          return new Response(text, { status: upstream.status });
        }
        const data = (await upstream.json()) as {
          choices?: Array<{
            message?: {
              images?: Array<{ image_url?: { url?: string } }>;
            };
          }>;
        };
        const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
        if (!url) return new Response("No image returned", { status: 500 });

        return Response.json({ url });
      },
    },
  },
});
