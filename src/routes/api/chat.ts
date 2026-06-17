import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createOpenAIProvider, generateOpenAIImage } from "@/lib/ai-gateway.server";
import { getOpenAIKey } from "@/lib/config.server";

type Mode = "writer" | "brainstorm" | "code";

const SYSTEM: Record<Mode, string> = {
  writer:
    "You are Atelier, an editorial writing partner. Help users draft, refine, and polish prose. Use markdown. If the user asks for an image (e.g. 'draw', 'generate an image', 'picture of', or types `/image <prompt>`), call the `generate_image` tool with a vivid prompt.",
  brainstorm:
    "You are Atelier in brainstorm mode. Generate surprising, useful ideas in punchy bulleted lists. If the user asks for an image or types `/image <prompt>`, call the `generate_image` tool.",
  code:
    "You are Atelier in code mode. Write production-quality code with concise explanations. ALWAYS wrap code in markdown fenced blocks with the correct language tag (```ts, ```python, etc). If the user asks for an image or types `/image <prompt>`, call the `generate_image` tool.",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, mode } = (await request.json()) as {
          messages: UIMessage[];
          mode?: Mode;
        };
        const key = getOpenAIKey();
        if (!key)
          return new Response(
            "Missing OPENAI_API_KEY. Add it via project secrets or .env.local.",
            { status: 500 },
          );

        const openai = createOpenAIProvider(key);
        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: SYSTEM[mode ?? "writer"],
          messages: await convertToModelMessages(messages),
          stopWhen: stepCountIs(5),
          tools: {
            generate_image: tool({
              description:
                "Generate an image from a text prompt. Use when the user asks for a picture, illustration, drawing, or types `/image <prompt>`.",
              inputSchema: z.object({
                prompt: z.string().describe("Vivid, descriptive image prompt"),
              }),
              execute: async ({ prompt }) => {
                try {
                  const url = await generateOpenAIImage(key, prompt);
                  return { url, prompt };
                } catch (e) {
                  return { error: e instanceof Error ? e.message : "Image generation failed" };
                }
              },
            }),
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
