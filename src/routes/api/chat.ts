import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { getLovableApiKey } from "@/lib/config.server";

type Mode = "writer" | "brainstorm" | "code";

const SYSTEM: Record<Mode, string> = {
  writer:
    "You are Atelier, an editorial writing partner. Help users draft, refine, and polish prose: essays, articles, marketing copy, scripts, emails. Match the requested tone. Be specific. Use markdown. When asked for a draft, write the full piece, then offer optional revisions.",
  brainstorm:
    "You are Atelier in brainstorm mode. Generate divergent, surprising, useful ideas. Use punchy bulleted lists grouped by angle. Push past obvious takes. Offer to expand any idea on request.",
  code:
    "You are Atelier in code mode. Write production-quality code with concise explanations. Use markdown fenced blocks with language tags. Prefer modern, idiomatic patterns. Call out tradeoffs.",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, mode } = (await request.json()) as {
          messages: UIMessage[];
          mode?: Mode;
        };
        const key = getLovableApiKey();
        if (!key) return new Response("Missing LOVABLE_API_KEY. Add it to .env.local for local dev.", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM[mode ?? "writer"],
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
