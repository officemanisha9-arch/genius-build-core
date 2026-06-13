import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt: string };
        if (!prompt) return new Response("Missing prompt", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            prompt,
            n: 1,
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          return new Response(text, { status: upstream.status });
        }
        const data = (await upstream.json()) as {
          data?: Array<{ url?: string; b64_json?: string }>;
        };
        const first = data.data?.[0];
        const url = first?.url ?? (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : null);
        if (!url) return new Response("No image returned", { status: 500 });

        return Response.json({ url });
      },
    },
  },
});
