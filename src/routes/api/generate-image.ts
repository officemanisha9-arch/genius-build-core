import { createFileRoute } from "@tanstack/react-router";
import { generateOpenAIImage } from "@/lib/ai-gateway.server";
import { getOpenAIKey } from "@/lib/config.server";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt: string };
        if (!prompt) return new Response("Missing prompt", { status: 400 });
        const key = getOpenAIKey();
        if (!key)
          return new Response(
            "Missing OPENAI_API_KEY. Add it via project secrets or .env.local.",
            { status: 500 },
          );

        try {
          const url = await generateOpenAIImage(key, prompt);
          return Response.json({ url });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Image generation failed";
          console.error("generate-image error", msg);
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
