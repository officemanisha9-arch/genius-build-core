import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, ImageIcon, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { imageStore, type ImageItem } from "@/lib/threads";

export const Route = createFileRoute("/images")({
  head: () => ({
    meta: [
      { title: "Image Studio — Atelier" },
      {
        name: "description",
        content: "Generate images with AI in Atelier's image studio.",
      },
    ],
  }),
  component: ImagesPage,
});

const SUGGESTIONS = [
  "A misty Kyoto alley at dawn, soft cinematic light",
  "Editorial flat-lay of vintage stationery on warm linen",
  "An astronaut sipping espresso on a lunar terrace",
  "Brutalist concrete bookstore interior, late afternoon",
];

function ImagesPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ImageItem[]>([]);

  useEffect(() => {
    setItems(imageStore.list());
  }, []);

  const generate = async (text?: string) => {
    const p = (text ?? prompt).trim();
    if (!p || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429) toast.error("Rate limited. Try again shortly.");
        else if (res.status === 402)
          toast.error("AI credits exhausted. Add credits in your workspace.");
        else toast.error(errText || "Generation failed.");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      const item: ImageItem = {
        id: crypto.randomUUID(),
        prompt: p,
        url,
        createdAt: Date.now(),
      };
      imageStore.add(item);
      setItems(imageStore.list());
      setPrompt("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const remove = (id: string) => {
    imageStore.remove(id);
    setItems(imageStore.list());
  };

  return (
    <div className="grain min-h-[calc(100vh-3rem)]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" /> Image Studio
            </div>
            <h1 className="text-display text-4xl font-semibold">
              Describe it. <span className="italic text-ember">Make it.</span>
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cinematic photograph of…"
            className="min-h-[110px] resize-none border-0 bg-transparent text-base focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                generate();
              }
            }}
          />
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-ember hover:text-ember"
                >
                  {s}
                </button>
              ))}
            </div>
            <Button onClick={() => generate()} disabled={loading || !prompt.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Generating
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-4 w-4" /> Generate
                </>
              )}
            </Button>
          </div>
        </div>

        <h2 className="mt-12 mb-4 text-display text-xl font-semibold">Recent</h2>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Your generations will appear here.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {items.map((i) => (
              <div
                key={i.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card"
              >
                <img
                  src={i.url}
                  alt={i.prompt}
                  className="aspect-square w-full object-cover"
                />
                <div className="p-3">
                  <p className="line-clamp-2 text-xs text-muted-foreground">{i.prompt}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <a
                      href={i.url}
                      download={`atelier-${i.id}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-ember hover:underline"
                    >
                      <Download className="h-3 w-3" /> Save
                    </a>
                    <button
                      onClick={() => remove(i.id)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                      aria-label="Delete image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
