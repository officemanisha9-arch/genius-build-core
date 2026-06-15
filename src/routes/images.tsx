import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, ImageIcon, Loader2, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { imageStore, type ImageItem } from "@/lib/threads";
import { VoiceButton } from "@/components/VoiceButton";


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
    <div className="grain relative min-h-[calc(100vh-3rem)] overflow-hidden">
      <div className="aurora" aria-hidden />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="mb-8"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <ImageIcon className="h-3.5 w-3.5" /> Image Studio
          </div>
          <h1 className="text-display text-5xl font-semibold leading-[0.95] md:text-6xl">
            Describe it. <span className="italic shimmer-text">Make it.</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
          className="rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur"
        >
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
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-all hover:border-ember hover:text-ember hover:-translate-y-0.5"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <VoiceButton
                size="icon"
                onTranscript={(t) =>
                  setPrompt((prev) => (prev ? prev + " " + t : t))
                }
              />
              <Button
                onClick={() => generate()}
                disabled={loading || !prompt.trim()}
                className="group relative overflow-hidden"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Generating
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-4 w-4 transition-transform group-hover:rotate-12" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <h2 className="mt-14 mb-4 text-display text-xl font-semibold">Recent</h2>
        {items.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Your generations will appear here.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {loading && (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="relative overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="aspect-square w-full bg-gradient-to-br from-secondary via-muted to-secondary bg-[length:200%_100%] animate-[shimmer-line_2s_linear_infinite]" />
                  <div className="p-3 text-xs text-muted-foreground">Generating…</div>
                </motion.div>
              )}
              {items.map((i, idx) => (
                <motion.div
                  key={i.id}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, delay: idx * 0.03, ease: [0.2, 0.7, 0.2, 1] }}
                  whileHover={{ y: -4 }}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card hover-lift"
                >
                  <div className="overflow-hidden">
                    <img
                      src={i.url}
                      alt={i.prompt}
                      className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
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
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

